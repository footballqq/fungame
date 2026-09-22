// codex: 2026-09-22 实现青蛙跳跃UI渲染交互控制、多端触控、动效绑定与弹窗系统
/**
 * 界面交互与动效渲染引擎 (ui.js)
 * 连接游戏逻辑、皮肤、音效、夸奖与演示模块，提供流畅细腻的触控与视觉反馈
 */

class JumpFrogUI {
    constructor() {
        this.gameState = new JumpFrogGameState(3, 3, 'left', true);
        this.skinManager = new SkinManager();
        this.audio = new FrogAudioManager();
        this.praise = new FrogPraiseSystem();
        this.demo = null;
        this.isDemoMode = false;
        this.isAnimating = false;

        this.initElements();
        this.initDemo();
        this.bindEvents();
        this.renderAll();
    }

    initElements() {
        this.elPondSlots = document.getElementById('pondSlots');
        this.elMoveCount = document.getElementById('moveCount');
        this.elStepLimit = document.getElementById('stepLimit');
        this.elOptimalSteps = document.getElementById('optimalSteps');
        this.elMascotText = document.getElementById('mascotText');
        this.elToast = document.getElementById('praiseToast');
        this.elRuleModal = document.getElementById('ruleModal');
        this.elSkinModal = document.getElementById('skinModal');
        this.elSettingsModal = document.getElementById('settingsModal');
        this.elWinModal = document.getElementById('winModal');
        this.elDemoPanel = document.getElementById('demoPanel');
        this.elDemoStatus = document.getElementById('demoStatus');
        this.elDemoExplain = document.getElementById('demoExplain');
        this.btnDemoPlay = document.getElementById('btnDemoPlay');
        this.elAudioBtn = document.getElementById('btnToggleAudio');
    }

    initDemo() {
        this.demo = new JumpFrogDemoController(
            this.gameState,
            (stepInfo) => this.onDemoStep(stepInfo),
            () => this.onDemoFinish()
        );
    }

    bindEvents() {
        // 核心按钮
        document.getElementById('btnUndo').addEventListener('click', () => this.handleUndo());
        document.getElementById('btnReset').addEventListener('click', () => this.handleReset());
        document.getElementById('btnHint').addEventListener('click', () => this.handleHint());
        document.getElementById('btnToggleDemo').addEventListener('click', () => this.toggleDemoMode());
        document.getElementById('btnRules').addEventListener('click', () => this.openModal(this.elRuleModal));
        document.getElementById('btnSkins').addEventListener('click', () => this.openModal(this.elSkinModal));
        document.getElementById('btnSettings').addEventListener('click', () => this.openModal(this.elSettingsModal));
        this.elAudioBtn.addEventListener('click', () => this.handleToggleAudio());

        // 教学演示控制
        this.btnDemoPlay.addEventListener('click', () => this.handleDemoPlayPause());
        document.getElementById('btnDemoPrev').addEventListener('click', () => this.demo.stepBackward());
        document.getElementById('btnDemoNext').addEventListener('click', () => this.demo.stepForward());
        document.getElementById('btnDemoExit').addEventListener('click', () => this.exitDemoMode());
        document.getElementById('demoSpeedSelect').addEventListener('change', (e) => {
            this.demo.setSpeed(parseFloat(e.target.value));
        });

        // 弹窗关闭
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) this.closeModal(modal);
            });
        });

        // 设置面板应用
        document.getElementById('btnApplySettings').addEventListener('click', () => this.handleApplySettings());

        // 胜利弹窗按钮
        document.getElementById('btnWinRestart').addEventListener('click', () => {
            this.closeModal(this.elWinModal);
            this.handleReset();
        });

        // 皮肤选项点击
        document.querySelectorAll('.skin-card').forEach(card => {
            card.addEventListener('click', () => {
                const skinId = card.getAttribute('data-skin');
                this.skinManager.setSkin(skinId);
                document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.renderBoard();
                this.showToast('✨ 已切换为: ' + this.skinManager.getCurrentSkin().name);
            });
        });
    }

    renderAll() {
        this.renderBoard();
        this.updateStats();
    }

    updateStats() {
        this.elMoveCount.textContent = this.gameState.moveCount;
        this.elStepLimit.textContent = this.gameState.getStepLimit();

        // 异步计算理论最优步数（避免阻塞UI）
        setTimeout(() => {
            const path = JumpFrogSolver.solve(
                this.gameState.initialBoard,
                this.gameState.targetBoard,
                this.gameState.allowBackward
            );
            if (path) {
                this.elOptimalSteps.textContent = path.length - 1;
            }
        }, 10);
    }

    renderBoard(highlightFrom = -1, highlightTo = -1) {
        this.elPondSlots.innerHTML = '';
        const board = this.gameState.board;
        const validMoves = this.isDemoMode ? [] : this.gameState.getValidMoves();
        const movableIndices = new Set(validMoves.map(m => m.from));

        board.forEach((item, idx) => {
            const slot = document.createElement('div');
            slot.className = 'pond-slot';
            slot.dataset.index = idx;

            // 荷叶底座
            const leaf = document.createElement('div');
            leaf.className = 'lotus-leaf';
            leaf.innerHTML = `<span class="slot-number">${idx + 1}</span>`;
            slot.appendChild(leaf);

            if (item === EMPTY) {
                slot.classList.add('empty-slot');
                if (highlightTo === idx) {
                    slot.classList.add('target-highlight');
                }
            } else {
                const frogEl = document.createElement('div');
                frogEl.className = 'frog-wrapper';
                if (movableIndices.has(idx)) {
                    frogEl.classList.add('can-move');
                }
                if (highlightFrom === idx) {
                    frogEl.classList.add('hint-highlight');
                }

                frogEl.innerHTML = this.skinManager.getFrogVisual(item);
                frogEl.addEventListener('click', () => this.handleFrogClick(idx));
                slot.appendChild(frogEl);
            }

            this.elPondSlots.appendChild(slot);
        });
    }

    handleFrogClick(fromIdx) {
        if (this.isDemoMode || this.isAnimating) return;

        const toIdx = this.gameState.canMove(fromIdx);
        if (toIdx === null) {
            this.audio.ensureResume();
            this.showMascotSpeech('这只青蛙当前跨不过去哦，试试相邻一格或隔一只蛙跳跃~ 🌱');
            return;
        }

        this.executeMove(fromIdx, toIdx);
    }

    executeMove(fromIdx, toIdx) {
        this.isAnimating = true;
        const moveRecord = this.gameState.makeMove(fromIdx);
        if (!moveRecord) {
            this.isAnimating = false;
            return;
        }

        // 音效
        if (moveRecord.type === 'jump') {
            this.audio.playHop();
            setTimeout(() => this.audio.playPlop(), 180);
        } else {
            this.audio.playPlop();
        }

        // 重新渲染并播放动画
        this.renderBoard(fromIdx, toIdx);
        this.updateStats();

        // 评估激励语
        setTimeout(() => {
            const hintInfo = JumpFrogSolver.getHint(
                this.gameState.board,
                this.gameState.targetBoard,
                this.gameState.allowBackward
            );
            const remainingSteps = hintInfo ? hintInfo.remainingSteps : -1;
            const praise = this.praise.evaluateMove(
                moveRecord,
                remainingSteps,
                moveRecord.isSolved,
                this.gameState.moveCount,
                this.gameState.getStepLimit()
            );

            if (praise) {
                this.showMascotSpeech(praise.text);
                if (praise.type === 'jump' || praise.type === 'combo') {
                    this.showToast(praise.text);
                    this.audio.playCheer();
                }
            }

            if (moveRecord.isSolved) {
                this.handleVictory();
            }

            this.isAnimating = false;
        }, 220);
    }

    handleUndo() {
        if (this.isDemoMode || this.isAnimating) return;
        const lastMove = this.gameState.undo();
        if (lastMove) {
            this.audio.playUndo();
            this.renderAll();
            this.showToast('🍃 已撤销一步');
            this.showMascotSpeech(this.praise.getEncouragement('comfort').text);
        } else {
            this.showToast('已经是开局状态啦~');
        }
    }

    handleReset() {
        if (this.isDemoMode) this.exitDemoMode();
        this.gameState.reset();
        this.praise.reset();
        this.audio.playPlop();
        this.renderAll();
        this.showToast('🔄 棋盘已重置');
        this.showMascotSpeech('新的一局开始！深呼吸，祝你创造最少步数奇迹！✨');
    }

    handleHint() {
        if (this.isDemoMode) return;
        const hint = JumpFrogSolver.getHint(
            this.gameState.board,
            this.gameState.targetBoard,
            this.gameState.allowBackward
        );

        if (!hint) {
            if (this.gameState.isSolved()) {
                this.showToast('🎉 已经达成目标啦！');
            } else {
                this.showMascotSpeech(this.praise.getEncouragement('deadlock').text);
            }
            return;
        }

        this.renderBoard(hint.fromIdx, hint.toIdx);
        this.showMascotSpeech(hint.explanation);
        this.showToast(`💡 推荐移动第 ${hint.fromIdx + 1} 格青蛙`);
        this.audio.playCheer();
    }

    toggleDemoMode() {
        if (this.isDemoMode) {
            this.exitDemoMode();
        } else {
            this.startDemoMode();
        }
    }

    startDemoMode() {
        this.isDemoMode = true;
        this.elDemoPanel.classList.remove('hidden');
        document.getElementById('btnToggleDemo').textContent = '⏹ 退出演示';

        // 重新从开局准备最优路径
        this.gameState.reset();
        this.renderAll();

        const ok = this.demo.prepare(this.gameState.board);
        if (!ok) {
            this.showToast('⚠️ 未能计算出演示路径');
            this.exitDemoMode();
            return;
        }

        this.elDemoStatus.textContent = `准备就绪（共 ${this.demo.path.length - 1} 步）`;
        this.elDemoExplain.textContent = '点击【▶ 播放】或【单步前进】开始观摩大师级走法！';
        this.btnDemoPlay.textContent = '▶ 播放';
        this.showMascotSpeech('欢迎来到教学课堂！看仔细咯，每一步青蛙都在展示数学之美~ 🎓');
    }

    exitDemoMode() {
        this.isDemoMode = false;
        this.demo.stop();
        this.elDemoPanel.classList.add('hidden');
        document.getElementById('btnToggleDemo').textContent = '🎓 自动教学演示';
        this.handleReset();
    }

    handleDemoPlayPause() {
        if (this.demo.isPlaying) {
            this.demo.pause();
            this.btnDemoPlay.textContent = '▶ 继续';
        } else {
            this.demo.play();
            this.btnDemoPlay.textContent = '⏸ 暂停';
        }
    }

    onDemoStep(stepInfo) {
        this.gameState.board = [...stepInfo.board];
        this.gameState.moveCount = stepInfo.stepIndex;
        this.updateStats();

        // 动效与音效
        if (stepInfo.type === 'jump') {
            this.audio.playHop();
        } else if (stepInfo.type === 'slide') {
            this.audio.playPlop();
        }

        this.renderBoard(stepInfo.fromIdx, stepInfo.toIdx);
        this.elDemoStatus.textContent = `第 ${stepInfo.stepIndex} / ${stepInfo.totalSteps} 步`;
        this.elDemoExplain.textContent = stepInfo.explanation;
        this.showMascotSpeech(stepInfo.explanation);
    }

    onDemoFinish() {
        this.btnDemoPlay.textContent = '▶ 重放';
        this.showToast('🎉 演示完成！');
        this.showMascotSpeech('演示结束！看明白这套跳跃走位了吗？点击【退出演示】亲自操练一番吧！🌟');
        this.audio.playVictory();
    }

    handleVictory() {
        this.audio.playVictory();
        const praise = this.praise.getVictoryPraise(this.gameState.moveCount, this.gameState.getStepLimit());

        document.getElementById('winBadge').textContent = praise.badge;
        document.getElementById('winSteps').textContent = this.gameState.moveCount;
        document.getElementById('winStars').textContent = '⭐'.repeat(praise.stars);
        document.getElementById('winText').textContent = praise.text;

        this.triggerConfetti();
        this.openModal(this.elWinModal);
    }

    triggerConfetti() {
        const container = document.getElementById('confettiContainer');
        if (!container) return;
        container.innerHTML = '';
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
        for (let i = 0; i < 48; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 1.5 + 's';
            piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            container.appendChild(piece);
        }
    }

    handleToggleAudio() {
        const enabled = this.audio.toggle();
        this.elAudioBtn.textContent = enabled ? '🔊 音效: 开' : '🔇 音效: 关';
        this.showToast(enabled ? '🔊 音效已开启' : '🔇 音效已静音');
    }

    handleApplySettings() {
        const whiteNum = parseInt(document.getElementById('settingWhiteFrogs').value, 10);
        const blackNum = parseInt(document.getElementById('settingBlackFrogs').value, 10);
        const emptyPos = document.getElementById('settingEmptyPos').value;
        const allowBack = document.getElementById('settingAllowBack').checked;

        this.gameState = new JumpFrogGameState(whiteNum, blackNum, emptyPos, allowBack);
        this.initDemo();
        this.closeModal(this.elSettingsModal);
        this.handleReset();
        this.showToast('⚙️ 游戏设置已更新并重新开局');
    }

    showMascotSpeech(text) {
        if (this.elMascotText) {
            this.elMascotText.textContent = text;
        }
    }

    showToast(msg) {
        if (!this.elToast) return;
        this.elToast.textContent = msg;
        this.elToast.classList.add('show');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            this.elToast.classList.remove('show');
        }, 2400);
    }

    openModal(modalEl) {
        if (modalEl) modalEl.classList.remove('hidden');
    }

    closeModal(modalEl) {
        if (modalEl) modalEl.classList.add('hidden');
    }
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', () => {
    window.jumpFrogGame = new JumpFrogUI();
});
