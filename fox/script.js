class FoxGame {
    constructor() {
        this.holes = 5;
        this.foxPosition = -1;
        this.day = 1;
        this.history = []; // Array of { fox: int, player: int, result: str }
        this.isGameOver = false;
        this.difficulty = 'easy';
        this.isReplaying = false;

        this.ui = {
            holesContainer: document.getElementById('holes-container'),
            message: document.getElementById('message'),
            dayCount: document.getElementById('day-count'),
            logList: document.getElementById('game-log'),
            replayControls: document.getElementById('replay-controls'),

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

            // Strategy Modal
            strategyBtn: document.getElementById('strategy-btn'),
            strategyModal: document.getElementById('strategy-modal'),
            closeStrategyBtn: document.getElementById('close-strategy-btn')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        // Don't auto-start, wait for modal
    }

    bindEvents() {
        this.ui.restartBtn.addEventListener('click', () => this.startNewGame());
        this.ui.restartEndBtn.addEventListener('click', () => this.startNewGame());

        // Difficulty Toggles
        this.ui.modeEasy.addEventListener('click', () => this.setDifficulty('easy'));
        this.ui.modeHard.addEventListener('click', () => this.setDifficulty('hard'));

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

    setDifficulty(mode) {
        this.difficulty = mode;
        this.ui.modeEasy.classList.toggle('active', mode === 'easy');
        this.ui.modeHard.classList.toggle('active', mode === 'hard');
        this.startNewGame();
    }

    startNewGame() {
        this.isGameOver = false;
        this.isReplaying = false;
        this.day = 1;
        this.history = [];
        this.foxPosition = Math.floor(Math.random() * this.holes);

        // Ensure UI reset
        this.ui.holesContainer.innerHTML = '';
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

    async checkHole(index) {
        if (this.isGameOver || this.isReplaying) return;

        const wrapper = this.ui.holesContainer.children[index];
        if (wrapper.classList.contains('checked')) return; // Already checked today?

        // Visual feedback
        wrapper.classList.add('checked');
        const content = document.getElementById(`content-${index}`);

        // Record state BEFORE move for history
        const turnRecord = {
            day: this.day,
            foxPosAtStart: this.foxPosition,
            playerCheck: index,
            caught: false
        };

        if (this.foxPosition === index) {
            // CAUGHT!
            content.textContent = "🦊";
            content.style.opacity = "1"; // Ensure REAL image (solid)
            this.ui.message.textContent = "你抓住了狐狸！恭喜获胜！";
            this.ui.message.style.color = "green";
            turnRecord.caught = true;
            this.history.push(turnRecord);
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
            this.nightPhase(index);
        }
    }

    async nightPhase(lastPlayerCheckIndex) {
        // Reset Visuals
        Array.from(this.ui.holesContainer.children).forEach(el => {
            el.classList.remove('checked');
            el.querySelector('.content').textContent = '';
            el.querySelector('.content').style.opacity = '';
        });

        this.ui.message.textContent = "天黑了，狐狸正在移动...";

        await this.wait(1000); // Suspense

        this.moveFox(lastPlayerCheckIndex);
        this.day++;
        this.readoutDay();
        this.ui.message.textContent = "天亮了，狐狸已搬家。请继续寻找！";
    }

    moveFox(lastPlayerCheckIndex) {
        const current = this.foxPosition;
        let possibleMoves = [];

        if (current === 0) possibleMoves = [1];
        else if (current === this.holes - 1) possibleMoves = [this.holes - 2];
        else possibleMoves = [current - 1, current + 1];

        let nextPos;

        if (this.difficulty === 'easy') {
            nextPos = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        } else {
            // HARD MODE
            const preferredMove = possibleMoves.find(p => p === lastPlayerCheckIndex);
            if (preferredMove !== undefined) {
                // 70% chance to take the "smart" move
                nextPos = (Math.random() < 0.7) ? preferredMove : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            } else {
                nextPos = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            }
        }

        this.foxPosition = nextPos;
        console.log(`Debug: Fox moved to ${nextPos}`);
    }

    endGame(won) {
        this.isGameOver = true;
        this.ui.replayControls.classList.remove('hidden');
        this.ui.copyDebugBtn.classList.remove('hidden');
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
            rightSpan.textContent = ` [狐狸在 ${turn.foxPosAtStart + 1}]`; // Removed parens, used brackets

            li.appendChild(leftSpan);
            li.appendChild(rightSpan);

            this.ui.logList.appendChild(li);
        }
        console.log("Logs revealed with Fox positions.");
    }

    copyDebugLogs() {
        let logText = "=== 🦊 Game Debug Log ===\n";
        logText += `Difficulty: ${this.difficulty}\n`;
        logText += `Total Days: ${this.history.length}\n\n`;

        this.history.forEach(turn => {
            logText += `Day ${turn.day}: Fox@${turn.foxPosAtStart + 1} | PlayerChecked@${turn.playerCheck + 1} | Result: ${turn.caught ? 'WIN' : 'MISS'}\n`;
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
        const textToShare = `🦊 五洞抓狐狸挑战成功！\n\n难度：${diffText}\n用时：${this.day} 天\n\n快来试试你能几天抓到！`;

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
        });

        if (stepIndex === 0) return; // Start state

        const turn = this.history[stepIndex - 1];

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
