/**
 * 古埃及双面棋盒智能 AI 模块
 * 支持三档难度：
 * - easy   : 入门 AI（启发式 + 较大随机扰动）
 * - normal : 标准 AI（单步战术启发式评估）
 * - master : 法老大祭司 AI（Expectiminimax 期望树搜索：精确按二项分布 B(4,0.5)
 *            展开下一回合概率分支，预判对手最可能掷出点数下的最优反击与己方连击期望）
 *
 * 兼容浏览器全局 (window.EgyptBoardAI) 与 Node.js CommonJS。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./senet-engine.js'),
      require('./aseb-engine.js')
    );
  } else {
    root.EgyptBoardAI = factory(root.SenetEngine, root.AsebEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (SenetEngine, AsebEngine) {
  'use strict';

  // 塞尼特 4 根木掷棍精确概率分布 B(4, 0.5)
  const SENET_ROLL_DIST = [
    { steps: 1, extraTurn: true, prob: 4 / 16, sticks: [1, 0, 0, 0], flatCount: 1 },
    { steps: 2, extraTurn: false, prob: 6 / 16, sticks: [1, 1, 0, 0], flatCount: 2 },
    { steps: 3, extraTurn: false, prob: 4 / 16, sticks: [1, 1, 1, 0], flatCount: 3 },
    { steps: 4, extraTurn: true, prob: 1 / 16, sticks: [1, 1, 1, 1], flatCount: 4 },
    { steps: 5, extraTurn: true, prob: 1 / 16, sticks: [0, 0, 0, 0], flatCount: 0 }
  ];

  // 阿塞布 4 枚金字塔骰精确概率分布 B(4, 0.5)
  const ASEB_ROLL_DIST = [
    { steps: 0, prob: 1 / 16, dice: [0, 0, 0, 0] },
    { steps: 1, prob: 4 / 16, dice: [1, 0, 0, 0] },
    { steps: 2, prob: 6 / 16, dice: [1, 1, 0, 0] },
    { steps: 3, prob: 4 / 16, dice: [1, 1, 1, 0] },
    { steps: 4, prob: 1 / 16, dice: [1, 1, 1, 1] }
  ];

  /**
   * 评估塞尼特棋静态局面（对 player 的优势分）
   */
  function evaluateSenetState(state, player) {
    if (state.winner === player) return 10000;
    if (state.winner && state.winner !== player) return -10000;

    const opponent = player === 1 ? 2 : 1;
    let score = (state.borneOff[player] - state.borneOff[opponent]) * 210;

    let myRun = 0;
    let oppRun = 0;

    for (let sq = 1; sq <= SenetEngine.BOARD_SIZE; sq++) {
      const owner = state.board[sq];
      if (owner === player) {
        myRun++;
        oppRun = 0;
        score += sq * 4.6;
        if (sq === 26) score += 36;
        if (sq === 28 || sq === 29 || sq === 30) score += 28;
        if (sq === 15) score += 14;
        if (myRun === 2) score += 22; // 双子保护奖励
        if (myRun >= 3) score += 34;  // 三子叹息之墙奖励
        // 若为未受保护的孤子，评估被身后 1..3 格对手换位打回的期望风险
        if (!SenetEngine.isProtected(state.board, sq) && sq > 5) {
          if (sq - 2 >= 1 && state.board[sq - 2] === opponent) score -= 18;
          if (sq - 1 >= 1 && state.board[sq - 1] === opponent) score -= 12;
          if (sq - 3 >= 1 && state.board[sq - 3] === opponent) score -= 12;
        }
      } else if (owner === opponent) {
        oppRun++;
        myRun = 0;
        score -= sq * 4.3;
        if (sq === 26) score -= 30;
        if (oppRun === 2) score -= 18;
        if (oppRun >= 3) score -= 30;
      } else {
        myRun = 0;
        oppRun = 0;
      }
    }

    return score;
  }

  /**
   * 塞尼特棋概率节点期望评估（Expectiminimax 1层机会节点 + 决策节点）
   */
  function expectedSenetValue(state, rootPlayer) {
    if (state.winner) return evaluateSenetState(state, rootPlayer);
    const acting = state.currentPlayer;
    const isMax = acting === rootPlayer;
    let expected = 0;

    for (let i = 0; i < SENET_ROLL_DIST.length; i++) {
      const roll = SENET_ROLL_DIST[i];
      const rolled = SenetEngine.applyRoll(state, roll);
      if (rolled.skipped || rolled.legalMoves.length === 0) {
        expected += roll.prob * evaluateSenetState(rolled.state, rootPlayer);
        continue;
      }

      let bestVal = isMax ? -Infinity : Infinity;
      for (let j = 0; j < rolled.legalMoves.length; j++) {
        const nextSt = SenetEngine.applyMove(rolled.state, rolled.legalMoves[j]);
        let val = evaluateSenetState(nextSt, rootPlayer);
        // 额外投掷本身具备期望红利
        if (roll.extraTurn && !nextSt.winner) {
          val += isMax ? 14 : -14;
        }
        if (isMax ? val > bestVal : val < bestVal) {
          bestVal = val;
        }
      }
      expected += roll.prob * bestVal;
    }

    return expected;
  }

  /**
   * 为塞尼特棋选择最佳走法
   */
  function chooseSenetMove(state, difficulty) {
    const moves = SenetEngine.getLegalMoves(state, state.lastRoll.steps);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    // 入门 AI：45% 概率像新手一样随性落子，55% 按基础启发式走
    if (difficulty === 'easy' && Math.random() < 0.45) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const player = state.currentPlayer;
    const scored = moves.map((m) => {
      const next = SenetEngine.applyMove(state, m);
      let val;

      if (difficulty === 'master') {
        // 精确期望搜索：把下一步可能遇到的所有掷棍点数与对手最优反击纳入期望
        val = expectedSenetValue(next, player);
        if (m.type === 'water_trap') val -= 80;
        if (m.type === 'bear_off') val += 35;
      } else {
        val = evaluateSenetState(next, player);
        if (m.type === 'bear_off') val += 90;
        if (m.type === 'water_trap') val -= 140;
        if (m.type === 'swap') val += (m.to - m.from) * 3.5 + 15;
        if (m.to === 26) val += 35;
      }

      if (difficulty === 'easy') {
        val += (Math.random() - 0.5) * 65;
      } else if (difficulty === 'normal') {
        val += (Math.random() - 0.5) * 4;
      }
      return { move: m, score: val };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  /**
   * 评估阿塞布棋静态局面（对 player 的优势分）
   */
  function evaluateAsebState(state, player) {
    if (state.winner === player) return 10000;
    if (state.winner && state.winner !== player) return -10000;

    const opponent = player === 1 ? 2 : 1;
    let score = 0;

    const myPieces = state.pieces[player];
    const oppPieces = state.pieces[opponent];
    const dangerWeight = { 1: 0.25, 2: 0.375, 3: 0.25, 4: 0.0625 };

    for (let i = 0; i < myPieces.length; i++) {
      const pos = myPieces[i];
      if (pos === AsebEngine.BEAR_OFF) {
        score += 195;
      } else if (pos > 0) {
        score += pos * 7.2;
        if (AsebEngine.isRosette(pos)) {
          score += pos > 4 ? 38 : 18;
        } else if (pos > AsebEngine.PRIVATE_END) {
          for (let j = 0; j < oppPieces.length; j++) {
            const oppPos = oppPieces[j];
            if (oppPos > 0 && oppPos < pos) {
              const dist = pos - oppPos;
              if (dist >= 1 && dist <= 4) {
                score -= pos * 5.0 * dangerWeight[dist];
              }
            }
          }
        }
      }
    }

    for (let j = 0; j < oppPieces.length; j++) {
      const oppPos = oppPieces[j];
      if (oppPos === AsebEngine.BEAR_OFF) {
        score -= 195;
      } else if (oppPos > 0) {
        score -= oppPos * 6.8;
        if (AsebEngine.isRosette(oppPos) && oppPos > 4) {
          score -= 34;
        }
      }
    }

    return score;
  }

  /**
   * 阿塞布棋概率节点期望评估（Expectiminimax）
   */
  function expectedAsebValue(state, rootPlayer) {
    if (state.winner) return evaluateAsebState(state, rootPlayer);
    const acting = state.currentPlayer;
    const isMax = acting === rootPlayer;
    let expected = 0;

    for (let i = 0; i < ASEB_ROLL_DIST.length; i++) {
      const roll = ASEB_ROLL_DIST[i];
      const rolled = AsebEngine.applyRoll(state, roll);
      if (rolled.skipped || rolled.legalMoves.length === 0) {
        expected += roll.prob * evaluateAsebState(rolled.state, rootPlayer);
        continue;
      }

      let bestVal = isMax ? -Infinity : Infinity;
      for (let j = 0; j < rolled.legalMoves.length; j++) {
        const mv = rolled.legalMoves[j];
        const nextSt = AsebEngine.applyMove(rolled.state, mv);
        let val = evaluateAsebState(nextSt, rootPlayer);
        if (mv.extraTurn && !nextSt.winner) {
          val += isMax ? 20 : -20;
        }
        if (isMax ? val > bestVal : val < bestVal) {
          bestVal = val;
        }
      }
      expected += roll.prob * bestVal;
    }

    return expected;
  }

  /**
   * 为阿塞布棋选择最佳走法
   */
  function chooseAsebMove(state, difficulty) {
    const moves = AsebEngine.getLegalMoves(state, state.lastRoll.steps);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    // 入门 AI：45% 概率像新手一样随性落子，55% 按基础启发式走
    if (difficulty === 'easy' && Math.random() < 0.45) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const player = state.currentPlayer;
    const scored = moves.map((m) => {
      const next = AsebEngine.applyMove(state, m);
      let val;

      if (difficulty === 'master') {
        val = expectedAsebValue(next, player);
        if (m.extraTurn && !next.winner) val += 18;
      } else {
        val = evaluateAsebState(next, player);
        if (m.type === 'bear_off') val += 85;
        if (m.type === 'capture') val += 55 + m.to * 3;
        if (m.extraTurn) val += 42;
      }

      if (difficulty === 'easy') {
        val += (Math.random() - 0.5) * 70;
      } else if (difficulty === 'normal') {
        val += (Math.random() - 0.5) * 4;
      }
      return { move: m, score: val };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  function chooseMove(state, difficulty) {
    const level = difficulty || 'normal';
    if (state.game === 'senet') {
      return chooseSenetMove(state, level);
    }
    if (state.game === 'aseb') {
      return chooseAsebMove(state, level);
    }
    return null;
  }

  return {
    SENET_ROLL_DIST,
    ASEB_ROLL_DIST,
    evaluateSenetState,
    evaluateAsebState,
    expectedSenetValue,
    expectedAsebValue,
    chooseSenetMove,
    chooseAsebMove,
    chooseMove
  };
});
