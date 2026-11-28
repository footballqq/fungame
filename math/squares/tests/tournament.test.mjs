import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Tour = require('../js/tournamentEngine.js');

function createMemStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

test('8 人单败淘汰赛：1/4决赛 -> 半决赛 -> 总决赛，精确产生冠亚军', () => {
  const players = ['高斯', '欧拉', '牛顿', '莱布尼茨', '费马', '祖冲之', '华罗庚', '拉马努金'];
  const tour = Tour.createEliminationTournament(players, { noShuffle: true });

  assert.equal(tour.rounds.length, 3);
  assert.equal(tour.rounds[0].matches.length, 4);
  assert.equal(tour.rounds[1].matches.length, 2);
  assert.equal(tour.rounds[2].matches.length, 1);

  // 逐场模拟打完全部 7 场
  let played = 0;
  while (tour.status !== 'finished') {
    const next = Tour.getNextReadyMatch(tour);
    assert.ok(next, '未完赛时必须存在下一场 ready 比赛');
    Tour.recordTournamentMatchResult(tour, next.id, 6, 4, 'A');
    played += 1;
  }

  assert.equal(played, 7);
  assert.equal(tour.champion, '高斯');
  assert.equal(tour.runnerUp, '牛顿');
  assert.equal(tour.rankings[0].name, '高斯');
  assert.equal(tour.rankings[1].name, '牛顿');
});

test('5 人奇数淘汰赛：自动均匀轮空 BYE，轮空选手直接晋级且顺利打到总决赛', () => {
  const players = ['A', 'B', 'C', 'D', 'E'];
  const tour = Tour.createEliminationTournament(players, { noShuffle: true });

  // 5人扩到8格，应有 3 个轮空（BYE）自动晋级半决赛，首轮只剩 1 场真实比赛
  const r0Byes = tour.rounds[0].matches.filter((m) => m.isBye);
  const r0Real = tour.rounds[0].matches.filter((m) => !m.isBye);
  assert.equal(r0Byes.length, 3);
  assert.equal(r0Real.length, 1);

  let played = 0;
  while (tour.status !== 'finished') {
    const next = Tour.getNextReadyMatch(tour);
    assert.ok(next);
    Tour.recordTournamentMatchResult(tour, next.id, 5, 3, 'A');
    played += 1;
  }

  // 5 人淘汰赛总共只需打 4 场真实比赛即可决出冠军
  assert.equal(played, 4);
  assert.ok(tour.champion);
  assert.ok(tour.runnerUp);
  assert.notEqual(tour.champion, tour.runnerUp);
});

test('4 人单循环赛：共 6 场，按积分正确排定冠亚军并存档为第 1 届/第 2 届', () => {
  const tour = Tour.createRoundRobinTournament(['高斯', '欧拉', '牛顿', '费马'], {
    noShuffle: true,
    rangeLabel: '11~30',
  });
  assert.equal(tour.rounds[0].matches.length, 6);

  while (tour.status !== 'finished') {
    const next = Tour.getNextReadyMatch(tour);
    Tour.recordTournamentMatchResult(tour, next.id, 7, 3, 'A');
  }

  assert.equal(tour.champion, '高斯');
  assert.equal(tour.runnerUp, '欧拉');

  const store = Tour.createTournamentStore(createMemStorage());
  const saved1 = store.saveFinishedTournament(tour);
  const saved2 = store.saveFinishedTournament(tour);
  assert.equal(saved1.edition, 1);
  assert.equal(saved2.edition, 2);
  assert.equal(store.loadArchive().items.length, 2);
  assert.equal(store.loadArchive().items[0].champion, '高斯');
});

test('中途自动存盘与断线读档：未完赛可精确恢复晋级进度，完赛或清空后自动失效', () => {
  const store = Tour.createTournamentStore(createMemStorage());
  const tour = Tour.createEliminationTournament(['牛顿', '高斯', '欧拉', '费马'], {
    totalRounds: 10,
    minN: 11,
    maxN: 30,
    shuffle: false,
  });

  // 打完第一场半决赛后存盘
  const m1 = Tour.getNextReadyMatch(tour);
  Tour.recordTournamentMatchResult(tour, m1.id, 8, 2, 'A');
  store.saveActiveTournament(tour, '半决赛第一场结束');

  const restored = store.loadActiveTournament();
  assert.ok(restored);
  assert.equal(restored.lastMatchNotice, '半决赛第一场结束');
  assert.equal(restored.tournament.rounds[0].matches[0].status, 'done');
  assert.equal(restored.tournament.rounds[0].matches[0].winner, m1.playerA);
  assert.equal(Tour.getNextReadyMatch(restored.tournament).id, tour.rounds[0].matches[1].id);

  // 打完剩余场次完赛后，自动清除进行中存档
  let next;
  while ((next = Tour.getNextReadyMatch(restored.tournament))) {
    Tour.recordTournamentMatchResult(restored.tournament, next.id, 6, 4, 'A');
  }
  assert.equal(restored.tournament.status, 'finished');
  store.saveActiveTournament(restored.tournament, '');
  assert.equal(store.loadActiveTournament(), null);
});

test('7 人组队擂台赛（4 vs 3）：赢家守擂、输家换下一位，支持中途存盘读档直到一方全灭决出胜队', () => {
  const players = ['🍎 祖冲之', '🐼 牛顿', '🦖 高斯', '🚀 欧拉', '🦊 费马', '🐧 爱因斯坦', '🍓 居里夫人'];
  const tour = Tour.createTeamGauntletTournament(players, {
    totalRounds: 10,
    minN: 11,
    maxN: 30,
    noShuffle: true,
  });

  assert.equal(tour.format, 'team-gauntlet');
  assert.equal(tour.gauntlet.teamA.length, 4);
  assert.equal(tour.gauntlet.teamB.length, 3);

  // 第 1 场：蓝队1号(祖冲之) 胜 红队1号(费马)，祖冲之守擂 1 连胜，红队换2号(爱因斯坦)上场
  const m1 = Tour.getNextReadyMatch(tour);
  assert.equal(m1.playerA, '🍎 祖冲之');
  assert.equal(m1.playerB, '🦊 费马');
  Tour.recordTournamentMatchResult(tour, m1.id, 8, 4, 'A');
  assert.equal(tour.gauntlet.streakA, 1);
  assert.equal(tour.gauntlet.idxB, 1);

  // 模拟中途刷新断点续传
  const store = Tour.createTournamentStore(createMemStorage());
  store.saveActiveTournament(tour, '祖冲之守擂成功');
  const restored = store.loadActiveTournament().tournament;

  // 第 2 场：蓝队1号(祖冲之) 继续守擂 vs 红队2号(爱因斯坦)，假设爱因斯坦反杀
  const m2 = Tour.getNextReadyMatch(restored);
  assert.equal(m2.playerA, '🍎 祖冲之');
  assert.equal(m2.playerB, '🐧 爱因斯坦');
  Tour.recordTournamentMatchResult(restored, m2.id, 5, 9, 'B');
  assert.equal(restored.gauntlet.idxA, 1);
  assert.equal(restored.gauntlet.streakB, 1);

  // 后续全部由蓝队获胜，直到红队 3 人全灭
  let next;
  while ((next = Tour.getNextReadyMatch(restored))) {
    Tour.recordTournamentMatchResult(restored, next.id, 10, 2, 'A');
  }

  assert.equal(restored.status, 'finished');
  assert.ok(restored.champion.includes('蓝队'));
  assert.equal(restored.runnerUp, '🟠 红队');
  assert.ok(restored.mvp);
});
