export function initEpsilonNAnim(canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  
  // State
  let epsilon = 0.5;
  let N = Math.floor(1 / epsilon);
  let animationStep = 0; // for animating points gradually turning green
  let isAnimating = false;
  
  // HTML controls mapping
  // Since we injected the canvas via CanvasAnimWrapper, we need to inject controls dynamically
  const container = canvas.parentElement;
  
  // Create UI overlay if not exists
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
          <label>误差 \\(\\epsilon\\):</label>
          <input type="number" id="epsilon-input" value="0.5" step="0.1" min="0.05" max="1" style="width: 60px; padding: 2px 5px; border-radius: 4px; border: 1px solid #38bdf8; background: #1e293b; color: #fff;">
          <button id="btn-challenge" class="btn" style="padding: 2px 10px; min-width: 60px;">出招！</button>
          <div id="n-result" style="margin-left: 10px; font-weight: bold; color: #38bdf8;"></div>
      `;
      container.appendChild(uiContainer);
      
      // Render math in the label
      if (window.renderMathInElement) {
          window.renderMathInElement(uiContainer, {
              delimiters: [{left: '\\(', right: '\\)', display: false}],
              throwOnError: false
          });
      }
  }

  const input = uiContainer.querySelector('#epsilon-input');
  const btn = uiContainer.querySelector('#btn-challenge');
  const resultText = uiContainer.querySelector('#n-result');
  
  btn.onclick = () => {
      let val = parseFloat(input.value);
      if (isNaN(val) || val <= 0) val = 0.1;
      epsilon = val;
      N = Math.floor(1 / epsilon);
      resultText.innerText = `接招：找到 N = ${N}`;
      
      animationStep = 0;
      isAnimating = true;
      animatePoints();
  };

  // Coordinate mapping
  // Map x in [-0.2, 1.2] to pixel [50, width-50]
  const mapX = (x) => {
      const minX = -0.2, maxX = 1.2;
      return 50 + ((x - minX) / (maxX - minX)) * (width - 100);
  };
  
  const mapY = height / 2;

  function draw() {
      // Clear
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, width, height);

      // Draw Number Line
      ctx.beginPath();
      ctx.moveTo(mapX(-0.2), mapY);
      ctx.lineTo(mapX(1.2), mapY);
      ctx.strokeStyle = '#94a3b8'; // slate-400
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw 0 and 1 marks
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      
      [0, 1].forEach(val => {
          ctx.beginPath();
          ctx.moveTo(mapX(val), mapY - 5);
          ctx.lineTo(mapX(val), mapY + 5);
          ctx.stroke();
          ctx.fillText(val.toString(), mapX(val), mapY + 20);
      });

      // Draw Error Band [-epsilon, epsilon]
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // red-500 with alpha
      ctx.fillRect(mapX(-epsilon), mapY - 20, mapX(epsilon) - mapX(-epsilon), 40);
      
      // Draw Epsilon bounds
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.beginPath();
      ctx.moveTo(mapX(-epsilon), mapY - 20); ctx.lineTo(mapX(-epsilon), mapY + 20);
      ctx.moveTo(mapX(epsilon), mapY - 20); ctx.lineTo(mapX(epsilon), mapY + 20);
      ctx.stroke();
      
      // Label epsilon bounds
      ctx.fillStyle = '#ef4444';
      ctx.font = '12px Arial';
      ctx.fillText('-ε', mapX(-epsilon), mapY - 25);
      ctx.fillText('+ε', mapX(epsilon), mapY - 25);
      
      // Draw Points a_n = 1/n
      // Max points to show: 50
      const maxPoints = 50;
      for (let i = 1; i <= maxPoints; i++) {
          let x = 1 / i;
          
          ctx.beginPath();
          ctx.arc(mapX(x), mapY, 5, 0, Math.PI * 2);
          
          if (isAnimating && i <= animationStep) {
              if (i > N) {
                  ctx.fillStyle = '#10b981'; // green-500 (safe)
              } else {
                  ctx.fillStyle = '#94a3b8'; // gray
              }
          } else if (!isAnimating) {
              // Static display
              if (i > N) {
                  ctx.fillStyle = '#10b981';
              } else {
                  ctx.fillStyle = '#94a3b8';
              }
          } else {
              ctx.fillStyle = 'rgba(255,255,255,0.1)'; // hidden/faded
          }
          
          ctx.fill();
          
          // Draw a small outline for visibility
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.stroke();
      }
      
      // Highlight Limit Point L=0
      ctx.beginPath();
      ctx.arc(mapX(0), mapY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; // Red
      ctx.fill();
      
      // Draw instruction if needed
      if (!isAnimating && animationStep === 0 && N === Math.floor(1/0.5)) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px Noto Sans SC';
          ctx.fillText('修改上方的误差 ε，点击“出招！”', width/2, height - 30);
      }
  }

  function animatePoints() {
      if (animationStep <= 50) {
          animationStep++;
          draw();
          requestAnimationFrame(animatePoints);
      } else {
          isAnimating = false;
      }
  }

  // Initial draw
  resultText.innerText = `接招：找到 N = ${N}`;
  draw();
}
