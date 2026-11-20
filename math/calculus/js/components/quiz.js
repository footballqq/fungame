// js/components/quiz.js
import { Store } from '../state.js?v=23';

export class QuizCard {
  /**
   * @param {HTMLElement} container
   * @param {Object} quizData { id, question, options: [{value: 'A', text: '...'}], correct: 'A', explanations: { 'A': '...', 'B': '...' } }
   * @param {Object} context { chapterId, sectionId }
   * @param {Function} onSuccess
   */
  constructor(container, quizData, context, onSuccess, isExamMode = false) {
    this.container = container;
    this.quizData = quizData;
    this.context = context;
    this.onSuccess = onSuccess;
    this.isExamMode = isExamMode;
    
    // 从 state 恢复 (仅随堂/练习模式恢复，考核模式每次为全新抽题测试)
    let quizState = null;
    if (!isExamMode) {
      const chapterState = Store.getChapterState(context.chapterId);
      if (chapterState && chapterState.sections[context.sectionId] && chapterState.sections[context.sectionId].quizAnswers) {
          quizState = chapterState.sections[context.sectionId].quizAnswers[quizData.id];
      }
    }
    
    this.selectedOption = null;
    this.attempts = quizState ? quizState.attempts : 0;
    this.isPassed = quizState ? quizState.passed : false;

    this.render();
  }

  render() {
    let optionsHtml = this.quizData.options.map(opt => `
      <li class="quiz-option" data-value="${opt.value}">
        ${opt.value}. ${opt.text}
      </li>
    `).join('');

    this.container.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-header">❓ 小试身手</div>
        <div class="quiz-question">${this.quizData.question}</div>
        <ul class="quiz-options">
          ${optionsHtml}
        </ul>
        <button class="btn btn-submit" disabled>提交答案</button>
        <div class="quiz-feedback hidden"></div>
      </div>
    `;

    this.optionsContainer = this.container.querySelector('.quiz-options');
    this.submitBtn = this.container.querySelector('.btn-submit');
    this.feedback = this.container.querySelector('.quiz-feedback');

    // 绑定事件
    this.optionsContainer.addEventListener('click', (e) => {
      if (this.isPassed) return; // 已经通过则不能修改
      const li = e.target.closest('.quiz-option');
      if (!li) return;
      
      this.selectOption(li.dataset.value);
    });

    this.submitBtn.addEventListener('click', () => this.submit());

    // 渲染数学公式
    if (window.renderMathInElement) {
      window.renderMathInElement(this.container, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false
      });
    }
    
    if (this.isPassed) {
        this.showPassedState();
    }
  }

  selectOption(val) {
    this.selectedOption = val;
    this.optionsContainer.querySelectorAll('.quiz-option').forEach(el => {
      el.classList.remove('selected', 'wrong');
      if (el.dataset.value === val) {
        el.classList.add('selected');
      }
    });
    const btn = this.container.querySelector('.btn-submit');
    if (btn) btn.disabled = false;
  }

  submit() {
    if (!this.selectedOption) return;
    
    if (this.isExamMode && this.isLocked) {
        // 已锁定，此时点击“下一题”
        if (this.onSuccess) this.onSuccess(this.isCorrect, this.selectedOption);
        return;
    }
    
    if (this.isPassed) return;
    
    const isCorrect = this.selectedOption === this.quizData.correct;
    this.isCorrect = isCorrect;
    this.attempts++;
    
    // 更新状态
    Store.updateQuiz(this.context.chapterId, this.context.sectionId, this.quizData.id, this.selectedOption, isCorrect);
    
    const selectedEl = this.optionsContainer.querySelector(`.quiz-option[data-value="${this.selectedOption}"]`);
    
    if (this.isExamMode) {
        this.isLocked = true; // 锁定无法再修改
        
        if (isCorrect) {
            selectedEl.classList.remove('selected');
            selectedEl.classList.add('correct');
            this.feedback.className = 'quiz-feedback correct-text';
            this.feedback.innerHTML = `✅ 正确！解析：${this.quizData.explanations[this.selectedOption] || '太棒了！'}`;
        } else {
            selectedEl.classList.remove('selected');
            selectedEl.classList.add('wrong');
            // 高亮正确答案
            const correctEl = this.optionsContainer.querySelector(`.quiz-option[data-value="${this.quizData.correct}"]`);
            if (correctEl) correctEl.classList.add('correct');
            
            this.feedback.className = 'quiz-feedback wrong-text';
            const explanation = this.quizData.explanations[this.selectedOption] || this.quizData.explanations[this.quizData.correct] || '无解析';
            this.feedback.innerHTML = `❌ 错误。正确答案是 ${this.quizData.correct}。<br>解析：${explanation}`;
        }
        
        if (window.renderMathInElement) {
            window.renderMathInElement(this.feedback, {
                delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
                output: 'html',
                throwOnError: false
            });
        }
        
        this.submitBtn.innerText = '下一题 ⏭';
        this.submitBtn.classList.add('btn-primary');
        return;
    }

    // --- 随堂模式逻辑 ---
    if (isCorrect) {
      this.isPassed = true;
      selectedEl.classList.remove('selected');
      selectedEl.classList.add('correct');
      this.submitBtn.style.display = 'none';
      
      this.feedback.className = 'quiz-feedback correct-text';
      this.feedback.innerHTML = `✅ 正确！解析：${this.quizData.explanations[this.selectedOption] || '太棒了！'}`;
      
      // 首次答对加经验
      if (this.attempts === 1) {
          Store.addXP(10);
      } else {
          Store.addXP(5);
      }
      
      if (window.renderMathInElement) {
          window.renderMathInElement(this.feedback, {
              delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
              output: 'html',
              throwOnError: false
          });
      }
      if (this.onSuccess) this.onSuccess();
    } else {
      selectedEl.classList.remove('selected');
      selectedEl.classList.add('wrong');
      
      this.feedback.className = 'quiz-feedback wrong-text';
      this.feedback.innerHTML = `❌ 哎呀，再想想？解析：${this.quizData.explanations[this.selectedOption] || '这个答案不对哦。'}`;
      if (window.renderMathInElement) {
          window.renderMathInElement(this.feedback, {
              delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
              output: 'html',
              throwOnError: false
          });
      }
      
      this.selectedOption = null;
      this.submitBtn.disabled = true;
    }
  }
  
  showPassedState() {
      const correctEl = this.optionsContainer.querySelector(`.quiz-option[data-value="${this.quizData.correct}"]`);
      if (correctEl) correctEl.classList.add('correct');
      this.submitBtn.style.display = 'none';
      this.feedback.className = 'quiz-feedback correct-text';
      this.feedback.innerHTML = `✅ 已完成。解析：${this.quizData.explanations[this.quizData.correct] || ''}`;
      if (window.renderMathInElement) {
          window.renderMathInElement(this.feedback, {
              delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
              output: 'html',
              throwOnError: false
          });
      }
      if (this.onSuccess) this.onSuccess(); // Ensure parent flow continues if loaded from state
  }
}
