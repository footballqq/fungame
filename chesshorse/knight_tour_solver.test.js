// codex: 2026-02-13 新增 Node 单测：覆盖 chesshorse Knight's Tour 求解器的有解/无解与合法性校验
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findKnightTourPath,
  isValidKnightTourPath,
} = require("./knight_tour_solver.js");

test("4x4 无解", () => {
  const path = findKnightTourPath({ boardSize: 4, pathPrefix: [0], maxTimeMs: 200 });
  assert.equal(path, null);
});

test("5x5 可求得一条合法路径", () => {
  const path = findKnightTourPath({
    boardSize: 5,
    pathPrefix: [0],
    maxTimeMs: 1500,
    randomSeed: 123,
  });
  assert.ok(path, "expected a path for 5x5");
  assert.equal(path.length, 25);
  assert.ok(isValidKnightTourPath(5, path));
});

test("8x8 可求得一条合法路径", () => {
  const path = findKnightTourPath({
    boardSize: 8,
    pathPrefix: [0],
    maxTimeMs: 2000,
    randomSeed: 456,
  });
  assert.ok(path, "expected a path for 8x8");
  assert.equal(path.length, 64);
  assert.ok(isValidKnightTourPath(8, path));
});

