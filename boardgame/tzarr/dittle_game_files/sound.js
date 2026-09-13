// codex: 2026-09-13 实现沉浸式背景音乐合成器(BGM)与丰富拟真走棋/交互音效系统(SFX)
class SoundManager {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = false;

        this.sfxGain = null;
        this.musicGain = null;

        this.isMusicPlaying = false;
        this.musicTimer = null;
        this.chordIndex = 0;

        // 舒缓和弦走向 (Cmaj7 -> Am9 -> Fmaj7 -> Gsus4)
        this.chords = [
            [130.81, 196.00, 246.94, 329.63], // C3, G3, B3, E4 (Cmaj7)
            [110.00, 164.81, 220.00, 293.66], // A2, E3, A3, D4 (Am9)
            [87.31, 130.81, 174.61, 261.63],  // F2, C3, F3, C4 (Fmaj7)
            [98.00, 146.83, 196.00, 293.66]   // G2, D3, G3, D4 (Gsus4)
        ];

        // 宁静五度水滴/八音盒晶莹音阶 (C5, D5, E5, G5, A5, C6)
        this.bellScale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

        // 监听全局首次手势解锁音频上下文 (适配移动端与浏览器自动播放策略)
        const unlock = () => {
            this.init();
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('pointerdown', unlock, { passive: true });
        document.addEventListener('keydown', unlock, { passive: true });
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.value = this.soundEnabled ? 0.6 : 0;
                this.sfxGain.connect(this.ctx.destination);

                this.musicGain = this.ctx.createGain();
                this.musicGain.gain.value = 0; // 默认渐入
                this.musicGain.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // ==========================================
    // 音效 (SFX) 开关与播放
    // ==========================================
    toggleSound(enable) {
        this.soundEnabled = enable !== undefined ? !!enable : !this.soundEnabled;
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 0.6 : 0, this.ctx.currentTime);
        }
        return this.soundEnabled;
    }

    isSoundEnabled() {
        return this.soundEnabled;
    }

    // 选中棋子音效 (清脆木质拾起敲击微响)
    playSelect() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.05);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    // 取消选中音效 (柔和放下)
    playDeselect() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    // 骰子翻滚木格撞击声 (扎实木质二次敲击)
    playTilt() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 主敲击音
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(320, now);
        osc1.frequency.exponentialRampToValueAtTime(75, now + 0.09);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.1);

        // 微弱落地回响
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(160, now + 0.03);
        osc2.frequency.exponentialRampToValueAtTime(60, now + 0.11);
        gain2.gain.setValueAtTime(0.2, now + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now + 0.03);
        osc2.stop(now + 0.12);
    }

    // 跳跃抛物线飞跃与扎实着落音
    playJump() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 飞跃轻盈滑音
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.09);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);

        // 落地短促木响
        const landOsc = this.ctx.createOscillator();
        const landGain = this.ctx.createGain();
        landOsc.type = 'triangle';
        landOsc.frequency.setValueAtTime(380, now + 0.12);
        landOsc.frequency.exponentialRampToValueAtTime(110, now + 0.19);
        landGain.gain.setValueAtTime(0.22, now + 0.12);
        landGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        landOsc.connect(landGain);
        landGain.connect(this.sfxGain);
        landOsc.start(now + 0.12);
        landOsc.stop(now + 0.21);
    }

    // 冲突吃子/淘汰撞击爆破音
    playClash() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // 非法走法/违规操作提示音 (低沉咚咚警示)
    playIllegal() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [0, 0.1].forEach((delay) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now + delay);
            gain.gain.setValueAtTime(0.18, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + delay);
            osc.stop(now + delay + 0.08);
        });
    }

    // 棋钟低时间倒数警报音
    playWarning() {
        this.playIllegal();
    }

    // 开局清爽和鸣钟声
    playGameStart() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const startNotes = [523.25, 659.25, 783.99]; // C5, E5, G5
        startNotes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.09);
            gain.gain.setValueAtTime(0.24, now + i * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.28);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.09);
            osc.stop(now + i * 0.09 + 0.3);
        });
    }

    // 换回合轮换微提醒
    playTurn() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    // 胜利华丽大调和弦琶音
    playWin() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(0.3, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.36);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.38);
        });
    }

    // 惜败小调和音
    playLose() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const notes = [440, 392, 349.23, 293.66];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.14);
            gain.gain.setValueAtTime(0.22, now + idx * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + idx * 0.14);
            osc.stop(now + idx * 0.14 + 0.38);
        });
    }

    // ==========================================
    // 沉浸式对弈背景音乐合成器 (BGM Synthesizer)
    // 纯算法合成柔和五声禅意和弦与八音盒琶音，离线零依赖
    // ==========================================
    toggleMusic(enable) {
        this.musicEnabled = enable !== undefined ? !!enable : !this.musicEnabled;
        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    isMusicEnabled() {
        return this.musicEnabled;
    }

    startMusic() {
        this.init();
        if (!this.ctx || this.isMusicPlaying) return;
        this.isMusicPlaying = true;
        this.chordIndex = 0;

        // 平滑淡入背景音乐音量 (0.09 适合专注思考)
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(0.001, now);
        this.musicGain.gain.linearRampToValueAtTime(0.09, now + 1.2);

        this.playNextMusicBar();
    }

    stopMusic() {
        if (!this.isMusicPlaying || !this.ctx) return;
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
        // 平滑淡出避免爆音
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
    }

    playNextMusicBar() {
        if (!this.isMusicPlaying || !this.ctx) return;

        const chord = this.chords[this.chordIndex % this.chords.length];
        this.chordIndex++;
        const barDuration = 4.2; // 每小节 4.2 秒
        const now = this.ctx.currentTime;

        // 1. 和弦垫声 (Warm Ambient Pad)
        chord.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, now);

            // 渐入渐出包络
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.045, now + 1.2);
            gain.gain.setValueAtTime(0.045, now + barDuration - 1.2);
            gain.gain.linearRampToValueAtTime(0.001, now + barDuration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(now);
            osc.stop(now + barDuration + 0.1);
        });

        // 2. 随机晶莹五声八音盒/竖琴音符 (Pentatonic Bell Accents)
        const bellCount = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < bellCount; i++) {
            const offset = 0.5 + i * (barDuration / (bellCount + 0.5)) + Math.random() * 0.3;
            const noteFreq = this.bellScale[Math.floor(Math.random() * this.bellScale.length)];

            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bOsc.type = 'sine';
            bOsc.frequency.setValueAtTime(noteFreq, now + offset);

            bGain.gain.setValueAtTime(0.001, now + offset);
            bGain.gain.linearRampToValueAtTime(0.035, now + offset + 0.03);
            bGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 1.2);

            bOsc.connect(bGain);
            bGain.connect(this.musicGain);

            bOsc.start(now + offset);
            bOsc.stop(now + offset + 1.25);
        }

        // 循环调度下一小节
        this.musicTimer = setTimeout(() => {
            this.playNextMusicBar();
        }, (barDuration - 0.1) * 1000);
    }
}

window.soundManager = new SoundManager();
