/**
 * 应用主入口 (App Entry)
 */
import { ContentData } from './data/content.js';
import { SectionController } from './controllers/section.js';

class ModuloApp {
  constructor() {
    this.currentChapterId = 'chapter_1';
    this.sectionController = null;
    this.init();
  }

  init() {
    this.sectionController = new SectionController();
    this.initNavSidebar();
    this.initHeaderControls();
    this.initFooterNav();
    this.initTheme();

    // 加载初始章节
    this.switchChapter(this.currentChapterId);
  }

  initNavSidebar() {
    const navContainer = document.getElementById('chapter-nav-list');
    if (!navContainer) return;

    navContainer.innerHTML = '';

    ContentData.volumes.forEach(vol => {
      const volGroup = document.createElement('div');
      volGroup.className = 'nav-volume-group';

      const volTitle = document.createElement('div');
      volTitle.className = 'nav-volume-title';
      volTitle.textContent = vol.title;
      volGroup.appendChild(volTitle);

      vol.chapters.forEach(chId => {
        const ch = ContentData.chapters[chId];
        if (!ch) return;

        const item = document.createElement('a');
        item.className = `nav-item ${chId === this.currentChapterId ? 'active' : ''}`;
        item.id = `nav-item-${chId}`;
        item.innerHTML = `
          <span class="nav-item-num">0${ch.num}</span>
          <span class="nav-item-title">${ch.title.split('：')[1] || ch.title}</span>
        `;

        item.addEventListener('click', (e) => {
          e.preventDefault();
          this.switchChapter(chId);
          this.closeSidebarOnMobile();
        });

        volGroup.appendChild(item);
      });

      navContainer.appendChild(volGroup);
    });
  }

  switchChapter(chapterId) {
    if (!ContentData.chapters[chapterId]) return;

    this.currentChapterId = chapterId;
    const ch = ContentData.chapters[chapterId];

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById(`nav-item-${chapterId}`);
    if (activeNav) activeNav.classList.add('active');

    // 更新顶部与横幅
    const ind = document.getElementById('current-chapter-indicator');
    if (ind) ind.textContent = ch.title;

    const volBadge = document.getElementById('sec-vol-badge');
    if (volBadge) volBadge.textContent = ch.volTitle;

    const secTitle = document.getElementById('sec-title');
    if (secTitle) secTitle.textContent = ch.title;

    const secSubtitle = document.getElementById('sec-subtitle');
    if (secSubtitle) secSubtitle.textContent = ch.subtitle;

    // 更新进度条
    const progressFill = document.getElementById('global-progress-fill');
    const progressText = document.getElementById('global-progress-text');
    if (progressFill) progressFill.style.width = `${(ch.num / 12) * 100}%`;
    if (progressText) progressText.textContent = `${ch.num} / 12`;

    // 载入章节 Block
    this.sectionController.loadSection(chapterId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  initHeaderControls() {
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (btnToggleSidebar && sidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    const btnTheme = document.getElementById('btn-theme-toggle');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = curTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('modulo_theme', nextTheme);
      });
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem('modulo_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  closeSidebarOnMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && window.innerWidth <= 900) {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    }
  }

  initFooterNav() {
    const btnPrev = document.getElementById('btn-prev-section');
    const btnNext = document.getElementById('btn-next-section');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        const curNum = ContentData.chapters[this.currentChapterId].num;
        if (curNum > 1) {
          const prevId = `chapter_${curNum - 1}`;
          this.switchChapter(prevId);
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const curNum = ContentData.chapters[this.currentChapterId].num;
        if (curNum < 12) {
          const nextId = `chapter_${curNum + 1}`;
          this.switchChapter(nextId);
        }
      });
    }
  }
}

// 页面加载完毕后初始化
window.addEventListener('DOMContentLoaded', () => {
  new ModuloApp();
});
