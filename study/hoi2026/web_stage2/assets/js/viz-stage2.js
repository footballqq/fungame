/**
 * 海淀信息学第二赛段 · 专属可视化交互引擎（典雅暖米学术风）
 * 覆盖：汉诺塔互动演练沙盒、容斥原理动态矢量韦恩图沙盒、二维矩阵坐标映射器
 */

const HoiVizStage2 = {
  // ------------------------------------------------------------------------
  // 1. 汉诺塔（Towers of Hanoi）互动与自动演示器
  // ------------------------------------------------------------------------
  initHanoi(containerId, logId, stepCountId) {
    const stage = document.getElementById(containerId);
    const log = document.getElementById(logId);
    const stepEl = document.getElementById(stepCountId);
    if (!stage) return null;

    let numDiscs = 3;
    let pegs = { A: [3, 2, 1], B: [], C: [] }; // 盘子编号越大尺寸越大
    let selectedPeg = null;
    let moves = 0;
    let autoTimer = null;

    const render = () => {
      stage.innerHTML = '';
      ['A', 'B', 'C'].forEach(pKey => {
        const wrap = document.createElement('div');
        wrap.className = 'hanoi-peg-wrap';
        wrap.dataset.peg = pKey;

        wrap.innerHTML = `
          <div class="peg-pole"></div>
          <div class="peg-base"></div>
          <div class="peg-label">柱子 ${pKey}</div>
          <div class="hanoi-discs" id="peg-discs-${pKey}"></div>
        `;

        const discsContainer = wrap.querySelector(`#peg-discs-${pKey}`);
        pegs[pKey].forEach((dSize, idx) => {
          const disc = document.createElement('div');
          disc.className = `hanoi-disc disc-${dSize}`;
          disc.textContent = dSize;
          if (selectedPeg === pKey && idx === pegs[pKey].length - 1) {
            disc.classList.add('selected');
          }
          discsContainer.appendChild(disc);
        });

        wrap.addEventListener('click', () => {
          if (autoTimer) return; // 演示中不可手动点
          handlePegClick(pKey);
        });

        stage.appendChild(wrap);
      });

      if (stepEl) stepEl.textContent = moves;
    };

    const handlePegClick = (pKey) => {
      if (!selectedPeg) {
        // 第一下点击：选盘
        if (pegs[pKey].length === 0) {
          if (log) log.innerHTML = `⚠️ 柱子 ${pKey} 上面没有盘子，请点击有盘子的柱子！`;
          return;
        }
        selectedPeg = pKey;
        const topDisc = pegs[pKey][pegs[pKey].length - 1];
        if (log) log.innerHTML = `选中了 <b>柱子 ${pKey}</b> 顶部的 <b>${topDisc} 号盘</b>，请点击目标柱子放置。`;
        render();
      } else {
        // 第二下点击：放盘
        const from = selectedPeg;
        const to = pKey;
        selectedPeg = null;

        if (from === to) {
          if (log) log.innerHTML = `已取消对 <b>柱子 ${from}</b> 的选择。`;
          render();
          return;
        }

        const discToMove = pegs[from][pegs[from].length - 1];
        const destTop = pegs[to].length > 0 ? pegs[to][pegs[to].length - 1] : 999;

        if (discToMove > destTop) {
          if (log) log.innerHTML = `❌ <b>违规移动！</b>大盘（${discToMove} 号）不能压在小盘（${destTop} 号）上面！请重新选择。`;
          render();
          return;
        }

        // 合法移动
        pegs[from].pop();
        pegs[to].push(discToMove);
        moves++;

        if (log) log.innerHTML = `✔ 成功把 <b>${discToMove} 号盘</b> 从 <b>柱子 ${from}</b> 移到了 <b>柱子 ${to}</b>！`;
        render();

        // 检查通关
        if (pegs.C.length === numDiscs) {
          if (log) log.innerHTML = `🎉 <b>太棒了！恭喜成功完成汉诺塔挑战！</b>用时 ${moves} 步（最优步数：${Math.pow(2, numDiscs) - 1} 步）。`;
        }
      }
    };

    const reset = (discs = 3) => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
      numDiscs = discs;
      pegs = { A: [], B: [], C: [] };
      for (let i = discs; i >= 1; i--) {
        pegs.A.push(i);
      }
      selectedPeg = null;
      moves = 0;
      if (log) log.innerHTML = `已重置为 <b>${discs} 个盘子</b>。理论最优解为 <b>2^${discs} - 1 = ${Math.pow(2, discs) - 1} 步</b>。试试看！`;
      render();
    };

    const autoPlay = () => {
      reset(numDiscs);
      const steps = [];
      const solve = (n, from, to, aux) => {
        if (n === 1) {
          steps.push([from, to]);
          return;
        }
        solve(n - 1, from, aux, to);
        steps.push([from, to]);
        solve(n - 1, aux, to, from);
      };

      solve(numDiscs, 'A', 'C', 'B');

      let stepIdx = 0;
      if (log) log.innerHTML = `▶ <b>自动递归演示开始：</b>正在根据三步走递归法则逐步移动...`;

      autoTimer = setInterval(() => {
        if (stepIdx >= steps.length) {
          clearInterval(autoTimer);
          autoTimer = null;
          if (log) log.innerHTML = `🏁 <b>自动演示完毕！</b>严格用时 2^${numDiscs} - 1 = <b>${steps.length} 步</b> 完成！这就是递归分治的魔力！`;
          return;
        }

        const [from, to] = steps[stepIdx];
        const disc = pegs[from].pop();
        pegs[to].push(disc);
        moves++;
        stepIdx++;

        if (log) log.innerHTML = `[第 ${stepIdx}/${steps.length} 步] 递归将 <b>${disc} 号盘</b> 从 <b>柱子 ${from}</b> 移到 <b>柱子 ${to}</b>`;
        render();
      }, 750);
    };

    render();

    return {
      reset,
      autoPlay
    };
  },

  // ------------------------------------------------------------------------
  // 2. 容斥原理动态矢量韦恩图沙盒 (Venn Diagram)
  // ------------------------------------------------------------------------
  initVenn(containerId, countAId, countBId, countABId, calcResultId) {
    const container = document.getElementById(containerId);
    const inputA = document.getElementById(countAId);
    const inputB = document.getElementById(countBId);
    const inputAB = document.getElementById(countABId);
    const resEl = document.getElementById(calcResultId);

    const labelA = document.getElementById('labelValA');
    const labelB = document.getElementById('labelValB');
    const labelAB = document.getElementById('labelValAB');
    const formulaText = document.getElementById('vennFormulaText');

    const update = () => {
      const a = parseInt(inputA.value, 10) || 0;
      const b = parseInt(inputB.value, 10) || 0;
      // 交集不可超过两集合最小值
      const maxAB = Math.min(a, b);
      if (inputAB.max !== String(maxAB)) {
        inputAB.max = maxAB;
      }
      let ab = parseInt(inputAB.value, 10) || 0;
      if (ab > maxAB) {
        ab = maxAB;
        inputAB.value = ab;
      }

      const union = a + b - ab;

      // 更新标签显示
      if (labelA) labelA.textContent = a;
      if (labelB) labelB.textContent = b;
      if (labelAB) labelAB.textContent = ab;
      if (resEl) resEl.textContent = `并集 |A ∪ B| = ${union}`;
      if (formulaText) formulaText.textContent = `${union} = ${a} + ${b} - ${ab}`;

      // 动态绘制 SVG 矢量图
      if (container) {
        // 计算两圆半径与圆心间距
        const rA = Math.max(45, Math.min(85, 45 + a * 0.4));
        const rB = Math.max(45, Math.min(85, 45 + b * 0.4));
        // 重叠比例越大约靠近
        const overlapRatio = maxAB > 0 ? (ab / maxAB) : 0;
        const dist = (rA + rB) - (overlapRatio * Math.min(rA, rB) * 0.95);

        const cxA = 240 - dist / 2;
        const cxB = 240 + dist / 2;
        const cy = 110;

        container.innerHTML = `
          <svg width="100%" height="220" viewBox="0 0 480 220" style="overflow:visible;">
            <defs>
              <filter id="vennShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#8C532B" flood-opacity="0.1"/>
              </filter>
            </defs>
            <!-- 集合 A 圆 -->
            <circle cx="${cxA}" cy="${cy}" r="${rA}" fill="#D48B30" fill-opacity="0.32" stroke="#B57A24" stroke-width="2.5" filter="url(#vennShadow)" />
            <!-- 集合 B 圆 -->
            <circle cx="${cxB}" cy="${cy}" r="${rB}" fill="#487D56" fill-opacity="0.32" stroke="#386C4A" stroke-width="2.5" filter="url(#vennShadow)" />
            
            <!-- 文字标签 -->
            <text x="${cxA - rA * 0.4}" y="${cy}" text-anchor="middle" font-size="15" font-weight="bold" fill="#7A441F">A: ${a - ab}</text>
            <text x="${cxB + rB * 0.4}" y="${cy}" text-anchor="middle" font-size="15" font-weight="bold" fill="#245035">B: ${b - ab}</text>
            <text x="240" y="${cy}" text-anchor="middle" font-size="16" font-weight="900" fill="#2B2520">A ∩ B: ${ab}</text>
            
            <text x="${cxA}" y="${cy - rA - 12}" text-anchor="middle" font-size="14" font-weight="bold" fill="#9E6518">集合 A (|A|=${a})</text>
            <text x="${cxB}" y="${cy - rB - 12}" text-anchor="middle" font-size="14" font-weight="bold" fill="#386C4A">集合 B (|B|=${b})</text>
          </svg>
        `;
      }
    };

    if (inputA && inputB && inputAB) {
      inputA.addEventListener('input', update);
      inputB.addEventListener('input', update);
      inputAB.addEventListener('input', update);
      update();
    }
  },

  // ------------------------------------------------------------------------
  // 3. 二维矩阵物理内存下标映射器 (2D Matrix Mapper)
  // ------------------------------------------------------------------------
  initMatrix(gridContainerId, logId) {
    const grid = document.getElementById(gridContainerId);
    const log = document.getElementById(logId);
    if (!grid) return;

    const R = 3, C = 4; // 3 行 4 列
    grid.innerHTML = '';

    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        const linearIdx = r * C + c;
        cell.innerHTML = `
          <div class="cell-pos">a[${r}][${c}]</div>
          <div class="cell-sub">物理偏移 #${linearIdx}</div>
        `;

        cell.addEventListener('click', () => {
          grid.querySelectorAll('.matrix-cell').forEach(cl => cl.classList.remove('selected', 'active'));
          cell.classList.add('selected');
          if (log) {
            log.innerHTML = `
              💡 <b>实时内存寻址计算：</b><br>
              你点击了 <b>第 ${r} 行，第 ${c} 列</b> 的单元格 <code>a[${r}][${c}]</code>。<br>
              • C++ 采用<b>行优先存储</b>，先排满第 0 行，再排第 1 行……<br>
              • 对应一维线性内存下标公式：<b>物理序号 = 行号 × 总列数 + 列号 = ${r} × ${C} + ${c} = ${linearIdx}</b>！<br>
              • <strong>考点印证：</strong>这就是为什么定义二维数组时<code>int a[][4]</code>可以省略行数，但<strong>列数 4 绝对不能省略</strong>的根本原因！
            `;
          }
        });

        grid.appendChild(cell);
      }
    }
  }
};

window.HoiVizStage2 = HoiVizStage2;
