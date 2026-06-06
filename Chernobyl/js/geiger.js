/* js/geiger.js - 盖革计数器探测与废墟迷宫探索 */
/* codex: 2026-06-06 走廊迷宫、盖革爆音反馈与保险箱八进制解谜 */

class GeigerExplorer {
    constructor(gameState) {
        this.state = gameState;
        this.playerPos = { x: 0, y: 0 };
        this.safePos = { x: 5, y: 5 };
        
        // 迷宫地图大小与碎石障碍物
        this.gridSize = 6;
        this.rubbleList = [
            { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 4, y: 1 },
            { x: 4, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 },
            { x: 0, y: 5 }, { x: 3, y: 4 }, { x: 4, y: 4 }
        ];
        
        this.currentDose = 0.05; // 伦琴/小时 (R/h)
        this.hasHighRangeMeter = false;
    }

    init() {
        this.playerPos = { x: 0, y: 0 };
        this.hasHighRangeMeter = false;
        
        // 隐藏/显示容器
        document.getElementById('safe-puzzle-container').style.display = 'none';
        
        this.renderGrid();
        this.updateMeter(0.05); // 初始微弱背景辐射
        
        // 开始播放背景盖革声
        if (window.audio) {
            window.audio.startGeigerStatic(0.15); // 较弱的背景杂音
        }
    }

    renderGrid() {
        const gridContainer = document.getElementById('geiger-grid');
        if (!gridContainer) return;
        
        gridContainer.innerHTML = '';
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                
                // 设置特殊标志
                if (x === this.playerPos.x && y === this.playerPos.y) {
                    cell.classList.add('player');
                    cell.classList.add('revealed');
                } else if (this.isRubble(x, y)) {
                    cell.classList.add('rubble');
                } else if (x === this.safePos.x && y === this.safePos.y) {
                    cell.classList.add('safe');
                }
                
                // 点击移动
                cell.addEventListener('click', () => {
                    this.movePlayer(x, y);
                });
                
                gridContainer.appendChild(cell);
            }
        }
    }

    isRubble(x, y) {
        return this.rubbleList.some(r => r.x === x && r.y === y);
    }

    movePlayer(tx, ty) {
        if (this.state.gameOver) return;

        // 只能移动到相邻格 (曼哈顿距离为1)
        const dist = Math.abs(tx - this.playerPos.x) + Math.abs(ty - this.playerPos.y);
        if (dist !== 1) return;

        // 不能踩在碎石上
        if (this.isRubble(tx, ty)) {
            if (window.audio) window.audio.playBeep(300, 0.1, 0.1);
            return;
        }

        // 移动成功
        this.playerPos.x = tx;
        this.playerPos.y = ty;
        this.renderGrid();

        // 靠近碎石/走廊深处，计算该点的真实辐射水平
        this.calculateRadiation();

        // 到达保险箱
        if (tx === this.safePos.x && ty === this.safePos.y) {
            this.triggerSafeInterface();
        }
    }

    calculateRadiation() {
        // 根据到废墟残骸和核心(5,5)的距离计算辐射
        // 核心(5,5)是爆心，辐射源最强
        let minDistToRubble = 999;
        this.rubbleList.forEach(r => {
            const d = Math.sqrt((r.x - this.playerPos.x)**2 + (r.y - this.playerPos.y)**2);
            if (d < minDistToRubble) minDistToRubble = d;
        });

        const distToCore = Math.sqrt((this.safePos.x - this.playerPos.x)**2 + (this.safePos.y - this.playerPos.y)**2);
        
        // 物理估算：靠近核心呈指数级增加
        let rad = 3.6; // 基础限制
        let soundIntensity = 0.2; // 0 到 1

        if (distToCore === 0) {
            rad = 15000.0;
            soundIntensity = 0.99;
        } else {
            // 距离核心越近，真实辐射越高
            const realRad = Math.exp(10 - distToCore * 1.5) + 5;
            soundIntensity = Math.min(1.0, 0.2 + (8 - distToCore) * 0.1);
            
            // 如果没有高量程测量仪，日常量程上限卡在 3.6 伦琴
            rad = this.hasHighRangeMeter ? realRad : Math.min(3.6, realRad);
        }

        this.currentDose = rad;
        this.updateMeter(rad);

        // 调节盖革爆音频率
        if (window.audio) {
            window.audio.startGeigerStatic(soundIntensity);
        }
    }

    updateMeter(rad) {
        const needle = document.getElementById('geiger-needle');
        if (!needle) return;

        // 将辐射量映射到表盘指针角度 (-60度 到 +60度)
        // 表盘最高刻度 200 R/h
        let deg = -60;
        if (rad <= 0.1) {
            deg = -60 + (rad / 0.1) * 20;
        } else if (rad <= 1.0) {
            deg = -40 + ((rad - 0.1) / 0.9) * 30;
        } else if (rad <= 10.0) {
            deg = -10 + ((rad - 1) / 9) * 30;
        } else if (rad <= 200.0) {
            deg = 20 + ((rad - 10) / 190) * 40;
        } else {
            deg = 60 + Math.random() * 5; // 爆表，抖动
        }

        needle.style.transform = `rotate(${deg}deg)`;
    }

    triggerSafeInterface() {
        const container = document.getElementById('safe-puzzle-container');
        container.style.display = 'block';

        // 键盘按键绑定
        const keys = container.querySelectorAll('.keypad-keys button');
        const input = document.getElementById('safe-input');
        input.value = '';

        keys.forEach(k => {
            // 避免重复绑定
            k.replaceWith(k.cloneNode(true));
        });

        // 重新获取按键绑定
        const newKeys = container.querySelectorAll('.keypad-keys button');
        newKeys.forEach(k => {
            k.addEventListener('click', () => {
                const txt = k.textContent;
                if (window.audio) window.audio.playBeep(800, 0.05, 0.05);

                if (txt === 'C') {
                    input.value = '';
                } else if (txt === 'E') {
                    this.verifySafeCode(input.value);
                } else {
                    if (input.value.length < 4) {
                        input.value += txt;
                    }
                }
            });
        });
    }

    verifySafeCode(code) {
        // 校验密码。历史上 ORM 查询指令为 00000302，最后四位 0302
        if (code === "0302") {
            this.hasHighRangeMeter = true;
            document.getElementById('safe-puzzle-container').style.display = 'none';
            if (window.audio) window.audio.playBeep(2000, 0.3, 0.1); // 解锁音
            
            // 重新计算并爆表！
            this.calculateRadiation();
            
            if (window.scenario) {
                window.scenario.onSafeUnlocked(this.currentDose);
            }
        } else {
            // 报错闪烁
            const input = document.getElementById('safe-input');
            input.value = '';
            input.classList.add('critical-alert');
            if (window.audio) window.audio.playBeep(150, 0.3, 0.1); // 报错音
            
            setTimeout(() => {
                input.classList.remove('critical-alert');
            }, 500);
        }
    }
}

// 挂载到全局
window.GeigerExplorer = GeigerExplorer;
