/**
 * 非洲播棋 (Mancala / Kalah 经典规则) 核心引擎
 * 纯逻辑模块，兼容浏览器全局 (window.MancalaEngine) 与 Node.js CommonJS。
 *
 * 盘面索引（共 14 个坑，逆时针环绕）：
 * - 玩家 1（下方）小坑：0, 1, 2, 3, 4, 5（从左到右），大宝库：6（最右侧）
 * - 玩家 2（上方）小坑：7, 8, 9, 10, 11, 12（从右到左），大宝库：13（最左侧）
 * - 对面坑映射：小坑 i 的正对面小坑是 12 - i（例如 0↔12, 1↔11, ..., 5↔7）
 *
 * 规则：
 * - 支持每坑初始 4 颗宝石（经典 48 颗）或 3 颗宝石（快速 36 颗）
 * - 播种：抓起己方一个非空小坑的全部宝石，逆时针每坑放 1 颗（经己方大宝库放 1 颗，自动跳过对方大宝库）
 * - 额外回合：最后一颗落入己方大宝库 → 立即再来一次！
 * - 对坑截胡：最后一颗落入己方原本为空的小坑，且正对面对手小坑非空 → 把这 1 颗 + 对面全部宝石收进己方大宝库！
 * - 终局：任意一方 6 个小坑全部清空时，对方将自己这边剩余全部宝石收入己方大宝库，总宝石数多者胜（允许平局 winner=0）
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MancalaEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const P1_STORE = 6;
  const P2_STORE = 13;

  function storeOf(player) {
    return player === 1 ? P1_STORE : P2_STORE;
  }

  function oppStoreOf(player) {
    return player === 1 ? P2_STORE : P1_STORE;
  }

  function isOwnPit(player, idx) {
    return player === 1 ? idx >= 0 && idx <= 5 : idx >= 7 && idx <= 12;
  }

  function oppositePit(idx) {
    return 12 - idx;
  }

  function createInitialState(seedsPerPit) {
    const seeds = seedsPerPit === 3 ? 3 : 4;
    const pits = new Array(14).fill(seeds);
    pits[P1_STORE] = 0;
    pits[P2_STORE] = 0;
    return {
      game: 'mancala',
      seedsPerPit: seeds,
      pits,
      currentPlayer: 1,
      winner: null, // null | 1 | 2 | 0(平局)
      turnCount: 1,
      lastEvent: `播棋开局（每坑 ${seeds} 颗宝石）！请点击下方己方任意有宝石的浅坑开始逆时针播种。`
    };
  }

  function cloneState(state) {
    return {
      game: 'mancala',
      seedsPerPit: state.seedsPerPit,
      pits: state.pits.slice(),
      currentPlayer: state.currentPlayer,
      winner: state.winner,
      turnCount: state.turnCount,
      lastEvent: state.lastEvent
    };
  }

  function getLegalMoves(state, playerOverride) {
    if (state.winner !== null) return [];
    const player = playerOverride || state.currentPlayer;
    const start = player === 1 ? 0 : 7;
    const moves = [];
    for (let i = start; i < start + 6; i++) {
      if (state.pits[i] > 0) moves.push(i);
    }
    return moves;
  }

  function sumSide(pits, player) {
    const start = player === 1 ? 0 : 7;
    let total = 0;
    for (let i = start; i < start + 6; i++) total += pits[i];
    return total;
  }

  /**
   * 执行一次播种，返回 { state, path, extraTurn, captured, capturedPit }
   */
  function applyMove(state, pitIndex) {
    if (state.winner !== null) throw new Error('对局已结束');
    const player = state.currentPlayer;
    if (!isOwnPit(player, pitIndex) || state.pits[pitIndex] <= 0) {
      throw new Error(`非法播种坑位: ${pitIndex}`);
    }

    const next = cloneState(state);
    let hand = next.pits[pitIndex];
    next.pits[pitIndex] = 0;

    const myStore = storeOf(player);
    const oppStore = oppStoreOf(player);
    const path = [];
    let cur = pitIndex;

    while (hand > 0) {
      cur = (cur + 1) % 14;
      if (cur === oppStore) continue; // 跳过对手大宝库
      next.pits[cur] += 1;
      path.push(cur);
      hand--;
    }

    const pName = player === 1 ? '南岸方（下方）' : '北岸方（上方）';
    let extraTurn = false;
    let captured = 0;
    let capturedPit = -1;

    // 1. 判定额外回合
    if (cur === myStore) {
      extraTurn = true;
    } else if (isOwnPit(player, cur) && next.pits[cur] === 1) {
      // 2. 判定对坑截胡：最后一颗落入己方原本为空的坑，且正对面对手坑有宝石
      const oppIdx = oppositePit(cur);
      if (next.pits[oppIdx] > 0) {
        captured = next.pits[oppIdx] + 1;
        capturedPit = oppIdx;
        next.pits[myStore] += captured;
        next.pits[cur] = 0;
        next.pits[oppIdx] = 0;
      }
    }

    // 3. 检查终局（任意一方 6 个小坑全空）
    const p1Rem = sumSide(next.pits, 1);
    const p2Rem = sumSide(next.pits, 2);
    if (p1Rem === 0 || p2Rem === 0) {
      for (let i = 0; i < 6; i++) {
        next.pits[P1_STORE] += next.pits[i];
        next.pits[i] = 0;
      }
      for (let i = 7; i < 13; i++) {
        next.pits[P2_STORE] += next.pits[i];
        next.pits[i] = 0;
      }
      if (next.pits[P1_STORE] > next.pits[P2_STORE]) {
        next.winner = 1;
        next.lastEvent = `🎉 终局结算：南岸方 ${next.pits[P1_STORE]} 颗 vs 北岸方 ${next.pits[P2_STORE]} 颗，南岸方获胜！`;
      } else if (next.pits[P2_STORE] > next.pits[P1_STORE]) {
        next.winner = 2;
        next.lastEvent = `🎉 终局结算：北岸方 ${next.pits[P2_STORE]} 颗 vs 南岸方 ${next.pits[P1_STORE]} 颗，北岸方获胜！`;
      } else {
        next.winner = 0;
        next.lastEvent = `🤝 终局结算：双方各得 ${next.pits[P1_STORE]} 颗宝石，势均力敌平局！`;
      }
      return { state: next, path, extraTurn: false, captured, capturedPit };
    }

    // 4. 决定下一回合归属
    if (extraTurn) {
      next.lastEvent = `✨ ${pName}最后一颗精准落入己方大宝库，获得额外连播机会！`;
    } else {
      next.currentPlayer = player === 1 ? 2 : 1;
      next.turnCount += 1;
      if (captured > 0) {
        next.lastEvent = `💎 ${pName}精准落入空坑触发“对坑截胡”，一口气卷走 ${captured} 颗宝石！`;
      } else {
        next.lastEvent = `${pName}从 ${player === 1 ? pitIndex + 1 : pitIndex - 6} 号坑播种完毕，轮到对方。`;
      }
    }

    return { state: next, path, extraTurn, captured, capturedPit };
  }

  return {
    P1_STORE,
    P2_STORE,
    storeOf,
    oppStoreOf,
    isOwnPit,
    oppositePit,
    createInitialState,
    cloneState,
    getLegalMoves,
    sumSide,
    applyMove
  };
});
