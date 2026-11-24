// codex: 2026-11-24 纯算法 Web Audio 剪纸音效合成器，零外部音频依赖

/**
 * PaperCutAudio：使用 Web Audio API 实时合成剪刀咔嚓声、纸片放置/移除、提示音与通关礼乐。
 */
class PaperCutAudio {
    constructor() {
        this.enabled = true;
        this.ctx = null;
    }

    _ensureContext() {
        if (!this.enabled) return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * 剪刀裁剪“咔嚓”声 + 轻柔纸张落位音（随方块尺寸微调音高）
     */
    playSnip(size = 4) {
        const ctx = this._ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // 1. 短促高频噪声模拟剪刀合刃
        const bufferSize = Math.floor(ctx.sampleRate * 0.055);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400 - size * 90, now);
        filter.Q.value = 2.2;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // 2. 温润木琴落位音（大块低沉，小块清脆）
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        const baseFreq = 680 - size * 36;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, now + 0.09);

        oscGain.gain.setValueAtTime(0.14, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    /**
     * 移除已剪纸片的轻柔剥离声
     */
    playRemove() {
        const ctx = this._ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.09);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    /**
     * 撤销音效
     */
    playUndo() {
        this.playRemove();
    }

    /**
     * 碰撞/越界柔和提醒音
     */
    playInvalid() {
        const ctx = this._ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.linearRampToValueAtTime(145, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    /**
     * 教学提示/翻页清脆铃声
     */
    playChime() {
        const ctx = this._ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const freqs = [523.25, 659.25];
        freqs.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.07);
            gain.gain.setValueAtTime(0.11, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.22);
        });
    }

    /**
     * 成功剪完一整张纸的愉悦和弦
     */
    playComplete() {
        const ctx = this._ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            const t = now + idx * 0.08;
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.14, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.34);
        });
    }

    /**
     * 达成 11 片数学理论极限的盛大礼乐
     */
    playLegendaryWin() {
        const ctx = this._ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const melody = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5, 1318.51];
        const offsets = [0, 0.09, 0.18, 0.28, 0.42, 0.52, 0.64];
        melody.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            const t = now + offsets[idx];
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.16, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.42);
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaperCutAudio };
} else {
    window.PaperCutAudio = PaperCutAudio;
}
