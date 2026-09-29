# codex: 2026-09-29 square_math.py 正方形剖分与最少纸片拼接算法核心与数学证明求解器
"""
正方形拼接数学模型与理论边界计算模块
基于奥数经典真题：用 1x1, 2x2, 3x3, 4x4 的正方形纸片无重叠无空隙拼接成 NxN 正方形，
计算并证明最少需要的纸片数量（Mrs. Perkins's Quilt 与最少正方形剖分问题）。
"""

from typing import List, Tuple, Dict, Optional, Any


def verify_tiling(N: int, tiles: List[Dict[str, int]]) -> Tuple[bool, str]:
    """
    验证一个给定的切分方案是否合法：
    1. 每个正方形完全位于 NxN 网格内
    2. 无任何重叠
    3. 完全覆盖 NxN，无任何空隙
    """
    board = [[0] * N for _ in range(N)]
    total_area = 0

    for idx, t in enumerate(tiles, start=1):
        r, c, s = t["r"], t["c"], t["s"]
        if s <= 0:
            return False, f"纸片尺寸非法：{s}"
        if r < 0 or c < 0 or r + s > N or c + s > N:
            return False, f"纸片越界：位置 ({r}, {c}) 尺寸 {s} 超出 {N}x{N}"
        for i in range(r, r + s):
            for j in range(c, c + s):
                if board[i][j] != 0:
                    return False, f"纸片重叠：位置 ({i}, {j}) 被重复覆盖"
                board[i][j] = idx
        total_area += s * s

    if total_area != N * N:
        return False, f"面积不吻合：已覆盖 {total_area}，目标 {N*N}"

    for i in range(N):
        for j in range(N):
            if board[i][j] == 0:
                return False, f"存在未覆盖空格：({i}, {j})"

    return True, "验证通过：完美拼接！"


def max_packable_squares(N: int, k: int) -> int:
    """
    计算在 NxN 棋盘中最多可容纳互不重叠的 kxk 正方形数量。
    由二元投影与鸽巢原理，至多为 (N // k) * (N // k)。
    例如 10x10 中最多容纳 (10//4)^2 = 4 块 4x4。
    """
    return (N // k) * (N // k)


def find_diophantine_solutions(N: int = 10, max_k: int = 4, max_tiles: int = 11) -> List[Dict[str, Any]]:
    """
    分析面积不定方程：
    sum_{s=1..max_k} (s^2 * count_s) = N^2
    受约束：count_4 <= (N//4)^2
    输出所有总块数 <= max_tiles 的非负整数解。
    """
    solutions = []
    max_4 = max_packable_squares(N, 4) if max_k >= 4 else 0

    for a in range(max_4 + 1):  # 4x4
        area_a = a * 16
        if area_a > N * N:
            break
        for b in range((N * N - area_a) // 9 + 1):  # 3x3
            area_b = area_a + b * 9
            if area_b > N * N:
                break
            for c in range((N * N - area_b) // 4 + 1):  # 2x2
                area_c = area_b + c * 4
                if area_c > N * N:
                    break
                d = N * N - area_c  # 1x1
                total = a + b + c + d
                if total <= max_tiles:
                    solutions.append({
                        "total": total,
                        "counts": {4: a, 3: b, 2: c, 1: d},
                        "geometric_feasible": None  # 待几何回溯检验
                    })

    solutions.sort(key=lambda x: (x["total"], -x["counts"].get(4, 0)))
    return solutions


def solve_min_square_tiling(
    N: int,
    max_tile_size: int = 4,
    known_upper_bound: Optional[int] = None
) -> Tuple[int, List[Dict[str, int]]]:
    """
    使用精确回溯与面积剪枝寻找 NxN 正方形拼接的最少纸片数与一个最优解。
    """
    board = [[0] * N for _ in range(N)]
    best = [known_upper_bound if known_upper_bound is not None else N * N]
    best_sol: List[Dict[str, int]] = []
    max_sq_area = max_tile_size * max_tile_size

    def get_first_empty() -> Optional[Tuple[int, int]]:
        for r in range(N):
            for c in range(N):
                if board[r][c] == 0:
                    return r, c
        return None

    def can_place(r: int, c: int, s: int) -> bool:
        if r + s > N or c + s > N:
            return False
        for i in range(r, r + s):
            for j in range(c, c + s):
                if board[i][j] != 0:
                    return False
        return True

    def place(r: int, c: int, s: int, val: int) -> None:
        for i in range(r, r + s):
            for j in range(c, c + s):
                board[i][j] = val

    def dfs(count: int, current_sol: List[Dict[str, int]], covered_area: int) -> None:
        rem_area = N * N - covered_area
        # 面积理论下界剪枝
        min_needed = (rem_area + max_sq_area - 1) // max_sq_area
        if count + min_needed >= best[0]:
            return

        emp = get_first_empty()
        if emp is None:
            best[0] = count
            best_sol.clear()
            best_sol.extend(list(current_sol))
            return

        r, c = emp
        # 贪心从大到小尝试正方形
        for s in range(min(max_tile_size, N - r, N - c), 0, -1):
            if can_place(r, c, s):
                place(r, c, s, count + 1)
                current_sol.append({"r": r, "c": c, "s": s})
                dfs(count + 1, current_sol, covered_area + s * s)
                current_sol.pop()
                place(r, c, s, 0)

    dfs(0, [], 0)
    return best[0], best_sol


def get_preset_levels() -> Dict[int, Dict[str, Any]]:
    """
    预设计算好的标准关卡数据及理论最优解。
    包含题目 readme.txt 的 10x10 (最少11块) 以及 5x5 到 12x12。
    """
    levels = {
        5: {
            "name": "5×5",
            "title_zh": "入门试炼 5×5",
            "title_en": "Warmup 5×5",
            "max_tile": 4,
            "min_count": 8,
            "solution": [
                {"r": 0, "c": 0, "s": 3}, {"r": 0, "c": 3, "s": 2},
                {"r": 2, "c": 3, "s": 2}, {"r": 3, "c": 0, "s": 2},
                {"r": 3, "c": 2, "s": 1}, {"r": 4, "c": 2, "s": 1},
                {"r": 4, "c": 3, "s": 1}, {"r": 4, "c": 4, "s": 1}
            ]
        },
        6: {
            "name": "6×6",
            "title_zh": "基础九宫 6×6",
            "title_en": "Basic 6×6",
            "max_tile": 4,
            "min_count": 4,
            "solution": [
                {"r": 0, "c": 0, "s": 3}, {"r": 0, "c": 3, "s": 3},
                {"r": 3, "c": 0, "s": 3}, {"r": 3, "c": 3, "s": 3}
            ]
        },
        7: {
            "name": "7×7",
            "title_zh": "奇数巧拼 7×7",
            "title_en": "Ingenious 7×7",
            "max_tile": 4,
            "min_count": 9,
            "solution": [
                {"r": 0, "c": 0, "s": 4}, {"r": 0, "c": 4, "s": 3},
                {"r": 3, "c": 4, "s": 2}, {"r": 3, "c": 6, "s": 1},
                {"r": 4, "c": 0, "s": 3}, {"r": 4, "c": 3, "s": 1},
                {"r": 4, "c": 6, "s": 1}, {"r": 5, "c": 3, "s": 2},
                {"r": 5, "c": 5, "s": 2}
            ]
        },
        8: {
            "name": "8×8",
            "title_zh": "完美对称 8×8",
            "title_en": "Symmetric 8×8",
            "max_tile": 4,
            "min_count": 4,
            "solution": [
                {"r": 0, "c": 0, "s": 4}, {"r": 0, "c": 4, "s": 4},
                {"r": 4, "c": 0, "s": 4}, {"r": 4, "c": 4, "s": 4}
            ]
        },
        9: {
            "name": "9×9",
            "title_zh": "高阶三阶 9×9",
            "title_en": "Advanced 9×9",
            "max_tile": 4,
            "min_count": 9,
            "solution": [
                {"r": 0, "c": 0, "s": 3}, {"r": 0, "c": 3, "s": 3}, {"r": 0, "c": 6, "s": 3},
                {"r": 3, "c": 0, "s": 3}, {"r": 3, "c": 3, "s": 3}, {"r": 3, "c": 6, "s": 3},
                {"r": 6, "c": 0, "s": 3}, {"r": 6, "c": 3, "s": 3}, {"r": 6, "c": 6, "s": 3}
            ]
        },
        10: {
            "name": "10×10",
            "title_zh": "⭐ 经典真题 10×10",
            "title_en": "⭐ Classic 10×10",
            "max_tile": 4,
            "min_count": 11,
            "solution": [
                {"r": 0, "c": 0, "s": 4}, {"r": 0, "c": 4, "s": 4}, {"r": 0, "c": 8, "s": 2},
                {"r": 2, "c": 8, "s": 2}, {"r": 4, "c": 0, "s": 4}, {"r": 4, "c": 4, "s": 3},
                {"r": 4, "c": 7, "s": 3}, {"r": 7, "c": 4, "s": 3}, {"r": 7, "c": 7, "s": 3},
                {"r": 8, "c": 0, "s": 2}, {"r": 8, "c": 2, "s": 2}
            ]
        },
        11: {
            "name": "11×11",
            "title_zh": "大师极限 11×11",
            "title_en": "Master 11×11",
            "max_tile": 4,
            "min_count": 15,
            "solution": [
                {"r": 0, "c": 0, "s": 4}, {"r": 0, "c": 4, "s": 4}, {"r": 0, "c": 8, "s": 3},
                {"r": 3, "c": 8, "s": 3}, {"r": 4, "c": 0, "s": 4}, {"r": 4, "c": 4, "s": 4},
                {"r": 6, "c": 8, "s": 3}, {"r": 8, "c": 0, "s": 3}, {"r": 8, "c": 3, "s": 3},
                {"r": 8, "c": 6, "s": 2}, {"r": 9, "c": 8, "s": 2}, {"r": 9, "c": 10, "s": 1},
                {"r": 10, "c": 6, "s": 1}, {"r": 10, "c": 7, "s": 1}, {"r": 10, "c": 10, "s": 1}
            ]
        },
        12: {
            "name": "12×12",
            "title_zh": "宗师宏构 12×12",
            "title_en": "Grandmaster 12×12",
            "max_tile": 4,
            "min_count": 9,
            "solution": [
                {"r": 0, "c": 0, "s": 4}, {"r": 0, "c": 4, "s": 4}, {"r": 0, "c": 8, "s": 4},
                {"r": 4, "c": 0, "s": 4}, {"r": 4, "c": 4, "s": 4}, {"r": 4, "c": 8, "s": 4},
                {"r": 8, "c": 0, "s": 4}, {"r": 8, "c": 4, "s": 4}, {"r": 8, "c": 8, "s": 4}
            ]
        }
    }
    return levels
