# codex: 2026-09-23 三角形点阵正三角形几何判定与最小点移除算法引擎
import math
import json
from itertools import combinations

def generate_lattice(n_rows=5):
    """
    生成边长为 n_rows 的正三角形点阵坐标
    行 r: 0 .. n_rows - 1
    列 c: 0 .. r
    单位间距为 1，y 轴朝下便于屏幕坐标映射，高为 sqrt(3)/2
    """
    points = []
    idx = 0
    h = math.sqrt(3) / 2.0
    for r in range(n_rows):
        for c in range(r + 1):
            # 居中对齐坐标
            x = c - r / 2.0
            y = r * h
            points.append({
                "id": idx,
                "row": r,
                "col": c,
                "x": round(x, 6),
                "y": round(y, 6)
            })
            idx += 1
    return points

def find_all_equilateral_triangles(points):
    """
    找出给定点阵中所有由 3 个点组成的正三角形
    """
    triangles = []
    n = len(points)
    EPS = 1e-5
    tri_id = 0

    for i in range(n):
        p1 = points[i]
        for j in range(i + 1, n):
            p2 = points[j]
            d12_sq = (p1["x"] - p2["x"])**2 + (p1["y"] - p2["y"])**2
            for k in range(j + 1, n):
                p3 = points[k]
                d23_sq = (p2["x"] - p3["x"])**2 + (p2["y"] - p3["y"])**2
                d31_sq = (p3["x"] - p1["x"])**2 + (p3["y"] - p1["y"])**2

                if abs(d12_sq - d23_sq) < EPS and abs(d23_sq - d31_sq) < EPS:
                    side_len = math.sqrt(d12_sq)
                    # 判断朝向与类型
                    rs = [p1["row"], p2["row"], p3["row"]]
                    # 水平边：两点处于同一行
                    if rs.count(max(rs)) == 2:
                        ori_type = "upright"
                        ori_label = "正立正三角形"
                    elif rs.count(min(rs)) == 2:
                        ori_type = "inverted"
                        ori_label = "倒立正三角形"
                    else:
                        ori_type = "tilted"
                        ori_label = "倾斜正三角形"

                    # 格式化边长名字
                    side_rounded = round(side_len, 3)
                    if abs(side_len - 1.0) < EPS:
                        side_name = "边长 1"
                    elif abs(side_len - math.sqrt(3)) < EPS:
                        side_name = "边长 √3 (约1.73)"
                    elif abs(side_len - 2.0) < EPS:
                        side_name = "边长 2"
                    elif abs(side_len - math.sqrt(7)) < EPS:
                        side_name = "边长 √7 (约2.65)"
                    elif abs(side_len - 3.0) < EPS:
                        side_name = "边长 3"
                    elif abs(side_len - 4.0) < EPS:
                        side_name = "边长 4"
                    else:
                        side_name = f"边长 {side_rounded}"

                    triangles.append({
                        "id": tri_id,
                        "vertices": [i, j, k],
                        "side_sq": round(d12_sq, 5),
                        "side_length": side_rounded,
                        "side_name": side_name,
                        "orientation": ori_type,
                        "orientation_label": ori_label,
                        "coords": [(p1["row"], p1["col"]), (p2["row"], p2["col"]), (p3["row"], p3["col"])]
                    })
                    tri_id += 1

    return triangles

def solve_min_hitting_set(triangles, n_points):
    """
    求解最小打击集（即最少去掉几个点使所有正三角形都不复存在）
    """
    tri_sets = [set(t["vertices"]) for t in triangles]
    if not tri_sets:
        return 0, []

    for k in range(1, n_points + 1):
        solutions = []
        for combo in combinations(range(n_points), k):
            c_set = set(combo)
            hit_all = True
            for t in tri_sets:
                if not (t & c_set):
                    hit_all = False
                    break
            if hit_all:
                solutions.append(list(combo))
        if solutions:
            return k, solutions
    return n_points, [list(range(n_points))]

def get_remaining_triangles(triangles, removed_indices):
    """
    给定已移除的点索引列表，计算剩余仍然完好的正三角形
    """
    rem_set = set(removed_indices)
    remaining = []
    for t in triangles:
        if not (set(t["vertices"]) & rem_set):
            remaining.append(t)
    return remaining

def get_vertex_degrees(triangles, n_points):
    """
    计算每个点属于多少个正三角形（用于启发式贪心提示）
    """
    degrees = [0] * n_points
    for t in triangles:
        for v in t["vertices"]:
            degrees[v] += 1
    return degrees

def find_max_disjoint_triangles(triangles, n_points=15):
    """
    寻找最大互不相交的正三角形集合（提供鸽巢原理证明下界）
    每个正三角形占用 3 个互不相同的点，故最多为 n_points // 3 个
    """
    tri_sets = [set(t["vertices"]) for t in triangles]
    n = len(tri_sets)
    max_k = min(n, n_points // 3)

    for k in range(max_k, 0, -1):
        for combo in combinations(range(n), k):
            union = set()
            disjoint = True
            for idx in combo:
                if union & tri_sets[idx]:
                    disjoint = False
                    break
                union |= tri_sets[idx]
            if disjoint:
                return [triangles[idx] for idx in combo]
    return []

def get_level_info(n_rows):
    """
    计算指定行数的关卡完整信息（点数、三角形列表、最小移除数、最优解）
    """
    pts = generate_lattice(n_rows)
    tris = find_all_equilateral_triangles(pts)
    min_k, sols = solve_min_hitting_set(tris, len(pts))
    degs = get_vertex_degrees(tris, len(pts))
    disjoint = find_max_disjoint_triangles(tris, len(pts))
    return {
        "n_rows": n_rows,
        "total_points": len(pts),
        "points": pts,
        "total_triangles": len(tris),
        "triangles": tris,
        "min_removal_count": min_k,
        "optimal_solutions": sols,
        "vertex_degrees": degs,
        "max_disjoint_count": len(disjoint),
        "disjoint_triangles": [d["id"] for d in disjoint]
    }

def export_all_levels():
    """
    导出 2~5 行全部 4 个阶梯关卡数据
    """
    levels = {}
    for r in [2, 3, 4, 5]:
        levels[r] = get_level_info(r)
    return levels


if __name__ == "__main__":
    data = get_level_info(5)
    print(f"Points: {data['total_points']}, Triangles: {data['total_triangles']}")
    print(f"Min removal needed: {data['min_removal_count']}")
    print(f"Number of optimal solutions: {len(data['optimal_solutions'])}")
    print(f"Max disjoint triangles: {data['max_disjoint_count']}")

