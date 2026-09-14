# codex: 2026-09-14 新增pytest包装的浏览器全局作用域回归测试（调用Node vm模拟<script>共享全局作用域）
"""
浏览器作用域回归测试：
历史致命 bug 是 JS 文件顶层 var 声明与浏览器全局 const 冲突导致脚本整体失效，
该场景只有 Node CommonJS 测试无法发现，必须模拟浏览器共享全局作用域验证。
本测试调用 tests/verify_browser_scope.js（依赖 Node.js，未安装时跳过）。
"""
import os
import subprocess

import pytest

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
VERIFY_SCRIPT = os.path.join(TESTS_DIR, "verify_browser_scope.js")


def test_js_scripts_load_in_browser_global_scope():
    """全部游戏脚本必须在浏览器共享全局作用域下成功加载且核心类可见"""
    try:
        result = subprocess.run(
            ["node", VERIFY_SCRIPT],
            capture_output=True,
            text=True,
            timeout=60,
            encoding="utf-8",
            errors="replace",
        )
    except FileNotFoundError:
        pytest.skip("Node.js 未安装，跳过浏览器作用域模拟测试")

    assert result.returncode == 0, (
        "浏览器作用域模拟失败（对应真实浏览器中游戏无法初始化的致命bug）:\n"
        f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
    )
    assert "浏览器作用域回归测试全部通过" in result.stdout
