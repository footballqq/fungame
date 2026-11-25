/**
 * 非洲播棋 (Mancala / Kalah 4 颗经典局) AI 自动博弈基准评测脚本
 * 用法：node boardgame/mancala/bench_ai.js [每组局数，默认 60]
 */
'use strict';

const { performance } = require('perf_hooks');
const Engine = require('./js/engine.js');
const AI = require('./js/ai.js');

const GAMES = Math.max(6, parseInt(process.argv[2], 10) || 60);

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
    const aIsP1 = i % 2 === 0;
    let s = Engine.createInitialState(4);
    let guard = 0;
    while (s.winner === null && guard < 300) {
      guard++;
      const curIsA = (s.currentPlayer === 1 && aIsP1) || (s.currentPlayer === 2 && !aIsP1);
      const lvl = curIsA ? levelA : levelB;
      const t0 = performance.now();
      const pit = pick(s, lvl);
      const dt = performance.now() - t0;
      if (curIsA) { timeA += dt; movesA++; }
      s = Engine.applyMove(s, pit).state;
    }
    turns += s.turnCount;
    if (s.winner === 0) draws++;
    else if ((s.winner === 1 && aIsP1) || (s.winner === 2 && !aIsP1)) winsA++;
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
