// codex: 2026-09-14 修复浏览器加载致命bug：原 var { CellState } 声明提升后与 game-model.js 的全局 const 冲突，导致整个脚本 SyntaxError 失效
'use strict';

// 仅在 Node/CommonJS 测试环境下导入依赖（浏览器中由 game-model.js 以 script 标签先加载提供全局常量）。
// 注意：浏览器全局作用域内禁止使用 var 声明 CellState/Direction，否则与全局 const 冲突使本文件整体解析失败。
if (typeof require !== 'undefined' && typeof CellState === 'undefined') {
    const gameModelModule = require('./game-model.js');
    globalThis.CellState = gameModelModule.CellState;
    globalThis.Direction = gameModelModule.Direction;
}

/**
 * GameRules - 规则引擎
 * 负责所有游戏规则逻辑：外围判定、取子/推入合法性、棋盘滑动、胜负检测
 */
class GameRules {
    constructor(size = 5) {
        this.size = size;
    }

    // ==================== 位置判定 ====================

    /** 判断位置是否在棋盘外围（16个边缘格子） */
    isEdge(row, col) {
        return row === 0 || row === this.size - 1 ||
               col === 0 || col === this.size - 1;
    }

    /** 判断位置是否为四角之一 */
    isCorner(row, col) {
        return (row === 0 || row === this.size - 1) &&
               (col === 0 || col === this.size - 1);
    }

    // ==================== 取子规则 ====================

    /**
     * 判断某位置的棋子是否可被当前玩家取出
     * 条件：1) 在外围  2) 空白或属于当前玩家
     */
    canPick(board, row, col, currentPlayer) {
        if (!this.isEdge(row, col)) return false;
        const cell = board[row][col];
        return cell === CellState.BLANK || cell === currentPlayer;
    }

    /** 获取当前玩家所有可取的棋子位置列表 */
    getPickablePositions(board, currentPlayer) {
        const positions = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.canPick(board, r, c, currentPlayer)) {
                    positions.push({ row: r, col: c });
                }
            }
        }
        return positions;
    }

    // ==================== 推入方向规则 ====================

    /**
     * 获取从指定位置取子后的合法推入方向
     * 角位：2种方向（沿两条边）
     * 边位：3种方向（对面+垂直两端），但不能原位放回
     */
    getPushDirections(row, col) {
        const directions = [];
        const last = this.size - 1;

        // 从哪条边取出的，就不能从同一端推回（即不能原位放回）
        // 上边缘(row=0): 不能从上方推入(DOWN方向的起点就是row=0)
        // 下边缘(row=last): 不能从下方推入
        // 左边缘(col=0): 不能从左方推入
        // 右边缘(col=last): 不能从右方推入

        // 可以从上方推入（棋子放在 row=0，列向下推）
        if (row !== 0) directions.push(Direction.DOWN);
        // 可以从下方推入（棋子放在 row=last，列向上推）
        if (row !== last) directions.push(Direction.UP);
        // 可以从左方推入（棋子放在 col=0，行向右推）
        if (col !== 0) directions.push(Direction.RIGHT);
        // 可以从右方推入（棋子放在 col=last，行向左推）
        if (col !== last) directions.push(Direction.LEFT);

        return directions;
    }

    /**
     * 获取推入方向对应的插入位置（棋子将被放置的位置）
     * 以及需要滑动的格子序列
     */
    getSlideInfo(row, col, direction) {
        const last = this.size - 1;
        let insertPos;      // 棋子插入的位置
        let slideCells = []; // 需要滑动的格子（按滑动顺序）

        switch (direction) {
            case Direction.DOWN:
                // 从上方推入：棋子放在(0, col)，原col列的棋子向下滑
                insertPos = { row: 0, col: col };
                for (let r = 0; r <= row; r++) {
                    slideCells.push({ row: r, col: col });
                }
                break;
            case Direction.UP:
                // 从下方推入：棋子放在(last, col)，原col列的棋子向上滑
                insertPos = { row: last, col: col };
                for (let r = last; r >= row; r--) {
                    slideCells.push({ row: r, col: col });
                }
                break;
            case Direction.RIGHT:
                // 从左方推入：棋子放在(row, 0)，原row行的棋子向右滑
                insertPos = { row: row, col: 0 };
                for (let c = 0; c <= col; c++) {
                    slideCells.push({ row: row, col: c });
                }
                break;
            case Direction.LEFT:
                // 从右方推入：棋子放在(row, last)，原row行的棋子向左滑
                insertPos = { row: row, col: last };
                for (let c = last; c >= col; c--) {
                    slideCells.push({ row: row, col: c });
                }
                break;
        }
        return { insertPos, slideCells };
    }

    // ==================== 执行移动 ====================

    /**
     * 在棋盘上执行一步完整移动（取子 + 推入）
     * @param {number[][]} board - 棋盘状态（会被修改）
     * @param {number} pickRow - 取子行
     * @param {number} pickCol - 取子列
     * @param {string} direction - 推入方向
     * @param {number} player - 当前玩家
     * @returns {number[][]} 修改后的棋盘
     */
    applyMove(board, pickRow, pickCol, direction, player) {
        const { insertPos, slideCells } = this.getSlideInfo(pickRow, pickCol, direction);

        // 执行滑动：从取子位置开始，依次向空位滑动
        // slideCells 的第一个元素是插入位置，最后一个是取子位置
        // 我们需要把取子位置的棋子移除，其余向取子方向滑动
        // 然后在插入位置放入玩家的棋子

        // 实际操作：取出 pickRow,pickCol 的棋子后，
        // 该行/列的其余棋子向取子位置方向填充，
        // 空出插入位置，放入玩家棋子

        switch (direction) {
            case Direction.DOWN:
                // 列向下滑：从pickRow开始向上取值填充
                for (let r = pickRow; r > 0; r--) {
                    board[r][pickCol] = board[r - 1][pickCol];
                }
                board[0][pickCol] = player;
                break;
            case Direction.UP:
                // 列向上滑：从pickRow开始向下取值填充
                for (let r = pickRow; r < this.size - 1; r++) {
                    board[r][pickCol] = board[r + 1][pickCol];
                }
                board[this.size - 1][pickCol] = player;
                break;
            case Direction.RIGHT:
                // 行向右滑：从pickCol开始向左取值填充
                for (let c = pickCol; c > 0; c--) {
                    board[pickRow][c] = board[pickRow][c - 1];
                }
                board[pickRow][0] = player;
                break;
            case Direction.LEFT:
                // 行向左滑：从pickCol开始向右取值填充
                for (let c = pickCol; c < this.size - 1; c++) {
                    board[pickRow][c] = board[pickRow][c + 1];
                }
                board[pickRow][this.size - 1] = player;
                break;
        }

        return board;
    }

    // ==================== 胜负判定 ====================

    /**
     * 检测指定玩家是否达成五连
     * @returns {Object|null} 如果达成五连，返回连线信息 {cells: [{row,col},...]}
     */
    checkFiveInRow(board, player) {
        const n = this.size;

        // 检查每一行
        for (let r = 0; r < n; r++) {
            if (board[r].every(cell => cell === player)) {
                return { cells: board[r].map((_, c) => ({ row: r, col: c })) };
            }
        }

        // 检查每一列
        for (let c = 0; c < n; c++) {
            let allMatch = true;
            for (let r = 0; r < n; r++) {
                if (board[r][c] !== player) { allMatch = false; break; }
            }
            if (allMatch) {
                return { cells: Array.from({ length: n }, (_, r) => ({ row: r, col: c })) };
            }
        }

        // 检查主对角线 (左上→右下)
        let mainDiag = true;
        for (let i = 0; i < n; i++) {
            if (board[i][i] !== player) { mainDiag = false; break; }
        }
        if (mainDiag) {
            return { cells: Array.from({ length: n }, (_, i) => ({ row: i, col: i })) };
        }

        // 检查副对角线 (右上→左下)
        let antiDiag = true;
        for (let i = 0; i < n; i++) {
            if (board[i][n - 1 - i] !== player) { antiDiag = false; break; }
        }
        if (antiDiag) {
            return { cells: Array.from({ length: n }, (_, i) => ({ row: i, col: n - 1 - i })) };
        }

        return null;
    }

    /**
     * 综合判定推入后的胜负结果
     * @param {number[][]} board - 推入后的棋盘
     * @param {number} actingPlayer - 行动方
     * @returns {Object} { winner: CellState|null, winLine: {cells}|null }
     * 
     * 自杀规则：
     * - 行动方连5且对手未连5 → 行动方胜
     * - 对手连5且行动方未连5 → 行动方负（对手胜）
     * - 双方同时连5 → 行动方负（对手胜）
     */
    checkWinner(board, actingPlayer) {
        const opponent = (actingPlayer === CellState.CIRCLE)
            ? CellState.CROSS : CellState.CIRCLE;

        const actingWin = this.checkFiveInRow(board, actingPlayer);
        const opponentWin = this.checkFiveInRow(board, opponent);

        if (actingWin && !opponentWin) {
            return { winner: actingPlayer, winLine: actingWin };
        }
        if (opponentWin) {
            // 对手连5（无论行动方是否也连5）→ 行动方负
            return { winner: opponent, winLine: opponentWin };
        }
        return { winner: null, winLine: null };
    }

    // ==================== 合法走法生成 ====================

    /**
     * 生成当前玩家的所有合法走法
     * @returns {Array<{row, col, direction}>}
     */
    getAllLegalMoves(board, currentPlayer) {
        const moves = [];
        const pickable = this.getPickablePositions(board, currentPlayer);

        for (const pos of pickable) {
            const directions = this.getPushDirections(pos.row, pos.col);
            for (const dir of directions) {
                moves.push({ row: pos.row, col: pos.col, direction: dir });
            }
        }
        return moves;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameRules };
}
