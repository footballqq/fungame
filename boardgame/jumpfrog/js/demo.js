// codex: 2026-09-22 实现自动教学演示控制器，支持播放暂停、分步进退、速度调节与实时战术教学解说
/**
 * 自动教学演示控制器 (demo.js)
 * 驱动棋盘按最优策略自动演练，为玩家提供步步清晰的动画与数学原理解析
 */

class JumpFrogDemoController {
    constructor(gameState, onStepCallback, onFinishCallback) {
        this.gameState = gameState;
        this.onStepCallback = onStepCallback;
        this.onFinishCallback = onFinishCallback;
        this.path = [];
        this.currentStepIndex = 0;
        this.isPlaying = false;
        this.timer = null;
        this.intervalMs = 1200; // 默认每步间隔1.2秒
    }

    /**
     * 准备教学路径
     * @param {Array} fromBoard 起始棋盘（默认当前棋盘）
     */
    prepare(fromBoard = this.gameState.initialBoard) {
        this.stop();
        this.path = JumpFrogSolver.solve(
            fromBoard,
            this.gameState.targetBoard,
            this.gameState.allowBackward
        );
        this.currentStepIndex = 0;
        return this.path !== null;
    }

    /**
     * 设置播放速度倍率
     */
    setSpeed(speedMultiplier) {
        // speed: 0.5x, 1x, 1.5x, 2x
        const base = 1200;
        this.intervalMs = Math.max(300, Math.floor(base / speedMultiplier));
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
    }

    /**
     * 开始或继续播放
     */
    play() {
        if (!this.path || this.path.length <= 1) return;
        if (this.currentStepIndex >= this.path.length - 1) {
            this.currentStepIndex = 0;
        }

        this.isPlaying = true;
        this.scheduleNextStep();
    }

    scheduleNextStep() {
        if (!this.isPlaying) return;
        this.clearTimer();

        this.timer = setTimeout(() => {
            if (!this.isPlaying) return;
            const hasMore = this.stepForward();
            if (hasMore) {
                this.scheduleNextStep();
            } else {
                this.isPlaying = false;
                if (this.onFinishCallback) this.onFinishCallback();
            }
        }, this.intervalMs);
    }

    /**
     * 单步前进
     */
    stepForward() {
        if (!this.path || this.currentStepIndex >= this.path.length - 1) {
            return false;
        }

        const prevBoard = this.path[this.currentStepIndex];
        this.currentStepIndex++;
        const currBoard = this.path[this.currentStepIndex];

        // 计算这一步的移动信息
        const emptyPrev = prevBoard.indexOf(EMPTY);
        const emptyCurr = currBoard.indexOf(EMPTY);
        const fromIdx = emptyCurr;
        const toIdx = emptyPrev;
        const frog = prevBoard[fromIdx];
        const dist = Math.abs(fromIdx - toIdx);

        const explanation = JumpFrogSolver.explainMove(prevBoard, fromIdx, toIdx);

        if (this.onStepCallback) {
            this.onStepCallback({
                board: currBoard,
                stepIndex: this.currentStepIndex,
                totalSteps: this.path.length - 1,
                fromIdx,
                toIdx,
                frog,
                type: dist === 1 ? 'slide' : 'jump',
                explanation
            });
        }

        return this.currentStepIndex < this.path.length - 1;
    }

    /**
     * 单步后退
     */
    stepBackward() {
        if (!this.path || this.currentStepIndex <= 0) {
            return false;
        }

        this.pause();
        this.currentStepIndex--;
        const currBoard = this.path[this.currentStepIndex];

        let explanation = '回到上一步棋盘状态';
        let fromIdx = -1, toIdx = -1;

        if (this.currentStepIndex < this.path.length - 1) {
            const nextBoard = this.path[this.currentStepIndex + 1];
            explanation = JumpFrogSolver.explainMove(currBoard, nextBoard.indexOf(EMPTY), currBoard.indexOf(EMPTY));
        }

        if (this.onStepCallback) {
            this.onStepCallback({
                board: currBoard,
                stepIndex: this.currentStepIndex,
                totalSteps: this.path.length - 1,
                fromIdx,
                toIdx,
                frog: null,
                type: 'backward',
                explanation
            });
        }

        return true;
    }

    /**
     * 暂停播放
     */
    pause() {
        this.isPlaying = false;
        this.clearTimer();
    }

    /**
     * 停止并重置
     */
    stop() {
        this.pause();
        this.currentStepIndex = 0;
    }

    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JumpFrogDemoController };
}
