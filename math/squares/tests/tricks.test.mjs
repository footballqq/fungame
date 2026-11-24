import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Tricks = require('../js/tricks.js');

test('explainSquareTrick 与 explainFastSqrt 对 1~100 全部数字零报错且计算 100% 精确', () => {
  for (let n = 1; n <= 100; n++) {
    const sqInfo = Tricks.explainSquareTrick(n);
    assert.equal(sqInfo.n, n);
    assert.equal(sqInfo.sq, n * n);
    assert.ok(sqInfo.steps.length >= 1);

    const sqrtInfo = Tricks.explainFastSqrt(n);
    assert.equal(sqrtInfo.n, n);
    assert.equal(sqrtInfo.sq, n * n);
    assert.ok(sqrtInfo.steps.length >= 1);
  }
});

test('典型数字精准命中对应最优速算绝技', () => {
  assert.equal(Tricks.explainSquareTrick(35).trickId, 'ending5');
  assert.equal(Tricks.explainSquareTrick(47).trickId, 'base50');
  assert.equal(Tricks.explainSquareTrick(96).trickId, 'base100');
  assert.equal(Tricks.explainSquareTrick(61).trickId, 'near19');
  assert.equal(Tricks.explainSquareTrick(79).trickId, 'near19');
  assert.equal(Tricks.explainSquareTrick(32).trickId, 'diffSquare');
  assert.equal(Tricks.TRICK_CARDS.length, 8);
});
