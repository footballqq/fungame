/* js/audio.js - 网页音频合成器 */
/* codex: 2026-06-06 Web Audio API 实现盖革计数器爆音及警报声 */

class ChernobylAudio {
    constructor() {
        this.ctx = null;
        this.noiseBuffer = null;
        this.alarmInterval = null;
        this.alarmOsc = null;
        this.alarmGain = null;
        this.geigerInterval = null;
        this.muted = false;
    }

    // 初始化音频上下文，需要在用户交互后调用
    init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this._createNoiseBuffer();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    // 产生白噪音缓存区以制作盖革计数器的咔哒声
    _createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2; // 2秒白噪声
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    // 播放按键音
    playBeep(freq = 1200, duration = 0.05, volume = 0.08) {
        if (this.muted || !this.ctx) return;
        this.init(); // 兜底初始化
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // 播放单次盖革计数器咔哒声
    playGeigerClick() {
        if (this.muted || !this.ctx || !this.noiseBuffer) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        
        const gain = this.ctx.createGain();
        // 盖革声极其短促且呈指数级衰减
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.002);
        
        // 加上低通滤波让咔哒声更有金属空腔感
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 2;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        source.start();
        source.stop(this.ctx.currentTime + 0.005);
    }

    // 持续发出盖革爆音，根据辐射强度(cpm/R/h)调节频率
    // level: 0到1之间的强度值
    startGeigerStatic(level) {
        this.stopGeigerStatic();
        if (level <= 0) return;
        
        // 辐射强度等级映射到随机的时间间隔
        const play = () => {
            if (this.muted) return;
            this.playGeigerClick();
            
            // 辐射强度越大，下一次咔哒声间隔越短
            // 基础背景辐射(level很小)间隔约 500-1500ms
            // 极高辐射(level接近1)间隔约 5-20ms
            const minDelay = 10;
            const maxDelay = 1500;
            const delay = minDelay + (1 - level) * (maxDelay - minDelay) * (0.3 + Math.random() * 0.7);
            
            this.geigerInterval = setTimeout(play, delay);
        };
        play();
    }

    stopGeigerStatic() {
        if (this.geigerInterval) {
            clearTimeout(this.geigerInterval);
            this.geigerInterval = null;
        }
    }

    // 启动AZ-5紧急警报（双音交替振荡）
    startAlarm() {
        this.stopAlarm();
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.alarmOsc = this.ctx.createOscillator();
        this.alarmGain = this.ctx.createGain();
        
        this.alarmOsc.type = 'sawtooth';
        this.alarmOsc.frequency.setValueAtTime(600, this.ctx.currentTime);
        
        this.alarmGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        
        this.alarmOsc.connect(this.alarmGain);
        this.alarmGain.connect(this.ctx.destination);
        this.alarmOsc.start();

        let toggle = false;
        this.alarmInterval = setInterval(() => {
            if (this.muted || !this.ctx) return;
            // 每0.5秒在 600Hz 和 900Hz 之间切换
            const freq = toggle ? 600 : 900;
            this.alarmOsc.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + 0.15);
            toggle = !toggle;
        }, 500);
    }

    stopAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
        if (this.alarmOsc) {
            try {
                this.alarmOsc.stop();
            } catch(e){}
            this.alarmOsc = null;
        }
        this.alarmGain = null;
    }
}

// 挂载到全局
window.ChernobylAudio = ChernobylAudio;
