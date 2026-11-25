/**
 * 维京王者之棋 (Hnefatafl) UI 主控制器
 */
(function () {
  'use strict';

  const Engine = window.HnefataflEngine;
  const AI = window.HnefataflAI;
  const Tutorial = window.HnefataflTutorial;
  const AudioFX = window.HnefataflAudio;

  const SPEED_MAP = {
    slow: { delay: 950, label: '慢速 (1×)' },
    normal: { delay: 480, label: '标准 (2×)' },
    fast: { delay: 200, label: '极速 (3×)' }
  };

  const ui = {
    selectSize: document.getElementById('selectSize'),
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
    cardBlack: document.getElementById('cardBlack'),
    cardWhite: document.getElementById('cardWhite'),
    nameBlack: document.getElementById('nameBlack'),
    nameWhite: document.getElementById('nameWhite'),
    capWhite: document.getElementById('capWhite'),
    capBlack: document.getElementById('capBlack'),
    turnNum: document.getElementById('turnNum'),
    turnWho: document.getElementById('turnWho'),
    boardGrid: document.getElementById('boardGrid'),
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

  let boardSize = 7;
  let gameMode = 'pve-normal';
  let humanSide = 2; // 2=黑方进攻(先手), 1=白方护王(后手)
  let speedKey = 'normal';
  let state = Engine.createInitialState(boardSize);
  let selected = null;
  let legalDests = [];
  let lastTrace = null;
  let logs = [];
  let awaitingAIStart = false;
  let tutorialSession = null;
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

  function popFX(r, c, text) {
    const cell = ui.boardGrid.querySelector(`[data-rc="${r},${c}"]`);
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'fx-pop';
    el.textContent = text;
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 920);
  }

  function addLog(turn, player, text) {
    if (tutorialSession) return;
    const who =
      gameMode === 'pvp'
        ? player === 2 ? '黑方' : '白方'
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

  function startNewGame() {
    if (aiTimer) clearTimeout(aiTimer);
    tutorialSession = null;
    selected = null;
    legalDests = [];
    lastTrace = null;
    logs = [];
    ui.btnLog.textContent = '📝 对局记录 (0)';
    ui.logList.innerHTML = '<p style="text-align:center;color:var(--text-muted);">暂无走子记录。</p>';
    state = Engine.createInitialState(boardSize);
    awaitingAIStart = isAI(state.currentPlayer);
    if (awaitingAIStart) {
      state.lastEvent = '已就绪（黑方 AI 先手）！点击棋盘下方“开始对局”后由电脑率先出击。';
    }
    ui.modalWin.classList.remove('open');
    renderAll();
  }

  function startTutorial() {
    if (aiTimer) clearTimeout(aiTimer);
    awaitingAIStart = false;
    tutorialSession = Tutorial.createSession();
    state = tutorialSession.state;
    selected = null;
    legalDests = [];
    lastTrace = null;
    ui.modalWin.classList.remove('open');
    showToast('已进入维京王者之棋 4 步教学！');
    renderAll();
  }

  function renderScoreboard() {
    const aiName = gameMode === 'pve-master' ? '大酋长 AI' : gameMode === 'pve-easy' ? '入门 AI' : '标准 AI';
    if (gameMode === 'pvp') {
      ui.nameBlack.textContent = '玩家 1 · 黑方进攻';
      ui.nameWhite.textContent = '玩家 2 · 白方护王';
    } else if (humanSide === 2) {
      ui.nameBlack.textContent = '玩家 · 黑方进攻';
      ui.nameWhite.textContent = `${aiName} · 白方护王`;
    } else {
      ui.nameBlack.textContent = `${aiName} · 黑方进攻`;
      ui.nameWhite.textContent = '玩家 · 白方护王';
    }
    ui.selectSide.style.display = gameMode === 'pvp' ? 'none' : '';
    ui.capWhite.textContent = `已擒 ${state.captured[1]} 卫兵`;
    ui.capBlack.textContent = `已斩 ${state.captured[2]} 黑兵`;
    ui.cardBlack.classList.toggle('active', state.currentPlayer === 2 && !state.winner);
    ui.cardWhite.classList.toggle('active', state.currentPlayer === 1 && !state.winner);
    ui.turnNum.textContent = `第 ${state.turnCount} 回合`;
    ui.turnWho.textContent = state.winner
      ? state.winner === 1 ? '白方突围胜！' : '黑方擒王胜！'
      : state.currentPlayer === 2 ? '轮到黑方' : '轮到白方';
    ui.eventText.textContent = state.lastEvent;
    ui.aiStartWrap.style.display = awaitingAIStart ? 'block' : 'none';
  }

  function renderTutorialBar() {
    if (!tutorialSession) {
      ui.tutorialBanner.classList.remove('active');
      return;
    }
    ui.tutorialBanner.classList.add('active');
    ui.tutorialTag.textContent = `🎓 维京棋教学 · ${tutorialSession.stepIndex + 1} / ${tutorialSession.totalSteps}`;
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

  function renderBoard() {
    const N = state.size;
    ui.boardGrid.className = `hnef-grid size-${N}`;
    ui.boardGrid.style.gridTemplateColumns = `repeat(${N}, minmax(0, 1fr))`;
    ui.boardGrid.style.gridTemplateRows = `repeat(${N}, minmax(0, 1fr))`;
    ui.boardGrid.innerHTML = '';

    const canClick = !state.winner && !awaitingAIStart && !isAI(state.currentPlayer);
    const destSet = new Set(legalDests.map((m) => `${m.toR},${m.toC}`));

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.rc = `${r},${c}`;
        if ((r + c) % 2 === 1) cell.classList.add('alt');
        if (Engine.isCorner(N, r, c)) cell.classList.add('corner');
        if (Engine.isThrone(N, r, c)) cell.classList.add('throne');

        if (lastTrace && lastTrace.fromR === r && lastTrace.fromC === c) cell.classList.add('last-from');
        if (lastTrace && lastTrace.toR === r && lastTrace.toC === c) cell.classList.add('last-to');

        if (tutorialSession && !tutorialSession.completedStep) {
          const ef = tutorialSession.step.expectedFrom;
          const et = tutorialSession.step.expectedTo;
          if (!selected && ef.r === r && ef.c === c) cell.classList.add('tutorial-hint');
          if (selected && et.r === r && et.c === c) cell.classList.add('tutorial-hint');
        }

        const val = state.board[r][c];
        if (val !== Engine.EMPTY) {
          const p = document.createElement('span');
          p.className =
            'piece ' +
            (val === Engine.KING
              ? 'piece-king'
              : val === Engine.DEFENDER
                ? 'piece-defender'
                : 'piece-attacker');
          cell.appendChild(p);
          if (canClick && Engine.pieceOwner(val) === state.currentPlayer) {
            cell.classList.add('selectable');
          }
        }

        if (selected && selected.r === r && selected.c === c) {
          cell.classList.add('selected');
        }
        if (destSet.has(`${r},${c}`)) {
          cell.classList.add('legal-dest');
        }

        cell.addEventListener('click', () => handleCellClick(r, c));
        ui.boardGrid.appendChild(cell);
      }
    }
  }

  function executeMove(move) {
    const actingPlayer = state.currentPlayer;
    const actingTurn = state.turnCount;

    if (tutorialSession) {
      const res = Tutorial.applyTutorialMove(tutorialSession, move);
      if (!res.ok) {
        showToast(res.message);
        return;
      }
      tutorialSession = res.session;
      state = tutorialSession.state;
      selected = null;
      legalDests = [];
      lastTrace = move;
      if (res.captured && res.captured.length > 0) {
        AudioFX.playCapture();
        res.captured.forEach((cap) => popFX(cap.r, cap.c, '⚔️ 夹击吃子！'));
      } else if (tutorialSession.finished) {
        AudioFX.playWin();
      } else {
        AudioFX.playMove();
      }
      renderAll();
      return;
    }

    const res = Engine.applyMove(state, move);
    state = res.state;
    selected = null;
    legalDests = [];
    lastTrace = move;
    addLog(actingTurn, actingPlayer, state.lastEvent);

    if (res.captured.length > 0) {
      AudioFX.playCapture();
      res.captured.forEach((cap) =>
        popFX(cap.r, cap.c, cap.piece === Engine.KING ? '👑 擒获国王！' : '⚔️ 夹击吃子！')
      );
    } else {
      AudioFX.playMove();
    }

    renderAll();

    if (state.winner) {
      AudioFX.playWin();
      ui.winHeadline.textContent = state.winner === 1 ? '👑 白方护王突围获胜！' : '⚔️ 黑方合围擒王获胜！';
      ui.winDetail.textContent = `历时 ${state.turnCount} 回合：${state.winReason}`;
      ui.modalWin.classList.add('open');
    }
  }

  function handleCellClick(r, c) {
    if (state.winner || awaitingAIStart || isAI(state.currentPlayer)) return;
    if (tutorialSession && tutorialSession.completedStep) return;

    const matchMove = legalDests.find((m) => m.toR === r && m.toC === c);
    if (matchMove) {
      executeMove(matchMove);
      return;
    }

    const val = state.board[r][c];
    if (val !== Engine.EMPTY && Engine.pieceOwner(val) === state.currentPlayer) {
      selected = { r, c };
      legalDests = Engine.getMovesForPiece(state, r, c);
      renderBoard();
    } else {
      selected = null;
      legalDests = [];
      renderBoard();
    }
  }

  function scheduleAI() {
    if (aiTimer) clearTimeout(aiTimer);
    if (state.winner || awaitingAIStart || !isAI(state.currentPlayer)) return;
    const delay = (SPEED_MAP[speedKey] || SPEED_MAP.normal).delay;
    aiTimer = setTimeout(() => {
      const mv = AI.chooseMove(state, aiDiff());
      if (mv) executeMove(mv);
    }, delay);
  }

  function renderAll() {
    renderTutorialBar();
    renderScoreboard();
    renderBoard();
    scheduleAI();
  }

  // 事件绑定
  ui.selectSize.addEventListener('change', (e) => {
    boardSize = Number(e.target.value) === 9 ? 9 : 7;
    startNewGame();
  });
  ui.selectMode.addEventListener('change', (e) => {
    gameMode = e.target.value;
    startNewGame();
  });
  ui.selectSide.addEventListener('change', (e) => {
    humanSide = Number(e.target.value) === 1 ? 1 : 2;
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
    selected = null;
    legalDests = [];
    lastTrace = null;
    renderAll();
  });
  ui.btnRules.addEventListener('click', () => ui.modalRules.classList.add('open'));
  ui.btnHistoryStory.addEventListener('click', () => ui.modalStory.classList.add('open'));
  ui.btnLog.addEventListener('click', () => ui.modalLog.classList.add('open'));
  ui.btnBgm.addEventListener('click', () => {
    const on = AudioFX.toggleBgm();
    ui.btnBgm.textContent = on ? '🎵 北欧竖琴：开' : '🎵 北欧竖琴：关';
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
