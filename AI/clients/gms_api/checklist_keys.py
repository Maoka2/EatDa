from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import List, Dict, Any
import json
import os


@dataclass
class ChecklistKeys:
    subject: List[str]
    action: List[str]
    detail: List[str]
    scene: List[str]
    style: List[str]

    def to_json(self) -> str:
        return json.dumps(asdict(self), ensure_ascii=False, indent=2)

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "ChecklistKeys":
        return ChecklistKeys(
            subject=list(dict.fromkeys([s.strip().lower() for s in data.get("subject", [])])),
            action=list(dict.fromkeys([s.strip().lower() for s in data.get("action", [])])),
            detail=list(dict.fromkeys([s.strip().lower() for s in data.get("detail", [])])),
            scene=list(dict.fromkeys([s.strip().lower() for s in data.get("scene", [])])),
            style=list(dict.fromkeys([s.strip().lower() for s in data.get("style", [])])),
        )


DEFAULT_KEYS = ChecklistKeys(
    subject=[
        "man","woman","boy","girl","student","chef","couple","family","20s","30s","middle-aged",
        # food-related still counts as subject context for our purposes
        "ramen","gimbap","tteokbokki","sushi","coffee","bread","pastry","noodles","soup",
    ],
    action=[
        "eating","drinking","lifting","serving","sharing","cooking","slicing","stirring","walk","look",
    ],
    detail=[
        "steam","neon","reflection","menu","sign","close-up","texture","grain","color","tone","grading","contrast",
        "expression","smile","focused","concentrated",
    ],
    scene=[
        "market","cafe","restaurant","kitchen","street","alley","night","morning","sunset","rain",
        "indoor","outdoor","dawn","dusk","warm light","natural light",
    ],
    style=[
        "cinematic","documentary","vintage","editorial","film","soft light","hard light","neon","warm","cool",
        "dolly","pan","handheld","glide","balanced","natural","soft","hard",
    ],
)


def _default_dir() -> str:
    return os.path.dirname(os.path.abspath(__file__))


def load_keys(path: str | None) -> ChecklistKeys:
    resolved = path or os.path.join(_default_dir(), "luma_checklist_keys.json")
    if not os.path.exists(resolved):
        # Try migrating from legacy location (old behavior wrote to CWD)
        legacy = os.path.join(os.getcwd(), "luma_checklist_keys.json")
        try:
            if os.path.exists(legacy):
                with open(legacy, "r", encoding="utf-8") as f:
                    data = json.load(f)
                keys = ChecklistKeys.from_dict(data)
                save_keys(keys, resolved)
                return keys
        except Exception:
            pass
        save_keys(DEFAULT_KEYS, resolved)
        return DEFAULT_KEYS
    try:
        with open(resolved, "r", encoding="utf-8") as f:
            data = json.load(f)
        return ChecklistKeys.from_dict(data)
    except Exception:
        # Fallback to defaults if corrupted
        save_keys(DEFAULT_KEYS, resolved)
        return DEFAULT_KEYS


def save_keys(keys: ChecklistKeys, path: str | None) -> None:
    resolved = path or os.path.join(_default_dir(), "luma_checklist_keys.json")
    with open(resolved, "w", encoding="utf-8") as f:
        json.dump(asdict(keys), f, ensure_ascii=False, indent=2)


def add_keywords(keys: ChecklistKeys, updates: Dict[str, List[str]]) -> ChecklistKeys:
    # Deduplicate while preserving order
    for field in ("subject","action","detail","scene","style"):
        new_items = [s.strip().lower() for s in updates.get(field, []) if s and isinstance(s, str)]
        if not new_items:
            continue
        existing = getattr(keys, field)
        merged = existing + [w for w in new_items if w not in existing]
        setattr(keys, field, merged)
    return keys


