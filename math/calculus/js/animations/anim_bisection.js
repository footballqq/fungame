export function initBisectionAnim(canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  
  let left = 0;
  let right = 1;
  // Generate 10000 points between 0 and 1, clustering around a target (e.g., 0.6)
  const target = 0.6;
  let points = [];
  for (let i = 0; i < 5000; i++) {
      // Normal distribution around target
      let val = target + (Math.random() - 0.5) * (Math.random() - 0.5) * 2;
      if (val < 0) val = -val;
      if (val > 1) val = 1 - (val - 1);
      points.push(val);
  }
  
  const container = canvas.parentElement;
  let uiContainer = container.querySelector('.anim-ui-bisection');
  if (!uiContainer) {
      uiContainer = document.createElement('div');
      uiContainer.className = 'anim-ui-bisection';
      uiContainer.style.position = 'absolute';
      uiContainer.style.top = '10px';
      uiContainer.style.left = '10px';
      uiContainer.style.background = 'rgba(15, 23, 42, 0.8)';
      uiContainer.style.padding = '10px';
      uiContainer.style.borderRadius = '8px';
      uiContainer.style.display = 'flex';
      uiContainer.style.gap = '10px';
      
      uiContainer.innerHTML = `
          <button id="btn-left" class="btn">👈 保留左半区间</button>
          <button id="btn-right" class="btn">👉 保留右半区间</button>
          <button id="btn-reset" class="btn">↺ 重置</button>
          <div id="interval-info" style="color: #38bdf8; font-weight: bold; line-height: 36px; margin-left: 10px;"></div>
      `;
      container.appendChild(uiContainer);
  }

  const btnLeft = uiContainer.querySelector('#btn-left');
  const btnRight = uiContainer.querySelector('#btn-right');
  const btnReset = uiContainer.querySelector('#btn-reset');
  const intervalInfo = uiContainer.querySelector('#interval-info');
  
  function updateInfo() {
      intervalInfo.innerText = `当前区间: [${left.toFixed(4)}, ${right.toFixed(4)}]`;
  }
  
  btnLeft.onclick = () => {
      right = (left + right) / 2;
      updateInfo();
      draw();
  };
  
  btnRight.onclick = () => {
      left = (left + right) / 2;
      updateInfo();
      draw();
  };
  
  btnReset.onclick = () => {
      left = 0;
      right = 1;
      updateInfo();
      draw();
  };

  const mapX = (val) => 50 + ((val - left) / (right - left)) * (width - 100);
  const mapY = height / 2;

  function draw() {
      // Clear
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Draw Number Line
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(mapX(left), mapY);
      ctx.lineTo(mapX(right), mapY);
      ctx.stroke();
      
      // Draw Midpoint
      const mid = (left + right) / 2;
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(mapX(mid), mapY - 40);
      ctx.lineTo(mapX(mid), mapY + 40);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(left.toFixed(4), mapX(left), mapY + 30);
      ctx.fillText(right.toFixed(4), mapX(right), mapY + 30);
      ctx.fillText(mid.toFixed(4), mapX(mid), mapY - 45);

      // Draw Points
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)'; // yellow with alpha
      let countLeft = 0;
      let countRight = 0;
      
      for (let i = 0; i < points.length; i++) {
          let p = points[i];
          if (p >= left && p <= right) {
              if (p < mid) countLeft++;
              else countRight++;
              
              let x = mapX(p);
              // Scatter Y randomly a bit for visibility
              let y = mapY + (Math.random() - 0.5) * 40;
              ctx.fillRect(x, y, 2, 2);
          }
      }
      
      // Update Button Text with counts
      btnLeft.innerText = `👈 左侧 (${countLeft} 个点)`;
      btnRight.innerText = `👉 右侧 (${countRight} 个点)`;
      
      if (right - left < 0.001) {
          ctx.fillStyle = '#10b981';
          ctx.font = '24px Noto Sans SC';
          ctx.fillText(`找到聚点，大约是 ${left.toFixed(3)}！`, width / 2, height - 20);
      }
  }

  updateInfo();
  draw();
}
