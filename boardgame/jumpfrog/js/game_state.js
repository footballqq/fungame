// codex: 2026-09-22 实现青蛙跳跃游戏状态管理、单步移动、撤销与胜负判定核心逻辑
/**
 * 青蛙跳跃游戏状态机 (game_state.js)
 * 管理棋盘状态、合法移动检测、历史回退与胜负判定
 */

const EMPTY = '_';
const WHITE = 'W';
const BLACK = 'B';

class JumpFrogGameState {
    constructor(numWhite = 3, numBlack = 3, emptyPos = 'left', allowBackward = true) {
        this.numWhite = numWhite;
        this.numBlack = numBlack;
        this.emptyPos = emptyPos;
        this.allowBackward = allowBackward;
        this.board = [];
        this.history = [];
        this.moveCount = 0;
        this.initialBoard = [];
        this.targetBoard = [];
        this.reset(numWhite, numBlack, emptyPos, allowBackward);
    }

    /**
     * 重置棋盘状态
     */
    reset(numWhite = this.numWhite, numBlack = this.numBlack, emptyPos = this.emptyPos, allowBackward = this.allowBackward) {
        this.numWhite = numWhite;
        this.numBlack = numBlack;
        this.emptyPos = emptyPos;
        this.allowBackward = allowBackward;
        this.history = [];
        this.moveCount = 0;

        const whites = Array(this.numWhite).fill(WHITE);
        const blacks = Array(this.numBlack).fill(BLACK);

        if (emptyPos === 'left') {
            this.board = [EMPTY, ...whites, ...blacks];
            this.targetBoard = [EMPTY, ...blacks, ...whites];
        } else if (emptyPos === 'center') {
            this.board = [...whites, EMPTY, ...blacks];
            this.targetBoard = [...blacks, EMPTY, ...whites];
        } else if (emptyPos === 'right') {
            this.board = [...whites, ...blacks, EMPTY];
            this.targetBoard = [...blacks, ...whites, EMPTY];
        } else {
            this.board = [EMPTY, ...whites, ...blacks];
            this.targetBoard = [EMPTY, ...blacks, ...whites];
        }

        this.initialBoard = [...this.board];
    }

    /**
     * 获取空格索引
     */
    getEmptyIndex(board = this.board) {
        return board.indexOf(EMPTY);
    }

    /**
     * 检查某个位置的青蛙是否能跳到空格
     * 返回目标空格索引，若不能移动则返回 null
     */
    canMove(fromIdx, board = this.board) {
        if (fromIdx < 0 || fromIdx >= board.length) return null;
        const frog = board[fromIdx];
        if (frog === EMPTY) return null;

        const emptyIdx = this.getEmptyIndex(board);
        if (emptyIdx === -1) return null;

        const dist = Math.abs(fromIdx - emptyIdx);
        if (dist !== 1 && dist !== 2) return null;

        // 单向规则限制：白蛙只能向右(从左往右)，黑蛙只能向左(从右往左)
        if (!this.allowBackward) {
            if (frog === WHITE && fromIdx > emptyIdx) return null;
            if (frog === BLACK && fromIdx < emptyIdx) return null;
        }

        return emptyIdx;
    }

    /**
     * 获取指定状态下的所有合法移动
     * 返回列表: [{from: number, to: number, type: 'slide'|'jump'}]
     */
    getValidMoves(board = this.board) {
        const moves = [];
        const emptyIdx = this.getEmptyIndex(board);
        if (emptyIdx === -1) return moves;

        const candidates = [emptyIdx - 2, emptyIdx - 1, emptyIdx + 1, emptyIdx + 2];
        for (const fromIdx of candidates) {
            if (this.canMove(fromIdx, board) !== null) {
                const dist = Math.abs(fromIdx - emptyIdx);
                moves.push({
                    from: fromIdx,
                    to: emptyIdx,
                    type: dist === 1 ? 'slide' : 'jump',
                    frog: board[fromIdx]
                });
            }
        }
        return moves;
    }

    /**
     * 执行移动（传入被点击青蛙的索引）
     * 成功返回移动详情，失败返回 null
     */
    makeMove(fromIdx) {
        const toIdx = this.canMove(fromIdx);
        if (toIdx === null) return null;

        const frog = this.board[fromIdx];
        const dist = Math.abs(fromIdx - toIdx);
        const type = dist === 1 ? 'slide' : 'jump';
        let jumpedFrog = null;
        let jumpedIdx = null;

        if (type === 'jump') {
            jumpedIdx = (fromIdx + toIdx) / 2;
            jumpedFrog = this.board[jumpedIdx];
        }

        // 保存历史记录供撤销
        this.history.push({
            board: [...this.board],
            move: { from: fromIdx, to: toIdx, type, frog, jumpedFrog, jumpedIdx }
        });

        // 执行位置交换
        this.board[toIdx] = frog;
        this.board[fromIdx] = EMPTY;
        this.moveCount++;

        return {
            from: fromIdx,
            to: toIdx,
            type,
            frog,
            jumpedFrog,
            jumpedIdx,
            moveCount: this.moveCount,
            isSolved: this.isSolved()
        };
    }

    /**
     * 撤销上一步
     */
    undo() {
        if (this.history.length === 0) return null;
        const last = this.history.pop();
        this.board = [...last.board];
        this.moveCount = Math.max(0, this.moveCount - 1);
        return last.move;
    }

    /**
     * 判断是否已达成目标
     */
    isSolved(board = this.board) {
        if (board.length !== this.targetBoard.length) return false;
        for (let i = 0; i < board.length; i++) {
            if (board[i] !== this.targetBoard[i]) return false;
        }
        return true;
    }

    /**
     * 获取题目设定的推荐限制步数（3v3原图为20步）
     */
    getStepLimit() {
        if (this.numWhite === 3 && this.numBlack === 3 && this.emptyPos === 'left') {
            return 20;
        }
        // 对于其他规模，以最优步数的 1.3 倍左右作为宽松挑战线
        return Math.max(20, Math.ceil((this.numWhite + 1) * (this.numBlack + 1) * 1.25));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JumpFrogGameState, EMPTY, WHITE, BLACK };
}
