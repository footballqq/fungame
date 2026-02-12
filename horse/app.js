// codex: 2026-02-11 增加春节氛围与可玩性：随机祝福成语/烟花特效/成绩记录 localStorage/走子音效可关闭
(() => {
  "use strict";

  // 3×3 棋盘：索引 0..8，按行优先（0=左上角，2=右上角，6=左下角，8=右下角）。
  const BOARD_SIZE = 3;
  const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

  // 初始局面：白马在底部两个角，黑马在顶部两个角。
  const START_STATE = freezeState({
    whitePositions: [6, 8],
    blackPositions: [0, 2],
  });

  // 目标局面：交换位置。
  const GOAL_STATE = freezeState({
    whitePositions: [0, 2],
    blackPositions: [6, 8],
  });

  // 白/黑的显示（用“表情包”马：emoji）。
  const PIECE_DISPLAY = {
    white: "🐴",
    black: "🐎",
  };

  // “日”字走法（Knight's move）。
  const KNIGHT_DELTAS = Object.freeze([
    [1, 2],
    [2, 1],
    [-1, 2],
    [-2, 1],
    [1, -2],
    [2, -1],
    [-1, -2],
    [-2, -1],
  ]);

  const boardElement = mustGetElementById("board");
  const moveCountElement = mustGetElementById("moveCount");
  const bestCountElement = mustGetElementById("bestCount");
  const helpTextElement = mustGetElementById("helpText");
  const undoButton = mustGetElementById("undoBtn");
  const hintButton = mustGetElementById("hintBtn");
  const resetButton = mustGetElementById("resetBtn");
  const rulesButton = mustGetElementById("rulesBtn");
  const rulesModalBackdrop = mustGetElementById("rulesModal");
  const startButton = mustGetElementById("startBtn");
  const soundButton = mustGetElementById("soundBtn");
  const clearRecordsButton = mustGetElementById("clearRecordsBtn");
  const recordWinsElement = mustGetElementById("recordWins");
  const recordBestElement = mustGetElementById("recordBest");
  const recordLastElement = mustGetElementById("recordLast");
  const recordOptimalElement = mustGetElementById("recordOptimal");
  const fxLayerElement = mustGetElementById("fxLayer");
  const winModalBackdrop = mustGetElementById("winModal");
  const winTitleElement = mustGetElementById("winTitle");
  const winBodyElement = mustGetElementById("winBody");
  const playAgainButton = mustGetElementById("playAgainBtn");

  /** @type {Element|null} */
  let lastFocusBeforeRulesModal = null;

  const STORAGE_KEYS = Object.freeze({
    // horse_swap_records_v1：通关记录数组（moves/ts/isOptimal）。
    records: "horse_swap_records_v1",
    // horse_swap_sound_enabled_v1：走子音效开关。
    soundEnabled: "horse_swap_sound_enabled_v1",
  });

  const BLESSING_IDIOMS = Object.freeze([
    "马到成功",
    "一马当先",
    "龙马精神",
    "马不停蹄",
    "万马奔腾",
  ]);

  /** @type {{moves: number, ts: number, isOptimal: boolean}[]} */
  let winRecords = loadWinRecords();

  let soundEnabled = loadSoundEnabled();
  updateSoundButtonUi();

  /** @type {AudioContext|null} */
  let audioContext = null;

  /** @type {{state: PuzzleState, selectedCellIndex: number|null, history: PuzzleState[]}} */
  const game = {
    state: START_STATE,
    selectedCellIndex: null,
    history: [],
  };

  const adjacencyByCellIndex = buildKnightAdjacency();
  const distanceToGoalByStateKey = computeDistancesToGoal();
  const bestStepsFromStart = distanceToGoalByStateKey.get(stateKey(START_STATE));

  if (typeof bestStepsFromStart === "number") {
    bestCountElement.textContent = String(bestStepsFromStart);
  } else {
    bestCountElement.textContent = "未知";
    setHelpText("提示：当前浏览器环境下未能计算最优步数。仍可正常游玩。");
  }

  initBoardDom();
  render();
  renderRecords();
  wireEvents();
  showRulesModal();

  function wireEvents() {
    undoButton.addEventListener("click", () => undoMove());
    resetButton.addEventListener("click", () => resetGame());
    hintButton.addEventListener("click", () => showOneStepHint());
    playAgainButton.addEventListener("click", () => resetGame());
    rulesButton.addEventListener("click", () => showRulesModal());
    startButton.addEventListener("click", () => hideRulesModal());
    soundButton.addEventListener("click", () => toggleSound());
    clearRecordsButton.addEventListener("click", () => clearRecords());

    winModalBackdrop.addEventListener("click", (event) => {
      if (event.target === winModalBackdrop) resetGame();
    });

    rulesModalBackdrop.addEventListener("click", (event) => {
      if (event.target === rulesModalBackdrop) hideRulesModal();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!rulesModalBackdrop.hidden) {
        hideRulesModal();
        return;
      }
      if (!winModalBackdrop.hidden) resetGame();
    });
  }

  function initBoardDom() {
    boardElement.innerHTML = "";
    for (let cellIndex = 0; cellIndex < CELL_COUNT; cellIndex += 1) {
      const cellButton = document.createElement("button");
      cellButton.type = "button";
      cellButton.className = "cell";
      cellButton.dataset.cellIndex = String(cellIndex);
      cellButton.setAttribute("role", "gridcell");
      cellButton.setAttribute("aria-label", cellAriaLabel(cellIndex));

      const rowIndex = Math.floor(cellIndex / BOARD_SIZE);
      const colIndex = cellIndex % BOARD_SIZE;
      const dark = (rowIndex + colIndex) % 2 === 1;
      if (dark) cellButton.dataset.color = "dark";

      cellButton.addEventListener("click", () => onCellClick(cellIndex));
      boardElement.appendChild(cellButton);
    }
  }

  function render() {
    moveCountElement.textContent = String(game.history.length);
    undoButton.disabled = game.history.length === 0;

    const cellButtons = /** @type {HTMLButtonElement[]} */ (
      Array.from(boardElement.querySelectorAll("button.cell"))
    );

    const selectedCellIndex = game.selectedCellIndex;
    const legalTargets = selectedCellIndex === null
      ? new Set()
      : new Set(getLegalTargetsFromSelectedCell(selectedCellIndex, game.state));

    for (const cellButton of cellButtons) {
      const cellIndex = Number(cellButton.dataset.cellIndex);
      const pieceAtCell = getPieceAtCellIndex(game.state, cellIndex);

      cellButton.classList.toggle("selected", cellIndex === selectedCellIndex);
      cellButton.classList.toggle("move-target", legalTargets.has(cellIndex));

      const ariaSuffix = pieceAtCell ? `，有${pieceAtCell === "white" ? "白马" : "黑马"}` : "，空";
      cellButton.setAttribute("aria-label", `${cellAriaLabel(cellIndex)}${ariaSuffix}`);

      cellButton.innerHTML = "";
      if (pieceAtCell) {
        const pieceSpan = document.createElement("span");
        pieceSpan.className = `piece ${pieceAtCell}`;
        pieceSpan.textContent = PIECE_DISPLAY[pieceAtCell];
        pieceSpan.setAttribute(
          "aria-label",
          pieceAtCell === "white" ? "白马" : "黑马",
        );
        cellButton.appendChild(pieceSpan);
      }
    }

    if (isGoalState(game.state)) {
      showWinModal();
    } else {
      hideWinModal();
    }
  }

  function onCellClick(cellIndex) {
    if (isGoalState(game.state)) return;

    const pieceAtCell = getPieceAtCellIndex(game.state, cellIndex);

    if (game.selectedCellIndex === null) {
      if (!pieceAtCell) {
        setHelpText("先点按一个棋子。");
        return;
      }
      game.selectedCellIndex = cellIndex;
      setHelpText("已选中棋子：请选择一个绿色标记的目标格。");
      render();
      return;
    }

    if (cellIndex === game.selectedCellIndex) {
      game.selectedCellIndex = null;
      setHelpText("已取消选择。");
      render();
      return;
    }

    const selectedCellIndex = game.selectedCellIndex;
    const legalTargets = getLegalTargetsFromSelectedCell(selectedCellIndex, game.state);
    const isLegalTarget = legalTargets.includes(cellIndex);

    if (isLegalTarget) {
      applyMove(selectedCellIndex, cellIndex);
      game.selectedCellIndex = null;
      setHelpText("");
      render();
      return;
    }

    if (pieceAtCell) {
      game.selectedCellIndex = cellIndex;
      setHelpText("已切换选中棋子：请选择一个绿色标记的目标格。");
      render();
      return;
    }

    setHelpText("不是合法走法：马必须走“日”字，且目标格必须为空。");
  }

  function applyMove(fromCellIndex, toCellIndex) {
    const movingPiece = getPieceAtCellIndex(game.state, fromCellIndex);
    if (!movingPiece) return;

    const nextState = movePiece(game.state, movingPiece, fromCellIndex, toCellIndex);
    if (!nextState) return;

    game.history.push(game.state);
    game.state = nextState;
    onAfterPlayerMove();
  }

  function onAfterPlayerMove() {
    // 走子音效：默认开启，可关闭。不会在提示/撤销时触发。
    playMoveSound();

    // 随机祝福与烟花：各 1/5 概率，互不排斥。
    if (Math.random() < 0.6) {
      const idiom = BLESSING_IDIOMS[randomInt(BLESSING_IDIOMS.length)];
      setHelpText(`🐴 ${idiom}！祝你新春顺遂！`);
    }
    if (Math.random() < 0.6) {
      spawnFireworks();
    }
  }

  function undoMove() {
    if (game.history.length === 0) return;
    game.selectedCellIndex = null;
    game.state = game.history.pop();
    setHelpText("已撤销一步。");
    render();
  }

  function resetGame() {
    game.state = START_STATE;
    game.selectedCellIndex = null;
    game.history = [];
    setHelpText("");
    hideWinModal();
    render();
  }

  function showRulesModal() {
    if (!rulesModalBackdrop.hidden) return;
    lastFocusBeforeRulesModal = document.activeElement;
    startButton.textContent = game.history.length === 0 ? "开始游戏" : "继续游戏";
    rulesModalBackdrop.hidden = false;
    startButton.focus();
  }

  function hideRulesModal() {
    rulesModalBackdrop.hidden = true;
    const focusTarget = lastFocusBeforeRulesModal;
    lastFocusBeforeRulesModal = null;
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
  }

  function showOneStepHint() {
    if (isGoalState(game.state)) return;

    const currentDistance = distanceToGoalByStateKey.get(stateKey(game.state));
    if (typeof currentDistance !== "number") {
      setHelpText("当前状态无法计算提示（可能是不可达状态）。");
      return;
    }
    if (currentDistance === 0) return;

    const suggestion = findMoveThatReducesDistance(game.state, currentDistance);
    if (!suggestion) {
      setHelpText("没有找到可用提示（可能是不可达状态）。");
      return;
    }

    const { fromCellIndex, toCellIndex } = suggestion;
    game.selectedCellIndex = fromCellIndex;
    setHelpText(`提示：从 ${cellName(fromCellIndex)} 走到 ${cellName(toCellIndex)}。`);
    render();
  }

  function showWinModal() {
    if (!winModalBackdrop.hidden) return;
    hideRulesModal();

    const movesUsed = game.history.length;
    const best = typeof bestStepsFromStart === "number" ? bestStepsFromStart : null;
    const isOptimal = best !== null && movesUsed === best;

    winTitleElement.textContent = isOptimal ? "太强了！最优通关！" : "恭喜通关！";
    if (best === null) {
      winBodyElement.textContent = `你用了 ${movesUsed} 步完成互换。`;
    } else if (isOptimal) {
      winBodyElement.textContent = `你用了 ${movesUsed} 步完成互换，刚好是最优步数（${best}）。`;
    } else {
      winBodyElement.textContent = `你用了 ${movesUsed} 步完成互换。最优步数是 ${best}，再挑战一下看看能不能更快！`;
    }

    addWinRecord({
      moves: movesUsed,
      ts: Date.now(),
      isOptimal,
    });

    winModalBackdrop.hidden = false;
    playAgainButton.focus();
  }

  function hideWinModal() {
    winModalBackdrop.hidden = true;
  }

  function setHelpText(message) {
    helpTextElement.textContent = message;
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    persistSoundEnabled(soundEnabled);
    updateSoundButtonUi();
    setHelpText(soundEnabled ? "已开启走子音效。" : "已关闭走子音效。");
  }

  function updateSoundButtonUi() {
    soundButton.textContent = soundEnabled ? "音效：开" : "音效：关";
    soundButton.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
  }

  function playMoveSound() {
    if (!soundEnabled) return;

    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // 某些浏览器需要 resume 才能出声（用户点击后调用，符合手势要求）。
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }

      const now = audioContext.currentTime;
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      gainNode.connect(audioContext.destination);

      // 两个短音拼成“哒哒”马蹄感。
      const osc1 = audioContext.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(440, now);
      osc1.connect(gainNode);
      osc1.start(now);
      osc1.stop(now + 0.08);

      const osc2 = audioContext.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(554.37, now + 0.08);
      osc2.connect(gainNode);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.16);
    } catch {
      // 忽略音频异常，避免影响游戏。
    }
  }

  function spawnFireworks() {
    // 简易烟花：往固定图层注入若干粒子，动画结束自动清理。
    const burstCount = 10 + randomInt(8);
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const baseX = viewportWidth * (0.25 + Math.random() * 0.5);
    const baseY = viewportHeight * (0.18 + Math.random() * 0.22);

    for (let i = 0; i < burstCount; i += 1) {
      const particle = document.createElement("span");
      particle.className = "firework";
      particle.textContent = Math.random() < 0.5 ? "🎆" : "✨";

      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 90;
      const x = baseX + Math.cos(angle) * radius;
      const y = baseY + Math.sin(angle) * radius;

      particle.style.left = `${Math.round(x)}px`;
      particle.style.top = `${Math.round(y)}px`;
      particle.style.setProperty("--fw-rot", `${Math.round(Math.random() * 60 - 30)}deg`);
      particle.style.animationDuration = `${650 + randomInt(450)}ms`;

      fxLayerElement.appendChild(particle);

      const cleanup = () => {
        particle.removeEventListener("animationend", cleanup);
        particle.remove();
      };
      particle.addEventListener("animationend", cleanup);
    }
  }

  function randomInt(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
  }

  function loadSoundEnabled() {
    const stored = safeLocalStorageGet(STORAGE_KEYS.soundEnabled);
    if (stored === null) return true;
    return stored !== "0";
  }

  function persistSoundEnabled(enabled) {
    safeLocalStorageSet(STORAGE_KEYS.soundEnabled, enabled ? "1" : "0");
  }

  function loadWinRecords() {
    const raw = safeLocalStorageGet(STORAGE_KEYS.records);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((v) => v && typeof v.moves === "number" && typeof v.ts === "number")
        .map((v) => ({
          moves: v.moves,
          ts: v.ts,
          isOptimal: Boolean(v.isOptimal),
        }));
    } catch {
      return [];
    }
  }

  function persistWinRecords(records) {
    safeLocalStorageSet(STORAGE_KEYS.records, JSON.stringify(records));
  }

  function addWinRecord(record) {
    winRecords = [...winRecords, record].slice(-50);
    persistWinRecords(winRecords);
    renderRecords();
  }

  function clearRecords() {
    winRecords = [];
    persistWinRecords(winRecords);
    renderRecords();
    setHelpText("已清空成绩记录。");
  }

  function renderRecords() {
    recordWinsElement.textContent = String(winRecords.length);
    if (winRecords.length === 0) {
      recordBestElement.textContent = "-";
      recordLastElement.textContent = "-";
      recordOptimalElement.textContent = "-";
      clearRecordsButton.disabled = true;
      return;
    }

    clearRecordsButton.disabled = false;
    const bestMoves = winRecords.reduce((min, r) => Math.min(min, r.moves), Infinity);
    const last = winRecords[winRecords.length - 1];
    const optimalCount = winRecords.reduce((sum, r) => sum + (r.isOptimal ? 1 : 0), 0);

    recordBestElement.textContent = `${bestMoves} 步`;
    recordLastElement.textContent = `${last.moves} 步`;
    recordOptimalElement.textContent = `${optimalCount}/${winRecords.length}`;
  }

  function safeLocalStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // 忽略写入失败（无痕/禁用 localStorage 等）。
    }
  }

  /**
   * @typedef PuzzleState
   * @property {number[]} whitePositions
   * @property {number[]} blackPositions
   */

  function freezeState(state) {
    return Object.freeze({
      whitePositions: Object.freeze([...state.whitePositions].sort((a, b) => a - b)),
      blackPositions: Object.freeze([...state.blackPositions].sort((a, b) => a - b)),
    });
  }

  function isGoalState(state) {
    return stateKey(state) === stateKey(GOAL_STATE);
  }

  function stateKey(state) {
    return `W:${state.whitePositions.join(",")}|B:${state.blackPositions.join(",")}`;
  }

  function mustGetElementById(id) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`缺少元素 #${id}`);
    return element;
  }

  function buildKnightAdjacency() {
    /** @type {number[][]} */
    const adjacency = [];
    for (let cellIndex = 0; cellIndex < CELL_COUNT; cellIndex += 1) {
      const [rowIndex, colIndex] = indexToRowCol(cellIndex);
      /** @type {number[]} */
      const targets = [];
      for (const [deltaRow, deltaCol] of KNIGHT_DELTAS) {
        const nextRowIndex = rowIndex + deltaRow;
        const nextColIndex = colIndex + deltaCol;
        if (!isInsideBoard(nextRowIndex, nextColIndex)) continue;
        targets.push(rowColToIndex(nextRowIndex, nextColIndex));
      }
      adjacency[cellIndex] = targets;
    }
    return adjacency;
  }

  function computeDistancesToGoal() {
    // 由于马走法是可逆的（无“吃子”），状态图是无向图：从目标局面 BFS 即可得到到目标的最短距离。
    /** @type {Map<string, number>} */
    const distanceByKey = new Map();
    /** @type {PuzzleState[]} */
    const queue = [];

    const goalKey = stateKey(GOAL_STATE);
    distanceByKey.set(goalKey, 0);
    queue.push(GOAL_STATE);

    while (queue.length > 0) {
      const currentState = queue.shift();
      const currentKey = stateKey(currentState);
      const currentDistance = distanceByKey.get(currentKey);
      if (typeof currentDistance !== "number") continue;

      for (const nextState of generateNeighborStates(currentState)) {
        const nextKey = stateKey(nextState);
        if (distanceByKey.has(nextKey)) continue;
        distanceByKey.set(nextKey, currentDistance + 1);
        queue.push(nextState);
      }
    }
    return distanceByKey;
  }

  function generateNeighborStates(state) {
    const occupied = new Set([...state.whitePositions, ...state.blackPositions]);
    /** @type {PuzzleState[]} */
    const out = [];

    for (const fromCellIndex of state.whitePositions) {
      for (const toCellIndex of adjacencyByCellIndex[fromCellIndex]) {
        if (occupied.has(toCellIndex)) continue;
        const nextState = movePiece(state, "white", fromCellIndex, toCellIndex);
        if (nextState) out.push(nextState);
      }
    }

    for (const fromCellIndex of state.blackPositions) {
      for (const toCellIndex of adjacencyByCellIndex[fromCellIndex]) {
        if (occupied.has(toCellIndex)) continue;
        const nextState = movePiece(state, "black", fromCellIndex, toCellIndex);
        if (nextState) out.push(nextState);
      }
    }

    return out;
  }

  function movePiece(state, pieceColor, fromCellIndex, toCellIndex) {
    const occupied = new Set([...state.whitePositions, ...state.blackPositions]);
    if (occupied.has(toCellIndex)) return null;

    if (!adjacencyByCellIndex[fromCellIndex].includes(toCellIndex)) return null;

    if (pieceColor === "white") {
      if (!state.whitePositions.includes(fromCellIndex)) return null;
      const nextWhitePositions = state.whitePositions.map((v) =>
        v === fromCellIndex ? toCellIndex : v,
      );
      return freezeState({
        whitePositions: nextWhitePositions,
        blackPositions: state.blackPositions,
      });
    }

    if (!state.blackPositions.includes(fromCellIndex)) return null;
    const nextBlackPositions = state.blackPositions.map((v) =>
      v === fromCellIndex ? toCellIndex : v,
    );
    return freezeState({
      whitePositions: state.whitePositions,
      blackPositions: nextBlackPositions,
    });
  }

  function getPieceAtCellIndex(state, cellIndex) {
    if (state.whitePositions.includes(cellIndex)) return "white";
    if (state.blackPositions.includes(cellIndex)) return "black";
    return null;
  }

  function getLegalTargetsFromSelectedCell(selectedCellIndex, state) {
    const selectedPiece = getPieceAtCellIndex(state, selectedCellIndex);
    if (!selectedPiece) return [];

    const occupied = new Set([...state.whitePositions, ...state.blackPositions]);
    const targets = adjacencyByCellIndex[selectedCellIndex].filter((toCellIndex) => {
      return !occupied.has(toCellIndex);
    });
    return targets;
  }

  function findMoveThatReducesDistance(state, currentDistance) {
    for (const fromCellIndex of state.whitePositions) {
      for (const toCellIndex of getLegalTargetsFromSelectedCell(fromCellIndex, state)) {
        const nextState = movePiece(state, "white", fromCellIndex, toCellIndex);
        if (!nextState) continue;
        const nextDistance = distanceToGoalByStateKey.get(stateKey(nextState));
        if (nextDistance === currentDistance - 1) {
          return { fromCellIndex, toCellIndex };
        }
      }
    }

    for (const fromCellIndex of state.blackPositions) {
      for (const toCellIndex of getLegalTargetsFromSelectedCell(fromCellIndex, state)) {
        const nextState = movePiece(state, "black", fromCellIndex, toCellIndex);
        if (!nextState) continue;
        const nextDistance = distanceToGoalByStateKey.get(stateKey(nextState));
        if (nextDistance === currentDistance - 1) {
          return { fromCellIndex, toCellIndex };
        }
      }
    }

    return null;
  }

  function indexToRowCol(cellIndex) {
    return [Math.floor(cellIndex / BOARD_SIZE), cellIndex % BOARD_SIZE];
  }

  function rowColToIndex(rowIndex, colIndex) {
    return rowIndex * BOARD_SIZE + colIndex;
  }

  function isInsideBoard(rowIndex, colIndex) {
    return rowIndex >= 0 && rowIndex < BOARD_SIZE && colIndex >= 0 && colIndex < BOARD_SIZE;
  }

  function cellName(cellIndex) {
    const [rowIndex, colIndex] = indexToRowCol(cellIndex);
    // 行列用 1..3 显示，便于玩家对照。
    return `(${rowIndex + 1},${colIndex + 1})`;
  }

  function cellAriaLabel(cellIndex) {
    return `格子 ${cellName(cellIndex)}`;
  }
})();
