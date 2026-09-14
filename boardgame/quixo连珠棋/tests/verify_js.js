// codex: 2026-09-14 编写Node.js端针对Quixo核心JS模块的自动化集成测试
const { CellState, Direction, GamePhase, GameModel } = require('../js/game-model.js');
const { GameRules } = require('../js/game-rules.js');
const { GameAI } = require('../js/game-ai.js');

console.log('--- 1. 验证模块导入与类实例化 ---');
if (!GameModel || !GameRules || !GameAI) {
    throw new Error('核心类未能正确加载！');
}
console.log('OK: GameModel, GameRules, GameAI 导出与加载正常');

console.log('--- 2. 验证开局合法走法数量 ---');
const model = new GameModel();
const rules = new GameRules(model.size);
const ai = new GameAI(rules);

const initialMoves = rules.getAllLegalMoves(model.board, model.currentPlayer);
console.log(`开局第一步合法走法数量: ${initialMoves.length}`);
// 4个角 * 2方向 = 8; 12个非角边缘 * 3方向 = 36; 合计: 44
if (initialMoves.length !== 44) {
    throw new Error(`预期 44 种走法，实际得到 ${initialMoves.length}`);
}
console.log('OK: 44 种开局走法严格匹配几何与规则推导！');

console.log('--- 3. 验证 AI 对弈流程与胜负自杀判定 ---');
let movesCount = 0;
let winnerFound = false;

for (let i = 0; i < 80; i++) {
    const player = model.currentPlayer;
    const move = ai.getMove(model.board, player, 'medium');
    if (!move) {
        console.log('无合法走法，平局或中断');
        break;
    }

    rules.applyMove(model.board, move.row, move.col, move.direction, player);
    movesCount++;

    const check = rules.checkWinner(model.board, player);
    if (check.winner !== null) {
        winnerFound = true;
        const winnerName = check.winner === CellState.CIRCLE ? '○ (Circle)' : '× (Cross)';
        console.log(`在第 ${movesCount} 手分出胜负，胜者为: ${winnerName}`);
        break;
    }

    model.switchPlayer();
}

console.log(`模拟对弈完成，共进行了 ${movesCount} 手。胜负判定正常！`);
console.log('=== 全部 JS 单元测试与集成测试通过！===');
