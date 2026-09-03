export function initFunctionMachineAnim(canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  
  // State
  let isProcessing = false;
  let angle = 0;
  let outputResult = [];
  
  // Create UI overlay
  const container = canvas.parentElement;
  let uiContainer = container.querySelector('.anim-ui');
  if (!uiContainer) {
      uiContainer = document.createElement('div');
      uiContainer.className = 'anim-ui';
      uiContainer.style.position = 'absolute';
      uiContainer.style.top = '10px';
      uiContainer.style.left = '10px';
      uiContainer.style.background = 'rgba(15, 23, 42, 0.8)';
      uiContainer.style.padding = '10px';
      uiContainer.style.borderRadius = '8px';
      uiContainer.style.color = 'white';
      uiContainer.style.display = 'flex';
      uiContainer.style.gap = '10px';
      uiContainer.style.alignItems = 'center';
      
      uiContainer.innerHTML = `
          <label>丢入数字 \\(x\\):</label>
          <input type="number" id="x-input" value="2" step="1" style="width: 60px; padding: 2px 5px; border-radius: 4px; border: 1px solid #38bdf8; background: #1e293b; color: #fff;">
          <button id="btn-throw" class="btn" style="padding: 2px 10px; min-width: 60px; background: #38bdf8; color: #000; border: none; border-radius: 4px; cursor: pointer;">丢入机器！</button>
      `;
      container.appendChild(uiContainer);
      if (window.renderMathInElement) {
          window.renderMathInElement(uiContainer, { delimiters: [{left: '\\(', right: '\\)', display: false}] });
      }
  }

  const input = uiContainer.querySelector('#x-input');
  const btn = uiContainer.querySelector('#btn-throw');
  
  let currentX = 2;
  let currentY = 4;
  let animProgress = 0;

  btn.onclick = () => {
      if (isProcessing) return;
      currentX = parseFloat(input.value) || 0;
      currentY = currentX * currentX; // "好机器" is y=x^2
      isProcessing = true;
      animProgress = 0;
      animate();
  };

  function draw() {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Draw Machine in center
      const machineX = width / 2;
      const machineY = height / 2;
      
      ctx.save();
      ctx.translate(machineX, machineY);
      
      if (isProcessing && animProgress > 0.3 && animProgress < 0.7) {
          angle += 0.2;
          ctx.rotate(Math.sin(angle * 10) * 0.05); // shake
      }
      
      // Machine Body
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-60, -60, 120, 120);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.strokeRect(-60, -60, 120, 120);
      
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('f(x)=x²', 0, 5);
      
      ctx.restore();

      // Output Results list
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('输出记录:', width - 20, 30);
      outputResult.slice(-5).forEach((res, i) => {
          ctx.fillText(`f(${res.x}) = ${res.y}`, width - 20, 60 + i * 25);
      });

      // Draw Ball
      if (isProcessing) {
          ctx.fillStyle = '#f97316'; // orange-500
          ctx.beginPath();
          let bx, by;
          if (animProgress <= 0.3) {
              // moving to machine
              let t = animProgress / 0.3;
              bx = 50 + t * (machineX - 50);
              by = machineY;
              ctx.arc(bx, by, 15, 0, Math.PI*2);
              ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.font = '14px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(currentX, bx, by+5);
          } else if (animProgress >= 0.7) {
              // coming out of machine
              let t = (animProgress - 0.7) / 0.3;
              bx = machineX + t * (width - machineX - 50);
              by = machineY;
              ctx.arc(bx, by, 15, 0, Math.PI*2);
              ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.font = '14px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(currentY, bx, by+5);
          }
      }
  }

  function animate() {
      if (animProgress <= 1) {
          animProgress += 0.01;
          draw();
          requestAnimationFrame(animate);
      } else {
          isProcessing = false;
          outputResult.push({x: currentX, y: currentY});
          draw();
      }
  }

  draw();
}
