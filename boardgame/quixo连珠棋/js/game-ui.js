// codex: 2026-09-14 Quixo界面渲染与交互管理 - 实现推入指示箭头、DOM操作与WebAudio音效
'use strict';

/** 推入方向的中文标签（描述屏幕上棋子被推动的方向） */
const DIRECTION_LABELS = Object.freeze({
    up: '向上',
    down: '向下',
    left: '向左',
    right: '向右',
});

/**
 * GameUI - 负责页面交互、DOM 渲染、动画与音频反馈
 */
class GameUI {
    constructor() {
        this.boardGridEl = document.getElementById('boardGrid');
        this.boardOuterEl = document.getElementById('boardOuter');
        this.arrowOverlayEl = document.getElementById('pushArrowOverlay');
        this.statusTextEl = document.getElementById('instructionText');
        this.stepIndicatorEl = document.getElementById('stepIndicator');
        this.player1Card = document.getElementById('player1Card');
        this.player2Card = document.getElementById('player2Card');
        this.winModal = document.getElementById('winModal');
        this.rulesModal = document.getElementById('rulesModal');
        this.boardSize = 5; // 棋盘边长（与 GameModel.size 一致），用于箭头定位计算
        this.soundEnabled = true;

        this.initAudio();
    }

    /** 初始化 Web Audio API 合成音效（免外部资源依赖） */
    initAudio() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    /** 恢复音频上下文（移动端需要用户手势后激活） */
    resumeAudio() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    /** 播放拾起棋子音效（清脆木头碰撞） */
    playPickSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.resumeAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, this.audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    /** 播放推入归位音效（厚重滑动撞击） */
    playPushSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.resumeAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, this.audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.18);
    }

    /** 播放获胜和弦音效 */
    playWinSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.resumeAudio();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
        notes.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + idx * 0.12 + 0.5);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(this.audioCtx.currentTime + idx * 0.12);
            osc.stop(this.audioCtx.currentTime + idx * 0.12 + 0.5);
        });
    }

    /** 渲染棋盘与棋子 */
    renderBoard(model, rules, onCellClick) {
        this.boardGridEl.innerHTML = '';
        const pickableMap = new Set();

        if (model.phase === GamePhase.PICK) {
            const pickable = rules.getPickablePositions(model.board, model.currentPlayer);
            pickable.forEach(p => pickableMap.add(`${p.row},${p.col}`));
        }

        for (let r = 0; r < model.size; r++) {
            for (let c = 0; c < model.size; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (!rules.isEdge(r, c)) cell.classList.add('inner');

                const val = model.getCell(r, c);
                if (val === CellState.CIRCLE) {
                    cell.classList.add('circle');
                    cell.textContent = '○';
                } else if (val === CellState.CROSS) {
                    cell.classList.add('cross');
                    cell.textContent = '×';
                }

                // 选中状态
                if (model.selectedPos && model.selectedPos.row === r && model.selectedPos.col === c) {
                    cell.classList.add('selected');
                } else if (pickableMap.has(`${r},${c}`)) {
                    cell.classList.add('pickable');
                }

                cell.addEventListener('click', () => onCellClick(r, c));
                this.boardGridEl.appendChild(cell);
            }
        }
    }

    /** 渲染推入方向按钮指示器（按钮尺寸随棋格自适应，适配手机/Pad/PC任意棋盘大小） */
    renderPushArrows(selectedPos, directions, onDirectionClick) {
        this.arrowOverlayEl.innerHTML = '';
        if (!selectedPos || !directions || directions.length === 0) return;

        const outerRect = this.boardOuterEl.getBoundingClientRect();
        // 探测当前棋格实际渲染尺寸，按钮随其等比缩放，避免小屏遮挡棋格
        const probeCell = this.boardGridEl.querySelector('[data-row="0"][data-col="0"]');
        const cellWidth = probeCell ? probeCell.getBoundingClientRect().width : 64;
        const btnSize = Math.max(32, Math.min(46, Math.round(cellWidth * 0.58)));
        const btnRadius = btnSize / 2;
        const edgeGap = btnSize + 6; // 按钮中心到棋盘外沿格子的间距

        const locateCell = (row, col) => {
            const el = this.boardGridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            return el ? el.getBoundingClientRect() : null;
        };

        directions.forEach(dir => {
            const btn = document.createElement('button');
            btn.className = 'push-btn';
            btn.style.width = `${btnSize}px`;
            btn.style.height = `${btnSize}px`;
            btn.style.fontSize = `${Math.round(btnSize * 0.5)}px`;

            let left = 0;
            let top = 0;

            if (dir === Direction.DOWN) {
                // 对应列的最上方格子 (0, col)
                const rect = locateCell(0, selectedPos.col);
                if (rect) {
                    left = (rect.left + rect.width / 2) - outerRect.left - btnRadius;
                    top = rect.top - outerRect.top - edgeGap;
                }
                btn.innerHTML = '&#8595;';
                btn.title = '从上方推入';
            } else if (dir === Direction.UP) {
                // 对应列的最下方格子 (last, col)
                const rect = locateCell(this.boardSize - 1, selectedPos.col);
                if (rect) {
                    left = (rect.left + rect.width / 2) - outerRect.left - btnRadius;
                    top = rect.bottom - outerRect.top + 6;
                }
                btn.innerHTML = '&#8593;';
                btn.title = '从下方推入';
            } else if (dir === Direction.RIGHT) {
                // 对应行的最左侧格子 (row, 0)
                const rect = locateCell(selectedPos.row, 0);
                if (rect) {
                    left = rect.left - outerRect.left - edgeGap;
                    top = (rect.top + rect.height / 2) - outerRect.top - btnRadius;
                }
                btn.innerHTML = '&#8594;';
                btn.title = '从左方推入';
            } else if (dir === Direction.LEFT) {
                // 对应行的最右侧格子 (row, last)
                const rect = locateCell(selectedPos.row, this.boardSize - 1);
                if (rect) {
                    left = rect.right - outerRect.left + 6;
                    top = (rect.top + rect.height / 2) - outerRect.top - btnRadius;
                }
                btn.innerHTML = '&#8592;';
                btn.title = '从右方推入';
            }

            btn.style.left = `${left}px`;
            btn.style.top = `${top}px`;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onDirectionClick(dir);
            });

            this.arrowOverlayEl.appendChild(btn);
        });
    }

    /** 清除所有推入箭头 */
    clearArrows() {
        this.arrowOverlayEl.innerHTML = '';
    }

    /** 计算推入方向对应的新棋子插入位置 */
    insertPosition(move) {
        const last = this.boardSize - 1;
        switch (move.direction) {
            case Direction.DOWN: return { row: 0, col: move.col };
            case Direction.UP: return { row: last, col: move.col };
            case Direction.RIGHT: return { row: move.row, col: 0 };
            case Direction.LEFT: return { row: move.row, col: last };
            default: return { row: move.row, col: move.col };
        }
    }

    /**
     * 播放推入滑动动画：须在棋盘已按移动后状态渲染完毕时调用。
     * 被推动的棋子先无过渡地摆到"来自相邻格"的起点，再平滑滑入最终位置；
     * 新推入的棋子做翻面入场动画（模拟把积木翻转为己方面孔）。
     * @returns {number} 动画时长（毫秒），调用方据此延迟后续结算
     */
    playSlideAnimation(model, move) {
        const last = this.boardSize - 1;
        const moved = [];
        // 与 GameRules.applyMove 的位移范围严格对应：内容来自哪个邻居，就从哪边滑入
        switch (move.direction) {
            case Direction.DOWN:
                for (let r = 1; r <= move.row; r++) moved.push({ row: r, col: move.col, dx: 0, dy: -1 });
                break;
            case Direction.UP:
                for (let r = move.row; r <= last - 1; r++) moved.push({ row: r, col: move.col, dx: 0, dy: 1 });
                break;
            case Direction.RIGHT:
                for (let c = 1; c <= move.col; c++) moved.push({ row: move.row, col: c, dx: -1, dy: 0 });
                break;
            case Direction.LEFT:
                for (let c = move.col; c <= last - 1; c++) moved.push({ row: move.row, col: c, dx: 1, dy: 0 });
                break;
        }

        const gap = parseFloat(getComputedStyle(this.boardGridEl).columnGap) || 0;
        moved.forEach(m => {
            const el = this.boardGridEl.querySelector(`[data-row="${m.row}"][data-col="${m.col}"]`);
            if (!el) return;
            const size = el.getBoundingClientRect().width;
            m.el = el;
            el.classList.add('slide-init');
            el.style.transform = `translate(${m.dx * (size + gap)}px, ${m.dy * (size + gap)}px)`;
        });

        // 强制回流，确保起始位移先生效，再开启过渡归位
        void this.boardGridEl.offsetWidth;

        moved.forEach(m => {
            m.el.classList.remove('slide-init');
            m.el.classList.add('slide-shift');
            m.el.style.transform = '';
        });

        const ip = this.insertPosition(move);
        const insertEl = this.boardGridEl.querySelector(`[data-row="${ip.row}"][data-col="${ip.col}"]`);
        if (insertEl) insertEl.classList.add('cube-insert');

        // 动画结束后清理辅助类，避免残留过渡样式影响后续交互与选中动效
        setTimeout(() => {
            moved.forEach(m => m.el && m.el.classList.remove('slide-shift'));
            if (insertEl) insertEl.classList.remove('cube-insert');
        }, 560);

        return 500;
    }

    /** 高亮胜利连线 */
    highlightWinLine(winLine) {
        if (!winLine || !winLine.cells) return;
        winLine.cells.forEach(pos => {
            const cellEl = this.boardGridEl.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (cellEl) cellEl.classList.add('win-cell');
        });
    }

    /** 更新玩家行动状态栏（aiStage: ''思考中 | 'picked'已取子待推入） */
    updateStatus(model, isAiTurn = false, aiStage = '', move = null) {
        const p1Active = model.currentPlayer === CellState.CIRCLE;
        this.player1Card.classList.toggle('active', p1Active);
        this.player2Card.classList.toggle('active', !p1Active);

        if (model.phase === GamePhase.GAME_OVER) {
            this.statusTextEl.textContent = '对局结束';
            this.stepIndicatorEl.textContent = '点击"再来一局"重新开始';
            return;
        }

        if (isAiTurn) {
            if (aiStage === 'picked' && move) {
                const dirLabel = DIRECTION_LABELS[move.direction] || '';
                this.statusTextEl.textContent = 'AI 已取出棋子，正在推入...';
                this.stepIndicatorEl.textContent =
                    `AI 取出第 ${move.row + 1} 行第 ${move.col + 1} 列棋子，${dirLabel}推入`;
            } else {
                this.statusTextEl.textContent = 'AI 正在推演棋局...';
                this.stepIndicatorEl.textContent = '请稍候';
            }
            return;
        }

        const playerSym = model.currentPlayer === CellState.CIRCLE ? '○' : '×';
        if (model.phase === GamePhase.PICK) {
            this.statusTextEl.textContent = `轮到玩家 [ ${playerSym} ] 行动`;
            this.stepIndicatorEl.textContent = '第 1 步：从棋盘外围取出一枚空白棋子或己方棋子';
        } else if (model.phase === GamePhase.PUSH) {
            this.statusTextEl.textContent = `已取出棋子，准备推入`;
            this.stepIndicatorEl.textContent = '第 2 步：点击橙色箭头选择推入方向（或重选棋子）';
        }
    }

    /** 显示胜负弹窗 */
    showGameOver(winner, reason = '') {
        const titleEl = document.getElementById('winTitle');
        const descEl = document.getElementById('winDesc');
        const iconEl = document.getElementById('winIcon');

        const winnerSymbol = winner === CellState.CIRCLE ? '○' : '×';
        const winnerName = winner === CellState.CIRCLE ? '玩家 ○' : '玩家 ×';

        iconEl.textContent = '🏆';
        titleEl.textContent = `${winnerName} 获胜！`;
        descEl.textContent = reason || `率先连成 5 个 ${winnerSymbol}，取得胜利！`;

        this.winModal.classList.add('show');
    }

    /** 隐藏弹窗 */
    hideGameOver() {
        this.winModal.classList.remove('show');
    }

    /** 打开规则说明窗 */
    showRules() {
        this.rulesModal.classList.add('show');
    }

    /** 关闭规则说明窗 */
    hideRules() {
        this.rulesModal.classList.remove('show');
    }
}
