export function initNumberLineZoomAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let zoomCenter = 0.5;
    let isHovering = false;
    let mouseX = 0;
    
    // UI Layout parameters
    const margin = 40;
    const topAxisY = 100;
    const bottomAxisY = 300;
    const axisWidth = canvas.width - margin * 2;
    const delta = 0.05; // zoomed range is center ± delta
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Draw top number line [0, 1]
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, topAxisY);
        ctx.lineTo(canvas.width - margin, topAxisY);
        ctx.stroke();
        
        // Top ticks
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        for(let i = 0; i <= 10; i++) {
            let xPos = margin + (i / 10) * axisWidth;
            ctx.beginPath();
            ctx.moveTo(xPos, topAxisY - 5);
            ctx.lineTo(xPos, topAxisY + 5);
            ctx.stroke();
            ctx.fillText((i/10).toFixed(1), xPos, topAxisY + 10);
        }
        
        // 2. Draw magnifying glass on top axis
        if (isHovering) {
            let glassX = margin + zoomCenter * axisWidth;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(glassX, topAxisY, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.fill();
            
            // Draw connection lines to bottom axis
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(glassX - 20, topAxisY + 20);
            ctx.lineTo(margin, bottomAxisY - 20);
            ctx.moveTo(glassX + 20, topAxisY + 20);
            ctx.lineTo(canvas.width - margin, bottomAxisY - 20);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 3. Draw bottom number line [zoomCenter - delta, zoomCenter + delta]
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, bottomAxisY);
        ctx.lineTo(canvas.width - margin, bottomAxisY);
        ctx.stroke();
        
        // Bottom ticks
        ctx.fillStyle = '#fff';
        let minVal = zoomCenter - delta;
        for(let i = 0; i <= 10; i++) {
            let xPos = margin + (i / 10) * axisWidth;
            let val = minVal + (i / 10) * (2 * delta);
            ctx.beginPath();
            ctx.moveTo(xPos, bottomAxisY - 5);
            ctx.lineTo(xPos, bottomAxisY + 5);
            ctx.stroke();
            ctx.fillText(val.toFixed(3), xPos, bottomAxisY + 10);
        }
        
        // 4. Draw Info text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = '16px "Noto Sans SC"';
        ctx.fillText('拖动放大镜看看，任何两个刻度之间是不是都能无限再分？', margin, 30);
    }
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        isHovering = true;
        
        // Only update if near the top axis
        if (Math.abs(y - topAxisY) < 50 || Math.abs(y - bottomAxisY) < 150) {
            zoomCenter = (mouseX - margin) / axisWidth;
            zoomCenter = Math.max(0, Math.min(1, zoomCenter));
        }
        draw();
    });
    
    canvas.addEventListener('mouseleave', () => {
        isHovering = false;
        draw();
    });
    
    // touch support
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        zoomCenter = (mouseX - margin) / axisWidth;
        zoomCenter = Math.max(0, Math.min(1, zoomCenter));
        isHovering = true;
        draw();
    }, {passive: false});
    
    canvas.addEventListener('touchend', () => {
        isHovering = false;
        draw();
    });
    
    draw();
}
