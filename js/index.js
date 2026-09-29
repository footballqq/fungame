// codex: 2026-09-29 js/index.js 主页实时搜索、分类标签过滤、快捷键与结果计数控制器
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('hubSearchInput');
    const clearBtn = document.getElementById('btnClearSearch');
    const pillButtons = document.querySelectorAll('.pill-btn');
    const sections = document.querySelectorAll('.category-section');
    const cards = document.querySelectorAll('.game-card');
    const emptyState = document.getElementById('hubEmptyState');
    const emptyKeywordSpan = document.getElementById('emptyKeyword');

    let currentCategory = 'all';

    // 过滤卡片核心逻辑
    function filterCards() {
      const query = (searchInput.value || '').trim().toLowerCase();
      clearBtn.classList.toggle('visible', query.length > 0);

      let totalVisible = 0;

      sections.forEach((section) => {
        const secCat = section.getAttribute('data-section-category');
        const isCategoryMatch = currentCategory === 'all' || currentCategory === secCat;
        let sectionVisibleCount = 0;

        const secCards = section.querySelectorAll('.game-card');
        secCards.forEach((card) => {
          if (!isCategoryMatch) {
            card.style.display = 'none';
            return;
          }

          if (!query) {
            card.style.display = 'flex';
            sectionVisibleCount++;
            totalVisible++;
            return;
          }

          const title = (card.querySelector('h3') ? card.querySelector('h3').textContent : '').toLowerCase();
          const desc = (card.querySelector('p') ? card.querySelector('p').textContent : '').toLowerCase();
          const keywords = (card.getAttribute('data-keywords') || '').toLowerCase();

          const matchesQuery = title.includes(query) || desc.includes(query) || keywords.includes(query);
          if (matchesQuery) {
            card.style.display = 'flex';
            sectionVisibleCount++;
            totalVisible++;
          } else {
            card.style.display = 'none';
          }
        });

        // 若专区内无可见卡片，隐藏整个专区
        section.style.display = sectionVisibleCount > 0 ? 'block' : 'none';
      });

      // 处理全局无结果空状态
      if (emptyState) {
        if (totalVisible === 0) {
          emptyState.classList.add('visible');
          if (emptyKeywordSpan) emptyKeywordSpan.textContent = query || '当前分类';
        } else {
          emptyState.classList.remove('visible');
        }
      }
    }

    // 分类切换事件
    pillButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        pillButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category') || 'all';
        filterCards();
      });
    });

    // 搜索框输入事件（带防抖优化）
    let debounceTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterCards, 80);
    });

    // 清空搜索按键
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      filterCards();
    });

    // 快捷键支持：按 '/' 聚焦搜索框，按 'Escape' 清空搜索
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        searchInput.blur();
        filterCards();
      }
    });

    // 初始化过滤
    filterCards();
  });
})();
