// codex: 2026-09-29 confetti.js 独立通关彩屑烟花粒子画布特效引擎
(function (global) {
  'use strict';

  class ConfettiCannon {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.animId = null;
    }

    init(canvasEl) {
      this.canvas = canvasEl;
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
      }
    }

    fire() {
      if (!this.canvas || !this.ctx) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.canvas.style.display = 'block';

      this.particles = [];
      const colors = ['#ff4d4f', '#ff7a45', '#ffa940', '#ffec3d', '#73d13d', '#36cfc9', '#4096ff', '#9254de', '#f759ab'];

      for (let i = 0; i < 130; i++) {
        this.particles.push({
          x: window.innerWidth * (0.2 + 0.6 * Math.random()),
          y: window.innerHeight * 0.42,
          vx: (Math.random() - 0.5) * 15,
          vy: -Math.random() * 13 - 5,
          size: Math.random() * 10 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
          opacity: 1
        });
      }

      if (this.animId) cancelAnimationFrame(this.animId);

      const updateFrame = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let active = 0;

        for (const p of this.particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.36; // 重力加速度
          p.rotation += p.rotSpeed;
          p.opacity -= 0.008;

          if (p.opacity > 0 && p.y < this.canvas.height) {
            active++;
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.opacity);
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
          }
        }

        if (active > 0) {
          this.animId = requestAnimationFrame(updateFrame);
        } else {
          this.canvas.style.display = 'none';
        }
      };

      this.animId = requestAnimationFrame(updateFrame);
    }

    stop() {
      if (this.animId) cancelAnimationFrame(this.animId);
      if (this.canvas) this.canvas.style.display = 'none';
      this.particles = [];
    }
  }

  global.SquareConfetti = new ConfettiCannon();
})(window);
