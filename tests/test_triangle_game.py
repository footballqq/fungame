# codex: 2026-09-23 编写正三角形点阵移除(triangleremove)数学定理与求解器单测
import os
import sys
import pytest

# 确保能导入 boardgame/triangleremove
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
game_dir = os.path.join(parent_dir, "boardgame", "triangleremove")
if game_dir not in sys.path:
    sys.path.insert(0, game_dir)

from triangle_math import (
    generate_lattice,
    find_all_equilateral_triangles,
    solve_min_hitting_set,
    get_remaining_triangles,
    get_vertex_degrees,
    find_max_disjoint_triangles,
    get_level_info,
)

def test_lattice_generation():
    """测试不同行数正三角形点阵生成数量与坐标格式"""
    pts2 = generate_lattice(2)
    assert len(pts2) == 3
    pts3 = generate_lattice(3)
    assert len(pts3) == 6
    pts4 = generate_lattice(4)
    assert len(pts4) == 10
    pts5 = generate_lattice(5)
    assert len(pts5) == 15

    # 验证坐标正确性（第0点为顶点，x=0, y=0）
    assert pts5[0]["x"] == 0.0
    assert pts5[0]["y"] == 0.0

def test_15_points_equilateral_triangles_classification():
    """测试15点点阵中全部35个正三角形分类与数量"""
    pts = generate_lattice(5)
    tris = find_all_equilateral_triangles(pts)
    assert len(tris) == 35

    # 统计分类
    categories = {}
    for t in tris:
        key = (t["side_name"], t["orientation"])
        categories[key] = categories.get(key, 0) + 1

    assert categories[("边长 1", "upright")] == 10
    assert categories[("边长 1", "inverted")] == 6
    assert categories[("边长 √3 (约1.73)", "tilted")] == 6
    assert categories[("边长 2", "upright")] == 6
    assert categories[("边长 2", "inverted")] == 1
    assert categories[("边长 √7 (约2.65)", "tilted")] == 2
    assert categories[("边长 3", "upright")] == 3
    assert categories[("边长 4", "upright")] == 1

def test_optimal_hitting_set_is_strictly_7():
    """测试证明最少去掉点数严格为7，且存在3组120度对称最优解"""
    pts = generate_lattice(5)
    tris = find_all_equilateral_triangles(pts)
    min_k, solutions = solve_min_hitting_set(tris, len(pts))

    assert min_k == 7
    assert len(solutions) == 3

    # 验证3组解是否完全消除所有正三角形
    for sol in solutions:
        rem = get_remaining_triangles(tris, sol)
        assert len(rem) == 0

    # 验证解中包含各顶角的对称性
    # 顶点为 0, 左下角为 10, 右下角为 14
    corner_present = [False, False, False]
    for sol in solutions:
        if 0 in sol:
            corner_present[0] = True
        if 10 in sol:
            corner_present[1] = True
        if 14 in sol:
            corner_present[2] = True
    assert all(corner_present)

def test_disjoint_lower_bound_is_5():
    """测试互不相交正三角形最大数为5，覆盖全部15个点（鸽巢原理下界至少为5）"""
    pts = generate_lattice(5)
    tris = find_all_equilateral_triangles(pts)
    disjoint = find_max_disjoint_triangles(tris, len(pts))

    assert len(disjoint) == 5
    # 验证互不相交且并集为全部15个点
    all_vertices = set()
    for t in disjoint:
        v_set = set(t["vertices"])
        assert len(all_vertices & v_set) == 0
        all_vertices |= v_set
    assert len(all_vertices) == 15

def test_sub_levels_computation():
    """测试阶梯教学小关卡（2行3点、3行6点、4行10点）"""
    # Level 1: 2 rows (3 points)
    lvl1 = get_level_info(2)
    assert lvl1["total_points"] == 3
    assert lvl1["total_triangles"] == 1
    assert lvl1["min_removal_count"] == 1

    # Level 2: 3 rows (6 points)
    lvl2 = get_level_info(3)
    assert lvl2["total_points"] == 6
    assert lvl2["total_triangles"] == 5
    assert lvl2["min_removal_count"] == 2

    # Level 3: 4 rows (10 points)
    lvl3 = get_level_info(4)
    assert lvl3["total_points"] == 10
    assert lvl3["total_triangles"] == 15
    assert lvl3["min_removal_count"] == 4

def test_remaining_triangles_calculation():
    """测试动态移除点时剩余正三角形计算"""
    pts = generate_lattice(5)
    tris = find_all_equilateral_triangles(pts)

    # 初始未移除任何点
    assert len(get_remaining_triangles(tris, [])) == 35

    # 移除顶点 (0,0) (即索引0)
    # 检查顶点0所属的所有正三角形都被破坏
    rem_after_0 = get_remaining_triangles(tris, [0])
    # 顶点0被破坏的正三角形数量应该等于 degree(0)
    degs = get_vertex_degrees(tris, len(pts))
    assert len(rem_after_0) == 35 - degs[0]

def test_file_structure_and_line_limits():
    """测试全部项目文件存在性且单文件严格不超过500行"""
    base_dir = os.path.join(parent_dir, "boardgame", "triangleremove")
    required_files = [
        "index.html",
        "triangle.jpg",
        "triangle_math.py",
        os.path.join("css", "style.css"),
        os.path.join("css", "board.css"),
        os.path.join("css", "modal.css"),
        os.path.join("js", "config.js"),
        os.path.join("js", "engine.js"),
        os.path.join("js", "audio.js"),
        os.path.join("js", "canvas.js"),
        os.path.join("js", "story.js"),
        os.path.join("js", "teaching.js"),
        os.path.join("js", "history.js"),
        os.path.join("js", "demo_player.js"),
        os.path.join("js", "ui.js"),
    ]

    for rel_path in required_files:
        full_path = os.path.join(base_dir, rel_path)
        assert os.path.exists(full_path), f"缺少关键文件: {rel_path}"

        if rel_path.endswith(('.html', '.css', '.js', '.py')):
            with open(full_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                assert len(lines) <= 500, f"文件 {rel_path} 超过 500 行限制: 当前 {len(lines)} 行"

def test_index_html_elements():
    """测试游戏主页面必要元素与脚本引入"""
    index_path = os.path.join(parent_dir, "boardgame", "triangleremove", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 验证关键元素
    assert '<canvas id="triangleCanvas">' in content
    assert 'id="btnToggleLines"' in content
    assert 'id="btnToggleDegrees"' in content
    assert 'id="remainingList"' in content
    assert 'id="modalRules"' in content
    assert 'id="modalTeaching"' in content
    assert 'id="modalStory"' in content
    assert 'id="demoDockPanel"' in content
    assert 'id="modalHistory"' in content

    # 验证核心 JS 模块完整引入
    for js_file in ["config.js", "engine.js", "audio.js", "canvas.js", "story.js", "teaching.js", "history.js", "demo_player.js", "ui.js"]:
        assert js_file in content

def test_vertex_degrees_mathematical_properties():
    """测试顶点度数（超图权重）数学特性与动态剩余计算"""
    pts = generate_lattice(5)
    tris = find_all_equilateral_triangles(pts)
    degs = get_vertex_degrees(tris, len(pts))

    # 1. 验证总度数和为 35 * 3 = 105
    assert sum(degs) == 105

    # 2. 验证3个顶角 (0,0), (4,0), (4,4) 度数严格为 4
    corners = [0, 10, 14]
    for c in corners:
        assert degs[c] == 4

    # 3. 验证3个中心内点 (2,1), (3,1), (3,2) 度数严格为 9（最高度数交汇点）
    centers = [4, 7, 8]
    for c in centers:
        assert degs[c] == 9

    # 4. 验证3条边中点 (2,0), (2,2), (4,2) 度数严格为 8
    edge_mids = [3, 5, 12]
    for m in edge_mids:
        assert degs[m] == 8

    # 5. 验证其余6个边上邻近点度数严格为 7
    edge_others = [1, 2, 6, 9, 11, 13]
    for o in edge_others:
        assert degs[o] == 7

def test_root_index_html_integration():
    """测试主页 index.html 正确链接至新游戏"""
    root_index = os.path.join(parent_dir, "index.html")
    with open(root_index, "r", encoding="utf-8") as f:
        content = f.read()
    assert "boardgame/triangleremove/index.html" in content

