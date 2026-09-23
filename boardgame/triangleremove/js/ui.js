// codex: 2026-09-23 游戏主控制器：界面交互、连线指出剩余正三角形排查器、模态弹窗与系统协同
(function(root) {
  'use strict';

  class GameUI {
    constructor() {
      this.engine = new root.TriangleEngine(5);
      this.audio = new root.SoundEffects();
      this.historyStorage = new root.HistoryStorage();
      this.story = new root.StoryManager(this.audio);
      this.teaching = new root.TeachingTutor(this.engine, null, this.audio);

      this.currentLevelIndex = 3; // 默认原题 Level 4 (index 3)
      this.focusedTriangleIndex = -1;

      this._initDOM();
      this._initCanvas();
      this.demo = new root.AnswerDemoPlayer(this.engine, this.canvas, this.audio, () => {
        this.updateUI();
      });

      this._bindEvents();
      this._restoreSavedState();
      this.updateUI();
    }

    _initDOM() {
      this.canvasEl = document.getElementById('triangleCanvas');
      this.levelTitleEl = document.getElementById('levelTitle');
      this.levelDescEl = document.getElementById('levelDesc');
      this.removedCountEl = document.getElementById('removedCount');
      this.minTargetEl = document.getElementById('minTarget');
      this.remainingCountEl = document.getElementById('remainingCount');
      this.statusBadgeEl = document.getElementById('statusBadge');
      this.remainingListEl = document.getElementById('remainingList');
      this.focusNavTextEl = document.getElementById('focusNavText');
      this.soundBtn = document.getElementById('btnSound');
    }

    _initCanvas() {
      this.canvas = new root.TriangleCanvas(this.canvasEl, this.engine, {
        onPointClick: (ptId) => this.handlePointClick(ptId)
      });
      this.teaching.canvas = this.canvas;
    }

    _bindEvents() {
      // 声音切换
      this.soundBtn.addEventListener('click', () => {
        const muted = this.audio.toggleMute();
        this.soundBtn.textContent = muted ? '🔇 开启音效' : '🔊 静音';
        this.soundBtn.classList.toggle('active', !muted);
      });

      // 关卡切换按钮
      document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const lvl = parseInt(e.currentTarget.dataset.level, 10);
          this.switchLevel(lvl);
        });
      });

      // 连线开关
      const btnToggleLines = document.getElementById('btnToggleLines');
      if (btnToggleLines) {
        btnToggleLines.addEventListener('click', () => {
          const shown = this.canvas.toggleLinesDisplay();
          btnToggleLines.classList.toggle('active', shown);
          btnToggleLines.innerHTML = shown ? '⚡ 连线已开启' : '💤 开启剩余连线';
        });
      }

      // 重置棋盘
      document.getElementById('btnReset').addEventListener('click', () => {
        this.engine.clearRemoved();
        this.canvas.setFocusedTriangle(null);
        this.canvas.setDisjointMode(false);
        this.focusedTriangleIndex = -1;
        this.audio.playTap();
        this._saveState();
        this.updateUI();
      });

      // 提交判定
      document.getElementById('btnCheck').addEventListener('click', () => {
        this.checkCurrentSolution();
      });

      // 答案演示、启发式教学、剧情模式、历史记录、规则图解、收藏解法
      document.getElementById('btnAnswerDemo').addEventListener('click', () => this.openAnswerDemo());
      document.getElementById('btnTeaching').addEventListener('click', () => this.openTeachingModal());
      document.getElementById('btnStory').addEventListener('click', () => this.openStoryModal());
      document.getElementById('btnHistory').addEventListener('click', () => this.openHistoryModal());
      document.getElementById('btnRules').addEventListener('click', () => this.openModal('modalRules'));
      document.getElementById('btnBookmark').addEventListener('click', () => this.promptBookmark());

      // 答案演示控制按钮
      document.getElementById('btnDemoPlay').addEventListener('click', () => this.demo.togglePlay());
      document.getElementById('btnDemoPrev').addEventListener('click', () => this.demo.step(-1));
      document.getElementById('btnDemoNext').addEventListener('click', () => this.demo.step(1));
      document.getElementById('btnDemoReset').addEventListener('click', () => this.demo.open());
      document.getElementById('demoSolSelect').addEventListener('change', (e) => {
        this.demo.setSolutionIndex(parseInt(e.target.value, 10));
      });

      // 教学弹窗上下步
      document.getElementById('btnTeachPrev').addEventListener('click', () => {
        this.updateTeachingStep(this.teaching.currentStep - 1);
      });
      document.getElementById('btnTeachNext').addEventListener('click', () => {
        this.updateTeachingStep(this.teaching.currentStep + 1);
      });

      // 剧情弹窗上下步
      document.getElementById('btnStoryPrev').addEventListener('click', () => this.storyPrev());
      document.getElementById('btnStoryNext').addEventListener('click', () => this.storyNext());

      // 剩余三角形排查导航（上一个 / 下一个 / 清空聚焦）
      document.getElementById('btnPrevTri').addEventListener('click', () => this.navFocusedTriangle(-1));
      document.getElementById('btnNextTri').addEventListener('click', () => this.navFocusedTriangle(1));
      document.getElementById('btnClearFocus').addEventListener('click', () => {
        this.canvas.setFocusedTriangle(null);
        this.focusedTriangleIndex = -1;
        this.updateFocusNavUI();
      });

      // 模态框通用关闭
      document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target === el) {
            this.closeAllModals();
            this.demo.stop();
          }
        });
      });
    }

    _restoreSavedState() {
      const saved = this.historyStorage.loadCurrentState();
      if (saved && saved.levelId) {
        this.switchLevel(saved.levelId, false);
        if (Array.isArray(saved.removedPoints)) {
          this.engine.setRemovedPoints(saved.removedPoints);
        }
      } else {
        this.switchLevel(4, false);
      }
    }

    _saveState() {
      const cfg = window.GAME_CONFIG.LEVELS[this.currentLevelIndex];
      this.historyStorage.saveCurrentState(cfg.id, this.engine.removedPoints);
    }

    handlePointClick(ptId) {
      const isRemoved = this.engine.togglePoint(ptId);
      if (isRemoved) this.audio.playRemove();
      else this.audio.playRestore();

      this.canvas.setDisjointMode(false);
      this._saveState();
      this.updateUI();

      if (this.engine.isSolved()) {
        this.audio.playWin();
        this.showVictoryModal();
      }
    }

    switchLevel(levelId, shouldSave = true) {
      const idx = window.GAME_CONFIG.LEVELS.findIndex(l => l.id === levelId);
      if (idx === -1) return;
      this.currentLevelIndex = idx;
      const cfg = window.GAME_CONFIG.LEVELS[idx];

      this.engine.init(cfg.nRows);
      this.canvas.resize();
      this.canvas.setFocusedTriangle(null);
      this.canvas.setDisjointMode(false);
      this.focusedTriangleIndex = -1;

      document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.level, 10) === levelId);
      });

      this.levelTitleEl.textContent = cfg.title;
      this.levelDescEl.textContent = cfg.description;
      this.minTargetEl.textContent = cfg.minRemove;

      if (shouldSave) {
        this.engine.clearRemoved();
        this._saveState();
      }
      this.updateUI();
    }

    updateUI() {
      const removedCount = this.engine.removedPoints.size;
      const remainingTris = this.engine.getRemainingTriangles();
      const cfg = window.GAME_CONFIG.LEVELS[this.currentLevelIndex];

      this.removedCountEl.textContent = removedCount;
      this.remainingCountEl.textContent = remainingTris.length;

      if (remainingTris.length === 0) {
        if (removedCount <= cfg.minRemove) {
          this.statusBadgeEl.textContent = '🌟 极值最优封印！';
          this.statusBadgeEl.className = 'status-badge optimal';
        } else {
          this.statusBadgeEl.textContent = '✅ 已完全消除，但点数未达最少';
          this.statusBadgeEl.className = 'status-badge success';
        }
      } else {
        this.statusBadgeEl.textContent = `⚡ 仍有 ${remainingTris.length} 个正三角形共鸣中`;
        this.statusBadgeEl.className = 'status-badge ongoing';
      }

      this._renderRemainingList(remainingTris);
      this.updateFocusNavUI();
      this.canvas.draw();
    }

    _renderRemainingList(remainingTris) {
      if (!this.remainingListEl) return;
      if (remainingTris.length === 0) {
        this.remainingListEl.innerHTML = `
          <div class="empty-hint">
            <span class="empty-icon">🎉</span>
            <p><strong>大功告成！</strong></p>
            <p class="text-muted">当前点阵中已没有任何正三角形共鸣回路！</p>
          </div>
        `;
        return;
      }

      const styles = window.GAME_CONFIG.CATEGORY_STYLES || {};
      let html = '';
      remainingTris.forEach((tri, idx) => {
        const style = styles[tri.categoryKey] || { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
        const isFocused = this.canvas.options.focusedTriangleId === tri.id;
        const coordsStr = tri.coords.map(c => `(${c.row},${c.col})`).join('-');

        html += `
          <div class="tri-card ${isFocused ? 'focused' : ''}" data-id="${tri.id}" onclick="window.gameUI.focusTriangleById(${tri.id})">
            <div class="tri-card-header">
              <span class="tri-tag" style="background:${style.bg}; color:${style.color}; border: 1px solid ${style.color}40;">
                ${tri.sideName} · ${tri.orientationLabel}
              </span>
              <span class="tri-idx">#${idx + 1}</span>
            </div>
            <div class="tri-coords">顶点: ${coordsStr}</div>
          </div>
        `;
      });
      this.remainingListEl.innerHTML = html;
    }

    focusTriangleById(triId) {
      const remaining = this.engine.getRemainingTriangles();
      const idx = remaining.findIndex(t => t.id === triId);
      this.focusedTriangleIndex = idx;
      this.canvas.setFocusedTriangle(triId);
      this.audio.playHighlight();
      this.updateFocusNavUI();
      this._renderRemainingList(remaining);
      this.canvas.draw();
    }

    navFocusedTriangle(delta) {
      const remaining = this.engine.getRemainingTriangles();
      if (remaining.length === 0) return;

      let nextIdx = this.focusedTriangleIndex + delta;
      if (nextIdx < 0) nextIdx = remaining.length - 1;
      if (nextIdx >= remaining.length) nextIdx = 0;

      this.focusTriangleById(remaining[nextIdx].id);
    }

    updateFocusNavUI() {
      const remaining = this.engine.getRemainingTriangles();
      if (!this.focusNavTextEl) return;
      if (this.focusedTriangleIndex >= 0 && this.focusedTriangleIndex < remaining.length) {
        this.focusNavTextEl.textContent = `正在检视: 第 ${this.focusedTriangleIndex + 1} / ${remaining.length} 个`;
      } else {
        this.focusNavTextEl.textContent = remaining.length > 0 ? `共 ${remaining.length} 个未消除` : '全部已消除';
      }
    }

    checkCurrentSolution() {
      const cfg = window.GAME_CONFIG.LEVELS[this.currentLevelIndex];
      const removed = this.engine.getRemovedPoints();
      const remaining = this.engine.getRemainingTriangles();
      const isSolved = remaining.length === 0;
      const isOptimal = isSolved && removed.length === cfg.minRemove;

      this.historyStorage.recordAttempt({
        levelId: cfg.id,
        levelTitle: cfg.title,
        removedPoints: removed,
        remainingCount: remaining.length,
        isSolved: isSolved,
        isOptimal: isOptimal
      });

      if (isSolved) {
        this.audio.playWin();
        this.showVictoryModal();
      } else {
        this.audio.playAlert();
        alert(`判定结果：仍有 ${remaining.length} 个正三角形未被破坏！请点击右侧列表连线卡片排查。`);
      }
    }

    showVictoryModal() {
      const cfg = window.GAME_CONFIG.LEVELS[this.currentLevelIndex];
      const removedCount = this.engine.removedPoints.size;
      const isOpt = removedCount <= cfg.minRemove;

      const titleEl = document.getElementById('vicTitle');
      const msgEl = document.getElementById('vicMessage');
      if (titleEl && msgEl) {
        if (isOpt) {
          titleEl.textContent = '🏆 封印达成：极值数学大师！';
          msgEl.innerHTML = `太不可思议了！你成功用 <strong>${removedCount} 个点</strong>（理论最少）消除了全部正三角形！完全参透了该阵列的深层几何！`;
        } else {
          titleEl.textContent = '🎉 成功封印！继续挑战极值！';
          msgEl.innerHTML = `你去掉了 <strong>${removedCount} 个点</strong> 成功消灭了所有正三角形！不过理论最少只需 <strong>${cfg.minRemove} 个点</strong> 哦，想挑战最少点数吗？`;
        }
      }
      this.openModal('modalVictory');
    }

    openAnswerDemo() {
      this.demo.open();
      this.openModal('modalAnswer');
    }

    applyOptimalSolution(solIndex) {
      const sols = this.engine.optimalSolutions;
      if (sols[solIndex]) {
        this.engine.setRemovedPoints(sols[solIndex]);
        this.audio.playWin();
        this._saveState();
        this.updateUI();
        this.closeAllModals();
      }
    }

    openTeachingModal() {
      this.updateTeachingStep(1);
      this.openModal('modalTeaching');
    }

    updateTeachingStep(step) {
      const data = this.teaching.setStep(step);
      document.getElementById('teachTitle').textContent = data.title;
      document.getElementById('teachBadge').textContent = data.badge;
      document.getElementById('teachBody').innerHTML = data.content;

      document.querySelectorAll('.step-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx + 1 === step);
      });
    }

    teachHighlightCategory(cat) {
      const matches = this.engine.triangles.filter(t => t.orientation === cat);
      if (matches.length > 0) {
        this.canvas.setFocusedTriangle(matches[0].id);
        this.audio.playHighlight();
        this.canvas.draw();
      }
    }

    showDisjointMode() {
      this.canvas.setDisjointMode(true);
      this.audio.playAlert();
      this.canvas.draw();
    }

    resetBoardView() {
      this.canvas.setDisjointMode(false);
      this.canvas.setFocusedTriangle(null);
      this.canvas.draw();
    }

    openStoryModal(chapterIndex = null) {
      if (chapterIndex !== null) this.story.setChapter(chapterIndex);
      this._renderCurrentDialogue();
      this.openModal('modalStory');
    }

    _renderCurrentDialogue() {
      const d = this.story.getCurrentDialogue();
      document.getElementById('storyChapter').textContent = d.chapterTitle;
      document.getElementById('storySpeaker').textContent = `${d.dialogue.avatar} ${d.dialogue.speaker} (${d.dialogue.role})`;
      const textEl = document.getElementById('storyText');
      this.story.typewriteText(textEl, d.dialogue.text);

      document.getElementById('btnStoryPrev').disabled = !d.hasPrev;
      document.getElementById('btnStoryNext').textContent = d.hasNext ? '下一句 ▶' : '完成本章 ✓';
    }

    storyNext() {
      if (this.story.isTyping) {
        const d = this.story.getCurrentDialogue();
        this.story.fastForward(document.getElementById('storyText'), d.dialogue.text);
        return;
      }
      const next = this.story.nextDialogue();
      if (next) this._renderCurrentDialogue();
      else this.closeAllModals();
    }

    storyPrev() {
      const prev = this.story.prevDialogue();
      if (prev) this._renderCurrentDialogue();
    }

    openHistoryModal() {
      this.historyStorage.renderHistoryTable(document.getElementById('historyList'));
      this.historyStorage.renderBookmarks(document.getElementById('bookmarksList'));
      this.openModal('modalHistory');
    }


    loadHistoricalAttempt(removedPoints) {
      if (Array.isArray(removedPoints)) {
        this.engine.setRemovedPoints(removedPoints);
        this.audio.playTap();
        this._saveState();
        this.updateUI();
        this.closeAllModals();
      }
    }

    promptBookmark() {
      const removed = this.engine.getRemovedPoints();
      if (removed.length === 0) {
        alert('请先在棋盘上移除点后再进行收藏！');
        return;
      }
      const title = prompt('请输入该解法的名称：', `我的 ${removed.length} 点消除方案`);
      if (title) {
        const cfg = window.GAME_CONFIG.LEVELS[this.currentLevelIndex];
        this.historyStorage.saveBookmark(title, cfg.id, cfg.title, removed);
        this.audio.playTap();
        alert('解法收藏成功！可随时在历史记录中查看或复盘载入。');
      }
    }

    deleteBookmark(id) {
      if (confirm('确认删除该条收藏解法吗？')) {
        this.historyStorage.deleteBookmark(id);
        this._renderBookmarksList();
      }
    }

    openModal(modalId) {
      this.closeAllModals();
      const m = document.getElementById(modalId);
      if (m) {
        m.classList.add('active');
        document.body.classList.add('modal-open');
      }
    }

    closeAllModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      document.body.classList.remove('modal-open');
    }
  }

  root.GameUI = GameUI;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameUI };
  }
})(typeof window !== 'undefined' ? window : globalThis);
