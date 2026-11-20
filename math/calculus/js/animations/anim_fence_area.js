export function initFenceAreaAnim(canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  
  let x = 10;
  
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
          <label>篱笆长 \\(x\\): <span id="x-val">10.0</span></label><br>
          <input type="range" id="x-slider" min="1" max="19" step="0.5" value="10" style="width: 200px;">
      `;
      container.appendChild(uiContainer);
      if (window.renderMathInElement) {
          window.renderMathInElement(uiContainer, { delimiters: [{left: '\\(', right: '\\)', display: false}] });
      }
  }

  const slider = uiContainer.querySelector('#x-slider');
  const xVal = uiContainer.querySelector('#x-val');
  
  slider.oninput = () => {
      x = parseFloat(slider.value);
      xVal.innerText = x.toFixed(1);
      draw();
  };

  const getArea = (w) => w * (20 - w);

  function draw() {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Left Panel: Fence (Width: width/2)
      const leftW = width / 2;
      const rightW = width / 2;
      
      // Draw fence
      const fenceWidth = x * 10;
      const fenceHeight = (20 - x) * 10;
      
      ctx.strokeStyle = '#b45309'; // amber-700
      ctx.lineWidth = 4;
      ctx.strokeRect((leftW - fenceWidth)/2, height/2 + 50 - fenceHeight, fenceWidth, fenceHeight);
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`面积: ${getArea(x).toFixed(2)}`, leftW/2, height - 30);

      // Right Panel: Area Curve
      const mapX = (w) => leftW + 40 + (w / 20) * (rightW - 80);
      const mapY = (a) => height - 50 - (a / 100) * (height - 100);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mapX(0), mapY(0)); ctx.lineTo(mapX(20), mapY(0));
      ctx.moveTo(mapX(0), mapY(0)); ctx.lineTo(mapX(0), mapY(100));
      ctx.stroke();

      ctx.strokeStyle = '#10b981'; // green-500
      ctx.lineWidth = 2;
      ctx.beginPath();
      for(let w = 0; w <= 20; w += 0.5) {
          if (w === 0) ctx.moveTo(mapX(w), mapY(getArea(w)));
          else ctx.lineTo(mapX(w), mapY(getArea(w)));
      }
      ctx.stroke();

      // Current Point
      const area = getArea(x);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(mapX(x), mapY(area), 5, 0, Math.PI*2);
      ctx.fill();

      // Tangent line at current point
      const slope = 20 - 2 * x; // S'(x)
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(mapX(x - 2), mapY(area - slope * 2));
      ctx.lineTo(mapX(x + 2), mapY(area + slope * 2));
      ctx.stroke();
      ctx.setLineDash([]);
  }

  draw();
}
