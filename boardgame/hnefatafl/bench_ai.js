/**
 * 维京王者之棋 (Hnefatafl 7x7) AI 自动博弈基准评测脚本
 * 用法：node boardgame/hnefatafl/bench_ai.js [每组局数，默认 40]
 */
'use strict';

const { performance } = require('perf_hooks');
const Engine = require('./js/engine.js');
const AI = require('./js/ai.js');

const GAMES = Math.max(4, parseInt(process.argv[2], 10) || 40);

function pick(state, level) {
  const moves = Engine.getLegalMoves(state);
  if (level === 'random') return moves[Math.floor(Math.random() * moves.length)];
  return AI.chooseMove(state, level);
}

function runPair(levelA, levelB, totalGames) {
  let winsA = 0;
  let draws = 0;
  let turns = 0;
  let timeA = 0;
  let movesA = 0;

  for (let i = 0; i < totalGames; i++) {
    // 对称：偶数局 A 执黑进攻，奇数局 A 执白护王
    const aIsBlack = i % 2 === 0;
    let s = Engine.createInitialState(7);
    let guard = 0;
    while (!s.winner && guard < 180) {
      guard++;
      const curIsA = (s.currentPlayer === 2 && aIsBlack) || (s.currentPlayer === 1 && !aIsBlack);
      const lvl = curIsA ? levelA : levelB;
      const t0 = performance.now();
      const mv = pick(s, lvl);
      const dt = performance.now() - t0;
      if (curIsA) { timeA += dt; movesA++; }
      s = Engine.applyMove(s, mv).state;
    }
    turns += s.turnCount;
    if (!s.winner) draws++;
    else if ((s.winner === 2 && aIsBlack) || (s.winner === 1 && !aIsBlack)) winsA++;
  }

  return {
    pair: `${levelA} vs ${levelB}`,
    games: totalGames,
    winsA,
    draws,
    winRateA: ((winsA / totalGames) * 100).toFixed(1) + '%',
    avgTurns: (turns / totalGames).toFixed(1),
    avgMsA: movesA ? (timeA / movesA).toFixed(2) : '0.00'
  };
}

const out = [
  runPair('master', 'random', GAMES),
  runPair('master', 'easy', GAMES),
  runPair('master', 'normal', GAMES),
  runPair('normal', 'random', GAMES)
];
console.log(JSON.stringify(out, null, 2));
