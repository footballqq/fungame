// codex: 2026-09-09 实现奇偶棋子谜题前端核心算法库（校验、理论下界、最优构造与提示）
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ParitySolver = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * 计算 N×N 棋盘满足条件的理论最小棋子数。
   * 规则：每行偶数 > 0，每列奇数 > 0。
   * 若 N 为奇数，数学上无解，返回 -1。
   * 若 N 为偶数且 >= 4，返回 2 * N。
   */
  function computeTheoreticalMinPieces(n) {
    if (n <= 0 || !Number.isInteger(n)) {
      throw new Error('棋盘尺寸 n 必须为正整数');
    }
    if (n % 2 !== 0 || n < 4) {
      return -1;
    }
    return 2 * n;
  }

  /**
   * 检验棋盘当前状态及各行各列的合规性。
   * @param {number[][]} board 0为空，1为有棋子
   */
  function validateBoard(board) {
    const n = board.length;
    if (n === 0 || !board.every(row => row.length === n)) {
      throw new Error('输入棋盘必须为合法的正方形二维数组');
    }

    const rowCounts = new Array(n).fill(0);
    const colCounts = new Array(n).fill(0);

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] === 1) {
          rowCounts[r]++;
          colCounts[c]++;
        }
      }
    }

    // 每行偶数且 > 0
    const rowValid = rowCounts.map(cnt => cnt > 0 && cnt % 2 === 0);
    // 每列奇数且 > 0
    const colValid = colCounts.map(cnt => cnt > 0 && cnt % 2 !== 0);

    const totalPieces = rowCounts.reduce((a, b) => a + b, 0);
    const minPieces = computeTheoreticalMinPieces(n);
    const allRowsValid = rowValid.every(Boolean);
    const allColsValid = colValid.every(Boolean);
    const isValid = allRowsValid && allColsValid;
    const isOptimal = isValid && totalPieces === minPieces;

    return {
      isValid,
      isOptimal,
      totalPieces,
      minPieces,
      rowCounts,
      colCounts,
      rowValid,
      colValid,
      allRowsValid,
      allColsValid,
    };
  }

  /**
   * 显式构造 N 阶 (N 为偶数 >= 4) 的 2N 最优构造方案。
   * 构造法：
   * 令 k = N / 2。
   * 前 k 行放置在前 k 列中循环配对 (r, (r+1)%k)，使前 k 列各含 2 枚棋子；
   * 后 k 行连接前半区与后半区 (i, k+i)，使前 k 列各增 1 枚变为 3 枚（奇数），后 k 列各获 1 枚（奇数）。
   * 每行均恰有 2 枚棋子（偶数 > 0）。
   */
  function constructOptimalSolution(n) {
    if (n % 2 !== 0 || n < 4) {
      throw new Error('该尺寸下不存在奇偶解或不支持构造');
    }

    const board = Array.from({ length: n }, () => new Array(n).fill(0));
    const k = n / 2;

    for (let r = 0; r < k; r++) {
      const c1 = r;
      const c2 = (r + 1) % k;
      board[r][c1] = 1;
      board[r][c2] = 1;
    }

    for (let i = 0; i < k; i++) {
      const r = k + i;
      const c1 = i;
      const c2 = k + i;
      board[r][c1] = 1;
      board[r][c2] = 1;
    }

    return board;
  }

  /**
   * 根据当前盘面与目标最优解进行对比，给出智能启发提示。
   */
  function findHint(board) {
    const n = board.length;
    const status = validateBoard(board);
    if (status.isOptimal) {
      return { action: 'complete', message: '当前盘面已是完美最优解（达成最少棋子数）！' };
    }

    const optimal = constructOptimalSolution(n);

    // 优先移除与参考最优解不一致的多余棋子
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] === 1 && optimal[r][c] === 0) {
          return {
            row: r,
            col: c,
            action: 'remove',
            reason: `建议移除第 ${r + 1} 行、第 ${c + 1} 列的棋子（便于将多余棋子降至最低）`,
          };
        }
      }
    }

    // 其次添补在参考最优解中需要放置的棋子
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] === 0 && optimal[r][c] === 1) {
          return {
            row: r,
            col: c,
            action: 'add',
            reason: `建议在第 ${r + 1} 行、第 ${c + 1} 列放置棋子（满足行偶列奇条件）`,
          };
        }
      }
    }

    return null;
  }

  /**
   * 返回详尽的数学原理解析结构
   */
  function getMathExplanation(n = 6) {
    const minPieces = computeTheoreticalMinPieces(n);
    return {
      title: `${n}×${n} 国际象棋棋盘奇偶棋子谜题原理解析`,
      steps: [
        {
          step: 1,
          title: '下界定理（行约束）',
          content: `题目要求“每行都有偶数（>0）枚棋子”。由于每行棋子数必须是大于 0 的偶数，因此每行最少放入 2 枚棋子。全盘共有 ${n} 行，故棋子总数 S ≥ 2 × ${n} = ${minPieces} 枚。`,
        },
        {
          step: 2,
          title: '奇偶性相容定理（列约束）',
          content: `题目要求“每列都有奇数枚棋子”。全盘共有 ${n} 列。因为 ${n} 是偶数，偶数个奇数相加的总和必然是偶数，这与步骤 1 中“每行偶数相加总和为偶数”在奇偶性上完全自洽（若 ${n} 为奇数，则必然无解）。`,
        },
        {
          step: 3,
          title: `构造方案（达到极小值 ${minPieces} 枚）`,
          content: `要使总棋子数达到理论最低值 ${minPieces} 枚，每一行必须恰好放入 2 枚棋子。列和必须为正奇数（1 或 3）。我们将 ${n} 个列分为两组：前 ${n / 2} 列每列放 3 枚棋子，后 ${n / 2} 列每列放 1 枚棋子。此时总列和为 (${n / 2})×3 + (${n / 2})×1 = ${minPieces} 枚。`,
        },
        {
          step: 4,
          title: '显式矩阵构造（对称环形配对）',
          content: `通过前 ${n / 2} 行在前半区列循环连边（每列恰分到 2 枚），后 ${n / 2} 行将前半区列与后半区列一一映射配对（前半区各增 1 枚变为 3 枚，后半区各得 1 枚），完美满足每行恰好 2 枚且每列为奇数！因此，最少棋子数严格为 ${minPieces} 枚。`,
        },
      ],
    };
  }

  return {
    computeTheoreticalMinPieces,
    validateBoard,
    constructOptimalSolution,
    findHint,
    getMathExplanation,
  };
});
