/**
 * 维京王者之棋 (Hnefatafl) Alpha-Beta 极小极大智能 AI
 * 支持三档难度：
 * - easy   : 入门陪练（40% 随机 + 1 层浅评估）
 * - normal : 标准战术（Depth 2 Alpha-Beta 剪枝）
 * - master : 维京大酋长（Depth 3 Alpha-Beta 剪枝 + 启发式走法排序）
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.HnefataflAI = factory(root.HnefataflEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  /**
   * 评估局面（从白方/守卫 player 1 视角，正数利白、负数利黑）
   */
  function evaluateForWhite(state) {
    if (state.winner === 1) return 100000 - state.turnCount;
    if (state.winner === 2) return -100000 + state.turnCount;

    const N = state.size;
    let defenders = 0;
    let attackers = 0;
    let king = null;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = state.board[r][c];
        if (v === Engine.DEFENDER) defenders++;
        else if (v === Engine.ATTACKER) attackers++;
        else if (v === Engine.KING) king = { r, c };
      }
    }

    if (!king) return -100000;

    // 1. 子力平衡（卫兵少而精，单子价值高于进攻者）
    let score = defenders * 135 - attackers * 78;

    // 2. 国王离四个角落的曼哈顿距离越近，越有利白方
    const corners = [
      [0, 0], [0, N - 1], [N - 1, 0], [N - 1, N - 1]
    ];
    let minCornerDist = 99;
    for (let i = 0; i < 4; i++) {
      const d = Math.abs(king.r - corners[i][0]) + Math.abs(king.c - corners[i][1]);
      if (d < minCornerDist) minCornerDist = d;
    }
    score += (N * 2 - minCornerDist) * 26;

    // 3. 检查国王是否已具备“一步直达角落”的直线通道
    const kingMoves = Engine.getMovesForPiece(state, king.r, king.c);
    let cornerThreats = 0;
    for (let i = 0; i < kingMoves.length; i++) {
      if (Engine.isCorner(N, kingMoves[i].toR, kingMoves[i].toC)) {
        cornerThreats++;
      }
    }
    if (cornerThreats > 0) {
      score += cornerThreats === 1 ? 320 : 900; // 双线叫杀几乎必胜
    }
    score += kingMoves.length * 14;

    // 4. 国王四周被黑子贴身包围的危险度
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let adjAttackers = 0;
    for (let d = 0; d < 4; d++) {
      const nr = king.r + dirs[d][0];
      const nc = king.c + dirs[d][1];
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && state.board[nr][nc] === Engine.ATTACKER) {
        adjAttackers++;
      }
    }
    score -= adjAttackers * 55;

    // 5. 进攻方占据角落前哨（离角落 1-2 格封锁逃生线）的加分
    const guardSpots = [
      [0, 1], [1, 0], [0, N - 2], [1, N - 1],
      [N - 1, 1], [N - 2, 0], [N - 1, N - 2], [N - 2, N - 1]
    ];
    for (let i = 0; i < guardSpots.length; i++) {
      const [gr, gc] = guardSpots[i];
      if (state.board[gr][gc] === Engine.ATTACKER) score -= 18;
    }

    return score;
  }

  /**
   * 启发式走法排序（优先搜索国王逃脱、吃子与靠近国王的走法，大幅加速剪枝）
   */
  function orderMoves(state, moves) {
    const N = state.size;
    const king = Engine.findKing(state.board);
    return moves
      .map((m) => {
        let prio = 0;
        if (m.piece === Engine.KING) {
          if (Engine.isCorner(N, m.toR, m.toC)) prio += 10000;
          if (m.toR === 0 || m.toR === N - 1 || m.toC === 0 || m.toC === N - 1) prio += 120;
        }
        if (king) {
          const d = Math.abs(m.toR - king.r) + Math.abs(m.toC - king.c);
          if (d === 1) prio += 90;
        }
        return { m, prio };
      })
      .sort((a, b) => b.prio - a.prio)
      .map((x) => x.m);
  }

  function alphaBeta(state, depth, alpha, beta, maximizingWhite) {
    if (depth === 0 || state.winner) {
      return evaluateForWhite(state);
    }
    const moves = orderMoves(state, Engine.getLegalMoves(state));
    if (moves.length === 0) return evaluateForWhite(state);

    // 限制每层最大分支数，确保 9x9 盘面在浏览器中也毫秒级响应
    const limit = depth >= 2 ? Math.min(moves.length, 24) : Math.min(moves.length, 18);

    if (maximizingWhite) {
      let val = -Infinity;
      for (let i = 0; i < limit; i++) {
        const res = Engine.applyMove(state, moves[i]);
        const childVal = alphaBeta(res.state, depth - 1, alpha, beta, false);
        if (childVal > val) val = childVal;
        if (val > alpha) alpha = val;
        if (beta <= alpha) break;
      }
      return val;
    } else {
      let val = Infinity;
      for (let i = 0; i < limit; i++) {
        const res = Engine.applyMove(state, moves[i]);
        const childVal = alphaBeta(res.state, depth - 1, alpha, beta, true);
        if (childVal < val) val = childVal;
        if (val < beta) beta = val;
        if (beta <= alpha) break;
      }
      return val;
    }
  }

  function chooseMove(state, difficulty) {
    const moves = Engine.getLegalMoves(state);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    const level = difficulty || 'normal';
    if (level === 'easy' && Math.random() < 0.42) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const ordered = orderMoves(state, moves);
    const isWhite = state.currentPlayer === 1;
    const depth = level === 'master' ? (state.size === 7 ? 3 : 2) : level === 'normal' ? 2 : 1;
    const maxCandidates = level === 'master' ? Math.min(ordered.length, 32) : Math.min(ordered.length, 22);

    let bestMove = ordered[0];
    let bestScore = isWhite ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (let i = 0; i < maxCandidates; i++) {
      const m = ordered[i];
      const res = Engine.applyMove(state, m);

      // 一步直接获胜立即采用
      if (res.state.winner === state.currentPlayer) {
        return m;
      }

      let score = alphaBeta(res.state, depth - 1, alpha, beta, !isWhite);
      if (level === 'easy') {
        score += (Math.random() - 0.5) * 90;
      } else {
        score += (Math.random() - 0.5) * 4;
      }

      if (isWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
        if (bestScore > alpha) alpha = bestScore;
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = m;
        }
        if (bestScore < beta) beta = bestScore;
      }
    }

    return bestMove;
  }

  return {
    evaluateForWhite,
    chooseMove
  };
});
