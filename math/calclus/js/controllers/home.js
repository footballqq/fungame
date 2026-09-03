import { Store } from '../state.js?v=23';
import { eventBus } from '../eventBus.js?v=23';
import { ContentData } from '../data/content.js?v=23';

export function init() {
  const user = Store.getCurrentUser();
  if (!user) return;
  const usernameEl = document.getElementById('current-username');
  if (usernameEl) usernameEl.innerText = user.nickname;

  const map = document.getElementById('planet-map');
  if (!map) return;
  map.innerHTML = '';
  map.style.overflowY = 'auto';
  map.style.overflowX = 'hidden';
  map.style.scrollBehavior = 'smooth';
  
  const scrollArea = document.createElement('div');
  scrollArea.style.position = 'relative';
  scrollArea.style.width = '100%';
  scrollArea.style.height = '3600px'; // 3600px guarantees >220px vertical gap between every planet node!
  scrollArea.style.background = 'radial-gradient(circle at center, var(--color-primary-800), var(--color-primary-950))';
  
  const chapters = Object.keys(ContentData).map((key, index) => {
    const ch = ContentData[key];
    const topPercent = 2.5 + (index / 16) * 94; // Extended downward spacing
    const leftPercent = 50 + 26 * Math.sin(index * 0.75); // Gentle elegant S-curve
    const themes = ['planet-emerald', 'planet-cyan', 'planet-gold', 'planet-magenta'];
    
    return {
      id: ch.id,
      name: ch.title, // Use full title
      top: `${topPercent}%`,
      left: `${leftPercent}%`,
      theme: themes[index % 4],
      zIndex: 100 - index
    };
  });

  chapters.forEach(ch => {
    const state = Store.getChapterState(ch.id);
    const isLocked = state.status === 'locked';

    const node = document.createElement('div');
    node.className = `planet-node ${ch.theme} ${isLocked ? 'planet-locked' : ''}`;
    node.style.top = ch.top;
    node.style.left = ch.left;
    node.style.zIndex = ch.zIndex;

    node.innerHTML = `
      <div class="planet-glow" style="position:relative;"></div>
      ${isLocked ? '<div style="position:absolute; top:45px; left:50%; transform:translate(-50%, -50%); font-size: 40px; text-shadow: 0 4px 8px rgba(0,0,0,0.9); z-index: 10;">🔒</div>' : ''}
      <div class="planet-name">${ch.name}</div>
    `;

    node.addEventListener('click', () => {
      if (isLocked) {
        eventBus.emit('SHOW_TOAST', { message: '该星球尚未解锁！', type: 'error' });
        node.style.animation = 'shake 0.4s';
        setTimeout(() => node.style.animation = '', 400);
      } else {
        window.location.hash = `/chapter/${ch.id}`;
      }
    });

    scrollArea.appendChild(node);
  });
  
  map.appendChild(scrollArea);
  
  // 自动滚动到最近未解锁的星球，或者当前进度星球
  setTimeout(() => {
      // Find the first locked planet, or scroll to the end
      const firstLocked = Array.from(scrollArea.querySelectorAll('.planet-locked'))[0];
      if (firstLocked) {
          const mapRect = map.getBoundingClientRect();
          map.scrollTop = firstLocked.offsetTop - mapRect.height / 2;
      }
  }, 100);
}
