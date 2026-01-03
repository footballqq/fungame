class FoxGame {
    constructor() {
        this.minHoles = 2;
        this.maxHoles = 10;
        this.holes = 5;
        this.foxPosition = -1;
        this.day = 1;
        this.history = []; // Array of { fox: int, player: int, result: str }
        this.isGameOver = false;
        this.difficulty = 'easy';
        this.isReplaying = false;
        this.isProcessingTurn = false;
        this.hasCheckedToday = false;

        // Hard (cheat) mode state: track a set of possible fox positions (0-based).
        this.possibleFoxPositions = null;
        this.possibleFoxStartSets = [];

        this.ui = {
            holesContainer: document.getElementById('holes-container'),
            message: document.getElementById('message'),
            dayCount: document.getElementById('day-count'),
            logList: document.getElementById('game-log'),
            replayControls: document.getElementById('replay-controls'),
            holesSelect: document.getElementById('holes-count'),
            holesTitleCount: document.getElementById('holes-count-title'),

            // Difficulty Buttons
            modeEasy: document.getElementById('mode-easy'),
            modeHard: document.getElementById('mode-hard'),

            restartBtn: document.getElementById('restart-btn'),

            // Replay & Result UI
            prevBtn: document.getElementById('prev-step'),
            nextBtn: document.getElementById('next-step'),
            autoPlayBtn: document.getElementById('auto-play'),
            shareBtn: document.getElementById('share-btn'),
            restartEndBtn: document.getElementById('restart-end-btn'),
            stepInfo: document.getElementById('step-info'),
            copyDebugBtn: document.getElementById('copy-debug-btn'),

            // Modal
            introModal: document.getElementById('intro-modal'),
            startBtn: document.getElementById('start-game-btn'),
            introHolesCount: document.getElementById('intro-holes-count'),
            introHolesCountInline: document.getElementById('intro-holes-count-inline'),

            // Strategy Modal
            strategyBtn: document.getElementById('strategy-btn'),
            strategyModal: document.getElementById('strategy-modal'),
            closeStrategyBtn: document.getElementById('close-strategy-btn'),
            strategyHolesCount: document.getElementById('strategy-holes-count'),
            strategyDays: document.getElementById('strategy-days'),
            strategySeq: document.getElementById('strategy-seq')
        };

        this.init();
    }

    init() {
        this.setupHoleSelector();
        this.updateHoleCountUI();
        this.updateStrategyUI();
        this.bindEvents();
        // Don't auto-start, wait for modal
    }

    bindEvents() {
        this.ui.restartBtn.addEventListener('click', () => this.startNewGame());
        this.ui.restartEndBtn.addEventListener('click', () => this.startNewGame());

        // Difficulty Toggles
        this.ui.modeEasy.addEventListener('click', () => this.setDifficulty('easy'));
        this.ui.modeHard.addEventListener('click', () => this.setDifficulty('hard'));

        if (this.ui.holesSelect) {
            this.ui.holesSelect.addEventListener('change', (e) => {
                const next = parseInt(e.target.value, 10);
                this.setHoleCount(next);
            });
        }

        this.ui.startBtn.addEventListener('click', () => {
            this.ui.introModal.classList.add('hidden');
            this.startNewGame();
        });

        // Strategy Events
        this.ui.strategyBtn.addEventListener('click', () => {
            this.ui.strategyModal.classList.remove('hidden');
        });
        this.ui.closeStrategyBtn.addEventListener('click', () => {
            this.ui.strategyModal.classList.add('hidden');
        });

        // Replay events
        this.ui.prevBtn.addEventListener('click', () => this.replayStep(-1));
        this.ui.nextBtn.addEventListener('click', () => this.replayStep(1));
        this.ui.autoPlayBtn.addEventListener('click', () => this.autoPlayReplay());
        this.ui.shareBtn.addEventListener('click', () => this.shareResult());
        this.ui.copyDebugBtn.addEventListener('click', () => this.copyDebugLogs());
    }

    isCheatMode() {
        return this.difficulty === 'hard';
    }

    setupHoleSelector() {
        if (!this.ui.holesSelect) return;

        this.ui.holesSelect.innerHTML = '';
        for (let i = this.minHoles; i <= this.maxHoles; i++) {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `${i}`;
            this.ui.holesSelect.appendChild(opt);
        }
        this.ui.holesSelect.value = String(this.holes);
    }

    setHoleCount(count) {
        if (!Number.isFinite(count)) return;
        const clamped = Math.max(this.minHoles, Math.min(this.maxHoles, count));
        if (clamped === this.holes) return;

        this.holes = clamped;
        if (this.ui.holesSelect) this.ui.holesSelect.value = String(this.holes);
        this.updateHoleCountUI();
        this.updateStrategyUI();

        // Only restart if the game has started (intro modal hidden).
        const hasStarted = this.ui.introModal?.classList.contains('hidden');
        if (hasStarted) this.startNewGame();
    }

    updateHoleCountUI() {
        const text = String(this.holes);
        if (this.ui.holesTitleCount) this.ui.holesTitleCount.textContent = text;
        if (this.ui.introHolesCount) this.ui.introHolesCount.textContent = text;
        if (this.ui.introHolesCountInline) this.ui.introHolesCountInline.textContent = text;
        if (this.ui.strategyHolesCount) this.ui.strategyHolesCount.textContent = text;
    }

    getGuaranteedDays(holeCount) {
        if (holeCount <= 2) return 2;
        return 2 * holeCount - 4;
    }

    getWinningSequence(holeCount) {
        if (holeCount <= 1) return [];
        if (holeCount === 2) return [1, 1];

        const max = holeCount - 1;
        const forward = [];
        for (let i = 2; i <= max; i++) forward.push(i);
        const backward = [];
        for (let i = max; i >= 2; i--) backward.push(i);
        return [...forward, ...backward];
    }

    updateStrategyUI() {
        if (!this.ui.strategyDays || !this.ui.strategySeq) return;

        const days = this.getGuaranteedDays(this.holes);
        this.ui.strategyDays.textContent = String(days);

        const seq = this.getWinningSequence(this.holes);
        this.ui.strategySeq.textContent = seq.length ? seq.join(' → ') : '';
    }

    setDifficulty(mode) {
        this.difficulty = mode;
        this.ui.modeEasy.classList.toggle('active', mode === 'easy');
        this.ui.modeHard.classList.toggle('active', mode === 'hard');
        this.startNewGame();
    }

    startNewGame() {
        // Sync from selector if present
        if (this.ui.holesSelect) {
            const selected = parseInt(this.ui.holesSelect.value, 10);
            if (Number.isFinite(selected)) this.holes = Math.max(this.minHoles, Math.min(this.maxHoles, selected));
        }
        this.updateHoleCountUI();
        this.updateStrategyUI();

        this.isGameOver = false;
        this.isReplaying = false;
        this.isProcessingTurn = false;
        this.hasCheckedToday = false;
        this.day = 1;
        this.history = [];
        this.possibleFoxStartSets = [];

        if (this.isCheatMode()) {
            this.foxPosition = -1;
            this.possibleFoxPositions = new Set();
            for (let i = 0; i < this.holes; i++) this.possibleFoxPositions.add(i);
        } else {
            this.possibleFoxPositions = null;
            this.foxPosition = Math.floor(Math.random() * this.holes);
        }

        // Ensure UI reset
        this.ui.holesContainer.innerHTML = '';
        this.ui.holesContainer.classList.remove('disabled');
        this.ui.logList.innerHTML = '';
        this.ui.replayControls.classList.add('hidden');
        this.ui.copyDebugBtn.classList.add('hidden');
        this.ui.message.textContent = "请选择一个洞口检查...";
        this.ui.message.style.color = 'inherit';
        this.readoutDay();

        // Render holes
        for (let i = 0; i < this.holes; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'hole-wrapper';
            wrapper.dataset.index = i + 1; // Display 1-5

            // Interaction
            wrapper.addEventListener('click', () => this.checkHole(i));

            const hole = document.createElement('div');
            hole.className = 'hole';

            const content = document.createElement('div');
            content.className = 'content';
            content.id = `content-${i}`;
            // Placeholder content, will be set on check or reveal
            content.textContent = '';

            wrapper.appendChild(hole);
            wrapper.appendChild(content);
            this.ui.holesContainer.appendChild(wrapper);
        }
    }

    readoutDay() {
        this.ui.dayCount.textContent = this.day;
    }

    getAdjacentPositions(pos) {
        const moves = [];
        if (pos > 0) moves.push(pos - 1);
        if (pos < this.holes - 1) moves.push(pos + 1);
        return moves;
    }

    canCheatBeForcedCaughtAt(index) {
        return this.possibleFoxPositions &&
            this.possibleFoxPositions.size === 1 &&
            this.possibleFoxPositions.has(index);
    }

    async checkHole(index) {
        if (this.isGameOver || this.isReplaying || this.isProcessingTurn || this.hasCheckedToday) return;

        this.isProcessingTurn = true;
        this.hasCheckedToday = true;
        this.ui.holesContainer.classList.add('disabled');

        const wrapper = this.ui.holesContainer.children[index];

        // Visual feedback
        wrapper.classList.add('checked');
        const content = document.getElementById(`content-${index}`);

        // Record state BEFORE move for history
        if (this.isCheatMode() && this.possibleFoxPositions) {
            this.possibleFoxStartSets.push(new Set(this.possibleFoxPositions));
        }

        const foxPosAtStart = this.isCheatMode() ? null : this.foxPosition;
        const turnRecord = {
            day: this.day,
            foxPosAtStart,
            playerCheck: index,
            caught: false
        };

        const caught = this.isCheatMode()
            ? this.canCheatBeForcedCaughtAt(index)
            : (this.foxPosition === index);

        if (caught) {
            // CAUGHT!
            content.textContent = "🦊";
            content.style.opacity = "1"; // Ensure REAL image (solid)
            this.ui.message.textContent = "你抓住了狐狸！恭喜获胜！";
            this.ui.message.style.color = "green";
            turnRecord.caught = true;
            turnRecord.foxPosAtStart = this.isCheatMode() ? index : this.foxPosition;
            this.history.push(turnRecord);
            this.isProcessingTurn = false;
            this.endGame(true);
            return;
        } else {
            // MISS
            content.textContent = "💨"; // Dust/Empty
            content.style.opacity = "0.5";
            this.ui.message.textContent = "这里没有狐狸...";
            this.addLog(`第 ${this.day} 天：你查了 ${index + 1} 号`);

            this.history.push(turnRecord);

            // Wait a moment then Night Phase
            await this.wait(1000);
            await this.nightPhase(index);
            this.hasCheckedToday = false;
            this.isProcessingTurn = false;
            this.ui.holesContainer.classList.remove('disabled');
        }
    }

    async nightPhase(lastPlayerCheckIndex) {
        // Reset Visuals
        Array.from(this.ui.holesContainer.children).forEach(el => {
            el.classList.remove('checked');
            el.querySelector('.content').textContent = '';
            el.querySelector('.content').style.opacity = '';
            el.querySelector('.content').style.transform = '';
        });

        this.ui.message.textContent = "天黑了，狐狸正在移动...";

        await this.wait(1000); // Suspense

        if (this.isCheatMode()) this.advanceCheatFoxAfterNight(lastPlayerCheckIndex);
        else this.moveFox();
        this.day++;
        this.readoutDay();
        this.ui.message.textContent = "天亮了，狐狸已搬家。请继续寻找！";
    }

    advanceCheatFoxAfterNight(lastPlayerCheckIndex) {
        if (!this.possibleFoxPositions) return;

        // If the player didn't catch, the fox cannot be in the checked hole at day start.
        this.possibleFoxPositions.delete(lastPlayerCheckIndex);

        // Then the fox must move to an adjacent hole at night.
        const next = new Set();
        for (const pos of this.possibleFoxPositions) {
            for (const n of this.getAdjacentPositions(pos)) next.add(n);
        }

        this.possibleFoxPositions = next;
    }

    moveFox() {
        const possibleMoves = this.getAdjacentPositions(this.foxPosition);
        const nextPos = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        this.foxPosition = nextPos;
    }

    endGame(won) {
        this.isGameOver = true;
        this.ui.replayControls.classList.remove('hidden');
        this.ui.copyDebugBtn.classList.remove('hidden');
        if (this.isCheatMode()) this.finalizeCheatFoxPath();
        this.setupReplay();
        this.revealLogs();
    }

    addLog(text) {
        const li = document.createElement('li');
        li.textContent = text;
        this.ui.logList.prepend(li); // Newest on top
    }

    revealLogs() {
        this.ui.logList.innerHTML = '';

        // Iterate backwards to show newest first
        for (let i = this.history.length - 1; i >= 0; i--) {
            const turn = this.history[i];
            const li = document.createElement('li');

            // Build text content
            const leftSpan = document.createElement('span');
            const resultIcon = turn.caught ? "✅" : "❌";
            leftSpan.textContent = `第 ${turn.day} 天：查 ${turn.playerCheck + 1} ${resultIcon}`;

            const rightSpan = document.createElement('span');
            rightSpan.className = 'fox-loc';
            rightSpan.textContent = Number.isFinite(turn.foxPosAtStart)
                ? ` [狐狸在 ${turn.foxPosAtStart + 1}]`
                : ` [狐狸在 ?]`;

            li.appendChild(leftSpan);
            li.appendChild(rightSpan);

            this.ui.logList.appendChild(li);
        }
    }

    finalizeCheatFoxPath() {
        if (!this.possibleFoxStartSets.length || this.possibleFoxStartSets.length !== this.history.length) return;
        const last = this.history.length - 1;
        if (last < 0) return;
        if (!this.history[last].caught) return;

        const path = new Array(this.history.length);
        path[last] = this.history[last].playerCheck;

        for (let i = last - 1; i >= 0; i--) {
            const nextPos = path[i + 1];
            const startSet = this.possibleFoxStartSets[i];
            const avoid = this.history[i].playerCheck;

            const adjacent = this.getAdjacentPositions(nextPos).filter(p => startSet.has(p));
            const adjacentNonAvoid = adjacent.filter(p => p !== avoid);

            if (adjacentNonAvoid.length) path[i] = adjacentNonAvoid[0];
            else if (adjacent.length) path[i] = adjacent[0];
            else {
                const anyNonAvoid = [...startSet].find(p => p !== avoid);
                path[i] = (anyNonAvoid !== undefined) ? anyNonAvoid : [...startSet][0];
            }
        }

        for (let i = 0; i < this.history.length; i++) {
            this.history[i].foxPosAtStart = path[i];
        }
    }

    copyDebugLogs() {
        let logText = "=== 🦊 Game Debug Log ===\n";
        logText += `Holes: ${this.holes}\n`;
        logText += `Difficulty: ${this.difficulty}\n`;
        logText += `Total Days: ${this.history.length}\n\n`;

        this.history.forEach(turn => {
            const foxText = Number.isFinite(turn.foxPosAtStart) ? (turn.foxPosAtStart + 1) : '?';
            logText += `Day ${turn.day}: Fox@${foxText} | PlayerChecked@${turn.playerCheck + 1} | Result: ${turn.caught ? 'WIN' : 'MISS'}\n`;
        });

        navigator.clipboard.writeText(logText).then(() => {
            const originalText = this.ui.copyDebugBtn.textContent;
            this.ui.copyDebugBtn.textContent = "✅ 已复制";
            setTimeout(() => {
                this.ui.copyDebugBtn.textContent = originalText;
            }, 2000);
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    shareResult() {
        const diffText = this.difficulty === 'easy' ? '简单' : '困难';
        const title = `🦊 ${this.holes}洞抓狐狸挑战成功！`;
        const textToShare = `${title} 网址：https://circlecal.pages.dev/fox/ （复制到浏览器使用）\n\n洞口数：${this.holes}\n难度：${diffText}\n用时：${this.day} 天\n\n快来试试你能几天抓到！`;

        navigator.clipboard.writeText(textToShare).then(() => {
            const originalText = this.ui.shareBtn.textContent;
            this.ui.shareBtn.textContent = "✅ 已复制";
            setTimeout(() => {
                this.ui.shareBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            alert("复制失败，请截图分享！");
        });
    }

    // --- REPLAY SYSTEM ---

    setupReplay() {
        this.replayIndex = 0;
        this.ui.stepInfo.textContent = `0 / ${this.history.length}`;
        this.ui.prevBtn.disabled = true;
        this.ui.nextBtn.disabled = false;
        this.isReplaying = true;
    }

    replayStep(direction) {
        const newIndex = this.replayIndex + direction;
        if (newIndex < 0 || newIndex > this.history.length) return;

        this.replayIndex = newIndex;
        this.ui.stepInfo.textContent = `${this.replayIndex} / ${this.history.length}`;

        this.renderReplayState(this.replayIndex);

        this.ui.prevBtn.disabled = (this.replayIndex === 0);
        this.ui.nextBtn.disabled = (this.replayIndex === this.history.length);
    }

    renderReplayState(stepIndex) {
        // Reset board
        Array.from(this.ui.holesContainer.children).forEach(el => {
            el.classList.remove('checked');
            el.querySelector('.content').textContent = '';
            el.querySelector('.content').style.opacity = '';
            el.querySelector('.hole').style.background = '';
            el.querySelector('.content').style.transform = '';
        });

        if (stepIndex === 0) return; // Start state

        const turn = this.history[stepIndex - 1];
        if (!Number.isFinite(turn.foxPosAtStart)) return;

        // Show Fox
        const foxHole = this.ui.holesContainer.children[turn.foxPosAtStart];
        foxHole.querySelector('.content').textContent = "🦊";

        if (turn.caught) {
            foxHole.querySelector('.content').style.opacity = "1";
        } else {
            foxHole.querySelector('.content').style.opacity = "0.6";
        }

        foxHole.querySelector('.content').style.transform = "translateX(-50%) translateY(-20px)";

        // Show Player Check
        const playerHole = this.ui.holesContainer.children[turn.playerCheck];
        playerHole.classList.add('checked');

        if (turn.caught) {
            // Already showing
        } else {
            if (turn.playerCheck !== turn.foxPosAtStart) {
                playerHole.querySelector('.content').textContent = "❌";
                playerHole.querySelector('.content').style.opacity = "1";
                playerHole.querySelector('.content').style.transform = "translateX(-50%) translateY(-20px)";
            }
        }

        this.ui.message.textContent = `回放：第 ${turn.day} 天，狐狸在 ${turn.foxPosAtStart + 1} 号，你查了 ${turn.playerCheck + 1} 号`;
    }

    async autoPlayReplay() {
        this.replayIndex = 0;
        while (this.replayIndex < this.history.length) {
            this.replayStep(1);
            await this.wait(1500);
        }
    }
}

// Start Game
window.addEventListener('DOMContentLoaded', () => {
    new FoxGame();
});
