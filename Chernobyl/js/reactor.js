/* js/reactor.js - RBMK-1000 反应堆物理模型引擎 */
/* codex: 2026-06-06 反应堆动力学方程计算，包含氙中毒与空泡效应正反馈 */

class ReactorSimulator {
    constructor(gameState) {
        this.state = gameState;
        this.intervalId = null;
        this.rodPosition = 80; // 控制棒插入百分比 (0-100, 0为全插入, 100为全拔出)
        
        // 物理常数与中间变量
        this.iodine = 1.0;     // 碘-135相对量
        this.xenon = 1.0;      // 氙-135相对量
        this.coolantFlow = 48000; // 冷却水流量 (m3/h)
        this.autoControl = false; // 是否开启自动调节
        this.az5Pressed = false;
        
        // 反应堆功率物理公式常数
        this.lambdaI = 0.05 / 3600; // 碘-135衰变常数 (按每秒计)
        this.lambdaX = 0.02 / 3600; // 氙-135自身衰变常数
        this.sigmaX = 0.08;         // 中子烧入截面因子
    }

    start() {
        this.stop();
        this.intervalId = setInterval(() => {
            this.tick(0.5); // 每秒模拟2步 (每步0.5秒)
        }, 500);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // 核心物理模拟演化 (Euler 积分)
    tick(dt) {
        if (this.state.gameOver) {
            this.stop();
            return;
        }

        // 1. 获取控制棒输入
        const rodSlider = document.getElementById('rod-slider');
        if (rodSlider) {
            this.rodPosition = parseFloat(rodSlider.value);
        }

        // 2. 根据控制棒拔出程度计算 ORM
        // 拔出得越多(this.rodPosition 变大)，留在堆芯里的控制棒当量就越少 (ORM变小)
        // ORM 最大 32，最小可接近 0
        this.state.orm = Math.max(2.0, 32.0 - (this.rodPosition / 100) * 28.0);

        // 3. 模拟碘-135与氙-135的演化
        // 归一化功率值 (额定 3200 为 1.0)
        const P_norm = this.state.power / 3200;
        
        // 碘-135 随裂变产生，自身衰变
        const dI = (P_norm * 0.06 - this.lambdaI * this.iodine) * dt;
        this.iodine += dI;
        
        // 氙-135 随碘-135衰变产生，自身衰变，以及受中子照射烧入转变成氙-136
        // 注意：功率越高，中子通量越大，氙被中子烧入的速度就越快
        const dX = (P_norm * 0.01 + this.lambdaI * this.iodine - (this.lambdaX + this.sigmaX * P_norm) * this.xenon) * dt;
        this.xenon = Math.max(0.01, this.xenon + dX);
        this.state.xenon = this.xenon;

        // 4. 计算空泡系数 (蒸汽气泡占比)
        // 冷却水流量减少，或者温度升高，都会导致水沸腾产生气泡，使空泡份额增加
        const flowRatio = this.coolantFlow / 48000;
        const tempEffect = Math.max(0, (this.state.reactorTemp - 280) / 100);
        this.state.voidCoeff = Math.min(1.0, Math.max(0.01, (P_norm * 0.15 + tempEffect * 0.1) / flowRatio));

        // 5. 计算总反应性 (Reactivity)
        // 反应性决定功率变化率。
        // (a) 控制棒提供的反应性：控制棒拔出越多，反应性越高
        const rho_control = (this.rodPosition - 50) * 0.0003;
        
        // (b) 氙-135提供的负反应性：浓度越高，反应性越低
        const rho_xenon = -0.012 * (this.xenon - 1.0);
        
        // (c) 正空泡反馈：RBMK特色，蒸汽增加导致反应性增加
        const rho_void = 0.015 * (this.state.voidCoeff - 0.02);

        let total_rho = rho_control + rho_xenon + rho_void;

        // 6. AZ-5 紧急停堆特殊效应 (正停堆效应)
        if (this.az5Pressed) {
            // 如果控制棒拔出过多 (ORM很低 < 15)，按下AZ-5时，石墨置换端头首先进入堆芯底部，排开水，导致反应性瞬间爆表！
            if (this.state.orm < 15.0) {
                // 瞬间注入巨大正反应性 (持续数秒)
                total_rho += 0.05; 
                this.state.reactorTemp += 40; // 温度急剧拉升
            } else {
                // ORM安全，控制棒正常吸收中子，快速注入负反应性
                total_rho -= 0.08;
            }
        }

        // 7. 更新功率 (离散增长模型)
        // dP/dt = rho * P
        const powerGrowth = total_rho * this.state.power * dt;
        this.state.power = Math.max(1.0, this.state.power + powerGrowth);

        // 8. 辅助参数计算 (温度、中子通量)
        this.state.reactorTemp = 280 + (this.state.power / 3200) * 40;
        this.state.neutronFlux = 1.2e14 * (this.state.power / 3200);

        // 9. 更新 UI 显示
        this.updateDashboard();

        // 10. 判断过热爆炸条件
        if (this.state.power > 30000) {
            this.stop();
            this.triggerExplosion();
        }
    }

    updateDashboard() {
        const pEl = document.getElementById('val-power');
        const oEl = document.getElementById('val-orm');
        const xEl = document.getElementById('val-xenon');
        const vEl = document.getElementById('val-void');

        const pFill = document.getElementById('fill-power');
        const oFill = document.getElementById('fill-orm');
        const xFill = document.getElementById('fill-xenon');
        const vFill = document.getElementById('fill-void');

        if (pEl) pEl.textContent = Math.round(this.state.power);
        if (oEl) oEl.textContent = this.state.orm.toFixed(1);
        if (xEl) xEl.textContent = this.state.xenon.toFixed(2);
        if (vEl) vEl.textContent = this.state.voidCoeff.toFixed(2);

        // 进度条渲染
        if (pFill) pFill.style.width = Math.min(100, (this.state.power / 3200) * 100) + '%';
        if (oFill) {
            oFill.style.width = Math.min(100, (this.state.orm / 32) * 100) + '%';
            if (this.state.orm < 15.0) {
                oFill.className = 'gauge-fill danger';
            } else if (this.state.orm < 20.0) {
                oFill.className = 'gauge-fill warning';
            } else {
                oFill.className = 'gauge-fill';
            }
        }
        if (xFill) xFill.style.width = Math.min(100, (this.state.xenon / 4) * 100) + '%';
        if (vFill) vFill.style.width = Math.min(100, this.state.voidCoeff * 100) + '%';
    }

    // 按下 AZ-5 按钮
    pressAZ5() {
        this.az5Pressed = true;
        
        // 报警声大作！
        if (window.audio) {
            window.audio.startAlarm();
        }

        // 禁用滑块
        const rodSlider = document.getElementById('rod-slider');
        if (rodSlider) rodSlider.disabled = true;

        const btnAz5 = document.getElementById('btn-az5');
        if (btnAz5) btnAz5.disabled = true;
    }

    triggerExplosion() {
        // 全屏震弱与黑暗警报
        document.body.classList.add('screen-shake');
        
        // 触发全局事件，过3秒后切入剧情结局或下一阶段
        if (window.scenario) {
            window.scenario.onReactorExplode();
        }
    }
}

// 挂载至全局
window.ReactorSimulator = ReactorSimulator;
