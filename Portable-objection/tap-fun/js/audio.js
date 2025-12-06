// audio.js - 程序化音频生成模块
const GameAudio = {
    ctx: null,
    enabled: true,
    bgmPlaying: false,
    bgmNodes: [],
    masterGain: null,
    
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.5;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBGM();
        }
        return this.enabled;
    },

    // 播放音效
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // 跑步音效
    playRun() {
        this.playTone(200, 0.05, 'square', 0.1);
    },

    // 跳跃音效
    playJump() {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },

    // 摔倒音效
    playFall() {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    // 倒计时音效
    playCountdown(final = false) {
        const freq = final ? 880 : 440;
        const dur = final ? 0.4 : 0.2;
        this.playTone(freq, dur, 'sine', 0.4);
    },

    // 冲线音效
    playFinish(isWin = false) {
        if (!this.enabled || !this.ctx) return;
        
        const notes = isWin ? [523, 659, 784, 1047] : [392, 349, 330, 294];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.3, 'sine', 0.4);
            }, i * 100);
        });
    },

    // 程序化BGM
    startBGM() {
        if (!this.enabled || !this.ctx || this.bgmPlaying) return;
        
        this.bgmPlaying = true;
        this.playBGMLoop();
    },

    playBGMLoop() {
        if (!this.bgmPlaying || !this.ctx) return;
        
        const bpm = 128;
        const beatDuration = 60 / bpm;
        const now = this.ctx.currentTime;
        
        // 低音节奏
        const bassNotes = [55, 55, 73, 55, 55, 55, 73, 82];
        bassNotes.forEach((freq, i) => {
            if (!this.bgmPlaying) return;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            const startTime = now + i * beatDuration;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + beatDuration * 0.9);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + beatDuration);
            
            this.bgmNodes.push({ osc, gain });
        });
        
        // 合成器和弦
        const chordNotes = [220, 277, 330];
        chordNotes.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.05, now);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(now);
            osc.stop(now + beatDuration * 8);
            
            this.bgmNodes.push({ osc, gain });
        });
        
        // 高音琶音
        const arpNotes = [440, 523, 659, 784, 659, 523, 440, 392];
        arpNotes.forEach((freq, i) => {
            if (!this.bgmPlaying) return;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * beatDuration;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + beatDuration * 0.5);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + beatDuration * 0.6);
            
            this.bgmNodes.push({ osc, gain });
        });
        
        // 循环
        const loopDuration = beatDuration * 8 * 1000;
        this.bgmTimeout = setTimeout(() => {
            this.bgmNodes = [];
            if (this.bgmPlaying) {
                this.playBGMLoop();
            }
        }, loopDuration - 50);
    },

    stopBGM() {
        this.bgmPlaying = false;
        clearTimeout(this.bgmTimeout);
        
        this.bgmNodes.forEach(node => {
            try {
                node.osc.stop();
            } catch (e) {}
        });
        this.bgmNodes = [];
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    GameAudio.init();
});

// 用户交互后恢复音频上下文
document.addEventListener('click', () => {
    GameAudio.resume();
}, { once: true });
