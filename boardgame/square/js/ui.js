// codex: 2026-09-29 ui.js 界面控制、米白/暗色主题切换、棋盘检视横幅、弹窗双控关闭与4K缩放
(function (global) {
  'use strict';

  class GameUI {
    constructor() {
      this.boardEl = null;
      this.gridBgEl = null;
      this.tilesContainerEl = null;
      this.ghostEl = null;
      this.trashEl = null;
      this.confettiCanvas = null;
      this.hasShownCelebrationForCurrentBoard = false;

      const savedTheme = localStorage.getItem('square_puzzle_theme');
      this.currentTheme = savedTheme === 'dark' ? 'dark' : 'beige';

      const savedZoom = parseFloat(localStorage.getItem('square_puzzle_zoom'));
      this.zoomScale = (!isNaN(savedZoom) && savedZoom >= 0.6 && savedZoom <= 2.8) ? savedZoom : 1.0;
    }

    init() {
      this.boardEl = document.getElementById('board');
      this.gridBgEl = document.getElementById('gridBackground');
      this.tilesContainerEl = document.getElementById('tilesContainer');
      this.ghostEl = document.getElementById('placementGhost');
      this.trashEl = document.getElementById('trashZone');
      this.confettiCanvas = document.getElementById('confettiCanvas');

      if (global.SquareConfetti && this.confettiCanvas) global.SquareConfetti.init(this.confettiCanvas);
      this.applyTheme(this.currentTheme);
      if (global.SquareI18n) global.SquareI18n.updateDOM();

      this.bindToolbarButtons();
      this.bindZoomControls();
      this.bindModals();
      this.bindTargetSelector();
      this.bindCustomControls();

      global.SquareDragDrop.init(this.boardEl, this.ghostEl, this.trashEl);
      window.addEventListener('gameStateChanged', () => this.onGameStateChanged());
      window.addEventListener('languageChanged', () => this.onLanguageChanged());
      window.addEventListener('resize', () => this.updateBoardDimensions());

      this.switchTarget(10);
      this.showGreetingToast();
    }

    applyTheme(theme) {
      this.currentTheme = theme === 'dark' ? 'dark' : 'beige';
      document.body.classList.remove('theme-beige', 'theme-dark');
      document.body.classList.add(`theme-${this.currentTheme}`);
      localStorage.setItem('square_puzzle_theme', this.currentTheme);
      this.updateThemeButtonUI();
    }

    toggleTheme() {
      this.applyTheme(this.currentTheme === 'dark' ? 'beige' : 'dark');
      global.SquareAudio.playClick();
    }

    updateThemeButtonUI() {
      const btn = document.getElementById('btnTheme');
      if (btn && global.SquareI18n) {
        btn.textContent = global.SquareI18n.t(this.currentTheme === 'dark' ? 'btn_theme_dark' : 'btn_theme_beige');
      }
    }

    bindToolbarButtons() {
      const actions = {
        btnUndo: () => { global.SquareGameState.undo(); global.SquareAudio.playClick(); },
        btnRedo: () => { global.SquareGameState.redo(); global.SquareAudio.playClick(); },
        btnClear: () => {
          if (confirm(global.SquareI18n.t('confirm_clear'))) {
            global.SquareGameState.clearBoard();
            global.SquareAudio.playRemove();
            this.hideReviewBanner();
          }
        },
        btnHint: () => this.handleHintClick(),
        btnDemo: () => this.handleDemoClick(),
        btnSound: () => this.updateSoundButtonUI(global.SquareAudio.toggleMute()),
        btnLang: () => global.SquareI18n.toggle(),
        btnTheme: () => this.toggleTheme()
      };
      for (const [id, fn] of Object.entries(actions)) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
      }
    }

    bindZoomControls() {
      const binds = [
        ['btnZoomIn', () => this.setZoom(this.zoomScale + 0.15)],
        ['btnZoomOut', () => this.setZoom(this.zoomScale - 0.15)],
        ['btnZoomReset', () => this.setZoom(1.0)],
        ['btnFullscreen', () => this.toggleFullscreen()]
      ];
      for (const [id, fn] of binds) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => { fn(); global.SquareAudio.playClick(); });
      }
    }

    setZoom(scale) {
      this.zoomScale = Math.max(0.6, Math.min(2.8, Math.round(scale * 100) / 100));
      localStorage.setItem('square_puzzle_zoom', this.zoomScale.toString());
      this.updateBoardDimensions();
      this.renderTiles();
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else if (document.exitFullscreen) document.exitFullscreen();
    }

    updateSoundButtonUI(muted) {
      const btnSound = document.getElementById('btnSound');
      if (btnSound && global.SquareI18n) {
        btnSound.textContent = global.SquareI18n.t(muted ? 'btn_sound_off' : 'btn_sound_on');
      }
    }

    bindModals() {
      const openModal = (id) => {
        const m = document.getElementById(id);
        if (m) { m.classList.add('open'); global.SquareAudio.playClick(); }
      };
      const closeModal = (m) => {
        m.classList.remove('open');
        if (m.id === 'congratModal' && global.SquareConfetti) global.SquareConfetti.stop();
      };

      const triggers = { btnRules: 'rulesModal', btnMath: 'mathModal', btnGreetings: 'greetingsModal' };
      for (const [btnId, modalId] of Object.entries(triggers)) {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', () => openModal(modalId));
      }

      // 全局绑定所有弹窗的关闭按钮与遮罩点击事件
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.querySelectorAll('.btn-modal-close').forEach(cb => {
          cb.addEventListener('click', () => { closeModal(modal); global.SquareAudio.playClick(); });
        });
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
      });

      // 祝贺弹窗：“查看当前棋盘”
      const btnReview = document.getElementById('btnReviewBoard');
      if (btnReview) {
        btnReview.addEventListener('click', () => {
          const cm = document.getElementById('congratModal');
          if (cm) closeModal(cm);
          this.showReviewBanner();
          global.SquareAudio.playClick();
        });
      }

      // 检视横幅：“查看评价结果”
      const btnReopen = document.getElementById('btnReopenCongrat');
      if (btnReopen) btnReopen.addEventListener('click', () => { this.hideReviewBanner(); openModal('congratModal'); });

      // 检视横幅：“再来一局”
      const btnPlayAgain = document.getElementById('btnPlayAgain');
      if (btnPlayAgain) {
        btnPlayAgain.addEventListener('click', () => {
          this.hideReviewBanner();
          global.SquareGameState.clearBoard();
          global.SquareAudio.playLevelChange();
        });
      }

      // 数学原理选项卡切换
      document.querySelectorAll('.math-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.math-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const targetTab = btn.getAttribute('data-tab');
          document.querySelectorAll('.math-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === targetTab);
          });
          global.SquareAudio.playClick();
        });
      });
    }

    showReviewBanner() {
      const banner = document.getElementById('reviewBoardBanner');
      if (!banner) return;
      banner.style.display = 'flex';
      this.updateReviewBannerText();
    }

    hideReviewBanner() {
      const banner = document.getElementById('reviewBoardBanner');
      if (banner) banner.style.display = 'none';
    }

    updateReviewBannerText() {
      const textEl = document.getElementById('reviewBannerText');
      if (textEl && global.SquareI18n) {
        const m = global.SquareGameState.getMetrics();
        textEl.textContent = global.SquareI18n.t('banner_review_text', {
          pieces: m.tileCount,
          optimal: m.minOptimal
        });
      }
    }

    bindTargetSelector() {
      const selector = document.getElementById('targetSelect');
      if (!selector) return;
      selector.addEventListener('change', (e) => {
        const isCustom = e.target.value === 'custom';
        document.getElementById('customControlPanel').style.display = isCustom ? 'flex' : 'none';
        if (!isCustom) this.switchTarget(parseInt(e.target.value, 10));
      });
    }

    bindCustomControls() {
      const btn = document.getElementById('btnApplyCustom');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const n = Math.max(4, Math.min(12, parseInt(document.getElementById('customNInput').value, 10) || 10));
        const maxT = Math.max(1, Math.min(n - 1, parseInt(document.getElementById('customMaxInput').value, 10) || 4));
        this.switchTarget(n, maxT);
      });
    }

    switchTarget(N, maxTile = 4) {
      this.hasShownCelebrationForCurrentBoard = false;
      this.hideReviewBanner();
      global.SquareGameState.initLevel(N, maxTile);
      this.updateBoardDimensions();
      this.renderGridBackground();
      this.renderTiles();
      this.updateMetricsUI();
      global.SquareAudio.playLevelChange();
    }

    updateBoardDimensions() {
      if (!this.boardEl) return;
      const N = global.SquareGameState.N;
      const is4K = window.innerWidth >= 1920;
      const isDesktop = window.innerWidth >= 900;
      const availW = Math.min(window.innerWidth - 36, is4K ? 1500 : (isDesktop ? 1040 : window.innerWidth - 20));
      const availH = Math.max(340, window.innerHeight - (is4K ? 450 : 370));
      const minDim = Math.min(availW, availH);

      let baseCell = 42;
      if (is4K) baseCell = Math.max(70, Math.min(125, Math.floor(minDim / N)));
      else if (isDesktop) baseCell = Math.max(52, Math.min(84, Math.floor(minDim / N)));
      else baseCell = Math.max(28, Math.min(62, Math.floor(minDim / N)));

      const finalCellSize = Math.round(baseCell * this.zoomScale);
      this.boardEl.style.setProperty('--cell-size', `${finalCellSize}px`);
      this.boardEl.style.setProperty('--grid-n', N.toString());
      this.boardEl.style.width = `${finalCellSize * N}px`;
      this.boardEl.style.height = `${finalCellSize * N}px`;

      const zoomEl = document.getElementById('zoomPercent');
      if (zoomEl) zoomEl.textContent = `${Math.round(this.zoomScale * 100)}%`;
    }

    renderGridBackground() {
      if (!this.gridBgEl) return;
      this.gridBgEl.innerHTML = '';
      const N = global.SquareGameState.N;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          cell.setAttribute('data-r', r);
          cell.setAttribute('data-c', c);
          this.gridBgEl.appendChild(cell);
        }
      }
    }

    renderTiles() {
      if (!this.tilesContainerEl) return;
      this.tilesContainerEl.innerHTML = '';
      const state = global.SquareGameState;

      for (const t of state.tiles) {
        const tileEl = document.createElement('div');
        tileEl.className = `board-tile tile-size-${t.s} tile-color-${t.colorIndex}`;
        tileEl.style.gridRowStart = (t.r + 1).toString();
        tileEl.style.gridRowEnd = `span ${t.s}`;
        tileEl.style.gridColumnStart = (t.c + 1).toString();
        tileEl.style.gridColumnEnd = `span ${t.s}`;
        tileEl.setAttribute('data-id', t.id);
        tileEl.innerHTML = `<span class="tile-badge">${t.s}×${t.s}</span><button class="btn-tile-remove" title="移除纸片">×</button>`;

        const removeBtn = tileEl.querySelector('.btn-tile-remove');
        const doRemove = (e) => { e.stopPropagation(); state.removeTile(t.id); global.SquareAudio.playRemove(); };
        removeBtn.addEventListener('click', doRemove);
        tileEl.addEventListener('dblclick', doRemove);
        tileEl.addEventListener('pointerdown', (e) => {
          if (e.target !== removeBtn) global.SquareDragDrop.onBoardTilePointerDown(e, t, tileEl);
        });

        this.tilesContainerEl.appendChild(tileEl);
      }
    }

    onGameStateChanged() {
      this.renderTiles();
      this.updateMetricsUI();
      this.checkCompletion();
      if (document.getElementById('reviewBoardBanner')?.style.display === 'flex') this.updateReviewBannerText();
    }

    onLanguageChanged() {
      this.updateMetricsUI();
      this.updateSoundButtonUI(global.SquareAudio.isMuted());
      this.updateThemeButtonUI();
      this.updateReviewBannerText();
    }

    updateMetricsUI() {
      const m = global.SquareGameState.getMetrics();
      const i18n = global.SquareI18n;

      const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setT('metricPieceCount', m.tileCount);
      setT('metricMinCount', m.minOptimal);
      setT('metricCoverage', `${m.coveragePercent}%`);

      const best = global.SquareGameState.getBestRecord();
      setT('metricBestRecord', best !== null ? best : '--');

      const statusBadge = document.getElementById('statusBadge');
      if (statusBadge && i18n) {
        if (m.isOptimal) {
          statusBadge.className = 'status-badge badge-optimal';
          statusBadge.textContent = i18n.t('status_optimal');
        } else if (m.isComplete) {
          statusBadge.className = 'status-badge badge-complete';
          statusBadge.textContent = i18n.t('status_can_optimize');
        } else {
          statusBadge.className = 'status-badge badge-progress';
          statusBadge.textContent = i18n.t('status_unfilled');
        }
      }

      const btnUndo = document.getElementById('btnUndo');
      const btnRedo = document.getElementById('btnRedo');
      if (btnUndo) btnUndo.disabled = !global.SquareGameState.canUndo();
      if (btnRedo) btnRedo.disabled = !global.SquareGameState.canRedo();
    }

    checkCompletion() {
      const m = global.SquareGameState.getMetrics();
      if (m.isComplete && !this.hasShownCelebrationForCurrentBoard && !global.SquareGameState.isDemoPlaying) {
        this.hasShownCelebrationForCurrentBoard = true;
        global.SquareGameState.saveBestRecord(m.tileCount);
        this.triggerCelebration(m);
      }
    }

    triggerCelebration(m) {
      global.SquareAudio.playVictory();
      if (global.SquareConfetti) global.SquareConfetti.fire();

      const modal = document.getElementById('congratModal');
      const starsEl = document.getElementById('congratStars');
      const textEl = document.getElementById('congratPraiseText');
      const statsEl = document.getElementById('congratStatsInfo');
      const i18n = global.SquareI18n;

      if (starsEl) starsEl.innerHTML = '⭐'.repeat(m.starRating) + '☆'.repeat(3 - m.starRating);
      if (textEl && i18n) {
        textEl.textContent = m.isOptimal ? i18n.t('congrat_perfect') : (m.starRating === 2 ? i18n.t('congrat_good') : i18n.t('congrat_ok'));
      }
      if (statsEl && i18n) {
        statsEl.innerHTML = `<p><strong>${i18n.t('stats_pieces_used')}</strong> ${m.tileCount}</p><p><strong>${i18n.t('stats_optimal_min')}</strong> ${m.minOptimal}</p>`;
      }
      if (modal) modal.classList.add('open');
    }

    handleHintClick() {
      const state = global.SquareGameState;
      const engine = global.SquareMathEngine;
      const i18n = global.SquareI18n;
      const metrics = state.getMetrics();

      if (metrics.isOptimal) {
        alert(i18n.t('hint_already_optimal'));
        return;
      }
      const hint = engine.findHint(state.N, state.maxTile, state.tiles, metrics.minOptimal);
      if (hint.found && hint.nextTile) {
        const { r, c, s } = hint.nextTile;
        this.highlightGridHint(r, c, s);
        alert(i18n.t('hint_next_step', { r: r + 1, c: c + 1, s }));
      } else {
        alert(i18n.t('hint_no_solution_from_here'));
      }
    }

    highlightGridHint(r, c, s) {
      if (!this.ghostEl) return;
      this.ghostEl.style.display = 'block';
      this.ghostEl.style.gridRowStart = (r + 1).toString();
      this.ghostEl.style.gridRowEnd = `span ${s}`;
      this.ghostEl.style.gridColumnStart = (c + 1).toString();
      this.ghostEl.style.gridColumnEnd = `span ${s}`;
      this.ghostEl.className = 'placement-ghost ghost-hint-pulse';
      setTimeout(() => {
        if (!global.SquareDragDrop.isDragging) this.ghostEl.style.display = 'none';
      }, 3000);
    }

    handleDemoClick() {
      const state = global.SquareGameState;
      const btnDemo = document.getElementById('btnDemo');
      const i18n = global.SquareI18n;
      if (state.isDemoPlaying) {
        state.stopDemo();
        btnDemo.textContent = i18n.t('btn_demo');
        return;
      }
      const preset = global.SquareMathEngine.getPreset(state.N);
      if (!preset || !preset.solution) return;
      btnDemo.textContent = i18n.t('btn_stop_demo');
      state.startDemo(preset.solution, null, () => {
        btnDemo.textContent = i18n.t('btn_demo');
      });
    }

    showGreetingToast() {
      const toast = document.getElementById('greetingToast');
      if (!toast) return;
      const hour = new Date().getHours();
      const i18n = global.SquareI18n;
      let text = i18n.t('greeting_morning');
      if (hour >= 12 && hour < 18) text = i18n.t('greeting_afternoon');
      else if (hour >= 18 || hour < 5) text = i18n.t('greeting_evening');
      toast.textContent = text;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4500);
    }
  }

  global.SquareUI = new GameUI();
  window.addEventListener('DOMContentLoaded', () => global.SquareUI.init());
})(window);
