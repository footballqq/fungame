// codex: 2026-11-24 升级交互界面控制器，支持 N=2..25 动态切换、触控拖拽HUD、缩放控制与动态防剧透题解

class PaperCutUI {
    constructor() {
        this.engine = new PaperCutEngine(11);
        this.audio = new PaperCutAudio();
        this.skinManager = new SkinManager();
        this.praiseManager = new PraiseManager();
        this.guideController = new GuideController(this.engine, this.audio, this);

        this.selectedSize = 4;
        this.hoverCell = null;
        this.ghostHint = null;
        this.boardZoom = 100; // 百分比 80..160
        this.unlockedProofSizes = new Set();

        // 拖拽画框状态
        this.isDragging = false;
        this.dragStart = null;
        this.dragCurrent = null;
        this.dragMoved = false;

        this.init();
    }

    init() {
        this.skinManager.applySkin(this.skinManager.currentSkin);
        this._syncUnlockedFromRecords();
        this._buildBoardGrid();
        this._buildSizePalette();
        this._bindEvents();
        this._updateBoardSizeTexts();
        this._updateProofModalContent();
        this.render();
    }

    _getOptimalSteps() {
        return getOptimalStepsForSize(this.engine.boardSize);
    }

    _getOptimalCount() {
        return this._getOptimalSteps().length;
    }

    _syncUnlockedFromRecords() {
        const n = this.engine.boardSize;
        if (this.praiseManager.hasFoundOptimal(n, this._getOptimalCount())) {
            this.unlockedProofSizes.add(n);
        }
    }

    _isProofUnlocked() {
        return this.unlockedProofSizes.has(this.engine.boardSize);
    }

    /**
     * 切换棋盘边长 N (2..25)
     */
    changeBoardSize(newSize) {
        const n = Math.max(2, Math.min(25, parseInt(newSize, 10) || 11));
        if (n === this.engine.boardSize) return;

        this.engine.setBoardSize(n);
        this.hoverCell = null;
        this.ghostHint = null;
        this.isDragging = false;
        this.dragStart = null;
        this.dragCurrent = null;
        this.dragMoved = false;

        // 默认选中一个不剧透的中小尺寸
        this.selectedSize = Math.max(1, Math.min(4, Math.floor(n / 2)));

        this._syncUnlockedFromRecords();
        this._buildBoardGrid();
        this._buildSizePalette();
        this._updateBoardSizeTexts();
        this._updateProofModalContent();
        this.guideController.onBoardSizeChanged();
        this.render();

        this.audio.playChime();
        this.praiseManager.setMascotText(
            `已切换到 <strong>${n}×${n} 厘米</strong> 纸片（共 ${n * n} 格）！试试剪成边长 1～${n - 1} 厘米的小正方形，挑战最少片数吧！✂️`
        );
    }

    /**
     * 动态同步页面中的边长相关文案（游戏目的、下拉框、快捷胶囊等，绝不剧透答案）
     */
    _updateBoardSizeTexts() {
        const n = this.engine.boardSize;
        const maxS = n - 1;

        const select = document.getElementById('boardSizeSelect');
        if (select) select.value = String(n);

        document.querySelectorAll('.size-quick-pill').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.n, 10) === n);
        });

        const heading = document.getElementById('mainTitleHeading');
        if (heading) heading.textContent = `✂️ ${n}×${n} 剪正方形大挑战`;

        const missionN = document.getElementById('missionBoardSize');
        const missionRange = document.getElementById('missionMaxPiece');
        if (missionN) missionN.textContent = `${n}×${n} 厘米`;
        if (missionRange) missionRange.textContent = `1～${maxS} 厘米`;

        const paletteTitle = document.getElementById('paletteTitleText');
        if (paletteTitle) {
            paletteTitle.textContent = `📏 选择要剪的正方形尺寸（1×1 ～ ${maxS}×${maxS}，也可直接在画板上按住拖拉画框）：`;
        }

        const quizInput = document.getElementById('quizAnswerInput');
        if (quizInput) {
            quizInput.value = '';
            quizInput.max = String(n * n);
        }
        const quizFb = document.getElementById('quizFeedback');
        if (quizFb) {
            quizFb.className = 'quiz-feedback';
            quizFb.textContent = '';
        }
    }

    /**
     * 动态重建 N×N 基础网格与顶部/左侧 1..N 厘米刻度尺
     */
    _buildBoardGrid() {
        const n = this.engine.boardSize;
        const container = document.getElementById('paperBoardContainer');
        if (container) {
            container.style.setProperty('--board-n', n);
            container.classList.toggle('board-dense', n >= 14);
            container.classList.toggle('board-ultra-dense', n >= 19);
        }

        const topRuler = document.getElementById('boardRulerTop');
        const leftRuler = document.getElementById('boardRulerLeft');
        if (topRuler) {
            topRuler.innerHTML = Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('');
        }
        if (leftRuler) {
            leftRuler.innerHTML = Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('');
        }

        const board = document.getElementById('paperBoard');
        if (!board) return;
        board.setAttribute('aria-label', `${n}乘${n}正方形剪纸画板`);
        board.innerHTML = '';

        const cellsLayer = document.createElement('div');
        cellsLayer.id = 'boardCellsLayer';
        cellsLayer.className = 'board-cells-layer';

        const frag = document.createDocumentFragment();
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                frag.appendChild(cell);
            }
        }
        cellsLayer.appendChild(frag);

        const piecesLayer = document.createElement('div');
        piecesLayer.id = 'boardPiecesLayer';
        piecesLayer.className = 'board-pieces-layer';

        const overlayLayer = document.createElement('div');
        overlayLayer.id = 'boardOverlayLayer';
        overlayLayer.className = 'board-overlay-layer';

        board.appendChild(cellsLayer);
        board.appendChild(piecesLayer);
        board.appendChild(overlayLayer);
    }

    /**
     * 动态构建 1×1 ~ (N-1)×(N-1) 尺寸选择托盘
     */
    _buildSizePalette() {
        const palette = document.getElementById('sizePalette');
        if (!palette) return;
        palette.innerHTML = '';
        const maxS = this.engine.maxPieceSize;

        for (let size = 1; size <= maxS; size++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            const colorIdx = ((size - 1) % 12) + 1;
            btn.className = `size-chip tile-color-${colorIdx}`;
            btn.dataset.size = size;
            btn.title = `选择 ${size}×${size} 厘米正方形（面积 ${size * size} 平方厘米）`;
            btn.innerHTML = `
                <span class="size-chip-main">${size}×${size}</span>
                <span class="size-chip-area">${size * size}格</span>
            `;
            btn.addEventListener('click', () => {
                this.selectSize(size);
                this.audio.playChime();
            });
            palette.appendChild(btn);
        }
        this.selectSize(Math.min(this.selectedSize, maxS));
    }

    selectSize(size) {
        const clamped = Math.max(1, Math.min(this.engine.maxPieceSize, size));
        this.selectedSize = clamped;
        document.querySelectorAll('.size-chip').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === clamped);
        });
        const label = document.getElementById('currentSelectedSize');
        if (label) label.textContent = `${clamped} × ${clamped}`;
        this._renderOverlay();
    }

    setGhostHint(rect) {
        this.ghostHint = rect;
        this._renderOverlay();
    }

    clearGhostHint() {
        this.ghostHint = null;
        this._renderOverlay();
    }

    _setZoom(pct) {
        this.boardZoom = Math.max(80, Math.min(160, pct));
        const container = document.getElementById('paperBoardContainer');
        if (container) {
            container.style.setProperty('--board-zoom', `${this.boardZoom}%`);
        }
        const label = document.getElementById('zoomValueLabel');
        if (label) label.textContent = `${this.boardZoom}%`;
    }

    _updateDragHud(text, isInvalid = false) {
        const hud = document.getElementById('dragHudPill');
        if (!hud) return;
        if (!text) {
            hud.classList.add('hidden');
            return;
        }
        hud.textContent = text;
        hud.classList.toggle('invalid', isInvalid);
        hud.classList.remove('hidden');
    }

    _bindEvents() {
        const board = document.getElementById('paperBoard');
        if (board) {
            board.addEventListener('pointerdown', e => this._onBoardPointerDown(e));
            board.addEventListener('pointermove', e => this._onBoardPointerMove(e));
            board.addEventListener('pointerleave', () => {
                if (!this.isDragging) {
                    this.hoverCell = null;
                    this._renderOverlay();
                }
            });
        }
        window.addEventListener('pointerup', e => this._onWindowPointerUp(e));
        window.addEventListener('pointercancel', () => {
            this.isDragging = false;
            this.dragStart = null;
            this.dragCurrent = null;
            this.dragMoved = false;
            this._updateDragHud('');
            this._renderOverlay();
        });

        // 边长选择器（下拉 + 快捷胶囊）
        const select = document.getElementById('boardSizeSelect');
        if (select) {
            select.addEventListener('change', e => this.changeBoardSize(e.target.value));
        }
        document.querySelectorAll('.size-quick-pill').forEach(btn => {
            btn.addEventListener('click', () => this.changeBoardSize(btn.dataset.n));
        });

        // 画板缩放按钮
        this._onClick('btnZoomOut', () => this._setZoom(this.boardZoom - 15));
        this._onClick('btnZoomReset', () => this._setZoom(100));
        this._onClick('btnZoomIn', () => this._setZoom(this.boardZoom + 15));

        // 顶部工具按钮
        this._onClick('btnRules', () => this._openModal('ruleModal'));
        this._onClick('btnProof', () => {
            this._updateProofModalContent();
            this._openModal('proofModal');
        });
        this._onClick('btnSkins', () => this._openModal('skinModal'));
        this._onClick('btnToggleAudio', () => {
            const on = this.audio.toggle();
            const btn = document.getElementById('btnToggleAudio');
            if (btn) btn.textContent = on ? '🔊 音效: 开' : '🔇 音效: 关';
        });

        // 动作控制按钮
        this._onClick('btnUndo', () => {
            if (this.engine.undo()) {
                this.audio.playUndo();
                this.clearGhostHint();
                this.render();
                this.praiseManager.setMascotText('已撤销上一步，继续大胆尝试不同的剪法吧！✂️');
            } else {
                this.praiseManager.showToast('目前还没有可撤销的步骤哦！');
            }
        });

        this._onClick('btnReset', () => {
            if (this.engine.pieces.length === 0) return;
            this.engine.reset(true);
            this.audio.playRemove();
            this.clearGhostHint();
            this.render();
            const n = this.engine.boardSize;
            this.praiseManager.setMascotText(`纸片已恢复完整 ${n}×${n}！这次准备从多大尺寸开始剪呢？✨`);
        });

        this._onClick('btnHint', () => this._handleSmartHint());
        this._onClick('btnToggleGuide', () => this.guideController.toggle());

        // 清空纪录弹窗
        this._onClick('btnClearRecords', () => this._openModal('clearConfirmModal'));
        this._onClick('btnConfirmClear', () => {
            const n = this.engine.boardSize;
            this.praiseManager.clearRecordsForSize(n);
            this.unlockedProofSizes.delete(n);
            this._updateProofModalContent();
            this._closeModal('clearConfirmModal');
            this.render();
            this.praiseManager.showToast(`已清空 ${n}×${n} 的所有挑战纪录，重新出发！`);
        });

        // 教学控制台事件
        this._onClick('btnGuideTabThinking', () => this.guideController.switchMode('thinking'));
        this._onClick('btnGuideTabDemo', () => this.guideController.switchMode('stepdemo'));
        this._onClick('btnGuideExit', () => this.guideController.close());
        this._onClick('btnLessonPrev', () => this.guideController.prevLesson());
        this._onClick('btnLessonNext', () => this.guideController.nextLesson());

        this._onClick('btnDemoPlay', () => this.guideController.togglePlay());
        this._onClick('btnDemoPrev', () => this.guideController.prevStep());
        this._onClick('btnDemoNext', () => this.guideController.nextStep());
        this._onClick('btnGuidePractice', () => this.guideController.togglePracticeMode());

        const speedSel = document.getElementById('demoSpeedSelect');
        if (speedSel) {
            speedSel.addEventListener('change', e =>
                this.guideController.setSpeed(e.target.value)
            );
        }

        // 题解弹窗：猜答案 & 防剧透展开
        this._onClick('btnSubmitQuiz', () => this._handleProofQuiz());
        this._onClick('btnRevealProof', () => {
            this.unlockedProofSizes.add(this.engine.boardSize);
            this._updateProofModalContent();
            this.audio.playChime();
        });

        // 皮肤选择
        document.querySelectorAll('.skin-card').forEach(card => {
            card.addEventListener('click', () => {
                this.skinManager.applySkin(card.dataset.skin);
                this.audio.playChime();
                this._closeModal('skinModal');
            });
        });

        // 吉祥物点击小贴士
        this._onClick('mascotBar', () => {
            this.praiseManager.setMascotText(
                this.praiseManager.getRandomEncourage(this.engine.boardSize)
            );
            this.audio.playChime();
        });

        // 弹窗关闭
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const overlay = btn.closest('.modal-overlay');
                if (overlay) overlay.classList.add('hidden');
            });
        });
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) overlay.classList.add('hidden');
            });
        });

        // 快捷键
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
            const k = e.key.toLowerCase();
            if (k === 'z') document.getElementById('btnUndo')?.click();
            else if (k === 'r') document.getElementById('btnReset')?.click();
            else if (k === 'h') document.getElementById('btnHint')?.click();
            else if (k >= '1' && k <= '9') {
                const num = parseInt(k, 10);
                if (num <= this.engine.maxPieceSize) this.selectSize(num);
            } else if (k === '0' && this.engine.maxPieceSize >= 10) {
                this.selectSize(10);
            }
        });
    }

    _onClick(id, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    }

    _openModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }

    _closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }

    _getCellFromPoint(clientX, clientY) {
        const board = document.getElementById('paperBoard');
        if (!board) return null;
        const rect = board.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
        const n = this.engine.boardSize;
        const col = Math.min(n - 1, Math.max(0, Math.floor((x / rect.width) * n)));
        const row = Math.min(n - 1, Math.max(0, Math.floor((y / rect.height) * n)));
        return { row, col };
    }

    _onBoardPointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        const cell = this._getCellFromPoint(e.clientX, e.clientY);
        if (!cell) return;

        const existing = this.engine.getPieceAt(cell.row, cell.col);
        if (existing) {
            if (this.guideController.practiceMode) {
                this.praiseManager.showToast('跟练模式下请点击闪烁的虚线框继续下一步哦！');
                return;
            }
            this.engine.removePieceById(existing.id, true);
            this.audio.playRemove();
            this.clearGhostHint();
            this.render();
            this.praiseManager.setMascotText(
                `已拿掉这块 ${existing.size}×${existing.size} 的正方形，试试换个大小或位置吧！`
            );
            return;
        }

        if (this.guideController.practiceMode && this.ghostHint) {
            const g = this.ghostHint;
            const inGhost =
                cell.row >= g.row &&
                cell.row < g.row + g.size &&
                cell.col >= g.col &&
                cell.col < g.col + g.size;
            if (inGhost) {
                this.guideController.handlePracticePlacement(g.row, g.col, g.size);
            } else {
                this.guideController.handlePracticePlacement(cell.row, cell.col, this.selectedSize);
            }
            return;
        }

        // 触控与鼠标统一支持拖拽画框；若原地轻点则放置当前选中的尺寸
        if (e.pointerType === 'touch') {
            e.preventDefault();
        }
        this.isDragging = true;
        this.dragStart = cell;
        this.dragCurrent = cell;
        this.dragMoved = false;
        this._renderOverlay();
    }

    _onBoardPointerMove(e) {
        const cell = this._getCellFromPoint(e.clientX, e.clientY);
        this.hoverCell = cell;
        if (this.isDragging && cell) {
            if (cell.row !== this.dragStart.row || cell.col !== this.dragStart.col) {
                this.dragMoved = true;
            }
            this.dragCurrent = cell;
            if (this.dragMoved) {
                const box = this.engine.computeDragSquare(
                    this.dragStart.row,
                    this.dragStart.col,
                    this.dragCurrent.row,
                    this.dragCurrent.col
                );
                this._updateDragHud(
                    box.valid
                        ? `✂️ 正在画框：${box.size} × ${box.size}（${box.size * box.size} 格）`
                        : `⚠️ ${box.size} × ${box.size}：${box.reason}`,
                    !box.valid
                );
            }
        }
        this._renderOverlay();
    }

    _onWindowPointerUp() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this._updateDragHud('');

        let targetRow, targetCol, targetSize;
        if (this.dragMoved && this.dragStart && this.dragCurrent) {
            const box = this.engine.computeDragSquare(
                this.dragStart.row,
                this.dragStart.col,
                this.dragCurrent.row,
                this.dragCurrent.col
            );
            targetRow = box.row;
            targetCol = box.col;
            targetSize = box.size;
        } else if (this.dragStart) {
            targetRow = this.dragStart.row;
            targetCol = this.dragStart.col;
            targetSize = this.selectedSize;
        }

        this.dragStart = null;
        this.dragCurrent = null;
        this.dragMoved = false;

        if (targetRow !== undefined) {
            this._tryPlace(targetRow, targetCol, targetSize);
        } else {
            this._renderOverlay();
        }
    }

    _tryPlace(row, col, size) {
        const res = this.engine.placePiece(row, col, size, true);
        if (!res.ok) {
            this.audio.playInvalid();
            this.praiseManager.showToast(res.reason);
            const board = document.getElementById('paperBoard');
            if (board) {
                board.classList.remove('board-shake');
                void board.offsetWidth;
                board.classList.add('board-shake');
            }
            this._renderOverlay();
            return;
        }

        this.audio.playSnip(size);
        this.clearGhostHint();
        this.render();

        const stats = this.engine.getStats();
        if (stats.isComplete) {
            this.onBoardCompleted();
        } else {
            this.praiseManager.setMascotText(
                `咔嚓！剪下一块 ${size}×${size} 正方形！目前已覆盖 ${stats.coveredArea}/${stats.totalCells} 格（还剩 ${stats.remainingArea} 格）。`
            );
        }
    }

    onBoardCompleted() {
        const stats = this.engine.getStats();
        const n = stats.boardSize;
        const count = stats.pieceCount;
        const optCount = this._getOptimalCount();
        const result = this.praiseManager.recordCompletion(
            n,
            count,
            this.engine.pieces,
            optCount
        );
        this.render();

        if (result.isOptimal) {
            this.unlockedProofSizes.add(n);
            this._updateProofModalContent();
            this.audio.playLegendaryWin();
            this.praiseManager.launchConfetti(80);
            this.praiseManager.setMascotText(
                `🏆 不可思议！你在 ${n}×${n} 棋盘上剪出了 <strong>${count} 片</strong>，这就是数学严格证明的<strong>最少极限</strong>！太棒啦！`
            );
            const badge = document.getElementById('winModalBadge');
            const desc = document.getElementById('winModalDesc');
            if (badge) badge.textContent = `剪纸大宗师 · ${n}×${n} 达成 ${count} 片理论极限！`;
            if (desc) {
                desc.innerHTML = `你成功把 ${n}×${n} 厘米的大正方形严丝合缝剪成了 <strong>${count} 片</strong>！<br>经过数学严格证明，${n}×${n} 不可能比 ${optCount} 片更少了！试试切换更大的质数边长继续挑战吧！`;
            }
            this._openModal('winModal');
        } else {
            this.audio.playComplete();
            this.praiseManager.launchConfetti(32);
            const best = this.praiseManager.getBestCount(n);
            const recordMsg = result.isNewBest
                ? `🎉 刷新 ${n}×${n} 个人纪录！你成功剪成了 <strong>${count} 片</strong>，没有一点浪费！`
                : `👏 完整剪完啦！这次用了 <strong>${count} 片</strong>（你在 ${n}×${n} 的最佳纪录是 ${best} 片）。`;
            this.praiseManager.setMascotText(
                `${recordMsg} 悄悄问一句：还能想办法剪得<strong>更少</strong>吗？试试挑战打破纪录，或者点「🎓 一步步教学」获取灵感！`
            );
            this.praiseManager.showToast(
                `成功剪成 ${count} 片！还能再少几片吗？继续挑战吧！`,
                3400
            );
        }
    }

    _handleSmartHint() {
        const optSteps = this._getOptimalSteps();
        const nextStep = this.engine.findCompatibleOptimalNextStep(optSteps);
        if (nextStep) {
            this.selectSize(nextStep.size);
            this.setGhostHint(nextStep);
            this.audio.playChime();
            const msg =
                this.engine.pieces.length === 0
                    ? `💡 起步建议：试试在闪烁的虚线框处先剪一块 ${nextStep.size}×${nextStep.size}！这样留下的剩余空间最匀称哦！`
                    : `💡 思路很棒！沿着这个方向，建议在闪烁虚线框处剪一块 ${nextStep.size}×${nextStep.size} 正方形！`;
            this.praiseManager.setMascotText(msg);
            this.praiseManager.showToast(`已在棋盘上用金色虚线标出推荐的 ${nextStep.size}×${nextStep.size} 位置！`);
        } else {
            this.audio.playInvalid();
            this.praiseManager.setMascotText(
                '💡 当前已剪的布局可能会多用几片哦！可以点几下「↩️ 撤销一步」调整大块的位置，或者打开「🎓 一步步教学」看看专属破局思路！'
            );
            this.praiseManager.showToast('当前布局容易留下窄缝，试试撤销或打开「一步步教学」吧！', 3000);
        }
    }

    _handleProofQuiz() {
        const input = document.getElementById('quizAnswerInput');
        const fb = document.getElementById('quizFeedback');
        if (!input || !fb) return;

        const n = this.engine.boardSize;
        const optCount = this._getOptimalCount();
        const val = parseInt(input.value, 10);

        if (isNaN(val) || val < 1 || val > n * n) {
            fb.className = 'quiz-feedback error';
            fb.textContent = `请输入一个 1 到 ${n * n} 之间的整数哦！`;
            return;
        }

        if (val === optCount) {
            fb.className = 'quiz-feedback success';
            fb.innerHTML = `🎉 <strong>回答正确！${n}×${n} 最少恰好是 ${optCount} 片！</strong>已为你解锁下方的完整构造校验与数学证明！`;
            this.unlockedProofSizes.add(n);
            this._updateProofModalContent();
            this.audio.playComplete();
        } else if (val < optCount) {
            fb.className = 'quiz-feedback error';
            fb.textContent = `猜 ${val} 片太小啦！在 ${n}×${n} 棋盘上做不到少于 ${optCount} 片哦，再猜大一点试试？`;
            this.audio.playInvalid();
        } else {
            fb.className = 'quiz-feedback error';
            fb.textContent = `${val} 片确实可以剪出来，但其实还能剪得更少哦！再往小猜一猜，或者先回到棋盘试试看？`;
            this.audio.playInvalid();
        }
    }

    _updateProofModalContent() {
        const n = this.engine.boardSize;
        const unlocked = this._isProofUnlocked();

        const titleEl = document.getElementById('proofModalTitle');
        if (titleEl) titleEl.textContent = `🧠 ${n}×${n} 奥数题解与数学证明`;

        const quizPrompt = document.getElementById('proofQuizPrompt');
        if (quizPrompt) quizPrompt.textContent = `🎯 互动小测验：你猜 ${n}×${n} 最少能剪成几片？`;

        const shield = document.getElementById('proofSpoilerShield');
        const content = document.getElementById('proofRevealContent');
        if (shield) shield.classList.toggle('hidden', unlocked);
        if (content) {
            content.classList.toggle('hidden', !unlocked);
            if (unlocked) {
                content.innerHTML = buildProofHtmlForSize(n);
            }
        }
    }

    render() {
        this._renderStats();
        this._renderPieces();
        this._renderRecordsTrack();
        this._renderOverlay();
    }

    _renderStats() {
        const stats = this.engine.getStats();
        const elCount = document.getElementById('currentPieceCount');
        const elArea = document.getElementById('coveredAreaText');
        const elBest = document.getElementById('bestRecordText');
        const elBar = document.getElementById('coverageBarFill');

        if (elCount) elCount.textContent = stats.pieceCount;
        if (elArea) elArea.textContent = `${stats.coveredArea} / ${stats.totalCells}`;
        if (elBar) elBar.style.width = `${stats.progressPercent}%`;

        if (elBest) {
            const best = this.praiseManager.getBestCount(stats.boardSize);
            elBest.textContent = best === null ? '待探索' : `${best} 片`;
        }
    }

    _renderPieces() {
        const layer = document.getElementById('boardPiecesLayer');
        if (!layer) return;
        layer.innerHTML = '';
        const n = this.engine.boardSize;

        for (const p of this.engine.pieces) {
            const tile = document.createElement('div');
            const colorIdx = ((p.size - 1) % 12) + 1;
            tile.className = `placed-tile tile-color-${colorIdx}`;
            tile.style.left = `${(p.col / n) * 100}%`;
            tile.style.top = `${(p.row / n) * 100}%`;
            tile.style.width = `${(p.size / n) * 100}%`;
            tile.style.height = `${(p.size / n) * 100}%`;
            tile.style.setProperty('--tile-size', p.size);
            tile.title = `${p.size}×${p.size} 正方形（点击可移除）`;

            // 极小格子（高阶大棋盘中的 1x1）仅显示单数字保持清晰
            const labelText = p.size === 1 ? '1' : `${p.size}×${p.size}`;
            tile.innerHTML = `
                <span class="tile-label">${labelText}</span>
                <span class="tile-remove-hint" aria-hidden="true">×</span>
            `;
            layer.appendChild(tile);
        }
    }

    _renderRecordsTrack() {
        const track = document.getElementById('recordBadgeTrack');
        if (!track) return;
        track.innerHTML = '';
        const n = this.engine.boardSize;
        const optCount = this._getOptimalCount();
        const records = this.praiseManager.getRecordsForSize(n);

        if (records.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'record-badge mystery';
            empty.textContent = `✨ 铺满整张 ${n}×${n} 纸片后，你的每一次完整剪法都会收藏在这里！`;
            track.appendChild(empty);
            return;
        }

        records.forEach(rec => {
            const badge = document.createElement('button');
            badge.type = 'button';
            const isOpt = rec.count <= optCount;
            badge.className = `record-badge ${isOpt ? 'optimal' : 'unlocked'}`;
            badge.title = '点击在棋盘上重现这套剪法';
            badge.textContent = isOpt ? `🏆 ${rec.count} 片（最优极限！）` : `✂️ ${rec.count} 片`;
            badge.addEventListener('click', () => {
                this.engine.loadLayout(rec.pieces);
                this.audio.playChime();
                this.clearGhostHint();
                this.render();
                this.praiseManager.setMascotText(
                    `已为你重现 ${n}×${n} 的 <strong>${rec.count} 片</strong> 完整剪法！点击任意方块可移除继续优化哦！`
                );
            });
            track.appendChild(badge);
        });
    }

    _renderOverlay() {
        const overlay = document.getElementById('boardOverlayLayer');
        if (!overlay) return;
        overlay.innerHTML = '';
        const n = this.engine.boardSize;

        if (this.ghostHint) {
            const g = this.ghostHint;
            const el = document.createElement('div');
            el.className = 'ghost-hint-box';
            el.style.left = `${(g.col / n) * 100}%`;
            el.style.top = `${(g.row / n) * 100}%`;
            el.style.width = `${(g.size / n) * 100}%`;
            el.style.height = `${(g.size / n) * 100}%`;
            el.innerHTML = `<span>${g.size}×${g.size}</span>`;
            overlay.appendChild(el);
        }

        if (this.isDragging && this.dragMoved && this.dragStart && this.dragCurrent) {
            const box = this.engine.computeDragSquare(
                this.dragStart.row,
                this.dragStart.col,
                this.dragCurrent.row,
                this.dragCurrent.col
            );
            this._appendPreviewBox(overlay, box.row, box.col, box.size, box.valid);
            return;
        }

        if (this.hoverCell && !this.guideController.practiceMode) {
            const existing = this.engine.getPieceAt(this.hoverCell.row, this.hoverCell.col);
            if (!existing) {
                const check = this.engine.canPlace(
                    this.hoverCell.row,
                    this.hoverCell.col,
                    this.selectedSize
                );
                this._appendPreviewBox(
                    overlay,
                    this.hoverCell.row,
                    this.hoverCell.col,
                    this.selectedSize,
                    check.valid
                );
            }
        }
    }

    _appendPreviewBox(overlay, row, col, size, valid) {
        const n = this.engine.boardSize;
        const clampedRow = Math.max(0, Math.min(n - 1, row));
        const clampedCol = Math.max(0, Math.min(n - 1, col));
        const visW = Math.min(size, n - clampedCol);
        const visH = Math.min(size, n - clampedRow);

        const el = document.createElement('div');
        el.className = `preview-box ${valid ? 'preview-valid' : 'preview-invalid'}`;
        el.style.left = `${(clampedCol / n) * 100}%`;
        el.style.top = `${(clampedRow / n) * 100}%`;
        el.style.width = `${(visW / n) * 100}%`;
        el.style.height = `${(visH / n) * 100}%`;
        el.innerHTML = `<span>${size}×${size}</span>`;
        overlay.appendChild(el);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.paperCutUI = new PaperCutUI();
});
