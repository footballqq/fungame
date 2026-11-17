/**
 * 2026海淀第二赛段 · 120分钟全真机考与五维雷达诊断引擎
 * 严格遵循规范：无任何 raw $...$ LaTeX 符号，原生 Canvas 绘制雷达图
 */

class Stage2ExamEngine {
  constructor(config = {}) {
    this.totalSeconds = config.totalMinutes ? config.totalMinutes * 60 : 120 * 60; // 120分钟
    this.remainingSeconds = this.totalSeconds;
    this.timerInterval = null;
    this.isPaused = false;
    this.isSubmitted = false;

    this.questions = window.STAGE2_QUIZ_DATA ? window.STAGE2_QUIZ_DATA.exam : [];
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
    this.startTimer();
    this.bindGlobalEvents();
  }

  calculateDimensionTotals() {
    this.questions.forEach(q => {
      const dim = q.dimension || 'math';
      if (this.dimensions[dim]) {
        this.dimensions[dim].total += q.score;
      }
    });
  }

  loadState() {
    const saved = localStorage.getItem('stage2_exam_progress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.userAnswers = data.answers || {};
        this.remainingSeconds = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : this.totalSeconds;
        this.currentIndex = data.currentIndex || 0;
        if (data.marked) this.markedQuestions = new Set(data.marked);
        if (data.isSubmitted) this.isSubmitted = true;
      } catch (e) {
        console.warn('读取既往考试记录失败，已重置', e);
      }
    }
  }

  saveState() {
    if (this.isSubmitted) return;
    const data = {
      answers: this.userAnswers,
      remainingSeconds: this.remainingSeconds,
      currentIndex: this.currentIndex,
      marked: Array.from(this.markedQuestions),
      isSubmitted: this.isSubmitted
    };
    localStorage.setItem('stage2_exam_progress', JSON.stringify(data));
  }

  startTimer() {
    if (this.isSubmitted) return;
    this.updateTimerDisplay();
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

  renderPalette() {
    const paletteEl = document.getElementById('questionPalette');
    if (!paletteEl) return;
    paletteEl.innerHTML = '';

    this.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.textContent = q.num;
      btn.dataset.index = idx;

      if (idx === this.currentIndex) {
        btn.classList.add('active');
      }

      const hasAnswer = this.userAnswers[q.id] !== undefined && this.userAnswers[q.id] !== '';
      if (hasAnswer) {
        btn.classList.add('answered');
      }

      if (this.markedQuestions.has(q.id)) {
        btn.classList.add('marked');
      }

      btn.addEventListener('click', () => {
        this.goToQuestion(idx);
      });

      paletteEl.appendChild(btn);
    });

    this.updateProgressSummary();
  }

  updateProgressSummary() {
    const answeredCount = Object.keys(this.userAnswers).filter(k => this.userAnswers[k] !== undefined && this.userAnswers[k] !== '').length;
    const summaryEl = document.getElementById('examProgressSummary');
    if (summaryEl) {
      summaryEl.textContent = `已作答 ${answeredCount} / ${this.questions.length} 题`;
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

    let html = `
      <div class="exam-q-header">
        <div class="q-badge-group">
          <span class="exam-q-num">第 ${q.num} 题</span>
          <span class="exam-q-dim">${this.getDimensionName(q.dimension)}</span>
          <span class="exam-q-score">${q.score} 分</span>
        </div>
        <button class="btn-mark ${isMarked ? 'active' : ''}" id="btnMarkToggle">
          ${isMarked ? '★ 已标记待复查' : '☆ 标记待复查'}
        </button>
      </div>

      <div class="exam-q-title">${q.title}</div>
      <div class="exam-q-body">${this.formatCodeAndText(q.question)}</div>
    `;

    if (q.type === 'choice') {
      html += `<div class="exam-options-list">`;
      q.options.forEach((opt, optIdx) => {
        const isChecked = currentAns === optIdx ? 'checked' : '';
        html += `
          <label class="exam-option-item ${isChecked ? 'selected' : ''}">
            <input type="radio" name="opt_${q.id}" value="${optIdx}" ${isChecked}>
            <span class="opt-label">${opt}</span>
          </label>
        `;
      });
      html += `</div>`;
    } else if (q.type === 'fill') {
      html += `
        <div class="exam-fill-area">
          <label>请输入最终计算数值答案：</label>
          <input type="text" class="exam-fill-input" id="inputFill_${q.id}" value="${currentAns !== undefined ? currentAns : ''}" placeholder="例如：150 或 56" autocomplete="off">
        </div>
      `;
    }

    html += `
      <div class="exam-q-footer">
        <button class="btn btn-secondary" id="btnPrevQ" ${index === 0 ? 'disabled' : ''}>← 上一题</button>
        <div class="footer-status">第 ${index + 1} / ${this.questions.length} 题</div>
        <button class="btn btn-primary" id="btnNextQ">${index === this.questions.length - 1 ? '检查并提交' : '下一题 →'}</button>
      </div>
    `;

    container.innerHTML = html;

    // 绑定该题事件
    this.bindQuestionEvents(q);
    this.renderPalette();
  }

  bindQuestionEvents(q) {
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
          this.promptSubmit();
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
    const btnSubmit = document.getElementById('btnSubmitExam');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => this.promptSubmit());
    }

    const btnReset = document.getElementById('btnResetExam');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('确定要清空全部作答记录重新开始吗？')) {
          localStorage.removeItem('stage2_exam_progress');
          location.reload();
        }
      });
    }
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
    clearInterval(this.timerInterval);
    this.isSubmitted = true;
    this.saveState();

    // 统计各维度得分
    let totalScore = 0;
    const results = [];

    // 重置维度得分
    Object.keys(this.dimensions).forEach(k => {
      this.dimensions[k].score = 0;
    });

    this.questions.forEach(q => {
      const userAns = this.userAnswers[q.id];
      let isCorrect = false;

      if (q.type === 'choice') {
        isCorrect = userAns === q.answer;
      } else if (q.type === 'fill') {
        if (q.matchRegex) {
          const reg = new RegExp(q.matchRegex, 'i');
          isCorrect = reg.test(String(userAns || '').trim());
        } else {
          isCorrect = String(userAns || '').trim() === String(q.answer).trim();
        }
      }

      const earned = isCorrect ? q.score : 0;
      totalScore += earned;

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

    this.showReportModal(totalScore, results);
  }

  showReportModal(totalScore, results) {
    const modal = document.getElementById('examReportModal');
    if (!modal) return;
    modal.classList.add('show');

    // 填充总分与评语
    const scoreValEl = document.getElementById('reportTotalScore');
    if (scoreValEl) scoreValEl.textContent = totalScore;

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

    const dims = Object.keys(this.dimensions).map(k => {
      const item = this.dimensions[k];
      const ratio = item.total > 0 ? (item.score / item.total) : 0;
      return {
        key: k,
        name: item.name,
        ratio: ratio,
        percent: Math.round(ratio * 100)
      };
    });

    const totalAxes = dims.length;
    const angleStep = (Math.PI * 2) / totalAxes;

    // 1. 绘制多边形背景同心网格 (20%, 40%, 60%, 80%, 100%)
    const levels = 5;
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      ctx.beginPath();
      for (let i = 0; i < totalAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = lvl === levels ? '#6E5844' : '#45372B';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 网格刻度文字
      if (lvl % 2 === 0 || lvl === levels) {
        ctx.fillStyle = '#C2B3A3';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${lvl * 20}%`, centerX + 4, centerY - r + 10);
      }
    }

    // 2. 绘制轴线与标题文字
    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#574637';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 文本位置向外偏移
      const labelX = centerX + (radius + 24) * Math.cos(angle);
      const labelY = centerY + (radius + 18) * Math.sin(angle);
      ctx.fillStyle = '#FAF4EE';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${dims[i].name}`, labelX, labelY - 7);
      ctx.fillStyle = '#E8A246';
      ctx.fillText(`${dims[i].percent}%`, labelX, labelY + 9);
    }

    // 3. 绘制用户能力数据多边形
    ctx.beginPath();
    dims.forEach((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * Math.max(0.08, d.ratio);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // 渐变暖金半透明填充
    const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(232, 162, 70, 0.48)');
    gradient.addColorStop(1, 'rgba(181, 105, 30, 0.18)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#E8A246';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. 数据顶点小圆点
    dims.forEach((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * Math.max(0.08, d.ratio);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#9E6518';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  renderPrescription() {
    const container = document.getElementById('diagnosticPrescription');
    if (!container) return;

    let html = '<div class="prescription-box">';
    html += '<h4>💡 薄弱项智能处方与复习导航</h4>';
    html += '<ul class="prescription-list">';

    const moduleLinks = {
      math: { name: '模块一：数学逻辑与离散基础', url: '../modules/01_math-logic.html' },
      algorithm: { name: '模块二：初等算法与贪心思维', url: '../modules/02_elementary-algorithms.html' },
      recursion: { name: '模块三：递归思想与专项突破', url: '../modules/03_recursion-thinking.html' },
      datastruct: { name: '模块四：数据结构进阶应用', url: '../modules/04_data-structures-adv.html' },
      complexity: { name: '模块五：代码分析与复杂度', url: '../modules/05_code-analysis-complexity.html' }
    };

    let hasWeakness = false;
    Object.keys(this.dimensions).forEach(k => {
      const item = this.dimensions[k];
      const ratio = item.total > 0 ? (item.score / item.total) : 0;
      if (ratio < 0.8) {
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
          <div class="pass-tag">🌟 太棒了！五大核心维度得分率均达到 80% 以上！</div>
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
        ? (q.userAns !== undefined ? q.options[q.userAns] : '<未作答>')
        : (q.userAns !== undefined && q.userAns !== '' ? q.userAns : '<未作答>');
      
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
              ${q.explanation.replace(/\n/g, '<br>')}
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
    // 将代码段用 pre code 包裹，换行替换为 br
    let safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 识别多行代码块
    if (safe.includes('\nfor ') || safe.includes('\nint ') || safe.includes('\nwhile ')) {
      return `<pre class="code-snippet"><code>${safe}</code></pre>`;
    }
    return safe.replace(/\n/g, '<br>');
  }
}

// 导出全局构造函数
window.Stage2ExamEngine = Stage2ExamEngine;
