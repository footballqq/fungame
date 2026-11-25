/**
 * 塞尼特棋 (Senet) 策略对照实验脚本
 * 验证两大核心博弈问题：
 * 1. “死守第 26 格美丽之屋（卡门流）” vs “极速冲刺流” vs “标准均衡流”，谁胜率最高？
 * 2. 若改为“先出 3 枚棋子即胜（快速版）”，对局时长缩短多少？卡门策略是否更具统治力？
 *
 * 用法：node boardgame/egyptsnt/bench_strategy.js [每组局数，默认 200]
 */
'use strict';

const Senet = require('./js/senet-engine.js');

const GAMES = Math.max(20, parseInt(process.argv[2], 10) || 200);

function evalByStyle(state, player, style, targetWin) {
  if (state.borneOff[player] >= targetWin) return 10000;
  const opp = player === 1 ? 2 : 1;
  if (state.borneOff[opp] >= targetWin) return -10000;

  let score = (state.borneOff[player] - state.borneOff[opp]) * 220;
  let myRun = 0;
  let oppRun = 0;

  // 统计我方还在第 26 格之前等待过关的棋子数
  let myBehind26 = 0;
  let oppBehind26 = 0;
  for (let sq = 1; sq <= 25; sq++) {
    if (state.board[sq] === player) myBehind26++;
    else if (state.board[sq] === opp) oppBehind26++;
  }

  for (let sq = 1; sq <= Senet.BOARD_SIZE; sq++) {
    const owner = state.board[sq];
    if (owner === player) {
      myRun++;
      oppRun = 0;
      score += sq * 4.5;
      if (sq === 26) {
        if (style === 'gatekeeper') {
          // 死守卡门流：只要对手还有棋子在 26 格前，拼命蹲在 26 格堵门！
          score += oppBehind26 > 0 ? 150 : 20;
        } else if (style === 'rusher') {
          // 极速冲刺流：不恋战，鼓励尽快冲出 26 格
          score += 5;
        } else {
          // 均衡流
          score += 36;
        }
      }
      if (sq === 28 || sq === 29 || sq === 30) {
        score += style === 'rusher' ? 55 : 28;
      }
      if (sq === 15) score += 14;
      if (myRun === 2) score += 22;
      if (myRun >= 3) score += 34;
    } else if (owner === opp) {
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

  // 卡门流额外惩罚：在对手还被堵在门外时，轻易放弃 26 格
  if (style === 'gatekeeper' && myBehind26 === 0 && state.board[26] === player && oppBehind26 === 0) {
    score -= 20;
  }

  return score;
}

function chooseStyleMove(state, style, targetWin) {
  const moves = Senet.getLegalMoves(state, state.lastRoll.steps);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  const player = state.currentPlayer;
  let best = moves[0];
  let bestScore = -Infinity;

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const next = Senet.applyMove(state, m);
    let val = evalByStyle(next, player, style, targetWin);
    if (m.type === 'bear_off') val += style === 'rusher' ? 120 : 80;
    if (m.type === 'water_trap') val -= 160;
    if (m.type === 'swap') val += (m.to - m.from) * 3.5 + 15;
    // 死守卡门流：如果从 26 格离开且不是直接出盘，额外扣分
    if (style === 'gatekeeper' && m.from === 26 && m.type !== 'bear_off') {
      val -= 65;
    }
    val += (Math.random() - 0.5) * 3;
    if (val > bestScore) {
      bestScore = val;
      best = m;
    }
  }
  return best;
}

function runPair(styleA, styleB, targetWin, totalGames) {
  let winsA = 0;
  let totalTurns = 0;

  for (let g = 0; g < totalGames; g++) {
    const aIsP1 = g % 2 === 0;
    let s = Senet.createInitialState();
    let guard = 0;
    while (guard < 3000) {
      if (s.borneOff[1] >= targetWin) { s.winner = 1; break; }
      if (s.borneOff[2] >= targetWin) { s.winner = 2; break; }
      guard++;
      const r = Senet.applyRoll(s);
      s = r.state;
      if (!r.skipped && s.phase === 'move') {
        const curStyle = (s.currentPlayer === 1 ? aIsP1 : !aIsP1) ? styleA : styleB;
        const mv = chooseStyleMove(s, curStyle, targetWin);
        s = Senet.applyMove(s, mv);
      }
    }
    totalTurns += s.turnCount;
    const aWon = (s.winner === 1 && aIsP1) || (s.winner === 2 && !aIsP1);
    if (aWon) winsA++;
  }

  return {
    rule: `先出 ${targetWin} 子胜`,
    matchup: `${styleA} vs ${styleB}`,
    games: totalGames,
    winsA,
    winRateA: ((winsA / totalGames) * 100).toFixed(1) + '%',
    avgTurns: (totalTurns / totalGames).toFixed(1)
  };
}

const results = [
  // 经典 5 子胜
  runPair('gatekeeper', 'rusher', 5, GAMES),
  runPair('gatekeeper', 'balanced', 5, GAMES),
  runPair('balanced', 'rusher', 5, GAMES),
  // 快速 3 子胜
  runPair('gatekeeper', 'rusher', 3, GAMES),
  runPair('gatekeeper', 'balanced', 3, GAMES),
  runPair('balanced', 'rusher', 3, GAMES)
];

console.log(JSON.stringify(results, null, 2));
