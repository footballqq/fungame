import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../js/engine.js');

test('getSquaresInRange 精确生成 1~100 完全平方数', () => {
  const all = Engine.getSquaresInRange(1, 100);
  assert.equal(all.length, 100);
  assert.deepEqual(all[0], { n: 1, sq: 1 });
  assert.deepEqual(all[10], { n: 11, sq: 121 });
  assert.deepEqual(all[99], { n: 100, sq: 10000 });

  const printList = Engine.getSquaresInRange(11, 50);
  assert.equal(printList.length, 40);
  assert.equal(printList[0].n, 11);
  assert.equal(printList[39].n, 50);
});

test('generateQuestion 生成正算、反算、混合题与高迷惑性选择题选项', () => {
  // 正算选择题：选项必须 4 个不重复，包含正确答案，且至少 2 个干扰项与答案同尾数或同位数
  for (let i = 0; i < 40; i++) {
    const q = Engine.generateQuestion({ minN: 11, maxN: 99, mode: 'forward', inputType: 'choice' });
    assert.equal(q.direction, 'forward');
    assert.equal(q.answer, String(q.n * q.n));
    assert.equal(q.expectedDigits, q.answer.length);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4, '选项必须互不重复');
    assert.ok(q.options.includes(q.answer), '选项必须包含正确答案');

    const ansLast = q.answer.slice(-1);
    const sameLastCount = q.options.filter((opt) => opt !== q.answer && opt.slice(-1) === ansLast).length;
    assert.ok(sameLastCount >= 2, `正算干扰项迷惑性不足: ${q.n}^2=${q.answer}, options=${q.options}`);
  }

  // 反算选择题：必须包含同平方尾数配对的强迷惑干扰项（如 47 与 43）
  for (let i = 0; i < 40; i++) {
    const q = Engine.generateQuestion({ minN: 11, maxN: 99, mode: 'reverse', inputType: 'choice' });
    assert.equal(q.direction, 'reverse');
    assert.equal(q.answer, String(q.n));
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes(q.answer));
    const unit = q.n % 10;
    if (unit !== 0 && unit !== 5) {
      const mirrorUnit = (10 - unit) % 10;
      const hasConfuser = q.options.some(
        (opt) => opt !== q.answer && (Number(opt) % 10 === unit || Number(opt) % 10 === mirrorUnit)
      );
      assert.ok(hasConfuser, `反算干扰项缺少同尾数配对: sqrt(${q.sq})=${q.n}, options=${q.options}`);
    }
  }
});

test('零反悔自动判题：填满目标位数瞬间锁定并判对错，锁定后忽略继续输入', () => {
  const q = Engine.generateQuestion({ minN: 17, maxN: 17, mode: 'forward', inputType: 'keypad' });
  assert.equal(q.answer, '289');
  assert.equal(q.expectedDigits, 3);

  let state = Engine.createInputState(q.expectedDigits);
  state = Engine.appendDigitNoUndo(state, '2', q.answer);
  assert.equal(state.locked, false);
  assert.equal(state.value, '2');

  state = Engine.appendDigitNoUndo(state, '8', q.answer);
  assert.equal(state.locked, false);
  assert.equal(state.value, '28');

  // 第3位填错成 8 -> 立即锁定且判错，不可反悔
  state = Engine.appendDigitNoUndo(state, '8', q.answer);
  assert.equal(state.locked, true);
  assert.equal(state.correct, false);
  assert.equal(state.value, '288');

  // 锁定后再点任何数字都无效
  const after = Engine.appendDigitNoUndo(state, '9', q.answer);
  assert.deepEqual(after, state);
});

test('PK 赛制计分：支持 10/20 局，准确统计双方对错次数与胜负', () => {
  const match = Engine.createPkMatch({ totalRounds: 10, minN: 11, maxN: 30, mode: 'mixed', inputType: 'keypad' });
  assert.equal(match.totalRounds, 10);
  assert.equal(match.questions.length, 10);
  assert.equal(match.players.A.correct, 0);
  assert.equal(match.players.B.wrong, 0);

  const q0 = match.questions[0];
  Engine.submitPkPlayerAnswer(match, 'A', q0.answer, 1200);
  Engine.submitPkPlayerAnswer(match, 'B', '99999', 1500);

  // 重复提交无效（零反悔）
  Engine.submitPkPlayerAnswer(match, 'B', q0.answer, 1600);

  assert.equal(match.players.A.correct, 1);
  assert.equal(match.players.A.wrong, 0);
  assert.equal(match.players.B.correct, 0);
  assert.equal(match.players.B.wrong, 1);
  assert.equal(Engine.isPkRoundFinished(match), true);
});

test('自定义范围 51~99 与趣味筛选（只选质数、尾数5、排除整十数）精确生效', () => {
  const high = Engine.getSquaresInRange(51, 99);
  assert.equal(high.length, 49);
  assert.deepEqual(high[0], { n: 51, sq: 2601 });
  assert.deepEqual(high[48], { n: 99, sq: 9801 });

  // 只选质数：11~30 内应为 11, 13, 17, 19, 23, 29 共 6 个
  const primes = Engine.getSquaresInRange(11, 30, 'prime').map((x) => x.n);
  assert.deepEqual(primes, [11, 13, 17, 19, 23, 29]);

  // 批量出题只出质数
  const primeBatch = Engine.generateQuestionBatch(12, {
    minN: 11,
    maxN: 99,
    filterType: 'prime',
    mode: 'mixed',
    inputType: 'keypad',
  });
  for (const q of primeBatch) {
    assert.ok(Engine.isPrime(q.n), `应只出质数，却出现了 ${q.n}`);
  }

  // 只选尾数 5
  const fives = Engine.getSquaresInRange(11, 99, 'ending5').map((x) => x.n);
  assert.deepEqual(fives, [15, 25, 35, 45, 55, 65, 75, 85, 95]);

  // 排除整十数
  const noTens = Engine.getSquaresInRange(11, 50, 'no-tens');
  assert.ok(noTens.every((x) => x.n % 10 !== 0));
});
