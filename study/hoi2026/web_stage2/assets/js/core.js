/**
 * 海淀信息学竞赛第二赛段（计算思维挑战赛）· 核心基石模块
 * 负责第二赛段学习进度持久化、全局导航状态、通用随堂测验交互
 */

const HoiCoreStage2 = {
  STORAGE_KEY_PROGRESS: 'hoi2026_stage2_progress',
  STORAGE_KEY_EXAM: 'hoi2026_stage2_exam_history',

  init() {
    this.bindGlobalEvents();
    this.initCheckpoints();
    this.updateProgressBadges();
  },

  getProgress() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_PROGRESS);
      return data ? JSON.parse(data) : { completedModules: [], solvedQuizzes: {} };
    } catch (e) {
      return { completedModules: [], solvedQuizzes: {} };
    }
  },

  saveQuizResult(quizId, isCorrect) {
    const p = this.getProgress();
    p.solvedQuizzes[quizId] = {
      isCorrect,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(this.STORAGE_KEY_PROGRESS, JSON.stringify(p));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.updateProgressBadges();
  },

  initCheckpoints() {
    const quizBlocks = document.querySelectorAll('.quiz-block');
    quizBlocks.forEach(block => {
      const quizId = block.dataset.quizId;
      const correctOpt = block.dataset.correct;
      const options = block.querySelectorAll('.quiz-option');
      const exp = block.querySelector('.quiz-explanation');

      // 单选题逻辑
      options.forEach(opt => {
        opt.addEventListener('click', () => {
          const selectedKey = opt.dataset.key;
          const isCorrect = (selectedKey === correctOpt);

          options.forEach(o => o.classList.remove('correct', 'wrong'));

          if (isCorrect) {
            opt.classList.add('correct');
            if (exp) {
              exp.classList.add('show');
              const statusEl = exp.querySelector('.exp-status');
              if (statusEl) {
                statusEl.className = 'exp-status success';
                statusEl.innerHTML = '🎉 太棒了，计算思维极其敏锐，完全正确！';
              }
            }
            HoiCoreStage2.saveQuizResult(quizId, true);
          } else {
            opt.classList.add('wrong');
            const targetCorrect = block.querySelector(`.quiz-option[data-key="${correctOpt}"]`);
            if (targetCorrect) targetCorrect.classList.add('correct');
            
            if (exp) {
              exp.classList.add('show');
              const statusEl = exp.querySelector('.exp-status');
              if (statusEl) {
                statusEl.className = 'exp-status fail';
                statusEl.innerHTML = '💡 思考提示：再仔细推导一下下面的核心要点哦：';
              }
            }
            HoiCoreStage2.saveQuizResult(quizId, false);
          }
        });
      });

      // 填空题逻辑（如有）
      const fillBtn = block.querySelector('.btn-check-fill');
      const fillInput = block.querySelector('.fill-input');
      if (fillBtn && fillInput) {
        fillBtn.addEventListener('click', () => {
          const val = fillInput.value.trim();
          const target = block.dataset.correct.trim();
          const isCorrect = (val === target);

          if (isCorrect) {
            fillInput.style.borderColor = 'var(--color-green)';
            fillInput.style.backgroundColor = 'var(--color-green-soft)';
            if (exp) {
              exp.classList.add('show');
              const statusEl = exp.querySelector('.exp-status');
              if (statusEl) {
                statusEl.className = 'exp-status success';
                statusEl.innerHTML = '🎉 填空回答完全正确！';
              }
            }
            HoiCoreStage2.saveQuizResult(quizId, true);
          } else {
            fillInput.style.borderColor = 'var(--color-accent)';
            fillInput.style.backgroundColor = '#FEE2E2';
            if (exp) {
              exp.classList.add('show');
              const statusEl = exp.querySelector('.exp-status');
              if (statusEl) {
                statusEl.className = 'exp-status fail';
                statusEl.innerHTML = `💡 正确答案是：<b>${target}</b>。请看下方详细推导：`;
              }
            }
            HoiCoreStage2.saveQuizResult(quizId, false);
          }
        });
      }
    });
  },

  updateProgressBadges() {
    const p = this.getProgress();
    const count = Object.values(p.solvedQuizzes || {}).filter(q => q.isCorrect).length;
    const badge = document.getElementById('global-quiz-counter-stage2');
    if (badge) {
      badge.textContent = `已攻克 ${count} 题`;
    }
  },

  bindGlobalEvents() {}
};

document.addEventListener('DOMContentLoaded', () => {
  HoiCoreStage2.init();
});
