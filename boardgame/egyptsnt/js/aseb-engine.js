/**
 * 阿塞布棋 (Aseb / 二十格戏 / Game of 20 Squares) 核心引擎
 * 纯逻辑模块，兼容浏览器全局 (window.AsebEngine) 与 Node.js CommonJS。
 *
 * 规则依据：书吏卡双面棋盒20格面 + 乌尔皇家局戏 (Irving Finkel) 复原体系
 * - 棋盘拓扑：3行 × 12列中的 20 个有效格（左侧 3×4 头部 + 中间 8 格长尾）
 * - 双方各 5 枚棋子，开局在场外（进度 0）
 * - 路径长度 16 格（进度 1..16，出盘记为 17）：
 *   - 进度 1..4：各自私人起步区（绝对安全，P1 走上排 col 3→0，P2 走下排 col 3→0）
 *   - 进度 5..16：公共交战区（中排 col 0→11，共 12 格）
 * - 5 个特殊象形文字/玫瑰格（每隔 4 格出现）：
 *   - 进度 4（双方各自私人区末端）、进度 8、12、16（公共区第4、8、12格）
 *   - 踩中特殊格：立即获得额外一次投掷机会！
 *   - 停在公共区特殊格 (8, 12, 16)：处于无敌庇护状态，不可被对手击杀
 * - 掷骰：4 枚古埃及金字塔双色骰（0..4 点，二项分布 B(4,0.5)）
 *   - 掷出 0 点：本回合无步数，换对方
 *   - 掷出 1..4 点：进场新子或前移场上棋子；落入对手公共区非无敌格则“击杀”送回场外 (0)
 *   - 出盘：必须恰好到达进度 17
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AsebEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TRACK_LENGTH = 16;
  const BEAR_OFF = 17;
  const PIECES_PER_PLAYER = 5;
  const PRIVATE_END = 4;
  const ROSETTE_POSITIONS = [4, 8, 12, 16];

  /**
   * 判断某进度是否为特殊玫瑰/象形文字格
   */
  function isRosette(pos) {
    return ROSETTE_POSITIONS.indexOf(pos) !== -1;
  }

  /**
   * 玩家进度 (1..16) 转棋盘网格坐标 { row: 0..2, col: 0..11 }
   * - P1 私人区 (1..4): row 0, col 3, 2, 1, 0
   * - P2 私人区 (1..4): row 2, col 3, 2, 1, 0
   * - 公共区 (5..16): row 1, col 0..11
   */
  function progressToCoords(player, pos) {
    if (pos < 1 || pos > TRACK_LENGTH) return null;
    if (pos <= PRIVATE_END) {
      return { row: player === 1 ? 0 : 2, col: 4 - pos };
    }
    return { row: 1, col: pos - 5 };
  }

  /**
   * 网格坐标是否属于有效 20 格盘面
   */
  function isValidCell(row, col) {
    if (row === 1) return col >= 0 && col <= 11;
    if (row === 0 || row === 2) return col >= 0 && col <= 3;
    return false;
  }

  /**
   * 投掷 4 枚金字塔二面骰 (0..4)
   */
  function rollDice(rng) {
    const rand = typeof rng === 'function' ? rng : Math.random;
    const dice = [];
    let steps = 0;
    for (let i = 0; i < 4; i++) {
      const pip = rand() < 0.5 ? 1 : 0;
      dice.push(pip);
      steps += pip;
    }
    return { dice, steps };
  }

  /**
   * 创建初始状态
   * pieces[1] 和 pieces[2] 分别为长度 5 的数组，记录每枚棋子进度：
   * 0 = 场外待入场，1..16 = 盘面位置，17 = 已安全出盘
   * @param {{ winTarget?: number }} [options]
   */
  function createInitialState(options) {
    const winTarget =
      options && options.winTarget >= 1 && options.winTarget <= PIECES_PER_PLAYER
        ? options.winTarget
        : PIECES_PER_PLAYER;
    return {
      game: 'aseb',
      winTarget,
      pieces: {
        1: [0, 0, 0, 0, 0],
        2: [0, 0, 0, 0, 0]
      },
      currentPlayer: 1,
      phase: 'roll', // 'roll' | 'move' | 'gameover'
      lastRoll: null,
      winner: null,
      turnCount: 1,
      lastEvent: '请投掷 4 枚古埃及金字塔骰开始阿塞布棋对局。'
    };
  }

  function cloneState(state) {
    return {
      game: 'aseb',
      winTarget: state.winTarget || PIECES_PER_PLAYER,
      pieces: {
        1: state.pieces[1].slice(),
        2: state.pieces[2].slice()
      },
      currentPlayer: state.currentPlayer,
      phase: state.phase,
      lastRoll: state.lastRoll ? { ...state.lastRoll, dice: state.lastRoll.dice.slice() } : null,
      winner: state.winner,
      turnCount: state.turnCount,
      lastEvent: state.lastEvent
    };
  }

  /**
   * 统计已出盘棋子数
   */
  function getBorneOffCount(state, player) {
    return state.pieces[player].filter((p) => p === BEAR_OFF).length;
  }

  /**
   * 统计场外待入场棋子数
   */
  function getReserveCount(state, player) {
    return state.pieces[player].filter((p) => p === 0).length;
  }

  /**
   * 查询某位置是否被指定玩家占据，返回棋子索引或 -1
   */
  function findPieceAt(piecesArr, pos) {
    for (let i = 0; i < piecesArr.length; i++) {
      if (piecesArr[i] === pos) return i;
    }
    return -1;
  }

  /**
   * 获取当前玩家给定点数下的所有合法走法
   * 对场外棋子 (pos===0) 去重，只返回一个代表索引
   */
  function getLegalMoves(state, steps, playerOverride) {
    if (!steps || steps <= 0) return [];
    const player = playerOverride || state.currentPlayer;
    const opponent = player === 1 ? 2 : 1;
    const myPieces = state.pieces[player];
    const oppPieces = state.pieces[opponent];

    const moves = [];
    let addedReserve = false;

    for (let idx = 0; idx < myPieces.length; idx++) {
      const from = myPieces[idx];
      if (from === BEAR_OFF) continue;
      if (from === 0) {
        if (addedReserve) continue;
      }

      const to = from + steps;
      if (to > BEAR_OFF) continue;

      if (to === BEAR_OFF) {
        moves.push({
          pieceIndex: idx,
          from,
          to: BEAR_OFF,
          type: 'bear_off',
          extraTurn: false
        });
        continue;
      }

      // 不可落在己方已有棋子的格子上
      if (findPieceAt(myPieces, to) !== -1) continue;

      // 若进入公共交战区 (5..16)，检查对手棋子
      let type = from === 0 ? 'enter' : 'move';
      let capturedIndex = -1;
      if (to > PRIVATE_END) {
        const oppIdx = findPieceAt(oppPieces, to);
        if (oppIdx !== -1) {
          // 特殊安全格上的对手棋子处于无敌状态，不可击杀
          if (isRosette(to)) continue;
          type = 'capture';
          capturedIndex = oppIdx;
        }
      }

      if (from === 0) addedReserve = true;
      moves.push({
        pieceIndex: idx,
        from,
        to,
        type,
        capturedIndex,
        extraTurn: isRosette(to)
      });
    }

    return moves;
  }

  /**
   * 投掷并进入走子阶段
   */
  function applyRoll(state, rollResult) {
    if (state.phase !== 'roll' || state.winner) {
      throw new Error('当前不处于投掷阶段');
    }
    const next = cloneState(state);
    const roll = rollResult || rollDice();
    next.lastRoll = roll;
    const pName = next.currentPlayer === 1 ? '圆锥方' : '轮盘方';

    if (roll.steps === 0) {
      next.currentPlayer = next.currentPlayer === 1 ? 2 : 1;
      next.turnCount += 1;
      next.phase = 'roll';
      next.lastEvent = `${pName}掷出 0 点，本回合空过，轮到对方！`;
      return { state: next, legalMoves: [], skipped: true };
    }

    const moves = getLegalMoves(next, roll.steps);
    if (moves.length === 0) {
      next.currentPlayer = next.currentPlayer === 1 ? 2 : 1;
      next.turnCount += 1;
      next.phase = 'roll';
      next.lastEvent = `${pName}掷出 ${roll.steps} 点，但没有可移动的棋子，轮到对方。`;
      return { state: next, legalMoves: [], skipped: true };
    }

    next.phase = 'move';
    next.lastEvent = `${pName}掷出 ${roll.steps} 点，请选择一枚高亮棋子移动。`;
    return { state: next, legalMoves: moves, skipped: false };
  }

  /**
   * 执行走子
   */
  function applyMove(state, move) {
    if (state.phase !== 'move' || !state.lastRoll) {
      throw new Error('当前不处于走子阶段');
    }
    const legal = getLegalMoves(state, state.lastRoll.steps);
    const matched = legal.find(
      (m) => m.from === move.from && m.to === move.to
    );
    if (!matched) {
      throw new Error(`非法走法: ${move.from} -> ${move.to}`);
    }

    const next = cloneState(state);
    const player = next.currentPlayer;
    const opponent = player === 1 ? 2 : 1;
    const pName = player === 1 ? '圆锥方' : '轮盘方';

    const target = next.winTarget || PIECES_PER_PLAYER;
    next.pieces[player][matched.pieceIndex] = matched.to;

    if (matched.type === 'capture' && matched.capturedIndex !== -1) {
      next.pieces[opponent][matched.capturedIndex] = 0;
      next.lastEvent = `⚔️ ${pName}冲入公共区第 ${matched.to - PRIVATE_END} 格，击杀对手棋子并将其踢回场外！`;
    } else if (matched.type === 'bear_off') {
      const count = getBorneOffCount(next, player);
      next.lastEvent = `${pName}一枚棋子冲过终点安全出盘！（已出盘 ${count}/${target}）`;
    } else if (matched.type === 'enter') {
      next.lastEvent = `${pName}派遣新棋子进入私人区第 ${matched.to} 格。`;
    } else if (matched.to <= PRIVATE_END) {
      next.lastEvent = `${pName}在私人区前进至第 ${matched.to} 格。`;
    } else {
      next.lastEvent = `${pName}在公共赛道前进至第 ${matched.to - PRIVATE_END} 格。`;
    }

    // 胜负判定
    if (getBorneOffCount(next, player) >= target) {
      next.winner = player;
      next.phase = 'gameover';
      next.lastEvent = `🎉 ${pName}率先将 ${target} 枚棋子冲出赛道，赢得阿塞布棋胜利！`;
      return next;
    }

    // 踩中特殊玫瑰/象形文字格获得额外一掷
    if (matched.extraTurn) {
      next.phase = 'roll';
      next.lastEvent += ' ✨ 踩中神圣标记格，获得额外投掷机会！';
    } else {
      next.currentPlayer = opponent;
      next.turnCount += 1;
      next.phase = 'roll';
    }

    return next;
  }

  return {
    TRACK_LENGTH,
    BEAR_OFF,
    PIECES_PER_PLAYER,
    PRIVATE_END,
    ROSETTE_POSITIONS,
    isRosette,
    progressToCoords,
    isValidCell,
    rollDice,
    createInitialState,
    cloneState,
    getBorneOffCount,
    getReserveCount,
    getLegalMoves,
    applyRoll,
    applyMove
  };
});
