# -*- coding: utf-8 -*-
"""维京王者之棋 (Hnefatafl) 自动化测试套件"""
import os
import subprocess
from bs4 import BeautifulSoup

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME_DIR = os.path.join(PROJECT_ROOT, "boardgame", "hnefatafl")
INDEX_HTML = os.path.join(PROJECT_ROOT, "index.html")


def run_node(script: str):
    res = subprocess.run(
        ["node", "-e", script],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert res.returncode == 0, f"Node 失败:\n{res.stdout}\n{res.stderr}"
    return res.stdout.strip()


def test_hnefatafl_files_and_syntax():
    required = [
        "index.html",
        "AI_BENCHMARK.md",
        "bench_ai.js",
        os.path.join("css", "style.css"),
        os.path.join("js", "engine.js"),
        os.path.join("js", "ai.js"),
        os.path.join("js", "tutorial.js"),
        os.path.join("js", "audio.js"),
        os.path.join("js", "app.js"),
        os.path.join("assets", "images", "hnefatafl_viking.jpg"),
    ]
    for rel in required:
        assert os.path.isfile(os.path.join(GAME_DIR, rel)), f"缺失文件: {rel}"

    with open(os.path.join(GAME_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()
    for bad in ["$$", "\\times", "alert(", "confirm("]:
        assert bad not in html

    for jf in ["engine.js", "ai.js", "tutorial.js", "audio.js", "app.js"]:
        res = subprocess.run(["node", "--check", os.path.join(GAME_DIR, "js", jf)], capture_output=True, text=True)
        assert res.returncode == 0, res.stderr


def test_hnefatafl_rules_tutorial_and_ai():
    script = r"""
    const assert = require('assert');
    const E = require('./boardgame/hnefatafl/js/engine.js');
    const AI = require('./boardgame/hnefatafl/js/ai.js');
    const Tut = require('./boardgame/hnefatafl/js/tutorial.js');

    // 1. 7x7 与 9x9 初始子力校验
    const s7 = E.createInitialState(7);
    assert.strictEqual(s7.board[3][3], E.KING);
    const s9 = E.createInitialState(9);
    assert.strictEqual(s9.board[4][4], E.KING);

    // 2. 验证全部 4 步教学可顺利通关
    let sess = Tut.createSession();
    for (let i = 0; i < 4; i++) {
      const mv = {
        fromR: sess.step.expectedFrom.r,
        fromC: sess.step.expectedFrom.c,
        toR: sess.step.expectedTo.r,
        toC: sess.step.expectedTo.c
      };
      const r = Tut.applyTutorialMove(sess, mv);
      assert.strictEqual(r.ok, true, `教学第 ${i + 1} 步失败`);
      sess = r.session;
      if (i < 3) sess = Tut.nextTutorialStep(sess);
    }
    assert.strictEqual(sess.finished, true);

    // 3. 验证 AI 完整对局无报错
    let st = E.createInitialState(7);
    for (let t = 0; t < 40 && !st.winner; t++) {
      const mv = AI.chooseMove(st, st.currentPlayer === 2 ? 'master' : 'normal');
      assert.ok(mv);
      st = E.applyMove(st, mv).state;
    }
    console.log('OK');
    """
    assert run_node(script) == "OK"


def test_hnefatafl_in_root_index():
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
    link = soup.find("a", href="boardgame/hnefatafl/index.html")
    assert link is not None
    card = link.find_parent("div", class_="game-card")
    assert card.get("data-category") == "boardgame"
