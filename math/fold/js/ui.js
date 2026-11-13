// codex: 2026-11-13 界面控制器与折纸交互引擎，支持折痕拾取、手势折叠、3D透视与层级透视

class FoldUI {
    constructor() {
        this.engine = new FoldEngine();
        this.audio = new FoldAudio();
        this.skinManager = new SkinManager();
        this.praiseManager = new PraiseManager();
        this.demo = new DemoController(this.engine, this.audio, this);

        this.viewMode = '2d'; // '2d' 或 '3d'
        this.selectedCell = null; // 当前选中的单元格进行透视

        this.initDOM();
        this.bindEvents();
        this.render();
    }

    initDOM() {
        this.boardEl = document.getElementById('paperBoard');
        this.boardContainer = document.getElementById('paperBoardContainer');
        this.statThickEl = document.getElementById('currentThickness');
        this.statStepsEl = document.getElementById('foldStepCount');
        this.statDimEl = document.getElementById('currentDimensions');
        this.badgeTrackEl = document.getElementById('thicknessBadgeTrack');
        this.layerInspectorEl = document.getElementById('layerInspector');
        this.inspectorContentEl = document.getElementById('inspectorContent');
        this.mascotTextEl = document.getElementById('mascotText');

        // 模式切换与清空收集元素
        this.btnModeBlind = document.getElementById('btnModeBlind');
        this.btnModeCodex = document.getElementById('btnModeCodex');
        this.btnClearCollection = document.getElementById('btnClearCollection');
        this.btnConfirmClear = document.getElementById('btnConfirmClear');
        this.achievementTitleEl = document.getElementById('achievementTitle');
        this.statProgressLabelEl = document.getElementById('statProgressLabel');

        // 应用初始皮肤
        this.skinManager.applyToDOM();

        // 恢复音效按钮状态
        const btnAudio = document.getElementById('btnToggleAudio');
        if (btnAudio) {
            btnAudio.textContent = this.audio.enabled ? '🔊 音效: 开' : '🔇 音效: 关';
        }
    }

    bindEvents() {
        // 工具栏
        document.getElementById('btnRules').addEventListener('click', () => this.openModal('ruleModal'));
        document.getElementById('btnProof').addEventListener('click', () => this.openModal('proofModal'));
        document.getElementById('btnSkins').addEventListener('click', () => this.openModal('skinModal'));
        document.getElementById('btnToggleAudio').addEventListener('click', () => {
            const enabled = this.audio.toggle();
            document.getElementById('btnToggleAudio').textContent = enabled ? '🔊 音效: 开' : '🔇 音效: 关';
        });

        // 视口切换 (2D/3D)
        const btnViewMode = document.getElementById('btnToggle3D');
        if (btnViewMode) {
            btnViewMode.addEventListener('click', () => {
                this.viewMode = this.viewMode === '2d' ? '3d' : '2d';
                btnViewMode.textContent = this.viewMode === '3d' ? '📐 2D 平面图' : '🧊 3D 立体层叠';
                if (this.viewMode === '3d') {
                    this.boardContainer.classList.add('perspective-3d');
                } else {
                    this.boardContainer.classList.remove('perspective-3d');
                }
                this.audio.playClick();
                this.render();
            });
        }

        // 探索模式切换 (盲盒探索 vs 明牌全图鉴)
        if (this.btnModeBlind && this.btnModeCodex) {
            this.btnModeBlind.addEventListener('click', () => {
                this.praiseManager.setMode('blind');
                this.audio.playClick();
                this.render();
                this.praiseManager.showToast('已切换至【盲盒探索模式】：无剧透，全凭自己动手发现新厚度！', 2200);
            });
            this.btnModeCodex.addEventListener('click', () => {
                this.praiseManager.setMode('codex');
                this.audio.playClick();
                this.render();
                this.praiseManager.showToast('已切换至【明牌全图鉴模式】：已公开全部 9 重目标，点击可看教学演示！', 2200);
            });
        }

        // 清空收集历史
        if (this.btnClearCollection) {
            this.btnClearCollection.addEventListener('click', () => {
                this.openModal('clearConfirmModal');
            });
        }
        if (this.btnConfirmClear) {
            this.btnConfirmClear.addEventListener('click', () => {
                this.praiseManager.resetUnlocked();
                this.engine.reset();
                this.selectedCell = null;
                this.audio.playUndo();
                const modal = document.getElementById('clearConfirmModal');
                if (modal) modal.classList.add('hidden');
                this.render();
                this.praiseManager.showToast('✨ 已清空所有已发现记录，已重置为初始状态！开始全新探索吧！', 2600);
            });
        }

        // 操作栏
        document.getElementById('btnUndo').addEventListener('click', () => this.handleUndo());
        document.getElementById('btnReset').addEventListener('click', () => this.handleReset());
        document.getElementById('btnHint').addEventListener('click', () => this.handleHint());
        document.getElementById('btnToggleDemo').addEventListener('click', () => {
            const currentThick = this.engine.getThickness().maxThickness;
            // 演示下一个未解锁的目标厚度，若全解锁则演示16
            let target = ALL_TARGETS.find(t => !this.praiseManager.unlocked.has(t)) || 16;
            this.demo.startDemo(target);
        });

        // 演示面板按钮
        document.getElementById('btnDemoPlay').addEventListener('click', () => this.demo.togglePlay());
        document.getElementById('btnDemoPrev').addEventListener('click', () => this.demo.prevStep());
        document.getElementById('btnDemoNext').addEventListener('click', () => this.demo.nextStep());
        document.getElementById('btnDemoExit').addEventListener('click', () => this.demo.closeDemo());
        document.getElementById('demoSpeedSelect').addEventListener('change', (e) => this.demo.setSpeed(e.target.value));

        // 弹窗关闭
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.classList.add('hidden');
            });
        });
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.add('hidden');
            });
        });

        // 换皮肤卡片点击
        document.querySelectorAll('.skin-card').forEach(card => {
            card.addEventListener('click', () => {
                const skinId = card.getAttribute('data-skin');
                this.skinManager.setSkin(skinId);
                document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.audio.playClick();
                this.render();
            });
        });

        // 奥数挑战测验答题提交
        const btnSubmitQuiz = document.getElementById('btnSubmitQuiz');
        if (btnSubmitQuiz) {
            btnSubmitQuiz.addEventListener('click', () => this.handleQuizSubmit());
        }

        // 键盘快捷键
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'z' || e.key === 'Z') this.handleUndo();
            if (e.key === 'r' || e.key === 'R') this.handleReset();
            if (e.key === 'h' || e.key === 'H') this.handleHint();
        });

        // 吉祥物点击
        document.querySelector('.mascot-section').addEventListener('click', () => {
            this.mascotTextEl.textContent = this.praiseManager.getNextMascotHint();
            this.audio.playClick();
        });
    }

    handleUndo() {
        if (!this.engine.canUndo()) {
            this.praiseManager.showToast("已处于初始状态，无更早历史可撤销");
            return;
        }
        this.engine.undo();
        this.audio.playUndo();
        this.render();
    }

    handleReset() {
        this.engine.reset();
        this.selectedCell = null;
        this.audio.playUndo();
        this.render();
        this.praiseManager.showToast("纸片已重新抚平展平！");
    }

    handleHint() {
        // 寻找一个尚未解锁的目标厚度
        const missing = ALL_TARGETS.filter(t => !this.praiseManager.unlocked.has(t));
        if (missing.length === 0) {
            this.praiseManager.showToast("🎉 太棒了！9 种厚度已经全部被你集齐！");
            this.mascotTextEl.textContent = "呱！太强了！所有理论厚度全部斩获！你可以随时在教学演示中重温神技！";
            return;
        }
        const nextTarget = missing[0];
        const sol = FOLD_SOLUTIONS[nextTarget];
        this.praiseManager.showToast(`💡 提示目标【${sol.title}】：<br>${sol.explanation}`, 3800);
        this.mascotTextEl.textContent = `折纸鹤提示：试着挑战下一个目标【厚度 ${nextTarget}】吧！点击“演示折法”可看全流程！`;
        this.audio.playClick();
    }

    handleQuizSubmit() {
        const input = document.getElementById('quizAnswerInput');
        const feedback = document.getElementById('quizFeedback');
        if (!input || !feedback) return;

        const val = parseInt(input.value.trim(), 10);
        if (val === 9) {
            feedback.className = 'quiz-feedback success';
            feedback.innerHTML = `<strong>🎉 回答完全正确！答案就是 9 种！</strong><br>分别是：<strong>1, 2, 3, 4, 6, 8, 9, 12, 16</strong>。<br>数学证明：水平与垂直折叠沿网格完全独立，水平方向可能厚度为 {1,2,3,4}，垂直方向可能厚度为 {1,2,3,4}，两者笛卡尔积乘积正好为这 9 个整数！`;
            this.audio.playUnlock();
            this.praiseManager.fireConfetti();
        } else {
            feedback.className = 'quiz-feedback error';
            feedback.innerHTML = `<strong>❌ 遗憾不对哦！再仔细想想：</strong><br>提示：水平方向折叠最多能产生 1、2、3、4 层，垂直方向也是 1、2、3、4 层，两者组合相乘会有多少个不同的乘积结果呢？再试一次！`;
            this.audio.playUndo();
        }
    }

    openModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) m.classList.remove('hidden');
        this.audio.playClick();
    }

    executeFold(axis, line, direction, desc) {
        this.engine.fold(axis, line, direction, desc);
        this.audio.playFold();
        this.render();

        const thickInfo = this.engine.getThickness();
        const currentThick = thickInfo.maxThickness;

        // 检查新成就
        const isNew = this.praiseManager.checkThickness(currentThick);
        if (isNew) {
            this.audio.playUnlock();
            this.praiseManager.fireConfetti();
            const quote = this.praiseManager.getRandomQuote(currentThick);
            this.praiseManager.showToast(`🌟 <strong>全新厚度发现！【${currentThick} 层】</strong><br>${quote}`, 3200);
            this.mascotTextEl.innerHTML = `🌟 哇！你解锁了全新的 <strong>厚度 ${currentThick}</strong>！太机智了！`;

            // 检查大满贯全部集齐
            if (this.praiseManager.isComplete()) {
                setTimeout(() => {
                    this.audio.playWin();
                    this.praiseManager.fireConfetti();
                    this.openModal('winModal');
                }, 800);
            }
        } else {
            this.audio.playCrease();
            const quote = this.praiseManager.getRandomQuote(currentThick);
            this.mascotTextEl.textContent = quote;
        }
    }

    render() {
        const dim = this.engine.getDimensions();
        const thickInfo = this.engine.getThickness();
        const currentThick = thickInfo.maxThickness;

        // 1. 统计栏更新
        this.statThickEl.textContent = currentThick;
        this.statStepsEl.textContent = this.engine.history.length;
        this.statDimEl.textContent = `${dim.width} × ${dim.height}`;

        // 2. 成就徽章栏
        this.renderBadges(currentThick);

        // 3. 渲染折纸棋盘
        this.renderBoard(dim, thickInfo);

        // 4. 渲染单元格透视抽屉
        this.renderInspector();
    }

    renderBadges(currentThick) {
        this.badgeTrackEl.innerHTML = '';
        const count = this.praiseManager.getUnlockedCount();
        const progressEl = document.getElementById('collectionProgress');

        if (this.praiseManager.mode === 'blind') {
            // 盲盒探索模式：防剧透
            if (this.btnModeBlind) this.btnModeBlind.classList.add('active');
            if (this.btnModeCodex) this.btnModeCodex.classList.remove('active');
            if (this.achievementTitleEl) {
                this.achievementTitleEl.textContent = '🔍 自由盲盒探索（自己动手折叠，探索你能发现几种厚度）：';
            }
            if (this.statProgressLabelEl) {
                this.statProgressLabelEl.textContent = '已探索不同厚度';
            }
            if (progressEl) {
                progressEl.textContent = `${count} 种`;
            }

            // 仅渲染当前玩家已探索出的厚度
            const unlockedList = [...this.praiseManager.unlocked].sort((a, b) => a - b);
            unlockedList.forEach(target => {
                const isCurrent = target === currentThick;
                const badge = document.createElement('div');
                badge.className = `thickness-badge unlocked ${isCurrent ? 'current' : ''}`;
                badge.title = `已发现厚度 ${target} 层 (点击查看复现步骤)`;

                badge.innerHTML = `
                    <span class="badge-icon">⭐</span>
                    <span class="badge-num">${target}层</span>
                `;

                badge.addEventListener('click', () => {
                    this.audio.playClick();
                    this.demo.startDemo(target);
                });

                this.badgeTrackEl.appendChild(badge);
            });

            // 添加神秘未解卡槽
            if (!this.praiseManager.isComplete()) {
                const mysteryBadge = document.createElement('div');
                mysteryBadge.className = 'thickness-badge mystery';
                mysteryBadge.title = '继续翻折纸片，看看还能发现什么全新层数！';
                mysteryBadge.innerHTML = `
                    <span class="badge-icon">❓</span>
                    <span class="badge-num">探索未知厚度...</span>
                `;
                mysteryBadge.addEventListener('click', () => {
                    this.praiseManager.showToast('💡 盲探提示：试着沿不同虚线多折几次，看看能创造出什么新的层数！');
                    this.audio.playClick();
                });
                this.badgeTrackEl.appendChild(mysteryBadge);
            }
        } else {
            // 明牌全图鉴模式：公开 9 重目标与演示
            if (this.btnModeCodex) this.btnModeCodex.classList.add('active');
            if (this.btnModeBlind) this.btnModeBlind.classList.remove('active');
            if (this.achievementTitleEl) {
                this.achievementTitleEl.textContent = '🏆 9 重理论厚度全收集图鉴（点击任意厚度可观看演示或提示）：';
            }
            if (this.statProgressLabelEl) {
                this.statProgressLabelEl.textContent = '9 重厚度全收集';
            }
            if (progressEl) {
                progressEl.textContent = `${count} / 9`;
            }

            ALL_TARGETS.forEach(target => {
                const unlocked = this.praiseManager.unlocked.has(target);
                const isCurrent = target === currentThick;
                const badge = document.createElement('div');
                badge.className = `thickness-badge ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`;
                badge.title = unlocked ? `已解锁厚度 ${target} 层 (点击可看解法演示)` : `未解锁厚度 ${target} 层 (点击查看提示与演示)`;

                const icon = unlocked ? '⭐' : '🔒';
                badge.innerHTML = `
                    <span class="badge-icon">${icon}</span>
                    <span class="badge-num">${target}层</span>
                `;

                badge.addEventListener('click', () => {
                    this.audio.playClick();
                    this.demo.startDemo(target);
                });

                this.badgeTrackEl.appendChild(badge);
            });
        }
    }

    renderBoard(dim, thickInfo) {
        this.boardEl.innerHTML = '';
        const width = dim.width;
        const height = dim.height;

        // 设定网格 CSS grid 布局
        this.boardEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        this.boardEl.style.gridTemplateRows = `repeat(${height}, 1fr)`;

        // 获取每个格子
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const stack = this.engine.getCellStack(c, r);
                const count = stack.length;
                const topSq = stack[stack.length - 1];

                const cell = document.createElement('div');
                cell.className = `paper-cell ${count > 1 ? 'has-stack' : ''} ${this.selectedCell && this.selectedCell.x === c && this.selectedCell.y === r ? 'selected' : ''}`;
                cell.setAttribute('data-x', c);
                cell.setAttribute('data-y', r);

                // 2D 颜色与热力图
                if (topSq) {
                    const baseColor = this.skinManager.getSquareColor(topSq.id, topSq.faceUp);
                    cell.style.backgroundColor = baseColor;
                }

                // 3D 立体模式下的物理堆叠厚度与阴影
                if (this.viewMode === '3d') {
                    const depthPx = Math.min(count * 3, 40);
                    cell.style.transform = `translateZ(${depthPx}px)`;
                    cell.style.boxShadow = `0 ${depthPx * 0.8}px ${depthPx * 1.5}px rgba(0,0,0,0.35)`;
                } else {
                    cell.style.transform = '';
                    cell.style.boxShadow = '';
                }

                // 单元格内容展示
                if (topSq) {
                    cell.innerHTML = `
                        <div class="cell-top-id">#${topSq.id}</div>
                        <div class="cell-orig-coord">(${topSq.r0 + 1},${topSq.c0 + 1})</div>
                        ${count > 1 ? `<div class="cell-layer-badge">×${count}</div>` : ''}
                    `;
                }

                // 点击选中单元格进行透视查看
                cell.addEventListener('click', () => {
                    this.selectedCell = { x: c, y: r };
                    this.audio.playClick();
                    this.render();
                });

                this.boardEl.appendChild(cell);
            }
        }

        // 渲染折线与交互翻折手柄
        this.renderCreaseControls(dim);
    }

    renderCreaseControls(dim) {
        const { width, height } = dim;
        const container = document.getElementById('creaseControlsOverlay');
        if (!container) return;
        container.innerHTML = '';

        // 垂直折线控制 (竖向分割线)
        for (let x = 1; x < width; x++) {
            const vLine = document.createElement('div');
            vLine.className = 'crease-line crease-vertical';
            vLine.style.left = `${(x / width) * 100}%`;

            // 折叠操作箭头
            const btnLeftToRight = document.createElement('button');
            btnLeftToRight.className = 'fold-arrow-btn fold-arrow-right';
            btnLeftToRight.title = `沿竖线 x=${x} 从左向右翻折`;
            btnLeftToRight.innerHTML = '👉 右折';
            btnLeftToRight.addEventListener('click', (e) => {
                e.stopPropagation();
                this.executeFold('v', x, 'L->R', `沿竖线 x=${x} 向右折叠`);
            });

            const btnRightToLeft = document.createElement('button');
            btnRightToLeft.className = 'fold-arrow-btn fold-arrow-left';
            btnRightToLeft.title = `沿竖线 x=${x} 从右向左翻折`;
            btnRightToLeft.innerHTML = '👈 左折';
            btnRightToLeft.addEventListener('click', (e) => {
                e.stopPropagation();
                this.executeFold('v', x, 'R->L', `沿竖线 x=${x} 向左折叠`);
            });

            vLine.appendChild(btnLeftToRight);
            vLine.appendChild(btnRightToLeft);
            container.appendChild(vLine);
        }

        // 水平折线控制 (横向分割线)
        for (let y = 1; y < height; y++) {
            const hLine = document.createElement('div');
            hLine.className = 'crease-line crease-horizontal';
            hLine.style.top = `${(y / height) * 100}%`;

            const btnTopToBottom = document.createElement('button');
            btnTopToBottom.className = 'fold-arrow-btn fold-arrow-down';
            btnTopToBottom.title = `沿横线 y=${y} 从上向下翻折`;
            btnTopToBottom.innerHTML = '👇 下折';
            btnTopToBottom.addEventListener('click', (e) => {
                e.stopPropagation();
                this.executeFold('h', y, 'T->B', `沿横线 y=${y} 向下折叠`);
            });

            const btnBottomToTop = document.createElement('button');
            btnBottomToTop.className = 'fold-arrow-btn fold-arrow-up';
            btnBottomToTop.title = `沿横线 y=${y} 从下向上翻折`;
            btnBottomToTop.innerHTML = '👆 上折';
            btnBottomToTop.addEventListener('click', (e) => {
                e.stopPropagation();
                this.executeFold('h', y, 'B->T', `沿横线 y=${y} 向上折叠`);
            });

            hLine.appendChild(btnTopToBottom);
            hLine.appendChild(btnBottomToTop);
            container.appendChild(hLine);
        }
    }

    renderInspector() {
        if (!this.selectedCell) {
            // 默认选中厚度最大的格子
            const thickInfo = this.engine.getThickness();
            let maxK = null;
            let maxCount = -1;
            for (const key in thickInfo.counts) {
                if (thickInfo.counts[key] > maxCount) {
                    maxCount = thickInfo.counts[key];
                    maxK = key;
                }
            }
            if (maxK) {
                const [cx, cy] = maxK.split(',').map(Number);
                this.selectedCell = { x: cx, y: cy };
            }
        }

        if (!this.selectedCell) {
            this.inspectorContentEl.innerHTML = `<p class="inspector-placeholder">点击棋盘上方格，透视内部层层堆叠细节</p>`;
            return;
        }

        const stack = this.engine.getCellStack(this.selectedCell.x, this.selectedCell.y);
        if (stack.length === 0) {
            this.inspectorContentEl.innerHTML = `<p class="inspector-placeholder">该位置无方格</p>`;
            return;
        }

        let html = `
            <div class="inspector-header">
                <strong>位置 (${this.selectedCell.x + 1}, ${this.selectedCell.y + 1}) 处重叠层数：<span style="color:#d81b60; font-size:1.3rem;">${stack.length} 层</span></strong>
                <span style="font-size:0.85rem; color:#666;">（从底层到顶层排列）</span>
            </div>
            <div class="stack-layers-list">
        `;

        stack.forEach((sq, idx) => {
            const isTop = idx === stack.length - 1;
            const faceStr = sq.faceUp ? '正面朝上 📄' : '反面朝上 🔄';
            const color = this.skinManager.getSquareColor(sq.id, sq.faceUp);
            html += `
                <div class="stack-layer-item ${isTop ? 'top-layer' : ''}" style="border-left: 6px solid ${color};">
                    <span class="layer-z">第 ${idx + 1} 层 (z=${sq.z})</span>
                    <span class="layer-id">方格 #${sq.id}</span>
                    <span class="layer-orig">原位置: 行${sq.r0 + 1}列${sq.c0 + 1}</span>
                    <span class="layer-face">${faceStr}</span>
                    ${isTop ? '<span class="badge-top">最顶面 (可视)</span>' : ''}
                </div>
            `;
        });

        html += `</div>`;
        this.inspectorContentEl.innerHTML = html;
    }
}

// 页面加载完成后实例化
window.addEventListener('DOMContentLoaded', () => {
    window.gameUI = new FoldUI();
});
