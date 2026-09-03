/**
 * 动画组件 4：中国剩余定理多齿轮啮合对齐仪 (CRT Multi-Gear Alignment Tool)
 * 动态演示三套不同齿数（模3、模5、模7）的齿轮随自然数旋转，余数同时命中的奇妙瞬间
 */
export function initCrtGears(container) {
  container.innerHTML = `
    <div class="canvas-anim-wrapper">
      <div class="canvas-header">
        <div class="canvas-title-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>中国剩余定理多齿轮啮合仪（CRT Gear Alignment）</span>
        </div>
        <div id="crt-status-tag" class="example-tag">目标：除3余2，除5余3，除7余2</div>
      </div>
      
      <div class="canvas-viewport-container">
        <canvas id="crt-gears-canvas" class="canvas-element" width="800" height="400"></canvas>
      </div>

      <div class="canvas-controls-bar">
        <div class="control-group">
          <span class="control-label">全局未知数 x:</span>
          <input type="range" id="slider-crt-x" class="control-slider" min="0" max="105" value="23">
          <span id="val-crt-x" class="control-val">23</span>
        </div>
        <div class="control-group">
          <button id="btn-crt-auto" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">
            ▶ 自动旋转搜寻
          </button>
        </div>
        <div class="control-group">
          <button id="btn-crt-target" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.85rem;">
            🎯 一键跳转至最小解 (x = 23)
          </button>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#crt-gears-canvas');
  const ctx = canvas.getContext('2d');
  const sliderX = container.querySelector('#slider-crt-x');
  const valX = container.querySelector('#val-crt-x');
  const statusTag = container.querySelector('#crt-status-tag');
  const btnAuto = container.querySelector('#btn-crt-auto');
  const btnTarget = container.querySelector('#btn-crt-target');

  let x = parseInt(sliderX.value);
  let autoTimer = null;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = 380 * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  function drawGear(cx, cy, radius, teeth, currentVal, targetRem, label) {
    const rem = currentVal % teeth;
    const isMatched = (rem === targetRem);

    // 齿轮外圈
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isMatched ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.6)';
    ctx.strokeStyle = isMatched ? '#10b981' : 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = isMatched ? 4 : 2;
    ctx.fill();
    ctx.stroke();

    // 齿轮齿与刻度
    for (let t = 0; t < teeth; t++) {
      const angle = (t / teeth) * 2 * Math.PI - Math.PI / 2;
      const tx = cx + radius * Math.cos(angle);
      const ty = cy + radius * Math.sin(angle);

      const isCurrentRem = (t === rem);
      const isTargetRem = (t === targetRem);

      ctx.beginPath();
      ctx.arc(tx, ty, isCurrentRem ? 6 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = isCurrentRem ? (isMatched ? '#10b981' : '#38bdf8') : (isTargetRem ? '#fbbf24' : '#64748b');
      ctx.fill();

      // 文本刻度
      const lx = cx + (radius - 18) * Math.cos(angle);
      const ly = cy + (radius - 18) * Math.sin(angle);
      ctx.font = isCurrentRem ? 'bold 13px "Fira Code"' : '10px "Fira Code"';
      ctx.fillStyle = isCurrentRem ? '#f8fafc' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.toString(), lx, ly);
    }

    // 齿轮中心标签
    ctx.font = 'bold 15px "Noto Sans SC"';
    ctx.fillStyle = isMatched ? '#10b981' : '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy - 8);

    ctx.font = '12px "Fira Code"';
    ctx.fillStyle = isMatched ? '#34d399' : '#cbd5e1';
    ctx.fillText(`余 ${rem} (目标 ${targetRem})`, cx, cy + 12);
  }

  function draw() {
    const w = canvas.width / window.devicePixelRatio;
    const h = 380;
    ctx.clearRect(0, 0, w, h);

    const r3 = x % 3;
    const r5 = x % 5;
    const r7 = x % 7;

    const matched = (r3 === 2 && r5 === 3 && r7 === 2);

    const gearY = 170;
    const g1X = w * 0.2;
    const g2X = w * 0.5;
    const g3X = w * 0.8;

    drawGear(g1X, gearY, 65, 3, x, 2, '齿轮 1 (模 3)');
    drawGear(g2X, gearY, 78, 5, x, 3, '齿轮 2 (模 5)');
    drawGear(g3X, gearY, 92, 7, x, 2, '齿轮 3 (模 7)');

    // 顶部状态展示
    ctx.font = 'bold 18px "Noto Sans SC"';
    ctx.textAlign = 'center';
    if (matched) {
      ctx.fillStyle = '#10b981';
      ctx.fillText(`🎉 三轮完全对齐！发现解 x = ${x} (通解 x ≡ ${x} mod 105)`, w / 2, 45);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`当前未知数 x = ${x} | 余数状态: (模3余${r3}, 模5余${r5}, 模7余${r7})`, w / 2, 45);
    }

    // 底部数学公式展示
    ctx.font = '13px "Noto Sans SC"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('孙子歌诀：三人同行七十稀 (70×2) + 五树梅花廿一枝 (21×3) + 七子团圆正半月 (15×2) = 233 ≡ 23 (mod 105)', w / 2, 330);
  }

  function update() {
    x = parseInt(sliderX.value);
    valX.textContent = x;
    draw();
  }

  sliderX.addEventListener('input', update);

  btnTarget.addEventListener('click', () => {
    sliderX.value = 23;
    update();
  });

  btnAuto.addEventListener('click', () => {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
      btnAuto.textContent = '▶ 自动旋转搜寻';
      return;
    }
    btnAuto.textContent = '⏸ 暂停旋转';
    autoTimer = setInterval(() => {
      let cur = parseInt(sliderX.value);
      cur = (cur >= 105) ? 0 : cur + 1;
      sliderX.value = cur;
      update();
    }, 60);
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
      if (autoTimer) clearInterval(autoTimer);
    }
  };
}
