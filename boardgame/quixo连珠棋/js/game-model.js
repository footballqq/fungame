// codex: 2026-09-14 增加CommonJS模块导出支持以配合自动化测试
'use strict';

/**
 * 棋子面的状态枚举
 * BLANK: 空白面朝上
 * CIRCLE: ○ 面朝上
 * CROSS: × 面朝上
 */
const CellState = Object.freeze({
    BLANK: 0,
    CIRCLE: 1,
    CROSS: 2
});

/**
 * 推入方向枚举
 * UP: 从下往上推（列向上滑动）
 * DOWN: 从上往下推（列向下滑动）
 * LEFT: 从右往左推（行向左滑动）
 * RIGHT: 从左往右推（行向右滑动）
 */
const Direction = Object.freeze({
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
});

/**
 * 游戏阶段枚举
 * PICK: 选取阶段 - 玩家选择要取出的棋子
 * PUSH: 推入阶段 - 玩家选择推入方向
 * GAME_OVER: 游戏结束
 */
const GamePhase = Object.freeze({
    PICK: 'pick',
    PUSH: 'push',
    GAME_OVER: 'game_over'
});

/**
 * GameModel - Quixo 游戏数据模型
 * 管理 5x5 棋盘的状态、当前玩家、游戏阶段等
 */
class GameModel {
    constructor() {
        this.size = 5; // 棋盘尺寸 5x5
        this.reset();
    }

    /** 重置棋盘到初始状态 */
    reset() {
        // board[row][col] 存储每个格子的状态
        this.board = Array.from({ length: this.size }, () =>
            Array(this.size).fill(CellState.BLANK)
        );
        this.currentPlayer = CellState.CIRCLE; // ○ 先手
        this.phase = GamePhase.PICK;
        this.selectedPos = null;   // 当前选中的位置 {row, col}
        this.winner = null;        // 胜者
        this.moveHistory = [];     // 移动历史记录
    }

    /** 获取指定位置的状态 */
    getCell(row, col) {
        return this.board[row][col];
    }

    /** 设置指定位置的状态 */
    setCell(row, col, state) {
        this.board[row][col] = state;
    }

    /** 切换当前玩家 */
    switchPlayer() {
        this.currentPlayer = (this.currentPlayer === CellState.CIRCLE)
            ? CellState.CROSS
            : CellState.CIRCLE;
    }

    /** 获取对手的标记 */
    getOpponent(player) {
        return (player === CellState.CIRCLE) ? CellState.CROSS : CellState.CIRCLE;
    }

    /** 深拷贝当前棋盘状态（用于 AI 模拟） */
    cloneBoard() {
        return this.board.map(row => [...row]);
    }

    /** 记录一步移动到历史 */
    recordMove(row, col, direction, player) {
        this.moveHistory.push({
            row, col, direction, player,
            boardSnapshot: this.cloneBoard()
        });
    }

    /** 获取玩家标记的显示文本 */
    static getSymbol(state) {
        switch (state) {
            case CellState.CIRCLE: return '○';
            case CellState.CROSS: return '×';
            default: return '';
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CellState, Direction, GamePhase, GameModel };
}
