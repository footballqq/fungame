# codex: 2026-11-24 升级 11x11 剪正方形数学模块，支持 N=2..25 任意边长帕金斯太太的被子最优构造与验证
"""
N×N 正方形纸片最少剪片问题（帕金斯太太的被子 / Mrs. Perkins's Quilt，OEIS A005670）数学验证模块。
支持 N = 2..25 任意整数边长的严格最优解构造与校验。
"""

from typing import Dict, List, Tuple

BOARD_SIZE = 11
MIN_BOARD_SIZE = 2
MAX_BOARD_SIZE = 25
MIN_PIECE_SIZE = 1
MAX_PIECE_SIZE = 10
OPTIMAL_COUNT = 11

# 质数边长的严格理论最优解（OEIS A005670），坐标系：row (0..N-1), col (0..N-1), size (1..N-1)
PRIME_OPTIMAL_SOLUTIONS: Dict[int, List[Dict[str, int]]] = {
    2: [
        {"row": 0, "col": 0, "size": 1},
        {"row": 0, "col": 1, "size": 1},
        {"row": 1, "col": 0, "size": 1},
        {"row": 1, "col": 1, "size": 1},
    ],
    3: [
        {"row": 0, "col": 0, "size": 2},
        {"row": 0, "col": 2, "size": 1},
        {"row": 1, "col": 2, "size": 1},
        {"row": 2, "col": 0, "size": 1},
        {"row": 2, "col": 1, "size": 1},
        {"row": 2, "col": 2, "size": 1},
    ],
    5: [
        {"row": 0, "col": 0, "size": 3},
        {"row": 0, "col": 3, "size": 2},
        {"row": 2, "col": 3, "size": 2},
        {"row": 3, "col": 0, "size": 2},
        {"row": 3, "col": 2, "size": 1},
        {"row": 4, "col": 2, "size": 1},
        {"row": 4, "col": 3, "size": 1},
        {"row": 4, "col": 4, "size": 1},
    ],
    7: [
        {"row": 0, "col": 0, "size": 4},
        {"row": 0, "col": 4, "size": 3},
        {"row": 3, "col": 4, "size": 2},
        {"row": 3, "col": 6, "size": 1},
        {"row": 4, "col": 0, "size": 3},
        {"row": 4, "col": 3, "size": 1},
        {"row": 4, "col": 6, "size": 1},
        {"row": 5, "col": 3, "size": 2},
        {"row": 5, "col": 5, "size": 2},
    ],
    11: [
        {"row": 0, "col": 0, "size": 6},
        {"row": 0, "col": 6, "size": 5},
        {"row": 6, "col": 0, "size": 5},
        {"row": 5, "col": 8, "size": 3},
        {"row": 8, "col": 8, "size": 3},
        {"row": 8, "col": 5, "size": 3},
        {"row": 5, "col": 6, "size": 2},
        {"row": 6, "col": 5, "size": 1},
        {"row": 7, "col": 5, "size": 1},
        {"row": 7, "col": 6, "size": 1},
        {"row": 7, "col": 7, "size": 1},
    ],
    13: [
        {"row": 0, "col": 0, "size": 7},
        {"row": 0, "col": 7, "size": 6},
        {"row": 6, "col": 7, "size": 2},
        {"row": 6, "col": 9, "size": 4},
        {"row": 7, "col": 0, "size": 6},
        {"row": 7, "col": 6, "size": 1},
        {"row": 8, "col": 6, "size": 3},
        {"row": 10, "col": 9, "size": 1},
        {"row": 10, "col": 10, "size": 3},
        {"row": 11, "col": 6, "size": 2},
        {"row": 11, "col": 8, "size": 2},
    ],
    17: [
        {"row": 0, "col": 0, "size": 9},
        {"row": 0, "col": 9, "size": 8},
        {"row": 8, "col": 9, "size": 2},
        {"row": 8, "col": 11, "size": 4},
        {"row": 8, "col": 15, "size": 2},
        {"row": 9, "col": 0, "size": 8},
        {"row": 9, "col": 8, "size": 1},
        {"row": 10, "col": 8, "size": 3},
        {"row": 10, "col": 15, "size": 2},
        {"row": 12, "col": 11, "size": 1},
        {"row": 12, "col": 12, "size": 5},
        {"row": 13, "col": 8, "size": 4},
    ],
    19: [
        {"row": 0, "col": 0, "size": 13},
        {"row": 0, "col": 13, "size": 6},
        {"row": 6, "col": 13, "size": 6},
        {"row": 12, "col": 13, "size": 2},
        {"row": 12, "col": 15, "size": 4},
        {"row": 13, "col": 0, "size": 6},
        {"row": 13, "col": 6, "size": 6},
        {"row": 13, "col": 12, "size": 1},
        {"row": 14, "col": 12, "size": 3},
        {"row": 16, "col": 15, "size": 1},
        {"row": 16, "col": 16, "size": 3},
        {"row": 17, "col": 12, "size": 2},
        {"row": 17, "col": 14, "size": 2},
    ],
    23: [
        {"row": 0, "col": 0, "size": 13},
        {"row": 0, "col": 13, "size": 10},
        {"row": 10, "col": 13, "size": 4},
        {"row": 10, "col": 17, "size": 6},
        {"row": 13, "col": 0, "size": 10},
        {"row": 13, "col": 10, "size": 2},
        {"row": 13, "col": 12, "size": 1},
        {"row": 14, "col": 12, "size": 3},
        {"row": 14, "col": 15, "size": 2},
        {"row": 15, "col": 10, "size": 2},
        {"row": 16, "col": 15, "size": 1},
        {"row": 16, "col": 16, "size": 7},
        {"row": 17, "col": 10, "size": 6},
    ],
}

OPTIMAL_11_SOLUTION = PRIME_OPTIMAL_SOLUTIONS[11]


def smallest_prime_factor(n: int) -> int:
    """返回 n >= 2 的最小质因数。"""
    if n < 2:
        raise ValueError("n 必须 >= 2")
    d = 2
    while d * d <= n:
        if n % d == 0:
            return d
        d += 1
    return n


def get_optimal_solution(n: int) -> List[Dict[str, int]]:
    """
    获取任意边长 n (2 <= n <= 25) 的严格理论最优剪法。
    合数 n 通过最小质因数 p 的最优解按比例 k = n // p 等比放大构造。
    """
    if not (MIN_BOARD_SIZE <= n <= MAX_BOARD_SIZE):
        raise ValueError(f"边长 n 必须在 {MIN_BOARD_SIZE}..{MAX_BOARD_SIZE} 之间")
    p = smallest_prime_factor(n)
    scale = n // p
    base = PRIME_OPTIMAL_SOLUTIONS[p]
    return [
        {"row": item["row"] * scale, "col": item["col"] * scale, "size": item["size"] * scale}
        for item in base
    ]


def validate_tiling(
    pieces: List[Dict[str, int]], board_size: int = BOARD_SIZE
) -> Tuple[bool, str]:
    """验证一组正方形纸片是否严格无重叠、无遗漏地铺满 board_size x board_size，且每片边长 < board_size。"""
    grid = [[0] * board_size for _ in range(board_size)]
    total_area = 0

    for idx, p in enumerate(pieces):
        r, c, s = p["row"], p["col"], p["size"]
        if not (MIN_PIECE_SIZE <= s < board_size):
            return False, f"第 {idx + 1} 片边长 {s} 不合法，必须在 1..{board_size - 1} 之间"
        if r < 0 or c < 0 or r + s > board_size or c + s > board_size:
            return False, f"第 {idx + 1} 片 ({r},{c},{s}) 超出 {board_size}x{board_size} 边界"
        for dr in range(s):
            for dc in range(s):
                if grid[r + dr][c + dc] != 0:
                    return False, f"第 {idx + 1} 片在 ({r + dr},{c + dc}) 处发生重叠"
                grid[r + dr][c + dc] = idx + 1
        total_area += s * s

    if total_area != board_size * board_size:
        return False, f"总面积 {total_area} 不等于 {board_size * board_size}"

    for r in range(board_size):
        for c in range(board_size):
            if grid[r][c] == 0:
                return False, f"位置 ({r},{c}) 存在未覆盖空隙"

    return True, "校验通过"


def build_max10_trap_solution() -> List[Dict[str, int]]:
    """构造教学反例 1：先剪 1 个 10x10，被迫用 21 个 1x1 填边，共 22 片。"""
    pieces = [{"row": 0, "col": 0, "size": 10}]
    for r in range(10):
        pieces.append({"row": r, "col": 10, "size": 1})
    for c in range(11):
        pieces.append({"row": 10, "col": c, "size": 1})
    return pieces


def build_four5_trap_solution() -> List[Dict[str, int]]:
    """构造教学反例 2：四角各剪 1 个 5x5，中间十字缝隙被迫用 21 个 1x1 填满，共 25 片。"""
    pieces = [
        {"row": 0, "col": 0, "size": 5},
        {"row": 0, "col": 6, "size": 5},
        {"row": 6, "col": 0, "size": 5},
        {"row": 6, "col": 6, "size": 5},
    ]
    for c in range(11):
        pieces.append({"row": 5, "col": c, "size": 1})
    for r in range(11):
        if r != 5:
            pieces.append({"row": r, "col": 5, "size": 1})
    return pieces


def size_distribution(pieces: List[Dict[str, int]]) -> Dict[int, int]:
    """统计各边长正方形的数量分布。"""
    dist: Dict[int, int] = {}
    for p in pieces:
        s = p["size"]
        dist[s] = dist.get(s, 0) + 1
    return dist
