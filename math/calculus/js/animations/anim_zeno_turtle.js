export function initZenoTurtleAnim(canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  
  let step = 0;
  let turtlePos = 0; // percentage 0 to 100
  let isPlaying = false;
  let animationId = null;
  let lastTime = 0;
  
  // UI container
  const container = canvas.parentElement;
  let uiContainer = container.querySelector('.anim-ui-zeno');
  if (!uiContainer) {
      uiContainer = document.createElement('div');
      uiContainer.className = 'anim-ui-zeno';
      uiContainer.style.position = 'absolute';
      uiContainer.style.top = '10px';
      uiContainer.style.left = '10px';
      uiContainer.style.background = 'rgba(15, 23, 42, 0.8)';
      uiContainer.style.padding = '10px';
      uiContainer.style.borderRadius = '8px';
      uiContainer.style.display = 'flex';
      uiContainer.style.gap = '10px';
      
      uiContainer.innerHTML = `
          <button id="btn-step" class="btn">👣 下一步</button>
          <button id="btn-play" class="btn">▶ 自动播放</button>
          <button id="btn-pause" class="btn" style="display:none;">⏸ 暂停</button>
          <button id="btn-reset" class="btn">↺ 重置</button>
      `;
      container.appendChild(uiContainer);
  }

  const btnStep = uiContainer.querySelector('#btn-step');
  const btnPlay = uiContainer.querySelector('#btn-play');
  const btnPause = uiContainer.querySelector('#btn-pause');
  const btnReset = uiContainer.querySelector('#btn-reset');
  
  btnStep.onclick = () => {
      isPlaying = false;
      btnPlay.style.display = 'block';
      btnPause.style.display = 'none';
      nextStep();
  };
  
  btnPlay.onclick = () => {
      isPlaying = true;
      btnPlay.style.display = 'none';
      btnPause.style.display = 'block';
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
      step = 0;
      turtlePos = 0;
      draw();
  };

  const mapX = (percent) => 100 + (percent / 100) * (width - 200);
  const trackY = height / 2;

  function nextStep() {
      if (step < 10) {
          step++;
          turtlePos = 100 * (1 - Math.pow(0.5, step));
          draw();
      }
  }

  function draw() {
      // Clear
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Draw Track
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mapX(0), trackY);
      ctx.lineTo(mapX(100), trackY);
      ctx.stroke();
      
      // Draw Start and Finish Lines
      ctx.strokeStyle = '#94a3b8'; // slate-400
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(mapX(0), trackY - 30);
      ctx.lineTo(mapX(0), trackY + 30);
      ctx.moveTo(mapX(100), trackY - 30);
      ctx.lineTo(mapX(100), trackY + 30);
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = '16px Noto Sans SC';
      ctx.textAlign = 'center';
      ctx.fillText('起点', mapX(0), trackY + 50);
      ctx.fillText('终点 (100m)', mapX(100), trackY + 50);
      
      // Draw traces
      ctx.strokeStyle = '#10b981'; // green for turtle
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(mapX(0), trackY);
      for(let k=1; k<=step; k++) {
          let pos = 100 * (1 - Math.pow(0.5, k));
          ctx.lineTo(mapX(pos), trackY);
          // Draw a small dot for each step
          ctx.arc(mapX(pos), trackY, 5, 0, Math.PI*2);
          ctx.moveTo(mapX(pos), trackY);
      }
      ctx.stroke();

      // Draw Turtle
      const tX = mapX(turtlePos);
      ctx.font = '32px Arial';
      ctx.fillText('🐢', tX, trackY - 10);
      
      // Draw Info
      ctx.fillStyle = '#38bdf8';
      ctx.font = '18px Noto Sans SC';
      ctx.textAlign = 'left';
      ctx.fillText(`步数: ${step}`, 50, height - 30);
      ctx.fillText(`已走路程: ${turtlePos.toFixed(2)}m`, 200, height - 30);
      ctx.fillText(`剩余路程: ${(100 - turtlePos).toFixed(2)}m`, 450, height - 30);
  }

  function renderLoop(time) {
      if (!isPlaying) return;
      
      // Update every 1000ms
      if (time - lastTime > 1000) {
          if (step < 10) {
              nextStep();
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
