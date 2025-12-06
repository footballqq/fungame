// track.js - 赛道绘制模块
const Track = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    trackCount: 3,
    trackHeight: 0,
    trackPadding: 30,
    raceDistance: 100, // 默认100m
    hurdles: [], // 栏架位置
    
    colors: {
        bg: '#0a0a0f',
        track: '#1a1a2e',
        line: '#00ffff',
        lineGlow: 'rgba(0, 255, 255, 0.3)',
        startLine: '#00ff88',
        finishLine: '#ff00ff',
        hurdle: '#ffaa00',
        grid: 'rgba(0, 255, 255, 0.1)'
    },

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // 确保有有效尺寸
        const w = rect.width || window.innerWidth;
        const h = rect.height || (window.innerHeight - 80);
        
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.width = w;
        this.height = h;
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
        this.ctx.scale(dpr, dpr);
        this.trackHeight = (h - this.trackPadding * 2) / this.trackCount;
    },

    setMode(mode) {
        if (mode === '100m') {
            this.raceDistance = 100;
            this.hurdles = [];
        } else if (mode === '110m') {
            this.raceDistance = 110;
            // 110米栏：10个栏架，从13.72m开始，间隔9.14m
            this.hurdles = [];
            for (let i = 0; i < 10; i++) {
                this.hurdles.push(13.72 + i * 9.14);
            }
        }
    },

    clear() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // 背景
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, w, h);
        
        // 网格效果
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    },

    drawTracks() {
        const ctx = this.ctx;
        const w = this.width;
        const trackWidth = w - 100;
        const startX = 50;
        
        for (let i = 0; i < this.trackCount; i++) {
            const y = this.trackPadding + i * this.trackHeight + this.trackHeight / 2 + 10;
            
            // 赛道线（只有底部一条线）
            ctx.shadowColor = this.colors.line;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = this.colors.line;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + trackWidth, y);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            
            // 赛道标签
            ctx.fillStyle = '#888';
            ctx.font = 'bold 12px monospace';
            const label = i === 1 ? '► YOU' : `  AI${i === 0 ? 1 : 2}`;
            ctx.fillText(label, 5, y - 5);
        }
    },

    drawStartFinishLines() {
        const ctx = this.ctx;
        const w = this.width;
        const trackWidth = w - 100;
        const startX = 50;
        const finishX = startX + trackWidth;
        
        // 起跑线
        ctx.shadowColor = this.colors.startLine;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = this.colors.startLine;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, this.trackPadding - 10);
        ctx.lineTo(startX, this.trackPadding + this.trackCount * this.trackHeight + 10);
        ctx.stroke();
        
        // 起跑线标签
        ctx.fillStyle = this.colors.startLine;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('START', startX - 20, this.trackPadding - 15);
        
        // 终点线
        ctx.shadowColor = this.colors.finishLine;
        ctx.strokeStyle = this.colors.finishLine;
        ctx.beginPath();
        ctx.moveTo(finishX, this.trackPadding - 10);
        ctx.lineTo(finishX, this.trackPadding + this.trackCount * this.trackHeight + 10);
        ctx.stroke();
        
        // 终点线标签
        ctx.fillText('FINISH', finishX - 25, this.trackPadding - 15);
        
        ctx.shadowBlur = 0;
    },

    drawHurdles(players) {
        if (this.hurdles.length === 0) return;
        
        const ctx = this.ctx;
        const w = this.width;
        const trackWidth = w - 100;
        const startX = 50;
        
        ctx.shadowColor = this.colors.hurdle;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.colors.hurdle;
        
        for (let i = 0; i < this.trackCount; i++) {
            const y = this.trackPadding + i * this.trackHeight + this.trackHeight / 2;
            
            for (const hurdlePos of this.hurdles) {
                const x = startX + (hurdlePos / this.raceDistance) * trackWidth;
                
                // 栏架
                ctx.fillRect(x - 3, y - 12, 6, 24);
                
                // 横杆
                ctx.fillRect(x - 8, y - 8, 16, 4);
            }
        }
        
        ctx.shadowBlur = 0;
    },

    drawPlayers(players) {
        const ctx = this.ctx;
        const w = this.width;
        const trackWidth = w - 100;
        const startX = 50;
        const ballRadius = 12;
        
        players.forEach((player, index) => {
            const groundY = this.trackPadding + index * this.trackHeight + this.trackHeight / 2 + 10;
            const x = startX + (player.distance / this.raceDistance) * trackWidth;
            const y = groundY - ballRadius + player.jumpOffset; // 球在线上方
            
            // 玩家发光球
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, ballRadius + 4);
            
            if (player.isPlayer) {
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.4, '#00ffff');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                ctx.shadowColor = '#00ffff';
            } else {
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.4, '#ff00ff');
                gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
                ctx.shadowColor = '#ff00ff';
            }
            
            ctx.shadowBlur = 25;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 跳跃时的拖影
            if (player.isJumping) {
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(x - 8, y + 5, ballRadius * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            // 摔倒效果
            if (player.isFallen) {
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ff4444';
                ctx.font = '20px sans-serif';
                ctx.fillText('💫', x - 10, y - 15);
            }
            
            ctx.shadowBlur = 0;
        });
    },

    drawDistanceMarkers() {
        const ctx = this.ctx;
        const w = this.width;
        const trackWidth = w - 100;
        const startX = 50;
        const markerInterval = this.raceDistance <= 100 ? 10 : 10;
        
        ctx.fillStyle = '#444';
        ctx.font = '10px monospace';
        
        for (let d = markerInterval; d < this.raceDistance; d += markerInterval) {
            const x = startX + (d / this.raceDistance) * trackWidth;
            ctx.fillText(`${d}m`, x - 10, this.trackPadding + this.trackCount * this.trackHeight + 20);
        }
    },

    render(players) {
        this.clear();
        this.drawTracks();
        this.drawStartFinishLines();
        this.drawDistanceMarkers();
        this.drawHurdles(players);
        this.drawPlayers(players);
    }
};
