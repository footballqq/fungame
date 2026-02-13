// codex: 2026-02-13 新增 Knight's Tour 求解器：Warnsdorff + 回溯，支持从部分路径继续求解（浏览器与 Node 复用）
(() => {
  "use strict";

  // createXorshift32Rng：生成可复现的伪随机数，用于打破同度数候选的平局（避免固定顺序卡死）。
  function createXorshift32Rng(seedNumber) {
    let state = seedNumber >>> 0;
    return () => {
      state ^= state << 13;
      state >>>= 0;
      state ^= state >>> 17;
      state >>>= 0;
      state ^= state << 5;
      state >>>= 0;
      return state / 0xffffffff;
    };
  }

  // buildKnightAdjacency：预计算每个格子的“日”字可达邻接表，加速求解。
  function buildKnightAdjacency(boardSize) {
    const cellCount = boardSize * boardSize;
    const deltas = [
      [1, 2],
      [2, 1],
      [-1, 2],
      [-2, 1],
      [1, -2],
      [2, -1],
      [-1, -2],
      [-2, -1],
    ];

    /** @type {number[][]} */
    const adjacencyByCellIndex = Array.from({ length: cellCount }, () => []);
    for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 1) {
      const rowIndex = Math.floor(cellIndex / boardSize);
      const colIndex = cellIndex % boardSize;
      for (const [dr, dc] of deltas) {
        const nextRowIndex = rowIndex + dr;
        const nextColIndex = colIndex + dc;
        if (
          nextRowIndex < 0 ||
          nextRowIndex >= boardSize ||
          nextColIndex < 0 ||
          nextColIndex >= boardSize
        ) {
          continue;
        }
        adjacencyByCellIndex[cellIndex].push(nextRowIndex * boardSize + nextColIndex);
      }
    }
    return adjacencyByCellIndex;
  }

  // isValidKnightTourPath：校验路径是否覆盖全盘、是否重复、是否每步都是“日”字。
  function isValidKnightTourPath(boardSize, pathCellIndices) {
    const cellCount = boardSize * boardSize;
    if (!Array.isArray(pathCellIndices)) return false;
    if (pathCellIndices.length !== cellCount) return false;

    const seen = new Set();
    for (const cellIndex of pathCellIndices) {
      if (!Number.isInteger(cellIndex)) return false;
      if (cellIndex < 0 || cellIndex >= cellCount) return false;
      if (seen.has(cellIndex)) return false;
      seen.add(cellIndex);
    }

    const adjacencyByCellIndex = buildKnightAdjacency(boardSize);
    for (let i = 1; i < pathCellIndices.length; i += 1) {
      const prevCellIndex = pathCellIndices[i - 1];
      const nextCellIndex = pathCellIndices[i];
      if (!adjacencyByCellIndex[prevCellIndex].includes(nextCellIndex)) return false;
    }

    return true;
  }

  function normalizeBoardSize(boardSize) {
    if (!Number.isInteger(boardSize) || boardSize <= 0) return null;
    return boardSize;
  }

  // findKnightTourPath：返回一条完整路径（数组长度=N²），找不到则返回 null。
  // 支持 pathPrefix：例如玩家已经走过若干步时，从“当前状态继续”求解。
  function findKnightTourPath({
    boardSize,
    pathPrefix,
    maxTimeMs = 1200,
    randomSeed = 0,
  }) {
    const normalizedBoardSize = normalizeBoardSize(boardSize);
    if (!normalizedBoardSize) return null;

    const n = normalizedBoardSize;
    const cellCount = n * n;

    if (cellCount === 1) return [0];
    if (n === 2 || n === 3 || n === 4) return null;

    if (!Array.isArray(pathPrefix) || pathPrefix.length < 1) return null;
    if (!pathPrefix.every((v) => Number.isInteger(v))) return null;

    const adjacencyByCellIndex = buildKnightAdjacency(n);
    const visitedByCellIndex = Array.from({ length: cellCount }, () => false);
    const path = [];

    for (const cellIndex of pathPrefix) {
      if (cellIndex < 0 || cellIndex >= cellCount) return null;
      if (visitedByCellIndex[cellIndex]) return null;
      if (path.length > 0) {
        const prevCellIndex = path[path.length - 1];
        if (!adjacencyByCellIndex[prevCellIndex].includes(cellIndex)) return null;
      }
      visitedByCellIndex[cellIndex] = true;
      path.push(cellIndex);
    }

    const deadlineMs = Date.now() + Math.max(10, Number(maxTimeMs) || 1200);
    const rng = createXorshift32Rng((randomSeed + n * 1009 + path[0] * 9176) >>> 0);

    function unvisitedDegree(cellIndex) {
      let degreeCount = 0;
      for (const nextCellIndex of adjacencyByCellIndex[cellIndex]) {
        if (!visitedByCellIndex[nextCellIndex]) degreeCount += 1;
      }
      return degreeCount;
    }

    function buildCandidatesOrdered(currentCellIndex) {
      const candidates = [];
      for (const nextCellIndex of adjacencyByCellIndex[currentCellIndex]) {
        if (visitedByCellIndex[nextCellIndex]) continue;
        candidates.push(nextCellIndex);
      }

      // Warnsdorff：优先走“后继选择更少”的格子；平局用随机打散一点。
      candidates.sort((a, b) => {
        const degreeDiff = unvisitedDegree(a) - unvisitedDegree(b);
        if (degreeDiff !== 0) return degreeDiff;
        return rng() < 0.5 ? -1 : 1;
      });

      return candidates;
    }

    function backtrack(currentCellIndex) {
      if (Date.now() > deadlineMs) return false;
      if (path.length === cellCount) return true;

      const candidates = buildCandidatesOrdered(currentCellIndex);
      if (candidates.length === 0) return false;

      for (const nextCellIndex of candidates) {
        visitedByCellIndex[nextCellIndex] = true;
        path.push(nextCellIndex);

        if (backtrack(nextCellIndex)) return true;

        path.pop();
        visitedByCellIndex[nextCellIndex] = false;
      }

      return false;
    }

    const ok = backtrack(path[path.length - 1]);
    return ok ? path.slice() : null;
  }

  const api = Object.freeze({
    buildKnightAdjacency,
    findKnightTourPath,
    isValidKnightTourPath,
  });

  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = api;
    return;
  }

  globalThis.ChessHorseKnightTourSolver = api;
})();

