# codex: 2026-11-13 4x4网格折纸游戏算法、求解器与前端页面资源完整性自动化测试

import sys
import os
from pathlib import Path
import pytest

# 添加项目路径
ROOT_DIR = Path(__file__).resolve().parent.parent
FOLD_DIR = ROOT_DIR / "math" / "fold"
sys.path.insert(0, str(FOLD_DIR))

from fold_math import (
    TARGET_THICKNESSES,
    get_initial_squares,
    compute_thickness,
    apply_fold,
    get_available_folds,
    find_all_thicknesses_and_solutions,
    prove_theorem,
)


def test_initial_state():
    """测试初始纸片状态"""
    squares = get_initial_squares()
    assert len(squares) == 16
    thick, counts = compute_thickness(squares)
    assert thick == 1
    assert len(counts) == 16
    for pos, count in counts.items():
        assert count == 1


def test_single_fold():
    """测试单次折叠：沿 x=1 从左向右翻折"""
    squares = get_initial_squares()
    folded = apply_fold(squares, 'v', 1, 'L->R')
    thick, counts = compute_thickness(folded)
    assert thick == 2
    # 宽度从 4 列变为 3 列 (x=0, 1, 2)
    xs = set(sq["x"] for sq in folded)
    assert xs == {0, 1, 2}


def test_all_9_thicknesses():
    """测试定理：可达厚度严格为 9 种，且为 [1, 2, 3, 4, 6, 8, 9, 12, 16]"""
    result = prove_theorem()
    assert result["is_exact_match"] is True
    assert result["count"] == 9
    assert result["found_thicknesses"] == [1, 2, 3, 4, 6, 8, 9, 12, 16]


def test_impossible_thicknesses():
    """测试非定理厚度（如 5, 7, 10, 11, 13, 14, 15）不可能出现"""
    result = prove_theorem()
    found = set(result["found_thicknesses"])
    for imp in [5, 7, 10, 11, 13, 14, 15]:
        assert imp not in found, f"厚度 {imp} 本应不可达，但却被错误发现"


def test_solver_step_execution():
    """验证求解器生成的每个厚度路径确实能准确复现该厚度"""
    solutions = find_all_thicknesses_and_solutions()
    for thick in TARGET_THICKNESSES:
        assert thick in solutions
        steps = solutions[thick]
        sq = get_initial_squares()
        for axis, line, direction, _ in steps:
            sq = apply_fold(sq, axis, line, direction)
        achieved_thick, _ = compute_thickness(sq)
        assert achieved_thick == thick, f"对于目标厚度 {thick}，按步序执行后得到 {achieved_thick}"


def test_file_structure_exists():
    """验证游戏主目录和核心资源文件完备性"""
    assert FOLD_DIR.exists()
    assert (FOLD_DIR / "e74280bc1323bf78c7447036ffdafa73.jpg").exists()
    assert (FOLD_DIR / "index.html").exists()
    assert (FOLD_DIR / "README.md").exists()

    # JS 文件
    for js_file in ["fold_math.js", "solver.js", "audio.js", "skins.js", "praise.js", "demo.js", "ui.js"]:
        p = FOLD_DIR / "js" / js_file
        assert p.exists(), f"缺少 JS 文件: {js_file}"
        assert p.stat().st_size > 0, f"JS 文件为空: {js_file}"

    # CSS 文件
    for css_file in ["style.css", "board.css", "modal.css", "animations.css"]:
        p = FOLD_DIR / "css" / css_file
        assert p.exists(), f"缺少 CSS 文件: {css_file}"
        assert p.stat().st_size > 0, f"CSS 文件为空: {css_file}"


def test_html_content_integrity():
    """测试 HTML 文件中引用的核心元素与原题图片"""
    html_path = FOLD_DIR / "index.html"
    content = html_path.read_text(encoding="utf-8")

    # 包含原题图片引用
    assert "e74280bc1323bf78c7447036ffdafa73.jpg" in content
    # 包含所有核心容器
    assert 'id="paperBoard"' in content
    assert 'id="paperBoardContainer"' in content
    assert 'id="currentThickness"' in content
    assert 'id="thicknessBadgeTrack"' in content
    assert 'id="layerInspector"' in content
    # 包含弹窗
    assert 'id="ruleModal"' in content
    assert 'id="proofModal"' in content
    assert 'id="skinModal"' in content
    assert 'id="winModal"' in content


def test_math_formula_formatting_no_raw_latex():
    """验证 HTML 中杜绝未渲染的 raw LaTeX 标记（如 \\text, \\times, \\le, $$），确保呈现为 MathType 式排版"""
    html_path = FOLD_DIR / "index.html"
    content = html_path.read_text(encoding="utf-8")

    forbidden_patterns = [
        r"\\text\{",
        r"\\times",
        r"\\le\b",
        r"\\ge\b",
        r"\$\$.*?\$\$",
    ]
    import re
    for pattern in forbidden_patterns:
        match = re.search(pattern, content)
        assert not match, f"HTML 中不应含有未解析的 raw LaTeX 标记: {pattern} (发现: {match})"

    # 验证包含优雅的 MathType 风格数学符号与公式
    assert "<em>T</em><sub>x</sub> × <em>T</em><sub>y</sub>" in content, "应使用标准乘号 × 与下标渲染公式"
    assert "1 ≤ <em>T</em><sub>x</sub>, <em>T</em><sub>y</sub> ≤ 4" in content, "应使用标准数学不等号 ≤"


def test_blind_mode_and_clear_collection_support():
    """验证包含盲盒防剧透探索模式、明牌全图鉴切换按键与清空收集确认弹窗"""
    html_path = FOLD_DIR / "index.html"
    content = html_path.read_text(encoding="utf-8")

    # 包含双模式切换按键
    assert 'id="btnModeBlind"' in content, "必须包含盲盒探索模式按键 #btnModeBlind"
    assert 'id="btnModeCodex"' in content, "必须包含明牌全图鉴模式按键 #btnModeCodex"

    # 包含清空收集按键与模态弹窗
    assert 'id="btnClearCollection"' in content, "必须包含清空收集按键 #btnClearCollection"
    assert 'id="clearConfirmModal"' in content, "必须包含清空确认弹窗 #clearConfirmModal"
    assert 'id="btnConfirmClear"' in content, "必须包含确认清空按键 #btnConfirmClear"

    # JS 中包含模式持久化与清空收集接口
    praise_js = (FOLD_DIR / "js" / "praise.js").read_text(encoding="utf-8")
    assert "setMode" in praise_js
    assert "resetUnlocked" in praise_js
    assert "fold_game_mode" in praise_js


