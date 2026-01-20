# codex: 2026-01-20 单测覆盖：失败记录后继续、连续失败阈值停止、失败后成功会清零连续计数

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys


def _load_historycards_module():
    repo_root = Path(__file__).resolve().parents[1]
    module_path = repo_root / "history" / "historycards.py"
    module_name = "historycards_for_tests"
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            out.append(json.loads(line))
    return out


def _install_llm_fakes(monkeypatch, module, *, generate_impl):
    monkeypatch.setattr(module, "_install_sigint_handler", lambda: None)
    monkeypatch.setattr(module, "load_llm_config", lambda _path: object())
    monkeypatch.setattr(module, "setup_llm_client", lambda _cfg, _logger: (object(), "dummy", ["model-x"]))
    monkeypatch.setattr(module, "generate_llm_response_single", generate_impl)


def test_continue_writes_errors_jsonl_and_processes_next(tmp_path, monkeypatch):
    module = _load_historycards_module()

    input_file = tmp_path / "idioms.txt"
    input_file.write_text("白首不渝\n后生可畏\n", encoding="utf-8")
    resources_dir = tmp_path / "resources"

    call_count = {"n": 0}

    def fake_generate(_client, _llm_source, _prompt, _model_name, _logger):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return (
                '{\n'
                '  "period": "战国"\n'
                '  "year_estimate": -300,\n'
                '  "meaning": "含义",\n'
                '  "story": "故事",\n'
                '  "prompt": "画面",\n'
                '  "popular": 5\n'
                "}\n"
            )
        return (
            '{"period":"战国","year_estimate":-300,"meaning":"含义","story":"故事","prompt":"画面","popular":5}'
        )

    _install_llm_fakes(monkeypatch, module, generate_impl=fake_generate)

    rc = module.main(
        [
            "--input",
            str(input_file),
            "--resources-dir",
            str(resources_dir),
            "--max-retries",
            "1",
            "--retry-wait-base",
            "0",
            "--retry-wait-max",
            "0",
            "--max-consecutive-failures",
            "10",
        ]
    )
    assert rc == 2
    assert call_count["n"] == 2

    errors_path = resources_dir / "cards" / "_errors.jsonl"
    errors = _read_jsonl(errors_path)
    assert len(errors) == 1
    assert errors[0]["idiom"] == "白首不渝"

    runlog = _read_jsonl(resources_dir / "historycards_runlog.jsonl")
    assert [r["status"] for r in runlog] == ["failed", "ok"]


def test_stop_after_consecutive_failures(tmp_path, monkeypatch):
    module = _load_historycards_module()

    input_file = tmp_path / "idioms.txt"
    input_file.write_text("甲\n乙\n丙\n", encoding="utf-8")
    resources_dir = tmp_path / "resources"

    call_count = {"n": 0}

    def fake_generate(_client, _llm_source, _prompt, _model_name, _logger):
        call_count["n"] += 1
        return '{ "period": "秦" "year_estimate": -200, "meaning": "x", "story": "y", "prompt": "p", "popular": 5 }'

    _install_llm_fakes(monkeypatch, module, generate_impl=fake_generate)

    rc = module.main(
        [
            "--input",
            str(input_file),
            "--resources-dir",
            str(resources_dir),
            "--max-retries",
            "1",
            "--retry-wait-base",
            "0",
            "--retry-wait-max",
            "0",
            "--max-consecutive-failures",
            "2",
        ]
    )
    assert rc == 2
    assert call_count["n"] == 2

    errors = _read_jsonl(resources_dir / "cards" / "_errors.jsonl")
    assert len(errors) == 2


def test_consecutive_failure_resets_after_success(tmp_path, monkeypatch):
    module = _load_historycards_module()

    input_file = tmp_path / "idioms.txt"
    input_file.write_text("一\n二\n三\n", encoding="utf-8")
    resources_dir = tmp_path / "resources"

    call_count = {"n": 0}

    def fake_generate(_client, _llm_source, _prompt, _model_name, _logger):
        call_count["n"] += 1
        if call_count["n"] in (1, 3):
            return (
                '{\n'
                '  "period": "汉"\n'
                '  "year_estimate": 1,\n'
                '  "meaning": "x"\n'
                '  "story": "y",\n'
                '  "prompt": "p",\n'
                '  "popular": 5\n'
                "}\n"
            )
        return '{"period":"汉","year_estimate":1,"meaning":"x","story":"y","prompt":"p","popular":5}'

    _install_llm_fakes(monkeypatch, module, generate_impl=fake_generate)

    rc = module.main(
        [
            "--input",
            str(input_file),
            "--resources-dir",
            str(resources_dir),
            "--max-retries",
            "1",
            "--retry-wait-base",
            "0",
            "--retry-wait-max",
            "0",
            "--max-consecutive-failures",
            "2",
        ]
    )
    assert rc == 2
    assert call_count["n"] == 3

    errors = _read_jsonl(resources_dir / "cards" / "_errors.jsonl")
    assert len(errors) == 2
