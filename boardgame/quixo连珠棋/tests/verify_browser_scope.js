// codex: 2026-09-14 新增浏览器全局作用域回归测试：复现"var与全局const冲突致脚本整体失效"的致命bug场景
/**
 * 模拟浏览器 <script> 标签行为：所有 JS 文件共享同一个全局作用域，依次求值。
 * 历史 bug：game-rules.js / game-ai.js 顶层 `var { CellState }` 声明提升后，
 * 与 game-model.js 已声明的全局 const CellState 冲突，抛出
 * "SyntaxError: Identifier 'CellState' has already been declared"，
 * 导致整个脚本加载失败、游戏无法初始化（Node CommonJS 测试因函数作用域隔离无法发现）。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const jsDir = path.join(__dirname, '..', 'js');
const scriptFiles = [
    'game-model.js',
    'game-rules.js',
    'game-ai.js',
    'game-ui.js',
    'main.js',
];

// 模拟浏览器最小全局对象：window 用于 main.js 顶层注册 DOMContentLoaded 监听
const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    window: { addEventListener() {}, },
    document: undefined,
});

console.log('--- 1. 模拟浏览器共享全局作用域，依次加载全部脚本 ---');
for (const file of scriptFiles) {
    const source = fs.readFileSync(path.join(jsDir, file), 'utf8');
    try {
        vm.runInContext(source, context, { filename: file });
    } catch (e) {
        throw new Error(`脚本 ${file} 在浏览器全局作用域下加载失败（真实浏览器中该文件整体失效）: ${e.message}`);
    }
}
console.log('OK: 全部 5 个脚本在共享全局作用域下均成功加载，无 var/const 冲突');

console.log('--- 2. 验证全部核心类在"浏览器全局"中可见 ---');
const classCheck = vm.runInContext(`
    ['GameModel', 'GameRules', 'GameAI', 'GameUI', 'QuixoGameController']
        .map(name => name + '=' + typeof eval(name)).join(', ')
`, context);
console.log('类定义检查:', classCheck);
for (const cls of ['GameModel', 'GameRules', 'GameAI', 'GameUI', 'QuixoGameController']) {
    const t = vm.runInContext(`typeof ${cls}`, context);
    if (t !== 'function') {
        throw new Error(`类 ${cls} 未在浏览器全局作用域中定义（实际为 ${t}），游戏将无法初始化`);
    }
}
console.log('OK: GameModel / GameRules / GameAI / GameUI / QuixoGameController 全部可见');

console.log('--- 3. 验证全局常量与规则引擎可实际运转 ---');
const legalMoves = vm.runInContext(`
    (() => {
        const model = new GameModel();
        const rules = new GameRules(model.size);
        return rules.getAllLegalMoves(model.board, model.currentPlayer).length;
    })()
`, context);
if (legalMoves !== 44) {
    throw new Error(`预期开局 44 种合法走法，实际 ${legalMoves}`);
}
console.log('OK: 开局 44 种合法走法严格匹配，规则引擎在浏览器作用域下运转正常');

console.log('--- 4. 验证"外部点击取消选子"判定（游离目标回归测试） ---');
// 历史bug：选子后 renderBoard 重建棋格使被点棋子脱离文档，其 click 冒泡到 document 时
// closest('.board-outer') 恒为 null，被误判为外部点击导致选子瞬间被取消、点击完全失效。
const shouldCancel = vm.runInContext('QuixoGameController.shouldCancelSelection', context);

// 模拟重渲染后已脱离文档的旧棋子目标（isConnected=false）
const detachedCell = { isConnected: false, closest: () => null };
if (shouldCancel(detachedCell, 'push') !== false) {
    throw new Error('游离目标不应触发取消选子（对应点击完全失效的历史bug）');
}

// 模拟真实的棋盘外部点击（已连接、不在棋盘内）→ 应取消
const outsideClick = { isConnected: true, closest: () => null };
if (shouldCancel(outsideClick, 'push') !== true) {
    throw new Error('棋盘外部的有效点击应取消选子');
}

// 模拟点击棋盘内部 → 不应取消
const insideBoardClick = {
    isConnected: true,
    closest: (sel) => (sel === '.board-outer' ? { fake: true } : null),
};
if (shouldCancel(insideBoardClick, 'push') !== false) {
    throw new Error('棋盘内部点击不应触发取消');
}

// 非推入阶段的任何点击都不应取消
if (shouldCancel(outsideClick, 'pick') !== false) {
    throw new Error('非推入阶段不应触发取消');
}
console.log('OK: 游离目标跳过、外部点击取消、内部点击保留、阶段判定全部正确');

console.log('=== 浏览器作用域回归测试全部通过！ ===');
