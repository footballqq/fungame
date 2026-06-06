// codex: 2026-06-07 增加大结局解锁的独立盖革计数器沙盒模拟器
/* js/geiger_sandbox.js - 盖革计数器沙盒模拟器模块 */

class GeigerSandboxManager {
    constructor(gameState) {
        this.state = gameState;
        this.canvas = document.getElementById('sandbox-geiger-dial');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.slider = document.getElementById('sandbox-rad-slider');
        this.unitSpan = document.getElementById('sandbox-geiger-unit');
        this.valueSpan = document.getElementById('sandbox-geiger-val');
        this.hintSpan = document.getElementById('sandbox-slider-hint');
        this.descBox = document.getElementById('sandbox-event-desc');
        
        this.currentValue = 0.12;
        this.targetValue = 0.12;
        this.animationFrameId = null;

        if (this.slider) {
            this.slider.min = "-2.0";
            this.slider.max = "8.0";
            this.slider.step = "0.1";
        }

        this.sources = {
            background: {
                name: "天然本底辐射",
                value: 0.12,
                desc: "当前测试源：【天然本底辐射】。属于大自然正常存在的宇宙射线与地表微量衰变。盖革计数器发出零星的喀哒声，完全安全。"
            },
            banana: {
                name: "一根熟香蕉",
                value: 0.25,
                desc: "当前测试源：【香蕉等效剂量】。香蕉富含钾元素，天然含有微量的放射性同位素 钾-40 (K-40)。这只是吃一根香蕉的剂量，极其微弱，完全无害。"
            },
            watch: {
                name: "二十世纪初的镭表表盘",
                value: 12.5,
                desc: "当前测试源：【镭夜光表盘】。早期手表表盘使用 镭-226 制造自发光荧光漆。读数已明显高于本底。虽然隔着玻璃较安全，但若表盘破损吸入镭粉尘将导致严重内照射危害。"
            },
            filter: {
                name: "核电厂通风系统滤网",
                value: 450.0,
                desc: "当前测试源：【放射性排风滤网】。用于捕获放射性尘埃和气溶胶的特种活性炭滤网。辐射剂量达到数百微西弗，已是普通本底的数千倍。工作人员必须身穿防护服短时间处理。"
            },
            graphite: {
                name: "炸飞的核反应堆堆芯石墨",
                value: 35000.0,
                desc: "当前测试源：【反应堆石墨慢化剂残骸】。1986年4月26日被大爆炸从核心炸飞到屋顶的石墨块。具有极强的高能伽马和贝塔辐射。仅停留几分钟即可积蓄致命剂量！"
            },
            elephant: {
                name: "反应堆下方熔融象脚",
                value: 4.5e7,
                desc: "当前测试源：【切尔诺贝利象脚】。反应堆熔融堆芯与混凝土、沙子混合后流下的熔融物，是世界上最致命的放射性人造物体之一。短时间暴露即可造成急性放射病 (ARS) 并致死。"
            }
        };

        this.randomEvents = [
            {
                title: "⚡ 中子通量突增脉冲",
                value: 8500.0,
                desc: "【突发事件】反应堆辅助厂房的监测管线因中子流泄漏引发瞬时警报。读数猛增至 8,500 μSv/h！空气中弥漫着臭氧的气味，必须立刻撤离！"
            },
            {
                title: "🌧️ 沾染放射性尘埃的骤雨",
                value: 75.0,
                desc: "【突发事件】下风向地区突然降雨，空气中的放射性碘-131和铯-137随雨水降落。地表积水辐射读数攀升至 75 μSv/h。严禁饮用雨水，立即寻找水泥建筑物避雨。"
            },
            {
                title: "📦 遗弃的军用卡车驾驶室",
                value: 1200.0,
                desc: "【突发事件】清理人发现了一辆参与了核心救援的废弃卡车。用盖革计数器探测驾驶室方向，指针暴跳，读数升至 1,200 μSv/h。重金属车体表面已深度沾染了微细放射性颗粒。"
            },
            {
                title: "⛏️ 废墟管道中流出的发光冷却水",
                value: 6.5e8,
                desc: "【突发事件】破裂管道正在汩汩排出淡蓝色的高温积水，这其实是高浓度裂变产物水溶液。读数直接狂飙至 650,000 mSv/h (650 Sv/h)！任何靠近的电子设备都在几分钟内因强辐射干扰而失效。"
            },
            {
                title: "💨 阵风吹过废弃的红森林",
                value: 8.5,
                desc: "【突发事件】一阵强风掠过严重风化的“红森林”区域。干燥泥土中被吸收的放射性尘埃重新悬浮到空气中。盖革计数器爆鸣声突然变得紧凑，读数升至 8.5 μSv/h。请注意防护，严防吸入。"
            }
        ];

        this.bindEvents();
    }

    bindEvents() {
        if (this.slider) {
            this.slider.addEventListener('input', () => {
                const logVal = parseFloat(this.slider.value);
                const val = Math.pow(10, logVal);
                this.targetValue = val;
                this.updateStatusText(val, "手动调节模式：通过滑块改变辐射场强。");
                if (window.audio) {
                    const soundLevel = Math.max(0, Math.min(1, (logVal + 2) / 10));
                    window.audio.startGeigerStatic(soundLevel);
                }
            });
        }

        const btnRandom = document.getElementById('btn-sandbox-random');
        if (btnRandom) {
            btnRandom.addEventListener('click', () => {
                if (window.audio) window.audio.playBeep(900, 0.05, 0.06);
                this.triggerRandomEvent();
            });
        }

        const sourceBtns = document.querySelectorAll('.btn-source');
        sourceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.getAttribute('data-level');
                if (window.audio) window.audio.playBeep(900, 0.05, 0.06);
                this.selectSource(level);
            });
        });

        const btnExit = document.getElementById('btn-sandbox-exit');
        if (btnExit) {
            btnExit.addEventListener('click', () => {
                if (window.audio) {
                    window.audio.playBeep(600, 0.1, 0.08);
                    window.audio.stopGeigerStatic();
                }
                this.exitSandbox();
            });
        }
    }

    init() {
        this.targetValue = 0.12;
        this.currentValue = 0.12;
        if (this.slider) {
            this.slider.value = Math.log10(0.12).toFixed(1);
        }
        if (this.descBox) {
            this.descBox.innerHTML = "当前测试源：【天然本底辐射】。属于大自然正常存在的宇宙射线与地表微量衰变。盖革计数器发出零星的喀哒声，完全安全。";
        }
        this.updateStatusText(0.12);
        
        if (window.audio) {
            window.audio.init();
            const logVal = Math.log10(0.12);
            const soundLevel = Math.max(0, Math.min(1, (logVal + 2) / 10));
            window.audio.startGeigerStatic(soundLevel);
        }
        this.startLoop();
    }

    enterSandbox() {
        this.state.switchView('view-geiger-sandbox');
        this.init();
    }

    exitSandbox() {
        this.stopLoop();
        this.state.switchView('view-intro');
    }

    formatValueAndUnit(val) {
        if (val < 1000) {
            return { value: val.toFixed(2), unit: "μSv/h" };
        } else if (val < 1e6) {
            return { value: (val / 1000).toFixed(2), unit: "mSv/h" };
        } else {
            return { value: (val / 1e6).toFixed(2), unit: "Sv/h" };
        }
    }

    updateStatusText(val, prefix = "") {
        let statusText = "正常背景";
        let color = "#00ff00";
        if (val < 0.3) {
            statusText = "正常本底辐射";
            color = "#00ff00";
        } else if (val < 10.0) {
            statusText = "低危险性微量辐射";
            color = "#aaff00";
        } else if (val < 100.0) {
            statusText = "中度辐射 (需要警惕)";
            color = "#ffff00";
        } else if (val < 1000.0) {
            statusText = "强辐射 (存在健康危害)";
            color = "#ffaa00";
        } else if (val < 1e6) {
            statusText = "极高剂量 (重度放射危险)";
            color = "#ff3333";
        } else {
            statusText = "超高剂量 (瞬间致死辐射域)";
            color = "#ff0033";
        }
        
        if (this.hintSpan) {
            this.hintSpan.textContent = statusText;
            this.hintSpan.style.color = color;
        }
        
        if (prefix) {
            const formatted = this.formatValueAndUnit(val);
            this.descBox.innerHTML = `<strong>${prefix}</strong><br>实时换算值：${formatted.value} ${formatted.unit}。该辐射场下属于：<span style="color: ${color}; font-weight: bold;">${statusText}</span>。`;
        }
    }

    selectSource(level) {
        const src = this.sources[level];
        if (!src) return;
        
        this.targetValue = src.value;
        const logVal = Math.log10(src.value);
        if (this.slider) {
            this.slider.value = logVal.toFixed(1);
        }
        
        if (this.descBox) {
            this.descBox.innerHTML = src.desc;
        }
        
        this.updateStatusText(src.value);
        
        if (window.audio) {
            const soundLevel = Math.max(0, Math.min(1, (logVal + 2) / 10));
            window.audio.startGeigerStatic(soundLevel);
        }
    }

    triggerRandomEvent() {
        const idx = Math.floor(Math.random() * this.randomEvents.length);
        const evt = this.randomEvents[idx];
        
        this.targetValue = evt.value;
        const logVal = Math.log10(evt.value);
        if (this.slider) {
            this.slider.value = logVal.toFixed(1);
        }
        
        if (this.descBox) {
            this.descBox.innerHTML = `<strong>${evt.title}</strong><br>${evt.desc}`;
        }
        
        this.updateStatusText(evt.value);
        
        if (window.audio) {
            const soundLevel = Math.max(0, Math.min(1, (logVal + 2) / 10));
            window.audio.startGeigerStatic(soundLevel);
        }
    }

    startLoop() {
        this.stopLoop();
        const tick = () => {
            this.drawDial();
            this.animationFrameId = requestAnimationFrame(tick);
        };
        tick();
    }

    stopLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    drawDial() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        const centerX = w / 2;
        const centerY = h - 10;
        const radius = 95;
        
        ctx.strokeStyle = '#005500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI * 5/6, -Math.PI * 1/6);
        ctx.stroke();
        
        const startAngle = -Math.PI * 5/6;
        const endAngle = -Math.PI * 1/6;
        const totalSteps = 10;
        
        ctx.font = '8px monospace';
        ctx.fillStyle = '#00aa00';
        ctx.textAlign = 'center';
        
        for (let i = 0; i <= totalSteps; i++) {
            const pct = i / totalSteps;
            const angle = startAngle + pct * (endAngle - startAngle);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            const isMajor = i % 2 === 0;
            const tickLen = isMajor ? 8 : 4;
            
            ctx.strokeStyle = isMajor ? '#00cc00' : '#007700';
            ctx.lineWidth = isMajor ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(centerX + radius * cos, centerY + radius * sin);
            ctx.lineTo(centerX + (radius - tickLen) * cos, centerY + (radius - tickLen) * sin);
            ctx.stroke();
            
            if (isMajor) {
                const labelRadius = radius - 18;
                let label = "";
                const logVal = -2 + i;
                if (logVal === -2) label = "0.01";
                else if (logVal === 0) label = "1";
                else if (logVal === 2) label = "100";
                else if (logVal === 4) label = "10k";
                else if (logVal === 6) label = "1M";
                else if (logVal === 8) label = "100M";
                
                if (label) {
                    ctx.fillText(label, centerX + labelRadius * cos, centerY + labelRadius * sin + 3);
                }
            }
        }
        
        ctx.fillStyle = '#004400';
        ctx.font = '9px monospace';
        ctx.fillText("LOG SCALE (μSv/h)", centerX, centerY - 45);
        
        this.currentValue = this.currentValue * 0.9 + this.targetValue * 0.1;
        if (Math.abs(this.currentValue - this.targetValue) < 0.001) {
            this.currentValue = this.targetValue;
        }
        
        let displayVal = this.currentValue;
        if (displayVal > 0.001) {
            const logVal = Math.log10(displayVal);
            const maxJitterPct = 0.02 + Math.min(0.08, Math.max(0, (logVal + 2) / 10) * 0.08);
            const jitter = (Math.random() - 0.5) * maxJitterPct;
            displayVal = displayVal * (1 + jitter);
            if (displayVal < 0.01) displayVal = 0.01;
        }
        
        const formatted = this.formatValueAndUnit(displayVal);
        if (this.valueSpan) this.valueSpan.textContent = formatted.value;
        if (this.unitSpan) this.unitSpan.textContent = formatted.unit;
        
        const logDisplayVal = Math.log10(displayVal);
        const pct = Math.max(0, Math.min(1, (logDisplayVal - (-2)) / 10));
        const needleAngle = startAngle + pct * (endAngle - startAngle);
        
        const needleCos = Math.cos(needleAngle);
        const needleSin = Math.sin(needleAngle);
        const needleLen = radius - 6;
        
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#ff3333';
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + needleLen * needleCos, centerY + needleLen * needleSin);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

window.GeigerSandboxManager = GeigerSandboxManager;
