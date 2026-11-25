# -*- coding: utf-8 -*-
"""古埃及双面棋盒（塞尼特棋 Senet + 阿塞布棋 Aseb）自动化测试套件"""
import json
import os
import subprocess
from bs4 import BeautifulSoup
import pytest

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME_DIR = os.path.join(PROJECT_ROOT, "boardgame", "egyptsnt")
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
    assert res.returncode == 0, f"Node 执行失败:\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}"
    return res.stdout.strip()


def test_egyptsnt_files_exist_and_syntax_valid():
    """验证古埃及双面棋盒核心文件完备、无原始 LaTeX 且 JS 语法全部通过 node --check"""
    expected_files = [
        "index.html",
        os.path.join("css", "base.css"),
        os.path.join("css", "boards.css"),
        os.path.join("css", "modals.css"),
        os.path.join("js", "senet-engine.js"),
        os.path.join("js", "aseb-engine.js"),
        os.path.join("js", "tutorial.js"),
        os.path.join("js", "ai.js"),
        os.path.join("js", "audio.js"),
        os.path.join("js", "app.js"),
        "bench_ai.js",
        "AI_BENCHMARK.md",
        os.path.join("assets", "images", "senet_nefertari.jpg"),
        os.path.join("assets", "images", "duat_water_house.jpg"),
        os.path.join("assets", "images", "aseb_trade_route.jpg"),
        "1314eefb-1fcd-4000-8947-95a962dba187.jpg",
        "4b5af1b8-5ae4-45c6-bc7f-84cddee28f0d.jpg",
    ]
    for rel in expected_files:
        full = os.path.join(GAME_DIR, rel)
        assert os.path.isfile(full), f"缺失必要文件: {full}"

    # 校验 HTML 无原始 LaTeX、无原生 alert/confirm，且具备先后手选择器
    with open(os.path.join(GAME_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()
    for bad in ["$$", "\\times", "\\le", "\\ge", "alert(", "confirm("]:
        assert bad not in html, f"index.html 不应包含 {bad}"
    assert 'id="selectSide"' in html, "应包含先后手选择器 #selectSide"
    assert 'id="btnHistory"' in html, "应包含可隐藏的对局记录按钮 #btnHistory"
    assert 'id="modalHistory"' in html, "应包含对局记录弹窗 #modalHistory"
    assert 'id="rulePanelFaqSenet"' in html, "应包含塞尼特 FAQ 面板 #rulePanelFaqSenet"
    assert 'id="rulePanelFaqAseb"' in html, "应包含阿塞布 FAQ 面板 #rulePanelFaqAseb"
    assert 'id="artifactPanelMyth"' in html, "应包含古埃及神话与历史科普面板 #artifactPanelMyth"
    assert 'id="selectWinTarget"' in html, "应包含经典/快速赛制选择器 #selectWinTarget"
    assert 'id="selectSpeed"' in html, "应包含三档动画与 AI 速度选择器 #selectSpeed"

    # 校验所有 JS 文件语法
    js_files = [
        "senet-engine.js",
        "aseb-engine.js",
        "tutorial.js",
        "ai.js",
        "audio.js",
        "app.js",
    ]
    for jf in js_files:
        full = os.path.join(GAME_DIR, "js", jf)
        res = subprocess.run(["node", "--check", full], capture_output=True, text=True)
        assert res.returncode == 0, f"{jf} 语法校验失败: {res.stderr}"


def test_senet_core_rules_and_full_ai_games():
    """验证塞尼特棋核心规则（蛇形坐标、双子保护、三子封锁、26必停、27落水、28-30出盘、完整AI对局无死锁）"""
    script = r"""
    const assert = require('assert');
    const Senet = require('./boardgame/egyptsnt/js/senet-engine.js');
    const AI = require('./boardgame/egyptsnt/js/ai.js');

    // 1. 蛇形坐标往返一致性
    for (let sq = 1; sq <= 30; sq++) {
      const c = Senet.squareToCoords(sq);
      assert.strictEqual(Senet.coordsToSquare(c.row, c.col), sq);
    }
    assert.deepStrictEqual(Senet.squareToCoords(1), { row: 0, col: 0 });
    assert.deepStrictEqual(Senet.squareToCoords(10), { row: 0, col: 9 });
    assert.deepStrictEqual(Senet.squareToCoords(11), { row: 1, col: 9 });
    assert.deepStrictEqual(Senet.squareToCoords(20), { row: 1, col: 0 });
    assert.deepStrictEqual(Senet.squareToCoords(21), { row: 2, col: 0 });
    assert.deepStrictEqual(Senet.squareToCoords(30), { row: 2, col: 9 });

    // 2. 双子防守不可换位 & 三子封锁不可跨越
    let st = Senet.createInitialState();
    st.board.fill(0);
    st.board[10] = 1;
    st.board[12] = 2;
    st.board[13] = 2;
    st.board[14] = 2;
    // 走 2 步到 12（双子保护）不可；走 5 步到 15（跨三子墙）不可
    assert.strictEqual(Senet.getLegalMoves(st, 2, 1).filter(m => m.direction === 1).length, 0);
    assert.strictEqual(Senet.getLegalMoves(st, 5, 1).filter(m => m.direction === 1).length, 0);

    // 3. 第26格必须准确停下，不可从24一步跨过26到28
    st = Senet.createInitialState();
    st.board.fill(0);
    st.board[24] = 1;
    assert.strictEqual(Senet.getLegalMoves(st, 4, 1).filter(m => m.direction === 1).length, 0);
    const m26 = Senet.getLegalMoves(st, 2, 1);
    assert.strictEqual(m26.length, 1);
    assert.strictEqual(m26[0].to, 26);

    // 4. 第27格落水回第15格（若15格被占则退到14格）
    st = Senet.createInitialState();
    st.board.fill(0);
    st.board[26] = 1;
    st.board[15] = 2;
    st.phase = 'move';
    st.lastRoll = { sticks: [1,0,0,0], flatCount: 1, steps: 1, extraTurn: true };
    const waterMove = Senet.getLegalMoves(st, 1, 1)[0];
    assert.strictEqual(waterMove.type, 'water_trap');
    const afterWater = Senet.applyMove(st, waterMove);
    assert.strictEqual(afterWater.board[14], 1);
    assert.strictEqual(afterWater.board[27], 0);

    // 5. 连续模拟 25 局完整 AI vs AI 塞尼特对局，验证全部正常分出胜负无死锁
    let completed = 0;
    for (let g = 0; g < 25; g++) {
      let s = Senet.createInitialState();
      let safety = 0;
      while (!s.winner && safety < 2500) {
        safety++;
        const r = Senet.applyRoll(s);
        s = r.state;
        if (!r.skipped && s.phase === 'move') {
          const mv = AI.chooseMove(s, 'normal');
          assert.ok(mv, '有合法走法时 AI 必须返回走法');
          s = Senet.applyMove(s, mv);
        }
      }
      assert.ok(s.winner === 1 || s.winner === 2, `第 ${g} 局未在步数内结束`);
      assert.strictEqual(s.borneOff[s.winner], 5);
      completed++;
    }
    console.log(JSON.stringify({ completed }));
    """
    out = run_node(script)
    data = json.loads(out)
    assert data["completed"] == 25


def test_aseb_core_rules_and_full_ai_games():
    """验证阿塞布棋核心规则（20格拓扑、击杀退回场外、玫瑰格无敌+再掷、恰好17出盘、完整AI对局无死锁）"""
    script = r"""
    const assert = require('assert');
    const Aseb = require('./boardgame/egyptsnt/js/aseb-engine.js');
    const AI = require('./boardgame/egyptsnt/js/ai.js');

    // 1. 验证有效盘面严格为 20 格
    let validCount = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 12; c++) {
        if (Aseb.isValidCell(r, c)) validCount++;
      }
    }
    assert.strictEqual(validCount, 20);

    // 2. 验证踩中步数 4（私人区玫瑰）获得额外投掷
    let st = Aseb.createInitialState();
    let rolled = Aseb.applyRoll(st, { dice: [1,1,1,1], steps: 4 });
    st = rolled.state;
    assert.strictEqual(rolled.legalMoves.length, 1);
    assert.strictEqual(rolled.legalMoves[0].extraTurn, true);
    st = Aseb.applyMove(st, rolled.legalMoves[0]);
    assert.strictEqual(st.currentPlayer, 1);
    assert.strictEqual(st.pieces[1][0], 4);

    // 3. 验证公共区击杀把对手送回 0，且公共区玫瑰格 (8) 无敌不可击杀
    st = Aseb.createInitialState();
    st.pieces[1] = [5, 0, 0, 0, 0];
    st.pieces[2] = [7, 8, 0, 0, 0];
    // 步数 2：5->7 合法击杀
    let mKill = Aseb.getLegalMoves(st, 2, 1).find(m => m.from === 5);
    assert.ok(mKill && mKill.type === 'capture');
    // 步数 3：5->8 对手在无敌玫瑰格，不可落子
    let mBlocked = Aseb.getLegalMoves(st, 3, 1).find(m => m.from === 5);
    assert.strictEqual(mBlocked, undefined);

    // 4. 连续模拟 25 局完整 AI vs AI 阿塞布对局，验证全部正常分出胜负
    let completed = 0;
    for (let g = 0; g < 25; g++) {
      let s = Aseb.createInitialState();
      let safety = 0;
      while (!s.winner && safety < 2500) {
        safety++;
        const r = Aseb.applyRoll(s);
        s = r.state;
        if (!r.skipped && s.phase === 'move') {
          const mv = AI.chooseMove(s, 'normal');
          assert.ok(mv, '有合法走法时 AI 必须返回走法');
          s = Aseb.applyMove(s, mv);
        }
      }
      assert.ok(s.winner === 1 || s.winner === 2, `第 ${g} 局未在步数内结束`);
      assert.strictEqual(Aseb.getBorneOffCount(s, s.winner), 5);
      completed++;
    }
    console.log(JSON.stringify({ completed }));
    """
    out = run_node(script)
    data = json.loads(out)
    assert data["completed"] == 25


def test_egyptsnt_integrated_in_root_index():
    """验证古埃及双面棋盒已规范接入全站主页 boardgame 专区"""
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()
    soup = BeautifulSoup(html, "html.parser")

    link = soup.find("a", href="boardgame/egyptsnt/index.html")
    assert link is not None, "主页必须包含 boardgame/egyptsnt/index.html 入口"
    card = link.find_parent("div", class_="game-card")
    assert card is not None
    assert card.get("data-category") == "boardgame"

    hrefs = [a["href"] for a in card.find_all("a")]
    assert "boardgame/egyptsnt/index.html?game=aseb" in hrefs, "必须包含阿塞布棋直达入口"
    assert "boardgame/egyptsnt/AI_BENCHMARK.md" in hrefs, "必须包含 AI 评测报告入口"


def test_tutorial_sessions_and_master_ai():
    """验证塞尼特与阿塞布两套 5 步互动教学全部可顺畅通关，且大祭司 Expectiminimax AI 正常工作"""
    script = r"""
    const assert = require('assert');
    const Tutorial = require('./boardgame/egyptsnt/js/tutorial.js');
    const Senet = require('./boardgame/egyptsnt/js/senet-engine.js');
    const Aseb = require('./boardgame/egyptsnt/js/aseb-engine.js');
    const AI = require('./boardgame/egyptsnt/js/ai.js');

    for (const game of ['senet', 'aseb']) {
      let sess = Tutorial.createSession(game);
      assert.strictEqual(sess.totalSteps, 5);
      for (let i = 0; i < 5; i++) {
        const targetMove = sess.legalMoves.find(m => m.from === sess.step.expectedFrom);
        assert.ok(targetMove, `${game} 教学第 ${i + 1} 步必须存在预期合法走法`);
        const res = Tutorial.applyTutorialMove(sess, targetMove);
        assert.strictEqual(res.ok, true, `${game} 教学第 ${i + 1} 步应成功完成`);
        sess = res.session;
        if (i < 4) {
          sess = Tutorial.nextTutorialStep(sess);
        }
      }
      assert.strictEqual(sess.finished, true);
    }

    // 验证 master 期望搜索 AI 在两款游戏中均可完成完整对局
    for (const engine of [Senet, Aseb]) {
      let s = engine.createInitialState();
      let guard = 0;
      while (!s.winner && guard < 2500) {
        guard++;
        const r = engine.applyRoll(s);
        s = r.state;
        if (!r.skipped && s.phase === 'move') {
          const mv = AI.chooseMove(s, s.currentPlayer === 1 ? 'master' : 'easy');
          assert.ok(mv);
          s = engine.applyMove(s, mv);
        }
      }
      assert.ok(s.winner === 1 || s.winner === 2);
    }

    // 验证快速局 (winTarget: 3) 在塞尼特与阿塞布中均在出满 3 枚时准确判胜
    for (const engine of [Senet, Aseb]) {
      let s = engine.createInitialState({ winTarget: 3 });
      let guard = 0;
      while (!s.winner && guard < 2000) {
        guard++;
        const r = engine.applyRoll(s);
        s = r.state;
        if (!r.skipped && s.phase === 'move') {
          const mv = AI.chooseMove(s, 'normal');
          s = engine.applyMove(s, mv);
        }
      }
      assert.ok(s.winner === 1 || s.winner === 2);
      const winCount = s.game === 'senet' ? s.borneOff[s.winner] : Aseb.getBorneOffCount(s, s.winner);
      assert.strictEqual(winCount, 3);
    }

    // 验证古埃及 BGM 合成模块接口齐备
    const Audio = require('./boardgame/egyptsnt/js/audio.js');
    assert.strictEqual(typeof Audio.startBgm, 'function');
    assert.strictEqual(typeof Audio.stopBgm, 'function');
    assert.strictEqual(typeof Audio.toggleBgm, 'function');
    assert.strictEqual(typeof Audio.isBgmPlaying, 'function');
    assert.ok(Audio.SCALE && Audio.SCALE.Fs4 > Audio.SCALE.Eb4);
    console.log('OK');
    """
    assert run_node(script) == "OK"
