export function initClusterPointAnim(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  let detectorX = width / 2; // pixel coordinate
  let detectorRadius = 30; // pixel radius
  let isDragging = false;
  
  // Math mapping: x from -0.2 to 1.2
  const xMin = -0.2;
  const xMax = 1.2;
  
  function mapX(mathX) {
    return (mathX - xMin) / (xMax - xMin) * width;
  }
  
  function unmapX(pxX) {
    return (pxX / width) * (xMax - xMin) + xMin;
  }
  
  // Generate points a_n = 1/n for n=1 to 200
  const points = [];
  for (let n = 1; n <= 200; n++) {
    points.push({ n, x: 1 / n });
  }
  
  function draw() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw number line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = '#64748b'; // slate-500
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw ticks
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 1; i++) {
        const px = mapX(i);
        ctx.beginPath();
        ctx.moveTo(px, height / 2 - 5);
        ctx.lineTo(px, height / 2 + 5);
        ctx.stroke();
        ctx.fillText(i.toString(), px, height / 2 + 25);
    }
    
    // Draw points
    ctx.fillStyle = '#38bdf8'; // sky-400
    for (let p of points) {
        const px = mapX(p.x);
        ctx.beginPath();
        ctx.arc(px, height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw detector
    ctx.beginPath();
    ctx.arc(detectorX, height / 2, detectorRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.2)'; // yellow-400 with opacity
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw detector handle
    ctx.beginPath();
    ctx.moveTo(detectorX, height / 2 + detectorRadius);
    ctx.lineTo(detectorX, height / 2 + detectorRadius + 30);
    ctx.stroke();
    
    // Calculate how many points inside
    const mathDetectorX = unmapX(detectorX);
    const mathRadius = (detectorRadius / width) * (xMax - xMin);
    
    let count = 0;
    let hasInfinite = false;
    for (let p of points) {
        if (Math.abs(p.x - mathDetectorX) <= mathRadius) {
            count++;
        }
    }
    
    // If the detector covers 0 and its radius > 0, it essentially covers infinitely many points
    if (mathDetectorX - mathRadius <= 0 && mathDetectorX + mathRadius >= 0) {
        hasInfinite = true;
    }
    
    // Draw HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('数列：a_n = 1/n', 20, 30);
    ctx.fillText('拖动黄色探测圈寻找“聚点”', 20, 55);
    
    ctx.fillStyle = hasInfinite ? '#4ade80' : '#facc15';
    const countText = hasInfinite ? '无穷多！' : count.toString();
    ctx.fillText(`圈内点数：${countText}`, 20, 80);
    
    if (hasInfinite) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('🎉 找到了！0 就是聚点！', 20, 110);
        
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px sans-serif';
        ctx.fillText('注意：1/n 永远不会等于 0，', 20, 135);
        ctx.fillText('所以 0 本身并不在点集里，', 20, 155);
        ctx.fillText('但它却把无穷多个点“聚”在了周围！', 20, 175);
    } else if (count > 0) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px sans-serif';
        ctx.fillText(`这里只有 ${count} 个孤立的点，不是聚点。`, 20, 110);
    }
  }
  
  draw();
  
  // Interaction
  canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = x - detectorX;
      const dy = y - (height / 2);
      if (Math.sqrt(dx*dx + dy*dy) <= detectorRadius * 1.5) {
          isDragging = true;
      }
  });
  
  canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
          const rect = canvas.getBoundingClientRect();
          detectorX = e.clientX - rect.left;
          draw();
      }
  });
  
  canvas.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('mouseleave', () => { isDragging = false; });
  
  // Touch support
  canvas.addEventListener('touchstart', (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const dx = x - detectorX;
      const dy = y - (height / 2);
      if (Math.sqrt(dx*dx + dy*dy) <= detectorRadius * 2) {
          isDragging = true;
          e.preventDefault();
      }
  }, {passive: false});
  
  canvas.addEventListener('touchmove', (e) => {
      if (isDragging) {
          const rect = canvas.getBoundingClientRect();
          detectorX = e.touches[0].clientX - rect.left;
          draw();
          e.preventDefault();
      }
  }, {passive: false});
  
  canvas.addEventListener('touchend', () => { isDragging = false; });
}
