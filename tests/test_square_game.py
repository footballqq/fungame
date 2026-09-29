# codex: 2026-09-29 tests/test_square_game.py 正方形拼图游戏全要素工程与数学单测
import os
import re
import sys
import subprocess
import pytest

# 添加 square 模块路径
SQUARE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "boardgame", "square"))
if SQUARE_DIR not in sys.path:
    sys.path.insert(0, SQUARE_DIR)

from square_math import (
    verify_tiling,
    max_packable_squares,
    find_diophantine_solutions,
    solve_min_square_tiling,
    get_preset_levels,
)


def test_max_packable_squares_pigeonhole():
    """验证抽屉原理与投影下界：10x10 中最多只能容纳 4 块 4x4"""
    assert max_packable_squares(10, 4) == 4
    assert max_packable_squares(9, 4) == 4
    assert max_packable_squares(8, 4) == 4
    assert max_packable_squares(7, 4) == 1
    assert max_packable_squares(6, 4) == 1
    assert max_packable_squares(12, 4) == 9


def test_all_preset_solutions_validity():
    """验证所有预设关卡的最优解无重叠、无空隙、完全覆盖且块数吻合"""
    levels = get_preset_levels()
    assert 10 in levels, "必须包含 10x10 经典真题关卡"

    for N, data in levels.items():
        sol = data["solution"]
        min_c = data["min_count"]
        assert len(sol) == min_c, f"{N}x{N} 方案块数应为 {min_c}，实为 {len(sol)}"
        valid, msg = verify_tiling(N, sol)
        assert valid, f"{N}x{N} 验证失败: {msg}"


def test_10x10_theoretical_minimum_is_11():
    """验证 10x10 在纸片尺寸 <= 4 时的理论最少块数严格为 11"""
    min_count, sol = solve_min_square_tiling(10, max_tile_size=4, known_upper_bound=12)
    assert min_count == 11, f"10x10 理论最少块数必须是 11，实测为 {min_count}"
    valid, msg = verify_tiling(10, sol)
    assert valid, f"求出的 11 块解合法性验证失败: {msg}"

    counts = {}
    for item in sol:
        s = item["s"]
        counts[s] = counts.get(s, 0) + 1
    assert counts.get(4, 0) == 3, "11 块解应包含 3 块 4x4"
    assert counts.get(3, 0) == 4, "11 块解应包含 4 块 3x3"
    assert counts.get(2, 0) == 4, "11 块解应包含 4 块 2x2"
    assert counts.get(1, 0) == 0, "11 块最优解无需任何 1x1 碎纸片"


def test_tiling_verification_errors():
    """验证校验函数能精准检测越界、重叠与面积不足"""
    invalid_out_of_bounds = [{"r": 8, "c": 8, "s": 4}]
    valid, msg = verify_tiling(10, invalid_out_of_bounds)
    assert not valid and "超出" in msg

    invalid_overlap = [
        {"r": 0, "c": 0, "s": 3},
        {"r": 1, "c": 1, "s": 3},
    ]
    valid, msg = verify_tiling(10, invalid_overlap)
    assert not valid and "重叠" in msg

    invalid_gap = [{"r": 0, "c": 0, "s": 4}]
    valid, msg = verify_tiling(10, invalid_gap)
    assert not valid and "面积不吻合" in msg


def test_diophantine_analysis_partition():
    """验证面积不定方程分析"""
    combos = find_diophantine_solutions(10, max_k=4, max_tiles=10)
    totals = [c["total"] for c in combos]
    assert 7 not in totals, "7 块代数解已被 4x4 最多 4 块物理排除"
    assert 9 not in totals, "9 块代数解已被物理排除"


def test_file_line_limits_under_500():
    """工程规范：验证所有相关文件行数严格 <= 500 行"""
    files_to_check = [
        os.path.join(SQUARE_DIR, "index.html"),
        os.path.join(SQUARE_DIR, "square_math.py"),
        os.path.join(SQUARE_DIR, "css", "style.css"),
        os.path.join(SQUARE_DIR, "css", "board.css"),
        os.path.join(SQUARE_DIR, "css", "modal.css"),
        os.path.join(SQUARE_DIR, "js", "i18n.js"),
        os.path.join(SQUARE_DIR, "js", "audio.js"),
        os.path.join(SQUARE_DIR, "js", "math_engine.js"),
        os.path.join(SQUARE_DIR, "js", "game_state.js"),
        os.path.join(SQUARE_DIR, "js", "drag_drop.js"),
        os.path.join(SQUARE_DIR, "js", "confetti.js"),
        os.path.join(SQUARE_DIR, "js", "ui.js"),
        os.path.join(SQUARE_DIR, "README.md"),
        os.path.join(SQUARE_DIR, "DEVELOPMENT.md"),
        os.path.join(SQUARE_DIR, "DESIGN.md"),
    ]

    for fpath in files_to_check:
        assert os.path.isfile(fpath), f"文件不存在: {fpath}"
        with open(fpath, "r", encoding="utf-8") as f:
            lines = len(f.readlines())
        assert lines <= 500, f"文件 {os.path.basename(fpath)} 行数超标: {lines} > 500"


def test_html_structure_and_accessibility():
    """验证 HTML 页面骨架、核心组件、缩放控制与移动端视口设置"""
    html_path = os.path.join(SQUARE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert '<meta name="viewport"' in content, "必须包含移动端视口配置"
    assert 'id="board"' in content, "必须包含棋盘实体容器"
    assert 'id="targetSelect"' in content, "必须包含目标规格选择器"
    assert 'id="rulesModal"' in content, "必须包含规则弹窗"
    assert 'id="mathModal"' in content, "必须包含数学原理解析弹窗"
    assert 'id="congratModal"' in content, "必须包含通关祝贺弹窗"
    assert 'id="confettiCanvas"' in content, "必须包含彩屑画布"
    assert 'id="trashZone"' in content, "必须包含垃圾桶区域"
    assert 'id="greetingToast"' in content, "必须包含问候浮层"
    assert 'id="btnZoomIn"' in content, "必须包含放大按钮"
    assert 'id="btnZoomOut"' in content, "必须包含缩小按钮"
    assert 'id="zoomPercent"' in content, "必须包含缩放百分比显示"


def test_js_syntax_validation():
    """使用 Node.js 校验所有前端脚本语法合法性"""
    js_dir = os.path.join(SQUARE_DIR, "js")
    js_files = ["i18n.js", "audio.js", "math_engine.js", "game_state.js", "drag_drop.js", "confetti.js", "ui.js"]

    for js_name in js_files:
        js_path = os.path.join(js_dir, js_name)
        res = subprocess.run(
            ["node", "--check", js_path],
            capture_output=True,
            text=True
        )
        assert res.returncode == 0, f"脚本 {js_name} 语法检查失败:\n{res.stderr}"


def test_i18n_bilingual_key_parity():
    """验证中英文语言包包含所有核心提示词与原理解析"""
    i18n_path = os.path.join(SQUARE_DIR, "js", "i18n.js")
    with open(i18n_path, "r", encoding="utf-8") as f:
        text = f.read()

    # 抽取核心键
    required_keys = [
        "game_title", "rules_title", "math_title", "greetings_title",
        "congrat_title", "math_p1_title", "math_p2_title", "math_p3_title", "math_p4_title",
        "status_pieces", "status_target", "status_coverage", "status_optimal"
    ]
    for key in required_keys:
        assert f"{key}:" in text, f"i18n 缺少必需键: {key}"


def test_root_index_html_integration():
    """验证项目主页 index.html 成功集成正方形拼图挑战游戏卡片"""
    root_index = os.path.abspath(os.path.join(SQUARE_DIR, "..", "..", "index.html"))
    assert os.path.isfile(root_index), "根目录 index.html 必须存在"
    with open(root_index, "r", encoding="utf-8") as f:
        html = f.read()
    assert "boardgame/square/index.html" in html, "主页应包含正方形拼图挑战的链接"
    assert "正方形拼图挑战" in html, "主页应包含正方形拼图挑战的中文标题"


def test_ui_theme_beige_default_and_dark_mode():
    """验证默认米白色主题与暗色主题切换样式配置"""
    html_path = os.path.join(SQUARE_DIR, "index.html")
    css_path = os.path.join(SQUARE_DIR, "css", "style.css")

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()
    assert 'class="theme-beige"' in html, "HTML body 默认应应用 theme-beige 米白风格"
    assert 'id="btnTheme"' in html, "顶栏必须包含主题风格切换按钮 #btnTheme"

    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert "body.theme-beige" in css, "CSS 必须定义 body.theme-beige 米白样式规则"
    assert "body.theme-dark" in css, "CSS 必须定义 body.theme-dark 暗色样式规则"


def test_review_board_and_dual_modal_buttons():
    """验证通关弹窗双按键（查看当前棋盘 + 关闭）与终局检视浮动横幅"""
    html_path = os.path.join(SQUARE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    assert 'id="reviewBoardBanner"' in html, "必须包含终局检视横幅 #reviewBoardBanner"
    assert 'id="btnReviewBoard"' in html, "祝贺弹窗内必须包含“查看当前棋盘”按钮"
    assert 'id="btnCloseCongrat"' in html, "祝贺弹窗内必须包含“关闭”按钮"
    assert 'id="btnReopenCongrat"' in html, "检视横幅必须包含“查看评价”按钮"
    assert 'id="btnPlayAgain"' in html, "检视横幅必须包含“再来一局”按钮"


def test_grid_subdivisions_percentage_accuracy():
    """验证纸片暗格细分使用严格百分比布局，杜绝4x4在超高清下出现格数不符"""
    board_css_path = os.path.join(SQUARE_DIR, "css", "board.css")
    with open(board_css_path, "r", encoding="utf-8") as f:
        css = f.read()

    assert "25% 25%" in css, "4x4 纸片必须使用 25% 25% 严格百分比背景尺寸"
    assert "33.333" in css, "3x3 纸片必须使用 33.333% 背景尺寸"
    assert "50% 50%" in css, "2x2 纸片必须使用 50% 50% 背景尺寸"


def test_documentation_and_manual_completeness():
    """验证项目包含完备的用户使用说明文档 README.md、开发经验文档 DEVELOPMENT.md 与美工设计规范 DESIGN.md"""
    readme_path = os.path.join(SQUARE_DIR, "README.md")
    dev_path = os.path.join(SQUARE_DIR, "DEVELOPMENT.md")
    design_path = os.path.join(SQUARE_DIR, "DESIGN.md")

    assert os.path.isfile(readme_path), "必须存在说明文档 README.md"
    assert os.path.isfile(dev_path), "必须存在开发经验文档 DEVELOPMENT.md"
    assert os.path.isfile(design_path), "必须存在美工设计规范文档 DESIGN.md"

    with open(readme_path, "r", encoding="utf-8") as f:
        readme = f.read()
    assert "10×10" in readme and "游戏规则" in readme and "数学原理" in readme and "鸡兔同笼" in readme

    with open(dev_path, "r", encoding="utf-8") as f:
        dev = f.read()
    assert "4K" in dev and "踩坑" in dev and "架构" in dev and "鸡兔同笼" in dev

    with open(design_path, "r", encoding="utf-8") as f:
        design = f.read()
    assert "色谱" in design and "米白" in design and "暗格" in design and "粒子" in design


def test_math_formula_formatting_no_raw_latex():
    """验证前端 i18n 与 HTML 文本中不含未渲染的 raw LaTeX 标记（如 \\times, \\le, \\lceil）"""
    i18n_path = os.path.join(SQUARE_DIR, "js", "i18n.js")
    html_path = os.path.join(SQUARE_DIR, "index.html")

    with open(i18n_path, "r", encoding="utf-8") as f:
        i18n_text = f.read()

    with open(html_path, "r", encoding="utf-8") as f:
        html_text = f.read()

    forbidden_patterns = [r"\\times", r"\\le\b", r"\\ge\b", r"\\lceil", r"\\lfloor", r"\\quad"]
    for pattern in forbidden_patterns:
        assert not re.search(pattern, i18n_text), f"i18n.js 中不应含有未解析的 LaTeX 语法: {pattern}"
        assert not re.search(pattern, html_text), f"index.html 中不应含有未解析的 LaTeX 语法: {pattern}"

    assert "10 × 10 = 100" in i18n_text, "应包含使用标准乘号 × 渲染的公式"
    assert "0 ≤ <em>a</em> ≤ 4" in i18n_text or "0 ≤ a ≤ 4" in i18n_text, "应包含使用标准小于等于号 ≤ 渲染的公式"


def test_styled_clear_modal_and_no_native_dialogs():
    """验证清空棋盘采用游戏风格模态框，彻底杜绝浏览器原生 alert() 和 confirm()"""
    html_path = os.path.join(SQUARE_DIR, "index.html")
    js_path = os.path.join(SQUARE_DIR, "js", "ui.js")

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    assert 'id="clearModal"' in html, "必须包含清空确认模态弹窗 #clearModal"
    assert 'id="btnConfirmClear"' in html, "必须包含确认清空按键 #btnConfirmClear"
    assert 'id="btnCancelClear"' in html, "必须包含取消清空按键 #btnCancelClear"

    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    assert not re.search(r"\balert\(", js), "ui.js 中不应使用浏览器原生 alert()"
    assert not re.search(r"\bconfirm\(", js), "ui.js 中不应使用浏览器原生 confirm()"


def test_custom_tile_sizes_and_tray_render():
    """验证自定义最大纸片至 6x6 与 5x5 时样式齐备且托盘支持动态渲染"""
    board_css = os.path.join(SQUARE_DIR, "css", "board.css")
    ui_js = os.path.join(SQUARE_DIR, "js", "ui.js")
    drag_js = os.path.join(SQUARE_DIR, "js", "drag_drop.js")

    with open(board_css, "r", encoding="utf-8") as f:
        css = f.read()

    assert ".tile-size-6" in css and ".tile-size-5" in css, "board.css 必须包含 6x6 和 5x5 纸片样式"
    assert ".tray-size-6" in css and ".tray-size-5" in css, "board.css 必须包含 6x6 和 5x5 托盘尺寸"
    assert "16.666667%" in css, "6x6 纸片必须具备 1/6 严格百分比细分暗格"
    assert "20%" in css, "5x5 纸片必须具备 1/5 严格百分比细分暗格"

    with open(ui_js, "r", encoding="utf-8") as f:
        js = f.read()
    assert "renderTray" in js, "ui.js 必须具备动态渲染备料托盘函数 renderTray"

    with open(drag_js, "r", encoding="utf-8") as f:
        djs = f.read()
    assert "closest('.tray-item')" in djs, "drag_drop.js 必须通过事件委托支持动态纸片拖拽与点选"


def test_custom_level_dynamic_solver_and_metrics():
    """验证自定义模式 (如 N=10, maxTile=6) 动态自动求解极值、评价指标与演示对接"""
    math_js_path = os.path.join(SQUARE_DIR, "js", "math_engine.js")
    state_js_path = os.path.join(SQUARE_DIR, "js", "game_state.js")
    ui_js_path = os.path.join(SQUARE_DIR, "js", "ui.js")

    with open(math_js_path, "r", encoding="utf-8") as f:
        m_code = f.read()
    assert "solveMinTiling" in m_code, "math_engine.js 必须包含 solveMinTiling 动态回溯求解器"
    assert "solvedCache" in m_code, "math_engine.js 必须具备动态求解缓存机制"
    assert "getPreset(n, maxTile" in m_code, "getPreset 必须支持双参数 (N, maxTile)"

    with open(state_js_path, "r", encoding="utf-8") as f:
        s_code = f.read()
    assert "getPreset(this.N, this.maxTile)" in s_code, "game_state.js 必须向 getPreset 传入 this.maxTile"
    assert "this.tiles.length < minOptimal" in s_code, "必须具备已完成拼图时理论极值防穿透安全保护"

    with open(ui_js_path, "r", encoding="utf-8") as f:
        u_code = f.read()
    assert "getPreset(state.N, state.maxTile)" in u_code, "ui.js handleDemoClick 必须支持自定义规格最优解演示"

    # 执行 Node.js 集成测试
    node_test_script = """
    const fs = require('fs');
    const win = { dispatchEvent: () => {} };
    global.window = win;
    global.CustomEvent = class {};

    const mathCode = fs.readFileSync('boardgame/square/js/math_engine.js', 'utf8');
    eval(mathCode);
    const stateCode = fs.readFileSync('boardgame/square/js/game_state.js', 'utf8');
    eval(stateCode);

    const math = win.SquareMathEngine;
    const state = win.SquareGameState;

    // 1. 自定义 10x10, max=6 动态求解
    const p10_6 = math.getPreset(10, 6);
    if (p10_6.minCount !== 4) process.exit(10);
    if (!p10_6.solution || p10_6.solution.length !== 4) process.exit(11);

    // 2. 默认 10x10, max=4
    const p10_4 = math.getPreset(10, 4);
    if (p10_4.minCount !== 11) process.exit(12);

    // 3. state 指标联动
    state.initLevel(10, 6);
    let m = state.getMetrics();
    if (m.minOptimal !== 4) process.exit(13);

    // 4. 8 块拼满 (包含 6x6) 时的指标判定：8 块虽然完成，但理论最优为 4 块，应评 1 星
    state.placeTile(0, 0, 6);
    state.placeTile(0, 6, 4);
    state.placeTile(4, 6, 2);
    state.placeTile(4, 8, 2);
    state.placeTile(6, 0, 4);
    state.placeTile(6, 4, 4);
    state.placeTile(6, 8, 2);
    state.placeTile(8, 8, 2);
    m = state.getMetrics();
    if (!m.isComplete || m.tileCount !== 8 || m.minOptimal !== 4 || m.isOptimal || m.starRating !== 1) {
      process.exit(14);
    }

    // 5. 4 块拼满 (四块 5x5) 达成极值
    state.initLevel(10, 6);
    state.placeTile(0, 0, 5);
    state.placeTile(0, 5, 5);
    state.placeTile(5, 0, 5);
    state.placeTile(5, 5, 5);
    m = state.getMetrics();
    if (!m.isComplete || m.tileCount !== 4 || m.minOptimal !== 4 || !m.isOptimal || m.starRating !== 3) {
      process.exit(15);
    }

    process.exit(0);
    """
    res = subprocess.run(["node", "-e", node_test_script], cwd=os.path.abspath(os.path.join(SQUARE_DIR, "..", "..")), capture_output=True, text=True)
    assert res.returncode == 0, f"Node.js 动态求解测试失败，退出码: {res.returncode}, stderr: {res.stderr}"




