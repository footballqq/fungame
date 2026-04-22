# codex: 2026-02-13 新增 Python 求解器（用于 pytest 回归测试）：Knight's Tour（Warnsdorff + 回溯）
from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Iterable, List, Optional


# KNIGHT_DELTAS：国际象棋“马”的 8 种“日”字走法偏移（用于生成邻接表）。
KNIGHT_DELTAS = (
    (1, 2),
    (2, 1),
    (-1, 2),
    (-2, 1),
    (1, -2),
    (2, -1),
    (-1, -2),
    (-2, -1),
)


def build_knight_adjacency(board_size: int) -> List[List[int]]:
    """build_knight_adjacency: 预计算每个格子的可达邻接表，加速求解。"""
    if board_size <= 0:
        raise ValueError("board_size must be positive")

    cell_count = board_size * board_size
    adjacency_by_cell_index: List[List[int]] = [[] for _ in range(cell_count)]
    for cell_index in range(cell_count):
        row_index = cell_index // board_size
        col_index = cell_index % board_size
        for dr, dc in KNIGHT_DELTAS:
            next_row_index = row_index + dr
            next_col_index = col_index + dc
            if (
                next_row_index < 0
                or next_row_index >= board_size
                or next_col_index < 0
                or next_col_index >= board_size
            ):
                continue
            adjacency_by_cell_index[cell_index].append(
                next_row_index * board_size + next_col_index
            )
    return adjacency_by_cell_index


def is_valid_knight_tour_path(board_size: int, path_cell_indices: Iterable[int]) -> bool:
    """is_valid_knight_tour_path: 校验路径是否合法（覆盖全盘/无重复/每步为马走法）。"""
    path_list = list(path_cell_indices)
    cell_count = board_size * board_size
    if len(path_list) != cell_count:
        return False

    if any((not isinstance(v, int)) for v in path_list):
        return False
    if any((v < 0 or v >= cell_count) for v in path_list):
        return False
    if len(set(path_list)) != cell_count:
        return False

    adjacency_by_cell_index = build_knight_adjacency(board_size)
    for i in range(1, len(path_list)):
        prev_cell_index = path_list[i - 1]
        next_cell_index = path_list[i]
        if next_cell_index not in adjacency_by_cell_index[prev_cell_index]:
            return False

    return True


@dataclass(frozen=True)
class KnightTourSolveOptions:
    # board_size：棋盘大小 N（N×N）。
    board_size: int
    # path_prefix：已走过的路径前缀（用于“从当前状态继续”）。
    path_prefix: List[int]
    # max_time_seconds：最长求解时间，避免卡死。
    max_time_seconds: float = 1.2
    # random_seed：平局随机种子（可复现）。
    random_seed: int = 0


def find_knight_tour_path(options: KnightTourSolveOptions) -> Optional[List[int]]:
    """find_knight_tour_path: 求一条完整 Knight's Tour 路径，找不到则返回 None。"""
    n = options.board_size
    if n <= 0:
        return None
    if n * n == 1:
        return [0]
    if n in (2, 3, 4):
        return None

    if not options.path_prefix:
        return None

    cell_count = n * n
    adjacency_by_cell_index = build_knight_adjacency(n)

    visited_by_cell_index = [False] * cell_count
    path: List[int] = []

    for cell_index in options.path_prefix:
        if not isinstance(cell_index, int):
            return None
        if cell_index < 0 or cell_index >= cell_count:
            return None
        if visited_by_cell_index[cell_index]:
            return None
        if path:
            prev_cell_index = path[-1]
            if cell_index not in adjacency_by_cell_index[prev_cell_index]:
                return None
        visited_by_cell_index[cell_index] = True
        path.append(cell_index)

    rng = random.Random((options.random_seed + n * 1009 + path[0] * 9176) & 0xFFFFFFFF)
    deadline = time.monotonic() + max(0.01, float(options.max_time_seconds))

    def unvisited_degree(cell_index: int) -> int:
        return sum(1 for nxt in adjacency_by_cell_index[cell_index] if not visited_by_cell_index[nxt])

    def build_candidates_ordered(current_cell_index: int) -> List[int]:
        candidates = [nxt for nxt in adjacency_by_cell_index[current_cell_index] if not visited_by_cell_index[nxt]]
        rng.shuffle(candidates)
        candidates.sort(key=unvisited_degree)
        return candidates

    def backtrack(current_cell_index: int) -> bool:
        if time.monotonic() > deadline:
            return False
        if len(path) == cell_count:
            return True

        candidates = build_candidates_ordered(current_cell_index)
        if not candidates:
            return False

        for nxt in candidates:
            visited_by_cell_index[nxt] = True
            path.append(nxt)
            if backtrack(nxt):
                return True
            path.pop()
            visited_by_cell_index[nxt] = False
        return False

    ok = backtrack(path[-1])
    return path[:] if ok else None

