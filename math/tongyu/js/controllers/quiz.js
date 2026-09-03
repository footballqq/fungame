/**
 * 随堂测验与挑战题卡片控制器 (Quiz Controller)
 */
import { QuizzesData } from '../data/quizzes.js';

export function renderQuizBlock(container, quizIds, onComplete) {
  if (!Array.isArray(quizIds) || quizIds.length === 0) return;

  quizIds.forEach((qid, qIdx) => {
    const quiz = QuizzesData[qid];
    if (!quiz) {
      console.warn(`[Quiz] Quiz ID "${qid}" not found in QuizzesData.`);
      return;
    }

    const card = document.createElement('div');
    card.className = 'quiz-card block-fade-in';
    card.id = `quiz-${qid}`;

    card.innerHTML = `
      <div class="quiz-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="quiz-badge">随堂测验 ${qIdx + 1}</span>
          <span class="quiz-title">${quiz.title || '思维挑战'}</span>
        </div>
        <div style="display: flex; gap: 6px;">
          ${(quiz.tags || []).map(t => `<span class="example-tag" style="font-size: 0.72rem; padding: 2px 6px;">${t}</span>`).join('')}
        </div>
      </div>

      <div class="quiz-question">${quiz.question}</div>

      <div class="quiz-options">
        ${quiz.options.map((opt, oIdx) => `
          <button class="quiz-option-btn" data-qid="${qid}" data-oidx="${oIdx}">
            <span class="quiz-option-label">${String.fromCharCode(65 + oIdx)}</span>
            <span class="quiz-option-text">${opt.replace(/^[A-D]\.\s*/, '')}</span>
          </button>
        `).join('')}
      </div>

      <div id="feedback-${qid}" class="quiz-feedback">
        <div class="feedback-title" style="font-weight: 700; margin-bottom: 6px;"></div>
        <div class="feedback-analysis">${quiz.analysis}</div>
      </div>
    `;

    container.appendChild(card);

    // 绑定选项点击事件
    const optionBtns = card.querySelectorAll('.quiz-option-btn');
    const feedbackEl = card.querySelector(`#feedback-${qid}`);
    const feedbackTitle = feedbackEl.querySelector('.feedback-title');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.getAttribute('data-oidx'));
        const isCorrect = (selectedIdx === quiz.answer);

        // 禁用所有选项
        optionBtns.forEach((b, idx) => {
          b.classList.add('disabled');
          b.disabled = true;
          if (idx === quiz.answer) {
            b.classList.add('correct');
          } else if (idx === selectedIdx && !isCorrect) {
            b.classList.add('wrong');
          }
        });

        // 展示解析反馈
        feedbackEl.className = `quiz-feedback show ${isCorrect ? 'correct' : 'wrong'}`;
        if (isCorrect) {
          feedbackTitle.innerHTML = '🎉 恭喜回答正确！思维非常严谨！';
          feedbackTitle.style.color = '#10b981';
        } else {
          feedbackTitle.innerHTML = `💡 回答有误。正确答案是选项 ${String.fromCharCode(65 + quiz.answer)}。`;
          feedbackTitle.style.color = '#f43f5e';
        }

        // 触发数学公式重新渲染
        if (window.renderMathInElement) {
          window.renderMathInElement(feedbackEl, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '\\[', right: '\\]', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false
          });
        }

        if (typeof onComplete === 'function') {
          onComplete(isCorrect);
        }
      });
    });
  });
}
