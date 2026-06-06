/* js/liquidators.js - 清理者行动三合一微游戏 */
/* codex: 2026-06-06 直升机投沙、潜水员迷宫、屋顶90秒清理微游戏逻辑 */

class LiquidatorsManager {
    constructor(gameState) {
        this.state = gameState;
        this.activeSubgame = null;
        this.loopId = null;
        
        // 1. 直升机参数
        this.heli = { x: 50, y: 200, targetX: 50, targetY: 200, cargo: 500, status: "load" }; // status: load, fly
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
        this.diverPos = { x: 1, y: 1 }; this.diverExit = { x: 8, y: 8 };
        this.valves = [{ x: 2, y: 7, opened: false }, { x: 7, y: 2, opened: false }];
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
        canvas.width = 400;
        canvas.height = 300;
        this.heli = { x: 50, y: 150, cargo: 500, status: "load" };

        // 鼠标拖拽飞行
        const handleMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            this.heli.targetX = (e.clientX - rect.left) * (canvas.width / rect.width);
            this.heli.targetY = (e.clientY - rect.top) * (canvas.height / rect.height);
        };
        const handleTouch = (e) => {
            if (e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect();
                this.heli.targetX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
                this.heli.targetY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
            }
        };

        canvas.replaceWith(canvas.cloneNode(true));
        const newCanvas = document.getElementById('heli-canvas');
        newCanvas.addEventListener('mousemove', handleMove);
        newCanvas.addEventListener('touchmove', handleTouch);
        
        // 点击空投
        newCanvas.addEventListener('mousedown', () => this.dropCargo());
        newCanvas.addEventListener('touchstart', () => this.dropCargo());

        this.loopHeli();
    }

    dropCargo() {
        if (this.heli.cargo > 0) {
            // 判断是否在堆芯正上方 (250, 150) 附近
            const dist = Math.sqrt((this.heli.x - 250)**2 + (this.heli.y - 150)**2);
            if (dist < 40) {
                this.state.heliSand += this.heli.cargo;
                this.heli.cargo = 0;
                this.heli.status = "return";
                if (window.audio) window.audio.playBeep(400, 0.4, 0.1); // 空投音
                
                document.getElementById('heli-sand').textContent = this.state.heliSand;
                
                // 检查胜利
                if (this.state.heliSand >= 5000) {
                    this.stop();
                    document.getElementById('btn-liq-diver').disabled = false;
                    this.state.showDialogue("尼古拉少将", "第一阶段空投任务圆满完成！我们封堵了大部分火口。接下来必须派人排干下方的水！", [
                        { text: "准备进行下潜任务", callback: () => this.showMenu() }
                    ]);
                }
            }
        }
    }

    loopHeli() {
        if (this.activeSubgame !== 'heli') return;
        const canvas = document.getElementById('heli-canvas');
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // 更新物理
        this.heli.x += (this.heli.targetX - this.heli.x) * 0.1;
        this.heli.y += (this.heli.targetY - this.heli.y) * 0.1;

        // 自动装载判定：在基地 (x < 80)
        if (this.heli.x < 80 && this.heli.cargo === 0) {
            this.heli.cargo = 500;
            this.heli.status = "load";
            if (window.audio) window.audio.playBeep(1000, 0.1, 0.05);
        }

        // 辐射剂量判定：靠近堆芯 (250, 150) 时剂量快速累积
        const dist = Math.sqrt((this.heli.x - 250)**2 + (this.heli.y - 150)**2);
        let radIntensity = 0;
        if (dist < 80) {
            radIntensity = (80 - dist) / 80; // 0 到 1
            this.state.heliDose += radIntensity * 0.01;
            document.getElementById('heli-dose').textContent = this.state.heliDose.toFixed(2);
            
            if (this.state.heliDose >= 2.0) {
                this.state.triggerGameOver("直升机飞行员遭受过量致死辐射！空投编队坠毁。");
                return;
            }
        }
        if (window.audio) window.audio.startGeigerStatic(radIntensity * 0.8);

        // 绘图
        if (this.heliMapImg.complete) {
            ctx.drawImage(this.heliMapImg, 0, 0, w, h);
            ctx.fillStyle = 'rgba(10, 15, 10, 0.65)'; // 叠加深色滤镜以保证HUD内容清晰可见
            ctx.fillRect(0, 0, w, h);
        } else {
            ctx.fillStyle = '#0a0d0a';
            ctx.fillRect(0, 0, w, h);
        }

        // 绘制基地 (左侧)
        ctx.fillStyle = '#112211';
        ctx.fillRect(0, 0, 80, h);
        ctx.fillStyle = 'var(--terminal-green)';
        ctx.font = '10px monospace';
        ctx.fillText("装料区", 15, h/2);

        // 绘制反应堆火口 (250, 150)
        ctx.fillStyle = 'rgba(255, 50, 0, 0.2)';
        ctx.beginPath(); ctx.arc(250, 150, 40, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 150, 0, 0.6)';
        ctx.beginPath(); ctx.arc(250, 150, 20, 0, Math.PI*2); ctx.fill();

        // 绘制上升热气流柱
        this.thermalColumns.forEach(tc => {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
            ctx.beginPath(); ctx.arc(tc.x, tc.y, tc.r, 0, Math.PI*2); ctx.fill();
        });

        // 绘制直升机
        if (this.heliImg && this.heliImg.complete) {
            const size = 36;
            ctx.drawImage(this.heliImg, this.heli.x - size / 2, this.heli.y - size / 2, size, size);
            if (this.heli.cargo > 0) {
                ctx.fillStyle = 'var(--warning-yellow)';
                ctx.beginPath(); ctx.arc(this.heli.x, this.heli.y - size/2 - 2, 4, 0, Math.PI*2); ctx.fill();
            }
        } else {
            ctx.fillStyle = this.heli.cargo > 0 ? 'var(--warning-yellow)' : '#88aa88';
            ctx.beginPath(); ctx.arc(this.heli.x, this.heli.y, 10, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.stroke();
        }

        this.loopId = requestAnimationFrame(() => this.loopHeli());
    }

    // ==================== 2. 鼓泡池潜水员 ====================
    initDiver() {
        const canvas = document.getElementById('diver-canvas');
        canvas.width = 300;
        canvas.height = 300;
        this.diverPos = { x: 1, y: 1 };
        this.state.diverBattery = 100;
        this.state.diverDose = 0.0;
        this.valves = [
            { x: 2, y: 7, opened: false },
            { x: 7, y: 2, opened: false }
        ];

        // 虚拟摇杆按键事件
        const setupDpad = (btnId, dx, dy) => {
            const btn = document.getElementById(btnId);
            btn.replaceWith(btn.cloneNode(true));
            document.getElementById(btnId).addEventListener('click', () => this.moveDiver(dx, dy));
        };
        setupDpad('btn-dpad-up', 0, -1); setupDpad('btn-dpad-down', 0, 1);
        setupDpad('btn-dpad-left', -1, 0); setupDpad('btn-dpad-right', 1, 0);

        // 键盘事件监听
        window.onkeydown = (e) => {
            if (this.activeSubgame !== 'diver') return;
            if (e.key === 'ArrowUp' || e.key === 'w') this.moveDiver(0, -1);
            if (e.key === 'ArrowDown' || e.key === 's') this.moveDiver(0, 1);
            if (e.key === 'ArrowLeft' || e.key === 'a') this.moveDiver(-1, 0);
            if (e.key === 'ArrowRight' || e.key === 'd') this.moveDiver(1, 0);
        };

        this.loopDiver();
    }

    moveDiver(dx, dy) {
        if (this.state.gameOver) return;
        const tx = this.diverPos.x + dx;
        const ty = this.diverPos.y + dy;

        // 碰撞检测
        if (tx >= 0 && tx < 10 && ty >= 0 && ty < 10) {
            if (this.mazeGrid[ty][tx] === 0) {
                this.diverPos.x = tx;
                this.diverPos.y = ty;

                // 交互点判定：碰触阀门
                this.valves.forEach(v => {
                    if (v.x === this.diverPos.x && v.y === this.diverPos.y && !v.opened) {
                        v.opened = true;
                        if (window.audio) window.audio.playBeep(2000, 0.4, 0.1);
                    }
                });

                // 检查是否在出口且阀门已全部开启
                if (this.diverPos.x === this.diverExit.x && this.diverPos.y === this.diverExit.y) {
                    const allOpened = this.valves.every(v => v.opened);
                    if (allOpened) {
                        this.stop();
                        document.getElementById('btn-liq-roof').disabled = false;
                        this.state.showDialogue("阿纳嫩科", "水排干了！我们成功了！地下水池警报解除。接下来是清理屋顶废墟的决战！", [
                            { text: "准备进行屋顶清理", callback: () => this.showMenu() }
                        ]);
                    }
                }
            }
        }
    }

    loopDiver() {
        if (this.activeSubgame !== 'diver') return;
        const canvas = document.getElementById('diver-canvas');
        const ctx = canvas.getContext('2d');
        const cell = 30;

        // 物理逻辑更新
        this.state.diverBattery = Math.max(0, this.state.diverBattery - 0.03);
        document.getElementById('diver-battery').textContent = Math.round(this.state.diverBattery);

        if (this.state.diverBattery <= 0) {
            this.state.triggerGameOver("手电筒电池完全耗尽！小队在深不可测的黑暗洪水中迷失。");
            return;
        }

        // 辐射计算：根据距离地面放射性瓦砾的距离
        let minDist = 999;
        this.hotspots.forEach(hs => {
            const d = Math.sqrt((hs.x - this.diverPos.x)**2 + (hs.y - this.diverPos.y)**2);
            if (d < minDist) minDist = d;
        });

        let soundLv = 0;
        if (minDist <= 2.5) {
            soundLv = (2.5 - minDist) / 2.5;
            this.state.diverDose += soundLv * 0.2;
            document.getElementById('diver-dose').textContent = this.state.diverDose.toFixed(1);
            if (this.state.diverDose >= 50.0) {
                this.state.triggerGameOver("潜水员小队遭遇极重辐射，累积剂量超致死阈值！");
                return;
            }
        }
        if (window.audio) window.audio.startGeigerStatic(soundLv * 0.7);

        // 绘图
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 300, 300);

        // 1. 绘制手电筒照亮区域 (手电筒遮罩效果)
        ctx.save();
        ctx.beginPath();
        const px = this.diverPos.x * cell + cell/2;
        const py = this.diverPos.y * cell + cell/2;
        const rad = (this.state.diverBattery / 100) * 80 + 30; // 光圈随电量收缩
        ctx.arc(px, py, rad, 0, Math.PI*2);
        ctx.clip();

        // 绘制迷宫图
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.mazeGrid[y][x] === 1) {
                    ctx.fillStyle = '#1e281e'; // 墙体
                    ctx.fillRect(x*cell, y*cell, cell, cell);
                } else {
                    ctx.fillStyle = '#050f05'; // 通道
                    ctx.fillRect(x*cell, y*cell, cell, cell);
                }
            }
        }

        // 绘制阀门
        this.valves.forEach(v => {
            ctx.fillStyle = v.opened ? 'var(--terminal-green)' : 'var(--alert-red)';
            ctx.beginPath();
            ctx.arc(v.x * cell + cell/2, v.y * cell + cell/2, 6, 0, Math.PI*2);
            ctx.fill();
        });

        // 绘制安全出口
        ctx.fillStyle = 'var(--warning-yellow)';
        ctx.fillRect(this.diverExit.x * cell + 2, this.diverExit.y * cell + 2, cell - 4, cell - 4);

        // 绘制辐射热点 (隐约透出的微弱红色微光)
        this.hotspots.forEach(hs => {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            ctx.beginPath(); ctx.arc(hs.x * cell + cell/2, hs.y * cell + cell/2, 10, 0, Math.PI*2); ctx.fill();
        });

        // 恢复裁剪区
        ctx.restore();

        // 绘制潜水员 (不受裁剪遮蔽限制)
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI*2);
        ctx.fill();

        this.loopId = requestAnimationFrame(() => this.loopDiver());
    }

    // ==================== 3. Masha屋顶清理 ====================
    initRoof() {
        const canvas = document.getElementById('roof-canvas');
        canvas.width = 400;
        canvas.height = 300;

        this.graphiteBlocks = [];
        this.roofTimer = 90;
        this.state.roofCleared = 0;
        document.getElementById('roof-cleared').textContent = 0;

        // 生成15块随机石墨碎片
        for (let i = 0; i < 15; i++) {
            this.graphiteBlocks.push({
                x: 100 + Math.random() * 250,
                y: 50 + Math.random() * 200,
                radius: 8 + Math.random() * 6,
                cleared: false
            });
        }

        // 点击移除石墨
        const handleInteraction = (ex, ey) => {
            if (this.state.gameOver) return;

            // 检查是否点在未清理的石墨上
            this.graphiteBlocks.forEach(b => {
                if (!b.cleared) {
                    const d = Math.sqrt((b.x - ex)**2 + (b.y - ey)**2);
                    if (d < b.radius + 15) { // 增加判定面积方便操作
                        b.cleared = true;
                        this.state.roofCleared++;
                        document.getElementById('roof-cleared').textContent = this.state.roofCleared;
                        if (window.audio) window.audio.playBeep(1500, 0.05, 0.1);
                    }
                }
            });

            // 如果全部清理完，且回到了绿色大门口 (x < 60)
            if (this.state.roofCleared >= 15 && ex < 80 && ey > 100 && ey < 200) {
                this.stop();
                if (window.scenario) {
                    window.scenario.onRoofCleaned();
                }
            }
        };

        const handleCanvasClick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const ex = (e.clientX - rect.left) * (canvas.width / rect.width);
            const ey = (e.clientY - rect.top) * (canvas.height / rect.height);
            handleInteraction(ex, ey);
        };
        const handleCanvasTouch = (e) => {
            if (e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect();
                const ex = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
                const ey = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
                handleInteraction(ex, ey);
            }
        };

        canvas.replaceWith(canvas.cloneNode(true));
        const newCanvas = document.getElementById('roof-canvas');
        newCanvas.addEventListener('mousedown', handleCanvasClick);
        newCanvas.addEventListener('touchstart', handleCanvasTouch);

        // 倒计时器
        this.roofInterval = setInterval(() => {
            this.roofTimer--;
            document.getElementById('roof-timer').textContent = this.roofTimer;
            if (this.roofTimer <= 0) {
                this.stop();
                this.state.triggerGameOver("90秒已过！生物机器人没有及时返回铅室，吸收了超致死极量的伽马射线，当场倒在屋顶。");
            }
        }, 1000);

        // 疯狂爆发盖革计数器爆鸣声！
        if (window.audio) {
            window.audio.startGeigerStatic(0.99); // 啸叫级别
        }

        this.loopRoof();
    }

    loopRoof() {
        if (this.activeSubgame !== 'roof') return;
        const canvas = document.getElementById('roof-canvas');
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#191f19';
        ctx.fillRect(0, 0, w, h);

        // 绘制安全门通道 (左侧绿色区域)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(0, 100, 80, 100);
        ctx.strokeStyle = 'var(--terminal-green)';
        ctx.strokeRect(0, 100, 80, 100);
        ctx.fillStyle = 'var(--terminal-green)';
        ctx.font = '10px monospace';
        ctx.fillText("安全门通道", 10, 150);

        // 绘制石墨扔卸开口 (右下角大孔)
        ctx.fillStyle = '#050505';
        ctx.beginPath(); ctx.arc(360, 250, 30, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'var(--alert-red)';
        ctx.stroke();
        ctx.fillStyle = 'var(--alert-red)';
        ctx.fillText("向此口抛弃", 330, 210);

        // 绘制石墨块
        this.graphiteBlocks.forEach(b => {
            if (!b.cleared) {
                ctx.fillStyle = '#444444';
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = 'var(--alert-red)';
                ctx.stroke();
            }
        });

        // 绘制由于高辐射产生的粒子噪点和画面撕裂 (屏幕雪花效果)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 40; i++) {
            const rx = Math.random() * w;
            const ry = Math.random() * h;
            ctx.fillRect(rx, ry, 2, 2);
        }

        this.loopId = requestAnimationFrame(() => this.loopRoof());
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
