/**
 * 海淀信息学竞赛第二赛段（计算思维挑战赛）· 核心基石模块
 * 负责第二赛段学习进度持久化、全局导航状态、通用随堂测验交互与 LocalStorage 本地存取
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
      console.warn('读取本地 LocalStorage 进度失败:', e);
      return { completedModules: [], solvedQuizzes: {} };
    }
  },

  saveQuizResult(quizId, isCorrect, userChoice = null) {
    const p = this.getProgress();
    if (!p.solvedQuizzes) p.solvedQuizzes = {};
    p.solvedQuizzes[quizId] = {
      isCorrect,
      userChoice,
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
    const p = this.getProgress();
    const solved = p.solvedQuizzes || {};
    const quizBlocks = document.querySelectorAll('.quiz-block');

    quizBlocks.forEach(block => {
      const quizId = block.dataset.quizId;
      const correctOpt = block.dataset.correct;
      const options = block.querySelectorAll('.quiz-option');
      const exp = block.querySelector('.quiz-explanation');
      const fillInput = block.querySelector('.fill-input');
      const fillBtn = block.querySelector('.btn-check-fill');

      // 1. 优先从 LocalStorage 回显历史作答数据
      if (quizId && solved[quizId]) {
        const record = solved[quizId];
        
        // 单选题历史回显
        if (options.length > 0 && record.userChoice) {
          const userOpt = block.querySelector(`.quiz-option[data-key="${record.userChoice}"]`);
          if (userOpt) {
            if (record.isCorrect) {
              userOpt.classList.add('correct');
            } else {
              userOpt.classList.add('wrong');
              const targetCorrect = block.querySelector(`.quiz-option[data-key="${correctOpt}"]`);
              if (targetCorrect) targetCorrect.classList.add('correct');
            }
          }
          if (exp) {
            exp.classList.add('show');
            const statusEl = exp.querySelector('.exp-status');
            if (statusEl) {
              statusEl.className = record.isCorrect ? 'exp-status success' : 'exp-status fail';
              statusEl.innerHTML = record.isCorrect 
                ? '🎉 <b>[本地记录已调出]</b> 太棒了，曾作答完全正确！' 
                : `💡 <b>[本地记录已调出]</b> 历史选（${record.userChoice}），正确答案是：<b>${correctOpt}</b>。看下方精析：`;
            }
          }
        }

        // 填空题历史回显
        if (fillInput && record.userChoice !== undefined && record.userChoice !== null) {
          fillInput.value = record.userChoice;
          if (record.isCorrect) {
            fillInput.style.borderColor = 'var(--color-green)';
            fillInput.style.backgroundColor = 'var(--color-green-soft)';
            if (exp) {
              exp.classList.add('show');
              const statusEl = exp.querySelector('.exp-status');
              if (statusEl) {
                statusEl.className = 'exp-status success';
                statusEl.innerHTML = '🎉 <b>[本地记录已调出]</b> 填空曾作答完全正确！';
              }
            }
          } else {
            fillInput.style.borderColor = 'var(--color-accent)';
            fillInput.style.backgroundColor = '#FEE2E2';
            if (exp) {
              exp.classList.add('show');
              const statusEl = exp.querySelector('.exp-status');
              if (statusEl) {
                statusEl.className = 'exp-status fail';
                statusEl.innerHTML = `💡 <b>[本地记录已调出]</b> 历史填入“${record.userChoice}”，正确答案是：<b>${correctOpt}</b>。`;
              }
            }
          }
        }
      }

      // 2. 绑定单选题交互
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
                statusEl.innerHTML = '🎉 太棒了，计算思维极其敏锐，完全正确！(已自动同步至本地)';
              }
            }
            HoiCoreStage2.saveQuizResult(quizId, true, selectedKey);
          } else {
            opt.classList.add('wrong');
            const targetCorrect = block.querySelector(`.quiz-option[data-key="${correctOpt}"]`);
            if (targetCorrect) targetCorrect.classList.add('correct');
            
            if (exp) {
              exp.classList.add('show');
              const statusEl = exp.querySelector('.exp-status');
              if (statusEl) {
                statusEl.className = 'exp-status fail';
                statusEl.innerHTML = `💡 思考提示：正确答案是 <b>${correctOpt}</b>，再仔细推导一下下面的核心要点哦：(已自动同步至本地)`;
              }
            }
            HoiCoreStage2.saveQuizResult(quizId, false, selectedKey);
          }
        });
      });

      // 3. 绑定填空题交互
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
                statusEl.innerHTML = '🎉 填空回答完全正确！(已自动同步至本地)';
              }
            }
            HoiCoreStage2.saveQuizResult(quizId, true, val);
          } else {
            fillInput.style.borderColor = 'var(--color-accent)';
            fillInput.style.backgroundColor = '#FEE2E2';
            if (exp) {
              exp.classList.add('show');
              const statusEl = exp.querySelector('.exp-status');
              if (statusEl) {
                statusEl.className = 'exp-status fail';
                statusEl.innerHTML = `💡 正确答案是：<b>${target}</b>。请看下方详细推导：(已自动同步至本地)`;
              }
            }
            HoiCoreStage2.saveQuizResult(quizId, false, val);
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
      badge.textContent = `已攻克 ${count} 题 (本地已存档)`;
    }
  },

  // 清空本模块做题历史方便复练
  clearModuleQuizzes(modulePrefix) {
    if (!confirm('确定要清空该模块的随堂测验本地作答记录，重新开始练习吗？')) return;
    const p = this.getProgress();
    if (p.solvedQuizzes) {
      for (const k in p.solvedQuizzes) {
        if (!modulePrefix || k.startsWith(modulePrefix)) {
          delete p.solvedQuizzes[k];
        }
      }
      try {
        localStorage.setItem(this.STORAGE_KEY_PROGRESS, JSON.stringify(p));
      } catch (e) {
        console.warn(e);
      }
    }
    location.reload();
  },

  bindGlobalEvents() {}
};

if (typeof window !== 'undefined') window.HoiCoreStage2 = HoiCoreStage2;
if (typeof global !== 'undefined') global.HoiCoreStage2 = HoiCoreStage2;

document.addEventListener('DOMContentLoaded', () => {
  HoiCoreStage2.init();
});
