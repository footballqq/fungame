import { Store } from '../state.js?v=23';
import { ContentData } from '../data/content.js?v=23';
import { QuizzesData } from '../data/quizzes.js?v=23';

export function init() {
  const user = Store.getCurrentUser();
  if (!user) {
    window.location.hash = '/users';
    return;
  }

  document.getElementById('profile-name').innerText = user.nickname;
  document.getElementById('profile-xp').innerText = user.totalXP;
  document.getElementById('profile-streak').innerText = user.streakDays;

  document.getElementById('btn-switch-user').addEventListener('click', () => {
    window.location.hash = '/users';
  });
  
  const grid = document.getElementById('achievements-grid');
  grid.innerHTML = '';
  const allAchievements = [
    { id: 'first_blood', name: '初入星空', icon: '🚀' },
    { id: 'limit_master', name: '极限挑战者', icon: '📐' }
  ];
  
  allAchievements.forEach(ach => {
      const hasAchieved = user.achievements.includes(ach.id);
      const div = document.createElement('div');
      div.style.padding = 'var(--space-4)';
      div.style.backgroundColor = 'var(--color-primary-800)';
      div.style.borderRadius = 'var(--radius-md)';
      div.style.textAlign = 'center';
      div.style.opacity = hasAchieved ? '1' : '0.4';
      div.style.filter = hasAchieved ? 'none' : 'grayscale(100%)';
      div.innerHTML = `
          <div style="font-size: 48px; margin-bottom: 8px;">${ach.icon}</div>
          <div style="font-weight: bold;">${ach.name}</div>
      `;
      grid.appendChild(div);
  });
  
  // 渲染考试历史
  const historyContainer = document.getElementById('exam-history-container');
  historyContainer.innerHTML = '';
  let hasExams = false;
  
  Object.keys(user.chapters).forEach(chapId => {
      const examState = user.chapters[chapId].exam;
      if (examState && examState.attempts > 0) {
          hasExams = true;
          const chapter = ContentData[chapId];
          const div = document.createElement('div');
          div.style.padding = 'var(--space-3)';
          div.style.backgroundColor = 'var(--color-primary-800)';
          div.style.borderRadius = 'var(--radius-md)';
          div.style.display = 'flex';
          div.style.justifyContent = 'space-between';
          div.style.alignItems = 'center';
          
          let starsHtml = '';
          for (let i = 0; i < 3; i++) {
              starsHtml += `<span style="color: ${i < examState.stars ? 'var(--color-star)' : 'var(--color-primary-600)'};">★</span>`;
          }
          
          div.innerHTML = `
              <div style="font-weight: bold; font-size: var(--text-lg);">${chapter ? chapter.title : chapId}</div>
              <div style="display: flex; gap: var(--space-4); align-items: center;">
                  <div style="color: var(--text-muted);">最高分: <span style="color: #fff; font-weight: bold;">${examState.bestScore}</span></div>
                  <div style="color: var(--text-muted);">尝试次数: <span style="color: #fff;">${examState.attempts}</span></div>
                  <div style="font-size: 1.2rem;">${starsHtml}</div>
              </div>
          `;
          historyContainer.appendChild(div);
      }
  });
  
  if (!hasExams) {
      historyContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: var(--space-4);">还没有参加过任何章节考核哦。</div>';
  }
  
  // 渲染错题本
  const mistakesContainer = document.getElementById('mistakes-book-container');
  mistakesContainer.innerHTML = '';
  
  const mistakesByChapter = {};
  
  // 收集错题
  Object.keys(user.chapters).forEach(chapId => {
      const chap = user.chapters[chapId];
      const chapterContent = ContentData[chapId];
      if (!chapterContent) return;
      
      const chapterMistakes = new Set();
      
      // 1. 小节中的错题
      if (chap.sections) {
          Object.keys(chap.sections).forEach(secId => {
              const quizAnswers = chap.sections[secId].quizAnswers;
              if (quizAnswers) {
                  Object.keys(quizAnswers).forEach(quizId => {
                      if (quizAnswers[quizId].attempts > 1 || !quizAnswers[quizId].passed) {
                          chapterMistakes.add(quizId);
                      }
                  });
              }
          });
      }
      
      // 2. 考试中的错题
      if (chap.exam && chap.exam.lastAnswers) {
          chap.exam.lastAnswers.forEach(ans => {
              if (!ans.isCorrect) chapterMistakes.add(ans.quizId);
          });
      }
      
      if (chapterMistakes.size > 0) {
          mistakesByChapter[chapId] = Array.from(chapterMistakes);
      }
  });
  
  const chapIdsWithMistakes = Object.keys(mistakesByChapter);
  
  if (chapIdsWithMistakes.length === 0) {
      mistakesContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: var(--space-4);">太棒了，目前没有错题记录！</div>';
  } else {
      chapIdsWithMistakes.forEach(chapId => {
          const chapterContent = ContentData[chapId];
          const mistakeIds = mistakesByChapter[chapId];
          
          // 章节标题
          const chapTitleDiv = document.createElement('h3');
          chapTitleDiv.style.color = 'var(--color-primary-400)';
          chapTitleDiv.style.borderBottom = '1px solid var(--color-primary-700)';
          chapTitleDiv.style.paddingBottom = 'var(--space-2)';
          chapTitleDiv.style.marginTop = 'var(--space-6)';
          chapTitleDiv.style.marginBottom = 'var(--space-4)';
          chapTitleDiv.innerText = chapterContent.title;
          mistakesContainer.appendChild(chapTitleDiv);
          
          // 错题列表
          mistakeIds.forEach(quizId => {
              const quiz = QuizzesData.find(q => q.id === quizId);
              if (!quiz) return;
              
              const correctOpt = quiz.options.find(o => o.value === quiz.correct);
              const explanation = quiz.explanations ? quiz.explanations[quiz.correct] : '';
              
              const div = document.createElement('div');
              div.style.padding = 'var(--space-4)';
              div.style.backgroundColor = 'var(--color-primary-800)';
              div.style.borderLeft = '4px solid var(--color-wrong)';
              div.style.borderRadius = 'var(--radius-md)';
              div.style.marginBottom = 'var(--space-4)';
              div.innerHTML = `
                  <div style="margin-bottom: var(--space-2); font-weight: bold; font-size: var(--text-lg);">${quiz.question}</div>
                  <div style="color: var(--color-correct); margin-bottom: var(--space-2);">✅ 正确答案：${correctOpt ? correctOpt.text : quiz.correct}</div>
                  <div style="color: var(--text-muted); font-size: var(--text-sm); line-height: 1.5;">${explanation ? '解析：' + explanation : ''}</div>
              `;
              mistakesContainer.appendChild(div);
          });
      });
      
      // 渲染公式
      if (window.renderMathInElement) {
          window.renderMathInElement(mistakesContainer, {
              delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false},
                  {left: '\\(', right: '\\)', display: false}
              ],
              throwOnError: false
          });
      }
  }
}
