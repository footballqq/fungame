/* js/evacuation.js - 电话切断与大巴撤离调度 */
/* codex: 2026-06-06 拖拔电话接线板与画布绘制城市大巴撤离逻辑 */

class EvacuationManager {
    constructor(gameState) {
        this.state = gameState;
        this.timerInterval = null;
        this.timeLeft = 180;
        this.busFleets = []; // 运行中的大巴组
        this.citizens = [
            { id: 1, name: "列宁大街第一社区", x: 120, y: 80, population: 12250, evacuated: 0, status: "idle" },
            { id: 2, name: "库尔恰托夫路第二社区", x: 280, y: 70, population: 12250, evacuated: 0, status: "idle" },
            { id: 3, name: "英雄广场第三社区", x: 150, y: 180, population: 12250, evacuated: 0, status: "idle" },
            { id: 4, name: "普里皮亚季河港第四社区", x: 320, y: 160, population: 12250, evacuated: 0, status: "idle" }
        ];
        
        // 避开核电站 (在坐标 220, 240)
        this.reactorPos = { x: 220, y: 240 };
        this.safeExit = { x: 220, y: 360 };
        
        this.canvas = null;
        this.ctx = null;
        
        // 加载普里皮亚季地图背景
        this.mapImage = new Image();
        this.mapImage.src = 'map.png';
    }

    // 初始化接线板阶段
    initPatchPanel() {
        const board = document.getElementById('patch-board');
        if (!board) return;
        
        board.innerHTML = '';
        const lines = [
            { name: "基辅 (Kiev)", code: "KIEV", type: "long", connected: true },
            { name: "莫斯科 (Moscow)", code: "MOSCOW", type: "long", connected: true },
            { name: "明斯克 (Minsk)", code: "MINSK", type: "long", connected: true },
            { name: "电站值班室", code: "NPP", type: "local", connected: true }
        ];

        lines.forEach(l => {
            const jack = document.createElement('div');
            jack.className = 'patch-jack';
            
            const label = document.createElement('span');
            label.textContent = l.name;
            
            const hole = document.createElement('div');
            hole.className = 'jack-hole connected';
            if (l.type === 'long') {
                hole.classList.add('target');
            }
            
            // 点击拔线
            hole.addEventListener('click', () => {
                if (hole.classList.contains('connected')) {
                    hole.classList.remove('connected');
                    l.connected = false;
                    if (window.audio) window.audio.playBeep(900, 0.1, 0.05); // 拔线声音
                    this.checkPhoneStatus(lines);
                }
            });
            
            jack.appendChild(label);
            jack.appendChild(hole);
            board.appendChild(jack);
        });
    }

    checkPhoneStatus(lines) {
        // 检查是否所有长途电话 (Kiev, Moscow, Minsk) 都已断开
        const longsDisconnected = lines.filter(l => l.type === 'long' && l.connected === false).length === 3;
        
        if (longsDisconnected) {
            // 接线切断成功，过1秒切入撤离阶段
            setTimeout(() => {
                if (window.scenario) {
                    window.scenario.onPhonesCut();
                }
            }, 1000);
        }
    }

    // 初始化大巴调度阶段
    initEvacuationMap() {
        document.getElementById('patchpanel-box').style.display = 'none';
        document.getElementById('bus-dispatch-box').style.display = 'block';

        this.canvas = document.getElementById('evac-map-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布物理尺寸
        this.canvas.width = 400;
        this.canvas.height = 400;

        this.busFleets = [];
        this.timeLeft = 180;
        this.state.citizenDose = 0.0;

        // 监听画布点击
        this.canvas.replaceWith(this.canvas.cloneNode(true));
        this.canvas = document.getElementById('evac-map-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.addEventListener('click', (e) => this.handleMapClick(e));

        // 启动定时器和重绘循环
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);

        this.loop();
    }

    updateTimer() {
        if (this.state.gameOver) {
            clearInterval(this.timerInterval);
            return;
        }

        this.timeLeft--;
        const timerEl = document.getElementById('evac-timer');
        if (timerEl) timerEl.textContent = this.timeLeft;

        if (this.timeLeft <= 0) {
            clearInterval(this.timerInterval);
            this.state.triggerGameOver("撤离超时！高能辐射云笼罩了整座普里皮亚季市，数十万人暴露在致命尘埃中。");
        }
    }

    handleMapClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        // 考虑缩放比例转换坐标
        const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        // 检测是否点击了居民点
        this.citizens.forEach(c => {
            const dist = Math.sqrt((c.x - mx)**2 + (c.y - my)**2);
            if (dist < 20 && c.evacuated < c.population && c.status === 'idle') {
                this.dispatchBus(c);
            }
        });
    }

    dispatchBus(targetCommunity) {
        targetCommunity.status = 'evacuating';
        if (window.audio) window.audio.playBeep(600, 0.2, 0.05);

        // 创建一辆大巴
        this.busFleets.push({
            x: this.safeExit.x,
            y: this.safeExit.y,
            targetX: targetCommunity.x,
            targetY: targetCommunity.y,
            state: 'moving_to', // moving_to, loading, returning, arrived
            targetId: targetCommunity.id,
            progress: 0,
            loadTimer: 0,
            doseAccum: 0.0
        });
    }

    loop() {
        if (this.state.gameOver || this.state.currentPhase !== 5) return;

        this.updatePhysics();
        this.drawMap();

        requestAnimationFrame(() => this.loop());
    }

    updatePhysics() {
        this.busFleets.forEach((bus, index) => {
            const target = this.citizens.find(c => c.id === bus.targetId);
            
            // 辐射云判定：风向东北。电站(220, 240)吹出，如果大巴位于该辐射羽流内，市民吸收辐射
            // 我们简单定义一个圆锥区，或者一个矩形区
            const inPlume = this.checkInRadiationPlume(bus.x, bus.y);
            if (inPlume && bus.state !== 'arrived') {
                bus.doseAccum += 0.5; // 每帧增加剂量
                this.state.citizenDose += 0.1; // 增加全局累积
            }

            if (bus.state === 'moving_to') {
                // 向居民点移动
                const dx = bus.targetX - bus.x;
                const dy = bus.targetY - bus.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 4) {
                    bus.state = 'loading';
                    bus.loadTimer = 40; // 模拟装客40帧
                } else {
                    bus.x += dx / dist * 3;
                    bus.y += dy / dist * 3;
                }
            } else if (bus.state === 'loading') {
                bus.loadTimer--;
                if (bus.loadTimer <= 0) {
                    bus.state = 'returning';
                }
            } else if (bus.state === 'returning') {
                // 回到安全出口
                const dx = this.safeExit.x - bus.x;
                const dy = this.safeExit.y - bus.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 4) {
                    bus.state = 'arrived';
                    target.evacuated += 12250;
                    target.status = target.evacuated >= target.population ? 'completed' : 'idle';
                    
                    // 播放成功卸载平民声
                    if (window.audio) window.audio.playBeep(1500, 0.1, 0.05);

                    // 移除当前大巴
                    this.busFleets.splice(index, 1);
                    this.checkVictoryCondition();
                } else {
                    bus.x += dx / dist * 3;
                    bus.y += dy / dist * 3;
                }
            }
        });

        // 更新数值标签
        const evacEl = document.getElementById('evac-count');
        const doseEl = document.getElementById('evac-dose');
        if (evacEl) {
            const totalEvac = this.citizens.reduce((sum, c) => sum + c.evacuated, 0);
            evacEl.textContent = totalEvac.toLocaleString();
        }
        if (doseEl) {
            doseEl.textContent = this.state.citizenDose.toFixed(1);
        }
    }

    checkInRadiationPlume(x, y) {
        // 电站 (220, 240)。风向东北 (x变大, y变小)
        // 辐射云：从 (220, 240) 发射，夹角范围为 0度 到 60度 (即东北方向)
        const dx = x - this.reactorPos.x;
        const dy = y - this.reactorPos.y; // 向上为负
        
        if (dy < 0 && dx > 0) {
            const angle = Math.atan2(-dy, dx) * 180 / Math.PI;
            if (angle > 10 && angle < 70) {
                // 距离越近辐射越强
                const dist = Math.sqrt(dx*dx + dy*dy);
                return dist < 200; // 影响范围 200像素
            }
        }
        return false;
    }

    drawMap() {
        if (this.mapImage.complete) {
            this.ctx.drawImage(this.mapImage, 0, 0, 400, 400);
            this.ctx.fillStyle = 'rgba(5, 10, 5, 0.65)'; // 叠加深绿滤镜让文字可读
            this.ctx.fillRect(0, 0, 400, 400);
        } else {
            this.ctx.fillStyle = '#050a05';
            this.ctx.fillRect(0, 0, 400, 400);
        }

        // 绘制风向风速箭头（辐射羽流区）
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        this.ctx.beginPath();
        this.ctx.moveTo(this.reactorPos.x, this.reactorPos.y);
        // 东北夹角辐射云形状
        this.ctx.arc(this.reactorPos.x, this.reactorPos.y, 220, -Math.PI/6, -Math.PI/3 * 2, true);
        this.ctx.closePath();
        this.ctx.fill();

        // 绘制辐射云警示文本
        this.ctx.fillStyle = 'rgba(255, 50, 0, 0.4)';
        this.ctx.font = '10px monospace';
        this.ctx.fillText("辐射沉降云 (东北风向)", 250, 120);

        // 绘制安全出口 (基辅方向)
        this.ctx.fillStyle = '#114411';
        this.ctx.fillRect(this.safeExit.x - 40, this.safeExit.y, 80, 40);
        this.ctx.fillStyle = 'var(--terminal-green)';
        this.ctx.font = '12px monospace';
        this.ctx.fillText("基辅安全通道", this.safeExit.x - 36, this.safeExit.y + 22);

        // 绘制核电站
        this.ctx.fillStyle = '#550000';
        this.ctx.beginPath();
        this.ctx.arc(this.reactorPos.x, this.reactorPos.y, 15, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.strokeStyle = 'var(--alert-red)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.fillStyle = 'var(--alert-red)';
        this.ctx.fillText("4号反应堆爆心", this.reactorPos.x - 40, this.reactorPos.y - 20);

        // 绘制各个居民社区
        this.citizens.forEach(c => {
            this.ctx.fillStyle = c.status === 'completed' ? '#003300' : (c.status === 'evacuating' ? '#333300' : '#332200');
            this.ctx.fillRect(c.x - 20, c.y - 20, 40, 40);
            this.ctx.strokeStyle = c.status === 'completed' ? 'var(--terminal-green)' : 'var(--warning-yellow)';
            this.ctx.strokeRect(c.x - 20, c.y - 20, 40, 40);

            // 文字标识
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '8px monospace';
            this.ctx.fillText(c.name, c.x - 25, c.y - 25);
            this.ctx.fillText(`人数:${c.population - c.evacuated}`, c.x - 18, c.y + 5);
        });

        // 绘制运行中的大巴车
        this.busFleets.forEach(bus => {
            this.ctx.fillStyle = 'var(--warning-yellow)';
            this.ctx.beginPath();
            this.ctx.arc(bus.x, bus.y, 6, 0, Math.PI*2);
            this.ctx.fill();
            
            // 绘制大巴载客指示
            if (bus.state === 'returning') {
                this.ctx.fillStyle = 'var(--alert-red)';
                this.ctx.beginPath();
                this.ctx.arc(bus.x, bus.y, 2, 0, Math.PI*2);
                this.ctx.fill();
            }
        });
    }

    checkVictoryCondition() {
        const remaining = this.citizens.reduce((sum, c) => sum + (c.population - c.evacuated), 0);
        if (remaining <= 0) {
            clearInterval(this.timerInterval);
            if (window.scenario) {
                window.scenario.onEvacuationCompleted(this.state.citizenDose);
            }
        }
    }
}

// 挂载到全局
window.EvacuationManager = EvacuationManager;
