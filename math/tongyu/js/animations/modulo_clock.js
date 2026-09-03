/**
 * 动画组件 1：动态模数时钟转盘 (Modulo Clock Wheel)
 * 展示数轴弯曲成圆环、周期性表盘落点与同余等价类
 */
export function initModuloClock(container) {
  container.innerHTML = `
    <div class="canvas-anim-wrapper">
      <div class="canvas-header">
        <div class="canvas-title-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>模数时钟转盘实验台（Modulo Clock Simulator）</span>
        </div>
        <div id="clock-status-tag" class="example-tag">表盘周期 m = 12</div>
      </div>
      
      <div class="canvas-viewport-container">
        <canvas id="modulo-clock-canvas" class="canvas-element" width="800" height="400"></canvas>
      </div>

      <div class="canvas-controls-bar">
        <div class="control-group">
          <span class="control-label">模数 m (表盘刻度):</span>
          <input type="range" id="slider-modulo-m" class="control-slider" min="2" max="24" value="12">
          <span id="val-modulo-m" class="control-val">12</span>
        </div>
        <div class="control-group">
          <span class="control-label">输入数 a (前进刻度):</span>
          <input type="range" id="slider-number-a" class="control-slider" min="0" max="100" value="29">
          <span id="val-number-a" class="control-val">29</span>
        </div>
        <div class="control-group">
          <button id="btn-animate-clock" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">
            ▶ 动画跳动演示
          </button>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#modulo-clock-canvas');
  const ctx = canvas.getContext('2d');
  const sliderM = container.querySelector('#slider-modulo-m');
  const sliderA = container.querySelector('#slider-number-a');
  const valM = container.querySelector('#val-modulo-m');
  const valA = container.querySelector('#val-number-a');
  const statusTag = container.querySelector('#clock-status-tag');
  const btnAnim = container.querySelector('#btn-animate-clock');

  let m = parseInt(sliderM.value);
  let a = parseInt(sliderA.value);
  let currentAngle = 0;
  let targetAngle = 0;
  let animId = null;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = 380 * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  function draw(progress = 1) {
    const w = canvas.width / window.devicePixelRatio;
    const h = 380;
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(centerX, centerY) - 50;

    // 1. 绘制外圆表盘
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 背景柔和光晕
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fill();

    const remainder = a % m;
    const turns = Math.floor(a / m);

    // 2. 绘制刻度与数字
    for (let i = 0; i < m; i++) {
      const angle = (i / m) * 2 * Math.PI - Math.PI / 2;
      const tickX = centerX + radius * Math.cos(angle);
      const tickY = centerY + radius * Math.sin(angle);
      const textX = centerX + (radius + 25) * Math.cos(angle);
      const textY = centerY + (radius + 25) * Math.sin(angle);

      const isTarget = (i === remainder);

      // 刻度点
      ctx.beginPath();
      ctx.arc(tickX, tickY, isTarget ? 6 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = isTarget ? '#38bdf8' : 'rgba(203, 213, 225, 0.6)';
      ctx.fill();

      // 数字标签
      ctx.font = isTarget ? 'bold 15px "Fira Code", monospace' : '12px "Fira Code", monospace';
      ctx.fillStyle = isTarget ? '#38bdf8' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i.toString(), textX, textY);
    }

    // 3. 绘制指针
    const ptrAngle = (remainder / m) * 2 * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + (radius - 20) * Math.cos(ptrAngle), centerY + (radius - 20) * Math.sin(ptrAngle));
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 指针圆心
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // 4. 信息浮层
    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.fillText(`被除数 a = ${a}`, 25, 35);
    ctx.font = '14px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`带余除法：${a} = ${m} × ${turns} + ${remainder}`, 25, 62);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillText(`同余式：${a} ≡ ${remainder} (mod ${m})`, 25, 88);
    ctx.fillText(`转了 ${turns} 整圈，余数落在刻度 [ ${remainder} ]`, 25, 114);
  }

  function update() {
    m = parseInt(sliderM.value);
    a = parseInt(sliderA.value);
    valM.textContent = m;
    valA.textContent = a;
    statusTag.textContent = `表盘周期 m = ${m} | a ≡ ${a % m} (mod ${m})`;
    draw();
  }

  sliderM.addEventListener('input', update);
  sliderA.addEventListener('input', update);
  
  btnAnim.addEventListener('click', () => {
    let cur = 0;
    const target = parseInt(sliderA.value);
    sliderA.value = 0;
    const timer = setInterval(() => {
      if (cur <= target) {
        sliderA.value = cur;
        update();
        cur++;
      } else {
        clearInterval(timer);
      }
    }, 40);
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
    destroy() {
      if (animId) cancelAnimationFrame(animId);
    }
  };
}
