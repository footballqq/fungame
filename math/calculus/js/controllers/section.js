import { ContentData } from '../data/content.js?v=23';
import { QuizzesData } from '../data/quizzes.js?v=23';
import { Store } from '../state.js?v=23';
import { DialogueBox } from '../components/dialogue.js?v=23';
import { CanvasAnimWrapper } from '../components/canvas-anim.js?v=23';
import { QuizCard } from '../components/quiz.js?v=23';
import { Chapter0Script } from '../data/script_chapter_0.js?v=23';
import { Chapter1Script } from '../data/script_chapter_1.js?v=23';
import { Chapter2Script } from '../data/script_chapter_2.js?v=23';
import { Chapter3Script } from '../data/script_chapter_3.js?v=23';
import { Chapter4Script } from '../data/script_chapter_4.js?v=23';
import { Chapter5Script } from '../data/script_chapter_5.js?v=23';
import { Chapter6Script } from '../data/script_chapter_6.js?v=23';
import { Chapter7Script } from '../data/script_chapter_7.js?v=23';
import { Chapter8Script } from '../data/script_chapter_8.js?v=23';
import { Chapter9Script } from '../data/script_chapter_9.js?v=23';
import { Chapter10Script } from '../data/script_chapter_10.js?v=23';
import { Chapter11Script } from '../data/script_chapter_11.js?v=23';
import { Chapter12Script } from '../data/script_chapter_12.js?v=23';
import { Chapter13Script } from '../data/script_chapter_13.js?v=23';
import { Chapter14Script } from '../data/script_chapter_14.js?v=23';
import { Chapter15Script } from '../data/script_chapter_15.js?v=23';
import { Chapter16Script } from '../data/script_chapter_16.js?v=23';

export function init() {
  const hash = window.location.hash;
  const match = hash.match(/#\/chapter\/(chapter_\w+)\/section\/(sec_\w+)/);
  if (!match) return;

  const chapterId = match[1];
  const sectionId = match[2];

  const btnBack = document.getElementById('btn-back-chapter');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      window.location.hash = `/chapter/${chapterId}`;
    });
  }

  const btnReset = document.getElementById('btn-reset-section');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      window.showConfirmModal('重置本节', '要清除这节课里的答题记录重新开始吗？', () => {
        Store.resetSection(chapterId, sectionId);
      });
    });
  }
  
  const container = document.getElementById('content-container');
  container.innerHTML = ''; // clear

  // 匹配内容脚本
  let scriptData = null;
  if (chapterId === 'chapter_0' && Chapter0Script[sectionId]) {
      scriptData = Chapter0Script[sectionId];
  } else if (chapterId === 'chapter_1' && Chapter1Script[sectionId]) {
      scriptData = Chapter1Script[sectionId];
  } else if (chapterId === 'chapter_2' && Chapter2Script[sectionId]) {
      scriptData = Chapter2Script[sectionId];
  } else if (chapterId === 'chapter_3' && Chapter3Script[sectionId]) {
      scriptData = Chapter3Script[sectionId];
  } else if (chapterId === 'chapter_4' && Chapter4Script[sectionId]) {
      scriptData = Chapter4Script[sectionId];
  } else if (chapterId === 'chapter_5' && Chapter5Script[sectionId]) {
      scriptData = Chapter5Script[sectionId];
  } else if (chapterId === 'chapter_6' && Chapter6Script[sectionId]) {
      scriptData = Chapter6Script[sectionId];
  } else if (chapterId === 'chapter_7' && Chapter7Script[sectionId]) {
      scriptData = Chapter7Script[sectionId];
  } else if (chapterId === 'chapter_8' && Chapter8Script[sectionId]) {
      scriptData = Chapter8Script[sectionId];
  } else if (chapterId === 'chapter_9' && Chapter9Script[sectionId]) {
      scriptData = Chapter9Script[sectionId];
  } else if (chapterId === 'chapter_10' && Chapter10Script[sectionId]) {
      scriptData = Chapter10Script[sectionId];
  } else if (chapterId === 'chapter_11' && Chapter11Script[sectionId]) {
      scriptData = Chapter11Script[sectionId];
  } else if (chapterId === 'chapter_12' && Chapter12Script[sectionId]) {
      scriptData = Chapter12Script[sectionId];
  } else if (chapterId === 'chapter_13' && Chapter13Script[sectionId]) {
      scriptData = Chapter13Script[sectionId];
  } else if (chapterId === 'chapter_14' && Chapter14Script[sectionId]) {
      scriptData = Chapter14Script[sectionId];
  } else if (chapterId === 'chapter_15' && Chapter15Script[sectionId]) {
      scriptData = Chapter15Script[sectionId];
  } else if (chapterId === 'chapter_16' && Chapter16Script[sectionId]) {
      scriptData = Chapter16Script[sectionId];
  } else {
      // 占位内容
      scriptData = {
          title: "内容建设中",
          blocks: [
              { type: 'dialogue', messages: [{ role: 'sister', text: '本节内容还在加紧建设中，敬请期待！' }] }
          ]
      };
  }

  const titleEl = document.getElementById('section-title') || document.getElementById('sec-title');
  if (titleEl) {
      titleEl.innerText = scriptData.title;
  }

  let currentBlockIndex = 0;

  function renderNextBlock() {
      if (currentBlockIndex >= scriptData.blocks.length) {
          // 全部完成
          Store.markSectionRead(chapterId, sectionId);
          Store.addXP(20);
          if (window.eventBus) {
              window.eventBus.emit('SHOW_TOAST', '🎉 本节学习完成！获得 20 星星！');
          }
          
          // 判断是否是本章最后一节
          const chapterData = ContentData[chapterId];
          const secIndex = chapterData.sections.findIndex(s => s.id === sectionId);
          const isLastSection = secIndex === chapterData.sections.length - 1;
          const nextSec = isLastSection ? null : chapterData.sections[secIndex + 1];
          
          let actionButtons = `
            <button class="btn" id="btn-return-chapter-bottom" style="background-color: transparent; color: var(--color-accent-400); border: 1px solid var(--color-accent-400); font-size: 1rem; padding: 10px 20px;">
               返回星球菜单
            </button>
          `;
          
          if (isLastSection) {
              actionButtons += `
                <button class="btn" id="btn-start-exam" style="background-color: var(--color-accent-500); color: #fff; font-size: 1.1rem; padding: 10px 25px; box-shadow: 0 4px 15px rgba(56,189,248,0.4); margin-left: 10px;">
                   开始本章考核 🚀
                </button>
              `;
          } else {
              actionButtons += `
                <button class="btn" id="btn-next-section" style="background-color: var(--color-primary-600); color: #fff; font-size: 1.1rem; padding: 10px 25px; margin-left: 10px;">
                   进入下一节：${nextSec.title} ➡
                </button>
              `;
          }

          // 添加漂亮的结束与返回按钮
          const finishCard = document.createElement('div');
          finishCard.className = 'card';
          finishCard.style.textAlign = 'center';
          finishCard.style.marginTop = 'var(--space-6)';
          finishCard.style.animation = 'popIn 0.5s ease-out-back forwards';
          finishCard.innerHTML = `
            <h2 style="color: var(--color-correct); margin-bottom: 10px; font-size: 1.8rem;">🌟 小节完成！</h2>
            <p style="color: var(--text-muted); margin-bottom: 20px;">你已经掌握了本节的所有知识，继续前进吧！</p>
            <div>
              ${actionButtons}
            </div>
          `;
          container.appendChild(finishCard);
          
          document.getElementById('btn-return-chapter-bottom').onclick = () => {
             window.location.hash = `/chapter/${chapterId}`;
          };
          
          if (isLastSection) {
              document.getElementById('btn-start-exam').onclick = () => {
                 window.location.hash = `/exam/${chapterId}`;
              };
          } else {
              document.getElementById('btn-next-section').onclick = () => {
                 window.location.hash = `/chapter/${chapterId}/section/${nextSec.id}`;
              };
          }
          
          // 延迟一点滚动，确保DOM渲染完毕
          setTimeout(() => {
              finishCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          
          return;
      }

      const block = scriptData.blocks[currentBlockIndex];
      const blockContainer = document.createElement('div');
      container.appendChild(blockContainer);

      if (block.type === 'dialogue') {
          new DialogueBox(blockContainer, block.messages, () => {
              currentBlockIndex++;
              renderNextBlock();
          });
      } else if (block.type === 'canvas') {
          new CanvasAnimWrapper(blockContainer, block.animId);
          // Canvas does not block progress, immediately show next block (or add a continue button under it)
          const btnContinue = document.createElement('button');
          btnContinue.className = 'btn';
          btnContinue.style.display = 'block';
          btnContinue.style.margin = '20px auto';
          btnContinue.innerText = '观察完了，继续 ▼';
          btnContinue.onclick = () => {
              btnContinue.style.display = 'none';
              currentBlockIndex++;
              renderNextBlock();
          };
          container.appendChild(btnContinue);
          btnContinue.scrollIntoView({ behavior: 'smooth' });
      } else if (block.type === 'story') {
          // 故事叙述段落，逐段淡入显示
          const storyCard = document.createElement('div');
          storyCard.className = 'card';
          storyCard.style.background = 'linear-gradient(135deg, var(--surface-2), var(--surface-3))';
          storyCard.style.borderLeft = '4px solid var(--color-accent-400)';
          storyCard.style.animation = 'fadeIn 0.6s ease-out forwards';
          const paragraphs = block.paragraphs || [];
          paragraphs.forEach(p => {
              const pEl = document.createElement('p');
              pEl.style.marginBottom = '12px';
              pEl.style.lineHeight = '1.8';
              pEl.style.color = 'var(--text-primary)';
              pEl.innerHTML = p;
              storyCard.appendChild(pEl);
          });
          blockContainer.appendChild(storyCard);
          // KaTeX 渲染
          if (window.renderMathInElement) {
              window.renderMathInElement(storyCard, { delimiters: [
                  { left: '\\(', right: '\\)', display: false },
                  { left: '\\[', right: '\\]', display: true }
              ]});
          }
          // 自动推进到下一块
          setTimeout(() => {
              storyCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              currentBlockIndex++;
              renderNextBlock();
          }, 300);
      } else if (block.type === 'concept') {
          // 概念盒子（四色）
          const colorMap = {
              green:  { bg: 'rgba(34,197,94,0.1)',  border: '#22c55e', icon: '✅' },
              blue:   { bg: 'rgba(56,189,248,0.1)', border: '#38bdf8', icon: '💡' },
              orange: { bg: 'rgba(251,146,60,0.1)', border: '#fb923c', icon: '🔥' },
              gray:   { bg: 'rgba(148,163,184,0.08)', border: '#94a3b8', icon: '📝' }
          };
          const scheme = colorMap[block.color] || colorMap.blue;
          const conceptCard = document.createElement('div');
          conceptCard.className = 'card';
          conceptCard.style.background = scheme.bg;
          conceptCard.style.border = `2px solid ${scheme.border}`;
          conceptCard.style.borderRadius = '12px';
          conceptCard.style.animation = 'popIn 0.5s ease-out-back forwards';
          // 标题
          const titleEl = document.createElement('h3');
          titleEl.style.color = scheme.border;
          titleEl.style.marginBottom = '10px';
          titleEl.style.fontSize = '1.1rem';
          titleEl.innerHTML = `${scheme.icon} ${block.title || '知识卡片'}`;
          conceptCard.appendChild(titleEl);
          // 内容条目
          const contentItems = block.content || [];
          contentItems.forEach(item => {
              const itemEl = document.createElement('p');
              itemEl.style.marginBottom = '8px';
              itemEl.style.lineHeight = '1.7';
              itemEl.style.color = 'var(--text-primary)';
              itemEl.innerHTML = item;
              conceptCard.appendChild(itemEl);
          });
          // 灰色盒子默认折叠
          if (block.color === 'gray') {
              conceptCard.style.cursor = 'pointer';
              const contentWrapper = document.createElement('div');
              while (conceptCard.childNodes.length > 1) {
                  contentWrapper.appendChild(conceptCard.childNodes[1]);
              }
              contentWrapper.style.display = 'none';
              conceptCard.appendChild(contentWrapper);
              titleEl.innerHTML += ' <span style="font-size:0.8em;opacity:0.6">(点击展开)</span>';
              conceptCard.onclick = () => {
                  const isHidden = contentWrapper.style.display === 'none';
                  contentWrapper.style.display = isHidden ? 'block' : 'none';
                  titleEl.innerHTML = `${scheme.icon} ${block.title || '知识卡片'} <span style="font-size:0.8em;opacity:0.6">(${isHidden ? '点击折叠' : '点击展开'})</span>`;
              };
          }
          blockContainer.appendChild(conceptCard);
          // KaTeX 渲染
          if (window.renderMathInElement) {
              window.renderMathInElement(conceptCard, { delimiters: [
                  { left: '\\(', right: '\\)', display: false },
                  { left: '\\[', right: '\\]', display: true }
              ]});
          }
          // 自动推进
          setTimeout(() => {
              conceptCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              currentBlockIndex++;
              renderNextBlock();
          }, 300);
      } else if (block.type === 'quiz') {
          // find question by tags
          let q = null;
          if (block.tags) {
              q = QuizzesData.find(quiz => block.tags.some(tag => 
                  (quiz.question && quiz.question.includes(tag)) || 
                  (quiz.explanations && Object.values(quiz.explanations).some(e => e.includes(tag)))
              ));
          }
          if (!q) {
              // fallback random
              q = QuizzesData[Math.floor(Math.random() * Math.min(10, QuizzesData.length))];
          }
          new QuizCard(blockContainer, q, { chapterId, sectionId }, (isCorrect) => {
              if (isCorrect) {
                  Store.addXP(10);
              }
              currentBlockIndex++;
              renderNextBlock();
          });
          blockContainer.scrollIntoView({ behavior: 'smooth' });
      } else {
          // 未知 block 类型，跳过
          currentBlockIndex++;
          renderNextBlock();
      }
  }

  renderNextBlock();
}
