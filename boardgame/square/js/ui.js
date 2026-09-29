// codex: 2026-09-29 ui.js 界面控制、暗格网格重绘、4K超清适配与缩放全屏控制
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

      if (global.SquareConfetti && this.confettiCanvas) {
        global.SquareConfetti.init(this.confettiCanvas);
      }

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

    bindToolbarButtons() {
      const btnUndo = document.getElementById('btnUndo');
      const btnRedo = document.getElementById('btnRedo');
      const btnClear = document.getElementById('btnClear');
      const btnHint = document.getElementById('btnHint');
      const btnDemo = document.getElementById('btnDemo');
      const btnSound = document.getElementById('btnSound');
      const btnLang = document.getElementById('btnLang');

      if (btnUndo) btnUndo.addEventListener('click', () => {
        global.SquareGameState.undo();
        global.SquareAudio.playClick();
      });

      if (btnRedo) btnRedo.addEventListener('click', () => {
        global.SquareGameState.redo();
        global.SquareAudio.playClick();
      });

      if (btnClear) btnClear.addEventListener('click', () => {
        const i18n = global.SquareI18n;
        if (confirm(i18n.t('confirm_clear'))) {
          global.SquareGameState.clearBoard();
          global.SquareAudio.playRemove();
        }
      });

      if (btnHint) btnHint.addEventListener('click', () => this.handleHintClick());
      if (btnDemo) btnDemo.addEventListener('click', () => this.handleDemoClick());

      if (btnSound) btnSound.addEventListener('click', () => {
        const muted = global.SquareAudio.toggleMute();
        this.updateSoundButtonUI(muted);
      });

      if (btnLang) btnLang.addEventListener('click', () => {
        global.SquareI18n.toggle();
      });
    }

    bindZoomControls() {
      const btnZoomIn = document.getElementById('btnZoomIn');
      const btnZoomOut = document.getElementById('btnZoomOut');
      const btnZoomReset = document.getElementById('btnZoomReset');
      const btnFullscreen = document.getElementById('btnFullscreen');

      if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
          this.setZoom(this.zoomScale + 0.15);
          global.SquareAudio.playClick();
        });
      }

      if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
          this.setZoom(this.zoomScale - 0.15);
          global.SquareAudio.playClick();
        });
      }

      if (btnZoomReset) {
        btnZoomReset.addEventListener('click', () => {
          this.setZoom(1.0);
          global.SquareAudio.playClick();
        });
      }

      if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
          this.toggleFullscreen();
          global.SquareAudio.playClick();
        });
      }
    }

    setZoom(scale) {
      this.zoomScale = Math.max(0.6, Math.min(2.8, Math.round(scale * 100) / 100));
      localStorage.setItem('square_puzzle_zoom', this.zoomScale.toString());
      this.updateBoardDimensions();
      this.renderTiles();
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    updateSoundButtonUI(muted) {
      const btnSound = document.getElementById('btnSound');
      if (btnSound) {
        btnSound.textContent = global.SquareI18n.t(muted ? 'btn_sound_off' : 'btn_sound_on');
      }
    }

    bindModals() {
      const setupModal = (btnId, modalId) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        if (btn && modal) {
          btn.addEventListener('click', () => {
            modal.classList.add('open');
            global.SquareAudio.playClick();
          });
          modal.querySelectorAll('.btn-modal-close').forEach(cb => {
            cb.addEventListener('click', () => modal.classList.remove('open'));
          });
          modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
          });
        }
      };

      setupModal('btnRules', 'rulesModal');
      setupModal('btnMath', 'mathModal');
      setupModal('btnGreetings', 'greetingsModal');

      const tabBtns = document.querySelectorAll('.math-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const targetTab = btn.getAttribute('data-tab');
          document.querySelectorAll('.math-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === targetTab);
          });
          global.SquareAudio.playClick();
        });
      });
    }

    bindTargetSelector() {
      const selector = document.getElementById('targetSelect');
      if (!selector) return;

      selector.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
          document.getElementById('customControlPanel').style.display = 'flex';
        } else {
          document.getElementById('customControlPanel').style.display = 'none';
          this.switchTarget(parseInt(val, 10));
        }
      });
    }

    bindCustomControls() {
      const btnApplyCustom = document.getElementById('btnApplyCustom');
      if (btnApplyCustom) {
        btnApplyCustom.addEventListener('click', () => {
          const nVal = parseInt(document.getElementById('customNInput').value, 10) || 10;
          const maxVal = parseInt(document.getElementById('customMaxInput').value, 10) || 4;
          const clampedN = Math.max(4, Math.min(12, nVal));
          const clampedMax = Math.max(1, Math.min(clampedN - 1, maxVal));
          this.switchTarget(clampedN, clampedMax);
        });
      }
    }

    switchTarget(N, maxTile = 4) {
      this.hasShownCelebrationForCurrentBoard = false;
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
      const headerOffset = is4K ? 220 : 180;
      const trayOffset = is4K ? 230 : 190;
      const pad = 36;

      const availWidth = Math.min(window.innerWidth - pad, is4K ? 1500 : (isDesktop ? 1040 : window.innerWidth - 20));
      const availHeight = Math.max(340, window.innerHeight - headerOffset - trayOffset);
      const minDimension = Math.min(availWidth, availHeight);

      // Windows 4K/2K 超高清与普通桌面默认提供大网格
      let baseCell = 42;
      if (is4K) {
        baseCell = Math.max(70, Math.min(125, Math.floor(minDimension / N)));
      } else if (isDesktop) {
        baseCell = Math.max(52, Math.min(84, Math.floor(minDimension / N)));
      } else {
        baseCell = Math.max(28, Math.min(62, Math.floor(minDimension / N)));
      }

      const finalCellSize = Math.round(baseCell * this.zoomScale);

      this.boardEl.style.setProperty('--cell-size', `${finalCellSize}px`);
      this.boardEl.style.setProperty('--grid-n', N.toString());
      this.boardEl.style.width = `${finalCellSize * N}px`;
      this.boardEl.style.height = `${finalCellSize * N}px`;

      const zoomPercentEl = document.getElementById('zoomPercent');
      if (zoomPercentEl) {
        zoomPercentEl.textContent = `${Math.round(this.zoomScale * 100)}%`;
      }
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

        tileEl.innerHTML = `
          <span class="tile-badge">${t.s}×${t.s}</span>
          <button class="btn-tile-remove" title="移除纸片">×</button>
        `;

        const removeBtn = tileEl.querySelector('.btn-tile-remove');
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.removeTile(t.id);
          global.SquareAudio.playRemove();
        });

        tileEl.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          state.removeTile(t.id);
          global.SquareAudio.playRemove();
        });

        tileEl.addEventListener('pointerdown', (e) => {
          if (e.target === removeBtn) return;
          global.SquareDragDrop.onBoardTilePointerDown(e, t, tileEl);
        });

        this.tilesContainerEl.appendChild(tileEl);
      }
    }

    onGameStateChanged() {
      this.renderTiles();
      this.updateMetricsUI();
      this.checkCompletion();
    }

    onLanguageChanged() {
      this.updateMetricsUI();
      this.updateSoundButtonUI(global.SquareAudio.isMuted());
    }

    updateMetricsUI() {
      const metrics = global.SquareGameState.getMetrics();
      const i18n = global.SquareI18n;

      const pieceCountEl = document.getElementById('metricPieceCount');
      const minCountEl = document.getElementById('metricMinCount');
      const coverageEl = document.getElementById('metricCoverage');
      const statusBadgeEl = document.getElementById('statusBadge');
      const bestRecordEl = document.getElementById('metricBestRecord');

      if (pieceCountEl) pieceCountEl.textContent = metrics.tileCount;
      if (minCountEl) minCountEl.textContent = metrics.minOptimal;
      if (coverageEl) coverageEl.textContent = `${metrics.coveragePercent}%`;

      if (bestRecordEl) {
        const best = global.SquareGameState.getBestRecord();
        bestRecordEl.textContent = best !== null ? best : '--';
      }

      if (statusBadgeEl) {
        if (metrics.isOptimal) {
          statusBadgeEl.className = 'status-badge badge-optimal';
          statusBadgeEl.textContent = i18n.t('status_optimal');
        } else if (metrics.isComplete) {
          statusBadgeEl.className = 'status-badge badge-complete';
          statusBadgeEl.textContent = i18n.t('status_can_optimize');
        } else {
          statusBadgeEl.className = 'status-badge badge-progress';
          statusBadgeEl.textContent = i18n.t('status_unfilled');
        }
      }

      const btnUndo = document.getElementById('btnUndo');
      const btnRedo = document.getElementById('btnRedo');
      if (btnUndo) btnUndo.disabled = !global.SquareGameState.canUndo();
      if (btnRedo) btnRedo.disabled = !global.SquareGameState.canRedo();
    }

    checkCompletion() {
      const metrics = global.SquareGameState.getMetrics();
      if (metrics.isComplete && !this.hasShownCelebrationForCurrentBoard && !global.SquareGameState.isDemoPlaying) {
        this.hasShownCelebrationForCurrentBoard = true;
        global.SquareGameState.saveBestRecord(metrics.tileCount);
        this.triggerCelebration(metrics);
      }
    }

    triggerCelebration(metrics) {
      global.SquareAudio.playVictory();
      if (global.SquareConfetti) global.SquareConfetti.fire();

      const modal = document.getElementById('congratModal');
      const starsEl = document.getElementById('congratStars');
      const textEl = document.getElementById('congratPraiseText');
      const statsEl = document.getElementById('congratStatsInfo');
      const i18n = global.SquareI18n;

      if (starsEl) {
        starsEl.innerHTML = '⭐'.repeat(metrics.starRating) + '☆'.repeat(3 - metrics.starRating);
      }

      if (textEl) {
        if (metrics.isOptimal) {
          textEl.textContent = i18n.t('congrat_perfect');
        } else if (metrics.starRating === 2) {
          textEl.textContent = i18n.t('congrat_good');
        } else {
          textEl.textContent = i18n.t('congrat_ok');
        }
      }

      if (statsEl) {
        statsEl.innerHTML = `
          <p><strong>${i18n.t('stats_pieces_used')}</strong> ${metrics.tileCount}</p>
          <p><strong>${i18n.t('stats_optimal_min')}</strong> ${metrics.minOptimal}</p>
        `;
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
        if (!global.SquareDragDrop.isDragging) {
          this.ghostEl.style.display = 'none';
        }
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
