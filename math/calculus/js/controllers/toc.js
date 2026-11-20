import { ContentData } from '../data/content.js?v=23';
import { Store } from '../state.js?v=23';

export function init() {
  const vol1Container = document.getElementById('toc-vol1');
  const vol2Container = document.getElementById('toc-vol2');
  if (!vol1Container || !vol2Container) return;

  const btnReset = document.getElementById('btn-reset-all');
  if (btnReset) {
      btnReset.addEventListener('click', () => {
          window.showConfirmModal('危险操作', '确定要重置所有学习记录和考试进度吗？此操作不可逆！', () => {
              Store.resetAll();
          });
      });
  }

  Object.values(ContentData).forEach(chapter => {
    const state = Store.getChapterState(chapter.id);
    const isLocked = state.status === 'locked';

    const card = document.createElement('div');
    card.style.padding = 'var(--space-4)';
    card.style.backgroundColor = 'var(--color-primary-800)';
    card.style.borderRadius = 'var(--radius-md)';
    card.style.border = '1px solid var(--color-primary-700)';
    card.style.cursor = isLocked ? 'not-allowed' : 'pointer';
    card.style.opacity = isLocked ? '0.6' : '1';
    card.style.filter = isLocked ? 'grayscale(80%)' : 'none';
    card.style.transition = 'all 0.2s';
    
    if (!isLocked) {
        card.onmouseover = () => {
            card.style.borderColor = 'var(--color-accent-400)';
            card.style.transform = 'translateY(-2px)';
        };
        card.onmouseout = () => {
            card.style.borderColor = 'var(--color-primary-700)';
            card.style.transform = 'none';
        };
        card.addEventListener('click', () => {
            window.location.hash = `/chapter/${chapter.id}`;
        });
    }

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="margin: 0; color: ${isLocked ? 'var(--text-muted)' : 'var(--text-primary)'}">${chapter.title}</h3>
        ${isLocked ? '🔒' : '✅'}
      </div>
      <p style="font-size: var(--text-sm); color: var(--text-muted); margin: 0;">${chapter.desc}</p>
    `;

    if (chapter.vol === 1) {
        vol1Container.appendChild(card);
    } else {
        vol2Container.appendChild(card);
    }
  });
}
