# -*- coding: utf-8 -*-
"""
Luma Dream Machine Prompt Enhancer
- Input: short user idea (any language)
- Output:
  (1) 40–60 word natural English prompt (single sentence/brief prose, no tech params)
  (2) small JSON controls (style_preset, duration, aspect_ratio, camera_motion, motion_intensity)
- Self-refine loop with checklist scoring; optional re-generate hook
- Persistent JSONL logging of scores/results
"""

from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional, Callable, Dict, Any, List, Tuple
import re, random, json, unicodedata
from datetime import datetime
import os

# ------------------ Policy ------------------

@dataclass
class EnhancerPolicy:
	min_words:int = 40
	max_words:int = 60
	target_words:int = 52
	threshold_mean: float = 4.3  # stop if >=
	max_loops:int = 3            # number of outer re-generation rounds
	log_path:str = "luma_prompt_logs.jsonl"

# ------------------ Controls Defaults ------------------

DEFAULT_CONTROLS = {
	"duration": 5.0,
	"aspect_ratio": "16:9",
	"motion_intensity": "medium",
}

# ------------------ Utility ------------------

EN_STOPWORDS = set("""a an the and or of for to in on with over under from into at by as
is are was were be being been this that these those very quite really just
""".split())

def normalize_space(s:str)->str:
	s = unicodedata.normalize("NFKC", s)
	s = re.sub(r"\s+", " ", s).strip()
	return s

def word_count_en(s:str)->int:
	words = re.findall(r"[A-Za-z0-9'’\-]+", s)
	return len(words)

def clamp_to_word_window(s:str, min_w:int, max_w:int)->str:
	tokens = re.findall(r"[A-Za-z0-9'’\-]+|[^\w\s]", s)
	# Collect tokens up to max_w words
	word_count = 0
	kept: List[str] = []
	for tok in tokens:
		if re.match(r"[A-Za-z0-9'’\-]+", tok):
			if word_count >= max_w:
				break
			word_count += 1
		kept.append(tok)
	# If too short, pad
	pad_phrases = [
		"in rich detail",
		"shot in natural light",
		"with gentle camera movement",
		"balanced color grading",
	]
	while word_count < min_w and pad_phrases:
		frag = pad_phrases.pop(0)
		frag_tokens = re.findall(r"[A-Za-z0-9'’\-]+|[^\w\s]", " " + frag)
		kept.extend(frag_tokens)
		word_count += word_count_en(frag)

	# Reconstruct with proper spacing between words and tight punctuation
	prose = ""
	prev_was_word = False
	for tok in kept:
		is_word = bool(re.match(r"[A-Za-z0-9'’\-]+", tok))
		if is_word:
			if prose and (prev_was_word or (prose and prose[-1] not in " (\n\t[")):
				prose += " "
			prose += tok
		else:
			prose += tok
		prev_was_word = is_word

	prose = re.sub(r"\s+([,.;:!?])", r"\1", prose)
	prose = re.sub(r"\(\s+", "(", prose)
	prose = normalize_space(prose)
	return prose

def sanitize_prose(s: str) -> str:
	# Remove fenced code blocks
	s = re.sub(r"```[\s\S]*?```", " ", s)
	# Remove trailing JSON blocks heuristically
	s = re.sub(r"\{[\s\S]*\}\s*$", " ", s)
	return normalize_space(s)

# ------------------ Few-shot micro-expander ------------------

SCENES = [
	("night street market", "neon signs reflected on wet pavement"),
	("small Korean snack bar", "handwritten menu boards and steel counters"),
	("cozy cafe", "warm wood, low lamps, rain on window"),
	("traditional market alley", "colorful awnings, steam from food stalls"),
	("riverside at sunset", "golden light, ripples and distant traffic")
]

STYLES = [
	("cinematic realism", "subtle film grain, balanced grading"),
	("documentary feel", "handheld texture, natural imperfections"),
	("editorial fashion", "clean composition, polished surfaces"),
	("vintage film", "soft halation, gentle contrast"),
]

CAM_MOVES = [
	"slow dolly-in",
	"gentle handheld sway",
	"steady gimbal pan left to right",
	"low glide forward at waist level"
]

# ------------------ Checklist Evaluator ------------------

@dataclass
class Score:
	subject: float
	action: float
	detail: float
	scene: float
	style: float
	def mean(self)->float:
		return (self.subject+self.action+self.detail+self.scene+self.style)/5.0

class Checklist:
	"""Binary rule-based scoring using externally managed keyword sets."""
	def __init__(self, keys_path: Optional[str] = None):
		from .checklist_keys import load_keys, ChecklistKeys
		self._keys_path = keys_path
		self._keys: ChecklistKeys = load_keys(keys_path)

	def reload(self) -> None:
		from .checklist_keys import load_keys
		self._keys = load_keys(self._keys_path)

	def add_keywords(self, updates: Dict[str, List[str]]) -> None:
		from .checklist_keys import add_keywords, save_keys
		self._keys = add_keywords(self._keys, updates)
		save_keys(self._keys, self._keys_path)

	def score_binary_with_hits(self, text: str) -> Tuple[Score, Dict[str, List[str]]]:
		t = text.lower()
		def hits(words: List[str]) -> List[str]:
			return [w for w in words if w in t]
		h_subject = hits(self._keys.subject)
		h_action = hits(self._keys.action)
		h_detail = hits(self._keys.detail)
		h_scene = hits(self._keys.scene)
		h_style = hits(self._keys.style)
		subj = 5.0 if h_subject else 0.0
		act = 5.0 if h_action else 0.0
		detail = 5.0 if h_detail else 0.0
		scene = 5.0 if h_scene else 0.0
		style = 5.0 if h_style else 0.0
		score = Score(subj, act, detail, scene, style)
		return score, {
			"subject": h_subject,
			"action": h_action,
			"detail": h_detail,
			"scene": h_scene,
			"style": h_style,
		}

	def score_binary(self, text: str) -> Score:
		score, _ = self.score_binary_with_hits(text)
		return score

# ------------------ Generator (rule-based, hookable) ------------------

class Generator:
	"""
	generate_fn(prompt:str)->str can be injected to use an external LLM.
	"""
	def __init__(self, generate_fn: Optional[Callable[[str], str]]=None):
		self.generate_fn = generate_fn

	def _heuristic_expand(self, idea:str)->str:
		# Preserve quoted or ALLCAPS tokens verbatim
		quoted = re.findall(r'"([^"]+)"', idea)
		base_subject = "a person in their 20s"  # sensible default
		scene, dressing = random.choice(SCENES)
		style, style_tags = random.choice(STYLES)
		cam = random.choice(CAM_MOVES)

		preserved = ""
		if quoted:
			preserved = ' "' + '" "'.join(quoted) + '" '
		elif idea:
			# Preserve raw user idea to reflect intent even when not quoted
			preserved = f' "{idea}" '

		return (
			f"{base_subject} at a {scene}, {dressing};"
			f"{preserved} shallow depth of field, {style}, {style_tags};"
			f" warm natural light, saturated yet balanced colors; camera begins a {cam},"
			f" subtle foreground movement and drifting steam that catches the neon glow."
		)

		# (40–60 words will be enforced later)

	def generate(self, idea:str)->str:
		idea = normalize_space(idea)
		if self.generate_fn:
			return self.generate_fn(idea)
		# Otherwise rule-based expansion
		if len(idea) < 1:
			idea = "street food at night"
		return self._heuristic_expand(idea)

# ------------------ Self-Refine Controller ------------------

class SelfRefine:
	def __init__(self, policy:EnhancerPolicy, generator:Generator):
		self.policy = policy
		self.generator = generator
		self.checklist = Checklist()

	def _enforce_word_window(self, text:str)->str:
		cleaned = sanitize_prose(text)
		return clamp_to_word_window(cleaned, self.policy.min_words, self.policy.max_words)

	def refine_once(self, text:str, score:Score)->str:
		# Address weak dimensions with targeted insertions while keeping natural flow
		t = text
		# action
		if score.action < 4.0 and "eating" not in t and "drinking" not in t:
			t = re.sub(r"at a ", "at a ", t) + " The subject lifts a bite with chopsticks, a precise, readable motion."
		# detail
		if score.detail < 4.0 and "steam" not in t:
			t += " Steam curls upward, readable and textured."
		# scene
		if score.scene < 4.0 and "indoor" not in t and "outdoor" not in t:
			t += " Outdoor ambience with distant crowd murmur."
		# style
		if score.style < 4.0 and "cinematic" not in t:
			t += " Cinematic realism with gentle film grain."
		return self._enforce_word_window(t)

	def run(
		self,
		idea:str,
		regenerate_cb: Optional[Callable[[str], str]] = None,
		revise_cb: Optional[Callable[[str, Score], str]] = None,
		llm_scorer_fn: Optional[Callable[[str], Score]] = None,
	)->Dict[str,Any]:
		"""
		Flow:
		1) Initial generation (LLM if provided via Generator.generate_fn)
		2) Combined scoring = average of (binary checklist score, optional LLM score)
		3) Up to max_loops rounds: scratch vs revise → pick better by combined mean
		4) If a dimension's combined score > binary-only score, add matched tokens to checklist keys for that dimension
		"""
		history: List[Dict[str,Any]] = []

		def combined_score(text: str) -> Tuple[Score, Score, Optional[Score]]:
			bin_score, hits = self.checklist.score_binary_with_hits(text)
			llm_score: Optional[Score] = llm_scorer_fn(text) if llm_scorer_fn else None
			if llm_score is None:
				return bin_score, bin_score, None
			# average per-dimension
			avg = Score(
				(subject := (bin_score.subject + llm_score.subject) / 2.0),
				(action := (bin_score.action + llm_score.action) / 2.0),
				(detail := (bin_score.detail + llm_score.detail) / 2.0),
				(scene := (bin_score.scene + llm_score.scene) / 2.0),
				(style := (bin_score.style + llm_score.style) / 2.0),
			)
			# If combined better than binary in a dimension, consider auto-augment
			improved: Dict[str, List[str]] = {}
			if avg.subject > bin_score.subject and hits["subject"]:
				improved["subject"] = hits["subject"]
			if avg.action > bin_score.action and hits["action"]:
				improved["action"] = hits["action"]
			if avg.detail > bin_score.detail and hits["detail"]:
				improved["detail"] = hits["detail"]
			if avg.scene > bin_score.scene and hits["scene"]:
				improved["scene"] = hits["scene"]
			if avg.style > bin_score.style and hits["style"]:
				improved["style"] = hits["style"]
			if improved:
				self.checklist.add_keywords(improved)
			return avg, bin_score, llm_score

		# 0) Initial draft
		draft = self.generator.generate(idea)
		draft = self._enforce_word_window(draft)
		combined, bin_only, llm_only = combined_score(draft)
		history.append({
			"stage": "draft",
			"text": draft,
			"score": asdict(combined),
			"mean": round(combined.mean(), 2),
			"score_binary": asdict(bin_only),
			"score_llm": asdict(llm_only) if llm_only else None,
		})

		# Early exit if already good enough
		if combined.mean() >= self.policy.threshold_mean:
			return {"prompt": draft, "score": combined, "history": history}

		current_text = draft
		current_score = combined

		# Outer rounds: generate two candidates (scratch vs. revise), pick the better
		for round_idx in range(1, self.policy.max_loops + 1):
			# A) From-scratch re-generation
			if regenerate_cb is not None:
				candidate_a = regenerate_cb(idea)
			else:
				candidate_a = self.generator.generate(idea)
			candidate_a = self._enforce_word_window(candidate_a)
			score_a, bin_a, llm_a = combined_score(candidate_a)
			history.append({
				"stage": f"regen_{round_idx}_scratch",
				"text": candidate_a,
				"score": asdict(score_a),
				"mean": round(score_a.mean(), 2),
				"score_binary": asdict(bin_a),
				"score_llm": asdict(llm_a) if llm_a else None,
			})

			# B) Revise current
			if revise_cb is not None:
				candidate_b = revise_cb(current_text, current_score)
			else:
				candidate_b = self.refine_once(current_text, current_score)
			candidate_b = self._enforce_word_window(candidate_b)
			score_b, bin_b, llm_b = combined_score(candidate_b)
			history.append({
				"stage": f"regen_{round_idx}_revise",
				"text": candidate_b,
				"score": asdict(score_b),
				"mean": round(score_b.mean(), 2),
				"score_binary": asdict(bin_b),
				"score_llm": asdict(llm_b) if llm_b else None,
			})

			# Choose the better of the two
			if score_a.mean() >= score_b.mean():
				chosen_text, chosen_score, chosen_kind = candidate_a, score_a, "scratch"
			else:
				chosen_text, chosen_score, chosen_kind = candidate_b, score_b, "revise"

			history.append({
				"stage": f"choice_{round_idx}_{chosen_kind}",
				"text": chosen_text,
				"score": asdict(chosen_score),
				"mean": round(chosen_score.mean(), 2),
			})

			# Early exit if threshold met
			if chosen_score.mean() >= self.policy.threshold_mean:
				return {"prompt": chosen_text, "score": chosen_score, "history": history}

			# Otherwise continue from the chosen for the next round
			current_text, current_score = chosen_text, chosen_score

		# After exhausting rounds, return the best of the last pair (already represented by current_text/score)
		return {"prompt": current_text, "score": current_score, "history": history}

# ------------------ Logger ------------------

class JSONLLogger:
	def __init__(self, path:str):
		self.path = path

	def append(self, record:Dict[str,Any])->None:
		rec = json.dumps(record, ensure_ascii=False)
		log_path = self.path
		# Resolve relative path to this module directory
		if not os.path.isabs(log_path):
			module_dir = os.path.dirname(os.path.abspath(__file__))
			log_path = os.path.join(module_dir, log_path)
		with open(log_path, "a", encoding="utf-8") as f:
			f.write(rec + "\n")

# ------------------ Public API ------------------

def enhance(idea:str,
			controls:Optional[Dict[str,Any]]=None,
			generate_fn: Optional[Callable[[str], str]]=None,
			policy: Optional[EnhancerPolicy]=None,
			revise_fn: Optional[Callable[[str, Score], str]]=None,
			llm_scorer_fn: Optional[Callable[[str], Score]] = None,
			)->Dict[str,Any]:
	"""
	Main entry.
	Returns dict: { prose, controls, scores, history, logged_path }
	
	Parameters:
	- idea: short user idea (any language)
	- controls: optional control overrides
	- generate_fn: optional LLM generator used for initial and from-scratch generations
	- policy: optional policy overrides
	- revise_fn: optional LLM revision function: (current_text:str, score:Score) -> str
	- llm_scorer_fn: optional LLM scoring function returning Score(0-5 per dimension)
	"""
	pol = policy or EnhancerPolicy()
	gen = Generator(generate_fn=generate_fn)
	refine = SelfRefine(pol, gen)
	log = JSONLLogger(pol.log_path)

	# 1) Run refine
	result = refine.run(idea, regenerate_cb=generate_fn, revise_cb=revise_fn, llm_scorer_fn=llm_scorer_fn)

	# 2) Controls (merge defaults, don't put tech params in prose)
	ctr = dict(DEFAULT_CONTROLS)
	if controls:
		ctr.update({k:v for k,v in controls.items() if v is not None})

	# 3) Build output payload
	out = {
		"prose": result["prompt"],
		"controls": ctr,
		"scores": asdict(result["score"]),
		"mean": round(result["score"].mean(),2),
		"history": result["history"],
		"timestamp": datetime.utcnow().isoformat()+"Z",
		"input": idea
	}

	# 4) Persist to JSONL
	log.append(out)
	out["logged_path"] = pol.log_path
	return out
