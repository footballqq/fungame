// codex: 2026-09-23 答案演示播放器模块：支持3组最优解切换、单步前进后退、自动播放与分步原理解说
(function(root) {
  'use strict';

  class AnswerDemoPlayer {
    constructor(engine, canvas, audio, onStepChange) {
      this.engine = engine;
      this.canvas = canvas;
      this.audio = audio;
      this.onStepChange = onStepChange;

      this.solutionIndex = 0;
      this.currentStep = 0;
      this.isPlaying = false;
      this.timer = null;
      this.speedMs = 850;
    }

    getCurrentSolution() {
      const sols = this.engine.optimalSolutions;
      return (sols && sols[this.solutionIndex]) || [];
    }

    setSolutionIndex(idx) {
      const sols = this.engine.optimalSolutions;
      if (idx >= 0 && idx < sols.length) {
        this.stop();
        this.solutionIndex = idx;
        this.currentStep = 0;
        this._applyStep();
      }
    }

    open() {
      this.stop();
      this.currentStep = 0;
      this.solutionIndex = 0;
      const panel = document.getElementById('demoDockPanel');
      if (panel) {
        panel.style.display = 'flex';
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const sel = document.getElementById('demoSolSelect');
      if (sel) sel.value = '0';
      this._applyStep();
    }

    close() {
      this.stop();
      const panel = document.getElementById('demoDockPanel');
      if (panel) panel.style.display = 'none';
      this.engine.clearRemoved();
      if (typeof this.onStepChange === 'function') {
        this.onStepChange();
      }
    }

    step(delta) {
      const sol = this.getCurrentSolution();
      let nextStep = this.currentStep + delta;
      if (nextStep < 0) nextStep = 0;
      if (nextStep > sol.length) nextStep = sol.length;

      this.currentStep = nextStep;
      if (this.audio) this.audio.playTap();
      this._applyStep();
    }

    togglePlay() {
      if (this.isPlaying) {
        this.stop();
      } else {
        this.play();
      }
    }

    play() {
      const sol = this.getCurrentSolution();
      if (this.currentStep >= sol.length) {
        this.currentStep = 0;
      }
      this.isPlaying = true;

      const playBtn = document.getElementById('btnDemoPlay');
      if (playBtn) playBtn.textContent = '⏸️ 暂停演示';

      this.timer = setInterval(() => {
        if (this.currentStep < sol.length) {
          this.step(1);
        } else {
          this.stop();
          if (this.audio) this.audio.playWin();
        }
      }, this.speedMs);
    }

    stop() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.isPlaying = false;
      const playBtn = document.getElementById('btnDemoPlay');
      if (playBtn) playBtn.textContent = '▶️ 自动播放';
    }

    _applyStep() {
      const sol = this.getCurrentSolution();
      const activePts = sol.slice(0, this.currentStep);
      this.engine.setRemovedPoints(activePts);

      if (this.currentStep > 0 && this.canvas) {
        const lastPtId = sol[this.currentStep - 1];
        const sc = this.canvas.pointScreenCoords[lastPtId];
        if (sc) {
          this.canvas._spawnParticles(sc.x, sc.y, '#38bdf8');
        }
        if (this.audio) this.audio.playRemove();
      }


      const stepTextEl = document.getElementById('demoStepText');
      const progressEl = document.getElementById('demoProgressBar');
      const explanationEl = document.getElementById('demoExplanation');

      if (stepTextEl) {
        stepTextEl.textContent = `第 ${this.currentStep} / ${sol.length} 步`;
      }
      if (progressEl) {
        progressEl.style.width = `${(this.currentStep / Math.max(1, sol.length)) * 100}%`;
      }

      if (explanationEl) {
        if (this.currentStep === 0) {
          explanationEl.innerHTML = `<strong>初始状态：</strong> 共有 ${this.engine.triangles.length} 个正三角形处于共鸣状态。准备执行 7 点最优破局！`;
        } else {
          const ptId = sol[this.currentStep - 1];
          const pt = this.engine.points[ptId];
          const rem = this.engine.getRemainingTriangles().length;
          const cornerNames = ['顶部顶角方案 (0,0)', '左下角对称方案 (4,0)', '右下角对称方案 (4,4)'];
          const solLabel = cornerNames[this.solutionIndex] || `方案 ${this.solutionIndex + 1}`;

          explanationEl.innerHTML = `
            <div><strong>【${solLabel}】</strong></div>
            <div>第 ${this.currentStep} 步：熄灭星石 <strong>(${pt.row},${pt.col})</strong>，剩余正三角形减少至 <strong>${rem} 个</strong>！</div>
          `;
        }
      }

      if (typeof this.onStepChange === 'function') {
        this.onStepChange();
      }
    }
  }

  root.AnswerDemoPlayer = AnswerDemoPlayer;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnswerDemoPlayer };
  }
})(typeof window !== 'undefined' ? window : globalThis);
