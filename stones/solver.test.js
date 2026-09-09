// codex: 2026-09-09 编写 solver.test.js 测试前端算法库逻辑
const test = require('node:test');
const assert = require('node:assert');
const ParitySolver = require('./solver.js');

test('computeTheoreticalMinPieces returns correct values', () => {
  assert.strictEqual(ParitySolver.computeTheoreticalMinPieces(4), 8);
  assert.strictEqual(ParitySolver.computeTheoreticalMinPieces(6), 12);
  assert.strictEqual(ParitySolver.computeTheoreticalMinPieces(8), 16);
  assert.strictEqual(ParitySolver.computeTheoreticalMinPieces(5), -1);
  assert.throws(() => ParitySolver.computeTheoreticalMinPieces(0));
});

test('constructOptimalSolution and validateBoard for 6x6', () => {
  const board = ParitySolver.constructOptimalSolution(6);
  assert.strictEqual(board.length, 6);
  const status = ParitySolver.validateBoard(board);
  assert.strictEqual(status.isValid, true);
  assert.strictEqual(status.isOptimal, true);
  assert.strictEqual(status.totalPieces, 12);
  assert.strictEqual(status.minPieces, 12);
  assert.deepStrictEqual(status.rowCounts, [2, 2, 2, 2, 2, 2]);
  assert.deepStrictEqual(status.colCounts, [3, 3, 3, 1, 1, 1]);
});

test('constructOptimalSolution and validateBoard for 4x4 and 8x8', () => {
  for (const n of [4, 8]) {
    const board = ParitySolver.constructOptimalSolution(n);
    const status = ParitySolver.validateBoard(board);
    assert.strictEqual(status.isValid, true);
    assert.strictEqual(status.isOptimal, true);
    assert.strictEqual(status.totalPieces, 2 * n);
  }
});

test('validateBoard catches invalid parity rows and cols', () => {
  const emptyBoard = Array.from({ length: 6 }, () => new Array(6).fill(0));
  const emptyStatus = ParitySolver.validateBoard(emptyBoard);
  assert.strictEqual(emptyStatus.isValid, false);
  assert.strictEqual(emptyStatus.allRowsValid, false);
  assert.strictEqual(emptyStatus.allColsValid, false);

  const optimal = ParitySolver.constructOptimalSolution(6);
  optimal[0][0] = 0; // break row 0 and col 0
  const brokenStatus = ParitySolver.validateBoard(optimal);
  assert.strictEqual(brokenStatus.isValid, false);
  assert.strictEqual(brokenStatus.rowValid[0], false); // now 1 piece (odd)
  assert.strictEqual(brokenStatus.colValid[0], false); // now 2 pieces (even)
});

test('findHint provides accurate recommendation', () => {
  const emptyBoard = Array.from({ length: 6 }, () => new Array(6).fill(0));
  const hintAdd = ParitySolver.findHint(emptyBoard);
  assert.strictEqual(hintAdd.action, 'add');

  const optimal = ParitySolver.constructOptimalSolution(6);
  const hintDone = ParitySolver.findHint(optimal);
  assert.strictEqual(hintDone.action, 'complete');
});
