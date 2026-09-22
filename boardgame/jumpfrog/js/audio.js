// codex: 2026-09-22 实现基于Web Audio API的纯程序化荷塘跳跃音效引擎
/**
 * 荷塘音效引擎 (audio.js)
 * 纯算法实时合成，无需下载外部音频文件，零延迟、跨平台支持
 */

class FrogAudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        } catch (e) {
            console.warn('Web Audio API 未被支持或未激活', e);
        }
    }

    ensureResume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * 青蛙起跳声：Q弹的滑音
     */
    playHop() {
        if (!this.enabled || !this.ctx) return;
        this.ensureResume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.14);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    /**
     * 落叶/水花声：轻柔水泡水滴音
     */
    playPlop() {
        if (!this.enabled || !this.ctx) return;
        this.ensureResume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    /**
     * 夸奖/鼓励提示音：清脆灵动的三度音符
     */
    playCheer() {
        if (!this.enabled || !this.ctx) return;
        this.ensureResume();
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const now = this.ctx.currentTime + i * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.2);
        });
    }

    /**
     * 胜利通关礼乐：宏伟华丽的四音和弦琶音
     */
    playVictory() {
        if (!this.enabled || !this.ctx) return;
        this.ensureResume();
        const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        chords.forEach((freq, i) => {
            const now = this.ctx.currentTime + i * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.6);
        });
    }

    /**
     * 撤销操作：柔和的反向回缩音
     */
    playUndo() {
        if (!this.enabled || !this.ctx) return;
        this.ensureResume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FrogAudioManager };
}
