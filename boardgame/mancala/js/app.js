/**
 * 非洲播棋 (Mancala / Kalah) UI 主控制器
 * 支持落点实时预览（连击/截胡提示）、逐坑播种高亮动画、三档速度、先后手、4 步教学与对局记录。
 */
(function () {
  'use strict';

  const Engine = window.MancalaEngine;
  const AI = window.MancalaAI;
  const Tutorial = window.MancalaTutorial;
  const AudioFX = window.MancalaAudio;

  const STONE_COLORS = ['#f59e0b', '#22c55e', '#38bdf8', '#f43f5e', '#c084fc', '#fb923c', '#2dd4bf', '#fde047'];
  const SPEED_MAP = {
    slow: { stepMs: 170, aiDelay: 900, label: '慢速 (1×)' },
    normal: { stepMs: 95, aiDelay: 480, label: '标准 (2×)' },
    fast: { stepMs: 42, aiDelay: 200, label: '极速 (3×)' }
  };

  const ui = {
    selectSeeds: document.getElementById('selectSeeds'),
    selectMode: document.getElementById('selectMode'),
    selectSide: document.getElementById('selectSide'),
    selectSpeed: document.getElementById('selectSpeed'),
    btnTutorial: document.getElementById('btnTutorial'),
    btnRules: document.getElementById('btnRules'),
    btnHistoryStory: document.getElementById('btnHistoryStory'),
    btnBgm: document.getElementById('btnBgm'),
    btnSound: document.getElementById('btnSound'),
    btnRestart: document.getElementById('btnRestart'),
    btnLog: document.getElementById('btnLog'),
    btnStartAI: document.getElementById('btnStartAI'),
    aiStartWrap: document.getElementById('aiStartWrap'),
    cardP1: document.getElementById('cardP1'),
    cardP2: document.getElementById('cardP2'),
    nameP1: document.getElementById('nameP1'),
    nameP2: document.getElementById('nameP2'),
    scoreP1: document.getElementById('scoreP1'),
    scoreP2: document.getElementById('scoreP2'),
    turnNum: document.getElementById('turnNum'),
    turnWho: document.getElementById('turnWho'),
    board: document.getElementById('mancalaBoard'),
    eventText: document.getElementById('eventText'),
    tutorialBanner: document.getElementById('tutorialBanner'),
    tutorialTag: document.getElementById('tutorialTag'),
    tutorialTitle: document.getElementById('tutorialTitle'),
    tutorialDesc: document.getElementById('tutorialDesc'),
    tutorialActions: document.getElementById('tutorialActions'),
    tutorialFeedback: document.getElementById('tutorialFeedback'),
    btnTutorialNext: document.getElementById('btnTutorialNext'),
    btnExitTutorial: document.getElementById('btnExitTutorial'),
    modalRules: document.getElementById('modalRules'),
    modalStory: document.getElementById('modalStory'),
    modalLog: document.getElementById('modalLog'),
    logList: document.getElementById('logList'),
    modalWin: document.getElementById('modalWin'),
    winHeadline: document.getElementById('winHeadline'),
    winDetail: document.getElementById('winDetail'),
    btnWinReplay: document.getElementById('btnWinReplay'),
    toast: document.getElementById('toastBanner')
  };

  let seedsPerPit = 4;
  let gameMode = 'pve-normal';
  let humanSide = 1; // 1=南岸先手, 2=北岸后手
  let speedKey = 'normal';
  let state = Engine.createInitialState(seedsPerPit);
  let hoveredPit = null;
  let lastStartPit = null;
  let isAnimating = false;
  let awaitingAIStart = false;
  let tutorialSession = null;
  let logs = [];
  let aiTimer = null;
  let toastTimer = null;

  function isAI(player) {
    if (tutorialSession) return false;
    return gameMode !== 'pvp' && player !== humanSide;
  }

  function aiDiff() {
    if (gameMode === 'pve-master') return 'master';
    if (gameMode === 'pve-easy') return 'easy';
    return 'normal';
  }

  function showToast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2200);
  }

  function popFX(pitIdx, text) {
    const elTarget = ui.board.querySelector(`[data-pit="${pitIdx}"]`);
    if (!elTarget) return;
    const rect = elTarget.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'fx-pop';
    el.textContent = text;
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  function addLog(turn, player, text) {
    if (tutorialSession) return;
    const who =
      gameMode === 'pvp'
        ? player === 1 ? '南岸' : '北岸'
        : player === humanSide ? '玩家' : '电脑';
    logs.unshift({ turn, who, isAI: isAI(player), text });
    if (logs.length > 120) logs.pop();
    ui.btnLog.textContent = `📝 对局记录 (${logs.length})`;
    ui.logList.innerHTML = logs
      .map(
        (it) =>
          `<div class="history-item ${it.isAI ? 'is-ai' : 'is-human'}">` +
          `<span class="history-meta">第${it.turn}回合·${it.who}</span>` +
          `<span>${it.text}</span></div>`
      )
      .join('');
  }

  function renderStonesHTML(count) {
    const visible = Math.min(count, 16);
    let html = '';
    for (let i = 0; i < visible; i++) {
      const col = STONE_COLORS[i % STONE_COLORS.length];
      html += `<span class="stone-dot" style="background:${col};"></span>`;
    }
    return html;
  }

  function previewOutcome(pitIdx) {
    if (pitIdx === null || state.winner !== null) return null;
    if (!Engine.isOwnPit(state.currentPlayer, pitIdx) || state.pits[pitIdx] <= 0) return null;
    const sim = Engine.applyMove(state, pitIdx);
    const lastPit = sim.path[sim.path.length - 1];
    return { lastPit, extraTurn: sim.extraTurn, captured: sim.captured, capturedPit: sim.capturedPit };
  }

  function renderBoard(displayPits, flashPit) {
    const pits = displayPits || state.pits;
    const canHumanPlay =
      !isAnimating && !awaitingAIStart && state.winner === null && !isAI(state.currentPlayer);
    const prev = canHumanPlay ? previewOutcome(hoveredPit) : null;

    // 左侧北岸大宝库 (13)
    const p2StoreCls =
      'store-pit' +
      (prev && prev.extraTurn && prev.lastPit === 13 ? ' preview-bonus' : '') +
      (flashPit === 13 ? ' sow-flash' : '');

    // 右侧南岸大宝库 (6)
    const p1StoreCls =
      'store-pit' +
      (prev && prev.extraTurn && prev.lastPit === 6 ? ' preview-bonus' : '') +
      (flashPit === 6 ? ' sow-flash' : '');

    // 北岸小坑顺序：从左到右显示 12, 11, 10, 9, 8, 7（逆时针走向向左）
    const topIndices = [12, 11, 10, 9, 8, 7];
    // 南岸小坑顺序：从左到右显示 0, 1, 2, 3, 4, 5（逆时针走向向右）
    const botIndices = [0, 1, 2, 3, 4, 5];

    const makePitHTML = (idx, labelNum) => {
      const playable =
        canHumanPlay &&
        Engine.isOwnPit(state.currentPlayer, idx) &&
        pits[idx] > 0 &&
        !(tutorialSession && tutorialSession.completedStep);
      let cls = 'pit';
      if (playable) cls += ' playable';
      if (tutorialSession && !tutorialSession.completedStep && tutorialSession.step.expectedPit === idx) {
        cls += ' tutorial-hint';
      }
      if (lastStartPit === idx) cls += ' last-start';
      if (flashPit === idx) cls += ' sow-flash';
      if (prev) {
        if (prev.captured > 0 && (prev.lastPit === idx || prev.capturedPit === idx)) {
          cls += ' preview-capture';
        } else if (prev.lastPit === idx) {
          cls += ' preview-land';
        }
      }
      return (
        `<div class="${cls}" data-pit="${idx}" role="button" tabindex="${playable ? 0 : -1}">` +
        `<span class="pit-index">${labelNum}</span>` +
        `<div class="stones-cluster">${renderStonesHTML(pits[idx])}</div>` +
        `<span class="pit-count">${pits[idx]}</span>` +
        `</div>`
      );
    };

    ui.board.innerHTML =
      `<div class="${p2StoreCls}" data-pit="13">` +
      `<div class="store-title">北岸宝库<br>(上方)</div>` +
      `<div class="store-count">${pits[13]}</div>` +
      `<div style="font-size:11px;color:var(--text-muted);">💎 宝石</div>` +
      `</div>` +
      `<div class="pits-center">` +
      `<div class="pit-row-label"><span>← 逆时针方向（北岸）</span><span>6 → 1 号坑</span></div>` +
      `<div class="pit-row">${topIndices.map((idx) => makePitHTML(idx, idx - 6)).join('')}</div>` +
      `<div class="pit-row">${botIndices.map((idx) => makePitHTML(idx, idx + 1)).join('')}</div>` +
      `<div class="pit-row-label"><span>1 → 6 号坑</span><span>逆时针方向（南岸）→</span></div>` +
      `</div>` +
      `<div class="${p1StoreCls}" data-pit="6">` +
      `<div class="store-title">南岸宝库<br>(下方)</div>` +
      `<div class="store-count">${pits[6]}</div>` +
      `<div style="font-size:11px;color:var(--text-muted);">💎 宝石</div>` +
      `</div>`;

    ui.board.querySelectorAll('.pit.playable').forEach((el) => {
      const idx = Number(el.dataset.pit);
      el.addEventListener('mouseenter', () => {
        if (hoveredPit !== idx) {
          hoveredPit = idx;
          renderBoard();
        }
      });
      el.addEventListener('mouseleave', () => {
        if (hoveredPit !== null) {
          hoveredPit = null;
          renderBoard();
        }
      });
      el.addEventListener('click', () => handlePitClick(idx));
    });
  }

  function renderScoreboard() {
    const aiName = gameMode === 'pve-master' ? '酋长大师 AI' : gameMode === 'pve-easy' ? '入门 AI' : '标准 AI';
    if (gameMode === 'pvp') {
      ui.nameP1.textContent = '玩家 1 · 南岸方（下方）';
      ui.nameP2.textContent = '玩家 2 · 北岸方（上方）';
    } else if (humanSide === 1) {
      ui.nameP1.textContent = '玩家 · 南岸方（下方）';
      ui.nameP2.textContent = `${aiName} · 北岸方（上方）`;
    } else {
      ui.nameP1.textContent = `${aiName} · 南岸方（下方）`;
      ui.nameP2.textContent = '玩家 · 北岸方（上方）';
    }
    ui.selectSide.style.display = gameMode === 'pvp' ? 'none' : '';
    ui.scoreP1.textContent = String(state.pits[6]);
    ui.scoreP2.textContent = String(state.pits[13]);
    ui.cardP1.classList.toggle('active', state.currentPlayer === 1 && state.winner === null);
    ui.cardP2.classList.toggle('active', state.currentPlayer === 2 && state.winner === null);
    ui.turnNum.textContent = `第 ${state.turnCount} 回合`;
    ui.turnWho.textContent =
      state.winner !== null
        ? state.winner === 0 ? '平局！' : state.winner === 1 ? '南岸胜！' : '北岸胜！'
        : state.currentPlayer === 1 ? '轮到南岸方' : '轮到北岸方';
    ui.eventText.textContent = state.lastEvent;
    ui.aiStartWrap.style.display = awaitingAIStart ? 'block' : 'none';
  }

  function renderTutorialBar() {
    if (!tutorialSession) {
      ui.tutorialBanner.classList.remove('active');
      return;
    }
    ui.tutorialBanner.classList.add('active');
    ui.tutorialTag.textContent = `🎓 非洲播棋教学 · ${tutorialSession.stepIndex + 1} / ${tutorialSession.totalSteps}`;
    ui.tutorialTitle.textContent = tutorialSession.step.title;
    ui.tutorialDesc.textContent = tutorialSession.step.instruction;
    if (tutorialSession.completedStep) {
      ui.tutorialActions.style.display = 'flex';
      ui.tutorialFeedback.textContent = tutorialSession.step.successText;
      ui.btnTutorialNext.textContent = tutorialSession.finished ? '🎮 完成教学，开始实战！' : '下一步 →';
    } else {
      ui.tutorialActions.style.display = 'none';
    }
  }

  async function animateSow(startPit, path) {
    isAnimating = true;
    const stepMs = (SPEED_MAP[speedKey] || SPEED_MAP.normal).stepMs;
    const tempPits = state.pits.slice();
    tempPits[startPit] = 0;
    renderBoard(tempPits, startPit);

    for (let i = 0; i < path.length; i++) {
      await new Promise((r) => setTimeout(r, stepMs));
      const target = path[i];
      tempPits[target] += 1;
      AudioFX.playDrop(i);
      renderBoard(tempPits, target);
    }
    await new Promise((r) => setTimeout(r, Math.round(stepMs * 0.8)));
    isAnimating = false;
  }

  async function performSow(pitIndex) {
    if (isAnimating) return;
    if (aiTimer) clearTimeout(aiTimer);

    const actingPlayer = state.currentPlayer;
    const actingTurn = state.turnCount;
    hoveredPit = null;
    lastStartPit = pitIndex;

    if (tutorialSession) {
      const check = Tutorial.applyTutorialMove(tutorialSession, pitIndex);
      if (!check.ok) {
        showToast(check.message);
        return;
      }
      await animateSow(pitIndex, check.result.path);
      tutorialSession = check.session;
      state = tutorialSession.state;
      if (check.result.captured > 0) {
        AudioFX.playCapture();
        popFX(Engine.storeOf(actingPlayer), `💎 截胡 +${check.result.captured}！`);
      } else if (check.result.extraTurn) {
        AudioFX.playBonus();
        popFX(Engine.storeOf(actingPlayer), '✨ 免费连击！');
      }
      if (tutorialSession.finished) AudioFX.playWin();
      renderAll();
      return;
    }

    const res = Engine.applyMove(state, pitIndex);
    await animateSow(pitIndex, res.path);
    state = res.state;
    addLog(actingTurn, actingPlayer, state.lastEvent);

    if (res.captured > 0) {
      AudioFX.playCapture();
      popFX(Engine.storeOf(actingPlayer), `💎 对坑截胡 +${res.captured}！`);
    } else if (res.extraTurn) {
      AudioFX.playBonus();
      popFX(Engine.storeOf(actingPlayer), '✨ 再来一次！');
    }

    renderAll();

    if (state.winner !== null) {
      AudioFX.playWin();
      ui.winHeadline.textContent =
        state.winner === 0
          ? '🤝 势均力敌平局！'
          : state.winner === 1
            ? '💎 南岸方赢得播棋胜利！'
            : '💎 北岸方赢得播棋胜利！';
      ui.winDetail.textContent = `最终比分：南岸 ${state.pits[6]} 颗 vs 北岸 ${state.pits[13]} 颗（共 ${state.turnCount} 回合）。`;
      ui.modalWin.classList.add('open');
    }
  }

  function handlePitClick(idx) {
    if (isAnimating || awaitingAIStart || state.winner !== null || isAI(state.currentPlayer)) return;
    performSow(idx);
  }

  function scheduleAI() {
    if (aiTimer) clearTimeout(aiTimer);
    if (isAnimating || awaitingAIStart || state.winner !== null || !isAI(state.currentPlayer)) return;
    const delay = (SPEED_MAP[speedKey] || SPEED_MAP.normal).aiDelay;
    aiTimer = setTimeout(() => {
      const pit = AI.chooseMove(state, aiDiff());
      if (pit !== null) performSow(pit);
    }, delay);
  }

  function renderAll() {
    renderTutorialBar();
    renderScoreboard();
    renderBoard();
    scheduleAI();
  }

  function startNewGame() {
    if (aiTimer) clearTimeout(aiTimer);
    isAnimating = false;
    tutorialSession = null;
    hoveredPit = null;
    lastStartPit = null;
    logs = [];
    ui.btnLog.textContent = '📝 对局记录 (0)';
    ui.logList.innerHTML = '<p style="text-align:center;color:var(--text-muted);">暂无播种记录。</p>';
    state = Engine.createInitialState(seedsPerPit);
    awaitingAIStart = isAI(state.currentPlayer);
    if (awaitingAIStart) {
      state.lastEvent = '已就绪（AI 先手）！点击棋盘下方“开始对局”后由电脑率先播种。';
    }
    ui.modalWin.classList.remove('open');
    renderAll();
  }

  function startTutorial() {
    if (aiTimer) clearTimeout(aiTimer);
    isAnimating = false;
    awaitingAIStart = false;
    tutorialSession = Tutorial.createSession();
    state = tutorialSession.state;
    hoveredPit = null;
    lastStartPit = null;
    ui.modalWin.classList.remove('open');
    showToast('已进入非洲播棋 4 步教学！');
    renderAll();
  }

  // 事件绑定
  ui.selectSeeds.addEventListener('change', (e) => {
    seedsPerPit = Number(e.target.value) === 3 ? 3 : 4;
    startNewGame();
  });
  ui.selectMode.addEventListener('change', (e) => {
    gameMode = e.target.value;
    startNewGame();
  });
  ui.selectSide.addEventListener('change', (e) => {
    humanSide = Number(e.target.value) === 2 ? 2 : 1;
    startNewGame();
  });
  ui.selectSpeed.addEventListener('change', (e) => {
    speedKey = SPEED_MAP[e.target.value] ? e.target.value : 'normal';
    showToast(`速度已切换：${SPEED_MAP[speedKey].label}`);
  });
  ui.btnStartAI.addEventListener('click', () => {
    awaitingAIStart = false;
    renderAll();
  });
  ui.btnRestart.addEventListener('click', startNewGame);
  ui.btnWinReplay.addEventListener('click', startNewGame);
  ui.btnTutorial.addEventListener('click', startTutorial);
  ui.btnExitTutorial.addEventListener('click', startNewGame);
  ui.btnTutorialNext.addEventListener('click', () => {
    if (!tutorialSession) return;
    if (tutorialSession.finished) {
      startNewGame();
      return;
    }
    tutorialSession = Tutorial.nextTutorialStep(tutorialSession);
    state = tutorialSession.state;
    hoveredPit = null;
    lastStartPit = null;
    renderAll();
  });
  ui.btnRules.addEventListener('click', () => ui.modalRules.classList.add('open'));
  ui.btnHistoryStory.addEventListener('click', () => ui.modalStory.classList.add('open'));
  ui.btnLog.addEventListener('click', () => ui.modalLog.classList.add('open'));
  ui.btnBgm.addEventListener('click', () => {
    const on = AudioFX.toggleBgm();
    ui.btnBgm.textContent = on ? '🎵 非洲木琴：开' : '🎵 非洲木琴：关';
    ui.btnBgm.classList.toggle('btn-gold', on);
  });
  ui.btnSound.addEventListener('click', () => {
    const muted = !AudioFX.isMuted();
    AudioFX.setMuted(muted);
    ui.btnSound.textContent = muted ? '🔇 音效关' : '🔊 音效开';
  });

  document.querySelectorAll('.rule-tab-btn[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tab;
      document.querySelectorAll('.rule-tab-btn[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      document.getElementById('panelRules').classList.toggle('active', t === 'rules');
      document.getElementById('panelFaq').classList.toggle('active', t === 'faq');
      document.getElementById('panelAi').classList.toggle('active', t === 'ai');
    });
  });
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.remove('open'));
  });
  [ui.modalRules, ui.modalStory, ui.modalLog, ui.modalWin].forEach((m) => {
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('open'); });
  });

  startNewGame();
})();
