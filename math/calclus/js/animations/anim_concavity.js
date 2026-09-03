export function initConcavityAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let currentFunc = 'bowl';
    
    const btnWidth = 150;
    const btnHeight = 40;
    const btn1X = 20, btn1Y = 20;
    const btn2X = 190, btn2Y = 20;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = currentFunc === 'bowl' ? '#38bdf8' : '#1e293b';
        ctx.fillRect(btn1X, btn1Y, btnWidth, btnHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('切换为 y=x²', btn1X + 25, btn1Y + 25);
        
        ctx.fillStyle = currentFunc === 'arch' ? '#38bdf8' : '#1e293b';
        ctx.fillRect(btn2X, btn2Y, btnWidth, btnHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText('切换为 y=-x²', btn2X + 20, btn2Y + 25);
        
        const originX = canvas.width / 2;
        const originY = canvas.height / 2 + 50;
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, originY); ctx.lineTo(canvas.width, originY);
        ctx.moveTo(originX, 0); ctx.lineTo(originX, canvas.height);
        ctx.stroke();
        
        ctx.strokeStyle = currentFunc === 'bowl' ? '#38bdf8' : '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for(let px = 0; px < canvas.width; px++) {
            let x = (px - originX) / 100;
            let y = currentFunc === 'bowl' ? x*x : -x*x;
            let py = originY - y * 100;
            if(px === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        for(let x = -3; x <= 3; x += 0.5) {
            let y = currentFunc === 'bowl' ? x*x : -x*x;
            let slope = currentFunc === 'bowl' ? 2*x : -2*x;
            let px = originX + x * 100;
            let py = originY - y * 100;
            
            ctx.beginPath();
            ctx.moveTo(px - 30, py - slope * -30);
            ctx.lineTo(px + 30, py - slope * 30);
            ctx.stroke();
        }
        
        ctx.font = '50px Arial';
        ctx.fillText(currentFunc === 'bowl' ? '😊' : '😢', canvas.width - 80, 80);
    }
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if(x >= btn1X && x <= btn1X + btnWidth && y >= btn1Y && y <= btn1Y + btnHeight) {
            currentFunc = 'bowl';
            draw();
        } else if(x >= btn2X && x <= btn2X + btnWidth && y >= btn2Y && y <= btn2Y + btnHeight) {
            currentFunc = 'arch';
            draw();
        }
    });
    
    draw();
}
