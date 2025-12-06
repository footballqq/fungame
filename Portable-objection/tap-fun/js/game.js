// game.js - 游戏主循环
const Game = {
    state: 'menu', // menu, countdown, racing, paused, finished
    mode: '100m',
    difficulty: 'normal',
    players: [],
    startTime: 0,
    elapsedTime: 0,
    lastFrameTime: 0,
    animationId: null,
    countdownValue: 3,

    // DOM 元素
    screens: {},
    elements: {},

    init() {
        this.cacheDOM();
        this.bindEvents();
        Track.init('track-canvas');
        Motion.enableKeyboard();
        Motion.enableMouse(document.getElementById('track-canvas'));
        Motion.setCallback(this.handleInput.bind(this));
    },

    cacheDOM() {
        this.screens = {
            menu: document.getElementById('menu'),
            game: document.getElementById('game'),
            result: document.getElementById('result'),
            records: document.getElementById('records'),
            pause: document.getElementById('pause')
        };

        this.elements = {
            distance: document.getElementById('distance'),
            timer: document.getElementById('timer'),
            statusText: document.getElementById('status-text'),
            countdown: document.getElementById('countdown'),
            speedBar: document.getElementById('speed-bar'),
            difficulty: document.getElementById('difficulty'),
            btnMusic: document.getElementById('btn-music'),
            btnRecords: document.getElementById('btn-records'),
            btnPause: document.getElementById('btn-pause'),
            btnResume: document.getElementById('btn-resume'),
            btnQuit: document.getElementById('btn-quit'),
            btnRetry: document.getElementById('btn-retry'),
            btnHome: document.getElementById('btn-home'),
            btnRecordsClose: document.getElementById('btn-records-close'),
            resultTitle: document.getElementById('result-title'),
            resultRanking: document.getElementById('result-ranking'),
            resultTime: document.getElementById('result-time'),
            resultRecord: document.getElementById('result-record'),
            recordsList: document.getElementById('records-list')
        };
    },

    bindEvents() {
        // 模式选择
        document.querySelectorAll('.menu-btn[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                this.mode = btn.dataset.mode;
                this.startGame();
            });
        });

        // 难度选择
        this.elements.difficulty.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        // 音乐开关
        this.elements.btnMusic.addEventListener('click', () => {
            const enabled = GameAudio.toggle();
            this.elements.btnMusic.textContent = enabled ? '🔊' : '🔇';
            this.elements.btnMusic.classList.toggle('muted', !enabled);
        });

        // 记录查看
        this.elements.btnRecords.addEventListener('click', () => this.showRecords());
        this.elements.btnRecordsClose.addEventListener('click', () => this.hideRecords());

        // 暂停/继续
        this.elements.btnPause.addEventListener('click', () => this.pause());
        this.elements.btnResume.addEventListener('click', () => this.resume());
        this.elements.btnQuit.addEventListener('click', () => this.quitToMenu());

        // 结果界面
        this.elements.btnRetry.addEventListener('click', () => this.startGame());
        this.elements.btnHome.addEventListener('click', () => this.quitToMenu());
    },

    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[name].classList.add('active');
    },

    startGame() {
        this.state = 'countdown';
        this.players = createPlayers(this.difficulty);
        Track.setMode(this.mode);
        this.elapsedTime = 0;
        this.countdownValue = 3;
        
        this.showScreen('game');
        this.elements.countdown.textContent = '';
        this.elements.statusText.textContent = '准备...';
        this.elements.distance.textContent = '0m';
        this.elements.timer.textContent = '00:00.00';
        this.elements.speedBar.style.width = '0%';
        
        // 确保canvas尺寸正确并渲染初始画面
        setTimeout(() => {
            Track.resize();
            Track.render(this.players);
        }, 50);
        
        Motion.init();
        
        setTimeout(() => this.runCountdown(), 500);
    },

    runCountdown() {
        if (this.countdownValue > 0) {
            this.elements.countdown.textContent = this.countdownValue;
            GameAudio.playCountdown(false);
            this.countdownValue--;
            setTimeout(() => this.runCountdown(), 1000);
        } else {
            this.elements.countdown.textContent = 'GO!';
            GameAudio.playCountdown(true);
            GameAudio.startBGM();
            
            setTimeout(() => {
                this.elements.countdown.textContent = '';
                this.state = 'racing';
                this.startTime = Date.now();
                this.lastFrameTime = performance.now();
                this.gameLoop();
            }, 500);
        }
    },

    gameLoop() {
        if (this.state !== 'racing') return;
        
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        this.elapsedTime = Date.now() - this.startTime;
        
        // 更新玩家
        this.players.forEach(player => {
            player.update(deltaTime, Track.hurdles, Track.raceDistance);
            
            // 检查栏架碰撞
            if (this.mode === '110m' && !player.isPlayer) {
                player.checkHurdleCollision(Track.hurdles);
            }
        });
        
        // 玩家栏架碰撞
        const humanPlayer = this.players.find(p => p.isPlayer);
        if (this.mode === '110m' && humanPlayer.checkHurdleCollision(Track.hurdles)) {
            GameAudio.playFall();
        }
        
        // 检查比赛结束
        const allFinished = this.players.every(p => p.finished);
        if (allFinished) {
            this.endRace();
            return;
        }
        
        // 记录完成时间
        this.players.forEach(player => {
            if (player.finished && !player.finishTime) {
                player.finishTime = this.elapsedTime;
            }
        });
        
        // 更新UI
        this.updateUI();
        
        // 渲染
        Track.render(this.players);
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },

    updateUI() {
        const humanPlayer = this.players.find(p => p.isPlayer);
        
        this.elements.distance.textContent = `${Math.floor(humanPlayer.distance)}m`;
        this.elements.timer.textContent = Storage.formatTime(this.elapsedTime);
        
        // 速度条
        const speedPercent = (humanPlayer.speed / humanPlayer.maxSpeed) * 100;
        this.elements.speedBar.style.width = `${speedPercent}%`;
        
        // 状态文本
        let status = '跑步中 🏃';
        if (humanPlayer.isFallen) {
            status = '摔倒了 💫';
        } else if (humanPlayer.isJumping) {
            status = '跳跃中 🦘';
        } else if (humanPlayer.finished) {
            status = '完成! 🎉';
        }
        this.elements.statusText.textContent = status;
    },

    handleInput(action, magnitude) {
        if (this.state !== 'racing') return;
        
        const humanPlayer = this.players.find(p => p.isPlayer);
        if (!humanPlayer || humanPlayer.finished) return;
        
        switch (action) {
            case 'run':
                humanPlayer.run();
                GameAudio.playRun();
                break;
            case 'jump':
                humanPlayer.jump();
                GameAudio.playJump();
                break;
            case 'fall':
                humanPlayer.fall();
                GameAudio.playFall();
                break;
        }
    },

    endRace() {
        this.state = 'finished';
        cancelAnimationFrame(this.animationId);
        GameAudio.stopBGM();
        
        // 确保所有玩家都有完成时间
        const humanPlayer = this.players.find(p => p.isPlayer);
        this.players.forEach(player => {
            if (!player.finishTime) {
                player.finishTime = this.elapsedTime;
            }
        });
        
        // 排名 - 按完成时间排序
        const sorted = [...this.players].sort((a, b) => a.finishTime - b.finishTime);
        const rank = sorted.findIndex(p => p.isPlayer) + 1;
        
        // 保存成绩
        const isNewRecord = Storage.saveRecord(this.mode, humanPlayer.finishTime, rank);
        
        // 显示结果
        this.showResult(rank, humanPlayer.finishTime, isNewRecord);
    },

    showResult(rank, time, isNewRecord) {
        const rankText = ['🥇 第一名!', '🥈 第二名', '🥉 第三名'][rank - 1];
        const rankClass = `rank-${rank}`;
        
        this.elements.resultTitle.textContent = rank === 1 ? '🎉 胜利!' : '比赛结束';
        this.elements.resultRanking.innerHTML = `<span class="${rankClass}">${rankText}</span>`;
        this.elements.resultTime.textContent = Storage.formatTime(time);
        this.elements.resultRecord.textContent = isNewRecord ? '🌟 新纪录!' : '';
        
        GameAudio.playFinish(rank === 1);
        
        this.showScreen('result');
    },

    pause() {
        if (this.state !== 'racing') return;
        this.state = 'paused';
        cancelAnimationFrame(this.animationId);
        GameAudio.stopBGM();
        this.screens.pause.classList.add('active');
    },

    resume() {
        if (this.state !== 'paused') return;
        this.screens.pause.classList.remove('active');
        this.state = 'racing';
        this.lastFrameTime = performance.now();
        GameAudio.startBGM();
        this.gameLoop();
    },

    quitToMenu() {
        this.state = 'menu';
        cancelAnimationFrame(this.animationId);
        GameAudio.stopBGM();
        this.screens.pause.classList.remove('active');
        this.showScreen('menu');
    },

    showRecords() {
        const records = Storage.getRecords();
        let html = '';
        
        ['100m', '110m'].forEach(mode => {
            html += `<h3 style="color: var(--primary); margin: 15px 0 10px;">${mode}</h3>`;
            const modeRecords = records[mode] || [];
            
            if (modeRecords.length === 0) {
                html += '<p style="color: var(--text-dim);">暂无记录</p>';
            } else {
                modeRecords.slice(0, 5).forEach((record, i) => {
                    html += `
                        <div class="record-item">
                            <span class="record-rank">#${i + 1}</span>
                            <span class="record-time">${Storage.formatTime(record.time)}</span>
                            <span class="record-date">${Storage.formatDate(record.date)}</span>
                        </div>
                    `;
                });
            }
        });
        
        this.elements.recordsList.innerHTML = html;
        this.showScreen('records');
    },

    hideRecords() {
        this.showScreen('menu');
    }
};

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
