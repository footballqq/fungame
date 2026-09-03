export function initIntegralRectsAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let gridCount = 4;
    let isDragging = false;
    let flashTimer = 0;
    
    const margin = 40;
    const graphWidth = canvas.width - margin * 2 - 150;
    const graphHeight = canvas.height - margin * 2;
    const originX = margin;
    const originY = canvas.height - margin;
    
    const sliderX = canvas.width - 80;
    const sliderYTop = margin + 20;
    const sliderYBottom = canvas.height - margin - 20;
    const sliderHeight = sliderYBottom - sliderYTop;
    
    const f = (x) => Math.sin(x * Math.PI) * 0.8 + 0.2;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        flashTimer++;
        const flashAlpha = (Math.sin(flashTimer * 0.1) + 1) / 2 * 0.5 + 0.2;
        
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sliderX - 5, sliderYTop, 10, sliderHeight);
        
        const sliderRatio = (gridCount - 4) / (64 - 4);
        const handleY = sliderYBottom - sliderRatio * sliderHeight;
        
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(sliderX, handleY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px Arial';
        ctx.fillText('N=' + gridCount, sliderX, handleY - 25);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originX, margin);
        ctx.lineTo(originX, originY);
        ctx.lineTo(originX + graphWidth, originY);
        ctx.stroke();
        
        const dx = graphWidth / gridCount;
        for (let i = 0; i < gridCount; i++) {
            const xLeft = i / gridCount;
            const xRight = (i + 1) / gridCount;
            const yLeft = f(xLeft);
            const yRight = f(xRight);
            
            const yMin = Math.min(yLeft, yRight);
            const yMax = Math.max(yLeft, yRight);
            
            const rectHeightUnder = yMin * graphHeight;
            const rectHeightOver = yMax * graphHeight;
            
            ctx.fillStyle = `rgba(16, 185, 129, 0.6)`;
            ctx.fillRect(originX + i * dx, originY - rectHeightUnder, dx, rectHeightUnder);
            
            ctx.fillStyle = `rgba(239, 68, 68, ${flashAlpha})`;
            ctx.fillRect(originX + i * dx, originY - rectHeightOver, dx, rectHeightOver - rectHeightUnder);
            ctx.strokeStyle = '#ef4444';
            ctx.strokeRect(originX + i * dx, originY - rectHeightOver, dx, rectHeightOver - rectHeightUnder);
        }
        
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const x = i / 100;
            const y = f(x);
            const px = originX + x * graphWidth;
            const py = originY - y * graphHeight;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        requestAnimationFrame(draw);
    }
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (Math.abs(x - sliderX) < 40) isDragging = true;
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        let clampedY = Math.max(sliderYTop, Math.min(y, sliderYBottom));
        const ratio = (sliderYBottom - clampedY) / sliderHeight;
        gridCount = Math.round(4 + ratio * 60);
    });
    canvas.addEventListener('mouseup', () => { isDragging = false; });
    
    requestAnimationFrame(draw);
}
