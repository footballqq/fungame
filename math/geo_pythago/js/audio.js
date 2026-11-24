/**
 * 纯前端 Web Audio API 合成音效引擎（零外部音频依赖）
 */
(function (global) {
  'use strict';

  var AudioFX = {
    enabled: true,
    ctx: null,

    _getCtx: function () {
      if (!this.enabled) return null;
      if (typeof window === 'undefined') return null;
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(function () {});
      }
      return this.ctx;
    },

    _tone: function (freq, duration, type, volume, delay) {
      var ctx = this._getCtx();
      if (!ctx) return;
      var now = ctx.currentTime + (delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume || 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    },

    click: function () {
      this._tone(520, 0.06, 'triangle', 0.06, 0);
    },

    auxLine: function () {
      this._tone(440, 0.09, 'sine', 0.06, 0);
      this._tone(660, 0.12, 'sine', 0.06, 0.07);
    },

    cut: function () {
      this._tone(740, 0.07, 'square', 0.04, 0);
      this._tone(520, 0.08, 'triangle', 0.05, 0.05);
    },

    success: function () {
      this._tone(523.25, 0.12, 'triangle', 0.09, 0);
      this._tone(659.25, 0.12, 'triangle', 0.09, 0.1);
      this._tone(783.99, 0.18, 'triangle', 0.1, 0.2);
      this._tone(1046.5, 0.28, 'sine', 0.09, 0.32);
    },

    wrong: function () {
      this._tone(240, 0.14, 'sawtooth', 0.05, 0);
      this._tone(190, 0.2, 'sawtooth', 0.05, 0.12);
    },

    toggle: function () {
      this.enabled = !this.enabled;
      if (this.enabled) this.click();
      return this.enabled;
    }
  };

  global.GeoAudio = AudioFX;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioFX;
  }
})(typeof window !== 'undefined' ? window : globalThis);
