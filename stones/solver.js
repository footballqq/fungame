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
   * 生成当前阶 n 的 0-1 矩阵直观 ASCII 图解
   */
  function generateMatrixAscii(n) {
    const k = n / 2;
    const board = constructOptimalSolution(n);
    const lines = [];
    let colHeader = '     ';
    for (let c = 0; c < n; c++) {
      if (c === k) colHeader += '| ';
      colHeader += `列${c + 1} `;
    }
    lines.push(colHeader);
    lines.push('   ' + '-'.repeat(colHeader.length - 3));
    for (let r = 0; r < n; r++) {
      if (r === k) {
        lines.push('   ' + '-'.repeat(colHeader.length - 3));
      }
      let rowStr = `行${r + 1}: `;
      for (let c = 0; c < n; c++) {
        if (c === k) rowStr += '| ';
        rowStr += ` ${board[r][c]}  `;
      }
      rowStr += ' -> 行和=2 (偶)';
      lines.push(rowStr);
    }
    lines.push('   ' + '='.repeat(colHeader.length - 3));
    let colSums = '列和: ';
    for (let c = 0; c < n; c++) {
      if (c === k) colSums += '| ';
      colSums += c < k ? ' 3  ' : ' 1  ';
    }
    colSums += ' -> (全为奇数)';
    lines.push(colSums);
    return lines.join('\n');
  }

  /**
   * 返回详尽的数学原理解析结构（含任意阶 n 奇偶边界讨论与分块矩阵算法严谨证明）
   */
  function getMathExplanation(n = 6) {
    const minPieces = computeTheoreticalMinPieces(n);
    const k = n / 2;
    return {
      title: `${n}×${n} 国际象棋棋盘奇偶棋子谜题深度原理解析`,
      highlightQuestion: '【深度探讨】这道题目是不管 n 是多少都是 2n 吗？',
      coreConclusion: '并不是对任意的 n 都是 2n！只有当 n 为大于等于 4 的偶数时，答案才严格是 2n；在其他情况下，数学上根本无解。',
      blockMatrixTitle: '分块矩阵构造算法：为什么保证 100% 能放下？',
      blockMatrixDesc: `将 ${n}×${n} 棋盘划分为 4 个 ${k}×${k} 子矩阵：A = [[I_k + P_k, 0], [I_k, I_k]]。落子坐标由确定性通式给出：`,
      formulas: [
        `上半区（第 0 ≤ r < ${k} 行）：每行放 2 枚，列坐标 c₁ = r，c₂ = (r + 1) mod ${k}`,
        `下半区（第 ${k} ≤ r < ${n} 行，设 i = r - ${k}）：每行放 2 枚，列坐标 c₁ = i，c₂ = ${k} + i`,
      ],
      guarantees: [
        {
          name: '保证一：单元格零冲突（每格最多1枚）',
          detail: `因为 n ≥ 4，故 k = n/2 ≥ 2。在模 k 下，(r+1) mod k ≠ r 恒成立（否则 1 ≡ 0 mod k 矛盾），因此上半区同行的两列永不重合；下半区 i 与 k+i 差为 k ≥ 2，两列亦永不重合；上下半区行号互不相交。故所有单元格数值均为 0 或 1，绝无重叠。`,
        },
        {
          name: '保证二：每行严格 2 枚（满足偶数 > 0）',
          detail: `上半区每行取自循环置换和矩阵，恰放 2 枚；下半区每行左侧单位阵取 1 枚、右侧单位阵取 1 枚，恰放 2 枚。全部 ${n} 行行和严格全等于 2。`,
        },
        {
          name: '保证三：每列奇数且完全能放下（列容量充裕）',
          detail: `前 ${k} 列在上半区分到 2 枚、下半区分到 1 枚，列和为 2+1=3（奇数）；后 ${k} 列在上半区 0 枚、下半区 1 枚，列和为 0+1=1（奇数）。全盘列高度为 ${n}，因为 ${n} ≥ 4 > 3，所以最多只需在列中容纳 3 枚棋子，列容量至少还富余 ${n - 3} 格，绝不会溢出！`,
        },
      ],
      matrixAscii: generateMatrixAscii(n),
      steps: [
        {
          step: 1,
          title: '原题下界证明（当前尺寸约束）',
          content: `题目要求“每行都有偶数（>0）枚棋子”。由于每行棋子数必须是大于 0 的正偶数，因此每行至少需要放入 2 枚棋子。全盘共有 ${n} 行，故棋子总数满足：S = Σ r_i ≥ 2 × ${n} = ${minPieces} 枚。`,
        },
        {
          step: 2,
          title: '构造方案（严格达到极小值）',
          content: `要使总棋子数达到理论极小值 ${minPieces} 枚，每一行必须恰好放入 2 枚棋子。同时列和必须全为正奇数（1 或 3）。我们将 ${n} 个列分为两半：前 ${k} 列每列放 3 枚棋子，后 ${k} 列每列放 1 枚棋子，列和总数为 ${k}×3 + ${k}×1 = ${minPieces} 枚。`,
        },
        {
          step: 3,
          title: '【情况一】当 n 为奇数时（如 1, 3, 5, 7...）为什么无解？',
          content: `按行计算：每行偶数枚，n 个偶数相加的总和 S 必为【偶数】；按列计算：每列奇数枚，当 n 为奇数时，奇数个奇数相加的总和 S 必为【奇数】。全盘总棋子数 S 既要是偶数又要是奇数，发生奇偶性守恒矛盾！故任何奇数阶棋盘数学上彻底无解。`,
        },
        {
          step: 4,
          title: '【情况二】当 n = 2 时为什么也无解？',
          content: `对于 2×2 棋盘：每行偶数（>0），则每行至少 2 枚，总棋子数至少 4 枚，全盘 4 个格子必须全部填满。但全部填满后，两列棋子数均为 2 枚（偶数），违背了“每列奇数枚”的要求。若拿掉任何棋子则某行不足 2 枚违规，故 n=2 同样无解。`,
        },
        {
          step: 5,
          title: '【情况三】当且仅当 n 为偶数且 n ≥ 4 时，答案严格为 2n！',
          content: `此时每行最少 2 枚给出下界 2n；同时总能将 n 列拆分为 n/2 个 3 枚列与 n/2 个 1 枚列（总和 2n 且 3 ≤ n 容纳得下），利用分块循环矩阵算法即可构造出严格为 2n 的合法解。`,
        },
      ],
      table: [
        { n: 'n = 1', valid: '❌ 无解', min: '—', reason: '行和偶与列和奇矛盾' },
        { n: 'n = 2', valid: '❌ 无解', min: '—', reason: '全填满时列为2(偶数)，无法满足列奇' },
        { n: 'n = 3', valid: '❌ 无解', min: '—', reason: '3个奇数列之和为奇数，与行偶矛盾' },
        { n: 'n = 4', valid: '✅ 有解', min: '8 枚 (2n)', reason: '前2列各3枚，后2列各1枚，每行2枚' },
        { n: 'n = 5', valid: '❌ 无解', min: '—', reason: '5个奇数列之和为奇数，与行偶矛盾' },
        { n: 'n = 6 (原题)', valid: '✅ 有解', min: '12 枚 (2n)', reason: '前3列各3枚，后3列各1枚，每行2枚' },
        { n: 'n = 8', valid: '✅ 有解', min: '16 枚 (2n)', reason: '前4列各3枚，后4列各1枚，每行2枚' },
        { n: '任意偶数 n ≥ 4', valid: '✅ 有解', min: '2n 枚', reason: '分块循环矩阵确定性构造解均存在' },
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
