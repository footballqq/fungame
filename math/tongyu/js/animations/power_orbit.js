/**
 * 动画组件 3：幂模轨道与循环追踪器 (Power Modulo Orbit & Order)
 * 展示 a^1, a^2, a^3 ... mod m 在环上的轨道跳跃与循环节 (阶的直观感知)
 */
export function initPowerOrbit(container) {
  container.innerHTML = `
    <div class="canvas-anim-wrapper">
      <div class="canvas-header">
        <div class="canvas-title-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
          <span>幂模轨道循环追踪器（Power Residues Orbit）</span>
        </div>
        <div id="orbit-status-tag" class="example-tag">阶与循环节探测</div>
      </div>
      
      <div class="canvas-viewport-container">
        <canvas id="power-orbit-canvas" class="canvas-element" width="800" height="400"></canvas>
      </div>

      <div class="canvas-controls-bar">
        <div class="control-group">
          <span class="control-label">底数 a:</span>
          <input type="range" id="slider-orbit-a" class="control-slider" min="2" max="15" value="3">
          <span id="val-orbit-a" class="control-val">3</span>
        </div>
        <div class="control-group">
          <span class="control-label">模数 m (建议素数/合数):</span>
          <input type="range" id="slider-orbit-m" class="control-slider" min="3" max="23" value="13">
          <span id="val-orbit-m" class="control-val">13</span>
        </div>
        <div class="control-group">
          <button id="btn-step-orbit" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">
            ▶ 逐步跳跃
          </button>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#power-orbit-canvas');
  const ctx = canvas.getContext('2d');
  const sliderA = container.querySelector('#slider-orbit-a');
  const sliderM = container.querySelector('#slider-orbit-m');
  const valA = container.querySelector('#val-orbit-a');
  const valM = container.querySelector('#val-orbit-m');
  const statusTag = container.querySelector('#orbit-status-tag');
  const btnStep = container.querySelector('#btn-step-orbit');

  let a = parseInt(sliderA.value);
  let m = parseInt(sliderM.value);
  let step = 1;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = 380 * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  function gcd(x, y) {
    return y === 0 ? x : gcd(y, x % y);
  }

  function draw() {
    const w = canvas.width / window.devicePixelRatio;
    const h = 380;
    ctx.clearRect(0, 0, w, h);

    const centerX = w * 0.4;
    const centerY = h / 2;
    const radius = Math.min(centerX, centerY) - 45;

    // 计算序列 a^1, a^2 ... mod m
    const sequence = [];
    const visited = new Map();
    let cur = 1;
    let order = 0;

    for (let k = 1; k <= 30; k++) {
      cur = (cur * a) % m;
      sequence.push({ power: k, rem: cur });
      if (cur === 1 && order === 0) {
        order = k;
      }
    }

    // 1. 绘制模数圆环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. 绘制各个余数刻度
    const coords = [];
    for (let i = 0; i < m; i++) {
      const angle = (i / m) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      coords.push({ x, y });

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = (i === 1) ? '#fbbf24' : 'rgba(203, 213, 225, 0.6)';
      ctx.fill();

      const tx = centerX + (radius + 20) * Math.cos(angle);
      const ty = centerY + (radius + 20) * Math.sin(angle);
      ctx.font = '12px "Fira Code", monospace';
      ctx.fillStyle = (i === 1) ? '#fbbf24' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i.toString(), tx, ty);
    }

    // 3. 绘制轨道跳跃箭头
    const maxDraw = Math.min(step, sequence.length);
    ctx.lineWidth = 2.5;

    for (let i = 0; i < maxDraw; i++) {
      const fromRem = (i === 0) ? 1 : sequence[i - 1].rem;
      const toRem = sequence[i].rem;

      const p1 = coords[fromRem];
      const p2 = coords[toRem];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      
      const hue = (i * 45) % 360;
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.75)`;
      ctx.stroke();

      // 端点光点
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
      ctx.fill();
    }

    // 4. 右侧信息板
    const rightX = w * 0.7;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(rightX - 30, 30, w - rightX + 10, 320, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(`模数 m = ${m}, 底数 a = ${a}`, rightX - 10, 60);

    const isCoprime = gcd(a, m) === 1;
    ctx.font = '13px "Noto Sans SC", sans-serif';
    ctx.fillStyle = isCoprime ? '#34d399' : '#f43f5e';
    ctx.fillText(`gcd(${a}, ${m}) = ${gcd(a, m)} (${isCoprime ? '互质' : '不互质'})`, rightX - 10, 88);

    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`阶 ord_${m}(${a}) = ${order > 0 ? order : '未回到 1'}`, rightX - 10, 120);

    ctx.font = '13px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('前几步幂模序列：', rightX - 10, 150);

    ctx.font = '13px "Fira Code", monospace';
    const showSteps = Math.min(6, sequence.length);
    for (let s = 0; s < showSteps; s++) {
      ctx.fillStyle = (s < maxDraw) ? '#38bdf8' : '#64748b';
      ctx.fillText(`${a}^${s + 1} ≡ ${sequence[s].rem} (mod ${m})`, rightX - 5, 178 + s * 22);
    }
  }

  function update() {
    a = parseInt(sliderA.value);
    m = parseInt(sliderM.value);
    valA.textContent = a;
    valM.textContent = m;
    step = 5;
    statusTag.textContent = `底数 a = ${a}, 模数 m = ${m}`;
    draw();
  }

  sliderA.addEventListener('input', update);
  sliderM.addEventListener('input', update);
  btnStep.addEventListener('click', () => {
    step = (step >= 12) ? 1 : step + 1;
    draw();
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
  });

  setTimeout(() => {
    resizeCanvas();
    draw();
  }, 50);

  return {
    destroy() {}
  };
}
