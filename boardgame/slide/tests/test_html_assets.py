# codex: 2026-09-14 编写前端静态资源完整性与模块依赖的自动化测试
"""
测试前端静态文件：HTML 结构、DOM 元素 ID、模块 import 依赖完整性
"""

import os
import re


def test_html_contains_critical_dom_elements():
    """验证 index.html 中包含了所有 UI 控制与渲染必须的 DOM 元素"""
    html_path = os.path.join(os.path.dirname(__file__), "..", "index.html")
    assert os.path.isfile(html_path)

    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    required_ids = [
        "board-svg",
        "layer-tiles",
        "layer-indicators",
        "layer-pieces",
        "layer-fx",
        "turn-banner",
        "turn-step-desc",
        "btn-new-game",
        "btn-undo",
        "btn-redo",
        "btn-rules",
        "btn-toggle-sound",
        "select-mode",
        "select-diff",
        "select-win-rule",
        "check-coords",
        "modal-rules",
        "modal-win",
        "win-title",
        "win-desc",
        "btn-win-restart",
        "btn-win-close"
    ]

    for elem_id in required_ids:
        assert f'id="{elem_id}"' in content, f"缺少关键 DOM 元素 ID: {elem_id}"


def test_javascript_imports_resolve():
    """验证所有 js 文件中的 import 引用路径均实际存在"""
    js_dir = os.path.join(os.path.dirname(__file__), "..", "js")
    for fname in os.listdir(js_dir):
        if fname.endswith(".js"):
            fpath = os.path.join(js_dir, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                code = f.read()

            # 匹配 import ... from './xxx.js'
            matches = re.findall(r"from\s+['\"](\./[^'\"]+)['\"]", code)
            for m in matches:
                target = os.path.normpath(os.path.join(js_dir, m))
                assert os.path.isfile(target), f"文件 {fname} 引用了不存在的模块: {m}"
