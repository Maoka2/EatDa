import os
import sys
import json
import asyncio
from typing import List

# Ensure project root is on sys.path when running from subfolder
CLIENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(CLIENT_DIR)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from AI.clients.gms_api.luma_prompt_enhancer import enhance, EnhancerPolicy, Score
from dotenv import load_dotenv, find_dotenv


def llm_generate_fn(idea: str) -> str:
    from AI.clients.gms_api.gpt import generate_luma_prompt
    guide = (
        "Write a single 40–60 word natural English prompt that explicitly covers: "
        "Subject (who/what), Action (what happens), Detail (concrete visuals), "
        "Scene (place/time/ambience), and Style (aesthetic/camera/mood). "
        "Preserve any quoted text verbatim. Do not include technical parameters.\n\n"
        f"User idea: {idea}"
    )
    return asyncio.run(generate_luma_prompt(guide))


def _low_dimensions(score: Score) -> List[str]:
    dims: List[str] = []
    if score.subject < 4.0:
        dims.append("Subject")
    if score.action < 4.0:
        dims.append("Action")
    if score.detail < 4.0:
        dims.append("Detail")
    if score.scene < 4.0:
        dims.append("Scene")
    if score.style < 4.0:
        dims.append("Style")
    return dims


def llm_revise_fn(current_text: str, score: Score) -> str:
    from AI.clients.gms_api.gpt import generate_luma_prompt
    dims = ", ".join(_low_dimensions(score)) or "all dimensions"
    instruction = (
        "Revise the following prompt to better satisfy the checklist dimensions: "
        f"{dims}. Keep it as a single natural sentence/prose, 40–60 words. "
        "Preserve any quoted text verbatim. Do not add technical parameters (like model settings).\n\n"
        f"Current prompt:\n{current_text}"
    )
    return asyncio.run(generate_luma_prompt(instruction))


def llm_scorer_fn(text: str) -> Score:
    from AI.clients.gms_api.gpt import generate_luma_prompt
    instruction = (
        "You are a strict grader. Score the following prompt on five dimensions, integers 0-5: "
        "subject, action, detail, scene, style. Return ONLY a compact JSON object with these keys. "
        "No prose, no code fences.\n\n"
        f"Prompt:\n{text}"
    )
    raw = asyncio.run(generate_luma_prompt(instruction))
    try:
        start = raw.find("{")
        end = raw.rfind("}")
        obj = json.loads(raw[start:end+1])
        s = Score(
            float(obj.get("subject", 0)),
            float(obj.get("action", 0)),
            float(obj.get("detail", 0)),
            float(obj.get("scene", 0)),
            float(obj.get("style", 0)),
        )
        return s
    except Exception:
        return Score(0.0, 0.0, 0.0, 0.0, 0.0)


def main() -> None:
    env_path = find_dotenv(usecwd=True)
    if env_path:
        load_dotenv(env_path)

    idea = " ".join(sys.argv[1:]).strip() or os.getenv("TEST_IDEA", "street food at night in the rain, cozy neon glow")

    # Log path defaults to clients folder
    log_path = os.getenv("LUMA_LOG_PATH", os.path.join(CLIENT_DIR, "luma_prompt_logs.jsonl"))
    policy = EnhancerPolicy(log_path=log_path)

    no_llm = os.getenv("NO_LLM", "false").lower() == "true"

    if no_llm:
        result = enhance(idea=idea, policy=policy)
    else:
        if not os.environ.get("GMS_API_KEY"):
            print("[Error] GMS_API_KEY is not set. Put it in .env or export it before running.")
            sys.exit(1)
        result = enhance(
            idea=idea,
            generate_fn=llm_generate_fn,
            revise_fn=llm_revise_fn,
            policy=policy,
            llm_scorer_fn=llm_scorer_fn,
        )

    print("=== Final Prompt ===")
    print(result["prose"])  # type: ignore[index]
    print()
    print("=== Score (mean) ===", result.get("mean"))
    print("=== Scores ===", json.dumps(result.get("scores"), ensure_ascii=False))

    history = result.get("history", [])
    print("\n=== History (stage, mean) ===")
    for h in history:
        print(f"- {h.get('stage')}: {h.get('mean')}")


if __name__ == "__main__":
    main()


