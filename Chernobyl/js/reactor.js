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
        this.manualStuck = false; // 手动控制棒卡死状态
        
        // 反应堆功率物理公式常数
        this.lambdaI = 0.05 / 3600; // 碘-135衰变常数 (按每秒计)
        this.lambdaX = 0.02 / 3600; // 氙-135自身衰变常数
        this.sigmaX = 0.08;         // 中子烧入截面因子
    }

    start() {
        this.stop();
        this.az5Pressed = false;
        this.manualStuck = false;
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

        const rodSlider = document.getElementById('rod-slider');

        // 检测手动控制棒操作
        if (!this.az5Pressed && this.state.currentPhase === 3) {
            if (rodSlider && !this.manualStuck) {
                const currentVal = parseFloat(rodSlider.value);
                if (currentVal < 90) {
                    // 玩家试图手动插入控制棒，结果立即卡死在 65%！
                    this.manualStuck = true;
                    this.rodPosition = 65;
                    rodSlider.value = 65;
                    rodSlider.disabled = true;
                    
                    // 提示玩家卡死，需要按下 AZ-5
                    this.state.showDialogue(
                        "列昂尼德·托普图诺夫",
                        "阿基莫夫同志！控制棒卡住了！控制通道由于局部高温发生热变形弯曲，手动控制棒组卡在 65% 动弹不得！反应堆正处于蒸汽正空泡反馈中，热功率正在不受控制地攀升！快按下 AZ-5 紧急停堆！",
                        []
                    );
                    
                    // 启动报警和盖革计数器
                    if (window.audio) {
                        window.audio.startAlarm();
                        window.audio.startGeigerStatic(0.15);
                    }
                }
            }
        }

        // 1. 获取控制棒输入并计算其自动下滑动画 (AZ-5)
        if (this.az5Pressed) {
            // AZ-5 紧急停堆动作下，控制棒开始下落
            if (this.state.orm < 15.0) {
                // 如果 ORM 偏低，下落至 65% (约 1/3) 时，堆芯局部过热膨胀卡死
                if (this.rodPosition > 65) {
                    this.rodPosition = Math.max(65, this.rodPosition - 8.0 * dt);
                }
            } else {
                // 安全状态，控制棒顺利落入堆芯底部 (0%)
                this.rodPosition = Math.max(0, this.rodPosition - 15.0 * dt);
            }
            if (rodSlider) rodSlider.value = this.rodPosition;
        } else if (this.manualStuck) {
            this.rodPosition = 65;
            if (rodSlider) rodSlider.value = 65;
        } else {
            if (rodSlider) {
                this.rodPosition = parseFloat(rodSlider.value);
            }
        }

        // 2. 根据控制棒拔出程度计算 ORM
        this.state.orm = Math.max(2.0, 32.0 - (this.rodPosition / 100) * 28.0);

        // 3. 模拟碘-135与氙-135的演化
        const P_norm = this.state.power / 3200;
        const dI = (P_norm * 0.06 - this.lambdaI * this.iodine) * dt;
        this.iodine += dI;
        const dX = (P_norm * 0.01 + this.lambdaI * this.iodine - (this.lambdaX + this.sigmaX * P_norm) * this.xenon) * dt;
        this.xenon = Math.max(0.01, this.xenon + dX);
        this.state.xenon = this.xenon;

        // 4. 计算空泡系数 (蒸汽气泡占比)
        const flowRatio = this.coolantFlow / 48000;
        const tempEffect = Math.max(0, (this.state.reactorTemp - 280) / 100);
        this.state.voidCoeff = Math.min(1.0, Math.max(0.01, (P_norm * 0.15 + tempEffect * 0.1) / flowRatio));

        // 5. 计算反应性 (Reactivity)
        const rho_control = (this.rodPosition - 50) * 0.0003;
        const rho_xenon = -0.012 * (this.xenon - 1.0);
        const rho_void = 0.015 * (this.state.voidCoeff - 0.02);
        let total_rho = rho_control + rho_xenon + rho_void;

        // 6. AZ-5 紧急停堆特殊效应 (RBMK 控制棒石墨端头正停堆效应)
        if (this.az5Pressed) {
            if (this.state.orm < 15.0) {
                // 不足 15 根安全余度，石墨置换端头下落时把水挤出，堆芯底部注入正反应性
                if (this.rodPosition > 65) {
                    const positiveScram = 0.05 * (93 - this.rodPosition);
                    total_rho += positiveScram;
                } else {
                    // 控制棒在 1/3 处卡死，注入极大反应性负荷，加上基于功率的指数级正反馈
                    total_rho += 1.5 + 0.5 * (this.state.power / 200.0);
                    this.state.reactorTemp += 150 * dt;
                }
            } else {
                // 安全停堆，控制棒成功滑落，提供大量负反应性
                total_rho -= 0.06 * (100 - this.rodPosition) / 100;
            }
        } else if (this.manualStuck) {
            // 手动卡死但未按 AZ-5 时，正反应性相对温和地上升
            total_rho += 0.2 + 0.1 * (this.state.power / 200.0);
            this.state.reactorTemp += 40 * dt;
        }

        // 7. 更新功率 (离散增长模型)
        const powerGrowth = total_rho * this.state.power * dt;
        this.state.power = Math.max(1.0, this.state.power + powerGrowth);

        // 8. 辅助参数计算 (温度、中子通量)
        this.state.reactorTemp = 280 + (this.state.power / 3200) * 40;
        this.state.neutronFlux = 1.2e14 * (this.state.power / 3200);

        // 更新盖革计数器爆音频率
        if ((this.az5Pressed || this.manualStuck) && window.audio) {
            const geigerLevel = Math.min(1.0, 0.15 + (this.state.power / 30000.0) * 0.85);
            window.audio.startGeigerStatic(geigerLevel);
        }

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
        if (pFill) {
            pFill.style.width = Math.min(100, (this.state.power / 3200) * 100) + '%';
            if (this.state.power > 3200) {
                pFill.className = 'gauge-fill danger blink-text';
            } else if (this.state.power > 1000) {
                pFill.className = 'gauge-fill warning';
            } else {
                pFill.className = 'gauge-fill';
            }
        }
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

        // 绘制物理堆芯切面控制棒动画
        this.drawCore();
    }

    // 绘制堆芯动画
    drawCore() {
        const canvas = document.getElementById('core-anim-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // 动态适配容器大小
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        ctx.fillStyle = '#020702';
        ctx.fillRect(0, 0, w, h);

        // 绘制活性区边框 (RBMK-1000 堆芯边界)
        ctx.strokeStyle = 'rgba(51, 255, 51, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 5, w - 20, h - 10);

        // 绘制5个控制棒通道
        const count = 5;
        const spacing = (w - 20) / (count + 1);

        // 计算控制棒下落高度。全拔出时 rodPosition=100 (高位)，全插入为 0 (低位)
        const totalActiveHeight = h - 10;
        const boronHeight = totalActiveHeight * 0.4;
        const graphiteHeight = totalActiveHeight * 0.25;
        const travel = totalActiveHeight - boronHeight - graphiteHeight;
        const yStart = 5 + travel - (this.rodPosition / 100) * travel;

        // 如果触发了石墨端头正停堆效应，在底部绘制闪烁警示微光
        let showPositiveScramGlow = false;
        if (this.az5Pressed && this.state.orm < 15.0 && this.rodPosition > 64) {
            showPositiveScramGlow = true;
        }

        for (let i = 0; i < count; i++) {
            const cx = 10 + spacing * (i + 1);

            // 1. 通道内水流 (轻水，浅蓝色)
            ctx.fillStyle = 'rgba(0, 120, 255, 0.12)';
            ctx.fillRect(cx - 3, 5, 6, h - 10);

            // 2. 绘制控制棒各段 (Boron 段与石墨端头段)
            // 碳化硼吸收体 (Boron) - 银灰色
            ctx.fillStyle = '#7a7a7a';
            ctx.fillRect(cx - 2, yStart, 4, boronHeight);
            
            // 石墨置换体 (Graphite tip) - 橙黄色慢化剂
            ctx.fillStyle = '#ff5500';
            ctx.fillRect(cx - 2, yStart + boronHeight, 4, graphiteHeight);

            // 3. 正停堆效应底部突发功率发热光晕 (橙红发光)
            if (showPositiveScramGlow) {
                const grad = ctx.createRadialGradient(cx, h - 10, 1, cx, h - 10, 10);
                grad.addColorStop(0, 'rgba(255, 0, 0, 0.85)');
                grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, h - 10, 10, 0, Math.PI*2);
                ctx.fill();
            }
            
            // 4. 卡死指示：当控制棒卡在 65% 时，绘制红色叉号表示通道变形卡死
            if (this.rodPosition === 65 && (this.az5Pressed || this.manualStuck)) {
                ctx.strokeStyle = 'var(--alert-red)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const centerY = yStart + boronHeight / 2;
                ctx.moveTo(cx - 6, centerY - 6);
                ctx.lineTo(cx + 6, centerY + 6);
                ctx.moveTo(cx + 6, centerY - 6);
                ctx.lineTo(cx - 6, centerY + 6);
                ctx.stroke();
            }
        }

        // 绘制堆芯整体受热微红亮区 (中子反应剧烈时)
        if (this.state.power > 5000) {
            const intensity = Math.min(0.4, (this.state.power - 5000) / 25000);
            ctx.fillStyle = `rgba(255, 0, 0, ${intensity})`;
            ctx.fillRect(10, 5, w - 20, h - 10);
        }
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
