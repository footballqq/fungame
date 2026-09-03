/**
 * 动画组件 2：同余四则运算法则互动台 (Congruence Arithmetic Playground)
 * 验证 (a + b) mod m 与 ((a mod m) + (b mod m)) mod m 的完全等价
 */
export function initCongruenceCalc(container) {
  container.innerHTML = `
    <div class="canvas-anim-wrapper">
      <div class="canvas-header">
        <div class="canvas-title-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>
          <span>同余四则运算法则验证台（Arithmetic Pipeline）</span>
        </div>
        <div id="calc-status-tag" class="example-tag">法则验证：先算后模 ≡ 先模后算</div>
      </div>
      
      <div class="canvas-viewport-container">
        <canvas id="congruence-calc-canvas" class="canvas-element" width="800" height="400"></canvas>
      </div>

      <div class="canvas-controls-bar">
        <div class="control-group">
          <span class="control-label">数 a:</span>
          <input type="range" id="slider-calc-a" class="control-slider" min="1" max="50" value="23">
          <span id="val-calc-a" class="control-val">23</span>
        </div>
        <div class="control-group">
          <span class="control-label">运算:</span>
          <select id="select-calc-op" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.88rem;">
            <option value="+">加法 (+)</option>
            <option value="*">乘法 (×)</option>
            <option value="^">乘方 (a^b)</option>
          </select>
        </div>
        <div class="control-group">
          <span class="control-label">数 b:</span>
          <input type="range" id="slider-calc-b" class="control-slider" min="1" max="20" value="15">
          <span id="val-calc-b" class="control-val">15</span>
        </div>
        <div class="control-group">
          <span class="control-label">模数 m:</span>
          <input type="range" id="slider-calc-m" class="control-slider" min="2" max="17" value="7">
          <span id="val-calc-m" class="control-val">7</span>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#congruence-calc-canvas');
  const ctx = canvas.getContext('2d');
  const sliderA = container.querySelector('#slider-calc-a');
  const sliderB = container.querySelector('#slider-calc-b');
  const sliderM = container.querySelector('#slider-calc-m');
  const selectOp = container.querySelector('#select-calc-op');
  
  const valA = container.querySelector('#val-calc-a');
  const valB = container.querySelector('#val-calc-b');
  const valM = container.querySelector('#val-calc-m');
  const statusTag = container.querySelector('#calc-status-tag');

  let a = parseInt(sliderA.value);
  let b = parseInt(sliderB.value);
  let m = parseInt(sliderM.value);
  let op = selectOp.value;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = 380 * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  function draw() {
    const w = canvas.width / window.devicePixelRatio;
    const h = 380;
    ctx.clearRect(0, 0, w, h);

    const remA = a % m;
    const remB = b % m;

    let rawVal = 0;
    let resDirect = 0;
    let resModular = 0;

    if (op === '+') {
      rawVal = a + b;
      resDirect = rawVal % m;
      resModular = (remA + remB) % m;
    } else if (op === '*') {
      rawVal = a * b;
      resDirect = rawVal % m;
      resModular = (remA * remB) % m;
    } else if (op === '^') {
      // 乘方简化
      rawVal = Math.pow(a, Math.min(b, 6)); // 防止溢出显示
      let temp = 1;
      for (let i = 0; i < b; i++) {
        temp = (temp * remA) % m;
      }
      resDirect = temp;
      resModular = temp;
    }

    // 绘制两条流动对比管道
    // 管道 A：常规先算后模
    const boxW = Math.min(w * 0.42, 340);
    const topY = 40;
    const botY = 200;

    // 卡片 A
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(30, topY, boxW, 130, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('通道 A：先做运算 ➔ 再取模', 45, topY + 30);

    ctx.font = '14px "Fira Code", monospace';
    ctx.fillStyle = '#cbd5e1';
    if (op === '+') {
      ctx.fillText(`原式计算: ${a} + ${b} = ${rawVal}`, 45, topY + 65);
      ctx.fillText(`最后取模: ${rawVal} mod ${m} = [ ${resDirect} ]`, 45, topY + 95);
    } else if (op === '*') {
      ctx.fillText(`原式计算: ${a} × ${b} = ${rawVal}`, 45, topY + 65);
      ctx.fillText(`最后取模: ${rawVal} mod ${m} = [ ${resDirect} ]`, 45, topY + 95);
    } else {
      ctx.fillText(`原式乘方: ${a}^${b} = 大数运算`, 45, topY + 65);
      ctx.fillText(`最后取模: 余数为 [ ${resDirect} ]`, 45, topY + 95);
    }

    // 卡片 B：先模后算
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(30, botY, boxW, 140, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('通道 B：先各自取模 ➔ 简化后再算 (推荐！)', 45, botY + 30);

    ctx.font = '14px "Fira Code", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`${a} ≡ ${remA} (mod ${m}),  ${b} ≡ ${remB} (mod ${m})`, 45, botY + 65);
    if (op === '+') {
      ctx.fillText(`小数字相加: ${remA} + ${remB} = ${remA + remB}`, 45, botY + 95);
      ctx.fillText(`化简求余: (${remA} + ${remB}) mod ${m} = [ ${resModular} ]`, 45, botY + 120);
    } else if (op === '*') {
      ctx.fillText(`小数字相乘: ${remA} × ${remB} = ${remA * remB}`, 45, botY + 95);
      ctx.fillText(`化简求余: (${remA} × ${remB}) mod ${m} = [ ${resModular} ]`, 45, botY + 120);
    } else {
      ctx.fillText(`底数降模: ${a}^${b} ≡ (${remA})^${b} (mod ${m})`, 45, botY + 95);
      ctx.fillText(`化简求余: 快速幂求得 [ ${resModular} ]`, 45, botY + 120);
    }

    // 右侧等价天平大结论
    const rightX = w * 0.52;
    const rightW = w - rightX - 30;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.beginPath();
    ctx.roundRect(rightX, topY, rightW, 300, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 18px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ 结果完全等价！', rightX + rightW / 2, topY + 45);

    ctx.font = 'bold 36px "Fira Code", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`余数 = ${resDirect}`, rightX + rightW / 2, topY + 115);

    ctx.font = '14px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('数论心法：', rightX + rightW / 2, topY + 165);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillText('“随时随地可以先换成余数再算”', rightX + rightW / 2, topY + 195);
    
    ctx.font = '13px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('不必算出庞大天文数字，即可秒杀余数！', rightX + rightW / 2, topY + 245);
  }

  function update() {
    a = parseInt(sliderA.value);
    b = parseInt(sliderB.value);
    m = parseInt(sliderM.value);
    op = selectOp.value;

    valA.textContent = a;
    valB.textContent = b;
    valM.textContent = m;

    draw();
  }

  sliderA.addEventListener('input', update);
  sliderB.addEventListener('input', update);
  sliderM.addEventListener('input', update);
  selectOp.addEventListener('change', update);

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
