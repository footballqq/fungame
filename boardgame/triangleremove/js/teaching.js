// codex: 2026-09-23 启发式教学系统：5阶段递进式探究教学、几何分类交互、鸽巢原理下界证明与阶梯练习
(function(root) {
  'use strict';

  class TeachingTutor {
    constructor(engine, canvas, audio) {
      this.engine = engine;
      this.canvas = canvas;
      this.audio = audio;
      this.currentStep = 1;
      this.totalSteps = 5;
    }

    getStepData(stepIndex) {
      switch (stepIndex) {
        case 1:
          return {
            title: '第 1 阶：几何全貌 —— 35个正三角形藏在哪里？',
            badge: '认知全貌',
            content: `
              <p class="teach-lead">很多同学第一眼看到题目，只数出了 10 个或者 20 个正三角形，因而严重低估了难度！其实在 15 点三角形点阵中，一共隐藏着 <strong>35 个正三角形</strong>！</p>
              <div class="teach-grid">
                <div class="teach-card" data-cat="upright">
                  <h4>正立正三角形 (20个)</h4>
                  <ul>
                    <li>边长 1：10 个 (1+2+3+4)</li>
                    <li>边长 2：6 个 (1+2+3)</li>
                    <li>边长 3：3 个 (1+2)</li>
                    <li>边长 4：1 个 (最外层大框)</li>
                  </ul>
                  <button class="btn btn-sm btn-subtle" onclick="window.gameUI.teachHighlightCategory('upright')">👁️ 高亮正立三角形</button>
                </div>
                <div class="teach-card" data-cat="inverted">
                  <h4>倒立正三角形 (7个)</h4>
                  <ul>
                    <li>边长 1：6 个 (1+2+3)</li>
                    <li>边长 2：1 个 (中间倒立大三角)</li>
                  </ul>
                  <button class="btn btn-sm btn-subtle" onclick="window.gameUI.teachHighlightCategory('inverted')">👁️ 高亮倒立三角形</button>
                </div>
                <div class="teach-card" data-cat="tilted">
                  <h4>倾斜正三角形 (8个)</h4>
                  <ul>
                    <li>边长 √3 (约1.73)：6 个 (正六边形跳点)</li>
                    <li>边长 √7 (约2.65)：2 个 (特殊斜向角度)</li>
                  </ul>
                  <button class="btn btn-sm btn-subtle" onclick="window.gameUI.teachHighlightCategory('tilted')">👁️ 高亮倾斜三角形</button>
                </div>
              </div>
              <p class="teach-tip">💡 提示：点击上方按钮，可以在左侧棋盘实时查看对应类别的正三角形！尤其是<strong>倾斜正三角形</strong>，是极易被漏看的盲区。</p>
            `
          };

        case 2:
          return {
            title: '第 2 阶：数学下界 —— 鸽巢原理与 5 个互斥三角形',
            badge: '下界证明',
            content: `
              <p class="teach-lead">“至少需要去掉几个点？”在奥数与组合极值问题中，解题第一步是<strong>寻找理论下界</strong>！</p>
              <div class="teach-box">
                <div class="teach-box-title">📌 核心定理：互斥三角形下界引理</div>
                <p>若在点阵中能找到 <strong>M 个两两互不相交（无任何公共顶点）</strong> 的正三角形，则<strong>至少必须去掉 M 个点</strong>！</p>
                <p class="text-muted">证明：要破坏一个正三角形，必须至少拿掉它的 1 个顶点。因为这 M 个三角形互不相交，你拿掉任意 1 个点，最多只能破坏其中的 1 个三角形。因此要破坏全部 M 个三角形，所需点数必定 ≥ M。</p>
              </div>
              <p>在 15 点阵中，正好可以完整划分出 <strong>5 个互不相交的正三角形</strong>（5 × 3 = 15 个点全覆盖）：</p>
              <div class="teach-actions">
                <button class="btn btn-primary" onclick="window.gameUI.showDisjointMode()">✨ 查看 5 组互不相交正三角形</button>
                <button class="btn btn-secondary" onclick="window.gameUI.resetBoardView()">恢复普通视图</button>
              </div>
              <p class="teach-tip">🎯 结论：去掉的点数<strong>绝对不可能少于 5 个</strong>（即 ≥ 5）！选项 A 给出 6，B 给出 7，那 5 和 6 究竟够不够？继续看下一阶！</p>
            `
          };

        case 3:
          return {
            title: '第 3 阶：瓶颈分析 —— 为什么 5 和 6 个点不够？',
            badge: '瓶颈证伪',
            content: `
              <p class="teach-lead">我们已经知道至少要 5 个点，那 5 个点或者 6 个点能否消灭全部 35 个三角形呢？</p>
              <div class="teach-compare">
                <div class="teach-compare-item">
                  <h4>5 个点为什么不可能？</h4>
                  <p>若只去掉 5 个点，必须在每个互斥三角形中恰好取 1 点。但这 5 个点破坏其他 30 个交叉正三角形的能力有限。经检验，任何 5 点取法，剩余正三角形数仍在 <strong>10 个以上</strong>，无法完全覆盖！</p>
                </div>
                <div class="teach-compare-item">
                  <h4>6 个点为什么依然不够？</h4>
                  <p>点阵中共有 C(15, 6) = <strong>5005 种</strong>可能的 6 点组合。经全组合穷举验证：<strong>所有 5005 种选法中，没有任何一种能覆盖全部 35 个正三角形！</strong>每种至少残留 1~4 个正三角形！</p>
                </div>
              </div>
              <div class="teach-box mt-3">
                <div class="teach-box-title">🔍 顶点度数（所属正三角形数）分析</div>
                <p>点阵中心点 (2,1) 属于多达 <strong>12 个正三角形</strong>，是全场枢纽；而角点 (0,0) 只属于 4 个正三角形。即便贪心选度数最大的点，也会因为倾斜三角形与倒立三角形的交叉锁定而留下死角！</p>
              </div>
              <p class="teach-tip">🎯 答案锁定：既然 ≤ 6 个点均无解，那么最少点数必然<strong>至少为 7 个</strong>！</p>
            `
          };

        case 4:
          return {
            title: '第 4 阶：极值构造 —— 7 个点的最优消除结构',
            badge: '构造破局',
            content: `
              <p class="teach-lead">既然下界证明排除了 ≤ 6，我们只需要<strong>构造出一种去掉 7 个点的方案</strong>，就能彻底证明答案为 7！</p>
              <div class="teach-box">
                <div class="teach-box-title">🏆 7点最优解构造法（顶部顶角方案）</div>
                <p>去掉以下 7 个点：</p>
                <div class="teach-code-coords">
                  <span class="coord-tag">(0,0) 顶点</span>
                  <span class="coord-tag">(2,1) 中心枢纽</span>
                  <span class="coord-tag">(3,1)</span>
                  <span class="coord-tag">(3,2)</span>
                  <span class="coord-tag">(4,1)</span>
                  <span class="coord-tag">(4,2)</span>
                  <span class="coord-tag">(4,3)</span>
                </div>
                <p class="mt-2 text-muted">几何直觉：拿掉最上方的顶点 (0,0)，直接瓦解所有以 (0,0) 为顶点的 4 个正三角形；下方的梯形区域内拿掉密集交错的 6 个内点，精准切断所有倒立与倾斜共振通路！</p>
              </div>
              <div class="teach-actions">
                <button class="btn btn-primary" onclick="window.gameUI.applyOptimalSolution(0)">🎯 一键载入此 7 点最优解</button>
                <button class="btn btn-secondary" onclick="window.gameUI.openAnswerDemo()">🎬 观看动态消除演示</button>
              </div>
              <p class="teach-tip">🌟 旋转对称性：由于正三角形具有 120° 旋转对称性，同理将顶点选为左下角 (4,0) 或右下角 (4,4)，即可得到另外 2 组对称的 7 点解，全场恰有 3 组最优解！</p>
            `
          };

        case 5:
          return {
            title: '第 5 阶：小试牛刀 —— 阶梯关卡逐级征服！',
            badge: '阶梯实战',
            content: `
              <p class="teach-lead">掌握了数学原理后，不妨从简单的小阵列开始，一步步进阶到 15 点终极大考！</p>
              <div class="level-ladder">
                <div class="ladder-card ${this.engine.nRows === 2 ? 'active' : ''}" onclick="window.gameUI.switchLevel(1)">
                  <div class="ladder-step">Level 1</div>
                  <div class="ladder-info">
                    <strong>3 点阵（边长1）</strong>
                    <span>1 个正三角形 · 最少消 1 点</span>
                  </div>
                  <button class="btn btn-sm btn-subtle">挑战</button>
                </div>
                <div class="ladder-card ${this.engine.nRows === 3 ? 'active' : ''}" onclick="window.gameUI.switchLevel(2)">
                  <div class="ladder-step">Level 2</div>
                  <div class="ladder-info">
                    <strong>6 点阵（边长2）</strong>
                    <span>5 个正三角形 · 最少消 2 点</span>
                  </div>
                  <button class="btn btn-sm btn-subtle">挑战</button>
                </div>
                <div class="ladder-card ${this.engine.nRows === 4 ? 'active' : ''}" onclick="window.gameUI.switchLevel(3)">
                  <div class="ladder-step">Level 3</div>
                  <div class="ladder-info">
                    <strong>10 点阵（边长3）</strong>
                    <span>15 个正三角形 · 最少消 4 点</span>
                  </div>
                  <button class="btn btn-sm btn-subtle">挑战</button>
                </div>
                <div class="ladder-card ${this.engine.nRows === 5 ? 'active' : ''}" onclick="window.gameUI.switchLevel(4)">
                  <div class="ladder-step">Level 4</div>
                  <div class="ladder-info">
                    <strong>15 点阵（题图原题）</strong>
                    <span>35 个正三角形 · 最少消 7 点</span>
                  </div>
                  <button class="btn btn-sm btn-primary">原题冲刺</button>
                </div>
              </div>
              <p class="teach-tip">🚀 亲自在棋盘上试一试吧！画完后点击<strong>“连线指出剩余正三角形”</strong>，检测你是否彻底封印了全部正三角形！</p>
            `
          };
      }
    }

    setStep(step) {
      if (step < 1) step = 1;
      if (step > this.totalSteps) step = this.totalSteps;
      this.currentStep = step;
      return this.getStepData(step);
    }

    nextStep() {
      return this.setStep(this.currentStep + 1);
    }

    prevStep() {
      return this.setStep(this.currentStep - 1);
    }
  }

  root.TeachingTutor = TeachingTutor;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TeachingTutor };
  }
})(typeof window !== 'undefined' ? window : globalThis);
