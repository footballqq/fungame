// codex: 2026-08-10 Repair victory controls and render a persistent per-game move history.
class BridgItUI {
    constructor() {
        this.game = null;
        this.ai = null;
        this.stats = new BridgItStats();
        
        // Game Settings
        this.gameMode = 'pve'; // 'pve' (Human vs AI) | 'pvp' (2-Player Local)
        this.boardSize = '3x4'; // default
        this.difficulty = 'normal';
        this.playerRole = 'blue'; // 'blue' (Top-Bottom) | 'red' (Left-Right)
        this.aiRole = 'red';

        // Scale & Font settings
        this.fontScale = localStorage.getItem('bridg_it_font_scale') || '1.15';
        this.boardScale = parseFloat(localStorage.getItem('bridg_it_board_scale')) || 1.3;

        // Sound
        this.soundEnabled = true;
        this.audioCtx = null;

        // Timer & Moves
        this.timer = null;
        this.aiTimer = null;
        this.secondsElapsed = 0;
        this.moveCount = 0;

        this._initDOMElements();
        this._applyFontScale();
        this._bindEvents();
        this._checkFirstTimeVisit();
        this.startNewGame();
    }

    _initDOMElements() {
        this.dom = {
            svg: document.getElementById('boardSvg'),
            modeSelect: document.getElementById('modeSelect'),
            sizeSelect: document.getElementById('sizeSelect'),
            diffSelect: document.getElementById('diffSelect'),
            roleSelect: document.getElementById('roleSelect'),
            fontSelect: document.getElementById('fontSelect'),
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            zoomResetBtn: document.getElementById('zoomResetBtn'),
            zoomLevelDisplay: document.getElementById('zoomLevelDisplay'),

            newGameBtn: document.getElementById('newGameBtn'),
            undoBtn: document.getElementById('undoBtn'),
            hintBtn: document.getElementById('hintBtn'),
            rulesBtn: document.getElementById('rulesBtn'),
            statsBtn: document.getElementById('statsBtn'),
            soundBtn: document.getElementById('soundToggleBtn'),
            
            turnBadge: document.getElementById('turnBadge'),
            exemptBadge: document.getElementById('exemptBadge'),
            timerDisplay: document.getElementById('timerDisplay'),
            movesDisplay: document.getElementById('movesDisplay'),
            winRateDisplay: document.getElementById('winRateDisplay'),

            rulesModal: document.getElementById('rulesModal'),
            closeRulesBtn: document.getElementById('closeRulesBtn'),
            statsModal: document.getElementById('statsModal'),
            closeStatsBtn: document.getElementById('closeStatsBtn'),
            clearStatsBtn: document.getElementById('clearStatsBtn'),
            statsBody: document.getElementById('statsBody'),

            victoryModal: document.getElementById('victoryModal'),
            victoryTitle: document.getElementById('victoryTitle'),
            victorySub: document.getElementById('victorySub'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            closeVictoryBtn: document.getElementById('closeVictoryBtn'),
            moveHistory: document.getElementById('moveHistory'),
            moveHistoryCount: document.getElementById('moveHistoryCount')
        };

        if (this.dom.fontSelect) {
            this.dom.fontSelect.value = this.fontScale;
        }
        this._updateZoomDisplay();
    }

    _applyFontScale() {
        document.documentElement.style.fontSize = `${parseFloat(this.fontScale) * 16}px`;
        localStorage.setItem('bridg_it_font_scale', this.fontScale);
    }

    _updateZoomDisplay() {
        if (this.dom.zoomLevelDisplay) {
            this.dom.zoomLevelDisplay.textContent = `${Math.round(this.boardScale * 100)}%`;
        }
        localStorage.setItem('bridg_it_board_scale', this.boardScale);
    }

    _bindEvents() {
        this.dom.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.dom.modeSelect.addEventListener('change', () => this.startNewGame());
        this.dom.sizeSelect.addEventListener('change', () => this.startNewGame());
        this.dom.diffSelect.addEventListener('change', () => this.startNewGame());
        this.dom.roleSelect.addEventListener('change', () => this.startNewGame());

        if (this.dom.fontSelect) {
            this.dom.fontSelect.addEventListener('change', (e) => {
                this.fontScale = e.target.value;
                this._applyFontScale();
            });
        }

        if (this.dom.zoomInBtn) {
            this.dom.zoomInBtn.addEventListener('click', () => {
                this.boardScale = Math.min(2.5, Math.round((this.boardScale + 0.15) * 100) / 100);
                this._updateZoomDisplay();
                this.renderBoard();
            });
        }
        if (this.dom.zoomOutBtn) {
            this.dom.zoomOutBtn.addEventListener('click', () => {
                this.boardScale = Math.max(0.8, Math.round((this.boardScale - 0.15) * 100) / 100);
                this._updateZoomDisplay();
                this.renderBoard();
            });
        }
        if (this.dom.zoomResetBtn) {
            this.dom.zoomResetBtn.addEventListener('click', () => {
                this.boardScale = 1.3;
                this._updateZoomDisplay();
                this.renderBoard();
            });
        }

        this.dom.undoBtn.addEventListener('click', () => this.handleUndo());
        this.dom.hintBtn.addEventListener('click', () => this.handleHint());

        this.dom.rulesBtn.addEventListener('click', () => this.showModal('rulesModal'));
        this.dom.closeRulesBtn.addEventListener('click', () => this.hideModal('rulesModal'));

        this.dom.statsBtn.addEventListener('click', () => {
            this.renderStatsTable();
            this.showModal('statsModal');
        });
        this.dom.closeStatsBtn.addEventListener('click', () => this.hideModal('statsModal'));
        this.dom.clearStatsBtn.addEventListener('click', () => {
            if (confirm('确定要清空所有战绩统计吗？')) {
                this.stats.clearStats();
                this.renderStatsTable();
                this.updateHeaderStatsDisplay();
            }
        });

        this.dom.soundBtn.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            this.dom.soundBtn.textContent = this.soundEnabled ? '🔊 音效开启' : '🔇 音效关闭';
        });

        this.dom.playAgainBtn.addEventListener('click', () => {
            this.hideModal('victoryModal');
            this.startNewGame();
        });
        this.dom.closeVictoryBtn.addEventListener('click', () => this.hideModal('victoryModal'));
    }

    _checkFirstTimeVisit() {
        if (!localStorage.getItem('bridg_it_visited')) {
            this.showModal('rulesModal');
            localStorage.setItem('bridg_it_visited', 'true');
        }
    }

    startNewGame() {
        if (this.aiTimer) {
            clearTimeout(this.aiTimer);
            this.aiTimer = null;
        }
        this.gameMode = this.dom.modeSelect.value; // 'pve' or 'pvp'
        const diffGroup = this.dom.diffSelect.parentElement;
        const roleGroup = this.dom.roleSelect.parentElement;

        if (this.gameMode === 'pvp') {
            diffGroup.style.display = 'none';
            roleGroup.style.display = 'none';
            this.playerRole = null;
            this.aiRole = null;
        } else {
            diffGroup.style.display = 'flex';
            roleGroup.style.display = 'flex';
            this.difficulty = this.dom.diffSelect.value;
            const roleVal = this.dom.roleSelect.value;
            if (roleVal === 'random') {
                this.playerRole = Math.random() < 0.5 ? 'blue' : 'red';
            } else {
                this.playerRole = roleVal;
            }
            this.aiRole = this.playerRole === 'blue' ? 'red' : 'blue';
        }

        const [rStr, cStr] = this.dom.sizeSelect.value.split('x');
        const R = parseInt(rStr, 10);
        const C = parseInt(cStr, 10);
        this.boardSize = `${R}x${C}`;

        this.game = new BridgItGame(R, C);
        this.ai = (this.gameMode === 'pve') ? new BridgItAI(this.difficulty, this.aiRole) : null;

        this.moveCount = 0;
        this.secondsElapsed = 0;
        this.startTimer();

        this.updateHeaderStatsDisplay();
        this.renderBoard();
        this.renderMoveHistory();
        this.updateTurnUI();

        // If PvE mode and AI plays first (AI is Blue)
        if (this.gameMode === 'pve' && this.game.currentPlayer === this.aiRole) {
            this.aiTimer = setTimeout(() => {
                this.aiTimer = null;
                this.triggerAIMove();
            }, 350);
        }
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.secondsElapsed = 0;
        this.dom.timerDisplay.textContent = '00:00';
        this.timer = setInterval(() => {
            this.secondsElapsed++;
            const mins = String(Math.floor(this.secondsElapsed / 60)).padStart(2, '0');
            const secs = String(this.secondsElapsed % 60).padStart(2, '0');
            this.dom.timerDisplay.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTurnUI() {
        const { C } = this.game;

        if (this.gameMode === 'pvp') {
            // PvP Mode: 2 Players Local
            this.dom.exemptBadge.style.display = 'none';
            const curr = this.game.currentPlayer;
            if (this.game.winner) {
                this.dom.turnBadge.textContent = '游戏结束';
                this.dom.turnBadge.className = 'status-badge game-over';
                if (this.dom.svg) this.dom.svg.style.pointerEvents = 'none';
            } else if (curr === 'blue') {
                this.dom.turnBadge.textContent = `你的回合 [🔵 蓝方(玩家1·长边 ${C} 点连通)]`;
                this.dom.turnBadge.className = 'status-badge player-turn blue';
                if (this.dom.svg) this.dom.svg.style.pointerEvents = 'auto';
            } else {
                this.dom.turnBadge.textContent = `你的回合 [🔴 红方(玩家2·短边连通)]`;
                this.dom.turnBadge.className = 'status-badge player-turn red';
                if (this.dom.svg) this.dom.svg.style.pointerEvents = 'auto';
            }
        } else {
            // PvE Mode: Human vs AI
            const isPlayerTurn = (this.game.currentPlayer === this.playerRole);
            const playerColorName = this.playerRole === 'blue' ? `🔵 蓝方(玩家·长边 ${C} 点连通)` : `🔴 红方(玩家·短边连通)`;
            const aiColorName = this.aiRole === 'blue' ? `🔵 蓝方(电脑·长边 ${C} 点连通)` : `🔴 红方(电脑·短边连通)`;

            if (this.game.winner) {
                this.dom.turnBadge.textContent = '游戏结束';
                this.dom.turnBadge.className = 'status-badge game-over';
                if (this.dom.svg) this.dom.svg.style.pointerEvents = 'none';
            } else if (isPlayerTurn) {
                this.dom.turnBadge.textContent = `你的回合 [${playerColorName}]`;
                this.dom.turnBadge.className = `status-badge player-turn ${this.playerRole}`;
                if (this.dom.svg) this.dom.svg.style.pointerEvents = 'auto';
            } else {
                this.dom.turnBadge.textContent = `电脑思考中 🧠 [${aiColorName}]...`;
                this.dom.turnBadge.className = `status-badge ai-turn ${this.aiRole}`;
                if (this.dom.svg) this.dom.svg.style.pointerEvents = 'none';
            }

            const isExempt = this.stats.isExemptFromStats(this.difficulty, this.playerRole, this.aiRole);
            if (isExempt) {
                this.dom.exemptBadge.style.display = 'inline-block';
                this.dom.exemptBadge.textContent = '⚠️ 大师先手（必胜挑战，不计入战绩）';
            } else {
                this.dom.exemptBadge.style.display = 'none';
            }
        }

        this.dom.movesDisplay.textContent = this.moveCount;
    }

    renderMoveHistory() {
        const moves = this.game.history;
        this.dom.moveHistoryCount.textContent = `${moves.length} 手`;

        if (moves.length === 0) {
            this.dom.moveHistory.innerHTML = '<li class="move-history-empty">本局尚未落子</li>';
            return;
        }

        this.dom.moveHistory.innerHTML = moves.map((move, index) => {
            const isBlue = move.player === 'blue';
            const side = isBlue ? '蓝方' : '红方';
            let actor = '';
            if (this.gameMode === 'pvp') {
                actor = isBlue ? '玩家 1' : '玩家 2';
            } else {
                actor = move.player === this.playerRole ? '玩家' : '电脑';
            }
            return `<li class="move-history-item ${move.player}"><span>${index + 1}. ${side} · ${actor}</span><code>${move.edgeId}</code></li>`;
        }).join('');
    }

    updateHeaderStatsDisplay() {
        if (this.gameMode === 'pvp') {
            this.dom.winRateDisplay.textContent = '👥 双人对战';
            return;
        }
        const isExempt = this.stats.isExemptFromStats(this.difficulty, this.playerRole, this.aiRole);
        if (isExempt) {
            this.dom.winRateDisplay.textContent = '战绩豁免';
            return;
        }
        const currentStats = this.stats.getStatsFor(this.boardSize, this.difficulty);
        this.dom.winRateDisplay.textContent = `${currentStats.winRate}% (${currentStats.playerWins}/${currentStats.played}胜)`;
    }

    renderBoard() {
        const svg = this.dom.svg;
        svg.innerHTML = ''; // clear

        const { R, C } = this.game;
        const paddingX = 150;
        const paddingY = 90;
        const step = 70;

        const viewBoxWidth = (C - 1) * step + paddingX * 2;
        const viewBoxHeight = R * step + paddingY * 2;
        
        svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        
        const renderWidth = Math.round(viewBoxWidth * this.boardScale);
        const renderHeight = Math.round(viewBoxHeight * this.boardScale);
        svg.setAttribute('width', `${renderWidth}px`);
        svg.setAttribute('height', `${renderHeight}px`);

        const groupBg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const groupEdges = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const groupDots = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const groupLabels = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        svg.appendChild(groupBg);
        svg.appendChild(groupEdges);
        svg.appendChild(groupDots);
        svg.appendChild(groupLabels);

        // Helper to convert grid coords to pixels
        const getBluePixel = (r, c) => ({ x: paddingX + (c + 0.5) * step, y: paddingY + r * step });
        const getRedPixel = (r, c) => ({ x: paddingX + c * step, y: paddingY + (r + 0.5) * step });

        // Add Goal Labels
        this._renderGoalLabels(groupLabels, viewBoxWidth, viewBoxHeight, C);

        // Render Blue Edges
        for (const id in this.game.blueEdges) {
            const e = this.game.blueEdges[id];
            let p1, p2;
            if (e.type === 'bv') {
                p1 = getBluePixel(e.r, e.c);
                p2 = getBluePixel(e.r + 1, e.c);
            } else {
                p1 = getBluePixel(e.r, e.c);
                p2 = getBluePixel(e.r, e.c + 1);
            }
            this._createEdgeSVG(groupEdges, id, 'blue', p1, p2, e.owner);
        }

        // Render Red Edges
        for (const id in this.game.redEdges) {
            const e = this.game.redEdges[id];
            let p1, p2;
            if (e.type === 'rh') {
                p1 = getRedPixel(e.r, e.c);
                p2 = getRedPixel(e.r, e.c + 1);
            } else {
                p1 = getRedPixel(e.r, e.c);
                p2 = getRedPixel(e.r + 1, e.c);
            }
            this._createEdgeSVG(groupEdges, id, 'red', p1, p2, e.owner);
        }

        // Render Blue Dots (Top to Bottom, 0..R rows, 0..C-2 cols)
        for (let r = 0; r <= R; r++) {
            for (let c = 0; c < C - 1; c++) {
                const { x, y } = getBluePixel(r, c);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', 10);
                circle.setAttribute('class', 'dot blue-dot');
                groupDots.appendChild(circle);
            }
        }

        // Render Red Dots (Left to Right, 0..R-1 rows, 0..C-1 cols)
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                const { x, y } = getRedPixel(r, c);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', 10);
                circle.setAttribute('class', 'dot red-dot');
                groupDots.appendChild(circle);
            }
        }
    }

    _renderGoalLabels(group, viewBoxWidth, viewBoxHeight, C) {
        const topText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        topText.setAttribute('x', viewBoxWidth / 2);
        topText.setAttribute('y', 35);
        topText.setAttribute('class', 'svg-goal-label blue-label');
        topText.textContent = `▼ 蓝方 (先手) 顶行目标 (长边 ${C} 点) ▼`;
        group.appendChild(topText);

        const botText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        botText.setAttribute('x', viewBoxWidth / 2);
        botText.setAttribute('y', viewBoxHeight - 30);
        botText.setAttribute('class', 'svg-goal-label blue-label');
        botText.textContent = `▲ 蓝方 (先手) 底行目标 (长边 ${C} 点) ▲`;
        group.appendChild(botText);

        const leftText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        leftText.setAttribute('x', 75);
        leftText.setAttribute('y', viewBoxHeight / 2);
        leftText.setAttribute('class', 'svg-goal-label red-label vertical');
        leftText.textContent = '◄ 红方 (后手) 左列目标';
        group.appendChild(leftText);

        const rightText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        rightText.setAttribute('x', viewBoxWidth - 75);
        rightText.setAttribute('y', viewBoxHeight / 2);
        rightText.setAttribute('class', 'svg-goal-label red-label vertical');
        rightText.textContent = '红方 (后手) 右列目标 ►';
        group.appendChild(rightText);
    }

    _createEdgeSVG(group, edgeId, edgeColor, p1, p2, owner) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('data-id', edgeId);

        let cls = `edge ${edgeColor}-edge`;
        const activeTurnColor = (this.gameMode === 'pvp') ? this.game.currentPlayer : this.playerRole;
        const isCurrentActiveEdge = (edgeColor === activeTurnColor);

        if (owner === edgeColor) {
            cls += ' owned';
            const lastMove = this.game.history[this.game.history.length - 1];
            if (lastMove && lastMove.edgeId === edgeId) {
                cls += ' last-move';
            }
        } else {
            const intersectId = edgeColor === 'blue' ? this.game.blueToRedMap[edgeId] : this.game.redToBlueMap[edgeId];
            const oppColor = edgeColor === 'blue' ? 'red' : 'blue';
            const oppEdge = oppColor === 'red' ? this.game.redEdges[intersectId] : this.game.blueEdges[intersectId];
            if (oppEdge && oppEdge.owner === oppColor) {
                cls += ' blocked';
            } else if (isCurrentActiveEdge) {
                cls += ' playable';
            } else {
                cls += ' unplayable';
            }
        }

        line.setAttribute('class', cls);

        // Allow click if active color and not owned/blocked
        if (isCurrentActiveEdge && owner === null && !cls.includes('blocked')) {
            line.addEventListener('click', () => {
                if (!this.game.winner) {
                    if (this.gameMode === 'pvp' || this.game.currentPlayer === this.playerRole) {
                        this.handlePlayerMove(edgeId);
                    }
                }
            });
        }

        group.appendChild(line);
    }

    handlePlayerMove(edgeId) {
        if (this.game.makeMove(edgeId)) {
            this.moveCount++;
            this.playSound('move');
            this.renderBoard();
            this.renderMoveHistory();
            this.updateTurnUI();

            if (this.game.winner) {
                this.handleGameOver();
            } else if (this.gameMode === 'pve') {
                this.aiTimer = setTimeout(() => {
                    this.aiTimer = null;
                    this.triggerAIMove();
                }, 350);
            }
        }
    }

    triggerAIMove() {
        if (
            this.gameMode !== 'pve' ||
            this.game.winner ||
            this.game.currentPlayer !== this.aiRole
        ) return;

        try {
            let aiMove = this.ai.getBestMove(this.game);

            if (!aiMove) {
                const valid = this.game.getValidMoves(this.aiRole);
                if (valid.length > 0) aiMove = valid[0];
            }
            if (aiMove && this.game.makeMove(aiMove)) {
                this.moveCount++;
                this.playSound('ai_move');
                this.renderBoard();
                this.renderMoveHistory();
                this.updateTurnUI();

                if (this.game.winner) {
                    this.handleGameOver();
                }
            } else {
                const valid = this.game.getValidMoves(this.aiRole);
                if (valid.length > 0 && this.game.makeMove(valid[0])) {
                    this.moveCount++;
                    this.playSound('ai_move');
                    this.renderBoard();
                    this.renderMoveHistory();
                    this.updateTurnUI();
                }
            }
        } catch (e) {
            console.error('AI turn error caught:', e);
            this.game.currentPlayer = this.aiRole;
            const valid = this.game.getValidMoves(this.aiRole);
            if (valid.length > 0 && this.game.makeMove(valid[0])) {
                this.moveCount++;
                this.renderBoard();
                this.renderMoveHistory();
                this.updateTurnUI();
            }
        }
    }

    handleUndo() {
        if (this.game.winner || this.game.history.length === 0) return;
        if (this.aiTimer) {
            clearTimeout(this.aiTimer);
            this.aiTimer = null;
        }
        const steps = (this.gameMode === 'pvp') ? 1 : 2;
        this.game.undo(steps);
        this.moveCount = Math.max(0, this.moveCount - steps);
        this.playSound('undo');
        this.renderBoard();
        this.renderMoveHistory();
        this.updateTurnUI();
    }

    handleHint() {
        if (this.game.winner) return;
        const activeColor = (this.gameMode === 'pvp') ? this.game.currentPlayer : this.playerRole;
        const tempAI = new BridgItAI('master', activeColor);
        const hintMove = tempAI.getBestMove(this.game);
        if (hintMove) {
            const line = this.dom.svg.querySelector(`[data-id="${hintMove}"]`);
            if (line) {
                line.classList.add('hint-pulse');
                setTimeout(() => line.classList.remove('hint-pulse'), 2000);
                this.playSound('hint');
            }
        }
    }

    handleGameOver() {
        this.stopTimer();
        const winner = this.game.winner;
        this.playSound('win');

        let winnerName, subMessage;

        if (this.gameMode === 'pvp') {
            const roleName = winner === 'blue' ? '🔵 蓝方 (玩家1·上下连通)' : '🔴 红方 (玩家2·左右连通)';
            winnerName = `🎉 ${roleName} 获胜了！`;
            subMessage = `经过 ${this.moveCount} 步同屏对决，用时 ${this.dom.timerDisplay.textContent}，成功连通了目标路线！`;
        } else {
            const isPlayerWin = (winner === this.playerRole);
            const roleName = winner === 'blue' ? '🔵 蓝方(上下连通)' : '🔴 红方(左右连通)';
            winnerName = isPlayerWin ? `${roleName} [玩家] 获胜了！🎉` : `${roleName} [电脑] 获胜了 🤖`;
            subMessage = isPlayerWin 
                ? `经过 ${this.moveCount} 步，用时 ${this.dom.timerDisplay.textContent}，成功连通了目标路线！`
                : `电脑拦截并率先完成了线路连通。再接再厉！`;

            // Record stats only in PvE mode
            const winnerTag = isPlayerWin ? 'player' : 'ai';
            this.stats.recordMatch(this.boardSize, this.difficulty, this.playerRole, this.aiRole, winnerTag);
            this.updateHeaderStatsDisplay();
        }

        this.dom.victoryTitle.textContent = winnerName;
        this.dom.victorySub.textContent = subMessage;
        this.showModal('victoryModal');
    }

    renderStatsTable() {
        const sizes = ['3x4', '4x5', '5x6', '6x7', '7x8', '8x9'];
        const diffs = [
            { key: 'beginner', name: '入门' },
            { key: 'normal', name: '普通' },
            { key: 'hard', name: '困难' },
            { key: 'master', name: '大师' }
        ];

        let html = '<table class="stats-table"><thead><tr><th>尺寸\\难度</th>';
        diffs.forEach(d => html += `<th>${d.name}</th>`);
        html += '</tr></thead><tbody>';

        sizes.forEach(sz => {
            html += `<tr><td><strong>${sz}</strong></td>`;
            diffs.forEach(d => {
                const s = this.stats.getStatsFor(sz, d.key);
                html += `<td>${s.played > 0 ? `${s.winRate}% <small>(${s.playerWins}/${s.played})</small>` : '-'}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';

        const overall = this.stats.getOverallStats();
        html += `<div class="overall-summary">总对局数：<strong>${overall.played}</strong> | 人机胜率：<strong>${overall.winRate}% (${overall.playerWins}胜)</strong></div>`;
        this.dom.statsBody.innerHTML = html;
    }

    showModal(modalId) {
        this.dom[modalId].style.display = 'flex';
    }

    hideModal(modalId) {
        this.dom[modalId].style.display = 'none';
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            const now = this.audioCtx.currentTime;
            if (type === 'move') {
                osc.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'ai_move') {
                osc.frequency.setValueAtTime(330, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'win') {
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.1);
                osc.frequency.setValueAtTime(783.99, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'hint') {
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.bridgItUI = new BridgItUI();
});
