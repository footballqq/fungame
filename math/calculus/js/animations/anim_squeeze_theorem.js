export function initSqueezeTheoremAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let isPlaying = true;
    let maxN = 50;
    
    const margin = 40;
    const graphWidth = canvas.width - margin * 2;
    const originY = canvas.height / 2;
    const originX = margin;
    
    const upperFunc = (n) => 1 / n;
    const lowerFunc = (n) => -1 / n;
    const midFunc = (n) => Math.sin(n * 2) / n;
    
    const scaleY = 150;
    
    let animId;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Button
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(canvas.width - 120, 20, 100, 30);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px Arial';
        ctx.fillText('重新演示', canvas.width - 70, 35);
        
        // Draw Axis
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + graphWidth, originY);
        ctx.stroke();
        
        let currentN = Math.min(maxN, Math.floor(frame / 5) + 1);
        
        // Draw sequences
        const dx = graphWidth / maxN;
        
        // Upper bound (blue dashed)
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for(let i = 1; i <= currentN; i++) {
            let x = originX + i * dx;
            let y = originY - upperFunc(i) * scaleY;
            if (i === 1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Lower bound (red dashed)
        ctx.strokeStyle = '#f87171';
        ctx.beginPath();
        for(let i = 1; i <= currentN; i++) {
            let x = originX + i * dx;
            let y = originY - lowerFunc(i) * scaleY;
            if (i === 1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Mid sequence (orange points)
        ctx.fillStyle = '#f97316';
        for(let i = 1; i <= currentN; i++) {
            let x = originX + i * dx;
            let y = originY - midFunc(i) * scaleY;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw connecting line for mid sequence
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
        ctx.beginPath();
        for(let i = 1; i <= currentN; i++) {
            let x = originX + i * dx;
            let y = originY - midFunc(i) * scaleY;
            if (i === 1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Info text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '16px "Noto Sans SC"';
        ctx.fillText('被上下两条线死死夹住，中间的数列只好乖乖走向同一个极限。', margin, 20);
        
        if (isPlaying && currentN < maxN) {
            frame++;
            animId = requestAnimationFrame(draw);
        }
    }
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x >= canvas.width - 120 && x <= canvas.width - 20 && y >= 20 && y <= 50) {
            frame = 0;
            if (animId) cancelAnimationFrame(animId);
            isPlaying = true;
            draw();
        }
    });
    
    draw();
    
    // Return cleanup function to stop animation when component unmounts
    return () => {
        if (animId) cancelAnimationFrame(animId);
    };
}
