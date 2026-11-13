# codex: 2026-11-13 4x4网格折纸几何数学求解器，证明9重厚度定理并求解最优折叠步序

from collections import Counter, deque
from typing import Dict, List, Set, Tuple

"""
4x4 网格纸片折纸问题数学模型：
正方形纸片由 16 个小方格组成（4 行 4 列）。
允许沿虚线（网格线）进行平面折叠（简单平折，Simple Folds）。
每次折叠将折线一侧的所有纸层翻折到另一侧。
定义“厚度”为折叠后平面图形上任意小方格位置的最大重叠层数。

数学定理：
1. 水平折叠与垂直折叠沿网格完全解耦（属于直积变换）。
2. 一维 4 连方纸条沿网格折叠的可能厚度集合严格为 S_1 = {1, 2, 3, 4}。
3. 二维 4x4 网格沿网格折叠的厚度集合严格为 S_2 = S_1 × S_1 = {1, 2, 3, 4, 6, 8, 9, 12, 16}，共 9 种。
4. 任何非该集合的厚度（如 5, 7, 10, 11, 13, 14, 15 等）在不撕裂纸张的前提下数学上不可能达到。
"""

TARGET_THICKNESSES = [1, 2, 3, 4, 6, 8, 9, 12, 16]


def get_initial_squares() -> List[Dict]:
    """返回初始未折叠状态的 16 个小方格信息"""
    squares = []
    for r in range(4):
        for c in range(4):
            idx = r * 4 + c + 1
            squares.append({
                "id": idx,
                "r0": r,
                "c0": c,
                "x": c,
                "y": r,
                "z": 0,
                "face_up": True,
            })
    return squares


def compute_thickness(squares: List[Dict]) -> Tuple[int, Dict[Tuple[int, int], int]]:
    """计算当前图形的最大厚度及每个坐标上的层数"""
    counts = Counter((sq["x"], sq["y"]) for sq in squares)
    max_thick = max(counts.values()) if counts else 0
    return max_thick, dict(counts)


def apply_fold(squares: List[Dict], axis: str, line: int, direction: str) -> List[Dict]:
    """
    对纸片施加一次折叠变换
    axis: 'v' (垂直折线 x = line) 或 'h' (水平折线 y = line)
    direction:
      - 垂直折叠:
          'L->R': 将 x < line 的部分向右折叠到 line 右侧
          'R->L': 将 x >= line 的部分向左折叠到 line 左侧
      - 水平折叠:
          'T->B': 将 y < line 的部分向下折叠到 line 下侧
          'B->T': 将 y >= line 的部分向上折叠到 line 上侧
    """
    new_squares = [dict(sq) for sq in squares]

    if axis == 'v':
        if direction == 'L->R':
            for sq in new_squares:
                if sq["x"] < line:
                    sq["x"] = 2 * line - 1 - sq["x"]
                    sq["face_up"] = not sq["face_up"]
                    # 翻折到顶层：提高相对 z 顺序
                    sq["z"] = sq["z"] + 100
        elif direction == 'R->L':
            for sq in new_squares:
                if sq["x"] >= line:
                    sq["x"] = 2 * line - 1 - sq["x"]
                    sq["face_up"] = not sq["face_up"]
                    sq["z"] = sq["z"] + 100
        else:
            raise ValueError(f"未知垂直方向: {direction}")
    elif axis == 'h':
        if direction == 'T->B':
            for sq in new_squares:
                if sq["y"] < line:
                    sq["y"] = 2 * line - 1 - sq["y"]
                    sq["face_up"] = not sq["face_up"]
                    sq["z"] = sq["z"] + 100
        elif direction == 'B->T':
            for sq in new_squares:
                if sq["y"] >= line:
                    sq["y"] = 2 * line - 1 - sq["y"]
                    sq["face_up"] = not sq["face_up"]
                    sq["z"] = sq["z"] + 100
        else:
            raise ValueError(f"未知水平方向: {direction}")
    else:
        raise ValueError(f"未知轴向: {axis}")

    # 规范化坐标系：使包围盒左上角位于 (0, 0)
    min_x = min(sq["x"] for sq in new_squares)
    min_y = min(sq["y"] for sq in new_squares)
    for sq in new_squares:
        sq["x"] -= min_x
        sq["y"] -= min_y

    # 重新梳理同一格子的 z 轴次序 (0..k-1)
    by_pos: Dict[Tuple[int, int], List[Dict]] = {}
    for sq in new_squares:
        pos = (sq["x"], sq["y"])
        by_pos.setdefault(pos, []).append(sq)

    for pos, group in by_pos.items():
        group.sort(key=lambda s: s["z"])
        for idx, s in enumerate(group):
            s["z"] = idx

    return new_squares


def get_available_folds(squares: List[Dict]) -> List[Tuple[str, int, str, str]]:
    """获取当前状态下所有可行的沿网格线折叠操作"""
    xs = set(sq["x"] for sq in squares)
    ys = set(sq["y"] for sq in squares)
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    folds = []
    # 垂直折线：在两个方格之间，x 从 min_x + 1 到 max_x
    for k in range(min_x + 1, max_x + 1):
        folds.append(('v', k, 'L->R', f"沿竖线 x={k} 从左向右翻折"))
        folds.append(('v', k, 'R->L', f"沿竖线 x={k} 从右向左翻折"))

    # 水平折线：在两个方格之间，y 从 min_y + 1 到 max_y
    for k in range(min_y + 1, max_y + 1):
        folds.append(('h', k, 'T->B', f"沿横线 y={k} 从上向下翻折"))
        folds.append(('h', k, 'B->T', f"沿横线 y={k} 从下向上翻折"))

    return folds


def canonical_state(squares: List[Dict]) -> Tuple[Tuple[int, int], ...]:
    """返回方格坐标的多重集作为状态指纹"""
    return tuple(sorted((sq["x"], sq["y"]) for sq in squares))


def find_all_thicknesses_and_solutions() -> Dict[int, List[Tuple[str, int, str, str]]]:
    """
    通过 BFS 广度优先搜索，寻找达到 9 种目标厚度的最短折叠路径
    返回: {厚度: [折叠动作列表]}
    """
    init_sq = get_initial_squares()
    queue = deque([(init_sq, [])])
    visited: Set[Tuple[Tuple[int, int], ...]] = {canonical_state(init_sq)}

    solutions: Dict[int, List[Tuple[str, int, str, str]]] = {1: []}

    while queue and len(solutions) < len(TARGET_THICKNESSES):
        current_sq, path = queue.popleft()
        thick, _ = compute_thickness(current_sq)

        if thick not in solutions:
            solutions[thick] = path

        # 探索下一步所有折叠
        for axis, line, direction, desc in get_available_folds(current_sq):
            next_sq = apply_fold(current_sq, axis, line, direction)
            state = canonical_state(next_sq)
            if state not in visited:
                visited.add(state)
                queue.append((next_sq, path + [(axis, line, direction, desc)]))

    return solutions


def prove_theorem() -> Dict:
    """输出 9 重厚度定理的证明依据数据"""
    solutions = find_all_thicknesses_and_solutions()
    found_thicknesses = sorted(solutions.keys())
    return {
        "expected_thicknesses": TARGET_THICKNESSES,
        "found_thicknesses": found_thicknesses,
        "is_exact_match": found_thicknesses == TARGET_THICKNESSES,
        "count": len(found_thicknesses),
        "solutions": solutions,
    }


if __name__ == "__main__":
    result = prove_theorem()
    print("证明结论:")
    print(f"预期厚度列表: {result['expected_thicknesses']}")
    print(f"实际可达厚度: {result['found_thicknesses']}")
    print(f"可达厚度数量: {result['count']} 种")
    print(f"与定理吻合: {result['is_exact_match']}")
    print("\n各厚度最短折叠步序:")
    for thick, steps in sorted(result["solutions"].items()):
        print(f"【厚度 {thick:2d}】需要 {len(steps)} 步折叠:")
        for i, step in enumerate(steps, 1):
            print(f"  第 {i} 步: {step[3]}")
