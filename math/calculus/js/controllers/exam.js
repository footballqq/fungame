import { Store } from '../state.js?v=23';
import { QuizzesData } from '../data/quizzes.js?v=23';
import { QuizCard } from '../components/quiz.js?v=23';
import { eventBus } from '../eventBus.js?v=23';

export function init() {
  const hash = window.location.hash;
  const match = hash.match(/#\/exam\/([^/]+)/);
  if (!match) return;
  const chapterId = match[1];

  const btnExit = document.getElementById('btn-exit-exam');
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      window.showConfirmModal('退出考核', '确定要放弃当前进度，退出考试吗？', () => {
          window.location.hash = `/chapter/${chapterId}`;
      });
    });
  }

  const container = document.getElementById('exam-container');
  if (!container) return;
  
  // Filter questions for this chapter (优先只抽取“考核题”，确保考试独立性)
  const examOnlyQuestions = QuizzesData.filter(q => q.chapter === chapterId && q.type === '考核题');
  const chapterQuestions = examOnlyQuestions.length >= 10 
    ? examOnlyQuestions 
    : QuizzesData.filter(q => q.chapter === chapterId);
  
  if (chapterQuestions.length === 0) {
    container.innerHTML = `<h3>该章节暂无考题。</h3>`;
    return;
  }

  // Pick 10 random questions or all if less than 10
  const questions = chapterQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
  
  let currentIndex = 0;
  let score = 0;
  const lastAnswers = [];

  function renderQuestion() {
    container.innerHTML = `
      <div style="margin-bottom: var(--space-4); color: var(--color-accent-300);">第 ${currentIndex + 1} 题 / 共 ${questions.length} 题</div>
      <div id="quiz-wrapper"></div>
    `;
    
    const q = questions[currentIndex];
    const wrapper = document.getElementById('quiz-wrapper');
    
    const quiz = new QuizCard(wrapper, q, { chapterId, sectionId: 'exam' }, (isCorrect, selectedOption) => {
        lastAnswers.push({ quizId: q.id, selectedOption, isCorrect });
        if (isCorrect) {
            score += 10;
        }
        
        currentIndex++;
        if (currentIndex >= questions.length) {
            finishExam();
        } else {
            renderQuestion();
        }
    }, true);
  }

  function finishExam() {
    const state = Store.getChapterState(chapterId);
    const passed = score >= 60;
    let stars = 0;
    if (score >= 60) stars = 1;
    if (score >= 80) stars = 2;
    if (score === 100) stars = 3;
    
    state.exam = { 
        passed: state.exam.passed || passed, 
        bestScore: Math.max(state.exam.bestScore || 0, score), 
        stars: Math.max(state.exam.stars || 0, stars), 
        attempts: (state.exam.attempts || 0) + 1, 
        lastAnswers 
    };
    Store.save();

    container.innerHTML = `
      <div class="text-center" style="padding: 40px 0;">
        <h1>考核完成！</h1>
        <div style="font-size: 64px; margin: 20px 0;">${passed ? '🎉' : '💪'}</div>
        <h2>得分: ${score}</h2>
        <div style="font-size: 32px; color: var(--color-star); margin: 20px 0;">
          ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}
        </div>
        <p>${passed ? '太棒了，你已经掌握了本章的核心知识！' : '还差一点点，复习一下再来挑战吧！'}</p>
        <button class="btn" id="btn-back-map" style="margin-top: 20px;">返回星图</button>
      </div>
    `;

    if (passed) {
        eventBus.emit('SHOW_TOAST', { message: '章末考核通过！', type: 'success' });
        Store.addXP(score);
        
        const currNum = parseInt(chapterId.split('_')[1]);
        const nextChapter = `chapter_${currNum + 1}`;
        Store.unlockChapter(nextChapter);
    }

    document.getElementById('btn-back-map').addEventListener('click', () => {
        window.location.hash = '#/';
    });
  }

  renderQuestion();
}
