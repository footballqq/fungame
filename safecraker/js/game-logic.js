// codex: 2026-06-02 游戏逻辑 - 胜利检测(16列各列和=50)、实时提示、庆祝动画
// Safe Cracker 50 - game-logic.js

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
        } else if (!allCorrect) {
            this.hasWon = false;
            this.statusEl.innerHTML = '';
            this.statusEl.classList.remove('win');
        }
    }

    /**
     * 播放庆祝粒子动画
     */
    _playConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = 'block';

        const ctx = canvas.getContext('2d');
        const particles = [];
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

        // 创建 200 个粒子
        for (let i = 0; i < 200; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15 - 5,
                size: Math.random() * 8 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                life: 1
            });
        }

        let frame = 0;
        const maxFrames = 120;

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3; // 重力
                p.rotation += p.rotationSpeed;
                p.life -= 1 / maxFrames;

                if (p.life > 0) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
            }
        }

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
