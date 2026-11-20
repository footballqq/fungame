export function initMvtTangentAnim(canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  
  let cx = 0.5;
  let isDragging = false;
  
  const f = (x) => Math.sin(x * Math.PI) + 0.5 * x; // curve in [0, 1]
  const df = (x) => Math.PI * Math.cos(x * Math.PI) + 0.5;
  
  const mapX = (x) => 100 + x * (width - 200);
  const mapY = (y) => height - 100 - y * (height - 200) / 2;

  canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateCx(e);
  });
  canvas.addEventListener('mousemove', (e) => {
      if (isDragging) updateCx(e);
  });
  window.addEventListener('mouseup', () => {
      isDragging = false;
  });

  function updateCx(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let val = (x - 100) / (width - 200);
      cx = Math.max(0, Math.min(1, val));
      draw();
  }

  function draw() {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('在曲线上左右拖动 C 点', width/2, 30);

      const secantSlope = (f(1) - f(0)) / (1 - 0);

      // Curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for(let x = 0; x <= 1; x += 0.01) {
          if (x === 0) ctx.moveTo(mapX(x), mapY(f(x)));
          else ctx.lineTo(mapX(x), mapY(f(x)));
      }
      ctx.stroke();

      // Secant AB
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(mapX(0), mapY(f(0)));
      ctx.lineTo(mapX(1), mapY(f(1)));
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Points A and B
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(mapX(0), mapY(f(0)), 5, 0, Math.PI*2);
      ctx.arc(mapX(1), mapY(f(1)), 5, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillText('A', mapX(0)-15, mapY(f(0)));
      ctx.fillText('B', mapX(1)+15, mapY(f(1)));

      // Tangent at C
      const currentSlope = df(cx);
      const isParallel = Math.abs(currentSlope - secantSlope) < 0.1;

      ctx.strokeStyle = isParallel ? '#10b981' : '#ef4444'; // green or red
      ctx.lineWidth = isParallel ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(mapX(cx - 0.2), mapY(f(cx) - currentSlope * 0.2));
      ctx.lineTo(mapX(cx + 0.2), mapY(f(cx) + currentSlope * 0.2));
      ctx.stroke();

      // Point C
      ctx.fillStyle = isParallel ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(mapX(cx), mapY(f(cx)), 6, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.fillText('C', mapX(cx), mapY(f(cx))-15);
      
      if (isParallel) {
          ctx.fillStyle = '#10b981';
          ctx.font = '24px Arial';
          ctx.fillText('✅ 切线与割线平行！', width/2, height - 30);
      }
  }

  draw();
}
