# codex: 2026-02-13 新增 pytest：覆盖 chesshorse Knight's Tour 求解器的无解/有解/路径合法性与“从部分路径继续”
from __future__ import annotations

import importlib.util
from pathlib import Path
import sys


def _load_chesshorse_solver_module():
    # chesshorse_knight_tour_solver：为 pytest 动态加载 tools/ 下的求解器模块（避免依赖 package 结构）。
    repo_root = Path(__file__).resolve().parents[1]
    module_path = repo_root / "tools" / "chesshorse_knight_tour_solver.py"
    module_name = "chesshorse_knight_tour_solver_for_tests"
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def test_4x4_no_solution() -> None:
    module = _load_chesshorse_solver_module()
    for start_index in range(16):
        path = module.find_knight_tour_path(
            module.KnightTourSolveOptions(
                board_size=4, path_prefix=[start_index], max_time_seconds=0.2
            )
        )
        assert path is None


def test_5x5_solution_is_valid() -> None:
    module = _load_chesshorse_solver_module()
    path = module.find_knight_tour_path(
        module.KnightTourSolveOptions(
            board_size=5, path_prefix=[0], max_time_seconds=2.0, random_seed=123
        )
    )
    assert path is not None
    assert len(path) == 25
    assert module.is_valid_knight_tour_path(5, path)


def test_8x8_solution_is_valid() -> None:
    module = _load_chesshorse_solver_module()
    path = module.find_knight_tour_path(
        module.KnightTourSolveOptions(
            board_size=8, path_prefix=[0], max_time_seconds=3.0, random_seed=456
        )
    )
    assert path is not None
    assert len(path) == 64
    assert module.is_valid_knight_tour_path(8, path)


def test_continue_from_prefix_keeps_prefix() -> None:
    module = _load_chesshorse_solver_module()
    full_path = module.find_knight_tour_path(
        module.KnightTourSolveOptions(
            board_size=5, path_prefix=[0], max_time_seconds=2.0, random_seed=999
        )
    )
    assert full_path is not None

    prefix = full_path[:7]
    continued = module.find_knight_tour_path(
        module.KnightTourSolveOptions(
            board_size=5, path_prefix=prefix, max_time_seconds=2.0, random_seed=999
        )
    )
    assert continued is not None
    assert continued[: len(prefix)] == prefix
    assert len(continued) == 25
    assert module.is_valid_knight_tour_path(5, continued)


def test_invalid_prefix_returns_none() -> None:
    module = _load_chesshorse_solver_module()
    # 非法：重复格子
    path = module.find_knight_tour_path(
        module.KnightTourSolveOptions(board_size=5, path_prefix=[0, 0], max_time_seconds=0.2)
    )
    assert path is None
