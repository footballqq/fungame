export function initLimitSequenceAnim(canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  
  let currentN = 1;
  const maxN = 100;
  let isPlaying = false;
  let animationId = null;
  let lastTime = 0;
  
  // Sequence definition: a_n = 1 + (-1)^n / n, Limit L = 1
  const L = 1;
  const a = (n) => 1 + Math.pow(-1, n) / n;
  
  // UI container
  const container = canvas.parentElement;
  let uiContainer = container.querySelector('.anim-ui-seq');
  if (!uiContainer) {
      uiContainer = document.createElement('div');
      uiContainer.className = 'anim-ui-seq';
      uiContainer.style.position = 'absolute';
      uiContainer.style.top = '10px';
      uiContainer.style.left = '10px';
      uiContainer.style.background = 'rgba(15, 23, 42, 0.8)';
      uiContainer.style.padding = '10px';
      uiContainer.style.borderRadius = '8px';
      uiContainer.style.display = 'flex';
      uiContainer.style.gap = '10px';
      
      uiContainer.innerHTML = `
          <button id="btn-play" class="btn">▶ 播放</button>
          <button id="btn-pause" class="btn" style="display:none;">⏸ 暂停</button>
          <button id="btn-reset" class="btn">↺ 重置</button>
      `;
      container.appendChild(uiContainer);
  }

  const btnPlay = uiContainer.querySelector('#btn-play');
  const btnPause = uiContainer.querySelector('#btn-pause');
  const btnReset = uiContainer.querySelector('#btn-reset');
  
  btnPlay.onclick = () => {
      isPlaying = true;
      btnPlay.style.display = 'none';
      btnPause.style.display = 'block';
      if (currentN >= maxN) currentN = 1;
      lastTime = performance.now();
      renderLoop(lastTime);
  };
  
  btnPause.onclick = () => {
      isPlaying = false;
      btnPlay.style.display = 'block';
      btnPause.style.display = 'none';
      if (animationId) cancelAnimationFrame(animationId);
  };
  
  btnReset.onclick = () => {
      isPlaying = false;
      btnPlay.style.display = 'block';
      btnPause.style.display = 'none';
      if (animationId) cancelAnimationFrame(animationId);
      currentN = 1;
      draw();
  };

  // Coordinate mapping
  // Map x (n) in [0, 100] to [50, width-20]
  // Map y (a_n) in [0, 2] to [height-50, 50]
  const mapX = (n) => 50 + (n / maxN) * (width - 70);
  const mapY = (val) => height - 50 - (val / 2) * (height - 100);

  function draw() {
      // Clear
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Axes
      ctx.strokeStyle = '#64748b'; // slate-500
      ctx.lineWidth = 1;
      ctx.beginPath();
      // x-axis
      ctx.moveTo(mapX(0), mapY(0));
      ctx.lineTo(mapX(maxN), mapY(0));
      // y-axis
      ctx.moveTo(mapX(0), mapY(0));
      ctx.lineTo(mapX(0), mapY(2));
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px Arial';
      ctx.fillText('n', mapX(maxN), mapY(0) + 15);
      ctx.fillText('a_n', mapX(0) - 25, mapY(2) - 10);
      
      // Limit Line (L=1)
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(mapX(0), mapY(L));
      ctx.lineTo(mapX(maxN), mapY(L));
      ctx.stroke();
      ctx.setLineDash([]); // reset
      
      // Limit Label
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('L = 1', mapX(maxN) - 30, mapY(L) - 10);

      // Draw sequence points
      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mapX(1), mapY(a(1)));
      
      for (let i = 1; i <= currentN; i++) {
          let x = mapX(i);
          let y = mapY(a(i));
          
          ctx.lineTo(x, y);
          ctx.stroke();
          
          // Draw dot
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI*2);
          ctx.fillStyle = '#fcd34d'; // amber-300
          ctx.fill();
          
          ctx.beginPath(); // reset path for next line
          ctx.moveTo(x, y);
      }
  }

  function renderLoop(time) {
      if (!isPlaying) return;
      
      // Update every 50ms
      if (time - lastTime > 50) {
          if (currentN < maxN) {
              currentN++;
              draw();
          } else {
              isPlaying = false;
              btnPlay.style.display = 'block';
              btnPause.style.display = 'none';
          }
          lastTime = time;
      }
      
      if (isPlaying) {
          animationId = requestAnimationFrame(renderLoop);
      }
  }

  draw();
}
