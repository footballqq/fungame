// codex: 2026-09-09 拆分音效合成器与纸屑动画模块（保持单文件<500行）
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GameFX = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 纯 Web Audio API 木质棋子敲击与胜利和弦音效
  const SoundFX = {
    audioCtx: null,
    enabled: true,

    init() {
      if (!this.audioCtx && typeof window.AudioContext !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    },

    playWoodClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    },

    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const start = this.audioCtx.currentTime + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    },
  };

  // 庆祝彩屑特效引擎
  const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    fire() {
      this.resize();
      this.particles = [];
      const colors = ['#e5b358', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#ffffff'];
      for (let i = 0; i < 90; i++) {
        this.particles.push({
          x: this.canvas.width / 2,
          y: this.canvas.height / 2,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14 - 3,
          size: Math.random() * 7 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
        });
      }
      if (!this.animId) this.loop();
    },

    loop() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let alive = false;
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.rot += p.rotSpeed;
        p.alpha -= 0.012;
        if (p.alpha > 0) {
          alive = true;
          this.ctx.save();
          this.ctx.globalAlpha = p.alpha;
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rot * Math.PI) / 180);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          this.ctx.restore();
        }
      }
      if (alive) {
        this.animId = requestAnimationFrame(() => this.loop());
      } else {
        this.animId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    },
  };

  return { SoundFX, Confetti };
});
