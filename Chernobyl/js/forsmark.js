/* js/forsmark.js - 瑞典能谱分析与气流溯源 */
/* codex: 2026-06-06 伽马能谱双峰拟合与量角器地图气流轨迹计算 */

class ForsmarkManager {
    constructor(gameState) {
        this.state = gameState;
        this.currentIsotope = "xe133";
        this.verifiedIsotopes = { xe133: false, i131: false, cs137: false };
        
        // 能谱平移偏差值
        this.specShift = 40; // 初始偏移
        
        // 气流地图状态
        this.windAngle = 180; // 风向角度 (0-360)
        
        // 画布与环境
        this.specCanvas = null;
        this.specCtx = null;
        this.plumeCanvas = null;
        this.plumeCtx = null;
    }

    initSpectrometer() {
        this.specCanvas = document.getElementById('spec-canvas');
        this.specCtx = this.specCanvas.getContext('2d');
        this.specCanvas.width = 400;
        this.specCanvas.height = 200;

        this.verifiedIsotopes = { xe133: false, i131: false, cs137: false };
        this.specShift = 50;

        // 按钮绑定
        const buttons = document.querySelectorAll('.btn-isotope');
        buttons.forEach(b => {
            b.addEventListener('click', (e) => {
                buttons.forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                this.currentIsotope = b.getAttribute('data-isotope');
                this.drawSpectrum();
            });
        });

        const slider = document.getElementById('spec-shift-slider');
        slider.value = this.specShift;
        slider.addEventListener('input', (e) => {
            this.specShift = parseInt(e.target.value);
            this.drawSpectrum();
        });

        const verifyBtn = document.getElementById('btn-verify-spectrum');
        verifyBtn.replaceWith(verifyBtn.cloneNode(true));
        document.getElementById('btn-verify-spectrum').addEventListener('click', () => this.verifyIsotope());

        this.drawSpectrum();
    }

    drawSpectrum() {
        const ctx = this.specCtx;
        const w = this.specCanvas.width;
        const h = this.specCanvas.height;
        ctx.fillStyle = '#050a05';
        ctx.fillRect(0, 0, w, h);

        // 绘制背景能谱网格
        ctx.strokeStyle = '#113311';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        }
        for (let j = 0; j < h; j += 40) {
            ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke();
        }

        // 1. 绘制测量能谱 (蓝色，代表混合样，包含三个峰)
        // 峰值位置：100 (Xe-133), 200 (I-131), 300 (Cs-137)
        ctx.strokeStyle = '#3399ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h - 20);
        for (let x = 0; x < w; x++) {
            // 三个高斯核叠加代表三个特征峰
            const p1 = 120 * Math.exp(-Math.pow((x - 100) / 15, 2));
            const p2 = 150 * Math.exp(-Math.pow((x - 200) / 20, 2));
            const p3 = 100 * Math.exp(-Math.pow((x - 300) / 15, 2));
            const noise = Math.sin(x * 0.5) * 3 + Math.random() * 2; // 随机噪音底
            const y = h - 20 - (p1 + p2 + p3) - noise;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = '#3399ff';
        ctx.font = '10px monospace';
        ctx.fillText("实测空气滤网粒子能谱", 10, 20);

        // 2. 绘制参考同位素特征谱 (红色)
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, h - 20);

        // 确定该同位素真实的物理峰位置
        let targetPeak = 100;
        if (this.currentIsotope === 'i131') targetPeak = 200;
        if (this.currentIsotope === 'cs137') targetPeak = 300;

        for (let x = 0; x < w; x++) {
            // 加上玩家滑动条的偏移动作
            const shiftX = x - this.specShift;
            const refPeak = 110 * Math.exp(-Math.pow((shiftX - targetPeak) / 18, 2));
            const y = h - 20 - refPeak;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff3333';
        ctx.fillText(`参考标准: ${this.currentIsotope.toUpperCase()}`, 10, 35);
    }

    verifyIsotope() {
        // 玩家把参考谱线移动到和实测重合 (即 specShift 接近 0 时，峰值完全对齐)
        const error = Math.abs(this.specShift);
        if (error <= 3) {
            this.verifiedIsotopes[this.currentIsotope] = true;
            if (window.audio) window.audio.playBeep(1800, 0.2, 0.05); // 对齐音
            this.printIsotopeStatus();

            // 检查是否全认出
            if (this.verifiedIsotopes.xe133 && this.verifiedIsotopes.i131 && this.verifiedIsotopes.cs137) {
                setTimeout(() => {
                    this.initPlumeMap();
                }, 1000);
            }
        } else {
            // 校验失败
            if (window.audio) window.audio.playBeep(200, 0.3, 0.1);
        }
    }

    printIsotopeStatus() {
        const names = { xe133: "氙-133 (气体)", i131: "碘-131 (同位素)", cs137: "铯-137 (重裂变产物)" };
        let msg = "已验证成分: ";
        for (let k in this.verifiedIsotopes) {
            if (this.verifiedIsotopes[k]) {
                msg += `[${names[k]}] `;
            }
        }
        if (window.scenario) {
            window.scenario.onIsotopeAnalyzed(msg);
        }
    }

    // 初始化风向轨迹大图
    initPlumeMap() {
        document.querySelector('.spectrometer-box').style.display = 'none';
        document.getElementById('plume-map-box').style.display = 'block';

        this.plumeCanvas = document.getElementById('plume-canvas');
        this.plumeCtx = this.plumeCanvas.getContext('2d');
        this.plumeCanvas.width = 400;
        this.plumeCanvas.height = 300;

        this.windAngle = 90;

        const slider = document.getElementById('wind-angle-slider');
        slider.value = this.windAngle;
        slider.addEventListener('input', (e) => {
            this.windAngle = parseInt(e.target.value);
            this.drawPlumeMap();
        });

        const lockBtn = document.getElementById('btn-lock-source');
        lockBtn.replaceWith(lockBtn.cloneNode(true));
        document.getElementById('btn-lock-source').addEventListener('click', () => this.lockSource());

        this.drawPlumeMap();
    }

    drawPlumeMap() {
        const ctx = this.plumeCtx;
        const w = this.plumeCanvas.width;
        const h = this.plumeCanvas.height;
        ctx.fillStyle = '#0a100a';
        ctx.fillRect(0, 0, w, h);

        // 绘制瑞典与苏联的示意版图
        ctx.strokeStyle = '#1e381e';
        ctx.lineWidth = 2;
        
        // 绘制瑞典海岸线 (左上)
        ctx.beginPath();
        ctx.moveTo(30, 20); ctx.lineTo(120, 30); ctx.lineTo(80, 150); ctx.lineTo(10, 220);
        ctx.stroke();

        // 绘制东欧海岸线与国界 (右下)
        ctx.beginPath();
        ctx.moveTo(180, 300); ctx.lineTo(260, 210); ctx.lineTo(380, 180);
        ctx.stroke();

        // 地标点：瑞典福斯马克核电站 (100, 100)
        ctx.fillStyle = 'var(--terminal-green)';
        ctx.beginPath(); ctx.arc(100, 100, 5, 0, Math.PI*2); ctx.fill();
        ctx.font = '10px monospace';
        ctx.fillText("福斯马克 (检测站)", 110, 105);

        // 地标点：切尔诺贝利 (280, 240)
        ctx.fillStyle = 'var(--alert-red)';
        ctx.beginPath(); ctx.arc(280, 240, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillText("切尔诺贝利 (?)", 290, 245);

        // 气流从放射源吹出。我们需要找到逆向风向角度，连接切尔诺贝利和福斯马克
        // 从 (280, 240) 到 (100, 100) 的夹角
        // dy = -140, dx = -180。夹角约为 218度
        ctx.strokeStyle = 'rgba(255, 50, 0, 0.4)';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(280, 240);

        // 玩家调整的风向线条
        const angleRad = (this.windAngle * Math.PI) / 180;
        const length = 230;
        const endX = 280 + length * Math.cos(angleRad + Math.PI); // 逆风吹向
        const endY = 240 + length * Math.sin(angleRad + Math.PI);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制气流扩散羽流
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(280, 240);
        ctx.arc(280, 240, length, angleRad + Math.PI - 0.15, angleRad + Math.PI + 0.15);
        ctx.closePath();
        ctx.fill();
    }

    lockSource() {
        // 目标夹角约 218度 (风从切尔诺贝利向西北吹到福斯马克)
        // 容差 5 度
        const targetAngle = 218;
        const error = Math.abs(this.windAngle - targetAngle);

        if (error <= 6) {
            if (window.audio) window.audio.playBeep(2200, 0.4, 0.1);
            if (window.scenario) {
                window.scenario.onSourceLocked();
            }
        } else {
            // 锁定失败
            if (window.audio) window.audio.playBeep(150, 0.2, 0.1);
        }
    }
}

// 挂载至全局
window.ForsmarkManager = ForsmarkManager;
