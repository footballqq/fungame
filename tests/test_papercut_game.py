# codex: 2026-11-24 扩充 2x2~25x25 剪正方形挑战自动化测试，覆盖全边长最优解校验、JS动态引擎、手机平板适配与防剧透
"""N×N (2..25) 剪正方形网页游戏 (math/papercut) 全面自动化测试。"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PAPERCUT_DIR = ROOT_DIR / "math" / "papercut"

if str(PAPERCUT_DIR) not in sys.path:
    sys.path.insert(0, str(PAPERCUT_DIR))

import papercut_math as pm  # noqa: E402

# OEIS A005670 严格理论最少片数表 (N = 2..25)
EXPECTED_OPTIMAL_COUNTS = {
    2: 4, 3: 6, 4: 4, 5: 8, 6: 4, 7: 9, 8: 4, 9: 6, 10: 4,
    11: 11, 12: 4, 13: 11, 14: 4, 15: 6, 16: 4, 17: 12, 18: 4,
    19: 13, 20: 4, 21: 6, 22: 4, 23: 13, 24: 4, 25: 8,
}


def test_required_files_exist_and_nonempty():
    expected = [
        PAPERCUT_DIR / "index.html",
        PAPERCUT_DIR / "papercut_math.py",
        PAPERCUT_DIR / "css" / "style.css",
        PAPERCUT_DIR / "css" / "board.css",
        PAPERCUT_DIR / "css" / "modal.css",
        PAPERCUT_DIR / "css" / "animations.css",
        PAPERCUT_DIR / "js" / "papercut_math.js",
        PAPERCUT_DIR / "js" / "lessons.js",
        PAPERCUT_DIR / "js" / "audio.js",
        PAPERCUT_DIR / "js" / "skins.js",
        PAPERCUT_DIR / "js" / "praise.js",
        PAPERCUT_DIR / "js" / "guide.js",
        PAPERCUT_DIR / "js" / "ui.js",
    ]
    for path in expected:
        assert path.exists(), f"缺少必需文件: {path}"
        assert path.stat().st_size > 0, f"文件为空: {path}"


def test_all_sizes_2_to_25_optimal_solutions_valid():
    for n, expected_cnt in EXPECTED_OPTIMAL_COUNTS.items():
        sol = pm.get_optimal_solution(n)
        ok, msg = pm.validate_tiling(sol, board_size=n)
        assert ok, f"N={n} 最优解校验失败: {msg}"
        assert len(sol) == expected_cnt, (
            f"N={n} 最优片数应为 {expected_cnt}，实为 {len(sol)}"
        )


def test_teaching_trap_solutions_are_valid():
    trap10 = pm.build_max10_trap_solution()
    ok10, msg10 = pm.validate_tiling(trap10, board_size=11)
    assert ok10, f"10x10陷阱方案校验失败: {msg10}"
    assert len(trap10) == 22

    trap5 = pm.build_four5_trap_solution()
    ok5, msg5 = pm.validate_tiling(trap5, board_size=11)
    assert ok5, f"四角5x5陷阱方案校验失败: {msg5}"
    assert len(trap5) == 25


def test_validator_rejects_invalid_tilings():
    ok, _ = pm.validate_tiling([{"row": 0, "col": 0, "size": 11}], board_size=11)
    assert not ok

    ok, _ = pm.validate_tiling(
        [{"row": 0, "col": 0, "size": 6}, {"row": 5, "col": 5, "size": 2}],
        board_size=11,
    )
    assert not ok

    ok, _ = pm.validate_tiling([{"row": 8, "col": 8, "size": 4}], board_size=11)
    assert not ok


def test_html_anti_spoiler_selector_and_mobile_adaptation():
    html = (PAPERCUT_DIR / "index.html").read_text(encoding="utf-8")
    style_css = (PAPERCUT_DIR / "css" / "style.css").read_text(encoding="utf-8")
    board_css = (PAPERCUT_DIR / "css" / "board.css").read_text(encoding="utf-8")

    # 边长选择器、缩放控制与触控 HUD
    assert 'id="boardSizeSelect"' in html
    assert 'id="dragHudPill"' in html
    assert 'id="btnZoomIn"' in html
    assert 'viewport-fit=cover' in html

    # 明确游戏目的与分步教学面板
    assert "mission-banner" in html
    assert 'id="guidePanel"' in html
    assert 'id="btnToggleGuide"' in html

    # 防剧透护盾：题解内容默认 hidden
    assert 'id="proofSpoilerShield"' in html
    assert 'id="proofRevealContent" class="proof-content hidden"' in html

    # 移动端与平板响应式规则
    assert "100dvh" in style_css
    assert "@media (max-width: 1024px)" in style_css
    assert "@media (max-width: 680px)" in style_css
    assert "touch-action: none" in board_css

    # 严禁 raw LaTeX 残留
    for bad in ("$$", r"\times", r"\le", r"\ge", r"\lceil"):
        assert bad not in html, f"发现未转换的 raw LaTeX 标记: {bad}"

    # 检查引用的所有本地 CSS 和 JS 均真实存在
    refs = re.findall(r'(?:href|src)="((?:css|js)/[^"?]+)', html)
    assert len(refs) >= 10
    for rel in refs:
        assert (PAPERCUT_DIR / rel).exists(), f"HTML 引用资源不存在: {rel}"


def test_js_no_native_alert_or_confirm():
    for js_file in (PAPERCUT_DIR / "js").glob("*.js"):
        text = js_file.read_text(encoding="utf-8")
        assert not re.search(r"\b(?:alert|confirm)\s*\(", text), (
            f"禁止使用原生 alert/confirm: {js_file.name}"
        )


def test_js_engine_and_all_sizes_via_node():
    expected_json = json.dumps(EXPECTED_OPTIMAL_COUNTS)
    script = f"""
    const {{ PaperCutEngine }} = require({json.dumps(str(PAPERCUT_DIR / 'js' / 'papercut_math.js'))});
    const {{
        getOptimalStepsForSize,
        getGuidedLessonsForSize,
        buildProofHtmlForSize
    }} = require({json.dumps(str(PAPERCUT_DIR / 'js' / 'lessons.js'))});

    const expected = {expected_json};

    // 遍历验证 N = 2..25 的最优解、启发课程与题解 HTML
    for (let n = 2; n <= 25; n++) {{
        const eng = new PaperCutEngine(n);
        const steps = getOptimalStepsForSize(n);
        if (steps.length !== expected[String(n)]) {{
            throw new Error(`N=${{n}} expected ${{expected[String(n)]}} got ${{steps.length}}`);
        }}
        for (const s of steps) {{
            const r = eng.placePiece(s.row, s.col, s.size);
            if (!r.ok) throw new Error(`N=${{n}} placement failed: ${{r.reason}}`);
        }}
        const st = eng.getStats();
        if (!st.isComplete || st.coveredArea !== n * n) {{
            throw new Error(`N=${{n}} incomplete: ` + JSON.stringify(st));
        }}

        // 验证动态启发课程可合法加载
        const lessons = getGuidedLessonsForSize(n);
        if (lessons.length < 2) throw new Error(`N=${{n}} too few lessons`);
        for (const les of lessons) {{
            const e2 = new PaperCutEngine(n);
            for (const p of les.layout) {{
                const res = e2.placePiece(p.row, p.col, p.size, false);
                if (!res.ok) throw new Error(`N=${{n}} lesson ${{les.id}} invalid: ${{res.reason}}`);
            }}
        }}

        // 验证动态题解 HTML 无 raw LaTeX
        const html = buildProofHtmlForSize(n);
        if (html.includes('$$') || html.includes('\\\\times')) {{
            throw new Error(`N=${{n}} proof HTML contains raw LaTeX`);
        }}
    }}

    // 验证对称提示在大质数棋盘 (17x17) 同样生效
    const eng17 = new PaperCutEngine(17);
    const opt17 = getOptimalStepsForSize(17);
    eng17.placePiece(0, 8, 9); // 镜像放置 9x9 在右上角
    const hint17 = eng17.findCompatibleOptimalNextStep(opt17);
    if (!hint17 || hint17.size !== 8) {{
        throw new Error('17x17 symmetry hint failed: ' + JSON.stringify(hint17));
    }}

    console.log('NODE_ALL_25_OK');
    """
    proc = subprocess.run(
        ["node", "-e", script],
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0, f"Node 校验失败:\n{proc.stderr}\n{proc.stdout}"
    assert "NODE_ALL_25_OK" in proc.stdout
