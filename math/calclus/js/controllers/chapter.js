import { ContentData } from '../data/content.js?v=23';
import { Store } from '../state.js?v=23';

export function init() {
  const hash = window.location.hash;
  const match = hash.match(/#\/chapter\/([^/]+)/);
  if (!match) return;
  const chapterId = match[1];

  const data = ContentData[chapterId];
  const titleEl = document.getElementById('chapter-title');
  if (!titleEl) return;
  
  if (!data) {
    titleEl.innerText = '未知的星区';
    return;
  }

  titleEl.innerText = data.title;
  document.getElementById('chapter-desc').innerText = data.desc;

  const list = document.getElementById('section-list');
  list.innerHTML = '';
  
  const state = Store.getChapterState(chapterId);

  data.sections.forEach((sec, idx) => {
    const isRead = state.sections[sec.id] && state.sections[sec.id].read;
    const li = document.createElement('li');
    li.style.padding = 'var(--space-3)';
    li.style.backgroundColor = 'var(--color-primary-800)';
    li.style.borderRadius = 'var(--radius-md)';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';

    li.innerHTML = `
      <div>
        <strong>第 ${idx + 1} 节：${sec.title}</strong>
        <div style="font-size: var(--text-sm); color: ${isRead ? 'var(--color-correct)' : 'var(--text-muted)'}">
          ${isRead ? '✅ 已完成' : '⭕ 未开始'}
        </div>
      </div>
      <button class="btn">${isRead ? '复习' : '出发'}</button>
    `;

    li.querySelector('button').addEventListener('click', () => {
      window.location.hash = `/chapter/${chapterId}/section/${sec.id}`;
    });

    list.appendChild(li);
  });

  const btnExam = document.getElementById('btn-start-exam');
  if (btnExam) {
    btnExam.addEventListener('click', () => {
      window.location.hash = `/exam/${chapterId}`;
    });
  }
}
