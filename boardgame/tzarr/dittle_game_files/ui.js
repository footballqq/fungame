// codex: 2026-09-13 增加沉浸式对弈音乐(BGM)与拾起/放下/开局/非法操作音效系统(SFX)
class DittleUI {
    constructor() {
        this.engine = new DittleEngine('battle');
        this.ai = new DittleAI('medium');
        this.clock = new ChessClock();
        this.animator = new DittleAnimator(this);

        this.gameMode = 'battle'; // 'battle' or 'clash'
        this.opponentType = 'ai'; // 'ai' or 'human'
        this.aiColor = 'black'; // AI plays black by default
        this.selectedCoord = null;
        this.legalMoves = [];
        this.currentScale = 1.0;
        this.is3DView = true; // 默认开启 3D 立体斜视角
        this.isBlackFlipped = false;
        this.isAiThinking = false;
        this.isAnimating = false;

        this.initDOM();
        this.setupClockCallbacks();
        this.bindEvents();
        this.updateBoardTransform();
        this.renderBoard();
        this.updatePlayerCards();
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
        // Zoom controls
        document.getElementById('zoomInBtn').onclick = () => this.setZoom(this.currentScale + 0.15);
        document.getElementById('zoomOutBtn').onclick = () => this.setZoom(this.currentScale - 0.15);
        document.getElementById('zoomResetBtn').onclick = () => this.setZoom(1.0);

        // Fullscreen toggle
        document.getElementById('fullscreenBtn').onclick = () => this.toggleFullscreen();

        // Pass-and-play 180° flip for mobile
        document.getElementById('flipBlackBtn').onclick = () => this.toggleBlackFlip();

        // Sound & Music toggle
        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.onclick = () => {
                const enabled = window.soundManager.toggleSound();
                soundBtn.classList.toggle('active', enabled);
                soundBtn.textContent = enabled ? '🔊 音效' : '🔇 静音';
                this.showToast(enabled ? '走棋音效已开启 🔊' : '走棋音效已静音 🔇', 'info');
                const modalSound = document.getElementById('modalSoundBtn');
                if (modalSound) {
                    modalSound.classList.toggle('active', enabled);
                    modalSound.textContent = enabled ? '🔊 走棋音效: 开启' : '🔊 走棋音效: 关闭';
                }
            };
        }

        const musicBtn = document.getElementById('musicToggleBtn');
        if (musicBtn) {
            musicBtn.onclick = () => {
                const enabled = window.soundManager.toggleMusic();
                musicBtn.classList.toggle('active', enabled);
                musicBtn.textContent = enabled ? '🎵 音乐:开' : '🔇 音乐:关';
                this.showToast(enabled ? '背景音乐已开启 🎵' : '背景音乐已静音 🔇', 'info');
                const modalMusic = document.getElementById('modalMusicBtn');
                if (modalMusic) {
                    modalMusic.classList.toggle('active', enabled);
                    modalMusic.textContent = enabled ? '🎵 背景音乐: 开启' : '🎵 背景音乐: 关闭';
                }
            };
        }

        const modalSound = document.getElementById('modalSoundBtn');
        if (modalSound) modalSound.onclick = () => soundBtn && soundBtn.click();
        const modalMusic = document.getElementById('modalMusicBtn');
        if (modalMusic) modalMusic.onclick = () => musicBtn && musicBtn.click();

        // Modals
        document.getElementById('openSettingsBtn').onclick = () => this.openSettingsModal();
        document.getElementById('closeSettingsBtn').onclick = () => this.closeSettingsModal();
        document.getElementById('saveSettingsBtn').onclick = () => this.saveSettings();
        document.getElementById('playAgainBtn').onclick = () => {
            this.closeGameOverModal();
            this.startNewGame();
        };

        // 3D View toggle
        if (this.viewModeBtn) {
            this.viewModeBtn.onclick = () => this.toggle3DView();
        }

        // Setting modal option buttons
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
        this.toastTimeout = setTimeout(() => {
            this.toastBanner.classList.remove('show');
        }, 2600);
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

                // Check highlight
                if (this.selectedCoord) {
                    const matchMove = this.legalMoves.find(m => m.to[0] === r && m.to[1] === c);
                    if (matchMove) {
                        if (matchMove.type === 'tilt') cellEl.classList.add('highlight-tilt');
                        else if (matchMove.type === 'jump') cellEl.classList.add('highlight-jump');
                        else if (matchMove.type === 'tilt_jump') cellEl.classList.add('highlight-tilt-jump');
                    }
                }

                // Render Die if present
                const die = this.engine.board[r][c];
                if (die) {
                    const dieEl = this.createDieElement(die, r, c);
                    if (this.selectedCoord && this.selectedCoord[0] === r && this.selectedCoord[1] === c) {
                        dieEl.classList.add('selected');
                    }
                    cellEl.appendChild(dieEl);
                }

                cellEl.onclick = () => this.handleCellClick(r, c);
                this.boardGrid.appendChild(cellEl);
            }
        }
        if (this.animator) {
            this.animator.applyLastMoveHighlights();
        }
    }

    createDieElement(die, r, c) {
        const wrap = document.createElement('div');
        wrap.className = `die-3d-wrap ${die.color}`;
        wrap.dataset.r = r;
        wrap.dataset.c = c;
        const colorName = die.color === 'white' ? '白骰' : '黑骰';
        wrap.title = `${colorName} [顶面:${die.top} | 迎面:${die.front} | 右面:${die.right}] (向前翻滚顶面将变为:${die.color === 'white' ? die.front : 7 - die.front})`;

        const cube = document.createElement('div');
        cube.className = 'die-cube';

        // 顶面 (Top Face)
        cube.appendChild(this.createFaceElement('face-top', die.top));
        // 正面/迎面 (South Face - 迎向镜头/玩家视角，纯净数字微标)
        cube.appendChild(this.createFaceElement('face-front', die.front, `${die.front}`));
        // 右侧面/东面 (Right Face - 迎向右侧，纯净数字微标)
        cube.appendChild(this.createFaceElement('face-right', die.right, `${die.right}`));

        wrap.appendChild(cube);
        return wrap;
    }

    createFaceElement(faceClass, value, badgeText = '') {
        const faceEl = document.createElement('div');
        faceEl.className = `die-face ${faceClass}`;

        const grid = document.createElement('div');
        grid.className = 'pips-grid';
        const pipIndices = this.getPipPositionsForNumber(value);

        for (let i = 0; i < 9; i++) {
            const pipSlot = document.createElement('div');
            pipSlot.className = 'pip-slot';
            if (pipIndices.includes(i)) {
                const pipDot = document.createElement('div');
                pipDot.className = 'pip';
                pipSlot.appendChild(pipDot);
            }
            grid.appendChild(pipSlot);
        }
        faceEl.appendChild(grid);

        if (badgeText) {
            const badge = document.createElement('span');
            badge.className = 'face-badge';
            badge.textContent = badgeText;
            faceEl.appendChild(badge);
        }
        return faceEl;
    }

    getPipPositionsForNumber(num) {
        const pips = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
        return pips[num] || [];
    }

    handleCellClick(r, c) {
        if (this.engine.gameOver || this.isAiThinking || this.isAnimating) return;
        if (this.opponentType === 'ai' && this.engine.turn === this.aiColor) return;

        const clickedDie = this.engine.board[r][c];

        // 1. If clicking own die -> select it (or deselect if clicking same)
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

        // 2. If already selected a die and clicked a cell
        if (this.selectedCoord) {
            const [fr, fc] = this.selectedCoord;
            const validation = this.engine.validateMoveAttempt(fr, fc, r, c);

            if (validation.valid) {
                // Execute move with transition animation!
                this.executeMove(validation.move);
            } else {
                // Show friendly error hint explaining why!
                window.soundManager.playIllegal();
                this.showToast(validation.reason, 'danger');
            }
        }
    }

    executeMove(move) {
        this.selectedCoord = null;
        this.legalMoves = [];
        this.renderBoard();

        // 启动平滑分步过场动画（防瞬移，步步清晰可见）
        this.animator.animateMove(move, () => {
            const moveRecord = this.engine.makeMove(move);

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

            // Switch clock
            if (!this.engine.gameOver) {
                this.clock.switchTurn(this.engine.turn);
                window.soundManager.playTurn();
                // Trigger AI if it's AI turn
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
        this.isAiThinking = true;
        this.turnIndicator.textContent = '🤖 AI 正在思考中...';
        // 增加 450ms 思考过场停顿，让玩家看清回合切换
        setTimeout(() => {
            this.ai.findBestMove(this.engine, (bestMove) => {
                this.isAiThinking = false;
                if (bestMove) {
                    this.turnIndicator.textContent = '🤖 AI 正在走子...';
                    this.executeMove(bestMove);
                }
            });
        }, 450);
    }

    updatePlayerCards() {
        const isWhite = this.engine.turn === 'white';
        this.whitePlayerBar.classList.toggle('active-turn', isWhite && !this.engine.gameOver);
        this.blackPlayerBar.classList.toggle('active-turn', !isWhite && !this.engine.gameOver);

        this.turnIndicator.textContent = this.engine.gameOver
            ? '对局结束'
            : (isWhite ? '当前回合：白方行动' : '当前回合：黑方行动');
    }

    handleGameOver(winner, reason) {
        document.getElementById('winnerTitle').textContent =
            winner === 'draw' ? '棋局平局！' : `${winner === 'white' ? '白方' : '黑方'} 获得胜利！`;
        document.getElementById('winnerReason').textContent = reason;

        const scoreBox = document.getElementById('battleScoreBreakdown');
        if (this.engine.mode === 'battle' && this.engine.scores) {
            scoreBox.style.display = 'block';
            document.getElementById('whiteScoreDetail').textContent =
                `白方：底线点数 ${this.engine.scores.whiteBaseSum || 0} - 滞留惩罚 ${this.engine.scores.whitePenalty || 0} = 净得分 ${this.engine.scores.white}`;
            document.getElementById('blackScoreDetail').textContent =
                `黑方：底线点数 ${this.engine.scores.blackBaseSum || 0} - 滞留惩罚 ${this.engine.scores.blackPenalty || 0} = 净得分 ${this.engine.scores.black}`;
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

    startNewGame() {
        if (this.animator) {
            this.animator.cancelPending();
            this.animator.clearLastMoveHighlights();
        }
        this.isAnimating = false;
        this.engine = new DittleEngine(this.gameMode);
        this.selectedCoord = null;
        this.legalMoves = [];
        this.isAiThinking = false;
        this.clock.reset();
        this.clock.start('white');
        this.renderBoard();
        this.updatePlayerCards();
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
        const setupGroup = (containerId, onSelect) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const buttons = container.querySelectorAll('.opt-btn');
            buttons.forEach(btn => {
                btn.onclick = () => {
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    onSelect(btn.dataset.val);
                };
            });
        };

        setupGroup('modeOptions', val => this.selectedMode = val);
        setupGroup('oppOptions', val => this.selectedOpp = val);
        setupGroup('diffOptions', val => this.selectedDiff = val);
        setupGroup('clockOptions', val => this.selectedClockPreset = val);
    }

    saveSettings() {
        const modeBtn = document.querySelector('#modeOptions .opt-btn.active');
        const oppBtn = document.querySelector('#oppOptions .opt-btn.active');
        const diffBtn = document.querySelector('#diffOptions .opt-btn.active');
        const clockBtn = document.querySelector('#clockOptions .opt-btn.active');

        if (modeBtn) this.gameMode = modeBtn.dataset.val;
        if (oppBtn) this.opponentType = oppBtn.dataset.val;
        if (diffBtn) this.ai.setDifficulty(diffBtn.dataset.val);

        // Configure clocks
        const preset = clockBtn ? clockBtn.dataset.val : '5m';
        let wSec = 300, bSec = 300, unlimited = false;
        const presets = { '1m': 60, '3m': 180, '5m': 300, '10m': 600 };
        if (presets[preset]) {
            wSec = bSec = presets[preset];
        } else if (preset === 'unlimited') {
            unlimited = true;
        } else if (preset === 'custom') {
            wSec = (parseInt(document.getElementById('customWhiteMin').value) || 5) * 60;
            bSec = (parseInt(document.getElementById('customBlackMin').value) || 5) * 60;
        }

        const incSec = parseInt(document.getElementById('clockIncSec').value) || 0;
        this.clock.setTimes(wSec, bSec, incSec, incSec, unlimited);

        this.modeBadge.textContent = this.gameMode === 'battle' ? '标准骰战棋' : '冲突淘汰变体';
        this.closeSettingsModal();
        this.startNewGame();
    }
}

window.onload = () => {
    window.gameUI = new DittleUI();
    window.gameUI.startNewGame();
};
