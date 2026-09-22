# codex: 2026-09-22 编写针对青蛙跳跃(jumpfrog)网页游戏HTML骨架、资源引用与JavaScript引擎集成测试
import os
import subprocess
import pytest

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
JUMPFROG_DIR = os.path.join(PROJECT_ROOT, "boardgame", "jumpfrog")
INDEX_HTML = os.path.join(JUMPFROG_DIR, "index.html")
JPG_PATH = os.path.join(JUMPFROG_DIR, "jumpfrog.jpg")


def test_jumpfrog_files_exist():
    """测试所有关键资源与页面文件均存在"""
    assert os.path.isfile(INDEX_HTML), "index.html 必须存在"
    assert os.path.isfile(JPG_PATH), "jumpfrog.jpg 原题图片必须存在"

    css_files = ["animations.css", "style.css", "modal.css"]
    for css in css_files:
        path = os.path.join(JUMPFROG_DIR, "css", css)
        assert os.path.isfile(path), f"CSS 文件缺失: {css}"

    js_files = [
        "game_state.js",
        "solver.js",
        "skins.js",
        "audio.js",
        "praise.js",
        "demo.js",
        "ui.js",
    ]
    for js in js_files:
        path = os.path.join(JUMPFROG_DIR, "js", js)
        assert os.path.isfile(path), f"JS 模块缺失: {js}"


def test_file_line_count_within_limit():
    """测试所有源文件严格遵守单文件 ≤ 500 行的架构规范"""
    check_paths = [
        INDEX_HTML,
        os.path.join(JUMPFROG_DIR, "jumpfrog_math.py"),
        os.path.join(JUMPFROG_DIR, "css", "style.css"),
        os.path.join(JUMPFROG_DIR, "css", "modal.css"),
        os.path.join(JUMPFROG_DIR, "css", "animations.css"),
    ]
    for js_name in [
        "game_state.js",
        "solver.js",
        "skins.js",
        "audio.js",
        "praise.js",
        "demo.js",
        "ui.js",
    ]:
        check_paths.append(os.path.join(JUMPFROG_DIR, "js", js_name))

    for path in check_paths:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        assert len(lines) <= 500, f"文件 {os.path.basename(path)} 超过500行: {len(lines)}行"


def test_html_structure_and_elements():
    """测试 HTML 内容结构、元信息与核心UI挂载点"""
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    # 基础文档信息
    assert "<!DOCTYPE html>" in html
    assert 'lang="zh-CN"' in html
    assert '<meta charset="UTF-8">' in html
    assert 'name="viewport"' in html
    assert "jumpfrog.jpg" in html, "必须包含原题图片引用"

    # 核心容器与挂载点
    required_ids = [
        "pondSlots",
        "moveCount",
        "stepLimit",
        "optimalSteps",
        "btnUndo",
        "btnHint",
        "btnReset",
        "btnToggleDemo",
        "demoPanel",
        "btnDemoPlay",
        "btnDemoPrev",
        "btnDemoNext",
        "demoExplain",
        "mascotText",
        "ruleModal",
        "skinModal",
        "settingsModal",
        "winModal",
        "praiseToast",
    ]
    for elem_id in required_ids:
        assert f'id="{elem_id}"' in html, f"HTML 缺少必要元素 ID: {elem_id}"


def test_javascript_node_integration():
    """使用 Node.js 运行集成测试，验证 JavaScript 核心模块逻辑无误"""
    node_script = """
    const { JumpFrogGameState, EMPTY, WHITE, BLACK } = require('./js/game_state.js');
    const { JumpFrogSolver } = require('./js/solver.js');
    const { FROG_SKINS, SkinManager } = require('./js/skins.js');
    const { FrogPraiseSystem } = require('./js/praise.js');

    // 1. 状态机与移动
    const state = new JumpFrogGameState(3, 3, 'left', true);
    if (state.board.length !== 7) throw new Error('Board length should be 7');
    if (state.board[0] !== EMPTY) throw new Error('Slot 0 should be empty');

    // 移动第1格白蛙进驻第0格
    const moveRes = state.makeMove(1);
    if (!moveRes || moveRes.type !== 'slide') throw new Error('Move should be slide');
    if (state.moveCount !== 1) throw new Error('Move count should be 1');

    // 撤销
    const undoRes = state.undo();
    if (!undoRes || state.moveCount !== 0) throw new Error('Undo failed');

    // 2. BFS 求解器
    const initBoard = [EMPTY, WHITE, WHITE, WHITE, BLACK, BLACK, BLACK];
    const tgtBoard = [EMPTY, BLACK, BLACK, BLACK, WHITE, WHITE, WHITE];
    const path = JumpFrogSolver.solve(initBoard, tgtBoard, true);
    if (!path) throw new Error('Solver failed to find path');
    const steps = path.length - 1;
    if (steps !== 17) throw new Error('Optimal steps should be 17, got ' + steps);

    // 提示测试
    const hint = JumpFrogSolver.getHint(initBoard, tgtBoard, true);
    if (!hint || hint.remainingSteps !== 17) throw new Error('Hint calculation error');

    // 3. 皮肤管理
    const sm = new SkinManager();
    if (!sm.getCurrentSkin()) throw new Error('Default skin missing');
    sm.setSkin('meme_pepe');
    if (sm.getCurrentSkin().id !== 'meme_pepe') throw new Error('Set skin failed');

    // 4. 夸奖系统
    const praise = new FrogPraiseSystem();
    const vPraise = praise.getVictoryPraise(17, 20);
    if (vPraise.stars !== 3) throw new Error('17 steps should earn 3 stars');

    console.log('JS_INTEGRATION_OK');
    """

    res = subprocess.run(
        ["node", "-e", node_script],
        cwd=JUMPFROG_DIR,
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, f"Node 执行出错: {res.stderr}"
    assert "JS_INTEGRATION_OK" in res.stdout


def test_root_index_html_contains_jumpfrog_link():
    """测试根目录 index.html 中成功配置了青蛙跳跃游戏入口"""
    root_index = os.path.join(PROJECT_ROOT, "index.html")
    with open(root_index, "r", encoding="utf-8") as f:
        content = f.read()
    assert "boardgame/jumpfrog/index.html" in content, "根目录 index.html 未正确包含青蛙跳跃链接"
    assert "青蛙跳跃" in content

