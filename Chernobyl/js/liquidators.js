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

    // ==================== 2. 鼓泡池潜水员 ====================
    initDiver() {
        const canvas = document.getElementById('diver-canvas');
        canvas.width = 400; canvas.height = 400;
        this.diverPos = { x: 1, y: 1 }; this.state.diverBattery = 100; this.state.diverDose = 0.0;
        this.valves = [{ x: 2, y: 7, opened: false }, { x: 8, y: 1, opened: false }];
        const setupDpad = (btnId, dx, dy) => {
            const btn = document.getElementById(btnId); btn.replaceWith(btn.cloneNode(true));
            document.getElementById(btnId).addEventListener('click', () => this.moveDiver(dx, dy));
        };
        [['btn-dpad-up', 0, -1], ['btn-dpad-down', 0, 1], ['btn-dpad-left', -1, 0], ['btn-dpad-right', 1, 0]].forEach(([b, x, y]) => setupDpad(b, x, y));
        window.onkeydown = (e) => {
            if (this.activeSubgame !== 'diver') return;
            const keys = { ArrowUp: [0,-1], w: [0,-1], ArrowDown: [0,1], s: [0,1], ArrowLeft: [-1,0], a: [-1,0], ArrowRight: [1,0], d: [1,0] };
            if (keys[e.key]) this.moveDiver(keys[e.key][0], keys[e.key][1]);
        };
        const handleGridClick = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const gx = Math.floor((clientX - rect.left) * (canvas.width / rect.width) / 40);
            const gy = Math.floor((clientY - rect.top) * (canvas.height / rect.height) / 40);
            if (gx >= 0 && gx < 10 && gy >= 0 && gy < 10 && this.mazeGrid[gy][gx] === 0) this.moveDiver(gx - this.diverPos.x, gy - this.diverPos.y);
        };
        canvas.replaceWith(canvas.cloneNode(true));
        const newCanvas = document.getElementById('diver-canvas');
        newCanvas.addEventListener('mousedown', (e) => handleGridClick(e.clientX, e.clientY));
        newCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) handleGridClick(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        this.loopDiver();
    }

    moveDiver(dx, dy) {
        if (this.state.gameOver) return;
        const tx = this.diverPos.x + dx, ty = this.diverPos.y + dy;
        if (tx >= 0 && tx < 10 && ty >= 0 && ty < 10 && this.mazeGrid[ty][tx] === 0) {
            this.diverPos.x = tx; this.diverPos.y = ty;
            this.valves.forEach(v => {
                if (v.x === tx && v.y === ty && !v.opened) {
                    v.opened = true; this.stop();
                    if (window.audio) window.audio.playBeep(1800, 0.5, 0.15);
                    const rem = this.valves.filter(vl => !vl.opened).length;
                    this.state.showDialogue(`拧开第 ${2 - rem} 个排污阀`, rem > 0 ? "【水下生死搏斗】在冰冷刺骨且充满放射性废渣的黑水中，恐惧吞噬着呼吸。盖革计数器高频尖叫，手电筒光束在水波中颤抖。你终于摸到了排污阀！阀门因高温生锈卡死，你和同志们咬紧牙关，手掌磨出血泡，合力转动沉重的铁轮……只听‘咔吧’一声，第一个阀门终于拧开，混浊的水流喷涌而出！还剩 1 个排污阀！" : "【双阀全开】第二个排污阀也被拧开！管道发出剧烈颤鸣，积水开始倾泻宣泄，二次热爆炸危机解除！但注意，你们的空气与电量即将耗尽，低温让四肢开始僵硬，身体已到负荷极限！必须立刻在倒计时中往回撤退，爬回最上方的入口舱门 (1,1)！", [{ text: rem > 0 ? "继续寻找剩下的阀门" : "全速返航入口", callback: () => { this.activeSubgame = 'diver'; this.loopDiver(); } }]);
                }
            });
            if (tx === this.diverExit.x && ty === this.diverExit.y && this.valves.every(v => v.opened)) {
                this.stop(); document.getElementById('btn-liq-roof').disabled = false;
                this.state.showDialogue("排水任务成功：向伟大的工人们致敬", "你们精疲力竭地攀上铁梯，爬出淹没的地下室舱门。清凉的夜空空气涌入面罩，你们活下来了！阿纳嫩科、贝斯帕洛夫与巴拉诺夫，三位无畏的下潜英雄用血肉之躯粉碎了炉心毁损扩散的威胁，拯救了欧罗巴千万生灵！祖国和历史将永远铭记这些工人阶级的开路先锋与钢铁意志！", [{ text: "准备进入屋顶清理总决战", callback: () => this.showMenu() }]);
            }
        }
    }

    loopDiver() {
        if (this.activeSubgame !== 'diver') return;
        const canvas = document.getElementById('diver-canvas');
        const ctx = canvas.getContext('2d'), cell = 40;
        this.state.diverBattery = Math.max(0, this.state.diverBattery - 0.01);
        document.getElementById('diver-battery').textContent = Math.round(this.state.diverBattery);

        if (this.state.diverBattery <= 0) {
            this.stop();
            this.state.showDialogue("排水任务失败", "手电筒电池完全耗尽！小队在深不可测的黑暗洪水中迷失。", [{ text: "🔄 重新开始排水任务", callback: () => this.startSubgame('diver') }]);
            return;
        }

        let minDist = 999;
        this.hotspots.forEach(hs => minDist = Math.min(minDist, Math.sqrt((hs.x - this.diverPos.x)**2 + (hs.y - this.diverPos.y)**2)));

        let soundLv = 0;
        if (minDist <= 2.5) {
            soundLv = (2.5 - minDist) / 2.5;
            this.state.diverDose += soundLv * 0.05;
            document.getElementById('diver-dose').textContent = this.state.diverDose.toFixed(1);
            if (this.state.diverDose >= 50.0) {
                this.stop();
                this.state.showDialogue("排水任务失败", "潜水员小队遭遇极重辐射，累积剂量超致死阈值！", [{ text: "🔄 重新开始排水任务", callback: () => this.startSubgame('diver') }]);
                return;
            }
        }
        if (window.audio) window.audio.startGeigerStatic(soundLv * 0.7);

        ctx.fillStyle = '#020502'; ctx.fillRect(0, 0, 400, 400);
        ctx.save(); ctx.beginPath();
        const px = this.diverPos.x * cell + cell/2, py = this.diverPos.y * cell + cell/2;
        const rad = (this.state.diverBattery / 100) * 200 + 150;
        ctx.arc(px, py, rad, 0, Math.PI*2); ctx.clip();

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.mazeGrid[y][x] === 1) {
                    ctx.fillStyle = '#3a543a'; ctx.fillRect(x*cell, y*cell, cell, cell);
                    ctx.strokeStyle = '#5a785a'; ctx.lineWidth = 1.5; ctx.strokeRect(x*cell + 1, y*cell + 1, cell - 2, cell - 2);
                } else {
                    ctx.fillStyle = '#122412'; ctx.fillRect(x*cell, y*cell, cell, cell);
                    ctx.strokeStyle = '#1a301a'; ctx.lineWidth = 0.5; ctx.strokeRect(x*cell, y*cell, cell, cell);
                }
            }
        }

        const gradSpot = ctx.createRadialGradient(px, py, cell/2, px, py, rad);
        gradSpot.addColorStop(0, 'rgba(0, 255, 0, 0.25)'); gradSpot.addColorStop(0.6, 'rgba(0, 255, 0, 0.05)'); gradSpot.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradSpot; ctx.fillRect(0, 0, 400, 400);

        this.hotspots.forEach(hs => {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.beginPath(); ctx.arc(hs.x * cell + cell/2, hs.y * cell + cell/2, 15, 0, Math.PI*2); ctx.fill();
        });
        ctx.restore();

        this.valves.forEach(v => {
            ctx.save(); ctx.shadowBlur = 35; ctx.shadowColor = v.opened ? '#00ff00' : '#ff0000';
            ctx.fillStyle = v.opened ? '#00ff00' : '#ff0000';
            ctx.beginPath(); ctx.arc(v.x * cell + cell/2, v.y * cell + cell/2, 12, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = v.opened ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(v.x * cell + cell/2, v.y * cell + cell/2, 18, 0, Math.PI*2); ctx.stroke(); ctx.restore();
            ctx.fillStyle = '#000'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(v.opened ? "开" : "阀", v.x * cell + cell/2, v.y * cell + cell/2);
        });

        ctx.save(); ctx.shadowBlur = 35; ctx.shadowColor = '#ffaa00'; ctx.fillStyle = 'var(--warning-yellow)';
        ctx.fillRect(this.diverExit.x * cell + 4, this.diverExit.y * cell + 4, cell - 8, cell - 8);
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)'; ctx.lineWidth = 2;
        ctx.strokeRect(this.diverExit.x * cell + 2, this.diverExit.y * cell + 2, cell - 4, cell - 4); ctx.restore();
        ctx.fillStyle = '#000'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText("出口", this.diverExit.x * cell + cell/2, this.diverExit.y * cell + cell/2);

        ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = '#00ff00'; ctx.fillStyle = '#00ff00';
        ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI*2); ctx.fill(); ctx.restore();

        ctx.fillStyle = 'var(--terminal-green)'; ctx.textAlign = 'left'; ctx.font = 'bold 12px monospace';
        const v1 = this.valves[0].opened ? "阀1:已开启" : "阀1:未开启", v2 = this.valves[1].opened ? "阀2:已开启" : "阀2:未开启";
        ctx.fillText(`控制台: ${v1} | ${v2}`, 15, 20);
        ctx.fillStyle = this.valves.every(v => v.opened) ? 'var(--warning-yellow)' : 'var(--terminal-green)';
        ctx.fillText(this.valves.every(v => v.opened) ? "目标: 沿亮光路线前往出口撤离！" : "目标: 寻找并拧开 2 个红色指示灯处的排污阀", 15, 38);

        this.loopId = requestAnimationFrame(() => this.loopDiver());
    }

    // ==================== 3. Masha屋顶清理 ====================
    initRoof() {
        const canvas = document.getElementById('roof-canvas');
        canvas.width = 400; canvas.height = 300;
        this.roofTimer = 90;
        document.getElementById('roof-cleared').textContent = "0";
        this.roofInterval = setInterval(() => {
            this.roofTimer--;
            const el = document.getElementById('roof-timer');
            if (el) el.textContent = this.roofTimer;
            if (this.roofTimer <= 0) {
                this.stop();
                this.state.triggerGameOver("90秒已过！生物机器人没有及时返回铅室，吸收了超致死极量的伽马射线，当场倒在屋顶。");
            }
        }, 1000);
        if (window.audio) window.audio.startGeigerStatic(0.99);
        this.triggerRoofDialogue(1);
        this.loopRoof();
    }

    triggerRoofDialogue(step) {
        if (step === 1) {
            this.state.showDialogue(
                "尼古拉·塔拉卡诺夫 少将",
                "【警报！辐射计指针爆表！】\n屋顶环境辐射高达 12,000 伦琴。西德进口抢险机器人的电路板在几秒内就被强中子束击穿烧毁。国家正处于最危险的关头，人民正处于水深火热之中。我们现在唯一的希望是——“生物机器人”（无畏牺牲的无产阶级工人与士兵同志们）！\n\n同志们，穿上用铅板手工缝制的厚重装甲，拿起铲子，为了祖国，为了千千万万的同胞，冲锋！",
                [{ text: "【下达命令】排队冲上3号堆顶瓦砾堆", callback: () => {
                    document.getElementById('roof-cleared').textContent = "5";
                    if (window.audio) window.audio.playBeep(1000, 0.2, 0.1);
                    this.triggerRoofDialogue(2);
                }}]
            );
        } else if (step === 2) {
            this.state.showDialogue(
                "清理者冲锋（Masha屋顶前线）",
                "【极度高辐射引起臭氧剧烈燃烧，视网膜上闪烁着射线撞击的微弱蓝光】\n你们踏在了被炸飞的石墨堆上，Geiger计数器发出了撕裂般高频尖啸。每一铲石墨的辐射强度都足以在几天内夺去你的生命。但工人们在怒吼，他们在用尽全身力气，把死神抛回炉心！",
                [
                    { text: "【争分夺秒】合力铲起滚烫石墨，抛入堆芯深渊！", callback: () => {
                        document.getElementById('roof-cleared').textContent = "10";
                        if (window.audio) window.audio.playBeep(1200, 0.2, 0.1);
                        this.triggerRoofDialogue(3);
                    }},
                    { text: "【歌颂英雄】用双手与铁撬，撬动压在管道上的庞大石墨！", callback: () => {
                        document.getElementById('roof-cleared').textContent = "10";
                        if (window.audio) window.audio.playBeep(1200, 0.2, 0.1);
                        this.triggerRoofDialogue(3);
                    }}
                ]
            );
        } else if (step === 3) {
            this.state.showDialogue(
                "生死撤退（警钟连环长鸣）",
                "【口腔中充斥着厚重的铜锈铁锈味，防毒面具下呼吸困难】\n最后一批石墨碎块被清理抛下！在这场凡人与核裂变死神的直接搏斗中，清理者们用血肉与钢铁意志赢了！但在强辐射的阻击下，每一秒钟都是在消耗生命，快！立刻撤离！",
                [{ text: "【全速奔跑】跟随急促警钟，立刻狂奔回安全通道！", callback: () => {
                    document.getElementById('roof-cleared').textContent = "15";
                    this.stop();
                    if (window.scenario) window.scenario.onRoofCleaned();
                }}]
            );
        }
    }

    loopRoof() {
        if (this.activeSubgame !== 'roof') return;
        const canvas = document.getElementById('roof-canvas');
        const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#050a05'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; ctx.fillRect(0, (Date.now() / 4) % h, w, 2);

        ctx.fillStyle = '#ff3333'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
        ctx.fillText("⚠️ RADIATION CAMERA OVERLOAD ⚠️", w/2, h/2 - 20);
        ctx.font = '11px monospace';
        ctx.fillText("DOSE RATE: > 12,000 R/h | TELEMETRY ERROR", w/2, h/2 + 10);
        ctx.fillStyle = 'rgba(255, 50, 50, ' + (0.3 + 0.3 * Math.sin(Date.now() / 100)) + ')';
        ctx.fillText("HUMAN CLEANUP TEAM OPERATING...", w/2, h/2 + 35);
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
