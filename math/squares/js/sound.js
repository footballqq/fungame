(function (root) {
  'use strict';

  let ctx = null;
  let muted = false;

  function ensureCtx() {
    if (muted) return null;
    if (!ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function playTone(freq, duration, type, gainValue, delay) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainValue || 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  root.SquaresSound = {
    isMuted: function () {
      return muted;
    },
    toggleMute: function () {
      muted = !muted;
      return muted;
    },
    tap: function () {
      playTone(540, 0.055, 'triangle', 0.07);
    },
    correct: function () {
      playTone(660, 0.11, 'sine', 0.13, 0);
      playTone(880, 0.16, 'sine', 0.13, 0.09);
    },
    wrong: function () {
      playTone(230, 0.18, 'sawtooth', 0.09, 0);
      playTone(170, 0.22, 'sawtooth', 0.08, 0.12);
    },
    win: function () {
      playTone(523.25, 0.12, 'triangle', 0.14, 0);
      playTone(659.25, 0.12, 'triangle', 0.14, 0.11);
      playTone(783.99, 0.12, 'triangle', 0.14, 0.22);
      playTone(1046.5, 0.28, 'triangle', 0.15, 0.33);
    },
  };
})(typeof self !== 'undefined' ? self : this);
