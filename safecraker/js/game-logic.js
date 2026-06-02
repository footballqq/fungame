// codex: 2026-06-02 增加 Web Audio API 胜利音乐与爆竹声合成器，优化 Canvas 烟花大爆发动画
// Safe Cracker 50 - game-logic.js

/**
 * WinAudio - 网页音频合成器
 * 播放喜庆的胜利凯旋乐章和爆竹炸裂声（纯 Web Audio API 合成，无需外部音频资源）
 */
class WinAudio {
    static play() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            const playTone = (freq, type, startTime, duration, startVol, endVol) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, startTime);
                
                gain.gain.setValueAtTime(startVol, startTime);
                gain.gain.exponentialRampToValueAtTime(endVol, startTime + duration);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            const now = ctx.currentTime;
            
            // 播放喜庆的凯旋乐章 (C大调和弦上升音符，充满胜利感)
            const fanfare = [
                { note: 261.63, time: 0.0, dur: 0.15 },  // C4
                { note: 329.63, time: 0.15, dur: 0.15 }, // E4
                { note: 392.00, time: 0.30, dur: 0.15 }, // G4
                { note: 523.25, time: 0.45, dur: 0.3 },  // C5
                { note: 392.00, time: 0.75, dur: 0.15 }, // G4
                { note: 523.25, time: 0.90, dur: 0.6 }   // C5
            ];

            fanfare.forEach(f => {
                // 三角形波产生亮丽的类似黄铜乐器的质感
                playTone(f.note, 'triangle', now + f.time, f.dur, 0.25, 0.01);
                // 混入正弦波增加基音圆润度
                playTone(f.note, 'sine', now + f.time, f.dur, 0.15, 0.01);
            });

            // 模拟喜庆的鞭炮声 (高频带通白噪音爆裂)
            const playFirecracker = (time) => {
                const bufferSize = ctx.sampleRate * 0.08; // 80毫秒的爆破
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1200 + Math.random() * 400; // 随机频率使声音更生动
                filter.Q.value = 3;

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                noise.start(time);
            };

            // 在0.6秒至2.5秒之间随机爆裂15声爆竹
            for (let i = 0; i < 15; i++) {
                const delay = 0.5 + Math.random() * 1.8;
                playFirecracker(now + delay);
            }
        } catch (e) {
            console.warn('播放凯旋音频失败:', e);
        }
    }
}

/**
 * GameLogic - 游戏逻辑控制器
 * 负责检测胜利、显示16列和值、播放庆祝动画
 */
class GameLogic {
    /**
     * @param {RingModel} model - 数据模型
     * @param {HTMLElement} statusContainer - 状态显示容器
     * @param {HTMLElement} sumsContainer - 列和值显示容器
     */
    constructor(model, statusContainer, sumsContainer) {
        this.model = model;
        this.statusEl = statusContainer;
        this.sumsEl = sumsContainer;
        this.hasWon = false;
        this.moveCount = 0;
    }

    /**
     * 增加步数
     */
    incrementMoves() {
        this.moveCount++;
    }

    /**
     * 更新所有状态显示
     */
    update() {
        const sums = this.model.getAllColumnSums();
        this._renderSums(sums);
        this._checkAndShowWin(sums);
    }

    /**
     * 渲染16列和值列表
     * @param {Array} sums - 列和值数组
     */
    _renderSums(sums) {
        if (!this.sumsEl) return;

        let html = '<div class="sums-grid">';
        sums.forEach((item) => {
            const isCorrect = item.correct;
            const cssClass = isCorrect ? 'sum-correct' : 'sum-wrong';
            html += `<div class="sum-item ${cssClass}">
                <span class="sum-label">列${item.pos + 1}</span>
                <span class="sum-value">${item.sum}</span>
            </div>`;
        });
        html += '</div>';

        // 统计正确数量
        const correctCount = sums.filter(s => s.correct).length;
        html += `<div class="sum-summary">
            <span>步数: ${this.moveCount}</span>
            <span>正确: ${correctCount}/${sums.length}</span>
        </div>`;

        this.sumsEl.innerHTML = html;
    }

    /**
     * 检查并显示胜利状态
     * @param {Array} sums - 列和值数组
     */
    _checkAndShowWin(sums) {
        const allCorrect = sums.every(s => s.correct);

        if (allCorrect && !this.hasWon) {
            this.hasWon = true;
            this.statusEl.innerHTML = `
                <div class="win-message">
                    <span class="win-icon">🎉</span>
                    <span class="win-text">恭喜破解！所有 16 列数字之和均为 50！</span>
                    <span class="win-moves">共用了 ${this.moveCount} 步</span>
                </div>`;
            this.statusEl.classList.add('win');
            this._playConfetti();
            WinAudio.play(); // 播放喜庆的合成乐章和爆竹声
        } else if (!allCorrect) {
            this.hasWon = false;
            this.statusEl.innerHTML = '';
            this.statusEl.classList.remove('win');
        }
    }

    /**
     * 播放庆祝粒子动画
     */
    /**
     * 播放庆祝烟花大爆发动画
     */
    _playConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = 'block';

        const ctx = canvas.getContext('2d');
        const fireworks = [];
        const particles = [];
        const colors = [
            '#FFD700', '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
            '#536DFE', '#448AFF', '#40C4FF', '#1DE9B6', '#69F0AE', 
            '#B2FF59', '#EEFF41'
        ];

        const parent = this;

        class FireworkShell {
            constructor(startX, startY, targetX, targetY) {
                this.x = startX;
                this.y = startY;
                this.startX = startX;
                this.startY = startY;
                this.targetX = targetX;
                this.targetY = targetY;
                this.distanceToTarget = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
                this.distanceTraveled = 0;
                this.coordinates = [];
                this.coordinateCount = 3;
                while (this.coordinateCount--) {
                    this.coordinates.push([this.x, this.y]);
                }
                this.angle = Math.atan2(targetY - startY, targetX - startX);
                this.speed = 10;
                this.acceleration = 1.02;
                this.brightness = Math.random() * 20 + 50;
            }

            update(index) {
                this.coordinates.pop();
                this.coordinates.unshift([this.x, this.y]);
                this.speed *= this.acceleration;
                const vx = Math.cos(this.angle) * this.speed;
                const vy = Math.sin(this.angle) * this.speed;
                this.distanceTraveled = Math.sqrt(Math.pow(this.x + vx - this.startX, 2) + Math.pow(this.y + vy - this.startY, 2));

                if (this.distanceTraveled >= this.distanceToTarget) {
                    createExplosion(this.targetX, this.targetY);
                    fireworks.splice(index, 1);
                } else {
                    this.x += vx;
                    this.y += vy;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
                ctx.lineTo(this.x, this.y);
                ctx.strokeStyle = `hsl(${Math.random() * 360}, 100%, ${this.brightness}%)`;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
        }

        class Spark {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.coordinates = [];
                this.coordinateCount = 5;
                while (this.coordinateCount--) {
                    this.coordinates.push([this.x, this.y]);
                }
                this.angle = Math.random() * Math.PI * 2;
                this.speed = Math.random() * 7 + 1.5;
                this.gravity = 0.12;
                this.friction = 0.95;
                this.alpha = 1;
                this.decay = Math.random() * 0.015 + 0.007;
                this.color = color;
            }

            update(index) {
                this.coordinates.pop();
                this.coordinates.unshift([this.x, this.y]);
                this.speed *= this.friction;
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed + this.gravity;
                this.alpha -= this.decay;

                if (this.alpha <= this.decay) {
                    particles.splice(index, 1);
                }
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
                ctx.lineTo(this.x, this.y);
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = this.alpha;
                ctx.lineWidth = Math.random() * 2 + 1;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        function createExplosion(x, y) {
            const count = 75;
            const color = colors[Math.floor(Math.random() * colors.length)];
            for (let i = 0; i < count; i++) {
                particles.push(new Spark(x, y, color));
            }
        }

        // 定时发射控制
        let timerTick = 0;
        let timerTotal = 25; // 帧间隔
        let durationTotal = 360; // 持续时间约6秒
        let frame = 0;

        function animate() {
            // 用带一点透明的黑色清除背景，这样烟花会有漂亮的拖尾拖影效果
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';

            frame++;

            // 发射条件，在最后的100帧里停止发射只做收尾
            if (timerTick >= timerTotal && frame < durationTotal - 100) {
                const startX = canvas.width / 2 + (Math.random() * 300 - 150);
                const startY = canvas.height;
                const targetX = canvas.width * 0.2 + Math.random() * canvas.width * 0.6;
                const targetY = canvas.height * 0.15 + Math.random() * canvas.height * 0.35;
                fireworks.push(new FireworkShell(startX, startY, targetX, targetY));
                timerTick = 0;
                timerTotal = Math.random() * 25 + 15;
            } else {
                timerTick++;
            }

            let i = fireworks.length;
            while (i--) {
                fireworks[i].draw();
                fireworks[i].update(i);
            }

            let j = particles.length;
            while (j--) {
                particles[j].draw();
                particles[j].update(j);
            }

            if (frame < durationTotal || fireworks.length > 0 || particles.length > 0) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
            }
        }

        // 窗口缩放自适应
        window.addEventListener('resize', () => {
            if (canvas.style.display === 'block') {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        });

        // 立即发射一颗大型烟花
        fireworks.push(new FireworkShell(canvas.width / 2, canvas.height, canvas.width / 2, canvas.height * 0.3));

        requestAnimationFrame(animate);
    }

    /**
     * 重置游戏状态
     */
    reset() {
        this.hasWon = false;
        this.moveCount = 0;
        this.statusEl.innerHTML = '';
        this.statusEl.classList.remove('win');
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.GameLogic = GameLogic;
}
