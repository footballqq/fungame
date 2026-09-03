export function initSecantTangentAnim(canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  
  let h = 1.0;
  
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
      
      uiContainer.innerHTML = `
          <label>调整 \\(h\\): <span id="h-val">1.00</span></label><br>
          <input type="range" id="h-slider" min="0.01" max="2" step="0.01" value="1.0" style="width: 200px;">
      `;
      container.appendChild(uiContainer);
      if (window.renderMathInElement) {
          window.renderMathInElement(uiContainer, { delimiters: [{left: '\\(', right: '\\)', display: false}] });
      }
  }

  const slider = uiContainer.querySelector('#h-slider');
  const hVal = uiContainer.querySelector('#h-val');
  
  slider.oninput = () => {
      h = parseFloat(slider.value);
      hVal.innerText = h.toFixed(2);
      draw();
  };

  const f = (x) => x * x;
  const df = (x) => 2 * x;
  
  const x0 = 1;

  const mapX = (x) => 100 + (x + 1) * (width - 200) / 4;
  const mapY = (y) => height - 50 - y * (height - 100) / 9;

  function draw() {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Axes
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mapX(-1), mapY(0)); ctx.lineTo(mapX(3), mapY(0));
      ctx.moveTo(mapX(0), mapY(-1)); ctx.lineTo(mapX(0), mapY(9));
      ctx.stroke();

      // Curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -1; x <= 3; x += 0.1) {
          if (x === -1) ctx.moveTo(mapX(x), mapY(f(x)));
          else ctx.lineTo(mapX(x), mapY(f(x)));
      }
      ctx.stroke();

      // Tangent line at x0 (Red Dashed)
      let slopeT = df(x0);
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(mapX(-1), mapY(f(x0) + slopeT * (-1 - x0)));
      ctx.lineTo(mapX(3), mapY(f(x0) + slopeT * (3 - x0)));
      ctx.stroke();
      ctx.setLineDash([]);

      // Secant line (Blue)
      let x1 = x0 + h;
      let slopeS = (f(x1) - f(x0)) / h;
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.beginPath();
      ctx.moveTo(mapX(-1), mapY(f(x0) + slopeS * (-1 - x0)));
      ctx.lineTo(mapX(3), mapY(f(x0) + slopeS * (3 - x0)));
      ctx.stroke();

      // Points P and Q
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(mapX(x0), mapY(f(x0)), 5, 0, Math.PI*2);
      ctx.arc(mapX(x1), mapY(f(x1)), 5, 0, Math.PI*2);
      ctx.fill();
      
      ctx.font = '14px Arial';
      ctx.fillText('P', mapX(x0)-15, mapY(f(x0))-10);
      ctx.fillText('Q', mapX(x1)-15, mapY(f(x1))-10);

      // Delta x, Delta y triangle
      ctx.strokeStyle = '#10b981'; // green
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mapX(x0), mapY(f(x0)));
      ctx.lineTo(mapX(x1), mapY(f(x0)));
      ctx.lineTo(mapX(x1), mapY(f(x1)));
      ctx.stroke();
      ctx.setLineDash([]);
  }

  draw();
}
