export function initEightTheoremsAnim(canvas) {
    const ctx = canvas.getContext('2d');
    
    const nodes = [
        { id: 1, label: '确界原理', x: 300, y: 90 },
        { id: 2, label: '单调有界定理', x: 130, y: 180 },
        { id: 3, label: '区间套定理', x: 470, y: 180 },
        { id: 4, label: '聚点定理', x: 130, y: 280 },
        { id: 5, label: '致密性定理', x: 470, y: 280 },
        { id: 6, label: '柯西收敛准则', x: 300, y: 360 },
        { id: 7, label: '有限覆盖定理', x: 300, y: 240 },
        { id: 8, label: '戴德金切割', x: 300, y: 30 } 
    ];
    
    const edges = [
        { from: 8, to: 1 },
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 3, to: 4 },
        { from: 2, to: 5 },
        { from: 4, to: 6 },
        { from: 3, to: 7 },
        { from: 5, to: 6 }
    ];
    
    let activeNode = null;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '16px "Noto Sans SC"';
        ctx.fillText('点击任意定理，看看它是怎么从其他定理推导出来的！', 300, 20);
        
        // Highlight logic
        let highlightEdges = [];
        if (activeNode) {
            edges.forEach(e => {
                if (e.from === activeNode.id || e.to === activeNode.id) {
                    highlightEdges.push(e);
                }
            });
        }
        
        // Draw edges
        edges.forEach(e => {
            const n1 = nodes.find(n => n.id === e.from);
            const n2 = nodes.find(n => n.id === e.to);
            
            const isHighlighted = activeNode ? highlightEdges.includes(e) : true;
            ctx.strokeStyle = isHighlighted ? '#fbbf24' : '#475569';
            ctx.lineWidth = isHighlighted ? 3 : 1;
            
            // Draw arrow
            const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
            const targetX = n2.x - Math.cos(angle) * 60;
            const targetY = n2.y - Math.sin(angle) * 20;
            const startX = n1.x + Math.cos(angle) * 60;
            const startY = n1.y + Math.sin(angle) * 20;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
            
            // Arrowhead
            ctx.fillStyle = isHighlighted ? '#fbbf24' : '#475569';
            ctx.beginPath();
            ctx.moveTo(targetX, targetY);
            ctx.lineTo(targetX - 10 * Math.cos(angle - Math.PI/6), targetY - 10 * Math.sin(angle - Math.PI/6));
            ctx.lineTo(targetX - 10 * Math.cos(angle + Math.PI/6), targetY - 10 * Math.sin(angle + Math.PI/6));
            ctx.fill();
        });
        
        // Draw nodes
        nodes.forEach(n => {
            const isHighlighted = activeNode ? (n.id === activeNode.id || highlightEdges.some(e => e.from === n.id || e.to === n.id)) : true;
            
            ctx.fillStyle = isHighlighted ? '#1e293b' : '#0f172a';
            ctx.strokeStyle = isHighlighted ? '#38bdf8' : '#334155';
            if (activeNode && n.id === activeNode.id) ctx.strokeStyle = '#fbbf24';
            
            ctx.lineWidth = 2;
            
            // Rounded rect
            const w = 120;
            const h = 40;
            const x = n.x - w/2;
            const y = n.y - h/2;
            const r = 8;
            
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y, x + w, y + r, r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isHighlighted ? '#fff' : '#94a3b8';
            ctx.textBaseline = 'middle';
            ctx.font = '14px "Noto Sans SC"';
            ctx.fillText(n.label, n.x, n.y);
        });
    }
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let clicked = false;
        nodes.forEach(n => {
            if (Math.abs(mouseX - n.x) < 60 && Math.abs(mouseY - n.y) < 20) {
                activeNode = (activeNode && activeNode.id === n.id) ? null : n;
                clicked = true;
            }
        });
        
        if (!clicked) activeNode = null;
        draw();
    });
    
    draw();
}
