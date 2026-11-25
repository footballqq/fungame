/**
 * 非洲播棋 · 纯 Web Audio API 马林巴木琴 / 卡林巴拇指琴音效与 BGM 合成器
 * 调式：C 大调五声音阶（非洲卡林巴/马林巴轻快明朗音色：C - D - E - G - A）
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MancalaAudio = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let ctx = null;
  let sfxMuted = false;
  let bgmEnabled = false;
  let bgmTimer = null;
  let bgmStep = 0;

  const SCALE = {
    C3: 130.81, G3: 196.0, A3: 220.0,
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99
  };

  const MELODY = [
    'C5', 'G4', 'E4', 'A4', 'G4', null, 'E4', 'D4',
    'C4', 'E4', 'G4', 'A4', 'C5', null, 'G4', null,
    'E5', 'D5', 'C5', 'A4', 'G4', 'E4', 'G4', 'A4',
    'G4', 'E4', 'D4', 'E4', 'C4', null, null, null
  ];

  const BASS = [
    'C3', null, null, 'G3', null, null, 'A3', null,
    'G3', null, null, 'C3', null, null, 'G3', null
  ];

  function ensureContext() {
    if (!ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function playMarimba(ac, freq, dur, vol) {
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playTone(freq, dur, type, vol, delay, endFreq) {
    if (sfxMuted) return;
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol || 0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function tickBgm() {
    if (!bgmEnabled) return;
    const ac = ensureContext();
    if (!ac) return;
    const m = MELODY[bgmStep % MELODY.length];
    if (m && SCALE[m]) playMarimba(ac, SCALE[m], 0.34, 0.07);
    const b = BASS[bgmStep % BASS.length];
    if (b && SCALE[b]) playMarimba(ac, SCALE[b], 0.42, 0.055);
    bgmStep = (bgmStep + 1) % 32;
  }

  function startBgm() {
    if (bgmEnabled) return;
    bgmEnabled = true;
    ensureContext();
    tickBgm();
    bgmTimer = setInterval(tickBgm, 240);
  }

  function stopBgm() {
    bgmEnabled = false;
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function toggleBgm() {
    if (bgmEnabled) stopBgm();
    else startBgm();
    return bgmEnabled;
  }

  /** 宝石落坑清脆声（随播种步数微微升高音调） */
  function playDrop(stepIdx) {
    const notes = [SCALE.C4, SCALE.D4, SCALE.E4, SCALE.G4, SCALE.A4, SCALE.C5, SCALE.D5, SCALE.E5];
    const f = notes[(stepIdx || 0) % notes.length];
    playTone(f, 0.11, 'sine', 0.13, 0);
  }

  function playBonus() {
    [SCALE.E4, SCALE.G4, SCALE.C5, SCALE.E5].forEach((n, i) => {
      playTone(n, 0.18, 'triangle', 0.13, i * 0.06);
    });
  }

  function playCapture() {
    [SCALE.G4, SCALE.A4, SCALE.C5, SCALE.G5].forEach((n, i) => {
      playTone(n, 0.2, 'triangle', 0.14, i * 0.055);
    });
  }

  function playWin() {
    [SCALE.C4, SCALE.E4, SCALE.G4, SCALE.C5, SCALE.E5, SCALE.G5].forEach((n, i) => {
      playTone(n, 0.32, 'triangle', 0.14, i * 0.08);
    });
  }

  return {
    SCALE,
    startBgm,
    stopBgm,
    toggleBgm,
    isBgmPlaying: () => bgmEnabled,
    playDrop,
    playBonus,
    playCapture,
    playWin,
    setMuted: (v) => { sfxMuted = !!v; },
    isMuted: () => sfxMuted
  };
});
