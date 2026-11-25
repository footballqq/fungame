# -*- coding: utf-8 -*-
"""非洲播棋 (Mancala / Kalah) 自动化测试套件"""
import os
import subprocess
from bs4 import BeautifulSoup

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME_DIR = os.path.join(PROJECT_ROOT, "boardgame", "mancala")
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


def test_mancala_files_and_syntax():
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
        os.path.join("assets", "images", "mancala_africa.jpg"),
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


def test_mancala_rules_tutorial_and_ai():
    script = r"""
    const assert = require('assert');
    const E = require('./boardgame/mancala/js/engine.js');
    const AI = require('./boardgame/mancala/js/ai.js');
    const Tut = require('./boardgame/mancala/js/tutorial.js');

    // 1. 验证全部 4 步教学通关（含额外回合与对坑截胡）
    let sess = Tut.createSession();
    for (let i = 0; i < 4; i++) {
      const r = Tut.applyTutorialMove(sess, sess.step.expectedPit);
      assert.strictEqual(r.ok, true, `播棋教学第 ${i + 1} 步失败`);
      if (i === 0) assert.strictEqual(r.result.extraTurn, true);
      if (i === 1) assert.strictEqual(r.result.captured, 8);
      sess = r.session;
      if (i < 3) sess = Tut.nextTutorialStep(sess);
    }
    assert.strictEqual(sess.finished, true);

    // 2. 验证 10 局完整 AI 对弈（宝石总数恒定为 48 颗，无死锁）
    for (let g = 0; g < 10; g++) {
      let st = E.createInitialState(4);
      let guard = 0;
      while (st.winner === null && guard < 300) {
        guard++;
        const pit = AI.chooseMove(st, st.currentPlayer === 1 ? 'master' : 'normal');
        st = E.applyMove(st, pit).state;
      }
      assert.ok(st.winner !== null);
      assert.strictEqual(st.pits[6] + st.pits[13], 48);
    }
    console.log('OK');
    """
    assert run_node(script) == "OK"


def test_mancala_in_root_index():
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
    link = soup.find("a", href="boardgame/mancala/index.html")
    assert link is not None
    card = link.find_parent("div", class_="game-card")
    assert card.get("data-category") == "boardgame"
