/**
 * 动画组件 5：剩余类抽屉与鸽巢分配器 (Residue Drawers & Pigeonhole)
 * 演示整数集合按模 m 自动分类落入对应抽屉，生动呈现抽屉原理
 */
export function initResidueDrawers(container) {
  container.innerHTML = `
    <div class="canvas-anim-wrapper">
      <div class="canvas-header">
        <div class="canvas-title-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          <span>剩余类抽屉与鸽巢分配器（Residue Drawers）</span>
        </div>
        <div id="drawer-status-tag" class="example-tag">模 m 剩余类分类</div>
      </div>
      
      <div class="canvas-viewport-container">
        <canvas id="residue-drawers-canvas" class="canvas-element" width="800" height="400"></canvas>
      </div>

      <div class="canvas-controls-bar">
        <div class="control-group">
          <span class="control-label">模数 m (抽屉数量):</span>
          <input type="range" id="slider-drawer-m" class="control-slider" min="2" max="7" value="5">
          <span id="val-drawer-m" class="control-val">5</span>
        </div>
        <div class="control-group">
          <button id="btn-add-random-num" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">
            + 随机投放 1 个数
          </button>
          <button id="btn-batch-add" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.85rem;">
            ⚡ 批量投放 (验证抽屉原理)
          </button>
          <button id="btn-clear-drawers" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">
            清空
          </button>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#residue-drawers-canvas');
  const ctx = canvas.getContext('2d');
  const sliderM = container.querySelector('#slider-drawer-m');
  const valM = container.querySelector('#val-drawer-m');
  const btnAdd = container.querySelector('#btn-add-random-num');
  const btnBatch = container.querySelector('#btn-batch-add');
  const btnClear = container.querySelector('#btn-clear-drawers');

  let m = parseInt(sliderM.value);
  let numbers = [12, 17, 24, 35, 41, 53];

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

    // 计算每个抽屉里的数
    const drawers = Array.from({ length: m }, () => []);
    numbers.forEach(num => {
      const rem = ((num % m) + m) % m;
      drawers[rem].push(num);
    });

    const gap = 14;
    const drawerW = (w - 40 - (m - 1) * gap) / m;
    const drawerH = 240;
    const startY = 90;

    let hasCollision = false;

    // 绘制每个抽屉
    for (let i = 0; i < m; i++) {
      const dx = 20 + i * (drawerW + gap);
      const isCrowded = (drawers[i].length >= 2);
      if (isCrowded) hasCollision = true;

      // 抽屉背景
      ctx.fillStyle = isCrowded ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)';
      ctx.strokeStyle = isCrowded ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = isCrowded ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.roundRect(dx, startY, drawerW, drawerH, 10);
      ctx.fill();
      ctx.stroke();

      // 抽屉标签
      ctx.font = 'bold 15px "Fira Code"';
      ctx.fillStyle = isCrowded ? '#38bdf8' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(`[ ${i} ] 模 ${m}`, dx + drawerW / 2, startY + 28);

      ctx.font = '12px "Noto Sans SC"';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${drawers[i].length} 个数`, dx + drawerW / 2, startY + 48);

      // 绘制落入该抽屉的数
      drawers[i].forEach((n, idx) => {
        const itemY = startY + 70 + idx * 30;
        if (itemY < startY + drawerH - 10) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(dx + 6, itemY, drawerW - 12, 24, 6);
          ctx.fill();
          ctx.stroke();

          ctx.font = 'bold 13px "Fira Code"';
          ctx.fillStyle = '#34d399';
          ctx.fillText(n.toString(), dx + drawerW / 2, itemY + 16);
        }
      });
    }

    // 顶部状态
    ctx.font = 'bold 16px "Noto Sans SC"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`总投放 ${numbers.length} 个数，分布在 ${m} 个剩余类抽屉中`, w / 2, 40);

    if (numbers.length > m) {
      ctx.font = 'bold 14px "Noto Sans SC"';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`💡 鸽巢定理触发：${numbers.length} 个数 > ${m} 个抽屉 ➔ 必存在两数同余（其差为 ${m} 的倍数）！`, w / 2, 65);
    }
  }

  function update() {
    m = parseInt(sliderM.value);
    valM.textContent = m;
    draw();
  }

  sliderM.addEventListener('input', update);
  
  btnAdd.addEventListener('click', () => {
    const r = Math.floor(Math.random() * 90) + 10;
    numbers.push(r);
    draw();
  });

  btnBatch.addEventListener('click', () => {
    // 投放 m + 1 个数保证鸽巢定理
    numbers = [];
    for (let k = 0; k < m + 2; k++) {
      numbers.push(Math.floor(Math.random() * 80) + 10);
    }
    draw();
  });

  btnClear.addEventListener('click', () => {
    numbers = [];
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
