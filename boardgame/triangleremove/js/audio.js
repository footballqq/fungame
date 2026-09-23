// codex: 2026-09-23 纯算法 Web Audio 实时音效合成器：星石点击、消除、复原、连线警示与通关礼乐
(function(root) {
  'use strict';

  class SoundEffects {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this._loadSettings();
    }

    _loadSettings() {
      try {
        const saved = localStorage.getItem('triangle_remove_sound_muted');
        this.muted = saved === 'true';
      } catch (e) {
        this.muted = false;
      }
    }

    _ensureContext() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      try {
        localStorage.setItem('triangle_remove_sound_muted', String(this.muted));
      } catch (e) {}
      if (!this.muted) {
        this.playTap();
      }
      return this.muted;
    }

    isMuted() {
      return this.muted;
    }

    /**
     * 点选星石音效（清脆水晶弹音）
     */
    playTap() {
      if (this.muted) return;
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    }

    /**
     * 消除星石音效（下行晶尘消散）
     */
    playRemove() {
      if (this.muted) return;
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [784, 659.25, 523.25]; // G5, E5, C5

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.035;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, start + 0.15);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.18);
      });
    }

    /**
     * 复原星石音效（上行晶莹点亮）
     */
    playRestore() {
      if (this.muted) return;
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 784]; // C5, E5, G5

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.035;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, start + 0.12);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.15);
      });
    }

    /**
     * 连线警示音（发现剩余正三角形时的神秘以太和弦）
     */
    playAlert() {
      if (this.muted) return;
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5

      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      });
    }

    /**
     * 聚焦高亮单个三角形音效
     */
    playHighlight() {
      if (this.muted) return;
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(698.46, now); // F5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    }

    /**
     * 胜利通关礼乐（星华流转大和弦琶音）
     */
    playWin() {
      if (this.muted) return;
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // C大九和弦琶音: C5, E5, G5, B5, D6, E6
      const arpeggio = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51];

      arpeggio.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.6);
      });
    }

    /**
     * 剧情文字微声
     */
    playStoryTyping() {
      if (this.muted) return;
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + Math.random() * 200, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    }
  }

  root.SoundEffects = SoundEffects;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SoundEffects };
  }
})(typeof window !== 'undefined' ? window : globalThis);
