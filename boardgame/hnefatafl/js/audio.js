/**
 * 维京王者之棋 · 纯 Web Audio API 北欧风格音效与竖琴战鼓 BGM 合成器
 * 调式：D Dorian（北欧民谣多利亚调式：D - E - F - G - A - B - C - D）
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HnefataflAudio = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let ctx = null;
  let sfxMuted = false;
  let bgmEnabled = false;
  let bgmTimer = null;
  let bgmStep = 0;

  const SCALE = {
    D2: 73.42, A2: 110.0,
    D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63,
    D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33
  };

  // 北欧吟游诗人古竖琴 (Lyre) 旋律
  const MELODY = [
    'D4', null, 'A4', 'G4', 'F4', null, 'E4', 'D4',
    'F4', 'G4', 'A4', null, 'C5', 'B4', 'A4', null,
    'D5', null, 'C5', 'A4', 'G4', 'F4', 'E4', 'F4',
    'G4', 'F4', 'E4', 'C4', 'D4', null, null, null
  ];

  const DRUM = ['D', null, null, null, 't', null, 'D', null, null, null, 't', null, 'D', null, 't', null];

  function ensureContext() {
    if (!ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function playTone(freq, dur, type, vol, delay, endFreq) {
    if (sfxMuted) return;
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol || 0.13, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playLyre(ac, freq, dur, vol) {
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  function playNordicDrum(ac, hit) {
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    const startF = hit === 'D' ? 110 : 185;
    const endF = hit === 'D' ? 46 : 85;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(endF, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(hit === 'D' ? 0.12 : 0.055, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  function tickBgm() {
    if (!bgmEnabled) return;
    const ac = ensureContext();
    if (!ac) return;
    const note = MELODY[bgmStep % MELODY.length];
    if (note && SCALE[note]) playLyre(ac, SCALE[note], 0.65, 0.065);
    if (bgmStep % 16 === 0) {
      playLyre(ac, SCALE.D2, 4.6, 0.055);
      playLyre(ac, SCALE.A2, 4.6, 0.03);
    }
    const d = DRUM[bgmStep % DRUM.length];
    if (d) playNordicDrum(ac, d);
    bgmStep = (bgmStep + 1) % 32;
  }

  function startBgm() {
    if (bgmEnabled) return;
    bgmEnabled = true;
    ensureContext();
    tickBgm();
    bgmTimer = setInterval(tickBgm, 310);
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

  function playMove() {
    playTone(210, 0.09, 'triangle', 0.15, 0, 125);
  }

  function playCapture() {
    playTone(320, 0.12, 'sawtooth', 0.12, 0, 140);
    playTone(180, 0.16, 'triangle', 0.14, 0.06, 90);
  }

  function playWin() {
    [SCALE.D4, SCALE.F4, SCALE.A4, SCALE.C5, SCALE.D5].forEach((n, i) => {
      playTone(n, 0.36, 'triangle', 0.14, i * 0.09);
    });
  }

  return {
    SCALE,
    startBgm,
    stopBgm,
    toggleBgm,
    isBgmPlaying: () => bgmEnabled,
    playMove,
    playCapture,
    playWin,
    setMuted: (v) => { sfxMuted = !!v; },
    isMuted: () => sfxMuted
  };
});
