export function initNewtonMethodAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let x_points = [2.5];
    
    const margin = 50;
    const width = canvas.width - margin * 2;
    const originX = margin + width / 2;
    const originY = canvas.height - margin - 100;
    
    const f = (x) => x*x - 2;
    const df = (x) => 2*x;
    const scaleX = 100;
    const scaleY = 50;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(20, 20, 150, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('进行一次迭代', 45, 45);
        
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(margin, originY); ctx.lineTo(canvas.width - margin, originY);
        ctx.moveTo(originX, margin); ctx.lineTo(originX, canvas.height - margin);
        ctx.stroke();
        
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let px = margin; px <= canvas.width - margin; px++) {
            let x = (px - originX) / scaleX;
            let y = f(x);
            let py = originY - y * scaleY;
            if(px === margin) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        for(let i=0; i<x_points.length; i++) {
            let x = x_points[i];
            let y = f(x);
            let px = originX + x * scaleX;
            let py = originY - y * scaleY;
            
            ctx.strokeStyle = 'gray';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(px, originY);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI*2);
            ctx.fill();
            
            if (i < x_points.length - 1) {
                let nextX = x_points[i+1];
                let nextPx = originX + nextX * scaleX;
                ctx.strokeStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(nextPx, originY);
                ctx.stroke();
            }
        }
    }
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if(x >= 20 && x <= 170 && y >= 20 && y <= 60) {
            let lastX = x_points[x_points.length - 1];
            let nextX = lastX - f(lastX) / df(lastX);
            x_points.push(nextX);
            draw();
        }
    });
    
    draw();
}
