// codex: 2026-11-24 升级一步步教学指导控制器，动态适配任意边长 N (2..25) 的思维课堂与最优解分步示范/互动跟练

class GuideController {
    constructor(engine, audio, ui) {
        this.engine = engine;
        this.audio = audio;
        this.ui = ui;

        this.isOpen = false;
        this.mode = 'thinking'; // 'thinking' | 'stepdemo'
        this.lessonIdx = 0;

        this.stepIdx = 0;
        this.isPlaying = false;
        this.practiceMode = false;
        this.speed = 1.0;
        this.timer = null;
    }

    _getLessons() {
        return getGuidedLessonsForSize(this.engine.boardSize);
    }

    _getOptimalSteps() {
        return getOptimalStepsForSize(this.engine.boardSize);
    }

    /**
     * 切换棋盘边长 N 时刷新教学胶囊按钮与状态
     */
    onBoardSizeChanged() {
        this.pause();
        this.lessonIdx = 0;
        this.stepIdx = 0;
        this.practiceMode = false;
        this._renderLessonPills();
        if (this.isOpen) {
            this.switchMode(this.mode);
        }
    }

    _renderLessonPills() {
        const container = document.getElementById('lessonPillsContainer');
        if (!container) return;
        const lessons = this._getLessons();
        container.innerHTML = '';

        const tabThinking = document.getElementById('btnGuideTabThinking');
        if (tabThinking) {
            tabThinking.textContent = `💡 启发式思维课（${lessons.length}课）`;
        }

        lessons.forEach((lesson, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `lesson-pill-btn${idx === this.lessonIdx ? ' active' : ''}`;
            btn.dataset.lesson = idx;
            btn.textContent = `${lesson.badge}：${lesson.shortTitle || lesson.title}`;
            btn.addEventListener('click', () => this.showLesson(idx));
            container.appendChild(btn);
        });
    }

    open(initialMode = 'thinking') {
        this.isOpen = true;
        this._renderLessonPills();
        const panel = document.getElementById('guidePanel');
        if (panel) panel.classList.remove('hidden');
        this.switchMode(initialMode);
    }

    close() {
        this.pause();
        this.isOpen = false;
        this.practiceMode = false;
        this.ui.clearGhostHint();
        const panel = document.getElementById('guidePanel');
        if (panel) panel.classList.add('hidden');
        this.ui.render();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open('thinking');
        }
    }

    switchMode(newMode) {
        this.pause();
        this.mode = newMode;
        this.practiceMode = false;
        this.ui.clearGhostHint();

        const tabThinking = document.getElementById('btnGuideTabThinking');
        const tabDemo = document.getElementById('btnGuideTabDemo');
        const thinkingControls = document.getElementById('guideThinkingControls');
        const demoControls = document.getElementById('guideDemoControls');

        if (tabThinking) tabThinking.classList.toggle('active', newMode === 'thinking');
        if (tabDemo) tabDemo.classList.toggle('active', newMode === 'stepdemo');
        if (thinkingControls) thinkingControls.classList.toggle('hidden', newMode !== 'thinking');
        if (demoControls) demoControls.classList.toggle('hidden', newMode !== 'stepdemo');

        if (newMode === 'thinking') {
            this._renderLessonPills();
            this.showLesson(this.lessonIdx);
        } else {
            this.startStepDemo(false);
        }
    }

    /* ======================== 模式 1：启发式思维课 ======================== */

    showLesson(idx) {
        const lessons = this._getLessons();
        if (idx < 0) idx = 0;
        if (idx >= lessons.length) idx = lessons.length - 1;
        this.lessonIdx = idx;

        const lesson = lessons[idx];
        this.engine.loadLayout(lesson.layout);
        this.audio.playChime();
        this.ui.clearGhostHint();
        this.ui.render();

        const titleEl = document.getElementById('guideTitle');
        const statusEl = document.getElementById('guideStatus');
        const explainEl = document.getElementById('guideExplain');

        if (titleEl) {
            titleEl.textContent = `🎓 思维课堂 (${this.engine.boardSize}×${this.engine.boardSize}) · ${lesson.badge}：${lesson.title}`;
        }
        if (statusEl) {
            statusEl.textContent = `进度：第 ${idx + 1} / ${lessons.length} 课`;
        }
        if (explainEl) {
            explainEl.innerHTML = lesson.explain;
        }

        document.querySelectorAll('#lessonPillsContainer .lesson-pill-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === idx);
        });

        if (lesson.interactivePractice) {
            const suggested = Math.min(
                lesson.practiceSuggestedSize || 1,
                this.engine.maxPieceSize
            );
            this.ui.selectSize(suggested);
            this.ui.praiseManager.setMascotText(
                '动手时刻到！我已经帮你摆好了关键大块，剩下的空隙交给你亲手填满，试试看最少能用几片！✨'
            );
        } else {
            this.ui.praiseManager.setMascotText(
                `正在学习 ${lesson.badge}：${lesson.summary}`
            );
        }
    }

    prevLesson() {
        if (this.lessonIdx > 0) this.showLesson(this.lessonIdx - 1);
    }

    nextLesson() {
        const lessons = this._getLessons();
        if (this.lessonIdx < lessons.length - 1) this.showLesson(this.lessonIdx + 1);
    }

    /* ======================== 模式 2：当前边长最优解分步拆解 ======================== */

    startStepDemo(practice = false) {
        this.pause();
        this.practiceMode = practice;
        this.stepIdx = 0;
        this.engine.reset(false);
        this.ui.clearGhostHint();

        const practiceBtn = document.getElementById('btnGuidePractice');
        if (practiceBtn) {
            practiceBtn.classList.toggle('active', this.practiceMode);
            practiceBtn.textContent = this.practiceMode
                ? '🖐️ 退出互动跟练'
                : '🖐️ 切换互动跟练';
        }

        if (this.practiceMode) {
            this._highlightPracticeTarget();
        }
        this.ui.render();
        this._updateDemoText();
    }

    togglePracticeMode() {
        this.startStepDemo(!this.practiceMode);
        this.audio.playChime();
    }

    _highlightPracticeTarget() {
        const steps = this._getOptimalSteps();
        if (this.stepIdx >= steps.length) {
            this.ui.clearGhostHint();
            return;
        }
        const target = steps[this.stepIdx];
        this.ui.selectSize(target.size);
        this.ui.setGhostHint(target);
    }

    handlePracticePlacement(row, col, size) {
        if (!this.isOpen || this.mode !== 'stepdemo' || !this.practiceMode) {
            return false;
        }
        const steps = this._getOptimalSteps();
        if (this.stepIdx >= steps.length) return false;

        const target = steps[this.stepIdx];
        if (row === target.row && col === target.col && size === target.size) {
            this.engine.placePiece(target.row, target.col, target.size, true);
            this.audio.playSnip(target.size);
            this.stepIdx++;
            if (this.stepIdx < steps.length) {
                this._highlightPracticeTarget();
            } else {
                this.ui.clearGhostHint();
                this.practiceMode = false;
                const practiceBtn = document.getElementById('btnGuidePractice');
                if (practiceBtn) {
                    practiceBtn.classList.remove('active');
                    practiceBtn.textContent = '🖐️ 切换互动跟练';
                }
                this.ui.onBoardCompleted();
            }
            this.ui.render();
            this._updateDemoText();
            return true;
        }
        this.audio.playInvalid();
        this.ui.praiseManager.showToast(
            `跟练提示：请点击棋盘上闪烁的虚线框位置，放入 ${target.size}×${target.size} 哦！`
        );
        return true;
    }

    nextStep() {
        const steps = this._getOptimalSteps();
        if (this.stepIdx >= steps.length) {
            this.pause();
            return false;
        }
        const step = steps[this.stepIdx];
        this.engine.placePiece(step.row, step.col, step.size, true);
        this.audio.playSnip(step.size);
        this.stepIdx++;

        if (this.practiceMode) {
            this._highlightPracticeTarget();
        } else {
            this.ui.clearGhostHint();
        }

        this.ui.render();
        this._updateDemoText();

        if (this.stepIdx >= steps.length) {
            this.pause();
            this.ui.onBoardCompleted();
            return false;
        }
        return true;
    }

    prevStep() {
        if (this.stepIdx <= 0) return;
        this.pause();
        this.engine.undo();
        this.audio.playUndo();
        this.stepIdx--;
        if (this.practiceMode) {
            this._highlightPracticeTarget();
        }
        this.ui.render();
        this._updateDemoText();
    }

    play() {
        const steps = this._getOptimalSteps();
        if (this.practiceMode) {
            this.practiceMode = false;
            this.ui.clearGhostHint();
            const practiceBtn = document.getElementById('btnGuidePractice');
            if (practiceBtn) {
                practiceBtn.classList.remove('active');
                practiceBtn.textContent = '🖐️ 切换互动跟练';
            }
        }
        if (this.stepIdx >= steps.length) {
            this.engine.reset(false);
            this.stepIdx = 0;
            this.ui.render();
            this._updateDemoText();
        }
        this.isPlaying = true;
        const playBtn = document.getElementById('btnDemoPlay');
        if (playBtn) playBtn.textContent = '⏸ 暂停';

        const runLoop = () => {
            if (!this.isPlaying) return;
            const hasMore = this.nextStep();
            if (hasMore) {
                this.timer = setTimeout(runLoop, 1100 / this.speed);
            } else {
                this.pause();
            }
        };
        this.timer = setTimeout(runLoop, 350 / this.speed);
    }

    pause() {
        this.isPlaying = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        const playBtn = document.getElementById('btnDemoPlay');
        if (playBtn) playBtn.textContent = '▶ 播放';
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    setSpeed(val) {
        this.speed = parseFloat(val) || 1.0;
    }

    _updateDemoText() {
        const steps = this._getOptimalSteps();
        const n = this.engine.boardSize;
        const titleEl = document.getElementById('guideTitle');
        const statusEl = document.getElementById('guideStatus');
        const explainEl = document.getElementById('guideExplain');

        if (titleEl) {
            titleEl.textContent = this.practiceMode
                ? `🖐️ ${n}×${n} 互动跟练：跟着虚线框亲手剪出最优方案`
                : `🎬 ${n}×${n} 最优剪法分步示范`;
        }
        if (statusEl) {
            statusEl.textContent = `步骤：${this.stepIdx} / ${steps.length}`;
        }
        if (!explainEl) return;

        if (this.practiceMode && this.stepIdx < steps.length) {
            const target = steps[this.stepIdx];
            explainEl.innerHTML = `<strong>【请动手 · ${target.title}】</strong> 请点击棋盘上闪烁的虚线框，剪下一块 <strong>${target.size}×${target.size}</strong> 正方形！<br><span style="color:#5d4037;">${target.desc}</span>`;
        } else if (this.stepIdx === 0) {
            explainEl.innerHTML = `<strong>【准备就绪】</strong> 点击「▶ 播放」或「⏭ 下一步」逐步观看 <strong>${n}×${n}</strong> 最优剪法演示，或点击「🖐️ 切换互动跟练」亲手跟着剪！`;
        } else {
            const cur = steps[this.stepIdx - 1];
            explainEl.innerHTML = `<strong>【${cur.title}】</strong> ${cur.desc}`;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GuideController };
} else {
    window.GuideController = GuideController;
}
