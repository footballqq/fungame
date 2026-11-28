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
