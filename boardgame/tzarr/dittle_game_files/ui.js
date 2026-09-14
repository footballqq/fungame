// codex: 2026-09-14 骰子视觉拆分至 dice_view.js 修正顶面映射；新增 gameSeq/aiTimer 竞态守卫防跨局走子
class DittleUI {
    constructor() {
        this.engine = new DittleEngine('battle');
        this.ai = new DittleAI('medium');
        this.clock = new ChessClock();
        this.animator = new DittleAnimator(this);
        this.logger = new DittleLogger(this);
        this.diceView = new DittleDiceView(); // 骰子三面视觉渲染（顶面映射修正后的独立模块）

        this.gameMode = 'battle'; // 'battle' or 'clash'
        this.opponentType = 'ai'; // 'ai' or 'human'
        this.aiColor = 'black'; // AI plays black by default
        this.selectedCoord = null;
        this.legalMoves = [];
        this.currentScale = 1.0;
        this.is3DView = true;
        this.isBlackFlipped = false;
        this.isAiThinking = false;
        this.isAnimating = false;
        this.gameSeq = 0;    // 对局序号令牌：开新局后使滞后的 AI/动画回调自动失效
        this.aiTimer = null; // AI 思考 setTimeout 句柄，开新局时清除防跨局走子

        this.initDOM();
        this.setupClockCallbacks();
        this.bindEvents();
        this.updateBoardTransform();
    }

    initDOM() {
        this.boardGrid = document.getElementById('boardGrid');
        this.boardWrapper = document.getElementById('boardWrapper');
        this.toastBanner = document.getElementById('toastBanner');
        this.toastText = document.getElementById('toastText');
        this.whiteClockEl = document.getElementById('whiteClock');
        this.blackClockEl = document.getElementById('blackClock');
        this.whitePlayerBar = document.getElementById('whitePlayerBar');
        this.blackPlayerBar = document.getElementById('blackPlayerBar');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.modeBadge = document.getElementById('modeBadge');
        this.zoomValEl = document.getElementById('zoomVal');
        this.stageContainer = document.getElementById('stageContainer');
        this.settingsModal = document.getElementById('settingsModal');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.viewModeBtn = document.getElementById('viewModeBtn');
        this.reviewBanner = document.getElementById('gameOverReviewBanner');
        this.reviewReasonText = document.getElementById('reviewReasonText');
    }

    setupClockCallbacks() {
        this.clock.onTick = (state) => {
            this.whiteClockEl.textContent = state.whiteFormatted;
            this.blackClockEl.textContent = state.blackFormatted;
            this.whitePlayerBar.querySelector('.clock-card')?.classList.toggle('low-time', state.whiteLow);
            this.blackPlayerBar.querySelector('.clock-card')?.classList.toggle('low-time', state.blackLow);
        };
        this.clock.onLowTime = () => window.soundManager.playWarning();
        this.clock.onTimeout = (player) => {
            window.soundManager.playWarning();
            const winner = player === 'white' ? 'black' : 'white';
            this.handleGameOver(winner, `${player === 'white' ? '白方' : '黑方'}思考时间耗尽，超时判负！`);
        };
    }

    bindEvents() {
        const clickMap = {
            zoomInBtn: () => this.setZoom(this.currentScale + 0.15),
            zoomOutBtn: () => this.setZoom(this.currentScale - 0.15),
            zoomResetBtn: () => this.setZoom(1.0),
            fullscreenBtn: () => this.toggleFullscreen(),
            flipBlackBtn: () => this.toggleBlackFlip(),
            openSettingsBtn: () => this.openSettingsModal(),
            closeSettingsBtn: () => this.closeSettingsModal(),
            saveSettingsBtn: () => this.saveSettings(),
            playAgainBtn: () => { this.closeGameOverModal(); this.startNewGame(); },
            reviewBoardBtn: () => { this.closeGameOverModal(); this.showReviewBanner(); },
            closeGameOverModalBtn: () => { this.closeGameOverModal(); this.showReviewBanner(); },
            reopenModalBtn: () => this.gameOverModal.classList.add('open'),
            bannerNewGameBtn: () => this.startNewGame(),
            viewModeBtn: () => this.toggle3DView()
        };
        for (const [id, fn] of Object.entries(clickMap)) {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        }

        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.onclick = () => {
                const enabled = window.soundManager.toggleSound();
                soundBtn.classList.toggle('active', enabled);
                soundBtn.textContent = enabled ? '🔊 音效' : '🔇 静音';
                this.showToast(enabled ? '走棋音效已开启 🔊' : '走棋音效已静音 🔇', 'info');
                const ms = document.getElementById('modalSoundBtn');
                if (ms) { ms.classList.toggle('active', enabled); ms.textContent = enabled ? '🔊 走棋音效: 开启' : '🔊 走棋音效: 关闭'; }
            };
        }

        const musicBtn = document.getElementById('musicToggleBtn');
        if (musicBtn) {
            musicBtn.onclick = () => {
                const enabled = window.soundManager.toggleMusic();
                musicBtn.classList.toggle('active', enabled);
                musicBtn.textContent = enabled ? '🎵 音乐:开' : '🔇 音乐:关';
                this.showToast(enabled ? '背景音乐已开启 🎵' : '背景音乐已静音 🔇', 'info');
                const mm = document.getElementById('modalMusicBtn');
                if (mm) { mm.classList.toggle('active', enabled); mm.textContent = enabled ? '🎵 背景音乐: 开启' : '🎵 背景音乐: 关闭'; }
            };
        }
        document.getElementById('modalSoundBtn')?.addEventListener('click', () => soundBtn && soundBtn.click());
        document.getElementById('modalMusicBtn')?.addEventListener('click', () => musicBtn && musicBtn.click());

        this.setupModalOptionButtons();
    }

    updateBoardTransform() {
        if (this.is3DView) {
            this.boardWrapper.style.transform = `scale(${this.currentScale}) perspective(1100px) rotateX(19deg) rotateZ(-1.2deg)`;
            this.boardWrapper.classList.add('view-3d');
        } else {
            this.boardWrapper.style.transform = `scale(${this.currentScale})`;
            this.boardWrapper.classList.remove('view-3d');
        }
    }

    toggle3DView() {
        this.is3DView = !this.is3DView;
        if (this.viewModeBtn) {
            this.viewModeBtn.innerHTML = this.is3DView ? '<span>📐 3D视角</span>' : '<span>📄 2D视角</span>';
        }
        this.updateBoardTransform();
        this.showToast(this.is3DView ? '已开启 3D 立体斜视角（清晰看见三个面）' : '已切换为 2D 俯视视角', 'info');
    }

    setZoom(val) {
        this.currentScale = Math.max(0.7, Math.min(1.8, Math.round(val * 100) / 100));
        this.updateBoardTransform();
        this.zoomValEl.textContent = `${Math.round(this.currentScale * 100)}%`;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    toggleBlackFlip() {
        this.isBlackFlipped = !this.isBlackFlipped;
        this.blackPlayerBar.classList.toggle('flipped', this.isBlackFlipped);
        this.showToast(this.isBlackFlipped ? '黑方视角已翻转180°（面对面模式）' : '黑方视角已复原', 'info');
    }

    showToast(msg, type = 'danger') {
        this.toastText.textContent = msg;
        this.toastBanner.className = `toast-banner show ${type}`;
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => this.toastBanner.classList.remove('show'), 2600);
    }

    renderBoard() {
        this.boardGrid.innerHTML = '';
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                if (r === 0) cellEl.classList.add('black-base');
                if (r === 6) cellEl.classList.add('white-base');
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                if (this.selectedCoord) {
                    const matchMove = this.legalMoves.find(m => m.to[0] === r && m.to[1] === c);
                    if (matchMove) {
                        if (matchMove.type === 'tilt') cellEl.classList.add('highlight-tilt');
                        else if (matchMove.type === 'jump') cellEl.classList.add('highlight-jump');
                        else if (matchMove.type === 'tilt_jump') cellEl.classList.add('highlight-tilt-jump');
                    }
                }

                const die = this.engine.board[r][c];
                if (die) {
                    const dieEl = this.diceView.createDieElement(die, r, c);
                    if (this.selectedCoord && this.selectedCoord[0] === r && this.selectedCoord[1] === c) {
                        dieEl.classList.add('selected');
                    }
                    cellEl.appendChild(dieEl);
                }

                cellEl.onclick = () => this.handleCellClick(r, c);
                this.boardGrid.appendChild(cellEl);
            }
        }
        if (this.animator) this.animator.applyLastMoveHighlights();
    }

    // animator 经由 UI 转发调用骰子视觉模块（落点即时呈现翻滚后的新三面点数）
    updateDieContent(dieEl, die) {
        if (this.diceView) this.diceView.updateDieContent(dieEl, die);
    }

    handleCellClick(r, c) {
        if (this.engine.gameOver || this.isAiThinking || this.isAnimating) return;
        if (this.opponentType === 'ai' && this.engine.turn === this.aiColor) return;

        const clickedDie = this.engine.board[r][c];
        if (clickedDie && clickedDie.color === this.engine.turn) {
            if (this.selectedCoord && this.selectedCoord[0] === r && this.selectedCoord[1] === c) {
                this.selectedCoord = null;
                this.legalMoves = [];
                window.soundManager.playDeselect();
                this.renderBoard();
                return;
            }
            this.selectedCoord = [r, c];
            this.legalMoves = this.engine.getLegalMovesForDie(r, c);
            window.soundManager.playSelect();
            this.renderBoard();
            return;
        }

        if (this.selectedCoord) {
            const [fr, fc] = this.selectedCoord;
            const validation = this.engine.validateMoveAttempt(fr, fc, r, c);
            if (validation.valid) {
                this.executeMove(validation.move);
            } else {
                window.soundManager.playIllegal();
                this.showToast(validation.reason, 'danger');
            }
        }
    }

    executeMove(move) {
        if (this.engine.gameOver) return;
        const seqAtStart = this.gameSeq;
        const [fr, fc] = move.from;
        const beforeDie = this.engine.board[fr][fc] ? this.engine.board[fr][fc].clone() : null;
        this.selectedCoord = null;
        this.legalMoves = [];
        this.renderBoard();

        this.animator.animateMove(move, () => {
            // 开新局或超时终局后，滞后的动画完成回调直接作废
            if (seqAtStart !== this.gameSeq || this.engine.gameOver) return;
            const moveRecord = this.engine.makeMove(move);
            const resultingDie = move.resultingDie ? move.resultingDie.clone() : (beforeDie ? beforeDie.clone() : null);

            if (this.logger && beforeDie && resultingDie) {
                this.logger.logMove(move, beforeDie, resultingDie, moveRecord?.clashResult);
            }

            if (moveRecord && moveRecord.clashResult) {
                window.soundManager.playClash();
                const cr = moveRecord.clashResult;
                if (cr.outcome === 'win') {
                    this.showToast(`碰撞胜利！移动骰子点数(${cr.movingDieVal})击败对手(${cr.oppDiceSum})，消灭对手棋子！`, 'success');
                } else if (cr.outcome === 'loss') {
                    this.showToast(`碰撞阵亡！移动骰子点数(${cr.movingDieVal})低于对手(${cr.oppDiceSum})，自身被消灭！`, 'danger');
                } else {
                    this.showToast(`碰撞同归于尽！双方点数相同(${cr.movingDieVal} = ${cr.oppDiceSum})，全部淘汰！`, 'info');
                }
            }

            this.renderBoard();
            this.updatePlayerCards();

            if (!this.engine.gameOver) {
                this.clock.switchTurn(this.engine.turn);
                window.soundManager.playTurn();
                if (this.opponentType === 'ai' && this.engine.turn === this.aiColor) {
                    this.triggerAiTurn();
                }
            } else {
                this.clock.stop();
                this.handleGameOver(this.engine.winner, this.engine.winReason);
            }
        });
    }

    triggerAiTurn() {
        if (this.engine.gameOver) return;
        this.isAiThinking = true;
        this.turnIndicator.textContent = '🤖 AI 正在思考中...';
        const seqAtSchedule = this.gameSeq;
        if (this.aiTimer) clearTimeout(this.aiTimer);
        this.aiTimer = setTimeout(() => {
            this.aiTimer = null;
            // 开新局或对局已结束后，滞后的 AI 思考回调作废
            if (seqAtSchedule !== this.gameSeq || this.engine.gameOver) {
                this.isAiThinking = false;
                return;
            }
            this.ai.findBestMove(this.engine, (bestMove) => {
                if (seqAtSchedule !== this.gameSeq || this.engine.gameOver) {
                    this.isAiThinking = false;
                    return;
                }
                this.isAiThinking = false;
                if (bestMove) {
                    this.turnIndicator.textContent = '🤖 AI 正在走子...';
                    this.executeMove(bestMove);
                } else {
                    // AI 无合法走法 → 人类获胜
                    const humanColor = this.aiColor === 'white' ? 'black' : 'white';
                    this.engine.gameOver = true;
                    this.engine.winner = humanColor;
                    this.engine.winReason = `AI（${this.aiColor === 'white' ? '白方' : '黑方'}）已无任何合法移动，判负！`;
                    this.clock.stop();
                    this.renderBoard();
                    this.updatePlayerCards();
                    this.handleGameOver(humanColor, this.engine.winReason);
                }
            });
        }, 450);
    }

    updatePlayerCards() {
        const isWhite = this.engine.turn === 'white';
        this.whitePlayerBar.classList.toggle('active-turn', isWhite && !this.engine.gameOver);
        this.blackPlayerBar.classList.toggle('active-turn', !isWhite && !this.engine.gameOver);
        this.turnIndicator.textContent = this.engine.gameOver ? '对局结束' : (isWhite ? '当前回合：白方行动' : '当前回合：黑方行动');
    }

    handleGameOver(winner, reason) {
        // 超时等 UI 侧终局也同步引擎状态，防止滞后的走子/AI 回调在终局后继续行动
        if (!this.engine.gameOver) {
            this.engine.gameOver = true;
            this.engine.winner = winner;
            this.engine.winReason = reason;
        }
        if (this.animator) this.animator.cancelPending();
        this.isAnimating = false;

        if (this.reviewReasonText) {
            const winnerText = winner === 'draw' ? '平局' : (winner === 'white' ? '白方获胜' : '黑方获胜');
            this.reviewReasonText.textContent = `${winnerText} - ${reason}`;
        }
        if (this.logger) this.logger.logGameOver(winner, reason);

        document.getElementById('winnerTitle').textContent = winner === 'draw' ? '棋局平局！' : `${winner === 'white' ? '白方' : '黑方'} 获得胜利！`;
        document.getElementById('winnerReason').textContent = reason;

        const scoreBox = document.getElementById('battleScoreBreakdown');
        if (this.engine.mode === 'battle' && this.engine.scores && this.engine.scores.whiteBaseSum !== undefined) {
            scoreBox.style.display = 'block';
            document.getElementById('whiteScoreDetail').textContent = `白方：底线点数 ${this.engine.scores.whiteBaseSum} - 滞留惩罚 ${this.engine.scores.whitePenalty} = 净得分 ${this.engine.scores.white}`;
            document.getElementById('blackScoreDetail').textContent = `黑方：底线点数 ${this.engine.scores.blackBaseSum} - 滞留惩罚 ${this.engine.scores.blackPenalty} = 净得分 ${this.engine.scores.black}`;
        } else {
            scoreBox.style.display = 'none';
        }

        if (winner === 'draw' || (this.opponentType === 'ai' && winner === this.aiColor)) {
            window.soundManager.playLose();
        } else {
            window.soundManager.playWin();
        }

        this.gameOverModal.classList.add('open');
    }

    closeGameOverModal() {
        this.gameOverModal.classList.remove('open');
    }

    showReviewBanner() {
        if (this.reviewBanner) this.reviewBanner.style.display = 'flex';
    }

    hideReviewBanner() {
        if (this.reviewBanner) this.reviewBanner.style.display = 'none';
    }

    startNewGame() {
        this.hideReviewBanner();
        if (this.animator) {
            this.animator.cancelPending();
            this.animator.clearLastMoveHighlights();
        }
        // 作废所有滞后回调：旧局的 AI 思考定时器与动画完成回调全部失效
        this.gameSeq++;
        if (this.aiTimer) { clearTimeout(this.aiTimer); this.aiTimer = null; }
        this.isAnimating = false;
        this.engine = new DittleEngine(this.gameMode);
        this.selectedCoord = null;
        this.legalMoves = [];
        this.isAiThinking = false;
        this.clock.reset();
        this.clock.start('white');
        this.renderBoard();
        this.updatePlayerCards();
        if (this.logger) this.logger.clear();
        this.showToast('新对局已开始！白方先行。', 'info');
        window.soundManager.playGameStart();

        if (this.opponentType === 'ai' && this.aiColor === 'white') {
            this.triggerAiTurn();
        }
    }

    openSettingsModal() {
        this.settingsModal.classList.add('open');
    }

    closeSettingsModal() {
        this.settingsModal.classList.remove('open');
    }

    setupModalOptionButtons() {
        ['modeOptions', 'oppOptions', 'diffOptions', 'clockOptions'].forEach(id => {
            document.getElementById(id)?.querySelectorAll('.opt-btn').forEach(btn => {
                btn.onclick = () => {
                    btn.parentElement.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
            });
        });
    }

    saveSettings() {
        this.gameMode = document.querySelector('#modeOptions .opt-btn.active')?.dataset.val || 'battle';
        this.opponentType = document.querySelector('#oppOptions .opt-btn.active')?.dataset.val || 'ai';
        const diff = document.querySelector('#diffOptions .opt-btn.active')?.dataset.val || 'medium';
        this.ai.setDifficulty(diff);

        const preset = document.querySelector('#clockOptions .opt-btn.active')?.dataset.val || '5m';
        const presets = { '1m': 60, '3m': 180, '5m': 300, '10m': 600 };
        const wSec = preset === 'custom' ? (parseInt(document.getElementById('customWhiteMin').value) || 5) * 60 : (presets[preset] || 300);
        const bSec = preset === 'custom' ? (parseInt(document.getElementById('customBlackMin').value) || 5) * 60 : (presets[preset] || 300);
        const incSec = parseInt(document.getElementById('clockIncSec').value) || 0;
        this.clock.setTimes(wSec, bSec, incSec, incSec, preset === 'unlimited');

        this.modeBadge.textContent = this.gameMode === 'battle' ? '标准骰战棋' : '冲突淘汰变体';
        this.closeSettingsModal();
        this.startNewGame();
    }
}

window.onload = () => {
    window.gameUI = new DittleUI();
    window.gameUI.startNewGame();
};
