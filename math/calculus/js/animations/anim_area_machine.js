export function initAreaMachineAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let a = 0.55;
    let h = 0.10; // Make h slightly wider so it's very clear for children
    let isDragging = false;
    
    // Auto-handle device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr || 600;
        canvas.height = Math.max(rect.height * dpr, 460 * dpr);
    }
    
    const cw = canvas.width;
    const ch = canvas.height;
    
    const marginX = 50 * dpr;
    const marginTop = 45 * dpr;
    const width = cw - marginX * 2;
    
    // Give upper chart 36% height, lower chart 36% height, middle gap 28%
    const chartHeight = ch * 0.35;
    const topOriginY = marginTop + chartHeight;
    const bottomOriginY = ch - 40 * dpr;
    const graph2TitleY = topOriginY + 75 * dpr; // 75px vertical gap between charts!
    
    const f = (x) => x; // f(x) = x
    const A = (x) => 0.5 * x * x; // A(x) = 1/2 x^2
    
    function draw() {
        ctx.clearRect(0, 0, cw, ch);
        
        // -----------------------------------------------------------
        // 1. 上半部分：原曲线 f(x) 与 面积 A(a) 包含新增橙色细条
        // -----------------------------------------------------------
        
        // 标题与图例
        ctx.font = `bold ${15 * dpr}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.fillText('图 1：原曲线 f(a) 的下方地块', marginX, marginTop - 15 * dpr);
        
        // 坐标轴
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(marginX, marginTop);
        ctx.lineTo(marginX, topOriginY);
        ctx.lineTo(marginX + width, topOriginY);
        ctx.stroke();
        
        // 蓝色已积攒地块 0 -> a
        const pxA = marginX + a * width;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.moveTo(marginX, topOriginY);
        ctx.lineTo(pxA, topOriginY);
        ctx.lineTo(pxA, topOriginY - f(a) * chartHeight);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        
        // 橙色新增小地块 a -> a+h (细长长方形具象化)
        const hVal = Math.min(h, 1.0 - a);
        const pxAh = marginX + (a + hVal) * width;
        const pyA = topOriginY - f(a) * chartHeight;
        const pyAh = topOriginY - f(a + hVal) * chartHeight;
        
        if (hVal > 0.005) {
            // 填充橙色梯形/细长条
            ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
            ctx.beginPath();
            ctx.moveTo(pxA, topOriginY);
            ctx.lineTo(pxAh, topOriginY);
            ctx.lineTo(pxAh, pyAh);
            ctx.lineTo(pxA, pyA);
            ctx.closePath();
            ctx.fill();
            
            // 橙色加粗轮廓
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2.5 * dpr;
            ctx.stroke();
            
            // 绘制矩形近似顶线 (虚线表示矩形顶边 f(a))
            ctx.setLineDash([4 * dpr, 4 * dpr]);
            ctx.strokeStyle = '#fed7aa';
            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();
            ctx.moveTo(pxA, pyA);
            ctx.lineTo(pxAh, pyA);
            ctx.stroke();
            ctx.setLineDash([]); // 重置虚线
            
            // 标注：宽度 h 箭头线与独立黑底胶囊文字（位于 topOriginY 下方 12px~35px）
            const arrowY = topOriginY + 12 * dpr;
            ctx.strokeStyle = '#fb923c';
            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();
            ctx.moveTo(pxA, arrowY);
            ctx.lineTo(pxAh, arrowY);
            ctx.stroke();
            
            // 宽 h 胶囊背景
            const textCenterX = (pxA + pxAh) / 2;
            const textY = arrowY + 18 * dpr;
            ctx.font = `bold ${13 * dpr}px "Noto Sans SC", sans-serif`;
            const textWidth = ctx.measureText('宽 h').width + 12 * dpr;
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.roundRect(textCenterX - textWidth / 2, textY - 12 * dpr, textWidth, 18 * dpr, 4 * dpr);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffedd5';
            ctx.textAlign = 'center';
            ctx.fillText('宽 h', textCenterX, textY + 2 * dpr);
            
            // 标注：新增面积公式文本（右侧悬浮胶囊）
            ctx.font = `bold ${13 * dpr}px "Noto Sans SC", sans-serif`;
            const formulaText = `橙色地块面积 ≈ 高 f(a) × 宽 h`;
            const formWidth = ctx.measureText(formulaText).width + 16 * dpr;
            const labelX = Math.min(pxAh + 10 * dpr, cw - formWidth - 10 * dpr);
            const labelY = pyA - 12 * dpr;
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.roundRect(labelX, labelY - 14 * dpr, formWidth, 22 * dpr, 6 * dpr);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffedd5';
            ctx.textAlign = 'left';
            ctx.fillText(formulaText, labelX + 8 * dpr, labelY + 2 * dpr);
        }
        
        // 原函数曲线 f(x) = x (亮蓝线)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(marginX, topOriginY);
        ctx.lineTo(marginX + width, topOriginY - f(1) * chartHeight);
        ctx.stroke();
        
        // 当前边界 a 的黄垂直分割线
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3 * dpr;
        ctx.beginPath();
        ctx.moveTo(pxA, marginTop);
        ctx.lineTo(pxA, topOriginY);
        ctx.stroke();
        
        // 标注：高度 f(a) 胶囊
        ctx.font = `bold ${13 * dpr}px "Noto Sans SC", sans-serif`;
        const hLabelText = `高 f(a)`;
        const hTextW = ctx.measureText(hLabelText).width + 12 * dpr;
        const hLabelX = pxA - hTextW - 6 * dpr;
        const hLabelY = pyA + (topOriginY - pyA) / 2;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.roundRect(hLabelX, hLabelY - 12 * dpr, hTextW, 20 * dpr, 4 * dpr);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'left';
        ctx.fillText(hLabelText, hLabelX + 6 * dpr, hLabelY + 2 * dpr);
        
        // 拖拽手柄圆点
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(pxA, marginTop, 8 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
        
        // -----------------------------------------------------------
        // 2. 下半部分：面积函数 A(a) 的增长曲线与导数切线 A'(a)
        // -----------------------------------------------------------
        
        ctx.font = `bold ${15 * dpr}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'left';
        ctx.fillText('图 2：面积机器 A(a) 的数值曲线 (斜率/导数就是高 f(a))', marginX, graph2TitleY);
        
        const graph2AxisTop = graph2TitleY + 15 * dpr;
        
        // 坐标轴
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(marginX, graph2AxisTop);
        ctx.lineTo(marginX, bottomOriginY);
        ctx.lineTo(marginX + width, bottomOriginY);
        ctx.stroke();
        
        // 面积曲线 A(x) = 1/2 x^2 (绿线)
        const g2Height = bottomOriginY - graph2AxisTop;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3.5 * dpr;
        ctx.beginPath();
        for (let x = 0; x <= 1; x += 0.01) {
            let px = marginX + x * width;
            let py = bottomOriginY - (A(x) / A(1)) * g2Height;
            if (x === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // 曲线上的当前点 (a, A(a))
        let currPx = pxA;
        let currPy = bottomOriginY - (A(a) / A(1)) * g2Height;
        
        // 绘制切线 (红线，斜率为 A'(a) = f(a))
        let scaleY = g2Height / A(1);
        let slopeFactor = f(a) * scaleY / width;
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(currPx - 65 * dpr, currPy + slopeFactor * 65 * dpr);
        ctx.lineTo(currPx + 65 * dpr, currPy - slopeFactor * 65 * dpr);
        ctx.stroke();
        
        // 当前点黄色圆珠
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(currPx, currPy, 6.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
        
        // 切线斜率标注说明
        ctx.font = `bold ${12 * dpr}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'left';
        ctx.fillText(`切线斜率 (增长速度 A') = f(a)`, Math.min(currPx + 15 * dpr, cw - 200 * dpr), currPy - 10 * dpr);
        
        // 底部提示操作说明
        ctx.font = `${11 * dpr}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.fillText('💡 提示：按住顶部黄色小圆点左右拖动右边界 a', marginX + width, bottomOriginY + 20 * dpr);
    }
    
    function getCanvasX(e) {
        const rect = canvas.getBoundingClientRect();
        return (e.clientX - rect.left) * dpr;
    }
    
    canvas.addEventListener('mousedown', (e) => {
        const x = getCanvasX(e);
        const pxA = marginX + a * width;
        if (Math.abs(x - pxA) < 35 * dpr) {
            isDragging = true;
        }
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = getCanvasX(e);
        a = Math.max(0.12, Math.min(0.82, (x - marginX) / width));
        draw();
    });
    
    window.addEventListener('mouseup', () => isDragging = false);
    
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * dpr;
            const pxA = marginX + a * width;
            if (Math.abs(x - pxA) < 45 * dpr) {
                isDragging = true;
            }
        }
    }, { passive: true });
    
    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length === 0) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * dpr;
        a = Math.max(0.12, Math.min(0.82, (x - marginX) / width));
        draw();
    }, { passive: true });
    
    window.addEventListener('touchend', () => isDragging = false);
    
    draw();
}
