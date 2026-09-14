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
 * GameAI - Quixo AI 对手
 * 提供不同难度的 AI：
 * - easy: 随机合法走法
 * - medium: 简单评估 + 浅层搜索
 * - hard: Minimax + Alpha-Beta 剪枝
 */
class GameAI {
    constructor(rules) {
        this.rules = rules; // GameRules 实例
        this.size = rules.size;
    }

    /**
     * 根据难度选择走法
     * @param {number[][]} board - 当前棋盘
     * @param {number} player - AI 的标记
     * @param {string} difficulty - 'easy' | 'medium' | 'hard'
     * @returns {{row, col, direction}} 选择的走法
     */
    getMove(board, player, difficulty = 'medium') {
        switch (difficulty) {
            case 'easy': return this.getRandomMove(board, player);
            case 'medium': return this.getMediumMove(board, player);
            case 'hard': return this.getHardMove(board, player);
            default: return this.getMediumMove(board, player);
        }
    }

    /** 随机合法走法 */
    getRandomMove(board, player) {
        const moves = this.rules.getAllLegalMoves(board, player);
        return moves[Math.floor(Math.random() * moves.length)];
    }

    /** 中等难度：优先级评估（一步前瞻） */
    getMediumMove(board, player) {
        const moves = this.rules.getAllLegalMoves(board, player);
        const opponent = (player === CellState.CIRCLE) ? CellState.CROSS : CellState.CIRCLE;
        let bestScore = -Infinity;
        let bestMoves = [];

        for (const move of moves) {
            const boardCopy = board.map(r => [...r]);
            this.rules.applyMove(boardCopy, move.row, move.col, move.direction, player);

            let score = this.evaluateBoard(boardCopy, player);

            // 检查是否直接获胜
            const result = this.rules.checkWinner(boardCopy, player);
            if (result.winner === player) score = 100000;
            else if (result.winner === opponent) score = -100000; // 自杀

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    /** 困难难度：Minimax + Alpha-Beta（深度3） */
    getHardMove(board, player) {
        const moves = this.rules.getAllLegalMoves(board, player);
        let bestScore = -Infinity;
        let bestMoves = [];
        const depth = 2; // 搜索深度（每层展开较多，2层已足够）

        for (const move of moves) {
            const boardCopy = board.map(r => [...r]);
            this.rules.applyMove(boardCopy, move.row, move.col, move.direction, player);

            // 快速检查是否直接胜利或自杀
            const result = this.rules.checkWinner(boardCopy, player);
            if (result.winner === player) {
                return move; // 必胜走法
            }
            if (result.winner !== null) {
                continue; // 自杀，跳过
            }

            const opponent = (player === CellState.CIRCLE) ? CellState.CROSS : CellState.CIRCLE;
            const score = this.minimax(boardCopy, depth, -Infinity, Infinity, false, player, opponent);

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }

        // 如果所有走法都是自杀（极端情况），随机选一个
        if (bestMoves.length === 0) {
            return this.getRandomMove(board, player);
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    /**
     * Minimax + Alpha-Beta 剪枝
     * @param {boolean} isMaximizing - 是否为最大化层
     * @param {number} aiPlayer - AI 的标记
     * @param {number} humanPlayer - 人类的标记
     */
    minimax(board, depth, alpha, beta, isMaximizing, aiPlayer, humanPlayer) {
        const currentPlayer = isMaximizing ? aiPlayer : humanPlayer;
        const actingPlayer = isMaximizing ? aiPlayer : humanPlayer;

        // 终止条件
        if (depth === 0) {
            return this.evaluateBoard(board, aiPlayer);
        }

        const moves = this.rules.getAllLegalMoves(board, currentPlayer);

        // 限制每层搜索的走法数量以控制时间
        const maxMovesToSearch = 12;
        const sampledMoves = moves.length > maxMovesToSearch
            ? this.sampleMoves(moves, board, currentPlayer, maxMovesToSearch)
            : moves;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of sampledMoves) {
                const boardCopy = board.map(r => [...r]);
                this.rules.applyMove(boardCopy, move.row, move.col, move.direction, currentPlayer);

                const result = this.rules.checkWinner(boardCopy, currentPlayer);
                if (result.winner === aiPlayer) return 50000;
                if (result.winner === humanPlayer) { continue; } // 自杀，跳过

                const evalScore = this.minimax(boardCopy, depth - 1, alpha, beta, false, aiPlayer, humanPlayer);
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval === -Infinity ? -50000 : maxEval;
        } else {
            let minEval = Infinity;
            for (const move of sampledMoves) {
                const boardCopy = board.map(r => [...r]);
                this.rules.applyMove(boardCopy, move.row, move.col, move.direction, currentPlayer);

                const result = this.rules.checkWinner(boardCopy, currentPlayer);
                if (result.winner === humanPlayer) return -50000;
                if (result.winner === aiPlayer) { continue; }

                const evalScore = this.minimax(boardCopy, depth - 1, alpha, beta, true, aiPlayer, humanPlayer);
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval === Infinity ? 50000 : minEval;
        }
    }

    /** 启发式采样：根据快速评估选择最有潜力的走法 */
    sampleMoves(moves, board, player, count) {
        const scored = moves.map(move => {
            const boardCopy = board.map(r => [...r]);
            this.rules.applyMove(boardCopy, move.row, move.col, move.direction, player);
            return { move, score: this.evaluateBoard(boardCopy, player) };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, count).map(s => s.move);
    }

    // ==================== 评估函数 ====================

    /**
     * 棋盘评估函数
     * 评估维度：各行/列/对角线中己方和对方的连子数
     */
    evaluateBoard(board, player) {
        const opponent = (player === CellState.CIRCLE) ? CellState.CROSS : CellState.CIRCLE;
        let score = 0;
        const n = this.size;

        // 收集所有需要评估的线（5行 + 5列 + 2对角线 = 12条）
        const lines = [];

        // 行
        for (let r = 0; r < n; r++) {
            lines.push(board[r].slice());
        }
        // 列
        for (let c = 0; c < n; c++) {
            lines.push(Array.from({ length: n }, (_, r) => board[r][c]));
        }
        // 主对角线
        lines.push(Array.from({ length: n }, (_, i) => board[i][i]));
        // 副对角线
        lines.push(Array.from({ length: n }, (_, i) => board[i][n - 1 - i]));

        for (const line of lines) {
            score += this.evaluateLine(line, player, opponent);
        }

        // 中心控制奖励
        if (board[2][2] === player) score += 5;
        else if (board[2][2] === opponent) score -= 5;

        return score;
    }

    /** 评估单条线的得分 */
    evaluateLine(line, player, opponent) {
        const myCount = line.filter(c => c === player).length;
        const oppCount = line.filter(c => c === opponent).length;
        const blankCount = line.filter(c => c === CellState.BLANK).length;

        // 如果对手有棋子在这条线上，己方无法在此线获胜（反之亦然）
        if (myCount > 0 && oppCount > 0) return 0;

        // 己方得分
        if (myCount > 0) {
            if (myCount === 5) return 10000;
            if (myCount === 4) return 500;
            if (myCount === 3) return 50;
            if (myCount === 2) return 10;
            return 2;
        }

        // 对手得分（负分）
        if (oppCount > 0) {
            if (oppCount === 5) return -10000;
            if (oppCount === 4) return -800; // 防守权重更高
            if (oppCount === 3) return -60;
            if (oppCount === 2) return -12;
            return -3;
        }

        return 0; // 全空白
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameAI };
}
