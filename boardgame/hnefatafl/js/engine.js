/**
 * 维京王者之棋 (Hnefatafl) 核心规则引擎
 * 支持 7x7 (Brandubh 维京快棋) 与 9x9 (Tablut 经典标准局) 两种盘面。
 * 纯逻辑模块，兼容浏览器全局 (window.HnefataflEngine) 与 Node.js CommonJS。
 *
 * 核心规则：
 * - 阵营：player 1 = 防守方（白方：国王 K + 卫兵 D），player 2 = 进攻方（黑方：维京海盗 A）
 * - 先手：传统由进攻方（黑方，player 2）先手，或允许配置先手（默认黑方 player 2 先手）
 * - 棋子值：0 = 空, 1 = 防守卫兵 (D), 2 = 进攻者 (A), 3 = 国王 (K)
 * - 移动：所有棋子横竖直线任意格移动，不可越子；普通兵不可停在四角逃生格或王座（可穿过空王座）；国王可停王座与四角
 * - 夹击吃子（Custodian Capture）：走子后将敌方普通兵夹在己方两子之间（或己方棋子与四角堡垒/空王座之间）即吃掉；主动走入敌方两子中间安全无事
 * - 胜负：
 *   - 防守方 (1) 胜：国王抵达四个角落任意一格，或进攻方无合法走法
 *   - 进攻方 (2) 胜：擒获国王（国王在王座或王座四邻格需 4 面合围，王座算一面；其他位置 2 面夹击即擒获），或防守方无合法走法
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HnefataflEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EMPTY = 0;
  const DEFENDER = 1;
  const ATTACKER = 2;
  const KING = 3;

  const DIRS = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];

  function isCorner(size, r, c) {
    return (r === 0 || r === size - 1) && (c === 0 || c === size - 1);
  }

  function isThrone(size, r, c) {
    const mid = (size - 1) >> 1;
    return r === mid && c === mid;
  }

  function isRestrictedForPawn(size, r, c) {
    return isCorner(size, r, c) || isThrone(size, r, c);
  }

  function pieceOwner(val) {
    if (val === DEFENDER || val === KING) return 1;
    if (val === ATTACKER) return 2;
    return 0;
  }

  /**
   * 生成初始布局（7x7 Brandubh 或 9x9 Tablut）
   */
  function createInitialState(size) {
    const N = size === 9 ? 9 : 7;
    const mid = (N - 1) >> 1;
    const board = Array.from({ length: N }, () => new Array(N).fill(EMPTY));

    board[mid][mid] = KING;

    if (N === 7) {
      // 7x7 Brandubh: 1 国王 + 4 卫兵 vs 8 进攻者
      [
        [mid - 1, mid], [mid + 1, mid], [mid, mid - 1], [mid, mid + 1]
      ].forEach(([r, c]) => { board[r][c] = DEFENDER; });
      [
        [0, mid], [1, mid], [N - 1, mid], [N - 2, mid],
        [mid, 0], [mid, 1], [mid, N - 1], [mid, N - 2]
      ].forEach(([r, c]) => { board[r][c] = ATTACKER; });
    } else {
      // 9x9 Tablut: 1 国王 + 8 卫兵 vs 16 进攻者
      [
        [mid - 1, mid], [mid - 2, mid], [mid + 1, mid], [mid + 2, mid],
        [mid, mid - 1], [mid, mid - 2], [mid, mid + 1], [mid, mid + 2]
      ].forEach(([r, c]) => { board[r][c] = DEFENDER; });
      [
        [0, 3], [0, 4], [0, 5], [1, 4],
        [8, 3], [8, 4], [8, 5], [7, 4],
        [3, 0], [4, 0], [5, 0], [4, 1],
        [3, 8], [4, 8], [5, 8], [4, 7]
      ].forEach(([r, c]) => { board[r][c] = ATTACKER; });
    }

    return {
      game: 'hnefatafl',
      size: N,
      board,
      currentPlayer: 2, // 传统规则：黑方（进攻方）先手
      winner: null,
      winReason: '',
      turnCount: 1,
      captured: { 1: 0, 2: 0 }, // 1: 白方被吃数, 2: 黑方被吃数
      lastEvent: '维京围城开始！按传统由黑方（进攻者）率先出击。'
    };
  }

  function cloneState(state) {
    return {
      game: 'hnefatafl',
      size: state.size,
      board: state.board.map((row) => row.slice()),
      currentPlayer: state.currentPlayer,
      winner: state.winner,
      winReason: state.winReason,
      turnCount: state.turnCount,
      captured: { 1: state.captured[1], 2: state.captured[2] },
      lastEvent: state.lastEvent
    };
  }

  function findKing(board) {
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board.length; c++) {
        if (board[r][c] === KING) return { r, c };
      }
    }
    return null;
  }

  /**
   * 获取指定格子的所有合法落点
   */
  function getMovesForPiece(state, r, c) {
    const val = state.board[r][c];
    if (!val) return [];
    const N = state.size;
    const isKingPiece = val === KING;
    const moves = [];

    for (let d = 0; d < 4; d++) {
      const dr = DIRS[d][0];
      const dc = DIRS[d][1];
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < N && nc >= 0 && nc < N) {
        if (state.board[nr][nc] !== EMPTY) break;
        if (isKingPiece || !isRestrictedForPawn(N, nr, nc)) {
          moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, piece: val });
        }
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  /**
   * 获取当前玩家全部合法走法
   */
  function getLegalMoves(state, playerOverride) {
    if (state.winner) return [];
    const player = playerOverride || state.currentPlayer;
    const N = state.size;
    const all = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (pieceOwner(state.board[r][c]) === player) {
          const pm = getMovesForPiece(state, r, c);
          for (let i = 0; i < pm.length; i++) all.push(pm[i]);
        }
      }
    }
    return all;
  }

  /**
   * 判断某格对指定方是否充当“敌对夹击墙”（四角堡垒或空王座对双方均可协助夹击普通兵）
   */
  function isHostileTo(board, size, r, c, targetOwner) {
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    const val = board[r][c];
    if (val !== EMPTY) {
      return pieceOwner(val) !== targetOwner;
    }
    if (isCorner(size, r, c)) return true;
    if (isThrone(size, r, c) && val === EMPTY) return true;
    return false;
  }

  /**
   * 检查国王是否被擒获
   * - 在王座或王座正交相邻格：需要 4 面全被进攻者（或王座本身）围死
   * - 在其他位置：2 面夹击（进攻者/四角/空王座）即可擒获
   */
  function isKingCaptured(board, size, moverOwner, movedToR, movedToC) {
    if (moverOwner !== 2) return false;
    const king = findKing(board);
    if (!king) return true;

    const mid = (size - 1) >> 1;
    const distToThrone = Math.abs(king.r - mid) + Math.abs(king.c - mid);

    if (distToThrone <= 1) {
      // 4 面合围（四邻格必须全是进攻者或王座）
      for (let d = 0; d < 4; d++) {
        const nr = king.r + DIRS[d][0];
        const nc = king.c + DIRS[d][1];
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) return false;
        const v = board[nr][nc];
        const hostile = v === ATTACKER || isThrone(size, nr, nc);
        if (!hostile) return false;
      }
      return true;
    }

    // 非王座附近：只要本次刚落下的黑子与国王相邻，且国王另一侧是黑子/角落/空王座即擒获
    const dr = king.r - movedToR;
    const dc = king.c - movedToC;
    if (Math.abs(dr) + Math.abs(dc) === 1) {
      const oppR = king.r + dr;
      const oppC = king.c + dc;
      if (isHostileTo(board, size, oppR, oppC, 1)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 执行一步走子，返回新状态与本次被吃掉的棋子列表
   */
  function applyMove(state, move) {
    if (state.winner) throw new Error('对局已结束');
    const N = state.size;
    const piece = state.board[move.fromR][move.fromC];
    const player = pieceOwner(piece);
    if (player !== state.currentPlayer) {
      throw new Error('非当前回合玩家棋子');
    }

    const legal = getMovesForPiece(state, move.fromR, move.fromC);
    const ok = legal.some((m) => m.toR === move.toR && m.toC === move.toC);
    if (!ok) {
      throw new Error(`非法走法: (${move.fromR},${move.fromC}) -> (${move.toR},${move.toC})`);
    }

    const next = cloneState(state);
    next.board[move.fromR][move.fromC] = EMPTY;
    next.board[move.toR][move.toC] = piece;

    const opponent = player === 1 ? 2 : 1;
    const capturedList = [];

    // 1. 检测四方向普通兵夹击吃子
    for (let d = 0; d < 4; d++) {
      const adjR = move.toR + DIRS[d][0];
      const adjC = move.toC + DIRS[d][1];
      if (adjR < 0 || adjR >= N || adjC < 0 || adjC >= N) continue;
      const adjVal = next.board[adjR][adjC];
      if (adjVal === EMPTY || adjVal === KING) continue;
      if (pieceOwner(adjVal) !== opponent) continue;

      const beyondR = adjR + DIRS[d][0];
      const beyondC = adjC + DIRS[d][1];
      if (isHostileTo(next.board, N, beyondR, beyondC, opponent)) {
        next.board[adjR][adjC] = EMPTY;
        next.captured[opponent] += 1;
        capturedList.push({ r: adjR, c: adjC, piece: adjVal });
      }
    }

    const pName = player === 1 ? '白方（守卫）' : '黑方（进攻）';

    // 2. 判定国王逃脱胜利
    if (piece === KING && isCorner(N, move.toR, move.toC)) {
      next.winner = 1;
      next.winReason = '国王成功突围抵达角落堡垒！';
      next.lastEvent = '👑 白方国王冲入角落逃生堡垒，守卫方大获全胜！';
      return { state: next, captured: capturedList };
    }

    // 3. 判定国王被擒获胜利
    if (isKingCaptured(next.board, N, player, move.toR, move.toC)) {
      const k = findKing(next.board);
      if (k) {
        capturedList.push({ r: k.r, c: k.c, piece: KING });
      }
      next.winner = 2;
      next.winReason = '维京进攻方成功合围擒获国王！';
      next.lastEvent = '⚔️ 黑方成功夹击擒获白方国王，进攻方获胜！';
      return { state: next, captured: capturedList };
    }

    // 4. 切换回合并检查对手是否无子可走
    next.currentPlayer = opponent;
    next.turnCount += 1;

    if (getLegalMoves(next, opponent).length === 0) {
      next.winner = player;
      next.winReason = '对手无任何合法走法可走！';
      next.lastEvent = `🎉 对手被彻底封死无路可走，${pName}获胜！`;
      return { state: next, captured: capturedList };
    }

    if (capturedList.length > 0) {
      next.lastEvent = `⚔️ ${pName}精妙夹击，一举吃掉对手 ${capturedList.length} 枚棋子！`;
    } else if (piece === KING) {
      next.lastEvent = `👑 白方国王移动至 (${move.toR + 1}, ${move.toC + 1})，寻找突围路线。`;
    } else {
      next.lastEvent = `${pName}将棋子移至 (${move.toR + 1}, ${move.toC + 1})。`;
    }

    return { state: next, captured: capturedList };
  }

  return {
    EMPTY,
    DEFENDER,
    ATTACKER,
    KING,
    isCorner,
    isThrone,
    isRestrictedForPawn,
    pieceOwner,
    createInitialState,
    cloneState,
    findKing,
    getMovesForPiece,
    getLegalMoves,
    applyMove
  };
});
