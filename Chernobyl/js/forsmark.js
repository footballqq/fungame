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
                
                // 重置位移与滑动条，防止直接对齐或因滑块残留直接通过
                this.specShift = Math.random() > 0.5 ? 50 : -50;
                const slider = document.getElementById('spec-shift-slider');
                if (slider) slider.value = this.specShift;
                
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

        const shortcutBtn = document.getElementById('btn-spec-shortcut');
        if (shortcutBtn) {
            shortcutBtn.replaceWith(shortcutBtn.cloneNode(true));
        }
        const newShortcutBtn = document.getElementById('btn-spec-shortcut');
        if (newShortcutBtn) {
            newShortcutBtn.addEventListener('click', () => {
                if (window.audio) window.audio.playBeep(1800, 0.1, 0.05);
                this.specShift = 0;
                if (slider) slider.value = 0;
                this.drawSpectrum();
                this.verifyIsotope();
            });
        }

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
        // 容差从 3 像素放宽至 12 像素，解决因屏幕缩放导致难以对齐的问题
        const error = Math.abs(this.specShift);
        if (error <= 12) {
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

        // 加载气流扩散背景地图
        this.plumeMapImg = new Image();
        this.plumeMapImg.src = "map-showing-how-a-cloud-of-radiation-engulfed-europe-during-v0-ypdatrhrgf1a1.webp";
        this.plumeMapImg.onload = () => {
            this.drawPlumeMap();
        };

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

        // 优先绘制新载入的欧洲辐射云实况地图背景
        if (this.plumeMapImg && this.plumeMapImg.complete) {
            ctx.drawImage(this.plumeMapImg, 0, 0, w, h);
            // 盖一层微弱的半透明滤镜以匹配 CRT 绿色荧光风格，增加历史沧桑感
            ctx.fillStyle = 'rgba(51, 255, 51, 0.12)';
            ctx.fillRect(0, 0, w, h);
        } else {
            ctx.fillStyle = '#0a100a';
            ctx.fillRect(0, 0, w, h);

            // 兜底绘制版图线条
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
        }

        // 新背景坐标校正：福斯马克检测站位于 (212, 96)，切尔诺贝利位于 (258, 163)
        const fX = 212, fY = 96;
        const cX = 258, cY = 163;

        // 地标点：瑞典福斯马克核电站 (fX, fY)
        ctx.fillStyle = 'var(--terminal-green)';
        ctx.beginPath(); ctx.arc(fX, fY, 5, 0, Math.PI*2); ctx.fill();
        ctx.font = '10px monospace';
        ctx.fillText("福斯马克 (检测站)", fX + 10, fY + 5);

        // 地标点：切尔诺贝利 (cX, cY)
        ctx.fillStyle = 'var(--alert-red)';
        ctx.beginPath(); ctx.arc(cX, cY, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillText("切尔诺贝利 (?)", cX + 10, cY - 5);

        // 气流从瑞典检测站吹出以追踪源头。连接福斯马克和切尔诺贝利
        ctx.strokeStyle = 'rgba(255, 50, 0, 0.45)';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(fX, fY);

        // 玩家调整的风向线条（从福斯马克向外旋转延伸）
        const angleRad = (this.windAngle * Math.PI) / 180;
        const length = 230;
        const endX = fX + length * Math.cos(angleRad); 
        const endY = fY + length * Math.sin(angleRad);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制以福斯马克为核心的气流追踪羽流区域
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(fX, fY);
        ctx.arc(fX, fY, length, angleRad - 0.15, angleRad + 0.15);
        ctx.closePath();
        ctx.fill();
    }

    lockSource() {
        // 福斯马克 (212, 96) 指向切尔诺贝利 (258, 163) 的夹角约为 55 度
        // 容差放宽至 15 度，避免玩家在手机上难以精确调整
        const targetAngle = 55;
        const error = Math.abs(this.windAngle - targetAngle);

        if (error <= 15) {
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
