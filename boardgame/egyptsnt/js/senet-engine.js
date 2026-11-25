/**
 * 塞尼特棋 (Senet) - 30格古埃及蛇形竞速棋核心引擎
 * 纯逻辑模块，兼容浏览器全局 (window.SenetEngine) 与 Node.js CommonJS。
 *
 * 规则依据：Timothy Kendall 复原体系（兼顾教学可读性与无死锁流畅体验）
 * - 3x10 蛇形赛道，编号 1..30（出盘记为 31）
 * - 双方各 5 枚棋子：player 1 (圆锥 / cone) 与 player 2 (轮盘 / disc)
 * - 初始交替摆放于 1..10 格：1,3,5,7,9 归 P1，2,4,6,8,10 归 P2
 * - 4 根双面木掷棍：平面朝上 1→1步(再掷), 2→2步, 3→3步, 4→4步(再掷), 0→5步(再掷)
 * - 双子相邻保护（不可换位）、三子相邻封锁（叹息之墙，不可越过）
 * - 特殊格：15重生之屋(安全/落水复活点)、26美丽之屋(安全/必须停靠)、
 *   27水之屋(落水送回15格)、28三真之屋(安全/需掷3出盘)、
 *   29二真之屋(安全/需掷2出盘)、30荷鲁斯之屋(安全/任意点数出盘)
 * - 无合法前进走法时，必须尝试合法倒退相同步数；若均不可行则跳过本步
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SenetEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BOARD_SIZE = 30;
  const BEAR_OFF = 31;
  const PIECES_PER_PLAYER = 5;

  const SPECIAL_SQUARES = {
    15: { id: 'rebirth', name: '重生之屋', glyph: '☥', safe: true, desc: '安全格；踩中水之屋后送回此处' },
    26: { id: 'beauty', name: '美丽之屋', glyph: '𓄤', safe: true, mustStop: true, desc: '安全格；所有棋子必须在此准确停下' },
    27: { id: 'water', name: '水之屋', glyph: '〰', safe: false, trap: true, desc: '尼罗河陷阱！踩中立刻送回第15格' },
    28: { id: 'three', name: '三真之屋', glyph: 'III', safe: true, exactExit: 3, desc: '安全格；需恰好掷出 3 点移出棋盘' },
    29: { id: 'two', name: '二真之屋', glyph: 'II', safe: true, exactExit: 2, desc: '安全格；需恰好掷出 2 点移出棋盘' },
    30: { id: 'horus', name: '荷鲁斯之屋', glyph: '𓂀', safe: true, anyExit: true, desc: '安全格；掷出任意点数即可移出棋盘' }
  };

  /**
   * 赛道编号 (1..30) 转棋盘网格坐标 { row: 0..2, col: 0..9 }
   */
  function squareToCoords(sq) {
    if (sq < 1 || sq > BOARD_SIZE) return null;
    const zero = sq - 1;
    const row = Math.floor(zero / 10);
    const offset = zero % 10;
    const col = row % 2 === 0 ? offset : 9 - offset;
    return { row, col };
  }

  /**
   * 网格坐标转赛道编号 (1..30)
   */
  function coordsToSquare(row, col) {
    if (row < 0 || row > 2 || col < 0 || col > 9) return null;
    return row % 2 === 0 ? row * 10 + col + 1 : row * 10 + (9 - col) + 1;
  }

  /**
   * 投掷 4 根双面掷棍
   * @param {Function} [rng=Math.random]
   * @returns {{ sticks: number[], flatCount: number, steps: number, extraTurn: boolean }}
   */
  function rollSticks(rng) {
    const rand = typeof rng === 'function' ? rng : Math.random;
    const sticks = [];
    let flatCount = 0;
    for (let i = 0; i < 4; i++) {
      const isFlat = rand() < 0.5 ? 1 : 0;
      sticks.push(isFlat);
      flatCount += isFlat;
    }
    const steps = flatCount === 0 ? 5 : flatCount;
    const extraTurn = steps === 1 || steps === 4 || steps === 5;
    return { sticks, flatCount, steps, extraTurn };
  }

  /**
   * 创建初始对局状态
   * @param {{ winTarget?: number }} [options]
   */
  function createInitialState(options) {
    const winTarget =
      options && options.winTarget >= 1 && options.winTarget <= PIECES_PER_PLAYER
        ? options.winTarget
        : PIECES_PER_PLAYER;
    const board = new Array(BOARD_SIZE + 1).fill(0);
    for (let sq = 1; sq <= 10; sq++) {
      board[sq] = sq % 2 === 1 ? 1 : 2;
    }
    return {
      game: 'senet',
      winTarget,
      board,
      borneOff: { 1: 0, 2: 0 },
      currentPlayer: 1,
      phase: 'roll', // 'roll' | 'move' | 'gameover'
      lastRoll: null,
      winner: null,
      turnCount: 1,
      lastEvent: '请投掷 4 根双面掷棍开始对局。'
    };
  }

  function cloneState(state) {
    return {
      game: 'senet',
      winTarget: state.winTarget || PIECES_PER_PLAYER,
      board: state.board.slice(),
      borneOff: { 1: state.borneOff[1], 2: state.borneOff[2] },
      currentPlayer: state.currentPlayer,
      phase: state.phase,
      lastRoll: state.lastRoll ? { ...state.lastRoll, sticks: state.lastRoll.sticks.slice() } : null,
      winner: state.winner,
      turnCount: state.turnCount,
      lastEvent: state.lastEvent
    };
  }

  /**
   * 判断某格上的对手棋子是否处于保护状态（安全格 或 与同色相邻）
   */
  function isProtected(board, sq) {
    const owner = board[sq];
    if (!owner) return false;
    if (SPECIAL_SQUARES[sq] && SPECIAL_SQUARES[sq].safe) return true;
    const leftSame = sq > 1 && board[sq - 1] === owner;
    const rightSame = sq < BOARD_SIZE && board[sq + 1] === owner;
    return leftSame || rightSame;
  }

  /**
   * 检查从 from 到 to 之间是否试图跨越对手的“三子封锁墙”
   * 仅检查严格介于路径上的对手连续 3 子（或包含跨越关系）
   */
  function crossesOpponentBlockade(board, player, from, to) {
    const opponent = player === 1 ? 2 : 1;
    const low = Math.min(from, to);
    const high = Math.min(Math.max(from, to), BOARD_SIZE);
    let run = 0;
    for (let sq = low + 1; sq <= high; sq++) {
      if (board[sq] === opponent) {
        run++;
        if (run >= 3) {
          // 如果墙一直延续且终点在墙之后（含出盘），则无法跨过
          if (to > sq || from > sq) return true;
        }
      } else {
        run = 0;
      }
    }
    return false;
  }

  /**
   * 寻找落水后的复活格（优先第 15 格，被占则往 14..1 寻找最近空格，再否则往 16..25 寻空格）
   */
  function findRebirthSquare(board, vacatedSq) {
    const isFree = (sq) => sq === vacatedSq || board[sq] === 0;
    if (isFree(15)) return 15;
    for (let sq = 14; sq >= 1; sq--) {
      if (isFree(sq)) return sq;
    }
    for (let sq = 16; sq <= 25; sq++) {
      if (isFree(sq)) return sq;
    }
    return vacatedSq;
  }

  /**
   * 评估单枚棋子沿某方向移动 steps 步是否合法
   */
  function evaluateSingleMove(board, player, from, steps, direction) {
    if (board[from] !== player) return null;
    const opponent = player === 1 ? 2 : 1;

    if (direction === 1) {
      // 特殊终点格 (28, 29, 30) 的出盘逻辑
      if (from === 28) {
        if (steps === 3) return { from, to: BEAR_OFF, direction: 1, type: 'bear_off' };
        return null;
      }
      if (from === 29) {
        if (steps === 2) return { from, to: BEAR_OFF, direction: 1, type: 'bear_off' };
        return null;
      }
      if (from === 30) {
        return { from, to: BEAR_OFF, direction: 1, type: 'bear_off' };
      }

      const rawTo = from + steps;

      // 必须经过并准确停靠第 26 格（美丽之屋）
      if (from < 26 && rawTo > 26) {
        return null;
      }

      // 第 26 格掷出 5 点可直接跃过终点出盘
      if (from === 26 && steps === 5) {
        if (crossesOpponentBlockade(board, player, from, BEAR_OFF)) return null;
        return { from, to: BEAR_OFF, direction: 1, type: 'bear_off' };
      }

      if (rawTo > BOARD_SIZE) {
        return null;
      }

      // 不可落己方棋子格
      if (board[rawTo] === player) return null;

      // 不可跨越对手三子封锁墙
      if (crossesOpponentBlockade(board, player, from, rawTo)) return null;

      // 踩中水之屋 (27)
      if (rawTo === 27) {
        const rebirthTo = findRebirthSquare(board, from);
        return { from, to: 27, rebirthTo, direction: 1, type: 'water_trap' };
      }

      // 落点有对手棋子：检查是否受保护
      if (board[rawTo] === opponent) {
        if (isProtected(board, rawTo)) return null;
        return { from, to: rawTo, direction: 1, type: 'swap' };
      }

      return { from, to: rawTo, direction: 1, type: 'move' };
    } else {
      // 被迫倒退
      const rawTo = from - steps;
      if (rawTo < 1) return null;
      if (board[rawTo] === player) return null;
      if (crossesOpponentBlockade(board, player, from, rawTo)) return null;

      if (rawTo === 27) {
        const rebirthTo = findRebirthSquare(board, from);
        return { from, to: 27, rebirthTo, direction: -1, type: 'water_trap' };
      }

      if (board[rawTo] === opponent) {
        if (isProtected(board, rawTo)) return null;
        return { from, to: rawTo, direction: -1, type: 'swap' };
      }

      return { from, to: rawTo, direction: -1, type: 'retreat' };
    }
  }

  /**
   * 获取当前玩家在给定点数下的所有合法走法
   * 规则：有向前走法时必须向前；无向前走法时才允许向后退
   */
  function getLegalMoves(state, steps, playerOverride) {
    const player = playerOverride || state.currentPlayer;
    const forwardMoves = [];
    for (let sq = 1; sq <= BOARD_SIZE; sq++) {
      if (state.board[sq] === player) {
        const m = evaluateSingleMove(state.board, player, sq, steps, 1);
        if (m) forwardMoves.push(m);
      }
    }
    if (forwardMoves.length > 0) return forwardMoves;

    const backwardMoves = [];
    for (let sq = 1; sq <= BOARD_SIZE; sq++) {
      if (state.board[sq] === player) {
        const m = evaluateSingleMove(state.board, player, sq, steps, -1);
        if (m) backwardMoves.push(m);
      }
    }
    return backwardMoves;
  }

  /**
   * 投掷并进入走子阶段（若无合法走法则自动跳过并切换或再掷）
   */
  function applyRoll(state, rollResult) {
    if (state.phase !== 'roll' || state.winner) {
      throw new Error('当前不处于投掷阶段');
    }
    const next = cloneState(state);
    const roll = rollResult || rollSticks();
    next.lastRoll = roll;
    const moves = getLegalMoves(next, roll.steps);

    if (moves.length === 0) {
      const pName = next.currentPlayer === 1 ? '圆锥方' : '轮盘方';
      if (roll.extraTurn) {
        next.phase = 'roll';
        next.lastEvent = `${pName}掷出 ${roll.steps} 点，但无合法走法；因掷出特殊点数获得额外投掷机会！`;
      } else {
        next.currentPlayer = next.currentPlayer === 1 ? 2 : 1;
        next.turnCount += 1;
        next.phase = 'roll';
        next.lastEvent = `${pName}掷出 ${roll.steps} 点，无合法走法，轮到对方。`;
      }
      return { state: next, legalMoves: [], skipped: true };
    }

    next.phase = 'move';
    const hasRetreatOnly = moves.every((m) => m.direction === -1);
    const pName = next.currentPlayer === 1 ? '圆锥方' : '轮盘方';
    next.lastEvent = hasRetreatOnly
      ? `${pName}掷出 ${roll.steps} 点，前方受阻，必须选择一枚棋子向后退 ${roll.steps} 格！`
      : `${pName}掷出 ${roll.steps} 点${roll.extraTurn ? '（走完可再掷一次！）' : ''}，请选择要移动的棋子。`;
    return { state: next, legalMoves: moves, skipped: false };
  }

  /**
   * 执行一步走子
   */
  function applyMove(state, move) {
    if (state.phase !== 'move' || !state.lastRoll) {
      throw new Error('当前不处于走子阶段');
    }
    const legal = getLegalMoves(state, state.lastRoll.steps);
    const matched = legal.find((m) => m.from === move.from && m.to === move.to);
    if (!matched) {
      throw new Error(`非法走法: ${move.from} -> ${move.to}`);
    }

    const next = cloneState(state);
    const player = next.currentPlayer;
    const opponent = player === 1 ? 2 : 1;
    const pName = player === 1 ? '圆锥方' : '轮盘方';
    const extraTurn = next.lastRoll.extraTurn;

    const target = next.winTarget || PIECES_PER_PLAYER;

    if (matched.type === 'bear_off') {
      next.board[matched.from] = 0;
      next.borneOff[player] += 1;
      next.lastEvent = `${pName}将第 ${matched.from} 格棋子安全移出棋盘！（已出盘 ${next.borneOff[player]}/${target}）`;
    } else if (matched.type === 'water_trap') {
      next.board[matched.from] = 0;
      const dest = findRebirthSquare(next.board, matched.from);
      next.board[dest] = player;
      next.lastEvent = `${pName}踩中第 27 格「水之屋」落水！被尼罗河水流送回第 ${dest} 格。`;
    } else if (matched.type === 'swap') {
      next.board[matched.from] = opponent;
      next.board[matched.to] = player;
      next.lastEvent = `${pName}从 ${matched.from} 格突袭 ${matched.to} 格，与对手棋子互换位置！`;
    } else {
      next.board[matched.from] = 0;
      next.board[matched.to] = player;
      const special = SPECIAL_SQUARES[matched.to];
      if (matched.type === 'retreat') {
        next.lastEvent = `${pName}被迫从 ${matched.from} 格后退至 ${matched.to} 格。`;
      } else if (special) {
        next.lastEvent = `${pName}稳步抵达第 ${matched.to} 格「${special.name}」！`;
      } else {
        next.lastEvent = `${pName}从第 ${matched.from} 格前进至第 ${matched.to} 格。`;
      }
    }

    // 检查胜负
    if (next.borneOff[player] >= target) {
      next.winner = player;
      next.phase = 'gameover';
      next.lastEvent = `🎉 ${pName}率先将 ${target} 枚棋子移出棋盘，赢得塞尼特棋胜利！`;
      return next;
    }

    // 决定下一回合归属
    if (extraTurn) {
      next.phase = 'roll';
      next.lastEvent += ' 获得额外投掷机会！';
    } else {
      next.currentPlayer = opponent;
      next.turnCount += 1;
      next.phase = 'roll';
    }

    return next;
  }

  return {
    BOARD_SIZE,
    BEAR_OFF,
    PIECES_PER_PLAYER,
    SPECIAL_SQUARES,
    squareToCoords,
    coordsToSquare,
    rollSticks,
    createInitialState,
    cloneState,
    isProtected,
    crossesOpponentBlockade,
    getLegalMoves,
    applyRoll,
    applyMove
  };
});
