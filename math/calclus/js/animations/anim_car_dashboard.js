export function initCarDashboardAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let points = [
        {x: 50, y: 300},
        {x: 150, y: 150},
        {x: 300, y: 200},
        {x: 450, y: 100}
    ];
    let dragIdx = -1;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(50, 50); ctx.lineTo(50, 350); ctx.lineTo(500, 350);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.moveTo(points[0].x, 350);
        ctx.lineTo(points[0].x, points[0].y);
        for(let i=0; i<points.length-1; i++) {
            let p0 = points[i];
            let p1 = points[i+1];
            let mx = (p0.x + p1.x) / 2;
            ctx.bezierCurveTo(mx, p0.y, mx, p1.y, p1.x, p1.y);
        }
        ctx.lineTo(points[points.length-1].x, 350);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for(let i=0; i<points.length-1; i++) {
            let p0 = points[i];
            let p1 = points[i+1];
            let mx = (p0.x + p1.x) / 2;
            ctx.bezierCurveTo(mx, p0.y, mx, p1.y, p1.x, p1.y);
        }
        ctx.stroke();
        
        ctx.fillStyle = '#fde047';
        let area = 0;
        for(let i=0; i<points.length; i++) {
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, 8, 0, Math.PI*2);
            ctx.fill();
            if(i < points.length-1) {
                area += (350 - (points[i].y + points[i+1].y)/2) * (points[i+1].x - points[i].x);
            }
        }
        
        const dashCenter = {x: 650, y: 250};
        const dashRadius = 100;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dashCenter.x, dashCenter.y, dashRadius, Math.PI, 0);
        ctx.stroke();
        
        let maxArea = 400 * 300; 
        let angle = Math.PI + (area / maxArea) * Math.PI;
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(dashCenter.x, dashCenter.y);
        ctx.lineTo(dashCenter.x + Math.cos(angle)*80, dashCenter.y + Math.sin(angle)*80);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`里程: ${Math.round(area/100)}`, dashCenter.x - 40, dashCenter.y + 40);
    }
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        dragIdx = points.findIndex(p => Math.hypot(p.x - x, p.y - y) < 15);
    });
    canvas.addEventListener('mousemove', (e) => {
        if(dragIdx === -1) return;
        const rect = canvas.getBoundingClientRect();
        points[dragIdx].y = Math.min(350, Math.max(50, e.clientY - rect.top));
        draw();
    });
    canvas.addEventListener('mouseup', () => dragIdx = -1);
    canvas.addEventListener('mouseleave', () => dragIdx = -1);
    
    draw();
}
