// codex: 2026-06-07 重构清理者行动，抽取潜水与楼顶子游戏为独立文件以防代码膨胀
/* js/liquidators.js - 清理者行动三合一微游戏 */
/* codex: 2026-06-06 潜水员关卡：调亮迷宫视野、使阀门/出口外发光始终可见以防迷失、重构网格渲染与画布大小(400x400) */

class LiquidatorsManager {
    constructor(gameState) {
        this.state = gameState;
        this.activeSubgame = null;
        this.loopId = null;
        
        // 1. 直升机参数
        this.heli = { x: 50, y: 150, targetX: 50, targetY: 150, cargo: 2000, status: "load" };
        this.thermalColumns = [
            { x: 180, y: 150, r: 25 },
            { x: 230, y: 250, r: 30 }
        ];
        
        // 加载直升机卫星背景图与直升机贴图
        this.heliMapImg = new Image();
        this.heliMapImg.src = 'satelite_chornobyl0410-1.jpg';
        this.heliImg = new Image();
        this.heliImg.src = 'helicopter.png';

        // 2. 潜水员迷宫参数 (10x10)
        this.diverPos = { x: 1, y: 1 }; this.diverExit = { x: 1, y: 1 };
        this.valves = [{ x: 2, y: 7, opened: false }, { x: 8, y: 1, opened: false }];
        this.mazeGrid = [
            [1,1,1,1,1,1,1,1,1,1], [1,0,0,0,1,0,0,0,0,1], [1,0,1,0,1,0,1,1,0,1], [1,0,1,0,0,0,0,1,0,1],
            [1,0,1,1,1,1,0,1,0,1], [1,0,0,0,0,1,0,0,0,1], [1,1,1,1,0,1,1,1,0,1], [1,0,0,0,0,0,0,1,0,1],
            [1,1,0,1,1,1,0,0,0,1], [1,1,1,1,1,1,1,1,1,1]
        ];
        this.hotspots = [{ x: 3, y: 3 }, { x: 6, y: 5 }, { x: 5, y: 7 }];

        // 3. 屋顶参数
        this.graphiteBlocks = [];
        this.roofTimer = 90;
        this.roofInterval = null;
    }

    startSubgame(type) {
        this.stop();
        this.activeSubgame = type;
        document.getElementById('liq-menu').style.display = 'none';
        document.getElementById('liq-game-heli').style.display = type === 'heli' ? 'block' : 'none';
        document.getElementById('liq-game-diver').style.display = type === 'diver' ? 'block' : 'none';
        document.getElementById('liq-game-roof').style.display = type === 'roof' ? 'block' : 'none';
        if (type === 'heli') this.initHeli();
        if (type === 'diver') this.initDiver();
        if (type === 'roof') this.initRoof();
    }
    stop() {
        if (this.loopId) { cancelAnimationFrame(this.loopId); this.loopId = null; }
        if (this.roofInterval) { clearInterval(this.roofInterval); this.roofInterval = null; }
        if (window.audio) window.audio.stopGeigerStatic();
    }

    // ==================== 1. 直升机空投 ====================
    initHeli() {
        const canvas = document.getElementById('heli-canvas');
        canvas.width = 400; canvas.height = 300;
        this.heli = { x: 50, y: 150, targetX: 50, targetY: 150, cargo: 2000, status: "load" };

        const updatePosition = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            this.heli.x = this.heli.targetX = (clientX - rect.left) * (canvas.width / rect.width);
            this.heli.y = this.heli.targetY = (clientY - rect.top) * (canvas.height / rect.height);
        };

        const handleMove = (e) => updatePosition(e.clientX, e.clientY);
        const handleTouch = (e) => {
            e.preventDefault();
            if (e.touches.length > 0) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
        };

        canvas.replaceWith(canvas.cloneNode(true));
        const newCanvas = document.getElementById('heli-canvas');
        ['mousemove', 'mouseenter'].forEach(ev => newCanvas.addEventListener(ev, handleMove));
        newCanvas.addEventListener('touchmove', handleTouch, { passive: false });

        newCanvas.addEventListener('mousedown', (e) => { updatePosition(e.clientX, e.clientY); this.dropCargo(); });
        newCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) { updatePosition(e.touches[0].clientX, e.touches[0].clientY); this.dropCargo(); }
        }, { passive: false });

        const textDropBtn = document.getElementById('btn-heli-text-drop');
        if (textDropBtn) {
            textDropBtn.replaceWith(textDropBtn.cloneNode(true));
            document.getElementById('btn-heli-text-drop').addEventListener('click', () => {
                this.heli.x = this.heli.targetX = 250;
                this.heli.y = this.heli.targetY = 150;
                this.dropCargo();
            });
        }
        this.loopHeli();
    }

    dropCargo() {
        if (this.heli.cargo > 0) {
            const dist = Math.sqrt((this.heli.x - 250)**2 + (this.heli.y - 150)**2);
            if (dist < 40) {
                this.state.heliSand += this.heli.cargo;
                this.heli.cargo = 0;
                this.heli.status = "return";
                if (window.audio) window.audio.playBeep(400, 0.4, 0.1);
                document.getElementById('heli-sand').textContent = this.state.heliSand;

                if (this.state.heliSand >= 5000) {
                    this.stop();
                    document.getElementById('btn-liq-diver').disabled = false;
                    this.state.showDialogue("尼古拉少将", "第一阶段空投任务圆满完成！我们封堵了大部分火口。接下来必须派人排干下方的水！", [
                        { text: "准备进行下潜任务", callback: () => this.showMenu() }
                    ]);
                } else {
                    setTimeout(() => {
                        if (this.activeSubgame === 'heli') {
                            this.heli.cargo = 2000;
                            this.heli.status = "load";
                            if (window.audio) window.audio.playBeep(1000, 0.1, 0.05);
                        }
                    }, 1000);
                }
            }
        }
    }

    loopHeli() {
        if (this.activeSubgame !== 'heli') return;
        const canvas = document.getElementById('heli-canvas');
        const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;

        if (typeof this.heli.targetX === 'number' && !isNaN(this.heli.targetX)) this.heli.x = this.heli.targetX;
        if (typeof this.heli.targetY === 'number' && !isNaN(this.heli.targetY)) this.heli.y = this.heli.targetY;

        if (this.heli.x < 80 && this.heli.cargo === 0) {
            this.heli.cargo = 2000;
            this.heli.status = "load";
            if (window.audio) window.audio.playBeep(1000, 0.1, 0.05);
        }

        const dist = Math.sqrt((this.heli.x - 250)**2 + (this.heli.y - 150)**2);
        let radIntensity = 0;
        if (dist < 80) {
            radIntensity = (80 - dist) / 80;
            this.state.heliDose += radIntensity * 0.01;
            document.getElementById('heli-dose').textContent = this.state.heliDose.toFixed(2);
            if (this.state.heliDose >= 2.0) {
                this.state.triggerGameOver("直升机飞行员遭受过量致死辐射！空投编队坠毁。");
                return;
            }
        }
        if (window.audio) window.audio.startGeigerStatic(radIntensity * 0.8);

        if (this.heliMapImg.complete) {
            ctx.drawImage(this.heliMapImg, 0, 0, w, h);
            ctx.fillStyle = 'rgba(10, 15, 10, 0.65)'; ctx.fillRect(0, 0, w, h);
        } else {
            ctx.fillStyle = '#0a0d0a'; ctx.fillRect(0, 0, w, h);
        }

        ctx.fillStyle = '#112211'; ctx.fillRect(0, 0, 80, h);
        ctx.fillStyle = 'var(--terminal-green)'; ctx.font = '10px monospace';
        ctx.fillText("装料区", 15, h/2);

        ctx.fillStyle = 'rgba(255, 50, 0, 0.2)'; ctx.beginPath(); ctx.arc(250, 150, 40, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 150, 0, 0.6)'; ctx.beginPath(); ctx.arc(250, 150, 20, 0, Math.PI*2); ctx.fill();

        this.thermalColumns.forEach(tc => {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.1)'; ctx.beginPath(); ctx.arc(tc.x, tc.y, tc.r, 0, Math.PI*2); ctx.fill();
        });

        if (this.heliImg && this.heliImg.complete) {
            const size = 28;
            ctx.drawImage(this.heliImg, this.heli.x - size / 2, this.heli.y - size / 2, size, size);
            if (this.heli.cargo > 0) {
                ctx.fillStyle = 'var(--warning-yellow)'; ctx.beginPath(); ctx.arc(this.heli.x, this.heli.y - size/2 - 2, 3, 0, Math.PI*2); ctx.fill();
            }
        } else {
            ctx.fillStyle = this.heli.cargo > 0 ? 'var(--warning-yellow)' : '#88aa88';
            ctx.beginPath(); ctx.arc(this.heli.x, this.heli.y, 10, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.stroke();
        }

        this.loopId = requestAnimationFrame(() => this.loopHeli());
    }

    showMenu() {
        this.stop();
        this.activeSubgame = null;
        document.getElementById('liq-menu').style.display = 'flex';
        document.getElementById('liq-game-heli').style.display = 'none';
        document.getElementById('liq-game-diver').style.display = 'none';
        document.getElementById('liq-game-roof').style.display = 'none';
    }
}

// 挂载至全局
window.LiquidatorsManager = LiquidatorsManager;
