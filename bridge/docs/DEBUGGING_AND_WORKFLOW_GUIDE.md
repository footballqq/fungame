# Bridg-It 游戏开发、调试与自动化测试经验指南

> 本文档详细记录了《架桥》（Bridg-It）网页游戏开发过程中的架构设计、图论算法实现、BugFix 踩坑记录、AI 评估状态还原防污染机制。

---

## 1. Bug 7 深度剖析：为何之前 AI 落子线段未在棋盘上显示？

### 1.1 根因分析 (Root Cause)
- 在 `js/ai.js` 的 `_checkImmediateThreat()`、`_evaluateMoveHeuristic()` 及 `_minimax()` 函数评估模拟走法时，使用了 `game.makeMove(oppMove)` 和 `game.undo(1)`。
- `game.makeMove` 与 `game.undo` 会改变全局对象 `game.currentPlayer`（如从 `'red'` 变成 `'blue'`）。
- 评估结束后，`game.currentPlayer` 被污染留在对手回合（如 `'blue'`）。当 `triggerAIMove()` 尝试将 AI 的红边落子提交给 `game.makeMove(aiMove)` 时，`makeMove` 发现当前轮到 `'blue'`，**直接拒绝了红边的合法性并返回 false**！
- 结果：AI 的落子未能写进 `game.history` 也未能渲染出红色线条，棋盘画面上看起来像“线段没有画出来”或“历史记录没有显示”。

### 1.2 解决方案 (Try-Finally State Preservation)
在 `js/ai.js` 的 `getBestMove()` 函数中引入了 `try-finally` 强约束：
```javascript
getBestMove(game) {
    const savedPlayer = game.currentPlayer;
    const savedWinner = game.winner;
    try {
        // AI 模拟评估逻辑...
    } finally {
        // 绝对恢复计算前的游戏回合与胜负状态！
        game.currentPlayer = savedPlayer;
        game.winner = savedWinner;
    }
}
```
保证无论 AI 内部模拟了多少步假设，在向 UI 返回决策前，`game.currentPlayer` 绝对还原到正确的执棋阵营，确保 AI 的落子 100% 成功渲染出线段并写入历史记录。
