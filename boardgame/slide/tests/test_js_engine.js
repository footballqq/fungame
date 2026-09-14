// codex: 2026-09-14 编写 JS 核心逻辑与 AI 引擎的 Node 单元测试
import assert from 'node:assert';
import { HexCoord, getInitialTilesSet, getInitialPiecesMap, isTilesConnected } from '../js/hex.js';
import { IceSkatingGame, PLAYER_RED, PLAYER_BLUE, STEP_SLIDE, STEP_REMOVE_TILE, STEP_PLACE_TILE } from '../js/game.js';
import { IceSkatingAI } from '../js/ai.js';

console.log('--- 开始测试 JS 核心模块 ---');

// 1. 六边形基础与连通性
const c1 = new HexCoord(0, 0, 0);
const c2 = new HexCoord(1, -1, 0);
const c3 = new HexCoord(1, 0, -1);
assert.strictEqual(c1.distanceTo(c2), 1);
assert.strictEqual(c2.distanceTo(c3), 1);
assert.strictEqual(c3.distanceTo(c1), 1);
assert.strictEqual(c1.isAdjacent(c2), true);

const initialTiles = getInitialTilesSet();
assert.strictEqual(initialTiles.size, 19);
assert.strictEqual(isTilesConnected(initialTiles), true);
console.log('✓ 1. 六边形数学与 19 底座初始化测试通过');

// 2. 游戏状态机与滑冰
const game = new IceSkatingGame();
assert.strictEqual(game.currentPlayer, PLAYER_RED);
assert.strictEqual(game.step, STEP_SLIDE);

const redSlides = game.getAllValidSlides(PLAYER_RED);
assert.ok(redSlides.length > 0, '红方应该有合法滑冰动作');

const slide = redSlides[0];
game.executeSlide(slide.from, slide.to, slide.directionIndex);
assert.strictEqual(game.step, STEP_REMOVE_TILE);
console.log('✓ 2. 冰面滑行测试通过');

// 3. 底座移除与放置
const removables = game.getRemovableTiles();
assert.ok(removables.length > 0, '必须有可移除的最外圈空底座');
const remTile = removables[0];

game.selectTileToRemove(remTile);
assert.strictEqual(game.step, STEP_PLACE_TILE);

const placements = game.getValidPlacements(remTile);
assert.ok(placements.length > 0, '必须有至少2个邻居的合法新位置');

const newTile = placements[0];
game.executeTilePlacement(newTile);
assert.strictEqual(game.step, STEP_SLIDE);
assert.strictEqual(game.currentPlayer, PLAYER_BLUE);
assert.strictEqual(game.tiles.size, 19);
assert.strictEqual(isTilesConnected(game.tiles), true);
console.log('✓ 3. 搬移底座与连通性保持测试通过');

// 4. 悔棋与重做
assert.strictEqual(game.undo(), true);
assert.strictEqual(game.currentPlayer, PLAYER_RED);
assert.strictEqual(game.redo(), true);
assert.strictEqual(game.currentPlayer, PLAYER_BLUE);
console.log('✓ 4. 悔棋与重做测试通过');

// 5. 铁三角胜利判定
const winGame = new IceSkatingGame();
winGame.pieces[PLAYER_RED] = [c1, c2, c3];
assert.strictEqual(winGame.checkPlayerTriangle(PLAYER_RED), true);
assert.strictEqual(winGame.checkWinCondition(), PLAYER_RED);
console.log('✓ 5. 铁三角胜负判定测试通过');

// 6. AI 决策测试 (简单、中等、困难)
const aiEasy = new IceSkatingAI('easy');
const turnEasy = aiEasy.findBestTurn(game);
assert.ok(turnEasy && turnEasy.slide && turnEasy.tileRemove && turnEasy.tilePlace);

const aiMed = new IceSkatingAI('medium');
const turnMed = aiMed.findBestTurn(game);
assert.ok(turnMed && turnMed.slide && turnMed.tileRemove && turnMed.tilePlace);

const aiHard = new IceSkatingAI('hard');
const turnHard = aiHard.findBestTurn(game);
assert.ok(turnHard && turnHard.slide && turnHard.tileRemove && turnHard.tilePlace);
console.log('✓ 6. AI 各难度决策生成测试通过');

console.log('=== 全部 JS 单元测试 100% 通过！===');
