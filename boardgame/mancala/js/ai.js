/**
 * 非洲播棋 (Mancala / Kalah) Alpha-Beta 极小极大强力 AI
 * 因为播棋每回合分支最多 6 个，Alpha-Beta 可以轻松搜到极深层数：
 * - easy   : 入门陪练（40% 随机 + Depth 2）
 * - normal : 标准战术（Depth 5 Alpha-Beta）
 * - master : 酋长大师（Depth 8 Alpha-Beta + 额外回合优先排序，在浏览器中毫秒级出招，棋力极强！）
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.MancalaAI = factory(root.MancalaEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  /**
   * 评估局面（从 player 1 视角：大宝库差值为主 + 己方蓄水池与可连击潜力为辅）
   */
  function evaluateForP1(state) {
    if (state.winner === 1) return 10000 + (state.pits[6] - state.pits[13]);
    if (state.winner === 2) return -10000 + (state.pits[6] - state.pits[13]);
    if (state.winner === 0) return 0;

    const storeDiff = state.pits[6] - state.pits[13];
    const side1 = Engine.sumSide(state.pits, 1);
    const side2 = Engine.sumSide(state.pits, 2);

    // 统计一步能触发额外回合（免费再播）的坑数
    let free1 = 0;
    let free2 = 0;
    for (let i = 0; i < 6; i++) {
      if (state.pits[i] === 6 - i) free1++;
    }
    for (let i = 7; i < 13; i++) {
      if (state.pits[i] === 13 - i) free2++;
    }

    return storeDiff * 12 + (side1 - side2) * 1.6 + (free1 - free2) * 2.5;
  }

  /**
   * 走法排序：优先尝试能落入大宝库（额外回合）的坑，极大提升剪枝效率
   */
  function orderMoves(state, moves) {
    const player = state.currentPlayer;
    const store = Engine.storeOf(player);
    return moves.slice().sort((a, b) => {
      const aFree = state.pits[a] === store - a ? 1 : 0;
      const bFree = state.pits[b] === store - b ? 1 : 0;
      if (aFree !== bFree) return bFree - aFree;
      return b - a;
    });
  }

  function alphaBeta(state, depth, alpha, beta) {
    if (depth === 0 || state.winner !== null) {
      return evaluateForP1(state);
    }
    const moves = orderMoves(state, Engine.getLegalMoves(state));
    if (moves.length === 0) return evaluateForP1(state);

    const isMax = state.currentPlayer === 1;
    if (isMax) {
      let val = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        const res = Engine.applyMove(state, moves[i]);
        // 额外回合不减太多深度但防止无限递归，统一 depth - 1 保证极速稳定
        const childVal = alphaBeta(res.state, depth - 1, alpha, beta);
        if (childVal > val) val = childVal;
        if (val > alpha) alpha = val;
        if (beta <= alpha) break;
      }
      return val;
    } else {
      let val = Infinity;
      for (let i = 0; i < moves.length; i++) {
        const res = Engine.applyMove(state, moves[i]);
        const childVal = alphaBeta(res.state, depth - 1, alpha, beta);
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

    const depth = level === 'master' ? 7 : level === 'normal' ? 4 : 2;
    const ordered = orderMoves(state, moves);
    const isMax = state.currentPlayer === 1;

    let bestMove = ordered[0];
    let bestVal = isMax ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (let i = 0; i < ordered.length; i++) {
      const m = ordered[i];
      const res = Engine.applyMove(state, m);
      let val = alphaBeta(res.state, depth - 1, alpha, beta);
      if (level === 'easy') {
        val += (Math.random() - 0.5) * 24;
      } else if (level === 'normal') {
        val += (Math.random() - 0.5) * 1.5;
      }

      if (isMax) {
        if (val > bestVal) {
          bestVal = val;
          bestMove = m;
        }
        if (bestVal > alpha) alpha = bestVal;
      } else {
        if (val < bestVal) {
          bestVal = val;
          bestMove = m;
        }
        if (bestVal < beta) beta = bestVal;
      }
    }

    return bestMove;
  }

  return {
    evaluateForP1,
    chooseMove
  };
});
