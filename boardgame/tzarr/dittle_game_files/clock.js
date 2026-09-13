// codex: 2026-09-13 Dual chess clock manager with independent player time controls
class ChessClock {
    constructor(options = {}) {
        this.whiteTimeMs = options.whiteTimeMs || 300000; // 5 mins default
        this.blackTimeMs = options.blackTimeMs || 300000;
        this.whiteIncrementMs = options.whiteIncrementMs || 0;
        this.blackIncrementMs = options.blackIncrementMs || 0;
        
        this.currentWhiteMs = this.whiteTimeMs;
        this.currentBlackMs = this.blackTimeMs;
        
        this.unlimited = options.unlimited || false;
        this.activePlayer = null; // 'white' or 'black'
        this.isRunning = false;
        this.timerId = null;
        this.lastTimestamp = null;
        
        this.onTick = options.onTick || null;
        this.onTimeout = options.onTimeout || null;
        this.onLowTime = options.onLowTime || null;
        
        this.whiteWarned = false;
        this.blackWarned = false;
    }

    setTimes(whiteSec, blackSec, whiteInc = 0, blackInc = 0, unlimited = false) {
        this.unlimited = unlimited;
        this.whiteTimeMs = whiteSec * 1000;
        this.blackTimeMs = blackSec * 1000;
        this.whiteIncrementMs = whiteInc * 1000;
        this.blackIncrementMs = blackInc * 1000;
        this.reset();
    }

    reset() {
        this.stop();
        this.currentWhiteMs = this.whiteTimeMs;
        this.currentBlackMs = this.blackTimeMs;
        this.activePlayer = null;
        this.whiteWarned = false;
        this.blackWarned = false;
        this.notifyTick();
    }

    start(player = 'white') {
        if (this.unlimited) return;
        this.activePlayer = player;
        this.isRunning = true;
        this.lastTimestamp = performance.now();
        if (this.timerId) clearInterval(this.timerId);
        
        this.timerId = setInterval(() => this.update(), 100);
        this.notifyTick();
    }

    switchTurn(newPlayer) {
        if (!this.unlimited && this.isRunning) {
            // Apply increment to previous player
            if (this.activePlayer === 'white') {
                this.currentWhiteMs += this.whiteIncrementMs;
            } else if (this.activePlayer === 'black') {
                this.currentBlackMs += this.blackIncrementMs;
            }
        }
        this.activePlayer = newPlayer;
        this.lastTimestamp = performance.now();
        this.notifyTick();
    }

    pause() {
        this.isRunning = false;
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    resume() {
        if (this.unlimited || !this.activePlayer) return;
        this.isRunning = true;
        this.lastTimestamp = performance.now();
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(() => this.update(), 100);
    }

    stop() {
        this.pause();
    }

    update() {
        if (!this.isRunning || this.unlimited || !this.activePlayer) return;
        const now = performance.now();
        const delta = now - this.lastTimestamp;
        this.lastTimestamp = now;

        if (this.activePlayer === 'white') {
            this.currentWhiteMs -= delta;
            if (this.currentWhiteMs <= 10000 && !this.whiteWarned) {
                this.whiteWarned = true;
                if (this.onLowTime) this.onLowTime('white');
            }
            if (this.currentWhiteMs <= 0) {
                this.currentWhiteMs = 0;
                this.stop();
                this.notifyTick();
                if (this.onTimeout) this.onTimeout('white');
                return;
            }
        } else {
            this.currentBlackMs -= delta;
            if (this.currentBlackMs <= 10000 && !this.blackWarned) {
                this.blackWarned = true;
                if (this.onLowTime) this.onLowTime('black');
            }
            if (this.currentBlackMs <= 0) {
                this.currentBlackMs = 0;
                this.stop();
                this.notifyTick();
                if (this.onTimeout) this.onTimeout('black');
                return;
            }
        }
        this.notifyTick();
    }

    notifyTick() {
        if (this.onTick) {
            this.onTick({
                whiteMs: Math.max(0, this.currentWhiteMs),
                blackMs: Math.max(0, this.currentBlackMs),
                whiteFormatted: this.formatTime(this.currentWhiteMs),
                blackFormatted: this.formatTime(this.currentBlackMs),
                activePlayer: this.activePlayer,
                isRunning: this.isRunning,
                unlimited: this.unlimited,
                whiteLow: !this.unlimited && this.currentWhiteMs <= 10000,
                blackLow: !this.unlimited && this.currentBlackMs <= 10000
            });
        }
    }

    formatTime(ms) {
        if (this.unlimited) return '∞';
        const totalSec = Math.max(0, Math.ceil(ms / 1000));
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const pad = (n) => (n < 10 ? '0' + n : n);
        return `${pad(mins)}:${pad(secs)}`;
    }
}

window.ChessClock = ChessClock;
