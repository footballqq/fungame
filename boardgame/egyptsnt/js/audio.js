/**
 * 纯 Web Audio API 古埃及风格音效与背景音乐 (BGM) 合成器
 * 零外部音频文件与 CDN 依赖，离线开箱即用。
 *
 * 音乐调式：Double Harmonic Major（阿拉伯/古埃及双和声大调：D - Eb - F# - G - A - Bb - C# - D）
 * 编曲三轨：
 * 1. 古埃及竖琴 / 乌德琴 (Oud) 拨弦主旋律
 * 2. 神庙低音持续共鸣 (Drone)
 * 3. 轻柔中东达布卡手鼓 (Darbuka · Maqsum 节奏型：Dum - Tak - Tak - Dum - Tak)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EgyptAudio = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let ctx = null;
  let sfxMuted = false;
  let bgmEnabled = false;
  let bgmTimer = null;
  let bgmStep = 0;
  let noiseBuffer = null;

  // D Double Harmonic Major 音阶频率 (Hz): D3, Eb3, F#3, G3, A3, Bb3, C#4, D4, Eb4, F#4, G4, A4, Bb4, C#5, D5
  const SCALE = {
    D2: 73.42,
    A2: 110.0,
    D3: 146.83,
    Eb3: 155.56,
    Fs3: 185.0,
    G3: 196.0,
    A3: 220.0,
    Bb3: 233.08,
    Cs4: 277.18,
    D4: 293.66,
    Eb4: 311.13,
    Fs4: 369.99,
    G4: 392.0,
    A4: 440.0,
    Bb4: 466.16,
    Cs5: 554.37,
    D5: 587.33
  };

  // 32 步（4 小节，每步 1 个八分音符）古埃及旋律乐句
  const MELODY_PHRASE_A = [
    'D4', null, 'Fs4', 'G4', 'A4', null, 'Bb4', 'A4',
    'G4', 'Fs4', 'Eb4', null, 'D4', null, 'A3', null,
    'D4', 'Eb4', 'Fs4', null, 'A4', 'Bb4', 'Cs5', 'D5',
    'Bb4', 'A4', 'G4', 'Fs4', 'Eb4', null, 'D4', null
  ];

  const MELODY_PHRASE_B = [
    'A4', null, 'Bb4', 'A4', 'G4', 'Fs4', 'Eb4', 'Fs4',
    'G4', null, 'Fs4', 'Eb4', 'D4', null, null, null,
    'Fs4', 'G4', 'A4', null, 'Bb4', 'A4', 'G4', 'Fs4',
    'Eb4', 'Fs4', 'Eb4', 'Cs4', 'D4', null, null, null
  ];

  // 8 步一循环的 Maqsum 达布卡手鼓节奏：'D'=Dum(低沉鼓心), 'T'=Tak(清脆鼓边), 'k'=轻击
  const DARBUKA_PATTERN = ['D', null, 'T', null, null, 'T', 'D', null, 'T', null, 'k', null, 'D', null, 'T', null];

  function ensureContext() {
    if (!ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function getNoiseBuffer(ac) {
    if (noiseBuffer) return noiseBuffer;
    const sampleRate = ac.sampleRate;
    const len = Math.floor(sampleRate * 0.25);
    const buffer = ac.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return buffer;
  }

  function playTone(freq, duration, type, volume, delay, endFreq) {
    if (sfxMuted) return;
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume || 0.14, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /** 乌德琴 / 古埃及竖琴拨弦音色（用于 BGM 主旋律） */
  function playOudNote(ac, freq, duration, volume) {
    const now = ac.currentTime;
    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now); // 轻度八度泛音

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(620, now + duration);

    const g2 = ac.createGain();
    g2.gain.value = 0.18;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.04);
    osc2.stop(now + duration + 0.04);
  }

  /** 神庙低音持续共鸣 (Drone) */
  function playDrone(ac, freq, duration, volume) {
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.value = 280;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.45);
    gain.gain.linearRampToValueAtTime(volume * 0.7, now + duration - 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /** 中东达布卡手鼓 (Darbuka) */
  function playDarbuka(ac, hitType) {
    const now = ac.currentTime;
    if (hitType === 'D') {
      // Dum：低沉温暖鼓心
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(62, now + 0.16);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.11, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } else {
      // Tak / k：清脆鼓边噪声脉冲
      const src = ac.createBufferSource();
      src.buffer = getNoiseBuffer(ac);
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = hitType === 'T' ? 1950 : 2800;
      bp.Q.value = 3.2;

      const gain = ac.createGain();
      const peak = hitType === 'T' ? 0.055 : 0.028;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

      src.connect(bp);
      bp.connect(gain);
      gain.connect(ac.destination);
      src.start(now);
      src.stop(now + 0.1);
    }
  }

  /** BGM 步进调度（每步 285ms ≈ 105 BPM 八分音符） */
  function tickBgm() {
    if (!bgmEnabled) return;
    const ac = ensureContext();
    if (!ac) return;

    const cycleStep = bgmStep % 64;
    const phrase = cycleStep < 32 ? MELODY_PHRASE_A : MELODY_PHRASE_B;
    const noteName = phrase[cycleStep % 32];
    if (noteName && SCALE[noteName]) {
      playOudNote(ac, SCALE[noteName], 0.56, 0.068);
    }

    // 每 16 步铺一层低音神庙共鸣
    if (cycleStep % 16 === 0) {
      playDrone(ac, SCALE.D2, 4.5, 0.05);
      playDrone(ac, SCALE.A2, 4.5, 0.028);
    }

    // 轻柔达布卡手鼓节奏
    const hit = DARBUKA_PATTERN[bgmStep % DARBUKA_PATTERN.length];
    if (hit) {
      playDarbuka(ac, hit);
    }

    bgmStep = (bgmStep + 1) % 64;
  }

  function startBgm() {
    if (bgmEnabled) return;
    bgmEnabled = true;
    ensureContext();
    tickBgm();
    bgmTimer = setInterval(tickBgm, 285);
  }

  function stopBgm() {
    bgmEnabled = false;
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function toggleBgm() {
    if (bgmEnabled) {
      stopBgm();
    } else {
      startBgm();
    }
    return bgmEnabled;
  }

  function isBgmPlaying() {
    return bgmEnabled;
  }

  /** 木掷棍 / 骨骰碰撞声 */
  function playRoll() {
    const freqs = [340, 470, 390, 540];
    freqs.forEach((f, idx) => {
      playTone(f, 0.07, 'triangle', 0.12, idx * 0.045, f * 0.72);
    });
  }

  /** 棋子落盘木响 */
  function playMove() {
    playTone(230, 0.09, 'sine', 0.16, 0, 140);
    playTone(460, 0.05, 'triangle', 0.07, 0.01, 320);
  }

  /** 换位或击杀 */
  function playCapture() {
    playTone(440, 0.11, 'sawtooth', 0.11, 0, 220);
    playTone(310, 0.16, 'triangle', 0.14, 0.07, 150);
  }

  /** 踩中水之屋落水 */
  function playWater() {
    playTone(520, 0.18, 'sine', 0.14, 0, 170);
    playTone(340, 0.22, 'sine', 0.12, 0.08, 120);
  }

  /** 踩中玫瑰/额外投掷或安全出盘（埃及增二度明亮上行） */
  function playBonus() {
    const notes = [SCALE.D4, SCALE.Fs4, SCALE.A4, SCALE.D5];
    notes.forEach((n, idx) => {
      playTone(n, 0.18, 'triangle', 0.12, idx * 0.065);
    });
  }

  /** 翻转双面棋盒木质翻动声 */
  function playFlip() {
    playTone(180, 0.12, 'triangle', 0.13, 0, 290);
    playTone(280, 0.14, 'sine', 0.11, 0.09, 210);
  }

  /** 古埃及 Double Harmonic 胜利竖琴华彩 */
  function playWin() {
    const notes = [SCALE.D4, SCALE.Eb4, SCALE.Fs4, SCALE.A4, SCALE.Bb4, SCALE.Cs5, SCALE.D5];
    notes.forEach((n, idx) => {
      playTone(n, 0.36, 'triangle', 0.14, idx * 0.085);
    });
  }

  function setMuted(val) {
    sfxMuted = !!val;
  }

  function isMuted() {
    return sfxMuted;
  }

  return {
    SCALE,
    startBgm,
    stopBgm,
    toggleBgm,
    isBgmPlaying,
    playRoll,
    playMove,
    playCapture,
    playWater,
    playBonus,
    playFlip,
    playWin,
    setMuted,
    isMuted
  };
});
