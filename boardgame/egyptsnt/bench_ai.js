/**
 * 古埃及双面棋盒（塞尼特棋 Senet + 阿塞布棋 Aseb）AI 自动博弈基准评测脚本
 * 用法：node boardgame/egyptsnt/bench_ai.js [每组对局数，默认 100]
 *
 * 评测方法：
 * - 每组对阵 (A vs B) 严格采用“先后手对称制”：前一半由 A 执先手（圆锥方），后一半由 B 执先手，消除先手偏差。
 * - 统计指标：胜局数、胜率、平均回合数、单步 AI 决策平均耗时 (ms)。
 */
'use strict';

const { performance } = require('perf_hooks');
const Senet = require('./js/senet-engine.js');
const Aseb = require('./js/aseb-engine.js');
const AI = require('./js/ai.js');

const GAMES_PER_PAIR = Math.max(10, parseInt(process.argv[2], 10) || 100);

function pickMove(state, legalMoves, level) {
  if (level === 'random') {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }
  return AI.chooseMove(state, level);
}

function runMatchup(engine, levelA, levelB, totalGames) {
  let winsA = 0;
  let winsB = 0;
  let totalTurns = 0;
  let timeA = 0;
  let movesA = 0;
  let timeB = 0;
  let movesB = 0;

  for (let i = 0; i < totalGames; i++) {
    // 偶数局 A 先手 (player 1)，奇数局 B 先手 (player 1)
    const aIsP1 = i % 2 === 0;
    const p1Level = aIsP1 ? levelA : levelB;
    const p2Level = aIsP1 ? levelB : levelA;

    let s = engine.createInitialState();
    let guard = 0;
    while (!s.winner && guard < 3000) {
      guard++;
      const rolled = engine.applyRoll(s);
      s = rolled.state;
      if (!rolled.skipped && s.phase === 'move') {
        const curLevel = s.currentPlayer === 1 ? p1Level : p2Level;
        const isA = (s.currentPlayer === 1 && aIsP1) || (s.currentPlayer === 2 && !aIsP1);
        const t0 = performance.now();
        const mv = pickMove(s, rolled.legalMoves, curLevel);
        const dt = performance.now() - t0;
        if (isA) {
          timeA += dt;
          movesA++;
        } else {
          timeB += dt;
          movesB++;
        }
        s = engine.applyMove(s, mv);
      }
    }

    totalTurns += s.turnCount;
    const aWon = (s.winner === 1 && aIsP1) || (s.winner === 2 && !aIsP1);
    if (aWon) winsA++;
    else winsB++;
  }

  return {
    pair: `${levelA} vs ${levelB}`,
    totalGames,
    winsA,
    winsB,
    winRateA: ((winsA / totalGames) * 100).toFixed(1) + '%',
    avgTurns: (totalTurns / totalGames).toFixed(1),
    avgMsA: movesA ? (timeA / movesA).toFixed(3) : '0.000',
    avgMsB: movesB ? (timeB / movesB).toFixed(3) : '0.000'
  };
}

function runSuite(gameName, engine) {
  const pairs = [
    ['master', 'random'],
    ['master', 'easy'],
    ['master', 'normal'],
    ['normal', 'random'],
    ['normal', 'easy'],
    ['easy', 'random']
  ];
  const results = pairs.map(([a, b]) => runMatchup(engine, a, b, GAMES_PER_PAIR));
  return { game: gameName, gamesPerPair: GAMES_PER_PAIR, results };
}

const report = {
  timestamp: new Date().toISOString(),
  gamesPerPair: GAMES_PER_PAIR,
  senet: runSuite('Senet (30格塞尼特棋)', Senet),
  aseb: runSuite('Aseb (20格阿塞布棋)', Aseb)
};

console.log(JSON.stringify(report, null, 2));
