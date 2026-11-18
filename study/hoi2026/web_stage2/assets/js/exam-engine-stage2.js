/**
 * 2026海淀第二赛段 · 120分钟全真机考与五维雷达诊断引擎
 * 严格遵循规范：无任何 raw $...$ LaTeX 符号，原生 Canvas 绘制雷达图
 * 具备完善的 LocalStorage 实时持久化、交卷归档、历史作答随取随看与档案导出功能
 */

class Stage2ExamEngine {
  constructor(config = {}) {
    this.paperKey = config.paperKey || 'exam';
    this.totalSeconds = config.totalMinutes ? config.totalMinutes * 60 : 120 * 60; // 120分钟
    this.remainingSeconds = this.totalSeconds;
    this.timerInterval = null;
    this.isPaused = false;
    this.isSubmitted = false;

    this.lastSubmittedScore = null;
    this.lastSubmittedAt = null;
    this.lastResults = null;

    this.questions = (window.STAGE2_QUIZ_DATA && window.STAGE2_QUIZ_DATA[this.paperKey]) ? window.STAGE2_QUIZ_DATA[this.paperKey] : [];
    this.currentIndex = 0;
    this.userAnswers = {}; // { questionId: answerIndex or fillText }
    this.markedQuestions = new Set(); // Set of questionIds
    
    this.dimensions = {
      math: { name: '数学逻辑与离散', total: 0, score: 0 },
      algorithm: { name: '初等算法与贪心', total: 0, score: 0 },
      recursion: { name: '递归思想与递推', total: 0, score: 0 },
      datastruct: { name: '数据结构进阶', total: 0, score: 0 },
      complexity: { name: '代码分析与复杂度', total: 0, score: 0 }
    };

    this.init();
  }

  init() {
    this.loadState();
    this.calculateDimensionTotals();
    this.renderPalette();
    this.renderQuestion(this.currentIndex);
    this.updateExamStickyBar();

    if (!this.isSubmitted) {
      this.startTimer();
    }

    this.bindGlobalEvents();
    this.updatePaperTabsUI();
  }

  updatePaperTabsUI() {
    document.querySelectorAll('.paper-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.paper === this.paperKey);
    });
  }

  calculateDimensionTotals() {
    for (const k in this.dimensions) {
      this.dimensions[k].total = 0;
      this.dimensions[k].score = 0;
    }
    this.questions.forEach(q => {
      const dim = q.dimension || 'math';
      if (this.dimensions[dim]) {
        this.dimensions[dim].total += q.score;
      }
    });
  }

  loadState() {
    const storageKey = `stage2_exam_progress_${this.paperKey}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.userAnswers = data.answers || {};
        this.remainingSeconds = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : this.totalSeconds;
        this.currentIndex = typeof data.currentIndex === 'number' ? data.currentIndex : 0;
        if (data.marked) this.markedQuestions = new Set(data.marked);
        
        if (data.isSubmitted) {
          this.isSubmitted = true;
          this.lastSubmittedScore = typeof data.totalScore === 'number' ? data.totalScore : null;
          this.lastSubmittedAt = data.submittedAt || null;
          this.lastResults = Array.isArray(data.results) ? data.results : null;

          if (data.dimensionScores) {
            for (const d in data.dimensionScores) {
              if (this.dimensions[d]) {
                this.dimensions[d].score = data.dimensionScores[d];
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('读取既往 LocalStorage 考试记录失败，已重置', e);
    }
  }

  saveState() {
    const storageKey = `stage2_exam_progress_${this.paperKey}`;
    try {
      const data = {
        paperKey: this.paperKey,
        answers: this.userAnswers,
        remainingSeconds: this.remainingSeconds,
        currentIndex: this.currentIndex,
        marked: Array.from(this.markedQuestions),
        isSubmitted: this.isSubmitted,
        submittedAt: this.lastSubmittedAt,
        totalScore: this.lastSubmittedScore,
        results: this.lastResults,
        dimensionScores: Object.keys(this.dimensions).reduce((acc, k) => {
          acc[k] = this.dimensions[k].score;
          return acc;
        }, {}),
        updatedAt: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('保存考试进度至 LocalStorage 失败', e);
    }
  }

  getResults() {
    if (this.lastResults && Array.isArray(this.lastResults) && this.lastResults.length === this.questions.length) {
      return this.lastResults;
    }

    const results = [];
    let calculatedTotal = 0;

    // 重置并重算各维度得分
    Object.keys(this.dimensions).forEach(k => {
      this.dimensions[k].score = 0;
    });

    this.questions.forEach(q => {
      const userAns = this.userAnswers[q.id];
      let isCorrect = false;

      if (q.type === 'choice') {
        isCorrect = (userAns === q.answer);
      } else if (q.type === 'fill') {
        if (q.matchRegex) {
          const reg = new RegExp(q.matchRegex, 'i');
          isCorrect = reg.test(String(userAns || '').trim());
        } else {
          isCorrect = String(userAns || '').trim() === String(q.answer).trim();
        }
      }

      const earned = isCorrect ? q.score : 0;
      calculatedTotal += earned;

      const dim = q.dimension || 'math';
      if (this.dimensions[dim]) {
        this.dimensions[dim].score += earned;
      }

      results.push({
        ...q,
        userAns: userAns,
        isCorrect: isCorrect,
        earned: earned
      });
    });

    if (this.lastSubmittedScore === null) {
      this.lastSubmittedScore = calculatedTotal;
    }
    this.lastResults = results;
    return results;
  }

  startTimer() {
    if (this.isSubmitted) return;
    this.updateTimerDisplay();
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (!this.isPaused && this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.updateTimerDisplay();
        if (this.remainingSeconds % 10 === 0) {
          this.saveState();
        }
        if (this.remainingSeconds <= 0) {
          clearInterval(this.timerInterval);
          alert('⏰ 考试时间到！系统正在自动为您提交并生成五维诊断报告。');
          this.submitExam();
        }
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('examTimer');
    if (!timerEl) return;
    const hours = Math.floor(this.remainingSeconds / 3600);
    const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
    const seconds = this.remainingSeconds % 60;
    timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // 时间不足15分钟警示
    if (this.remainingSeconds < 15 * 60) {
      timerEl.classList.add('urgent');
    } else {
      timerEl.classList.remove('urgent');
    }
  }

  updateExamStickyBar() {
    const timerLabel = document.getElementById('timerLabel');
    const timerEl = document.getElementById('examTimer');
    const summaryEl = document.getElementById('examProgressSummary');
    const barActions = document.getElementById('examBarActions');

    if (this.isSubmitted) {
      if (timerLabel) timerLabel.textContent = '考试状态：';
      if (timerEl) {
        timerEl.textContent = '已完成交卷';
        timerEl.classList.remove('urgent');
      }
      if (summaryEl) {
        const timeStr = this.lastSubmittedAt ? new Date(this.lastSubmittedAt).toLocaleTimeString() : '';
        summaryEl.innerHTML = `
          <span class="badge-submitted">
            🏆 得分：<b style="color:var(--color-primary);font-size:1.15rem;">${this.lastSubmittedScore !== null ? this.lastSubmittedScore : '--'}</b> / 100 分
            ${timeStr ? `（于 ${timeStr} 提交存档）` : '（本地存档已载入）'}
          </span>
        `;
      }
      if (barActions) {
        barActions.innerHTML = `
          <button type="button" class="btn btn-secondary btn-sm" id="btnResetExam">🔄 重新测试本卷</button>
          <button type="button" class="btn btn-outline-info btn-sm" id="btnOpenArchive">💾 本地做题档案</button>
          <button type="button" class="btn btn-primary btn-sm" id="btnViewReport">📊 调出成绩诊断报告</button>
        `;
      }
    } else {
      if (timerLabel) timerLabel.textContent = '考试倒计时：';
      this.updateTimerDisplay();
      this.updateProgressSummary();
      if (barActions) {
        barActions.innerHTML = `
          <button type="button" class="btn btn-secondary btn-sm" id="btnResetExam">清空重做</button>
          <button type="button" class="btn btn-outline-info btn-sm" id="btnOpenArchive">💾 本地做题档案</button>
          <button type="button" class="btn btn-primary btn-sm" id="btnSubmitExam">交卷并生成诊断</button>
        `;
      }
    }

    this.bindStickyBarEvents();
  }

  bindStickyBarEvents() {
    const btnSubmit = document.getElementById('btnSubmitExam');
    if (btnSubmit) {
      btnSubmit.onclick = () => this.promptSubmit();
    }

    const btnViewReport = document.getElementById('btnViewReport');
    if (btnViewReport) {
      btnViewReport.onclick = () => {
        const results = this.getResults();
        this.showReportModal(this.lastSubmittedScore, results);
      };
    }

    const btnOpenArchive = document.getElementById('btnOpenArchive');
    if (btnOpenArchive) {
      btnOpenArchive.onclick = () => this.openArchiveModal();
    }

    const btnReset = document.getElementById('btnResetExam');
    if (btnReset) {
      btnReset.onclick = () => {
        const paperName = this.paperKey === 'exam' ? '【A 卷】2025 全真真题' : '【B 卷】2026 原创预测';
        if (confirm(`确定要清空当前 ${paperName} 的全部作答记录重新开始吗？\n（注：清空后将重置为全新的 120 分钟作答）`)) {
          localStorage.removeItem(`stage2_exam_progress_${this.paperKey}`);
          location.reload();
        }
      };
    }
  }

  renderPalette() {
    const paletteEl = document.getElementById('questionPalette');
    if (!paletteEl) return;
    paletteEl.innerHTML = '';

    const results = this.isSubmitted ? this.getResults() : null;

    this.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-btn';
      btn.textContent = q.num;
      btn.dataset.index = idx;

      if (idx === this.currentIndex) {
        btn.classList.add('active');
      }

      if (this.isSubmitted && results) {
        const res = results[idx];
        if (res.isCorrect) {
          btn.classList.add('is-correct');
          btn.title = `第 ${q.num} 题：作答正确 (+${q.score}分)`;
        } else if (res.userAns !== undefined && res.userAns !== '') {
          btn.classList.add('is-wrong');
          btn.title = `第 ${q.num} 题：作答错误 (0分)`;
        } else {
          btn.classList.add('is-unanswered');
          btn.title = `第 ${q.num} 题：未作答 (0分)`;
        }
      } else {
        const hasAnswer = this.userAnswers[q.id] !== undefined && this.userAnswers[q.id] !== '';
        if (hasAnswer) {
          btn.classList.add('answered');
        }
        if (this.markedQuestions.has(q.id)) {
          btn.classList.add('marked');
        }
      }

      btn.addEventListener('click', () => {
        this.goToQuestion(idx);
      });

      paletteEl.appendChild(btn);
    });

    this.updateProgressSummary();
  }

  updateProgressSummary() {
    if (this.isSubmitted) return;
    const answeredCount = Object.keys(this.userAnswers).filter(k => this.userAnswers[k] !== undefined && this.userAnswers[k] !== '').length;
    const summaryEl = document.getElementById('examProgressSummary');
    if (summaryEl) {
      summaryEl.textContent = `已作答 ${answeredCount} / ${this.questions.length} 题 (本地已实时暂存)`;
    }
  }

  renderQuestion(index) {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
    const q = this.questions[index];
    const container = document.getElementById('questionContentArea');
    if (!container) return;

    const isMarked = this.markedQuestions.has(q.id);
    const currentAns = this.userAnswers[q.id];

    // 复盘模式判断该题结果
    let isCorrect = false;
    if (this.isSubmitted) {
      if (q.type === 'choice') {
        isCorrect = (currentAns === q.answer);
      } else if (q.type === 'fill') {
        if (q.matchRegex) {
          isCorrect = new RegExp(q.matchRegex, 'i').test(String(currentAns || '').trim());
        } else {
          isCorrect = String(currentAns || '').trim() === String(q.answer).trim();
        }
      }
    }

    let html = `
      <div class="exam-q-header">
        <div class="q-badge-group">
          <span class="exam-q-num">第 ${q.num} 题</span>
          <span class="exam-q-dim">${this.getDimensionName(q.dimension)}</span>
          <span class="exam-q-score">${q.score} 分</span>
          ${this.isSubmitted ? `
            <span class="review-status-tag ${isCorrect ? 'tag-correct' : 'tag-wrong'}">
              ${isCorrect ? '✓ 本题回答正确 (+4分)' : '✕ 本题回答失误 (0分)'}
            </span>
          ` : ''}
        </div>
        ${!this.isSubmitted ? `
          <button type="button" class="btn-mark ${isMarked ? 'active' : ''}" id="btnMarkToggle">
            ${isMarked ? '★ 已标记待复查' : '☆ 标记待复查'}
          </button>
        ` : `
          <span style="font-size:0.88rem;color:var(--ink-muted);">📖 复盘讲评模式</span>
        `}
      </div>

      <div class="exam-q-title">${q.title}</div>
      <div class="exam-q-body">${this.formatCodeAndText(q.question)}</div>
    `;

    if (q.type === 'choice') {
      html += `<div class="exam-options-list">`;
      q.options.forEach((opt, optIdx) => {
        const isChecked = currentAns === optIdx;
        let optExtraClass = '';
        if (this.isSubmitted) {
          if (optIdx === q.answer) {
            optExtraClass += ' is-correct-target';
          }
          if (isChecked && !isCorrect) {
            optExtraClass += ' is-user-wrong';
          }
        } else if (isChecked) {
          optExtraClass += ' selected';
        }

        html += `
          <label class="exam-option-item ${optExtraClass}">
            <input type="radio" name="opt_${q.id}" value="${optIdx}" ${isChecked ? 'checked' : ''} ${this.isSubmitted ? 'disabled' : ''}>
            <span class="opt-label">${opt}</span>
            ${this.isSubmitted && optIdx === q.answer ? '<b style="color:var(--color-green);margin-left:auto;">[标准答案]</b>' : ''}
            ${this.isSubmitted && isChecked && !isCorrect ? '<b style="color:var(--color-accent);margin-left:auto;">[您的选择]</b>' : ''}
          </label>
        `;
      });
      html += `</div>`;
    } else if (q.type === 'fill') {
      html += `
        <div class="exam-fill-area">
          <label>请输入最终计算数值答案：</label>
          <input type="text" class="exam-fill-input" id="inputFill_${q.id}" 
            value="${currentAns !== undefined ? currentAns : ''}" 
            placeholder="例如：150 或 56" 
            autocomplete="off"
            ${this.isSubmitted ? 'disabled' : ''}
            style="${this.isSubmitted ? (isCorrect ? 'border-color:var(--color-green);background-color:var(--color-green-soft);' : 'border-color:var(--color-accent);background-color:#FEE2E2;') : ''}">
          
          ${this.isSubmitted ? `
            <div class="fill-result-badge ${isCorrect ? 'text-green' : 'text-red'}">
              ${isCorrect ? '🎉 填空完全正确！' : `💡 标准答案：<b>${q.answer}</b>（您的输入：<b>${currentAns !== undefined && currentAns !== '' ? currentAns : '未作答'}</b>）`}
            </div>
          ` : ''}
        </div>
      `;
    }

    // 在复盘模式下，直接在题目卡片下方展开超详细精析
    if (this.isSubmitted) {
      html += `
        <div class="exam-review-box">
          <div class="review-header">
            <span class="review-status-tag ${isCorrect ? 'tag-correct' : 'tag-wrong'}">
              ${isCorrect ? '✓ 恭喜答对' : '✕ 错题精析'}
            </span>
            <strong>考点深度精析与算法验算：</strong>
          </div>
          <div class="review-body">${this.formatCodeAndText(q.explanation)}</div>
        </div>
      `;
    }

    html += `
      <div class="exam-q-footer">
        <button type="button" class="btn btn-secondary" id="btnPrevQ" ${index === 0 ? 'disabled' : ''}>← 上一题</button>
        <div class="footer-status">第 ${index + 1} / ${this.questions.length} 题</div>
        <button type="button" class="btn btn-primary" id="btnNextQ">
          ${index === this.questions.length - 1 ? (this.isSubmitted ? '📊 调出诊断报告' : '检查并提交') : '下一题 →'}
        </button>
      </div>
    `;

    container.innerHTML = html;

    // 绑定该题事件
    this.bindQuestionEvents(q);
    this.renderPalette();
  }

  bindQuestionEvents(q) {
    if (!this.isSubmitted) {
      // 选项点击
      if (q.type === 'choice') {
        const radios = document.querySelectorAll(`input[name="opt_${q.id}"]`);
        radios.forEach(r => {
          r.addEventListener('change', (e) => {
            this.userAnswers[q.id] = parseInt(e.target.value, 10);
            this.saveState();
            this.renderPalette();
            document.querySelectorAll('.exam-option-item').forEach(el => el.classList.remove('selected'));
            e.target.closest('.exam-option-item').classList.add('selected');
          });
        });
      } else if (q.type === 'fill') {
        const input = document.getElementById(`inputFill_${q.id}`);
        if (input) {
          input.addEventListener('input', (e) => {
            this.userAnswers[q.id] = e.target.value.trim();
            this.saveState();
            this.renderPalette();
          });
        }
      }

      // 标记按钮
      const btnMark = document.getElementById('btnMarkToggle');
      if (btnMark) {
        btnMark.addEventListener('click', () => {
          if (this.markedQuestions.has(q.id)) {
            this.markedQuestions.delete(q.id);
          } else {
            this.markedQuestions.add(q.id);
          }
          this.saveState();
          this.renderQuestion(this.currentIndex);
        });
      }
    }

    // 上一题 / 下一题
    const btnPrev = document.getElementById('btnPrevQ');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.currentIndex > 0) this.goToQuestion(this.currentIndex - 1);
      });
    }

    const btnNext = document.getElementById('btnNextQ');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.currentIndex < this.questions.length - 1) {
          this.goToQuestion(this.currentIndex + 1);
        } else {
          if (this.isSubmitted) {
            this.showReportModal(this.lastSubmittedScore, this.getResults());
          } else {
            this.promptSubmit();
          }
        }
      });
    }
  }

  goToQuestion(idx) {
    this.currentIndex = idx;
    this.saveState();
    this.renderQuestion(idx);
  }

  bindGlobalEvents() {
    this.bindStickyBarEvents();

    // 绑定 A / B 卷选项卡切换
    document.querySelectorAll('.paper-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pKey = btn.dataset.paper;
        if (pKey && pKey !== this.paperKey) {
          const currentCount = Object.keys(this.userAnswers).length;
          if (!this.isSubmitted && currentCount > 0) {
            const curName = this.paperKey === 'exam' ? 'A 卷' : 'B 卷';
            const targetName = pKey === 'exam' ? 'A 卷' : 'B 卷';
            if (!confirm(`您在【${curName}】中已作答 ${currentCount} 题，切换到【${targetName}】将自动暂存当前作答状态至 LocalStorage。确定切换试卷吗？`)) {
              return;
            }
          }
          this.switchPaper(pKey);
        }
      });
    });

    // 绑定本地档案弹窗关闭
    const btnCloseArchive = document.getElementById('btnCloseArchive');
    const archiveModal = document.getElementById('examArchiveModal');
    if (btnCloseArchive && archiveModal) {
      btnCloseArchive.onclick = () => {
        archiveModal.classList.remove('show');
      };
    }
  }

  switchPaper(paperKey) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.saveState();

    this.paperKey = paperKey;
    this.questions = (window.STAGE2_QUIZ_DATA && window.STAGE2_QUIZ_DATA[this.paperKey]) ? window.STAGE2_QUIZ_DATA[this.paperKey] : [];
    this.remainingSeconds = this.totalSeconds;
    this.userAnswers = {};
    this.markedQuestions = new Set();
    this.isSubmitted = false;
    this.currentIndex = 0;
    this.lastSubmittedScore = null;
    this.lastSubmittedAt = null;
    this.lastResults = null;

    const reportModal = document.getElementById('examReportModal');
    if (reportModal) reportModal.classList.remove('show');

    const archiveModal = document.getElementById('examArchiveModal');
    if (archiveModal) archiveModal.classList.remove('show');

    this.init();
  }

  promptSubmit() {
    const answeredCount = Object.keys(this.userAnswers).filter(k => this.userAnswers[k] !== undefined && this.userAnswers[k] !== '').length;
    const totalCount = this.questions.length;
    const unAnswered = totalCount - answeredCount;

    let msg = `当前共 ${totalCount} 题，您已作答 ${answeredCount} 题。`;
    if (unAnswered > 0) {
      msg += `\n尚有 ${unAnswered} 道题目未作答！确定要现在交卷吗？`;
    } else {
      msg += `\n所有题目已全部作答完毕，确定提交试卷吗？`;
    }

    if (confirm(msg)) {
      this.submitExam();
    }
  }

  submitExam() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isSubmitted = true;
    this.lastSubmittedAt = Date.now();

    // 统计各维度得分与结果清单
    const results = this.getResults();

    this.saveState();
    this.updateExamStickyBar();
    this.renderPalette();
    this.renderQuestion(this.currentIndex);
    this.showReportModal(this.lastSubmittedScore, results);
  }

  showReportModal(totalScore, results) {
    const modal = document.getElementById('examReportModal');
    if (!modal) return;
    modal.classList.add('show');

    // 填充总分与评语
    const scoreValEl = document.getElementById('reportTotalScore');
    if (scoreValEl) scoreValEl.textContent = totalScore !== null ? totalScore : 0;

    const rankTierEl = document.getElementById('reportRankTier');
    const commentEl = document.getElementById('reportComment');

    let tier = '';
    let comment = '';
    if (totalScore >= 90) {
      tier = '卓越级 · 区一等奖种子选手 🏆';
      comment = '表现惊艳！在极其烧脑的离散计数、环形模拟与组合递推中展现了卓越的洞察力，已完全具备海淀区初赛第一梯队实力！建议重点保持代码书写精益与复杂递推防错。';
    } else if (totalScore >= 75) {
      tier = '优秀级 · 进阶高手 🌟';
      comment = '思维敏捷，算法与数据结构功底扎实！仅在个别具有迷惑性的单调栈删数或高阶鸽巢计数中稍有偏差。针对薄弱维度专项巩固后，冲刺区一等奖极有希望！';
    } else if (totalScore >= 60) {
      tier = '良好级 · 稳步达标 🚀';
      comment = '核心知识框架已完整建立，基础概念清晰！但在递归调用栈空间估算、大数滑动窗口与贪心反证法上还需加大训练深度，建议回看对应模块精讲。';
    } else {
      tier = '潜能级 · 夯实基础 📖';
      comment = '展现了很棒的探索意愿！建议先从《四大核心知识模块》与《递归专项突破》的交互式沙盒练起，反复观察汉诺塔与二维矩阵映射，打牢地基后再战！';
    }

    if (rankTierEl) rankTierEl.textContent = tier;
    if (commentEl) commentEl.textContent = comment;

    // 绘制五维雷达图
    this.drawRadarChart();

    // 渲染薄弱维度及学习建议
    this.renderPrescription();

    // 渲染逐题详细解析
    this.renderReviewList(results);

    // 绑定模态框关闭
    const btnClose = document.getElementById('btnCloseReport');
    if (btnClose) {
      btnClose.onclick = () => {
        modal.classList.remove('show');
      };
    }
  }

  openArchiveModal() {
    const modal = document.getElementById('examArchiveModal');
    if (!modal) return;
    modal.classList.add('show');

    const storageKey = `stage2_exam_progress_${this.paperKey}`;
    const badgeEl = document.getElementById('archiveStorageKeyBadge');
    if (badgeEl) badgeEl.textContent = storageKey;

    const paperName = this.paperKey === 'exam' ? 'A 卷 (2025 全真真题)' : 'B 卷 (2026 原创预测)';
    const answeredCount = Object.keys(this.userAnswers).filter(k => this.userAnswers[k] !== undefined && this.userAnswers[k] !== '').length;

    // 渲染摘要信息
    const metaGrid = document.getElementById('archiveMetaGrid');
    if (metaGrid) {
      metaGrid.innerHTML = `
        <div class="archive-meta-item">
          <div class="archive-meta-label">当前考卷</div>
          <div class="archive-meta-val" style="font-size:1rem;">${paperName}</div>
        </div>
        <div class="archive-meta-item">
          <div class="archive-meta-label">试卷状态</div>
          <div class="archive-meta-val" style="color:${this.isSubmitted ? 'var(--color-green)' : 'var(--color-primary)'};">
            ${this.isSubmitted ? '已交卷归档' : '正在作答中'}
          </div>
        </div>
        <div class="archive-meta-item">
          <div class="archive-meta-label">作答进度</div>
          <div class="archive-meta-val">${answeredCount} / ${this.questions.length} 题</div>
        </div>
        <div class="archive-meta-item">
          <div class="archive-meta-label">总得分</div>
          <div class="archive-meta-val">${this.isSubmitted ? (this.lastSubmittedScore + ' 分') : '待交卷'}</div>
        </div>
        <div class="archive-meta-item">
          <div class="archive-meta-label">最后更新</div>
          <div class="archive-meta-val" style="font-size:0.85rem;line-height:1.4;">
            ${this.lastSubmittedAt ? new Date(this.lastSubmittedAt).toLocaleDateString() : '进行中'}
          </div>
        </div>
      `;
    }

    // 渲染 25 题详细清单
    const tbody = document.getElementById('archiveTableBody');
    if (tbody) {
      let tbodyHtml = '';
      this.questions.forEach((q, idx) => {
        const uAns = this.userAnswers[q.id];
        let userDisplay = '<span style="color:#9CA3AF;">未作答</span>';
        let correctDisplay = '';
        let isCorrect = false;
        let earned = 0;

        if (q.type === 'choice') {
          if (uAns !== undefined && q.options[uAns]) {
            userDisplay = `<b>${String.fromCharCode(65 + uAns)}</b> (${q.options[uAns].substring(0, 15)}...)`;
          }
          correctDisplay = `<b>${String.fromCharCode(65 + q.answer)}</b>`;
          isCorrect = (uAns === q.answer);
        } else if (q.type === 'fill') {
          if (uAns !== undefined && uAns !== '') {
            userDisplay = `<b>${uAns}</b>`;
          }
          correctDisplay = `<b>${q.answer}</b>`;
          if (q.matchRegex) {
            isCorrect = new RegExp(q.matchRegex, 'i').test(String(uAns || '').trim());
          } else {
            isCorrect = String(uAns || '').trim() === String(q.answer).trim();
          }
        }

        if (this.isSubmitted) {
          earned = isCorrect ? q.score : 0;
        }

        tbodyHtml += `
          <tr>
            <td><strong>第 ${q.num} 题</strong></td>
            <td>${q.type === 'choice' ? '单选题' : '填空题'}</td>
            <td>${this.getDimensionName(q.dimension)}</td>
            <td>${userDisplay}</td>
            <td>${this.isSubmitted ? correctDisplay : '<span style="color:#9CA3AF;">交卷后揭晓</span>'}</td>
            <td>${this.isSubmitted ? `${earned} 分` : '--'}</td>
            <td>
              ${this.isSubmitted 
                ? (isCorrect ? '<span style="color:var(--color-green);font-weight:700;">✓ 正确</span>' : '<span style="color:var(--color-accent);font-weight:700;">✕ 错误</span>') 
                : (uAns !== undefined && uAns !== '' ? '<span style="color:var(--color-primary);">已暂存</span>' : '<span style="color:#9CA3AF;">待答</span>')}
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = tbodyHtml;
    }

    // 绑定导出与清空事件
    const btnCopy = document.getElementById('btnCopyArchiveJson');
    if (btnCopy) {
      btnCopy.onclick = () => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          navigator.clipboard.writeText(saved).then(() => {
            alert('📋 本地做题档案 JSON 数据已成功复制到剪贴板！');
          }).catch(() => {
            alert('复制失败，请手动全选复制。');
          });
        } else {
          alert('当前暂无做题记录。');
        }
      };
    }

    const btnDownload = document.getElementById('btnDownloadArchiveJson');
    if (btnDownload) {
      btnDownload.onclick = () => {
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
          alert('当前暂无做题记录。');
          return;
        }
        const blob = new Blob([saved], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hoi2026_exam_${this.paperKey}_archive_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }

    const btnClear = document.getElementById('btnClearArchiveData');
    if (btnClear) {
      btnClear.onclick = () => {
        if (confirm(`确定要清空该卷在 LocalStorage 中的全部本地记录吗？`)) {
          localStorage.removeItem(storageKey);
          location.reload();
        }
      };
    }
  }

  drawRadarChart() {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 45;

    ctx.clearRect(0, 0, width, height);

    const dimKeys = Object.keys(this.dimensions);
    const count = dimKeys.length;
    const angleStep = (Math.PI * 2) / count;

    // 1. 绘制网格多边形底图 (4 层)
    for (let level = 1; level <= 4; level++) {
      const r = (radius / 4) * level;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#E7DFD5';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 2. 绘制轴线与文字标签
    ctx.font = 'bold 12px "PingFang SC", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < count; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#DFD5C3';
      ctx.stroke();

      const labelDistance = radius + 24;
      const lx = centerX + labelDistance * Math.cos(angle);
      const ly = centerY + labelDistance * Math.sin(angle);
      
      ctx.fillStyle = '#4A3B32';
      const dim = this.dimensions[dimKeys[i]];
      ctx.fillText(dim.name, lx, ly);
    }

    // 3. 绘制得分区域 (多边形)
    ctx.beginPath();
    const dataPoints = [];
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const dim = this.dimensions[dimKeys[i]];
      const ratio = dim.total > 0 ? (dim.score / dim.total) : 0;
      const curRadius = radius * Math.max(0.08, ratio);
      const x = centerX + curRadius * Math.cos(angle);
      const y = centerY + curRadius * Math.sin(angle);
      dataPoints.push({ x, y, score: dim.score, total: dim.total });

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.fillStyle = 'rgba(180, 83, 9, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. 绘制数据顶点圆点与分数标签
    dataPoints.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#B45309';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#92400E';
      ctx.fillText(`${pt.score}/${pt.total}`, pt.x, pt.y - 12);
    });
  }

  renderPrescription() {
    const container = document.getElementById('diagnosticPrescription');
    if (!container) return;

    const moduleLinks = {
      math: { name: '模块一：数学逻辑与离散计数', url: '../modules/01_math-logic.html' },
      algorithm: { name: '模块二：初等算法与贪心策略', url: '../modules/02_elementary-algorithms.html' },
      recursion: { name: '模块三：递归分治与递推模型', url: '../modules/03_recursion-thinking.html' },
      datastruct: { name: '模块四：高级数据结构与栈队列', url: '../modules/04_data-structures-adv.html' },
      complexity: { name: '模块五：代码跟踪与渐近复杂度', url: '../modules/05_code-analysis-complexity.html' }
    };

    let html = `
      <div class="prescription-box">
        <div class="prescription-title">🎯 个性化能力查漏补缺学习处方</div>
        <ul class="prescription-list">
    `;

    let hasWeakness = false;
    Object.keys(this.dimensions).forEach(k => {
      const item = this.dimensions[k];
      const ratio = item.total > 0 ? (item.score / item.total) : 0;
      if (ratio < 0.75) {
        hasWeakness = true;
        const link = moduleLinks[k];
        html += `
          <li>
            <div class="weak-tag">掌握度偏弱：${item.name}（得分率 ${Math.round(ratio * 100)}%）</div>
            <div class="weak-desc">建议重点研读：<a href="${link.url}" target="_blank" class="weak-link">${link.name} →</a></div>
          </li>
        `;
      }
    });

    if (!hasWeakness) {
      html += `
        <li class="all-pass">
          <div class="pass-tag">🌟 太棒了！五大核心维度得分率均达到 75% 以上！</div>
          <div class="weak-desc">您已全面掌握海淀第二赛段计算思维的核心要义，请保持手感，自信迎接比赛！</div>
        </li>
      `;
    }

    html += '</ul></div>';
    container.innerHTML = html;
  }

  renderReviewList(results) {
    const container = document.getElementById('examQuestionReviewArea');
    if (!container) return;

    let html = '<div class="review-title">📝 试卷全题深度解析与得失分对比</div>';

    results.forEach((q, idx) => {
      const isCorrect = q.isCorrect;
      const userAnsText = q.type === 'choice' 
        ? (q.userAns !== undefined && q.options[q.userAns] ? q.options[q.userAns] : '<span style="color:#9CA3AF;">未作答</span>')
        : (q.userAns !== undefined && q.userAns !== '' ? q.userAns : '<span style="color:#9CA3AF;">未作答</span>');
      
      const correctAnsText = q.type === 'choice' ? q.options[q.answer] : q.answer;

      html += `
        <div class="review-card ${isCorrect ? 'correct' : 'wrong'}">
          <div class="review-header">
            <span class="review-num">第 ${q.num} 题</span>
            <span class="review-status ${isCorrect ? 'text-green' : 'text-red'}">
              ${isCorrect ? '✔ 得 ' + q.score + ' 分' : '✘ 得 0 分'}
            </span>
            <span class="review-dim">${this.getDimensionName(q.dimension)}</span>
          </div>

          <div class="review-body">
            <div class="review-q-text">${this.formatCodeAndText(q.question)}</div>
            <div class="review-answers-box">
              <div class="user-choice ${isCorrect ? 'ans-correct' : 'ans-wrong'}">
                您的答案：<strong>${userAnsText}</strong>
              </div>
              <div class="correct-choice">
                标准答案：<strong>${correctAnsText}</strong>
              </div>
            </div>
            <div class="review-explanation">
              <strong>【全真题解精析】</strong><br>
              ${this.formatCodeAndText(q.explanation)}
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  getDimensionName(dimKey) {
    return this.dimensions[dimKey] ? this.dimensions[dimKey].name : '综合思维';
  }

  formatCodeAndText(text) {
    if (!text) return '';
    let safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    if (safe.includes('\nfor ') || safe.includes('\nint ') || safe.includes('\nwhile ')) {
      return `<pre class="code-snippet"><code>${safe}</code></pre>`;
    }
    return safe.replace(/\n/g, '<br>');
  }
}

// 导出全局构造函数
window.Stage2ExamEngine = Stage2ExamEngine;
