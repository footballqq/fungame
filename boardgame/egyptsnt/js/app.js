/**
 * 古埃及双面棋盒 UI 主控制器
 * 负责塞尼特棋 (Senet) 与阿塞布棋 (Aseb) 双面无缝切换、渲染、交互与 AI 调度。
 */
(function () {
  'use strict';

  const Senet = window.SenetEngine;
  const Aseb = window.AsebEngine;
  const Tutorial = window.EgyptTutorial;
  const AI = window.EgyptBoardAI;
  const AudioFX = window.EgyptAudio;

  const ui = {
    tabSenet: document.getElementById('tabSenet'),
    tabAseb: document.getElementById('tabAseb'),
    selectMode: document.getElementById('selectMode'),
    selectSide: document.getElementById('selectSide'),
    selectWinTarget: document.getElementById('selectWinTarget'),
    selectSpeed: document.getElementById('selectSpeed'),
    btnFlipBox: document.getElementById('btnFlipBox'),
    btnTutorial: document.getElementById('btnTutorial'),
    btnRestart: document.getElementById('btnRestart'),
    btnRules: document.getElementById('btnRules'),
    btnArtifact: document.getElementById('btnArtifact'),
    btnBgm: document.getElementById('btnBgm'),
    btnSound: document.getElementById('btnSound'),
    btnHistory: document.getElementById('btnHistory'),
    btnRoll: document.getElementById('btnRoll'),
    tutorialBanner: document.getElementById('tutorialBanner'),
    tutorialStepTag: document.getElementById('tutorialStepTag'),
    tutorialTitle: document.getElementById('tutorialTitle'),
    tutorialDesc: document.getElementById('tutorialDesc'),
    tutorialActions: document.getElementById('tutorialActions'),
    tutorialFeedback: document.getElementById('tutorialFeedback'),
    btnTutorialNext: document.getElementById('btnTutorialNext'),
    btnExitTutorial: document.getElementById('btnExitTutorial'),
    cardP1: document.getElementById('cardP1'),
    cardP2: document.getElementById('cardP2'),
    nameP1: document.getElementById('nameP1'),
    nameP2: document.getElementById('nameP2'),
    scoreP1: document.getElementById('scoreP1'),
    scoreP2: document.getElementById('scoreP2'),
    turnNum: document.getElementById('turnNum'),
    turnWho: document.getElementById('turnWho'),
    stage: document.getElementById('woodenBoxStage'),
    stageTitle: document.getElementById('stageTitle'),
    boardContainer: document.getElementById('boardContainer'),
    diceVisual: document.getElementById('diceVisual'),
    rollSteps: document.getElementById('rollSteps'),
    rollHint: document.getElementById('rollHint'),
    eventText: document.getElementById('eventText'),
    modalRules: document.getElementById('modalRules'),
    modalArtifact: document.getElementById('modalArtifact'),
    modalHistory: document.getElementById('modalHistory'),
    historyList: document.getElementById('historyList'),
    modalWin: document.getElementById('modalWin'),
    winHeadline: document.getElementById('winHeadline'),
    winDetail: document.getElementById('winDetail'),
    btnWinReplay: document.getElementById('btnWinReplay'),
    btnWinFlip: document.getElementById('btnWinFlip'),
    toast: document.getElementById('toastBanner')
  };

  const SPEED_PRESETS = {
    slow: { rollDelay: 950, moveDelay: 1150, animScale: 1.0, label: '慢速 (1×)' },
    normal: { rollDelay: 480, moveDelay: 580, animScale: 0.62, label: '标准 (2×)' },
    fast: { rollDelay: 220, moveDelay: 260, animScale: 0.36, label: '极速 (3×)' }
  };

  let activeGame = 'senet'; // 'senet' | 'aseb'
  let gameMode = 'pve-normal'; // 'pve-master' | 'pve-normal' | 'pve-easy' | 'pvp'
  let humanPlayer = 1; // 1 = 玩家先手（圆锥方）, 2 = 玩家后手（轮盘方，AI 先手）
  let winTarget = 5; // 5 = 经典局（先出5子胜）, 3 = 快速局（先出3子胜）
  let speedLevel = 'normal'; // 'slow' | 'normal' | 'fast'
  let state = Senet.createInitialState();
  let legalMoves = [];
  let hoveredFrom = null;
  let lastMoveTrace = null; // { game, player, from, to }
  let moveHistory = []; // [{ turn, actorLabel, isAI, text }]
  let isAnimating = false;
  let awaitingAIStart = false; // AI 先手时等待玩家点击“开始对局”再启动，避免切换棋盘时电脑抢跑
  let tutorialSession = null;
  let aiTimer = null;
  let toastTimer = null;

  function isAIPlayer(player) {
    if (tutorialSession) return false;
    return gameMode !== 'pvp' && player !== humanPlayer;
  }

  function aiDifficulty() {
    if (gameMode === 'pve-master') return 'master';
    if (gameMode === 'pve-easy') return 'easy';
    return 'normal';
  }

  function clearAITimer() {
    if (aiTimer) {
      clearTimeout(aiTimer);
      aiTimer = null;
    }
  }

  function showToast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2400);
  }

  function openModal(el) {
    el.classList.add('open');
  }

  function closeModal(el) {
    el.classList.remove('open');
  }

  function selectRuleTab(tabName) {
    document.querySelectorAll('.rule-tab-btn[data-rule-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.ruleTab === tabName);
    });
    document.getElementById('rulePanelSenet').classList.toggle('active', tabName === 'senet');
    document.getElementById('rulePanelFaqSenet').classList.toggle('active', tabName === 'faq-senet');
    document.getElementById('rulePanelAseb').classList.toggle('active', tabName === 'aseb');
    document.getElementById('rulePanelFaqAseb').classList.toggle('active', tabName === 'faq-aseb');
    document.getElementById('rulePanelMath').classList.toggle('active', tabName === 'math');
    document.getElementById('rulePanelAi').classList.toggle('active', tabName === 'ai');
  }

  function selectArtifactTab(tabName) {
    document.querySelectorAll('.artifact-tab-btn[data-artifact-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.artifactTab === tabName);
    });
    document.getElementById('artifactPanelMyth').classList.toggle('active', tabName === 'myth');
    document.getElementById('artifactPanelPhotos').classList.toggle('active', tabName === 'photos');
  }

  /**
   * 渲染互动教学引导条
   */
  function renderTutorialBanner() {
    if (!tutorialSession) {
      ui.tutorialBanner.classList.remove('active');
      return;
    }
    ui.tutorialBanner.classList.add('active');
    const gameLabel = tutorialSession.game === 'senet' ? '塞尼特棋教学' : '阿塞布棋教学';
    ui.tutorialStepTag.textContent = `🎓 ${gameLabel} · ${tutorialSession.stepIndex + 1} / ${tutorialSession.totalSteps}`;
    ui.tutorialTitle.textContent = tutorialSession.step.title;
    ui.tutorialDesc.textContent = tutorialSession.step.instruction;

    if (tutorialSession.completedStep) {
      ui.tutorialActions.style.display = 'flex';
      ui.tutorialFeedback.textContent = tutorialSession.step.successText;
      ui.btnTutorialNext.textContent = tutorialSession.finished
        ? '🎮 完成教学，开始实战！'
        : '下一步 →';
    } else {
      ui.tutorialActions.style.display = 'none';
    }
  }

  /**
   * 启动当前游戏的互动教学
   */
  function startTutorial(gameType) {
    clearAITimer();
    activeGame = gameType || activeGame;
    tutorialSession = Tutorial.createSession(activeGame);
    state = tutorialSession.state;
    legalMoves = tutorialSession.legalMoves;
    hoveredFrom = tutorialSession.step.expectedFrom;

    ui.tabSenet.classList.toggle('active', activeGame === 'senet');
    ui.tabSenet.setAttribute('aria-selected', String(activeGame === 'senet'));
    ui.tabAseb.classList.toggle('active', activeGame === 'aseb');
    ui.tabAseb.setAttribute('aria-selected', String(activeGame === 'aseb'));
    ui.stageTitle.textContent =
      activeGame === 'senet'
        ? '🎓 互动教学 · 塞尼特棋（3×10 蛇形冥界赛道）'
        : '🎓 互动教学 · 阿塞布棋（20 格私人区 + 公共交战赛道）';
    ui.btnRoll.textContent = activeGame === 'senet' ? '🪵 教学已预设点数' : '🔺 教学已预设点数';

    closeModal(ui.modalWin);
    showToast('已进入手把手互动教学，请按提示点击高亮棋子！');
    renderAll(true);
  }

  function getActorTag(player) {
    const side = player === 1 ? '圆锥' : '轮盘';
    if (tutorialSession) return `教学 · ${side}`;
    if (gameMode === 'pvp') return `玩家${player} · ${side}`;
    return player === humanPlayer ? `玩家 · ${side}` : `电脑 · ${side}`;
  }

  function recordHistory(turn, player, text) {
    if (tutorialSession) return;
    moveHistory.unshift({
      turn,
      actorLabel: getActorTag(player),
      isAI: isAIPlayer(player),
      text
    });
    if (moveHistory.length > 120) moveHistory.pop();
    updateHistoryUI();
  }

  function updateHistoryUI() {
    ui.btnHistory.textContent = `📝 对局记录 (${moveHistory.length})`;
    if (moveHistory.length === 0) {
      ui.historyList.innerHTML =
        '<p class="history-empty">暂无走子记录，投掷后将自动记录双方每一步操作。</p>';
      return;
    }
    ui.historyList.innerHTML = moveHistory
      .map(
        (item) =>
          `<div class="history-item ${item.isAI ? 'is-ai' : 'is-human'}">` +
          `<span class="history-meta">第${item.turn}回合 · ${item.actorLabel}</span>` +
          `<span class="history-text">${item.text}</span>` +
          `</div>`
      )
      .join('');
  }

  /**
   * 切换或重置当前游戏
   */
  function startNewGame(gameType, animateFlip) {
    clearAITimer();
    isAnimating = false;
    tutorialSession = null;
    activeGame = gameType || activeGame;
    hoveredFrom = null;
    legalMoves = [];
    lastMoveTrace = null;
    moveHistory = [];
    updateHistoryUI();
    state =
      activeGame === 'senet'
        ? Senet.createInitialState({ winTarget })
        : Aseb.createInitialState({ winTarget });
    awaitingAIStart = isAIPlayer(state.currentPlayer);
    if (awaitingAIStart) {
      state.lastEvent = '已就绪（AI 先手）！请点击“开始对局”由电脑率先投掷。';
    }

    // 同步标签状态与地址参数
    ui.tabSenet.classList.toggle('active', activeGame === 'senet');
    ui.tabSenet.setAttribute('aria-selected', String(activeGame === 'senet'));
    ui.tabAseb.classList.toggle('active', activeGame === 'aseb');
    ui.tabAseb.setAttribute('aria-selected', String(activeGame === 'aseb'));

    ui.stageTitle.textContent =
      activeGame === 'senet'
        ? '正面 · 塞尼特棋（3×10 蛇形冥界赛道）'
        : '反面 · 阿塞布棋（20 格私人区 + 公共交战赛道）';

    ui.btnRoll.textContent = activeGame === 'senet' ? '🪵 投掷掷棍' : '🔺 投掷金字塔骰';

    if (animateFlip) {
      AudioFX.playFlip();
      ui.stage.classList.add('flipping');
      setTimeout(() => ui.stage.classList.remove('flipping'), 320);
    }

    closeModal(ui.modalWin);
    renderAll();
  }

  /**
   * 更新双方身份文字与比分栏
   */
  function renderScoreboard() {
    const aiLabel =
      gameMode === 'pve-master'
        ? '大祭司 AI'
        : gameMode === 'pve-easy'
          ? '入门 AI'
          : '标准 AI';

    if (gameMode === 'pvp') {
      ui.nameP1.textContent = '玩家 1 · 圆锥方';
      ui.nameP2.textContent = '玩家 2 · 轮盘方';
    } else if (humanPlayer === 1) {
      ui.nameP1.textContent = '玩家 · 圆锥方';
      ui.nameP2.textContent = `${aiLabel} · 轮盘方`;
    } else {
      ui.nameP1.textContent = `${aiLabel} · 圆锥方`;
      ui.nameP2.textContent = '玩家 · 轮盘方';
    }
    ui.selectSide.style.display = gameMode === 'pvp' ? 'none' : '';

    const s1 =
      activeGame === 'senet' ? state.borneOff[1] : Aseb.getBorneOffCount(state, 1);
    const s2 =
      activeGame === 'senet' ? state.borneOff[2] : Aseb.getBorneOffCount(state, 2);

    const target = state.winTarget || 5;
    ui.scoreP1.textContent = `${s1} / ${target}`;
    ui.scoreP2.textContent = `${s2} / ${target}`;

    ui.cardP1.classList.toggle('active', state.currentPlayer === 1 && !state.winner);
    ui.cardP2.classList.toggle('active', state.currentPlayer === 2 && !state.winner);

    ui.turnNum.textContent = `第 ${state.turnCount} 回合`;
    if (state.winner) {
      ui.turnWho.textContent = state.winner === 1 ? '圆锥方胜！' : '轮盘方胜！';
    } else {
      ui.turnWho.textContent = state.currentPlayer === 1 ? '轮到圆锥方' : '轮到轮盘方';
    }
  }

  /**
   * 渲染掷具视觉（木掷棍或金字塔骰）
   */
  function renderDiceTray(animate) {
    ui.diceVisual.innerHTML = '';
    if (animate) {
      ui.diceVisual.classList.remove('rolling');
      void ui.diceVisual.offsetWidth;
      ui.diceVisual.classList.add('rolling');
    }

    if (activeGame === 'senet') {
      const sticks = state.lastRoll ? state.lastRoll.sticks : [1, 0, 1, 0];
      sticks.forEach((isFlat) => {
        const el = document.createElement('div');
        el.className = `stick-item ${isFlat ? 'flat' : 'curved'}`;
        el.title = isFlat ? '浅色平面朝上' : '深色弧面朝上';
        ui.diceVisual.appendChild(el);
      });

      if (state.lastRoll) {
        ui.rollSteps.textContent = `走 ${state.lastRoll.steps} 步`;
        ui.rollHint.textContent = state.lastRoll.extraTurn
          ? `${state.lastRoll.flatCount} 根平面朝上 · 含额外投掷奖励！`
          : `${state.lastRoll.flatCount} 根平面朝上`;
      } else {
        ui.rollSteps.textContent = '等待投掷';
        ui.rollHint.textContent = '4 根木棍：1/4/5 步送额外投掷';
      }
    } else {
      const dice = state.lastRoll ? state.lastRoll.dice : [1, 0, 1, 0];
      dice.forEach((pip) => {
        const el = document.createElement('div');
        el.className = `pyramid-die ${pip ? 'lit' : ''}`;
        el.textContent = pip ? '✦' : '·';
        el.title = pip ? '金尖朝上 (+1)' : '暗面 (0)';
        ui.diceVisual.appendChild(el);
      });

      if (state.lastRoll) {
        ui.rollSteps.textContent = state.lastRoll.steps === 0 ? '0 步（空过）' : `走 ${state.lastRoll.steps} 步`;
        ui.rollHint.textContent = `${state.lastRoll.steps} 枚金尖朝上`;
      } else {
        ui.rollSteps.textContent = '等待投掷';
        ui.rollHint.textContent = '4 枚金字塔骰：0–4 步，踩 ✦ 再掷';
      }
    }

    const canHumanRoll =
      !tutorialSession &&
      state.phase === 'roll' &&
      !state.winner &&
      (!isAIPlayer(state.currentPlayer) || awaitingAIStart);
    ui.btnRoll.disabled = !canHumanRoll;
    if (!tutorialSession) {
      if (awaitingAIStart) {
        ui.btnRoll.textContent = '▶️ 开始对局（AI 先手）';
      } else {
        ui.btnRoll.textContent = activeGame === 'senet' ? '🪵 投掷掷棍' : '🔺 投掷金字塔骰';
      }
    }
    ui.eventText.textContent = state.lastEvent;
  }

  /**
   * 渲染塞尼特棋盘 (3x10)
   */
  function renderSenetBoard() {
    const wrap = document.createElement('div');
    wrap.className = 'senet-board-wrap';
    const grid = document.createElement('div');
    grid.className = 'senet-grid';

    const canHumanMove = state.phase === 'move' && !isAIPlayer(state.currentPlayer);
    const movableMap = new Map();
    if (canHumanMove) {
      legalMoves.forEach((m) => movableMap.set(m.from, m));
    }

    const previewMove =
      hoveredFrom !== null && movableMap.has(hoveredFrom)
        ? movableMap.get(hoveredFrom)
        : null;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 10; c++) {
        const sq = Senet.coordsToSquare(r, c);
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.senetSq = String(sq);
        if ((r + c) % 2 === 1) cell.classList.add('alt-tone');

        const special = Senet.SPECIAL_SQUARES[sq];
        if (special) {
          if (sq === 15) cell.classList.add('special-rebirth');
          else if (sq === 26) cell.classList.add('special-beauty');
          else if (sq === 27) cell.classList.add('special-water');
          else cell.classList.add('special-exit');
          cell.title = `${sq}格 · ${special.name}：${special.desc}`;
        }

        // 序号与蛇形流向提示
        const numEl = document.createElement('span');
        numEl.className = 'cell-num';
        numEl.textContent = String(sq);
        cell.appendChild(numEl);

        if (sq === 10 || sq === 20) {
          const flow = document.createElement('span');
          flow.className = 'cell-flow';
          flow.textContent = '↓';
          cell.appendChild(flow);
        } else if (sq === 1 || sq === 21) {
          const flow = document.createElement('span');
          flow.className = 'cell-flow';
          flow.textContent = '→';
          cell.appendChild(flow);
        } else if (sq === 11) {
          const flow = document.createElement('span');
          flow.className = 'cell-flow';
          flow.textContent = '←';
          cell.appendChild(flow);
        }

        if (special) {
          const glyph = document.createElement('span');
          glyph.className = 'cell-glyph';
          glyph.textContent = special.glyph;
          cell.appendChild(glyph);

          const tag = document.createElement('span');
          tag.className = 'cell-tag';
          tag.textContent = special.name;
          cell.appendChild(tag);
        }

        // 渲染棋子
        const owner = state.board[sq];
        if (owner) {
          const piece = document.createElement('span');
          piece.className = `piece-icon ${owner === 1 ? 'piece-cone' : 'piece-disc'}`;
          cell.appendChild(piece);

          if (Senet.isProtected(state.board, sq)) {
            const shield = document.createElement('span');
            shield.className = 'shield-badge';
            shield.textContent = '🛡';
            shield.title = '处于保护/安全状态，不可被换位';
            cell.appendChild(shield);
          }
        }

        // 可移动起点高亮
        if (movableMap.has(sq)) {
          const move = movableMap.get(sq);
          cell.classList.add('movable');
          if (hoveredFrom === sq) cell.classList.add('selected');

          cell.addEventListener('mouseenter', () => {
            if (hoveredFrom !== sq) {
              hoveredFrom = sq;
              renderSenetBoard();
            }
          });
          cell.addEventListener('click', () => handleHumanMove(move));
        }

        // 预览目标落点高亮
        if (previewMove && previewMove.to === sq) {
          if (previewMove.type === 'water_trap') cell.classList.add('target-trap');
          else if (previewMove.type === 'swap') cell.classList.add('target-attack');
          else cell.classList.add('target-move');
          cell.addEventListener('click', () => handleHumanMove(previewMove));
        }

        // 上一步起止轨迹留痕
        if (lastMoveTrace && lastMoveTrace.game === 'senet') {
          if (lastMoveTrace.from === sq) cell.classList.add('last-from');
          if (lastMoveTrace.to === sq) cell.classList.add('last-to');
        }

        grid.appendChild(cell);
      }
    }

    wrap.appendChild(grid);

    // 底部终点出盘区提示条
    const bar = document.createElement('div');
    bar.className = 'bearoff-bar';
    const exitMoves = canHumanMove ? legalMoves.filter((m) => m.type === 'bear_off') : [];
    const leftTip = document.createElement('div');
    leftTip.className = 'bearoff-zone';
    leftTip.textContent = '提示：🛡 代表受保护棋子（相邻双子或安全格）；点击金色高亮棋子即可移动。';
    bar.appendChild(leftTip);

    const exitZone = document.createElement('div');
    exitZone.className = 'bearoff-zone' + (exitMoves.length > 0 ? ' ready-exit' : '');
    const target = state.winTarget || 5;
    exitZone.textContent =
      exitMoves.length > 0
        ? `✨ 点击直接将第 ${exitMoves[0].from} 格棋子移出棋盘！`
        : `🏁 终点出盘区（先出满 ${target} 枚获胜）`;
    if (exitMoves.length > 0) {
      exitZone.addEventListener('click', () => handleHumanMove(exitMoves[0]));
    }
    bar.appendChild(exitZone);

    ui.boardContainer.innerHTML = '';
    ui.boardContainer.appendChild(wrap);
    ui.boardContainer.appendChild(bar);
  }

  /**
   * 渲染阿塞布棋盘 (20格 T形)
   */
  function renderAsebBoard() {
    const layout = document.createElement('div');
    layout.className = 'aseb-layout';

    const canHumanMove = state.phase === 'move' && !isAIPlayer(state.currentPlayer);
    const enterMove = canHumanMove ? legalMoves.find((m) => m.from === 0) : null;

    // 顶部场外待入场区
    const reserveRow = document.createElement('div');
    reserveRow.className = 'aseb-reserve-row';

    [1, 2].forEach((p) => {
      const dock = document.createElement('div');
      dock.className = 'reserve-dock';
      dock.dataset.reservePlayer = String(p);
      const count = Aseb.getReserveCount(state, p);
      const isMyEnter = enterMove && state.currentPlayer === p;

      if (isMyEnter) {
        dock.classList.add('movable');
        if (hoveredFrom === 0) dock.classList.add('selected');
        dock.addEventListener('mouseenter', () => {
          if (hoveredFrom !== 0) {
            hoveredFrom = 0;
            renderAsebBoard();
          }
        });
        dock.addEventListener('click', () => handleHumanMove(enterMove));
      }

      const labelWrap = document.createElement('div');
      labelWrap.style.display = 'flex';
      labelWrap.style.flexDirection = 'column';
      labelWrap.style.gap = '2px';

      const label = document.createElement('span');
      label.className = 'reserve-label';
      label.textContent = `${p === 1 ? '圆锥方' : '轮盘方'}等待区 (${count})`;
      labelWrap.appendChild(label);

      const subTip = document.createElement('span');
      subTip.className = 'reserve-tip';
      subTip.textContent = isMyEnter
        ? `点击派子进入 私${enterMove.to}${enterMove.to === 4 ? '✦' : ''}`
        : '起点外(0步)：掷1进私1…掷4直达私4✦';
      labelWrap.appendChild(subTip);
      dock.appendChild(labelWrap);

      const icons = document.createElement('div');
      icons.className = 'reserve-pieces';
      for (let i = 0; i < count; i++) {
        const piece = document.createElement('span');
        piece.className = `piece-icon piece-sm ${p === 1 ? 'piece-cone' : 'piece-disc'}`;
        icons.appendChild(piece);
      }
      dock.appendChild(icons);
      reserveRow.appendChild(dock);
    });

    layout.appendChild(reserveRow);

    // 主 3x12 网格（渲染有效 20 格）
    const wrap = document.createElement('div');
    wrap.className = 'aseb-board-wrap';
    const grid = document.createElement('div');
    grid.className = 'aseb-grid';

    // 预先索引所有格子的棋子归属
    const cellOccupancy = new Map(); // "r,c" -> { player, pos }
    [1, 2].forEach((p) => {
      state.pieces[p].forEach((pos) => {
        if (pos >= 1 && pos <= Aseb.TRACK_LENGTH) {
          const coord = Aseb.progressToCoords(p, pos);
          cellOccupancy.set(`${coord.row},${coord.col}`, { player: p, pos });
        }
      });
    });

    const previewMove =
      canHumanMove && hoveredFrom !== null
        ? legalMoves.find((m) => m.from === hoveredFrom)
        : null;
    const previewCoord =
      previewMove && previewMove.to <= Aseb.TRACK_LENGTH
        ? Aseb.progressToCoords(state.currentPlayer, previewMove.to)
        : null;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 12; c++) {
        if (!Aseb.isValidCell(r, c)) {
          const voidEl = document.createElement('div');
          voidEl.className = 'aseb-void';
          if (r === 0 && c === 7) voidEl.textContent = '← 公共赛道向右冲刺 →';
          if (r === 2 && c === 7) voidEl.textContent = '✦ 特殊格：无敌 + 再掷一次';
          grid.appendChild(voidEl);
          continue;
        }

        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.asebCell = `${r},${c}`;

        // 计算该格对应的进度编号与类型
        let trackPos;
        if (r === 0) {
          trackPos = 4 - c;
          cell.classList.add('aseb-cell-p1');
        } else if (r === 2) {
          trackPos = 4 - c;
          cell.classList.add('aseb-cell-p2');
        } else {
          trackPos = c + 5;
          cell.classList.add('aseb-cell-shared');
        }

        const rosette = Aseb.isRosette(trackPos);
        if (rosette) {
          cell.classList.add('aseb-cell-rosette');
          cell.title =
            trackPos === 4
              ? '私人区神圣标记格：踩中获得额外投掷一次！'
              : '公共区神圣标记格：无敌不可被击杀，且获得额外投掷一次！';
        }

        // 序号与方向提示
        const numEl = document.createElement('span');
        numEl.className = 'cell-num';
        numEl.textContent = r === 1 ? `公${c + 1}` : `私${trackPos}`;
        cell.appendChild(numEl);

        const flow = document.createElement('span');
        flow.className = 'cell-flow';
        if ((r === 0 || r === 2) && c > 0) flow.textContent = '←';
        else if (r === 0 && c === 0) flow.textContent = '↓';
        else if (r === 2 && c === 0) flow.textContent = '↑';
        else if (r === 1 && c < 11) flow.textContent = '→';
        else if (r === 1 && c === 11) flow.textContent = '🏁';
        cell.appendChild(flow);

        if (rosette) {
          const glyph = document.createElement('span');
          glyph.className = 'cell-glyph';
          glyph.textContent = '✦';
          cell.appendChild(glyph);

          const tag = document.createElement('span');
          tag.className = 'cell-tag';
          tag.textContent = trackPos === 4 ? '+1掷' : '无敌+1掷';
          cell.appendChild(tag);
        }

        // 棋子渲染
        const occ = cellOccupancy.get(`${r},${c}`);
        if (occ) {
          const piece = document.createElement('span');
          piece.className = `piece-icon ${occ.player === 1 ? 'piece-cone' : 'piece-disc'}`;
          cell.appendChild(piece);

          if (rosette && occ.pos > 4) {
            const shield = document.createElement('span');
            shield.className = 'shield-badge';
            shield.textContent = '✦';
            shield.title = '神圣格无敌庇护';
            cell.appendChild(shield);
          }

          // 若属于当前玩家的合法起点
          if (canHumanMove && occ.player === state.currentPlayer) {
            const move = legalMoves.find((m) => m.from === occ.pos);
            if (move) {
              cell.classList.add('movable');
              if (hoveredFrom === occ.pos) cell.classList.add('selected');
              cell.addEventListener('mouseenter', () => {
                if (hoveredFrom !== occ.pos) {
                  hoveredFrom = occ.pos;
                  renderAsebBoard();
                }
              });
              cell.addEventListener('click', () => handleHumanMove(move));
            }
          }
        }

        // 落点预览
        if (previewCoord && previewCoord.row === r && previewCoord.col === c) {
          cell.classList.add(previewMove.type === 'capture' ? 'target-attack' : 'target-move');
          cell.addEventListener('click', () => handleHumanMove(previewMove));
        }

        // 上一步起止轨迹留痕
        if (lastMoveTrace && lastMoveTrace.game === 'aseb') {
          if (lastMoveTrace.fromCoord && lastMoveTrace.fromCoord.row === r && lastMoveTrace.fromCoord.col === c) {
            cell.classList.add('last-from');
          }
          if (lastMoveTrace.toCoord && lastMoveTrace.toCoord.row === r && lastMoveTrace.toCoord.col === c) {
            cell.classList.add('last-to');
          }
        }

        grid.appendChild(cell);
      }
    }

    wrap.appendChild(grid);
    layout.appendChild(wrap);

    // 底部终点出盘提示条
    const bar = document.createElement('div');
    bar.className = 'bearoff-bar';
    const exitMove = canHumanMove ? legalMoves.find((m) => m.type === 'bear_off') : null;
    const tip = document.createElement('div');
    tip.className = 'bearoff-zone';
    tip.textContent = '路线：从上方“待入场区”进入私人区 私1→私4，再拐入中间公共赛道 公1→公12 冲刺出盘。';
    bar.appendChild(tip);

    const exitZone = document.createElement('div');
    exitZone.className = 'bearoff-zone' + (exitMove ? ' ready-exit' : '');
    exitZone.textContent = exitMove
      ? `✨ 点击将公${exitMove.from - 4}格棋子冲出终点！`
      : '🏁 需恰好到达第 17 步（超出公12一格）出盘';
    if (exitMove) {
      exitZone.addEventListener('click', () => handleHumanMove(exitMove));
    }
    bar.appendChild(exitZone);
    layout.appendChild(bar);

    ui.boardContainer.innerHTML = '';
    ui.boardContainer.appendChild(layout);
  }

  function renderBoard() {
    if (activeGame === 'senet') renderSenetBoard();
    else renderAsebBoard();
  }

  function renderAll(animateDice) {
    renderTutorialBanner();
    renderScoreboard();
    renderDiceTray(animateDice);
    renderBoard();
    scheduleAIIfNeeded();
  }

  /**
   * 投掷处理（人或 AI 共用）
   */
  function performRoll() {
    if (state.phase !== 'roll' || state.winner) return;
    AudioFX.playRoll();

    const actingPlayer = state.currentPlayer;
    const actingTurn = state.turnCount;
    const engine = activeGame === 'senet' ? Senet : Aseb;
    const res = engine.applyRoll(state);
    state = res.state;
    legalMoves = res.legalMoves;
    hoveredFrom = legalMoves.length > 0 ? legalMoves[0].from : null;

    if (res.skipped) {
      recordHistory(actingTurn, actingPlayer, state.lastEvent);
      showToast(state.lastEvent);
    }
    renderAll(true);
  }

  /**
   * 获取指定格子的屏幕中心坐标（用于飞行/撞飞/落水动画）
   */
  function getCellCenter(selector) {
    const el = ui.boardContainer.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function getAnchorPoint(game, player, pos) {
    if (game === 'senet') {
      if (pos >= 1 && pos <= Senet.BOARD_SIZE) {
        return getCellCenter(`[data-senet-sq="${pos}"]`);
      }
      return getCellCenter('.bearoff-bar');
    }
    if (pos === 0) {
      return getCellCenter(`[data-reserve-player="${player}"]`);
    }
    if (pos >= 1 && pos <= Aseb.TRACK_LENGTH) {
      const c = Aseb.progressToCoords(player, pos);
      return getCellCenter(`[data-aseb-cell="${c.row},${c.col}"]`);
    }
    return getCellCenter('.bearoff-bar');
  }

  function spawnImpactText(x, y, text, cls) {
    const el = document.createElement('div');
    el.className = `fx-impact-pop ${cls}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  function shakeStage() {
    ui.stage.classList.remove('board-shake');
    void ui.stage.offsetWidth;
    ui.stage.classList.add('board-shake');
    setTimeout(() => ui.stage.classList.remove('board-shake'), 380);
  }

  /**
   * 创建一枚临时飞行棋子，沿抛物线从 start 飞向 end（可选旋转撞飞效果）
   */
  function flyPiece(player, start, end, opts) {
    return new Promise((resolve) => {
      if (!start || !end) {
        resolve();
        return;
      }
      const scale = (SPEED_PRESETS[speedLevel] || SPEED_PRESETS.normal).animScale;
      const duration = Math.max(120, Math.round(((opts && opts.duration) || 460) * scale));
      const arcHeight = (opts && opts.arcHeight) || 34;
      const spinDeg = (opts && opts.spinDeg) || 0;

      const ghost = document.createElement('span');
      ghost.className = `piece-icon ${player === 1 ? 'piece-cone' : 'piece-disc'} fx-flying-piece`;
      ghost.style.left = `${start.x - 18}px`;
      ghost.style.top = `${start.y - 20}px`;
      document.body.appendChild(ghost);

      const dx = end.x - start.x;
      const dy = end.y - start.y;

      const anim = ghost.animate(
        [
          { transform: 'translate(0px, 0px) scale(1.06) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${dx * 0.5}px, ${dy * 0.5 - arcHeight}px) scale(1.28) rotate(${spinDeg * 0.55}deg)`,
            opacity: 1,
            offset: 0.52
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(${opts && opts.fadeOut ? 0.5 : 1}) rotate(${spinDeg}deg)`,
            opacity: opts && opts.fadeOut ? 0 : 1
          }
        ],
        { duration, easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)', fill: 'forwards' }
      );

      anim.onfinish = () => {
        ghost.remove();
        resolve();
      };
      setTimeout(() => {
        if (ghost.parentNode) ghost.remove();
        resolve();
      }, duration + 80);
    });
  }

  /**
   * 执行走子：先播放飞行/换位/吧唧撞飞/落水动画，再落地刷新盘面
   */
  async function performMove(move) {
    if (isAnimating) return;
    isAnimating = true;
    clearAITimer();

    const actingPlayer = state.currentPlayer;
    const opponent = actingPlayer === 1 ? 2 : 1;
    const actingTurn = state.turnCount;
    const rolledSteps = state.lastRoll ? state.lastRoll.steps : 0;
    const game = activeGame;

    const fromPt = getAnchorPoint(game, actingPlayer, move.from);
    const toPt = getAnchorPoint(game, actingPlayer, move.to);

    // 播放前进/碰撞/落水可视化动画
    if (move.type === 'capture' && toPt) {
      // 1. 攻击棋子飞向落点
      await flyPiece(actingPlayer, fromPt, toPt, { duration: 420, arcHeight: 38 });
      // 2. 碰撞瞬间：震屏 + “💥 吧唧！撞飞！” + 被击杀棋子旋转飞回场外待入场区
      AudioFX.playCapture();
      shakeStage();
      spawnImpactText(toPt.x, toPt.y - 10, '💥 吧唧！撞飞回老家！', 'fx-pop-hit');
      const oppHomePt = getAnchorPoint('aseb', opponent, 0);
      await flyPiece(opponent, toPt, oppHomePt, { duration: 540, arcHeight: 75, spinDeg: 540 });
    } else if (move.type === 'swap' && fromPt && toPt) {
      AudioFX.playCapture();
      shakeStage();
      spawnImpactText((fromPt.x + toPt.x) / 2, (fromPt.y + toPt.y) / 2 - 12, '⇄ 换位打回！', 'fx-pop-swap');
      await Promise.all([
        flyPiece(actingPlayer, fromPt, toPt, { duration: 480, arcHeight: 34 }),
        flyPiece(opponent, toPt, fromPt, { duration: 480, arcHeight: 54, spinDeg: -360 })
      ]);
    } else if (move.type === 'water_trap' && toPt) {
      await flyPiece(actingPlayer, fromPt, toPt, { duration: 400, arcHeight: 30 });
      AudioFX.playWater();
      shakeStage();
      spawnImpactText(toPt.x, toPt.y - 10, '💦 扑通落水！冲回重生屋！', 'fx-pop-water');
      const rebirthPt = getAnchorPoint('senet', actingPlayer, move.rebirthTo);
      await flyPiece(actingPlayer, toPt, rebirthPt, { duration: 560, arcHeight: 68, spinDeg: -420 });
    } else if (move.type === 'bear_off') {
      AudioFX.playBonus();
      if (toPt) spawnImpactText(toPt.x, toPt.y - 12, '✨ 安全出盘！', 'fx-pop-exit');
      await flyPiece(actingPlayer, fromPt, toPt, { duration: 460, arcHeight: 44, fadeOut: true });
    } else {
      AudioFX.playMove();
      await flyPiece(actingPlayer, fromPt, toPt, { duration: 420, arcHeight: 28 });
      if (move.extraTurn && toPt) {
        AudioFX.playBonus();
        spawnImpactText(toPt.x, toPt.y - 12, '✦ 额外再掷一次！', 'fx-pop-exit');
      }
    }

    const engine = game === 'senet' ? Senet : Aseb;
    state = engine.applyMove(state, move);
    legalMoves = [];
    hoveredFrom = null;

    // 记录上一步棋盘轨迹留痕
    if (game === 'senet') {
      const actualTo = move.type === 'water_trap' ? move.rebirthTo : move.to;
      lastMoveTrace = {
        game: 'senet',
        player: actingPlayer,
        from: move.from,
        to: actualTo <= Senet.BOARD_SIZE ? actualTo : null
      };
    } else {
      lastMoveTrace = {
        game: 'aseb',
        player: actingPlayer,
        fromCoord: move.from >= 1 ? Aseb.progressToCoords(actingPlayer, move.from) : null,
        toCoord: move.to <= Aseb.TRACK_LENGTH ? Aseb.progressToCoords(actingPlayer, move.to) : null
      };
    }

    recordHistory(actingTurn, actingPlayer, `[掷 ${rolledSteps} 点] ${state.lastEvent}`);
    isAnimating = false;

    if (state.winner) {
      AudioFX.playWin();
      renderScoreboard();
      renderDiceTray(false);
      renderBoard();
      showWinModal();
      return;
    }

    renderAll(false);
  }

  function handleHumanMove(move) {
    if (isAnimating) return;
    if (tutorialSession) {
      const res = Tutorial.applyTutorialMove(tutorialSession, move);
      if (!res.ok) {
        showToast(res.message);
        return;
      }
      tutorialSession = res.session;
      state = tutorialSession.state;
      legalMoves = [];
      hoveredFrom = null;
      if (tutorialSession.finished) AudioFX.playWin();
      else if (move.type === 'capture' || move.type === 'swap') AudioFX.playCapture();
      else if (move.type === 'bear_off' || move.extraTurn) AudioFX.playBonus();
      else AudioFX.playMove();
      renderAll(false);
      return;
    }
    if (state.phase !== 'move' || isAIPlayer(state.currentPlayer)) return;
    performMove(move);
  }

  /**
   * 调度 AI 自动投掷与选步
   */
  function scheduleAIIfNeeded() {
    clearAITimer();
    if (isAnimating || awaitingAIStart || state.winner || !isAIPlayer(state.currentPlayer)) return;

    const preset = SPEED_PRESETS[speedLevel] || SPEED_PRESETS.normal;
    if (state.phase === 'roll') {
      aiTimer = setTimeout(() => {
        performRoll();
      }, preset.rollDelay);
    } else if (state.phase === 'move') {
      aiTimer = setTimeout(() => {
        const chosen = AI.chooseMove(state, aiDifficulty());
        if (chosen) performMove(chosen);
      }, preset.moveDelay);
    }
  }

  function showWinModal() {
    const pieceLabel = state.winner === 1 ? '圆锥方' : '轮盘方';
    let winnerName;
    if (gameMode === 'pvp') {
      winnerName = `玩家 ${state.winner}（${pieceLabel}）`;
    } else if (state.winner === humanPlayer) {
      winnerName = `你（${pieceLabel}）`;
    } else {
      const aiLabel =
        gameMode === 'pve-master'
          ? '大祭司 AI'
          : gameMode === 'pve-easy'
            ? '入门 AI'
            : '标准 AI';
      winnerName = `${aiLabel}（${pieceLabel}）`;
    }
    const gameTitle = activeGame === 'senet' ? '塞尼特棋' : '阿塞布棋';
    const target = state.winTarget || 5;
    ui.winHeadline.textContent = `${winnerName}赢得${gameTitle}！`;
    ui.winDetail.textContent = `共经历 ${state.turnCount} 回合，率先将 ${target} 枚棋子成功冲出古埃及赛道！`;
    openModal(ui.modalWin);
  }

  /**
   * 绑定页面事件
   */
  function bindEvents() {
    ui.btnRoll.addEventListener('click', () => {
      if (awaitingAIStart && !tutorialSession && !state.winner) {
        awaitingAIStart = false;
        showToast('对局开始，电脑率先投掷！');
        performRoll();
        return;
      }
      if (state.phase === 'roll' && !isAIPlayer(state.currentPlayer)) {
        performRoll();
      }
    });

    ui.tabSenet.addEventListener('click', () => {
      if (activeGame !== 'senet') startNewGame('senet', true);
    });

    ui.tabAseb.addEventListener('click', () => {
      if (activeGame !== 'aseb') startNewGame('aseb', true);
    });

    ui.btnFlipBox.addEventListener('click', () => {
      const nextGame = activeGame === 'senet' ? 'aseb' : 'senet';
      startNewGame(nextGame, true);
      showToast(nextGame === 'senet' ? '已翻至正面：30 格塞尼特棋' : '已翻至反面：20 格阿塞布棋');
    });

    ui.btnTutorial.addEventListener('click', () => {
      startTutorial(activeGame);
    });

    ui.btnExitTutorial.addEventListener('click', () => {
      startNewGame(activeGame, false);
      showToast('已退出教学，进入正式对局！');
    });

    ui.btnTutorialNext.addEventListener('click', () => {
      if (!tutorialSession) return;
      if (tutorialSession.finished) {
        startNewGame(activeGame, false);
        showToast('教学通关！正式对局开始，请投掷！');
        return;
      }
      tutorialSession = Tutorial.nextTutorialStep(tutorialSession);
      state = tutorialSession.state;
      legalMoves = tutorialSession.legalMoves;
      hoveredFrom = tutorialSession.step.expectedFrom;
      AudioFX.playRoll();
      renderAll(true);
    });

    ui.btnRestart.addEventListener('click', () => {
      startNewGame(activeGame, false);
      showToast('已重置当前棋局');
    });

    ui.selectMode.addEventListener('change', (e) => {
      gameMode = e.target.value;
      startNewGame(activeGame, false);
      showToast('已切换对弈模式并重新开局');
    });

    ui.selectSide.addEventListener('change', (e) => {
      humanPlayer = Number(e.target.value) === 2 ? 2 : 1;
      startNewGame(activeGame, false);
      showToast(
        humanPlayer === 2
          ? '已切换为 AI 先手（你执釉砂轮盘后手）'
          : '已切换为玩家先手（你执乌木圆锥先手）'
      );
    });

    ui.selectWinTarget.addEventListener('change', (e) => {
      winTarget = Number(e.target.value) === 3 ? 3 : 5;
      startNewGame(activeGame, false);
      showToast(
        winTarget === 3
          ? '⚡ 已切换为快速局（率先出满 3 枚棋子即获胜）'
          : '🏆 已切换为经典局（率先出满 5 枚棋子获胜）'
      );
    });

    ui.selectSpeed.addEventListener('change', (e) => {
      speedLevel = SPEED_PRESETS[e.target.value] ? e.target.value : 'normal';
      showToast(`已切换动画与 AI 速度：${SPEED_PRESETS[speedLevel].label}`);
    });

    ui.btnRules.addEventListener('click', () => {
      selectRuleTab(activeGame);
      openModal(ui.modalRules);
    });

    ui.btnArtifact.addEventListener('click', () => openModal(ui.modalArtifact));
    ui.btnHistory.addEventListener('click', () => openModal(ui.modalHistory));

    ui.btnBgm.addEventListener('click', () => {
      const playing = AudioFX.toggleBgm();
      ui.btnBgm.textContent = playing ? '🎵 埃及音乐：开' : '🎵 埃及音乐：关';
      ui.btnBgm.classList.toggle('btn-gold', playing);
      showToast(playing ? '🎵 古埃及乌德琴与达布卡手鼓伴奏已开启' : '已关闭背景音乐');
    });

    ui.btnSound.addEventListener('click', () => {
      const nextMute = !AudioFX.isMuted();
      AudioFX.setMuted(nextMute);
      ui.btnSound.textContent = nextMute ? '🔇 音效关' : '🔊 音效开';
    });

    ui.btnWinReplay.addEventListener('click', () => startNewGame(activeGame, false));
    ui.btnWinFlip.addEventListener('click', () => {
      startNewGame(activeGame === 'senet' ? 'aseb' : 'senet', true);
    });

    document.querySelectorAll('.rule-tab-btn[data-rule-tab]').forEach((btn) => {
      btn.addEventListener('click', () => selectRuleTab(btn.dataset.ruleTab));
    });

    document.querySelectorAll('.artifact-tab-btn[data-artifact-tab]').forEach((btn) => {
      btn.addEventListener('click', () => selectArtifactTab(btn.dataset.artifactTab));
    });

    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.close);
        if (target) closeModal(target);
      });
    });

    [ui.modalRules, ui.modalArtifact, ui.modalHistory, ui.modalWin].forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop);
      });
    });
  }

  // 解析 URL 参数 (?game=aseb 或 ?game=senet)
  const params = new URLSearchParams(window.location.search);
  const initialGame = params.get('game') === 'aseb' ? 'aseb' : 'senet';

  bindEvents();
  startNewGame(initialGame, false);
})();
