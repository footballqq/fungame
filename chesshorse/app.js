// codex: 2026-02-13 新增 chesshorse 主逻辑：走子交互/变色不可回踩/答案与动画演示/春节祝福与记录
(() => {
  "use strict";

  const KNIGHT_ICON = "♞";

  const STORAGE_KEYS = Object.freeze({
    // chesshorse_records_v1：玩家记录数组（按局保存）。
    records: "chesshorse_records_v1",
    // chesshorse_sound_enabled_v1：音效开关。
    soundEnabled: "chesshorse_sound_enabled_v1",
  });

  const BLESSINGS = Object.freeze([
    "新春快乐，马到成功！",
    "龙马精神，步步高升！",
    "万事顺意，所愿皆成！",
    "福气满满，步步生花！",
    "一路开挂，勇往直前！",
  ]);

  const BLESSING_IDIOMS = Object.freeze([
    "马到成功",
    "一马当先",
    "龙马精神",
    "马不停蹄",
    "万马奔腾",
  ]);

  const FIREWORK_EMOJIS = Object.freeze(["🎆", "🎇", "✨", "🧨"]);

  const boardElement = mustGetElementById("board");
  const moveCountElement = mustGetElementById("moveCount");
  const progressTextElement = mustGetElementById("progressText");
  const timeTextElement = mustGetElementById("timeText");
  const helpTextElement = mustGetElementById("helpText");
  const boardSizeSelectElement = mustGetElementById("boardSizeSelect");
  const undoButton = mustGetElementById("undoBtn");
  const hintButton = mustGetElementById("hintBtn");
  const answerButton = mustGetElementById("answerBtn");
  const demoButton = mustGetElementById("demoBtn");
  const resetButton = mustGetElementById("resetBtn");
  const speedRangeElement = mustGetElementById("speedRange");
  const soundButton = mustGetElementById("soundBtn");
  const clearRecordsButton = mustGetElementById("clearRecordsBtn");
  const recordAttemptsElement = mustGetElementById("recordAttempts");
  const recordWinsElement = mustGetElementById("recordWins");
  const recordBestTimeElement = mustGetElementById("recordBestTime");
  const recordBestCoverageElement = mustGetElementById("recordBestCoverage");
  const springBannerTextElement = mustGetElementById("springBannerText");
  const fxLayerElement = mustGetElementById("fxLayer");

  const rulesModalBackdrop = mustGetElementById("rulesModal");
  const rulesButton = mustGetElementById("rulesBtn");
  const startButton = mustGetElementById("startBtn");

  const answerModalBackdrop = mustGetElementById("answerModal");
  const answerCloseButton = mustGetElementById("answerCloseBtn");
  const answerFromCurrentElement = mustGetElementById("answerFromCurrent");
  const answerFromStartElement = mustGetElementById("answerFromStart");
  const answerHintElement = mustGetElementById("answerHint");

  const winModalBackdrop = mustGetElementById("winModal");
  const winTitleElement = mustGetElementById("winTitle");
  const winBodyElement = mustGetElementById("winBody");
  const winDemoButton = mustGetElementById("winDemoBtn");
  const playAgainButton = mustGetElementById("playAgainBtn");

  /** @type {Element|null} */
  let lastFocusBeforeModal = null;

  /** @type {{boardSize: number, ts: number, durationMs: number, covered: number, total: number, completed: boolean, usedAnswer: boolean, usedDemo: boolean}[]} */
  let records = loadRecords();

  let soundEnabled = loadSoundEnabled();
  updateSoundButtonUi();

  /** @type {AudioContext|null} */
  let audioContext = null;

  const game = {
    boardSize: clampBoardSize(Number(boardSizeSelectElement.value) || 4),
    adjacencyByCellIndex: /** @type {number[][]} */ ([]),
    cellButtons: /** @type {HTMLButtonElement[]} */ ([]),

    startCellIndex: /** @type {number|null} */ (null),
    currentCellIndex: /** @type {number|null} */ (null),
    visitedByCellIndex: /** @type {boolean[]} */ ([]),
    pathCellIndices: /** @type {number[]} */ ([]),

    startedAtEpochMs: /** @type {number|null} */ (null),
    timerId: /** @type {number|null} */ (null),

    usedAnswer: false,
    usedDemo: false,
    // isDemoSession：是否为“动画演示”会话（不计入玩家记录）。
    isDemoSession: false,
    isAnimating: false,
    animationAbortController: /** @type {{aborted: boolean} | null} */ (null),
  };

  applyBoardSize(game.boardSize);
  randomizeSpringBanner();
  renderRecordsSummary();
  wireEvents();
  showRulesModal();

  function wireEvents() {
    boardSizeSelectElement.addEventListener("change", () => {
      const nextSize = clampBoardSize(Number(boardSizeSelectElement.value) || 4);
      if (nextSize === game.boardSize) return;
      endCurrentSessionIfNeeded("giveup");
      applyBoardSize(nextSize);
    });

    resetButton.addEventListener("click", () => {
      endCurrentSessionIfNeeded("giveup");
      resetGameUiState();
    });

    undoButton.addEventListener("click", () => undoOneMove());
    hintButton.addEventListener("click", () => showOneMoveHint());
    answerButton.addEventListener("click", () => showAnswerModal());
    demoButton.addEventListener("click", () => toggleDemo());
    soundButton.addEventListener("click", () => toggleSound());
    clearRecordsButton.addEventListener("click", () => clearRecords());

    rulesButton.addEventListener("click", () => showRulesModal());
    startButton.addEventListener("click", () => hideRulesModal());

    answerCloseButton.addEventListener("click", () => hideAnswerModal());
    answerModalBackdrop.addEventListener("click", (event) => {
      if (event.target === answerModalBackdrop) hideAnswerModal();
    });

    winModalBackdrop.addEventListener("click", (event) => {
      if (event.target === winModalBackdrop) hideWinModal();
    });
    playAgainButton.addEventListener("click", () => {
      hideWinModal();
      endCurrentSessionIfNeeded("giveup");
      resetGameUiState();
    });
    winDemoButton.addEventListener("click", () => {
      hideWinModal();
      toggleDemo({ forceStart: true, preferDifferent: true });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!rulesModalBackdrop.hidden) {
        hideRulesModal();
        return;
      }
      if (!answerModalBackdrop.hidden) {
        hideAnswerModal();
        return;
      }
      if (!winModalBackdrop.hidden) {
        hideWinModal();
        return;
      }
      if (game.isAnimating) stopDemo();
    });
  }

  function applyBoardSize(boardSize) {
    game.boardSize = boardSize;
    game.adjacencyByCellIndex = ChessHorseKnightTourSolver.buildKnightAdjacency(boardSize);
    buildBoardDom(boardSize);
    resetGameUiState();
    renderRecordsSummary();
  }

  function buildBoardDom(boardSize) {
    const cellCount = boardSize * boardSize;
    boardElement.style.setProperty("--board-size", String(boardSize));
    boardElement.setAttribute("aria-label", `${boardSize}×${boardSize} 棋盘`);
    boardElement.innerHTML = "";

    game.cellButtons = [];
    for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 1) {
      const cellButton = document.createElement("button");
      cellButton.type = "button";
      cellButton.className = "cell";
      cellButton.setAttribute("role", "gridcell");
      cellButton.dataset.cellIndex = String(cellIndex);
      cellButton.dataset.color = cellColor(boardSize, cellIndex);
      cellButton.setAttribute("aria-label", cellAriaLabel(boardSize, cellIndex));

      const contentSpan = document.createElement("span");
      contentSpan.className = "cell-content";
      contentSpan.textContent = "";
      cellButton.appendChild(contentSpan);

      const startBadgeSpan = document.createElement("span");
      startBadgeSpan.className = "cell-start-badge";
      startBadgeSpan.hidden = true;
      startBadgeSpan.textContent = "起点";
      cellButton.appendChild(startBadgeSpan);

      const stepSpan = document.createElement("span");
      stepSpan.className = "cell-step";
      stepSpan.hidden = true;
      stepSpan.textContent = "";
      cellButton.appendChild(stepSpan);

      cellButton.addEventListener("click", () => onCellClick(cellIndex));

      boardElement.appendChild(cellButton);
      game.cellButtons.push(cellButton);
    }
  }

  function resetGameUiState() {
    stopTimer();
    stopDemo();
    randomizeSpringBanner();

    const cellCount = game.boardSize * game.boardSize;
    game.startCellIndex = null;
    game.currentCellIndex = null;
    game.visitedByCellIndex = Array.from({ length: cellCount }, () => false);
    game.pathCellIndices = [];
    game.startedAtEpochMs = null;
    game.usedAnswer = false;
    game.usedDemo = false;
    game.isDemoSession = false;

    setHelpText("先点一个格子作为起点。");
    render();
  }

  function onCellClick(cellIndex) {
    if (game.isAnimating) return;

    if (game.startCellIndex === null) {
      startNewSession(cellIndex);
      return;
    }

    if (game.currentCellIndex === null) return;
    if (game.visitedByCellIndex[cellIndex]) return;

    const legalTargets = getLegalTargetsFromCurrent();
    if (!legalTargets.includes(cellIndex)) {
      setHelpText("这一步不是“日”字，或者目标格已走过。");
      return;
    }

    applyMoveTo(cellIndex);
  }

  function startNewSession(startCellIndex) {
    const cellCount = game.boardSize * game.boardSize;
    if (startCellIndex < 0 || startCellIndex >= cellCount) return;

    game.startCellIndex = startCellIndex;
    game.currentCellIndex = startCellIndex;
    game.visitedByCellIndex[startCellIndex] = true;
    game.pathCellIndices = [startCellIndex];
    game.startedAtEpochMs = Date.now();
    game.isDemoSession = false;
    startTimer();

    maybeShowBlessing();
    maybePopFireworkNearCell(startCellIndex);
    setHelpText("很好！现在按绿色提示走“日”字，走遍所有格子。");
    render();
  }

  function applyMoveTo(nextCellIndex) {
    if (game.currentCellIndex === null) return;
    game.currentCellIndex = nextCellIndex;
    game.visitedByCellIndex[nextCellIndex] = true;
    game.pathCellIndices.push(nextCellIndex);

    playMoveSound();
    maybeShowBlessing();
    maybePopFireworkNearCell(nextCellIndex);

    const cellCount = game.boardSize * game.boardSize;
    if (game.pathCellIndices.length === cellCount) {
      completeGame();
      return;
    }

    const nextLegalTargets = getLegalTargetsFromCurrent();
    if (nextLegalTargets.length === 0) {
      setHelpText("走不动啦！你可以撤销一步，或者点“显示答案/动画演示”。");
    } else {
      setHelpText("继续加油！");
    }

    render();
  }

  function completeGame() {
    stopTimer();
    const durationMs = game.startedAtEpochMs ? Date.now() - game.startedAtEpochMs : 0;
    const total = game.boardSize * game.boardSize;
    const covered = game.pathCellIndices.length;
    const blessing = randomPick(BLESSINGS);

    for (let i = 0; i < 18; i += 1) popFireworkRandom();

    if (!game.isDemoSession) {
      records.push({
        boardSize: game.boardSize,
        ts: Date.now(),
        durationMs,
        covered,
        total,
        completed: true,
        usedAnswer: game.usedAnswer,
        usedDemo: game.usedDemo,
      });
      saveRecords(records);
      renderRecordsSummary();
    }

    winTitleElement.textContent = game.isDemoSession ? "演示完成！" : "恭喜通关！";
    winBodyElement.textContent = `用时 ${formatTimeMmSs(durationMs)}，覆盖 ${total}/${total} 格。${blessing}`;
    showWinModal();
    render();
  }

  function endCurrentSessionIfNeeded(reason) {
    if (game.isDemoSession) return;
    if (game.startCellIndex === null) return;
    if (game.pathCellIndices.length === 0) return;
    const total = game.boardSize * game.boardSize;
    if (game.pathCellIndices.length === total) return;

    const durationMs = game.startedAtEpochMs ? Date.now() - game.startedAtEpochMs : 0;
    records.push({
      boardSize: game.boardSize,
      ts: Date.now(),
      durationMs,
      covered: game.pathCellIndices.length,
      total,
      completed: false,
      usedAnswer: game.usedAnswer,
      usedDemo: game.usedDemo,
      reason,
    });
    saveRecords(records);
    renderRecordsSummary();
  }

  function undoOneMove() {
    if (game.isAnimating) return;
    if (game.pathCellIndices.length <= 1) return;
    const lastCellIndex = game.pathCellIndices.pop();
    if (typeof lastCellIndex !== "number") return;

    game.visitedByCellIndex[lastCellIndex] = false;
    game.currentCellIndex = game.pathCellIndices[game.pathCellIndices.length - 1] ?? null;
    setHelpText("已撤销一步。");
    render();
  }

  function getLegalTargetsFromCurrent() {
    if (game.currentCellIndex === null) return [];
    const targets = [];
    for (const nextCellIndex of game.adjacencyByCellIndex[game.currentCellIndex]) {
      if (game.visitedByCellIndex[nextCellIndex]) continue;
      targets.push(nextCellIndex);
    }
    return targets;
  }

  function showOneMoveHint() {
    if (game.isAnimating) return;
    if (game.startCellIndex === null || game.currentCellIndex === null) {
      setHelpText("先选一个起点再提示。");
      return;
    }

    const pathPrefix = game.pathCellIndices.slice();
    const solutionPath = ChessHorseKnightTourSolver.findKnightTourPath({
      boardSize: game.boardSize,
      pathPrefix,
      maxTimeMs: 900,
      randomSeed: Date.now() & 0xffff,
    });

    if (!solutionPath) {
      setHelpText("提示：从当前状态未找到可通关的继续走法（可以撤销或重置再试）。");
      return;
    }

    const nextCellIndex = solutionPath[pathPrefix.length];
    if (typeof nextCellIndex !== "number") return;

    setHelpText(`提示：下一步可以走到 ${cellName(game.boardSize, nextCellIndex)}。`);
    render({ hintCellIndex: nextCellIndex });
  }

  function showAnswerModal() {
    game.usedAnswer = true;

    const boardSize = game.boardSize;
    const total = boardSize * boardSize;

    answerHintElement.textContent = "";
    answerFromCurrentElement.textContent = "-";
    answerFromStartElement.textContent = "-";

    if (boardSize === 4) {
      answerFromStartElement.textContent = "4×4：不存在走遍全盘的路径（无论起点）。";
      if (game.startCellIndex === null) {
        answerFromCurrentElement.textContent = "请先选择起点。";
      } else {
        answerFromCurrentElement.textContent = "当前状态：也无法完成全覆盖。";
      }
      showModal(answerModalBackdrop);
      return;
    }

    if (game.startCellIndex === null || game.currentCellIndex === null) {
      answerFromStartElement.textContent = `请先选择一个起点，我会判断“从该点出发是否存在走遍 ${total}/${total} 格的路径”。`;
      answerFromCurrentElement.textContent =
        "提示：4×4 无解；5×5 及以上通常有解。";
      showModal(answerModalBackdrop);
      return;
    }

    const fromStartPath = ChessHorseKnightTourSolver.findKnightTourPath({
      boardSize,
      pathPrefix: [game.startCellIndex],
      maxTimeMs: 1200,
      randomSeed: (Date.now() + 7) & 0xffff,
    });

    if (fromStartPath) {
      answerFromStartElement.textContent = `存在路径：从起点 ${cellName(boardSize, game.startCellIndex)} 可以走遍 ${total}/${total} 格。`;
    } else {
      answerFromStartElement.textContent = `未找到路径：从起点 ${cellName(boardSize, game.startCellIndex)} 未找到走遍 ${total}/${total} 格的路径（可尝试“动画演示”再试一次）。`;
    }

    const fromCurrentPath = ChessHorseKnightTourSolver.findKnightTourPath({
      boardSize,
      pathPrefix: game.pathCellIndices.slice(),
      maxTimeMs: 1200,
      randomSeed: (Date.now() + 13) & 0xffff,
    });

    if (fromCurrentPath) {
      const remaining = total - game.pathCellIndices.length;
      answerFromCurrentElement.textContent = `可以继续完成：还剩 ${remaining} 步能覆盖全盘。`;
    } else {
      answerFromCurrentElement.textContent = "不能继续完成：按当前已走的格子限制，无法覆盖全盘（可撤销或重置）。";
    }

    answerHintElement.textContent =
      "小提示：4×4 天生无解；5×5 及以上通常有解。你也可以用“提示一步”学一学更稳的走法。";

    showModal(answerModalBackdrop);
  }

  function toggleDemo({ forceStart = false, preferDifferent = false } = {}) {
    if (game.isAnimating) {
      stopDemo();
      return;
    }
    if (forceStart) {
      startDemo(preferDifferent);
      return;
    }
    startDemo(false);
  }

  function startDemo(preferDifferent) {
    if (game.startCellIndex === null) {
      setHelpText("先点一个起点，再开始动画演示。");
      return;
    }

    const seed = preferDifferent ? (Date.now() + 99991) & 0xffff : Date.now() & 0xffff;
    const solutionPath = ChessHorseKnightTourSolver.findKnightTourPath({
      boardSize: game.boardSize,
      pathPrefix: [game.startCellIndex],
      maxTimeMs: 2000,
      randomSeed: seed,
    });

    if (!solutionPath) {
      setHelpText("动画演示：未找到可行路径（可换起点/换棋盘大小再试）。");
      return;
    }

    stopTimer();
    stopDemo();
    resetGameUiState();
    game.usedDemo = true;
    game.isDemoSession = true;
    game.startCellIndex = solutionPath[0];
    game.currentCellIndex = solutionPath[0];
    game.visitedByCellIndex[solutionPath[0]] = true;
    game.pathCellIndices = [solutionPath[0]];
    game.startedAtEpochMs = Date.now();
    startTimer();
    render();

    const abortController = { aborted: false };
    game.animationAbortController = abortController;
    game.isAnimating = true;
    demoButton.textContent = "停止演示";

    setHelpText("正在演示一条可行路径…");
    runDemoAnimation(solutionPath, abortController).catch(() => {
      // 忽略动画中断异常
    });
  }

  async function runDemoAnimation(solutionPath, abortController) {
    for (let stepIndex = 1; stepIndex < solutionPath.length; stepIndex += 1) {
      if (abortController.aborted) return;
      const delayMs = demoDelayMsFromSpeed(Number(speedRangeElement.value) || 6);
      await sleep(delayMs);
      if (abortController.aborted) return;
      applyMoveTo(solutionPath[stepIndex]);
      if (game.pathCellIndices.length === game.boardSize * game.boardSize) {
        stopDemo();
        return;
      }
    }
    stopDemo();
  }

  function stopDemo() {
    if (!game.isAnimating) return;
    game.isAnimating = false;
    if (game.animationAbortController) game.animationAbortController.aborted = true;
    game.animationAbortController = null;
    demoButton.textContent = "动画演示";
    render();
  }

  function demoDelayMsFromSpeed(speedValue) {
    const clampedSpeedValue = Math.max(1, Math.min(10, Math.floor(speedValue)));
    const slowMs = 650;
    const fastMs = 80;
    const t = (clampedSpeedValue - 1) / 9;
    return Math.round(slowMs + (fastMs - slowMs) * t);
  }

  function startTimer() {
    stopTimer();
    tickTimer();
    game.timerId = window.setInterval(() => tickTimer(), 250);
  }

  function stopTimer() {
    if (game.timerId !== null) window.clearInterval(game.timerId);
    game.timerId = null;
    tickTimer();
  }

  function tickTimer() {
    if (!game.startedAtEpochMs) {
      timeTextElement.textContent = "00:00";
      return;
    }
    const elapsedMs = Date.now() - game.startedAtEpochMs;
    timeTextElement.textContent = formatTimeMmSs(elapsedMs);
  }

  function render({ hintCellIndex = null } = {}) {
    const total = game.boardSize * game.boardSize;
    const covered = game.pathCellIndices.length;
    moveCountElement.textContent = String(Math.max(0, covered - 1));
    progressTextElement.textContent = `${covered}/${total}`;

    undoButton.disabled = covered <= 1 || game.isAnimating;
    hintButton.disabled = covered <= 0 || game.isAnimating;
    demoButton.disabled = game.startCellIndex === null;

    const legalTargets = game.isAnimating ? [] : getLegalTargetsFromCurrent();

    for (let cellIndex = 0; cellIndex < game.cellButtons.length; cellIndex += 1) {
      const cellButton = game.cellButtons[cellIndex];
      const contentSpan = /** @type {HTMLElement} */ (cellButton.querySelector(".cell-content"));
      const startBadgeSpan = /** @type {HTMLElement} */ (
        cellButton.querySelector(".cell-start-badge")
      );
      const stepSpan = /** @type {HTMLElement} */ (cellButton.querySelector(".cell-step"));

      const isVisited = game.visitedByCellIndex[cellIndex];
      const isCurrent = game.currentCellIndex === cellIndex;
      const isStart = game.startCellIndex === cellIndex;
      const isTarget = legalTargets.includes(cellIndex) || hintCellIndex === cellIndex;

      cellButton.classList.toggle("visited", isVisited);
      cellButton.classList.toggle("current", isCurrent);
      cellButton.classList.toggle("move-target", isTarget);

      startBadgeSpan.hidden = !isStart;

      const stepNumber = isVisited ? game.pathCellIndices.indexOf(cellIndex) + 1 : 0;
      if (stepNumber > 0) {
        stepSpan.hidden = false;
        stepSpan.textContent = String(stepNumber);
      } else {
        stepSpan.hidden = true;
        stepSpan.textContent = "";
      }

      contentSpan.textContent = isCurrent ? KNIGHT_ICON : "";
      cellButton.setAttribute("aria-label", cellAriaLabel(game.boardSize, cellIndex, stepNumber, isCurrent, isTarget));
    }
  }

  function renderRecordsSummary() {
    const boardSize = game.boardSize;
    const total = boardSize * boardSize;
    const filtered = records.filter((r) => r && r.boardSize === boardSize);
    const attempts = filtered.length;
    const wins = filtered.filter((r) => r.completed).length;
    const bestTimeMs = filtered
      .filter((r) => r.completed)
      .map((r) => r.durationMs)
      .reduce((min, v) => (typeof v === "number" ? Math.min(min, v) : min), Number.POSITIVE_INFINITY);
    const bestCoverage = filtered
      .map((r) => r.covered)
      .reduce((max, v) => (typeof v === "number" ? Math.max(max, v) : max), 0);

    recordAttemptsElement.textContent = String(attempts);
    recordWinsElement.textContent = String(wins);
    recordBestTimeElement.textContent = Number.isFinite(bestTimeMs)
      ? formatTimeMmSs(bestTimeMs)
      : "-";
    recordBestCoverageElement.textContent =
      bestCoverage > 0 ? `${bestCoverage}/${total}` : "-";
  }

  function clearRecords() {
    if (!confirm("确定要清空 chesshorse 的本地记录吗？")) return;
    records = [];
    saveRecords(records);
    renderRecordsSummary();
    setHelpText("已清空记录。");
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    saveSoundEnabled(soundEnabled);
    updateSoundButtonUi();
  }

  function updateSoundButtonUi() {
    soundButton.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    soundButton.textContent = soundEnabled ? "音效：开" : "音效：关";
  }

  function playMoveSound() {
    if (!soundEnabled) return;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const context = audioContext;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = 520;

      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.09);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.1);
    } catch {
      // 忽略音效失败
    }
  }

  function randomizeSpringBanner() {
    springBannerTextElement.textContent = randomPick(BLESSINGS);
  }

  function maybeShowBlessing() {
    if (Math.random() > 0.12) return;
    const idiom = randomPick(BLESSING_IDIOMS);
    setHelpText(`祝福：${idiom}！`);
  }

  function maybePopFireworkNearCell(cellIndex) {
    if (Math.random() > 0.08) return;
    const rect = boardElement.getBoundingClientRect();
    const boardSize = game.boardSize;
    const [rowIndex, colIndex] = indexToRowCol(boardSize, cellIndex);
    const x = rect.left + ((colIndex + 0.5) / boardSize) * rect.width;
    const y = rect.top + ((rowIndex + 0.5) / boardSize) * rect.height;
    popFireworkAtViewportPoint(x, y);
  }

  function popFireworkRandom() {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight * 0.6;
    popFireworkAtViewportPoint(x, y);
  }

  function popFireworkAtViewportPoint(x, y) {
    const fireworkElement = document.createElement("div");
    fireworkElement.className = "firework";
    fireworkElement.textContent = randomPick(FIREWORK_EMOJIS);
    fireworkElement.style.left = `${Math.round(x)}px`;
    fireworkElement.style.top = `${Math.round(y)}px`;
    fireworkElement.style.setProperty("--fw-rot", `${Math.round(Math.random() * 30 - 15)}deg`);
    fireworkElement.style.animationDuration = `${Math.round(800 + Math.random() * 800)}ms`;
    fxLayerElement.appendChild(fireworkElement);

    window.setTimeout(() => {
      fireworkElement.remove();
    }, 1400);
  }

  function showRulesModal() {
    showModal(rulesModalBackdrop);
  }

  function hideRulesModal() {
    hideModal(rulesModalBackdrop);
  }

  function hideAnswerModal() {
    hideModal(answerModalBackdrop);
  }

  function showWinModal() {
    showModal(winModalBackdrop);
  }

  function hideWinModal() {
    hideModal(winModalBackdrop);
  }

  function showModal(backdropElement) {
    lastFocusBeforeModal = document.activeElement;
    backdropElement.hidden = false;
    const focusTarget = /** @type {HTMLElement|null} */ (
      backdropElement.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
    );
    if (focusTarget) focusTarget.focus();
  }

  function hideModal(backdropElement) {
    backdropElement.hidden = true;
    if (lastFocusBeforeModal && typeof lastFocusBeforeModal.focus === "function") {
      lastFocusBeforeModal.focus();
    }
    lastFocusBeforeModal = null;
  }

  function setHelpText(text) {
    helpTextElement.textContent = text;
  }

  function cellColor(boardSize, cellIndex) {
    const [rowIndex, colIndex] = indexToRowCol(boardSize, cellIndex);
    return (rowIndex + colIndex) % 2 === 0 ? "light" : "dark";
  }

  function indexToRowCol(boardSize, cellIndex) {
    return [Math.floor(cellIndex / boardSize), cellIndex % boardSize];
  }

  function cellName(boardSize, cellIndex) {
    const [rowIndex, colIndex] = indexToRowCol(boardSize, cellIndex);
    return `(${rowIndex + 1},${colIndex + 1})`;
  }

  // cellAriaLabel：给屏幕阅读器的格子说明（含坐标/步号/是否可走/是否当前）。
  function cellAriaLabel(boardSize, cellIndex, stepNumber = 0, isCurrent = false, isTarget = false) {
    const parts = [`格子 ${cellName(boardSize, cellIndex)}`];
    if (stepNumber > 0) parts.push(`第 ${stepNumber} 步`);
    if (isCurrent) parts.push("当前马所在");
    if (isTarget) parts.push("可走");
    return parts.join("，");
  }

  function formatTimeMmSs(durationMs) {
    const seconds = Math.max(0, Math.floor(durationMs / 1000));
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function clampBoardSize(n) {
    if (!Number.isFinite(n)) return 4;
    const v = Math.floor(n);
    return Math.max(4, Math.min(8, v));
  }

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.records);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveRecords(nextRecords) {
    try {
      localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(nextRecords));
    } catch {
      // 忽略存储失败
    }
  }

  function loadSoundEnabled() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.soundEnabled);
      if (raw === null) return true;
      return raw === "1";
    } catch {
      return true;
    }
  }

  function saveSoundEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEYS.soundEnabled, enabled ? "1" : "0");
    } catch {
      // 忽略存储失败
    }
  }

  function randomPick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function mustGetElementById(id) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing element: #${id}`);
    return element;
  }
})();
