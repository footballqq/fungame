// codex: 2026-09-14 编写 AI vs AI 完整对局端到端自动模拟测试
import assert from 'node:assert';
import { HexCoord, isTilesConnected } from '../js/hex.js';
import { IceSkatingGame, PLAYER_RED, PLAYER_BLUE } from '../js/game.js';
import { IceSkatingAI } from '../js/ai.js';

console.log('--- 开始端到端 AI vs AI 完整对局模拟 ---');

const game = new IceSkatingGame();
const aiRed = new IceSkatingAI('medium');
const aiBlue = new IceSkatingAI('hard');

let turnCount = 0;
const MAX_TURNS = 40;

while (!game.winner && turnCount < MAX_TURNS) {
  turnCount++;
  const activeAI = game.currentPlayer === PLAYER_RED ? aiRed : aiBlue;
  const pName = game.currentPlayer === PLAYER_RED ? '红方' : '蓝方';

  const action = activeAI.findBestTurn(game);
  assert.ok(action, `${pName} 在第 ${turnCount} 回合应当能规划出有效行动`);

  // 执行滑冰
  game.executeSlide(action.slide.from, action.slide.to, action.slide.directionIndex);

  // 执行取下底座
  game.selectTileToRemove(action.tileRemove);

  // 执行放置底座
  game.executeTilePlacement(action.tilePlace);

  // 严格验证状态不变量
  assert.strictEqual(game.tiles.size, 19, '棋盘底座总数必须始终为 19');
  assert.strictEqual(isTilesConnected(game.tiles), true, '棋盘必须始终保持全连通');
  assert.strictEqual(game.pieces[PLAYER_RED].length, 3, '红方棋子数必须为 3');
  assert.strictEqual(game.pieces[PLAYER_BLUE].length, 3, '蓝方棋子数必须为 3');

  // 确保所有棋子都在当前底座上
  for (const p of [...game.pieces[PLAYER_RED], ...game.pieces[PLAYER_BLUE]]) {
    assert.ok(game.tiles.has(p.key()), `棋子 ${p.key()} 必须位于有效底座上`);
  }

  if (game.winner) {
    const winName = game.winner === PLAYER_RED ? '红方' : '蓝方';
    console.log(`第 ${turnCount} 回合对局分出胜负：${winName} 率先达成铁三角获胜！`);
    break;
  }
}

if (!game.winner) {
  console.log(`模拟达到上限 ${MAX_TURNS} 回合，游戏状态完全健康无任何异常！`);
}

console.log('=== AI 模拟对弈测试 100% 成功！===');
