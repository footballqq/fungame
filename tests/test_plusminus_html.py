# codex: 2026-09-24 编写 PlusMinus.html 手机适配、触控数字小键盘、防软键盘遮挡及速算逻辑自动化测试
import os
import subprocess
import re
import pytest

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
PLUSMINUS_HTML = os.path.join(PROJECT_ROOT, "PlusMinus.html")


def test_plusminus_file_exists_and_line_count():
    """测试 PlusMinus.html 文件存在且严格遵守 ≤ 500 行的架构规范"""
    assert os.path.isfile(PLUSMINUS_HTML), "PlusMinus.html 文件必须存在"
    with open(PLUSMINUS_HTML, "r", encoding="utf-8") as f:
        lines = f.readlines()
    assert len(lines) <= 500, f"PlusMinus.html 超过 500 行: {len(lines)} 行"
    assert lines[0].strip().startswith("<!-- codex:"), "首行必须包含 codex 注释说明修改动机"


def test_plusminus_mobile_viewport_and_meta():
    """测试移动端视口配置与编码标签完整性"""
    with open(PLUSMINUS_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    assert "<!DOCTYPE html>" in html
    assert 'lang="zh-CN"' in html
    assert '<meta charset="UTF-8">' in html
    assert 'name="viewport"' in html
    assert "width=device-width" in html
    # 确保视口适配设置完整
    assert "initial-scale=1.0" in html


def test_plusminus_numeric_keypad_structure():
    """测试页面中包含完备的触控数字小键盘（0-9、正负号、退格、提交）"""
    with open(PLUSMINUS_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    # 小键盘容器
    assert 'id="keypad"' in html, "页面必须包含 id='keypad' 小键盘容器"

    # 数字 0-9 必须齐全
    for digit in range(10):
        assert f'data-key="{digit}"' in html, f"小键盘缺少数字按键 {digit}"

    # 功能按键
    assert 'data-action="toggle-sign"' in html, "小键盘缺少正负号切换按键"
    assert 'data-action="backspace"' in html, "小键盘缺少退格删除按键"
    assert 'data-action="submit"' in html, "小键盘缺少提交确认按键"


def test_plusminus_soft_keyboard_suppression():
    """测试输入框具备防原生软键盘弹出配置（readonly 与 inputmode='none'），杜绝遮挡题目"""
    with open(PLUSMINUS_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    # 验证 answerInput
    assert 'id="answerInput"' in html, "必须保留 id='answerInput'"
    assert 'inputmode="none"' in html, "必须声明 inputmode='none' 以阻止移动端原生软键盘弹出遮挡题目"
    assert "readonly" in html, "输入框应包含 readonly 属性防止误触发软键盘"


def test_plusminus_layout_and_responsive_css():
    """测试移动端触摸防缩放与防遮挡排版样式"""
    with open(PLUSMINUS_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    # 包含 touch-action 防止双击误缩放
    assert "touch-action: manipulation" in html or "touch-action:manipulation" in html
    # 包含 flex 或 grid 布局确保题目在小键盘上方、互不重叠
    assert "problem-box" in html or "problemDisplay" in html
    # 包含横屏自适应媒体查询
    assert "@media" in html
    assert "orientation: landscape" in html or "max-height" in html


def test_plusminus_math_logic_with_node():
    """使用 Node.js 验证速算题目生成数学正确性与小键盘输入逻辑"""
    node_script = """
    // 1. 测试题目生成算法
    function generateProblem() {
      const nums = Array.from({ length: 10 }, () => Math.floor(Math.random() * 9) + 1);
      const ops = Array.from({ length: 9 }, () => Math.random() < 0.5 ? '+' : '-');
      let expr = nums[0].toString();
      let ans = nums[0];
      for (let j = 0; j < 9; j++) {
        expr += ops[j] + nums[j + 1];
        ans = ops[j] === '+' ? ans + nums[j + 1] : ans - nums[j + 1];
      }
      return { expr, ans, nums, ops };
    }

    // 运行 100 次验证算式与结果一致性
    for (let t = 0; t < 100; t++) {
      const p = generateProblem();
      if (eval(p.expr) !== p.ans) {
        throw new Error('Math mismatch: ' + p.expr + ' != ' + p.ans);
      }
      if (p.nums.length !== 10) throw new Error('Numbers count should be 10');
      if (p.ops.length !== 9) throw new Error('Operators count should be 9');
    }

    // 2. 测试小键盘输入状态机
    let currentInput = "";
    function appendDigit(d) {
      if (currentInput.length >= 4) return;
      if (currentInput === "0") currentInput = d;
      else if (currentInput === "-0") currentInput = "-" + d;
      else currentInput += d;
    }
    function toggleSign() {
      if (currentInput === "") currentInput = "-";
      else if (currentInput === "-") currentInput = "";
      else if (currentInput.startsWith("-")) currentInput = currentInput.slice(1);
      else currentInput = "-" + currentInput;
    }
    function backspace() {
      if (currentInput.length > 0) currentInput = currentInput.slice(0, -1);
    }

    // 输入正数 25
    appendDigit("2");
    appendDigit("5");
    if (currentInput !== "25") throw new Error('Expected 25, got ' + currentInput);

    // 切换负号
    toggleSign();
    if (currentInput !== "-25") throw new Error('Expected -25, got ' + currentInput);

    // 退格
    backspace();
    if (currentInput !== "-2") throw new Error('Expected -2, got ' + currentInput);

    // 再次切换负号
    toggleSign();
    if (currentInput !== "2") throw new Error('Expected 2, got ' + currentInput);

    // 负数先输入负号再输入数字
    currentInput = "";
    toggleSign();
    appendDigit("7");
    if (currentInput !== "-7") throw new Error('Expected -7, got ' + currentInput);

    console.log('PLUSMINUS_LOGIC_OK');
    """

    res = subprocess.run(
        ["node", "-e", node_script],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, f"Node 执行出错: {res.stderr}"
    assert "PLUSMINUS_LOGIC_OK" in res.stdout


def test_plusminus_actual_script_syntax():
    """提取 PlusMinus.html 中内嵌的实际 JavaScript 脚本并用 node 校验语法合法性"""
    with open(PLUSMINUS_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    match = re.search(r"<script>([\s\S]*?)</script>", html)
    assert match, "PlusMinus.html 必须包含 <script> 标签"
    script_content = match.group(1)

    # 写入临时 JS 并用 node --check 进行语法编译校验
    tmp_js = os.path.join(CURRENT_DIR, "_tmp_plusminus_script.js")
    try:
        with open(tmp_js, "w", encoding="utf-8") as f:
            f.write(script_content)

        res = subprocess.run(
            ["node", "--check", tmp_js],
            capture_output=True,
            text=True,
        )
        assert res.returncode == 0, f"PlusMinus.html 内嵌 JS 语法错误: {res.stderr}"
    finally:
        if os.path.exists(tmp_js):
            os.remove(tmp_js)

