# codex: 2026-09-13 verify pyxorDittle rules translation HTML and assets integrity
import os
import re
from PIL import Image

BASE_DIR = r"E:\users\kpan\BaiduSyncdisk\program\aigc\fungame\boardgame\tzarr"

def test_html_files_exist():
    html_path = os.path.join(BASE_DIR, "pyxorDittle_rules_zh.html")
    assert os.path.exists(html_path), "pyxorDittle_rules_zh.html should exist"
    assert os.path.getsize(html_path) > 1000, "HTML should have substantive content"

def test_css_exists():
    css_path = os.path.join(BASE_DIR, "pyxorDittle_files", "style.css")
    assert os.path.exists(css_path), "pyxorDittle_files/style.css should exist"
    assert os.path.getsize(css_path) > 100, "CSS should not be empty"

def test_all_referenced_images_exist_and_valid():
    html_path = os.path.join(BASE_DIR, "pyxorDittle_rules_zh.html")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all img src attributes
    img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content)
    assert len(img_srcs) >= 8, f"Expected at least 8 image references, found {len(img_srcs)}"

    for src in img_srcs:
        # Convert relative path to absolute
        abs_img_path = os.path.normpath(os.path.join(BASE_DIR, src))
        assert os.path.exists(abs_img_path), f"Image file does not exist: {abs_img_path}"
        assert os.path.getsize(abs_img_path) > 0, f"Image file is empty: {abs_img_path}"

        # Test image can be opened and decoded
        with Image.open(abs_img_path) as im:
            assert im.width > 0 and im.height > 0, f"Invalid image dimensions for {abs_img_path}"

def test_rule_sections_completeness():
    html_path = os.path.join(BASE_DIR, "pyxorDittle_rules_zh.html")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify key terminology and translated concepts
    required_keywords = [
        "7×7",
        "白色",
        "黑色",
        "底线",  # Base Row
        "翻滚",  # Tilt
        "跳跃",  # Jump
        "翻滚并跳跃",  # Tilt & Jump
        "禁止",  # You Cannot
        "对角线",
        "Dittle Clash",  # Variant
        "碰撞",
        "同归于尽",  # Elimination
        "PocketMod"  # Folding guide
    ]

    for kw in required_keywords:
        assert kw in content, f"Missing critical keyword in translation: {kw}"

def test_anti_stalling_and_clash_win_rules():
    html_path = os.path.join(BASE_DIR, "pyxorDittle_rules_zh.html")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Exception rules: anti-stalling, 10-point penalty, clash single die win
    assert "例外情况处理" in content, "Should have exception rule section"
    assert "扣除 10 分" in content or "扣 10 分" in content, "Should mention 10 point penalty per unmoved home die"
    assert "底线填满" in content and "对手棋子" in content, "Should mention base row full with opponent die ends game"
    assert "任意 1 颗骰子成功抵达" in content, "Should explicitly confirm single die arrival wins in Clash variant"

def test_print_mode_support():
    html_path = os.path.join(BASE_DIR, "pyxorDittle_rules_zh.html")
    css_path = os.path.join(BASE_DIR, "pyxorDittle_files", "style.css")
    
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    # Check print button and script in HTML
    assert "togglePrintMode" in html_content, "Should contain togglePrintMode function"
    assert "切换为纯黑白打印版" in html_content, "Should contain print toggle button"
    assert "window.print()" in html_content, "Should contain print invocation"

    # Check print styles in CSS
    assert "body.print-mode" in css_content, "CSS should contain print-mode styles"
    assert "@media print" in css_content, "CSS should contain media print query"
