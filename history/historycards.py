# codex: 2026-01-20 为避免单条 JSON 解析失败导致全量任务中断，改为记录失败并继续；连续失败达阈值再停止
"""
Generate idiom cards metadata for `history/resources/manifest.json` using the project's LLM utilities.

Input:
  - Default idiom list: `history/resources/汉语成语词典_词表_23889条.txt`
    Each non-empty line is an idiom; lines starting with '#' or '####' are ignored.

Output (matches `history/resource.md` schema, with an extra `popular` field 1-10):
  - Per-card metadata: `history/resources/cards/<id>/data.json`
  - Manifest: `history/resources/manifest.json` (appends new cards; keeps existing)

Features:
  - Resume: `--progress-file` (default `.historycards_progress.json`) + skip existing `data.json`/manifest entries
  - Range: `--range 5-10` (1-based idiom index, after filtering header/blank lines)
  - Pacing: `--sleep-min/--sleep-max` random delay between LLM calls
  - Safe re-runs: already-generated idioms are skipped unless `--force`

Examples:
  - See all options:
      python history/historycards.py --help
  - Generate idioms 5-10 (inclusive), resumable:
      python history/historycards.py --range 5-10
  - Generate first 20 idioms with 2-5s random sleep between calls:
      python history/historycards.py --start 1 --limit 20 --sleep-min 2 --sleep-max 5
  - Resume from last run (uses progress file to pick up the next idiom index):
      python history/historycards.py --resume
  - Dry-run (show selected idioms only):
      python history/historycards.py --range 5-10 --dry-run

Notes:
  - LLM provider/model is configured via `utils/config.ini` (see `utils/llm_api.md`).
  - You can safely generate into another folder (e.g. `history/resources/data/`) using `--resources-dir`.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import logging
import os
import posixpath
import random
import re
import signal
import sys
import time
from dataclasses import dataclass
from dataclasses import field
from typing import Iterable, Optional, Tuple
from time import perf_counter

from pypinyin import lazy_pinyin

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))  # history/
_WORKSPACE_ROOT = os.path.dirname(_SCRIPT_DIR)  # fungame/
if _WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, _WORKSPACE_ROOT)

from utils.config import get_utils_config_path
from utils.llm_api import generate_llm_response_single, load_llm_config, setup_llm_client


logger = logging.getLogger("historycards")

_STOP_REQUESTED = False
_SIGINT_COUNT = 0


@dataclass(frozen=True)
class Paths:
    workspace_root: str
    history_root: str
    resources_dir: str
    cards_dir: str
    manifest_file: str


@dataclass
class _Agg:
    count: int = 0
    total_s: float = 0.0
    min_s: float = float("inf")
    max_s: float = 0.0

    def add(self, seconds: float) -> None:
        self.count += 1
        self.total_s += seconds
        if seconds < self.min_s:
            self.min_s = seconds
        if seconds > self.max_s:
            self.max_s = seconds

    def to_dict(self) -> dict:
        avg = self.total_s / self.count if self.count else 0.0
        return {
            "count": self.count,
            "total_s": round(self.total_s, 6),
            "avg_s": round(avg, 6),
            "min_s": round(self.min_s, 6) if self.count else 0.0,
            "max_s": round(self.max_s, 6) if self.count else 0.0,
        }


@dataclass
class _RunStats:
    run_id: str
    started_at: str
    llm_source: str
    models: list[str]
    args: dict
    wall_clock_start: float
    processed: int = 0
    skipped: int = 0
    failed: int = 0
    total_idioms_selected: int = 0
    total_attempts: int = 0
    total_retries: int = 0
    interrupted: bool = False
    llm_calls: _Agg = field(default_factory=_Agg)
    per_model: dict = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.per_model is None:  # pragma: no cover
            self.per_model = {}

    def record_model_attempt(self, model: str, seconds: float, ok: bool) -> None:
        self.total_attempts += 1
        self.llm_calls.add(seconds)
        slot = self.per_model.setdefault(
            model,
            {"attempts": 0, "successes": 0, "failures": 0, "timing": _Agg()},
        )
        slot["attempts"] += 1
        if ok:
            slot["successes"] += 1
        else:
            slot["failures"] += 1
        slot["timing"].add(seconds)

    def to_dict(self) -> dict:
        ended_at = _dt.datetime.now().isoformat(timespec="seconds")
        wall_s = perf_counter() - self.wall_clock_start
        per_model_out = {}
        for k, v in self.per_model.items():
            per_model_out[k] = {
                "attempts": v["attempts"],
                "successes": v["successes"],
                "failures": v["failures"],
                "timing": v["timing"].to_dict(),
            }
        return {
            "run_id": self.run_id,
            "started_at": self.started_at,
            "ended_at": ended_at,
            "wall_time_s": round(wall_s, 6),
            "llm_source": self.llm_source,
            "models": self.models,
            "args": self.args,
            "selected": self.total_idioms_selected,
            "processed": self.processed,
            "skipped": self.skipped,
            "failed": self.failed,
            "interrupted": self.interrupted,
            "attempts": self.total_attempts,
            "retries": self.total_retries,
            "llm_call_timing": self.llm_calls.to_dict(),
            "per_model": per_model_out,
        }


def _setup_logging(verbose: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

def _install_sigint_handler() -> None:
    """
    First Ctrl+C: request graceful stop (finish current request, then exit).
    Second Ctrl+C: force KeyboardInterrupt.
    """
    def handler(sig, frame):  # noqa: ARG001
        global _STOP_REQUESTED, _SIGINT_COUNT
        _SIGINT_COUNT += 1
        if _SIGINT_COUNT == 1:
            _STOP_REQUESTED = True
            try:
                logger.warning("Ctrl+C received: will stop after current LLM call finishes. Press Ctrl+C again to force.")
            except Exception:
                pass
            return
        signal.default_int_handler(sig, frame)

    signal.signal(signal.SIGINT, handler)


def _resolve_paths() -> Paths:
    script_dir = os.path.dirname(os.path.abspath(__file__))  # history/
    history_root = script_dir
    workspace_root = os.path.dirname(history_root)
    resources_dir = os.path.join(history_root, "resources")
    cards_dir = os.path.join(resources_dir, "cards")
    manifest_file = os.path.join(resources_dir, "manifest.json")
    os.makedirs(cards_dir, exist_ok=True)
    return Paths(
        workspace_root=workspace_root,
        history_root=history_root,
        resources_dir=resources_dir,
        cards_dir=cards_dir,
        manifest_file=manifest_file,
    )


def _iter_idioms(path: str) -> Iterable[str]:
    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line:
                continue
            if line.startswith("#") or line.startswith("####"):
                continue
            yield line


def _parse_range(range_text: str) -> Tuple[int, int]:
    m = re.fullmatch(r"\s*(\d+)\s*-\s*(\d+)\s*", range_text)
    if not m:
        raise ValueError(f"Invalid --range '{range_text}', expected like '5-10'.")
    start = int(m.group(1))
    end = int(m.group(2))
    if start < 1 or end < 1:
        raise ValueError("--range values must be >= 1.")
    if end < start:
        raise ValueError("--range end must be >= start.")
    return start, end


def _slugify_id(text: str) -> str:
    base = "".join(lazy_pinyin(text))
    base = base.lower()
    base = re.sub(r"[^a-z0-9_]+", "", base)
    base = base.strip("_")
    if base:
        return base
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]
    return f"id_{digest}"


def _load_json(path: str) -> Optional[dict]:
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _atomic_write_json(path: str, data: dict) -> None:
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def _load_manifest(manifest_path: str) -> dict:
    manifest = _load_json(manifest_path) or {"cards": []}
    if "cards" not in manifest or not isinstance(manifest["cards"], list):
        raise ValueError(f"Invalid manifest format: {manifest_path}")
    return manifest


def _clean_llm_json(text: str) -> str:
    s = text.strip()
    if "```" in s:
        parts = re.split(r"```(?:json)?\s*", s, flags=re.IGNORECASE)
        if len(parts) >= 2:
            s = parts[1]
            s = s.split("```", 1)[0].strip()
    if s.startswith("{") and s.endswith("}"):
        return s
    left = s.find("{")
    right = s.rfind("}")
    if left != -1 and right != -1 and right > left:
        return s[left : right + 1]
    return s


def _build_prompt(idiom: str, card_id: str) -> str:
    return f"""
You are a historian and art director for a Chinese idiom time-line card game.

For the idiom "{idiom}", output ONLY valid JSON with these fields:
- "id": "{card_id}"
- "name": "{idiom}"
- "period": 使用中文 Chinese period label, dynasty (short, e.g. "战国" or "Warring States Period")
- "year_estimate": integer year estimate (BC as negative, AD as positive)
- "popular": integer 1-10 (10 = very common in modern Chinese; 1 = rare)
- "meaning": 使用中文：Chinese meaning/explanation (1-2 sentences)
- "story": 使用中文：Chinese historical allusion/background, best from literary quotation like <shiji>,choose the oldest (about 80-150 Chinese characters)
- "prompt": image prompt. Start with:   "A trading card design with a heavy historical feel, ancient Chinese art style, realistic texture, ..." 后面可以用中文或者英语 表达清晰场景描述，包含人物、服饰、场景、色调等细节。Focus on vivid and detailed descriptions of characters, attire, settings, and color tones.

Rules:
- Keep it factual; if origin is uncertain, choose the most likely period and make the story conservative.
- Do not include markdown fences.
""".strip()


def _normalize_card(data: dict, idiom: str, card_id: str, image_path: str) -> dict:
    required = ["period", "year_estimate", "meaning", "story", "prompt", "popular"]
    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"Missing fields: {missing}")

    normalized = dict(data)
    normalized["id"] = card_id
    normalized["name"] = idiom
    normalized["image_path"] = image_path.replace("\\", "/")

    try:
        normalized["year_estimate"] = int(normalized["year_estimate"])
    except Exception as e:
        raise ValueError(f"Invalid year_estimate: {normalized.get('year_estimate')}") from e

    try:
        normalized["popular"] = int(normalized["popular"])
    except Exception as e:
        raise ValueError(f"Invalid popular: {normalized.get('popular')}") from e

    if normalized["popular"] < 1:
        normalized["popular"] = 1
    if normalized["popular"] > 10:
        normalized["popular"] = 10

    for key in ["period", "meaning", "story", "prompt"]:
        if not isinstance(normalized.get(key), str) or not normalized[key].strip():
            raise ValueError(f"Invalid {key}: {normalized.get(key)!r}")
        normalized[key] = normalized[key].strip()

    return normalized


def _append_to_manifest(manifest: dict, card: dict) -> bool:
    existing_ids = {c.get("id") for c in manifest.get("cards", []) if isinstance(c, dict)}
    existing_names = {c.get("name") for c in manifest.get("cards", []) if isinstance(c, dict)}
    if card["id"] in existing_ids or card["name"] in existing_names:
        return False
    manifest["cards"].append(card)
    manifest["updated_at"] = _dt.date.today().isoformat()
    if "version" not in manifest:
        manifest["version"] = "1.0"
    return True


def _format_vars(card_id: str) -> dict:
    shard1 = card_id[:1] if card_id else "x"
    shard2 = card_id[:2] if len(card_id) >= 2 else (card_id or "x")
    return {"id": card_id, "shard1": shard1, "shard2": shard2}


def _safe_relpath_fs(relpath: str) -> str:
    relpath = relpath.strip().replace("/", os.sep).replace("\\", os.sep)
    if not relpath:
        raise ValueError("Empty relative path.")
    if os.path.isabs(relpath):
        raise ValueError(f"Absolute path not allowed: {relpath}")
    norm = os.path.normpath(relpath)
    if norm == ".." or norm.startswith(".." + os.sep):
        raise ValueError(f"Path traversal not allowed: {relpath}")
    return norm


def _safe_relpath_url(relpath: str) -> str:
    relpath = relpath.strip().replace("\\", "/")
    if not relpath:
        raise ValueError("Empty relative path.")
    if relpath.startswith("/"):
        raise ValueError(f"Absolute path not allowed: {relpath}")
    norm = posixpath.normpath(relpath)
    if norm == ".." or norm.startswith("../"):
        raise ValueError(f"Path traversal not allowed: {relpath}")
    return norm


def _choose_card_id(idiom: str, base_id: str, manifest: dict, data_file_for_id) -> str:
    """
    Prefer pinyin id, but avoid collisions (same id for different idioms).
    If collision is detected, suffix a deterministic short hash.
    """
    manifest_id_to_name = {}
    for c in manifest.get("cards", []):
        if isinstance(c, dict) and isinstance(c.get("id"), str) and isinstance(c.get("name"), str):
            manifest_id_to_name[c["id"]] = c["name"]

    def _id_matches_existing_name(card_id: str) -> bool:
        existing_name = manifest_id_to_name.get(card_id)
        if existing_name is not None and existing_name != idiom:
            return False

        data_file = data_file_for_id(card_id)
        if os.path.exists(data_file):
            try:
                existing = _load_json(data_file) or {}
                if isinstance(existing, dict) and existing.get("name") and existing.get("name") != idiom:
                    return False
            except Exception:
                return False

        return True

    if _id_matches_existing_name(base_id):
        return base_id

    suffix = hashlib.sha1(idiom.encode("utf-8")).hexdigest()[:6]
    candidate = f"{base_id}_{suffix}"
    return candidate if _id_matches_existing_name(candidate) else f"id_{suffix}"


def _save_progress(progress_file: str, payload: dict) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(progress_file)), exist_ok=True)
    _atomic_write_json(progress_file, payload)


def main(argv: Optional[list[str]] = None) -> int:
    base_paths = _resolve_paths()
    default_progress_file = os.path.join(base_paths.history_root, ".historycards_progress.json")

    parser = argparse.ArgumentParser(description="Generate history idiom cards via LLM.")
    parser.add_argument(
        "--input",
        default=os.path.join(base_paths.resources_dir, "汉语成语词典_词表_23889条.txt"),
        help="Idiom list file (UTF-8).",
    )
    parser.add_argument(
        "--resources-dir",
        default=base_paths.resources_dir,
        help="Output resources dir (contains manifest.json and cards/). Example: history/resources/data",
    )
    parser.add_argument("--start", type=int, default=None, help="1-based idiom start index (after filtering).")
    parser.add_argument("--end", type=int, default=None, help="1-based idiom end index (inclusive).")
    parser.add_argument("--limit", type=int, default=None, help="Max idioms to process from start.")
    parser.add_argument("--range", dest="range_text", default=None, help="Shorthand range like 5-10 (inclusive).")
    parser.add_argument(
        "--progress-file",
        default=default_progress_file,
        help="JSON progress file for resumable runs.",
    )
    parser.add_argument("--resume", action="store_true", help="Resume from progress file (if present).")
    parser.add_argument("--force", action="store_true", help="Regenerate even if existing data.json/manifest entry exists.")
    parser.add_argument("--dry-run", action="store_true", help="Print selected idioms and exit.")
    failure_mode = parser.add_mutually_exclusive_group()
    failure_mode.add_argument(
        "--continue-on-failure",
        dest="continue_on_failure",
        action="store_true",
        help="失败后继续处理后续条目（默认）。",
    )
    failure_mode.add_argument(
        "--stop-on-failure",
        dest="continue_on_failure",
        action="store_false",
        help="遇到任意失败立刻停止（便于 --resume 回到失败条目重试）。",
    )
    parser.set_defaults(continue_on_failure=True)
    parser.add_argument(
        "--max-consecutive-failures",
        type=int,
        default=10,
        help="连续失败达到 N 时停止；设置为 0 表示永不因连续失败停止（默认：10）。",
    )
    parser.add_argument(
        "--errors-file",
        default=None,
        help="失败条目汇总 JSONL 文件路径；默认：<resources-dir>/cards/_errors.jsonl",
    )
    parser.add_argument("--sleep-min", type=float, default=0.0, help="Min seconds to sleep between LLM calls.")
    parser.add_argument("--sleep-max", type=float, default=0.0, help="Max seconds to sleep between LLM calls.")
    parser.add_argument("--max-retries", type=int, default=3, help="Max retries per idiom on LLM/parse failure.")
    parser.add_argument(
        "--retry-backoff",
        choices=["linear", "exponential"],
        default="linear",
        help="Retry wait strategy when a request fails (default: linear).",
    )
    parser.add_argument(
        "--retry-wait-base",
        type=float,
        default=1.5,
        help="Base seconds for retry waits (linear: base*attempt, exponential: base*2^(attempt-1)).",
    )
    parser.add_argument(
        "--retry-wait-max",
        type=float,
        default=10.0,
        help="Max seconds to wait between retries (default: 10).",
    )
    parser.add_argument(
        "--retry-jitter",
        type=float,
        default=0.0,
        help="Add 0..jitter seconds random jitter to retry waits (default: 0).",
    )
    parser.add_argument(
        "--image-path-template",
        default="cards/{id}/image.png",
        help="Relative image path template stored in card JSON (default: cards/{id}/image.png).",
    )
    parser.add_argument(
        "--card-rel-dir-template",
        default="cards/{id}",
        help="Relative dir (under --resources-dir) for per-card files. "
        "Example sharding: cards/{shard2}/{id} (default: cards/{id}).",
    )
    parser.add_argument(
        "--manifest-write-every",
        type=int,
        default=1,
        help="Write manifest.json every N newly-added cards. "
        "Use 0 to write only once at the end (faster for huge manifests). Default: 1.",
    )
    parser.add_argument(
        "--config",
        default=get_utils_config_path("config.ini"),
        help="LLM config.ini path (default: utils/config.ini).",
    )
    parser.add_argument(
        "--llmsource",
        default=None,
        help="Override [llmsources].llmsource (e.g. zhipuai, deepseek, openai, openrouter, geminiweb).",
    )
    parser.add_argument(
        "--models",
        default=None,
        help="Override model list (comma-separated). If set, ignores models from config.",
    )
    parser.add_argument(
        "--max-models",
        type=int,
        default=3,
        help="Limit number of fallback models to try (default: 3).",
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose logging.")
    parser.add_argument(
        "--runlog-file",
        default=None,
        help="Append JSONL run log (one line per idiom). Default: <resources-dir>/historycards_runlog.jsonl",
    )
    parser.add_argument(
        "--summary-file",
        default=None,
        help="Write JSON summary at end. Default: <resources-dir>/historycards_summary.json",
    )
    args = parser.parse_args(argv)

    _setup_logging(args.verbose)
    _install_sigint_handler()

    resources_dir = os.path.abspath(args.resources_dir)
    cards_dir = os.path.join(resources_dir, "cards")
    manifest_file = os.path.join(resources_dir, "manifest.json")
    os.makedirs(cards_dir, exist_ok=True)
    paths = Paths(
        workspace_root=base_paths.workspace_root,
        history_root=base_paths.history_root,
        resources_dir=resources_dir,
        cards_dir=cards_dir,
        manifest_file=manifest_file,
    )

    if args.progress_file == default_progress_file and os.path.abspath(args.resources_dir) != os.path.abspath(base_paths.resources_dir):
        args.progress_file = os.path.join(resources_dir, ".historycards_progress.json")
    if args.runlog_file is None:
        args.runlog_file = os.path.join(resources_dir, "historycards_runlog.jsonl")
    if args.summary_file is None:
        args.summary_file = os.path.join(resources_dir, "historycards_summary.json")
    if args.errors_file is None:
        args.errors_file = os.path.join(resources_dir, "cards", "_errors.jsonl")

    if args.sleep_min < 0 or args.sleep_max < 0:
        raise ValueError("--sleep-min/--sleep-max must be >= 0.")
    if args.sleep_max and args.sleep_max < args.sleep_min:
        raise ValueError("--sleep-max must be >= --sleep-min.")
    if args.retry_wait_base < 0 or args.retry_wait_max < 0 or args.retry_jitter < 0:
        raise ValueError("--retry-wait-base/--retry-wait-max/--retry-jitter must be >= 0.")
    if args.manifest_write_every < 0:
        raise ValueError("--manifest-write-every must be >= 0.")
    if args.max_consecutive_failures < 0:
        raise ValueError("--max-consecutive-failures must be >= 0.")

    if args.range_text:
        args.start, args.end = _parse_range(args.range_text)

    progress = _load_json(args.progress_file) if args.resume else None
    if progress and isinstance(progress, dict):
        resume_next = int(progress.get("next_index", 1))
        if args.start is None:
            args.start = resume_next
        logger.info(f"Resume enabled: progress next_index={resume_next}, using start={args.start}")

    if args.start is None:
        args.start = 1

    if args.end is not None and args.end < args.start:
        raise ValueError("--end must be >= --start.")
    if args.limit is not None and args.limit < 1:
        raise ValueError("--limit must be >= 1.")

    if not os.path.exists(args.input):
        raise FileNotFoundError(f"Input file not found: {args.input}")

    selected: list[tuple[int, str]] = []
    for i, idiom in enumerate(_iter_idioms(args.input), start=1):
        if i < args.start:
            continue
        if args.end is not None and i > args.end:
            break
        selected.append((i, idiom))
        if args.limit is not None and len(selected) >= args.limit:
            break

    if not selected:
        logger.info("No idioms selected (check --start/--end/--range/--limit).")
        return 0

    if args.dry_run:
        for i, idiom in selected:
            print(f"{i}: {idiom}")
        return 0

    manifest = _load_manifest(paths.manifest_file)
    existing_names = {c.get("name") for c in manifest["cards"] if isinstance(c, dict)}
    existing_ids = {c.get("id") for c in manifest["cards"] if isinstance(c, dict)}

    logger.info(f"Loading LLM config: {args.config}")
    llm_config = load_llm_config(args.config)
    if args.llmsource:
        if not llm_config.has_section("llmsources"):
            llm_config.add_section("llmsources")
        llm_config.set("llmsources", "llmsource", args.llmsource)
    client, llm_source, models = setup_llm_client(llm_config, logger)
    if args.models:
        models = [m.strip() for m in args.models.split(",") if m.strip()]
    if args.max_models is not None:
        if args.max_models < 1:
            raise ValueError("--max-models must be >= 1.")
        models = models[: args.max_models]
    logger.info(f"LLM ready: source='{llm_source}', models={models}")

    processed = 0
    skipped = 0
    failed = 0
    added_since_flush = 0

    run_id = _dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    stats = _RunStats(
        run_id=run_id,
        started_at=_dt.datetime.now().isoformat(timespec="seconds"),
        llm_source=llm_source,
        models=models,
        args={
            "input": args.input,
            "resources_dir": paths.resources_dir,
            "range": args.range_text,
            "start": args.start,
            "end": args.end,
            "limit": args.limit,
            "resume": bool(args.resume),
            "force": bool(args.force),
            "continue_on_failure": bool(args.continue_on_failure),
            "max_consecutive_failures": int(args.max_consecutive_failures),
            "errors_file": args.errors_file,
            "sleep_min": args.sleep_min,
            "sleep_max": args.sleep_max,
            "max_retries": args.max_retries,
            "retry_backoff": args.retry_backoff,
            "retry_wait_base": args.retry_wait_base,
            "retry_wait_max": args.retry_wait_max,
            "retry_jitter": args.retry_jitter,
            "card_rel_dir_template": args.card_rel_dir_template,
            "image_path_template": args.image_path_template,
            "manifest_write_every": args.manifest_write_every,
        },
        wall_clock_start=perf_counter(),
    )
    stats.total_idioms_selected = len(selected)

    def _append_jsonl(path: str, obj: dict) -> None:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")

    def _write_summary() -> None:
        try:
            _atomic_write_json(args.summary_file, stats.to_dict())
        except Exception as e:
            logger.warning(f"Failed to write summary file: {args.summary_file}: {e}")

    def data_file_for_id(card_id: str) -> str:
        rel_dir = _safe_relpath_fs(args.card_rel_dir_template.format(**_format_vars(card_id)))
        return os.path.join(paths.resources_dir, rel_dir, "data.json")

    consecutive_failure_count = 0  # 连续失败计数：用于“连续 N 个失败才停止”。成功会清零。

    for idx, idiom in selected:
        if _STOP_REQUESTED:
            logger.warning("Stop requested: exiting before starting next idiom.")
            break

        idiom_started = perf_counter()
        base_id = _slugify_id(idiom)
        card_id = _choose_card_id(idiom, base_id, manifest, data_file_for_id)
        rel_vars = _format_vars(card_id)
        card_rel_dir_fs = _safe_relpath_fs(args.card_rel_dir_template.format(**rel_vars))
        card_dir = os.path.join(paths.resources_dir, card_rel_dir_fs)
        data_file = os.path.join(card_dir, "data.json")
        image_path = _safe_relpath_url(args.image_path_template.format(**rel_vars))

        already_manifest = idiom in existing_names
        already_file = os.path.exists(data_file)
        if (already_manifest or already_file) and not args.force:
            logger.info(f"Skip {idx}: {idiom} (exists)")
            skipped += 1
            stats.skipped += 1
            _save_progress(args.progress_file, {"next_index": idx + 1, "last_idiom": idiom, "last_status": "skipped"})
            try:
                _append_jsonl(
                    args.runlog_file,
                    {
                        "ts": _dt.datetime.now().isoformat(timespec="seconds"),
                        "idx": idx,
                        "idiom": idiom,
                        "id": card_id,
                        "status": "skipped",
                        "wall_s": round(perf_counter() - idiom_started, 6),
                    },
                )
            except Exception:
                pass
            continue

        os.makedirs(card_dir, exist_ok=True)

        last_error: Optional[Exception] = None
        used_model: Optional[str] = None
        last_response_text: Optional[str] = None  # 最近一次模型原始输出：失败时写入文件便于统一修复。
        last_cleaned_json: Optional[str] = None  # 最近一次清洗后的 JSON 文本：失败时写入文件便于定位解析问题。
        for attempt in range(1, args.max_retries + 1):
            if _STOP_REQUESTED and attempt > 1:
                logger.warning("Stop requested: skipping further retries for current idiom.")
                break
            try:
                prompt = _build_prompt(idiom, card_id)
                response_text = None
                used_model = None
                model_errors = []
                for model_name in models:
                    t0 = perf_counter()
                    ok = False
                    try:
                        response_text = generate_llm_response_single(client, llm_source, prompt, model_name, logger)
                        ok = True
                        used_model = model_name
                        break
                    except Exception as me:
                        model_errors.append(str(me))
                        raise_last = me
                    finally:
                        dt = perf_counter() - t0
                        stats.record_model_attempt(model_name, dt, ok)
                if response_text is None:
                    raise Exception(f"All models failed: {model_errors}") from raise_last

                cleaned = _clean_llm_json(response_text)
                last_response_text = response_text
                last_cleaned_json = cleaned
                data = json.loads(cleaned)
                if not isinstance(data, dict):
                    raise ValueError("LLM output JSON is not an object.")
                card = _normalize_card(data, idiom=idiom, card_id=card_id, image_path=image_path)

                _atomic_write_json(data_file, card)

                if card_id not in existing_ids and idiom not in existing_names and _append_to_manifest(manifest, card):
                    existing_names.add(idiom)
                    existing_ids.add(card_id)
                    added_since_flush += 1
                    if args.manifest_write_every > 0 and added_since_flush >= args.manifest_write_every:
                        _atomic_write_json(paths.manifest_file, manifest)
                        added_since_flush = 0

                _save_progress(
                    args.progress_file,
                    {"next_index": idx + 1, "last_idiom": idiom, "last_status": "ok", "last_id": card_id},
                )

                processed += 1
                stats.processed += 1
                logger.info(f"OK {idx}: {idiom} -> {data_file}")
                last_error = None
                try:
                    _append_jsonl(
                        args.runlog_file,
                        {
                            "ts": _dt.datetime.now().isoformat(timespec="seconds"),
                            "idx": idx,
                            "idiom": idiom,
                            "id": card_id,
                            "status": "ok",
                            "model": used_model,
                            "wall_s": round(perf_counter() - idiom_started, 6),
                        },
                    )
                except Exception:
                    pass
                break
            except Exception as e:
                last_error = e
                logger.warning(f"Attempt {attempt}/{args.max_retries} failed for {idx}:{idiom}: {e}")
                if _STOP_REQUESTED:
                    logger.warning("Stop requested: will exit after current attempt.")
                    break
                if attempt < args.max_retries:
                    stats.total_retries += 1
                    if args.retry_backoff == "exponential":
                        wait = args.retry_wait_base * (2 ** (attempt - 1))
                    else:
                        wait = args.retry_wait_base * attempt
                    wait = min(args.retry_wait_max, wait)
                    if args.retry_jitter:
                        wait += random.uniform(0.0, args.retry_jitter)
                    if wait > 0:
                        time.sleep(wait)

        if last_error is not None:
            if _STOP_REQUESTED:
                _save_progress(
                    args.progress_file,
                    {"next_index": idx, "last_idiom": idiom, "last_status": "interrupted"},
                )
                stats.interrupted = True
                logger.warning("Stopped by user.")
                _write_summary()
                break
            failed += 1
            stats.failed += 1
            consecutive_failure_count += 1
            err_file = os.path.join(card_dir, "error.txt")
            err_response_file = os.path.join(card_dir, "error_response.txt")
            err_cleaned_file = os.path.join(card_dir, "error_cleaned.json")
            try:
                with open(err_file, "w", encoding="utf-8") as f:
                    f.write(f"{type(last_error).__name__}: {last_error}\n")
                    f.write(f"idx={idx}\n")
                    f.write(f"idiom={idiom}\n")
                    f.write(f"id={card_id}\n")
                    if used_model:
                        f.write(f"model={used_model}\n")
                    f.write(f"max_retries={args.max_retries}\n")
                    f.write(f"consecutive_failure_count={consecutive_failure_count}\n")
                if last_response_text:
                    with open(err_response_file, "w", encoding="utf-8") as f:
                        f.write(last_response_text)
                if last_cleaned_json:
                    with open(err_cleaned_file, "w", encoding="utf-8") as f:
                        f.write(last_cleaned_json)
                logger.error(f"FAIL {idx}: {idiom} (wrote {err_file})")
            except Exception:
                logger.error(f"FAIL {idx}: {idiom} (and failed to write error.txt)")
            if args.continue_on_failure:
                _save_progress(
                    args.progress_file,
                    {"next_index": idx + 1, "last_idiom": idiom, "last_status": "failed"},
                )
            else:
                _save_progress(
                    args.progress_file,
                    {"next_index": idx, "last_idiom": idiom, "last_status": "failed"},
                )
            try:
                _append_jsonl(
                    args.runlog_file,
                    {
                        "ts": _dt.datetime.now().isoformat(timespec="seconds"),
                        "idx": idx,
                        "idiom": idiom,
                        "id": card_id,
                        "status": "failed",
                        "model": used_model,
                        "error": f"{type(last_error).__name__}: {last_error}",
                        "wall_s": round(perf_counter() - idiom_started, 6),
                    },
                )
            except Exception:
                pass
            try:
                _append_jsonl(
                    args.errors_file,
                    {
                        "ts": _dt.datetime.now().isoformat(timespec="seconds"),
                        "idx": idx,
                        "idiom": idiom,
                        "id": card_id,
                        "model": used_model,
                        "error": f"{type(last_error).__name__}: {last_error}",
                        "error_file": err_file,
                        "response_file": err_response_file if last_response_text else None,
                        "cleaned_file": err_cleaned_file if last_cleaned_json else None,
                        "consecutive_failure_count": consecutive_failure_count,
                    },
                )
            except Exception:
                pass

            if not args.continue_on_failure:
                logger.error("Stopping on failure (use --continue-on-failure, or remove --stop-on-failure).")
                break
            if args.max_consecutive_failures and consecutive_failure_count >= args.max_consecutive_failures:
                logger.error(
                    "Stopping after %s consecutive failures (use --max-consecutive-failures to change; 0 disables).",
                    consecutive_failure_count,
                )
                break
            continue

        consecutive_failure_count = 0

        if args.sleep_max > 0:
            delay = random.uniform(args.sleep_min, args.sleep_max)
            if delay > 0:
                logger.debug(f"Sleep {delay:.2f}s")
                time.sleep(delay)

        if _STOP_REQUESTED:
            logger.warning("Stop requested: exiting after finishing current idiom.")
            break

    if added_since_flush > 0:
        _atomic_write_json(paths.manifest_file, manifest)

    _write_summary()
    summary = stats.to_dict()
    logger.info(
        "Stats: wall_time_s=%s, selected=%s, processed=%s, skipped=%s, failed=%s, attempts=%s, avg_llm_call_s=%s",
        summary["wall_time_s"],
        summary["selected"],
        summary["processed"],
        summary["skipped"],
        summary["failed"],
        summary["attempts"],
        summary["llm_call_timing"]["avg_s"],
    )

    logger.info(f"Done. processed={processed}, skipped={skipped}, failed={failed}")
    if _STOP_REQUESTED:
        return 0
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
