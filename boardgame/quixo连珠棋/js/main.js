// codex: 2026-09-14 新增棋盘大小手动调节（滑杆+自动适配+localStorage持久化）与窗口变化时箭头重定位
'use strict';

/** 棋盘格子尺寸的本地存储键（保存用户手动设置的像素值） */
const BOARD_SIZE_STORAGE_KEY = 'quixo-board-cell-size';

/** AI 思考停顿（毫秒）：营造推演节奏 */
const AI_THINK_DELAY_MS = 650;
/** AI 取子高亮展示时长（毫秒）：让玩家看清它从哪里取子 */
const AI_PICK_HOLD_MS = 800;
/** 推入滑动动画时长（毫秒）：与 css .cell.slide-shift 过渡时长匹配 */
const SLIDE_ANIM_MS = 500;

/**
 * QuixoGameController - 控制游戏整体生命周期与用户交互流转
 */
class QuixoGameController {
    constructor() {
        this.model = new GameModel();
        this.rules = new GameRules(this.model.size);
        this.ai = new GameAI(this.rules);
        this.ui = new GameUI();

        this.gameMode = 'pve';          // 'pvp' | 'pve'
        this.aiDifficulty = 'medium';   // 'easy' | 'medium' | 'hard'
        this.humanPlayer = CellState.CIRCLE; // 人机模式中人类玩家所执棋子
        this.isProcessing = false;      // 防止快速连击或 AI 运算期间误操作
        this.resizeTimer = null;        // 窗口变化防抖计时器
        this.moveToken = 0;             // 对局令牌：重新开始后使滞后的 AI/动画回调自动失效

        this.initEvents();
        this.initSizeControl();
        this.startNewGame();
    }

    /** 绑定 DOM 界面事件 */
    initEvents() {
        // 模式切换
        const modeSelect = document.getElementById('gameModeSelect');
        const diffSelect = document.getElementById('aiDifficultySelect');

        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.gameMode = e.target.value;
                if (diffSelect) {
                    diffSelect.style.display = (this.gameMode === 'pve') ? 'inline-block' : 'none';
                }
                this.startNewGame();
            });
        }

        if (diffSelect) {
            diffSelect.addEventListener('change', (e) => {
                this.aiDifficulty = e.target.value;
            });
        }

        // 重新开始按钮
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) restartBtn.addEventListener('click', () => this.startNewGame());

        const modalRestartBtn = document.getElementById('modalRestartBtn');
        if (modalRestartBtn) modalRestartBtn.addEventListener('click', () => {
            this.ui.hideGameOver();
            this.startNewGame();
        });

        // 悔棋按钮
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) undoBtn.addEventListener('click', () => this.handleUndo());

        // 规则弹窗按钮
        const rulesBtn = document.getElementById('rulesBtn');
        if (rulesBtn) rulesBtn.addEventListener('click', () => this.ui.showRules());

        const closeRulesBtn = document.getElementById('closeRulesBtn');
        if (closeRulesBtn) closeRulesBtn.addEventListener('click', () => this.ui.hideRules());

        // 音效开关
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.ui.soundEnabled = !this.ui.soundEnabled;
                soundBtn.textContent = this.ui.soundEnabled ? '🔊 音效: 开' : '🔇 音效: 关';
            });
        }

        // 点击棋盘外区域取消选子。
        // 关键修复：选子会触发 renderBoard 重建棋格，导致被点击的旧棋子元素脱离文档，
        // 冒泡到此处时 e.target 已游离、closest('.board-outer') 必为 null，
        // 若不跳过游离目标，每次选子都会被误判为"外部点击"而立刻取消（游戏无法操作的根因）。
        document.addEventListener('click', (e) => {
            if (QuixoGameController.shouldCancelSelection(e.target, this.model.phase)) {
                this.cancelSelection();
            }
        });

        // 窗口尺寸/方向变化时：推入箭头需按新坐标重新定位（防抖150ms）
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.refreshArrowOverlay();
                // 自动适配模式下，滑杆同步显示当前实际格宽
                if (!this.hasStoredBoardSize()) {
                    this.syncSizeControlUI();
                }
            }, 150);
        });
    }

    // ==================== 棋盘大小调节 ====================

    /** 初始化棋盘大小滑杆与自动适配按钮 */
    initSizeControl() {
        this.sizeRange = document.getElementById('boardSizeRange');
        this.sizeAutoBtn = document.getElementById('boardSizeAutoBtn');
        if (!this.sizeRange) return;

        // 恢复上次手动设置的尺寸
        const saved = this.readStoredBoardSize();
        if (saved) {
            this.applyBoardSize(saved);
        }
        this.syncSizeControlUI();

        this.sizeRange.addEventListener('input', (e) => {
            this.applyBoardSize(parseInt(e.target.value, 10));
        });

        if (this.sizeAutoBtn) {
            this.sizeAutoBtn.addEventListener('click', () => {
                this.applyBoardSize(null); // 清除手动覆盖，恢复CSS流式自动适配
            });
        }
    }

    /** 读取本地存储的手动尺寸；无效或未设置时返回 null */
    readStoredBoardSize() {
        try {
            const saved = parseInt(localStorage.getItem(BOARD_SIZE_STORAGE_KEY), 10);
            return Number.isFinite(saved) && saved >= 40 && saved <= 96 ? saved : null;
        } catch (e) {
            return null; // 隐私模式等场景 localStorage 不可用
        }
    }

    /** 是否存在用户手动保存的棋盘尺寸 */
    hasStoredBoardSize() {
        return this.readStoredBoardSize() !== null;
    }

    /**
     * 应用棋盘尺寸
     * @param {number|null} px - 格子边长像素；null 表示清除手动设置、恢复自动适配
     */
    applyBoardSize(px) {
        if (px) {
            document.documentElement.style.setProperty('--cell-size', `${px}px`);
            try { localStorage.setItem(BOARD_SIZE_STORAGE_KEY, String(px)); } catch (e) { /* 忽略存储异常 */ }
        } else {
            document.documentElement.style.removeProperty('--cell-size');
            try { localStorage.removeItem(BOARD_SIZE_STORAGE_KEY); } catch (e) { /* 忽略存储异常 */ }
        }
        this.refreshArrowOverlay();
        this.syncSizeControlUI();
    }

    /** 滑杆数值与当前实际渲染格宽同步 */
    syncSizeControlUI() {
        if (!this.sizeRange) return;
        const anyCell = document.querySelector('.cell');
        const current = anyCell
            ? Math.round(anyCell.getBoundingClientRect().width)
            : parseInt(this.sizeRange.value, 10);
        if (Number.isFinite(current)) {
            this.sizeRange.value = String(Math.min(96, Math.max(40, current)));
        }
    }

    /** 推入阶段下按最新坐标重绘方向箭头（其他阶段无需处理） */
    refreshArrowOverlay() {
        if (this.model.phase === GamePhase.PUSH && this.model.selectedPos) {
            const dirs = this.rules.getPushDirections(this.model.selectedPos.row, this.model.selectedPos.col);
            this.ui.renderPushArrows(this.model.selectedPos, dirs, (dir) => this.handlePushDirection(dir));
        }
    }

    /**
     * 判定一次点击是否应取消当前选子（静态方法以便单元测试）
     * 仅当点击目标仍真实连接在文档中、且不在棋盘/推入箭头内、且当前处于推入阶段时才取消
     * @param {EventTarget|null} target - 点击目标元素
     * @param {string} phase - 当前游戏阶段
     */
    static shouldCancelSelection(target, phase) {
        if (phase !== GamePhase.PUSH) return false;
        if (!target || typeof target.isConnected !== 'boolean' || !target.isConnected) return false;
        return !target.closest('.board-outer') && !target.closest('.push-btn');
    }

    /** 开始一局新游戏 */
    startNewGame() {
        this.moveToken += 1; // 使尚未触发的 AI/动画结算回调全部失效
        this.model.reset();
        this.isProcessing = false;
        this.ui.hideGameOver();
        this.ui.clearArrows();
        this.updateView();

        // 如果人机模式且人类执 ×，让 AI 先手
        if (this.isAiTurn()) {
            this.triggerAiMove();
        }
    }

    /** 判断当前是否轮到 AI */
    isAiTurn() {
        return this.gameMode === 'pve' &&
               this.model.currentPlayer !== this.humanPlayer &&
               this.model.phase !== GamePhase.GAME_OVER;
    }

    /** 处理棋格点击 */
    handleCellClick(row, col) {
        if (this.isProcessing || this.isAiTurn() || this.model.phase === GamePhase.GAME_OVER) {
            return;
        }

        const currentSelected = this.model.selectedPos;

        // 如果已处于 PUSH 阶段且点击了同一个格子，取消选中
        if (currentSelected && currentSelected.row === row && currentSelected.col === col) {
            this.cancelSelection();
            return;
        }

        // 判断点击的棋子是否可以被拿起
        if (this.rules.canPick(this.model.board, row, col, this.model.currentPlayer)) {
            this.model.selectedPos = { row, col };
            this.model.phase = GamePhase.PUSH;
            this.ui.playPickSound();

            const directions = this.rules.getPushDirections(row, col);
            this.ui.renderBoard(this.model, this.rules, (r, c) => this.handleCellClick(r, c));
            this.ui.renderPushArrows(this.model.selectedPos, directions, (dir) => this.handlePushDirection(dir));
            this.ui.updateStatus(this.model, false);
        }
    }

    /** 取消当前选中的棋子（动画/AI 运算期间禁止取消，避免干扰进行中的演出） */
    cancelSelection() {
        if (this.isProcessing) return;
        this.model.selectedPos = null;
        this.model.phase = GamePhase.PICK;
        this.ui.clearArrows();
        this.updateView();
    }

    /** 处理推入方向点击 */
    handlePushDirection(direction) {
        if (this.isProcessing || !this.model.selectedPos) return;

        const { row, col } = this.model.selectedPos;
        this.executeMove(row, col, direction, this.model.currentPlayer);
    }

    /** 执行移动：先落定规则状态，再以滑动动画呈现，动画结束后结算胜负与回合 */
    executeMove(row, col, direction, player) {
        this.isProcessing = true;
        const token = this.moveToken;
        this.ui.clearArrows();
        this.ui.playPushSound();

        // 记录移动（快照为移动前棋盘，供悔棋使用），随后应用滑动
        this.model.recordMove(row, col, direction, player);
        this.rules.applyMove(this.model.board, row, col, direction, player);
        this.model.selectedPos = null;

        // 按移动后棋盘渲染，并让被推动的棋子平滑滑入、新子翻面入场
        this.ui.renderBoard(this.model, this.rules, (r, c) => this.handleCellClick(r, c));
        this.ui.playSlideAnimation(this.model, { row, col, direction });

        // 动画播完再结算，确保玩家看清全过程
        setTimeout(() => {
            if (token !== this.moveToken) return;
            this.settleMove(player);
        }, SLIDE_ANIM_MS);
    }

    /** 滑动动画结束后的结算：自杀规则判负、回合切换与 AI 接力 */
    settleMove(player) {
        // 检测胜负（严格按照自杀规则）
        const result = this.rules.checkWinner(this.model.board, player);

        if (result.winner !== null) {
            this.model.phase = GamePhase.GAME_OVER;
            this.model.winner = result.winner;
            this.updateView();
            this.ui.highlightWinLine(result.winLine);
            this.ui.playWinSound();

            let reason = '';
            const opp = (player === CellState.CIRCLE) ? CellState.CROSS : CellState.CIRCLE;
            if (result.winner === opp) {
                // 行动方自杀判负
                const actingName = (player === CellState.CIRCLE) ? '玩家 ○' : '玩家 ×';
                reason = `${actingName} 的推入使对手率先/同时达成 5 连，根据规则行动方判负！`;
            }

            setTimeout(() => {
                this.ui.showGameOver(result.winner, reason);
                this.isProcessing = false;
            }, 600);
            return;
        }

        // 切换回合（先复位处理锁再刷新视图，确保悔棋按钮状态同步）
        this.model.switchPlayer();
        this.model.phase = GamePhase.PICK;
        this.isProcessing = false;
        this.updateView();

        // 若接下来是 AI 回合
        if (this.isAiTurn()) {
            this.triggerAiMove();
        }
    }

    /** 触发 AI 行动：思考 → 取子高亮展示 → 推入动画，三阶段放慢便于玩家看清 */
    triggerAiMove() {
        this.isProcessing = true;
        this.ui.updateStatus(this.model, true, 'thinking');
        // AI 回合期间禁用悔棋，避免状态栏与按钮可用性不一致
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) undoBtn.disabled = true;

        const token = this.moveToken;
        // 人性化延时，让玩家看清棋盘变化并感受思考节奏
        setTimeout(() => {
            if (token !== this.moveToken || this.model.phase === GamePhase.GAME_OVER) {
                this.isProcessing = false;
                return;
            }

            const aiPlayer = this.model.currentPlayer;
            const move = this.ai.getMove(this.model.board, aiPlayer, this.aiDifficulty);

            if (!move) {
                this.isProcessing = false;
                return;
            }

            // 阶段一：高亮 AI 取出的棋子并播报，停留一段时间让玩家看清取子位置
            this.model.selectedPos = { row: move.row, col: move.col };
            this.ui.playPickSound();
            this.ui.renderBoard(this.model, this.rules, (r, c) => this.handleCellClick(r, c));
            this.ui.updateStatus(this.model, true, 'picked', move);

            // 阶段二：停留后执行带滑动动画的推入
            setTimeout(() => {
                if (token !== this.moveToken) return;
                this.executeMove(move.row, move.col, move.direction, aiPlayer);
            }, AI_PICK_HOLD_MS);
        }, AI_THINK_DELAY_MS);
    }

    /** 处理悔棋 */
    handleUndo() {
        if (this.isProcessing || this.model.moveHistory.length === 0) return;

        // 如果是人机对战，需要撤销两步回到玩家回合（除非只走了一步）
        let stepsToUndo = (this.gameMode === 'pve' && this.model.moveHistory.length >= 2) ? 2 : 1;

        while (stepsToUndo > 0 && this.model.moveHistory.length > 0) {
            this.model.moveHistory.pop();
            stepsToUndo--;
        }

        if (this.model.moveHistory.length > 0) {
            const lastMove = this.model.moveHistory[this.model.moveHistory.length - 1];
            this.model.board = lastMove.boardSnapshot.map(r => [...r]);
            // 切换到下一步该行动的玩家
            this.model.currentPlayer = (lastMove.player === CellState.CIRCLE)
                ? CellState.CROSS : CellState.CIRCLE;
        } else {
            // 回到初始状态
            this.model.reset();
        }

        this.model.phase = GamePhase.PICK;
        this.model.selectedPos = null;
        this.ui.clearArrows();
        this.ui.hideGameOver();
        this.updateView();
    }

    /** 刷新整个界面视图 */
    updateView() {
        this.ui.renderBoard(this.model, this.rules, (r, c) => this.handleCellClick(r, c));
        this.ui.updateStatus(this.model, this.isAiTurn());

        // 更新悔棋按钮状态
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) undoBtn.disabled = (this.model.moveHistory.length === 0 || this.isProcessing);
    }
}

// 页面加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new QuixoGameController();
});
