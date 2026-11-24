import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Records = require('../js/records.js');

function createMemStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

test('pickRandomPair 总是随机返回两位不同的著名数学家名字', () => {
  for (let i = 0; i < 30; i++) {
    const [a, b] = Records.pickRandomPair();
    assert.ok(Records.MATHEMATICIANS.includes(a));
    assert.ok(Records.MATHEMATICIANS.includes(b));
    assert.notEqual(a, b);
  }
});

test('单人星星积攒：答对加星、全对额外奖励 5 颗星并正确评定段位', () => {
  const svc = Records.createRecordsService(createMemStorage());
  const r1 = svc.recordSoloStars('天天', 8, false);
  assert.equal(r1.gained, 8);
  assert.equal(r1.bonus, 0);
  assert.equal(r1.totalStars, 8);

  // 全对 10 题，奖励 +5 星 = 15 星，累计 23 星升级到“速算小侦探”
  const r2 = svc.recordSoloStars('天天', 10, true);
  assert.equal(r2.gained, 15);
  assert.equal(r2.bonus, 5);
  assert.equal(r2.totalStars, 23);
  assert.ok(r2.rank.includes('速算小侦探'));

  svc.clearSoloStars();
  assert.equal(svc.getSoloProfile('天天').stars, 0);
});

test('PK 历史战绩英雄榜正确统计胜负平并按胜场排序，支持清空', () => {
  const svc = Records.createRecordsService(createMemStorage());
  svc.recordPkMatchResult({
    nameA: '牛顿',
    nameB: '莱布尼茨',
    correctA: 9,
    wrongA: 1,
    correctB: 7,
    wrongB: 3,
    winner: 'A',
    rangeLabel: '11~30',
    totalRounds: 10,
  });
  svc.recordPkMatchResult({
    nameA: '牛顿',
    nameB: '高斯',
    correctA: 8,
    wrongA: 2,
    correctB: 8,
    wrongB: 2,
    winner: 'draw',
    rangeLabel: '11~30',
    totalRounds: 10,
  });

  const board = svc.getPkLeaderboardSorted();
  assert.equal(board[0].name, '牛顿');
  assert.equal(board[0].wins, 1);
  assert.equal(board[0].draws, 1);
  assert.equal(board[0].totalCorrect, 17);
  assert.equal(svc.load().pkHistory.length, 2);

  svc.clearPkRecords();
  assert.equal(svc.getPkLeaderboardSorted().length, 0);
  assert.equal(svc.load().pkHistory.length, 0);
});
