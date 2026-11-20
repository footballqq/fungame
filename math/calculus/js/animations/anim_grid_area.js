export function initGridAreaAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let gridCount = 4; // Default N=4
    let isDragging = false;
    
    // UI Layout parameters
    const margin = 40;
    const graphWidth = canvas.width - margin * 2 - 150; // leave space for slider
    const graphHeight = canvas.height - margin * 2;
    const originX = margin;
    const originY = canvas.height - margin;
    
    // Slider params
    const sliderX = canvas.width - 80;
    const sliderYTop = margin + 20;
    const sliderYBottom = canvas.height - margin - 20;
    const sliderHeight = sliderYBottom - sliderYTop;
    
    // Function y = x^2 mapping [0,1] to [0,1]
    const f = (x) => x * x;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Draw slider
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sliderX - 5, sliderYTop, 10, sliderHeight);
        
        // Map gridCount (2 to 32) to slider Y
        const sliderRatio = (gridCount - 2) / (32 - 2);
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
        ctx.fillText('滑动改变网格', sliderX, sliderYTop - 15);
        
        // 2. Draw axes
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originX, margin); // Y axis
        ctx.lineTo(originX, originY);
        ctx.lineTo(originX + graphWidth, originY); // X axis
        ctx.stroke();
        
        // 3. Draw grid and rectangles
        const dx = graphWidth / gridCount;
        const dy = graphHeight / gridCount;
        
        let areaUnder = 0;
        let areaOver = 0;
        
        for (let i = 0; i < gridCount; i++) {
            const xLeft = i / gridCount;
            const xRight = (i + 1) / gridCount;
            const yLeft = f(xLeft);
            const yRight = f(xRight);
            
            // "少算法" (lower bound) - green
            const yMin = Math.min(yLeft, yRight);
            const rectHeightUnder = yMin * graphHeight;
            ctx.fillStyle = 'rgba(16, 185, 129, 0.4)'; // emerald
            ctx.fillRect(originX + i * dx, originY - rectHeightUnder, dx, rectHeightUnder);
            ctx.strokeStyle = '#10b981';
            ctx.strokeRect(originX + i * dx, originY - rectHeightUnder, dx, rectHeightUnder);
            areaUnder += yMin * (1 / gridCount);
            
            // "多算法" (upper bound diff) - blue
            const yMax = Math.max(yLeft, yRight);
            const rectHeightOver = yMax * graphHeight;
            ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; // sky blue
            ctx.fillRect(originX + i * dx, originY - rectHeightOver, dx, rectHeightOver - rectHeightUnder);
            ctx.strokeStyle = '#38bdf8';
            ctx.strokeRect(originX + i * dx, originY - rectHeightOver, dx, rectHeightOver - rectHeightUnder);
            areaOver += yMax * (1 / gridCount);
        }
        
        // 4. Draw true curve
        ctx.strokeStyle = '#fde047'; // yellow
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
        
        // 5. Draw Info text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = '16px "Noto Sans SC"';
        ctx.fillText(`真实面积: 0.333...`, originX + 20, margin + 20);
        ctx.fillStyle = '#10b981';
        ctx.fillText(`少算法 (下界): ${areaUnder.toFixed(4)}`, originX + 20, margin + 45);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`多算法 (上界): ${areaOver.toFixed(4)}`, originX + 20, margin + 70);
    }
    
    // Interactions
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (Math.abs(x - sliderX) < 30) {
            isDragging = true;
            updateSlider(y);
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        updateSlider(y);
    });
    
    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; });
    
    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (Math.abs(x - sliderX) < 40) {
            isDragging = true;
            updateSlider(y);
        }
    }, {passive: false});
    
    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        updateSlider(e.touches[0].clientY - rect.top);
    }, {passive: false});
    
    canvas.addEventListener('touchend', () => { isDragging = false; });
    
    function updateSlider(y) {
        let clampedY = Math.max(sliderYTop, Math.min(y, sliderYBottom));
        const ratio = (sliderYBottom - clampedY) / sliderHeight;
        gridCount = Math.round(2 + ratio * 30); // 2 to 32
        draw();
    }
    
    draw();
}
