// codex: 2026-11-13 自动教学演示控制器，支持任意目标厚度的单步执行、连续播放与战术讲解

class DemoController {
    constructor(engine, audio, ui) {
        this.engine = engine;
        this.audio = audio;
        this.ui = ui;
        this.isPlaying = false;
        this.timer = null;
        this.speed = 1.0;
        this.currentThickness = 16;
        this.steps = [];
        this.currentStepIdx = 0;
    }

    startDemo(thickness) {
        if (!FOLD_SOLUTIONS[thickness]) return;
        this.currentThickness = thickness;
        const sol = FOLD_SOLUTIONS[thickness];
        this.steps = sol.steps;
        this.currentStepIdx = 0;

        // 重置棋盘到初始未折叠状态
        this.engine.reset();
        this.ui.render();

        const panel = document.getElementById('demoPanel');
        if (panel) panel.classList.remove('hidden');

        document.getElementById('demoTitle').textContent = `🎓 教学演示：【${sol.title}】`;
        this.updateStatus();
    }

    updateStatus() {
        const sol = FOLD_SOLUTIONS[this.currentThickness];
        const statusEl = document.getElementById('demoStatus');
        const explainEl = document.getElementById('demoExplain');

        if (this.steps.length === 0) {
            statusEl.textContent = `无需折叠 (已是厚度 1)`;
            explainEl.innerHTML = `<strong>【原理解读】</strong> ${sol.explanation}`;
            return;
        }

        statusEl.textContent = `步骤: ${this.currentStepIdx} / ${this.steps.length}`;

        if (this.currentStepIdx === 0) {
            explainEl.innerHTML = `<strong>【准备就绪】</strong> 点击“▶ 播放”或“⏭ 下一步”观看折法演示。<br>目标厚度：<strong>${this.currentThickness} 层</strong> (${sol.difficulty})`;
        } else if (this.currentStepIdx <= this.steps.length) {
            const step = this.steps[this.currentStepIdx - 1];
            explainEl.innerHTML = `<strong>【第 ${this.currentStepIdx} 步】</strong> ${step.desc}<br><span style="color:#555;">${sol.explanation}</span>`;
        }
    }

    nextStep() {
        if (this.currentStepIdx >= this.steps.length) {
            this.pause();
            return false;
        }

        const step = this.steps[this.currentStepIdx];
        this.engine.fold(step.axis, step.line, step.direction, step.desc);
        this.audio.playFold();
        this.currentStepIdx++;

        // 同步登记可能产生的新厚度成就，确保教学演示走步时成就徽章即时亮起
        const currentThick = this.engine.getThickness().maxThickness;
        this.ui.praiseManager.checkThickness(currentThick);

        this.ui.render();
        this.updateStatus();

        if (this.currentStepIdx >= this.steps.length) {
            this.audio.playCrease();
            this.pause();
            return false;
        }
        return true;
    }

    prevStep() {
        if (this.currentStepIdx <= 0) return;
        this.engine.undo();
        this.audio.playUndo();
        this.currentStepIdx--;
        this.ui.render();
        this.updateStatus();
    }

    play() {
        if (this.currentStepIdx >= this.steps.length) {
            // 已到末尾，从头重置
            this.engine.reset();
            this.currentStepIdx = 0;
            this.ui.render();
            this.updateStatus();
        }

        this.isPlaying = true;
        const playBtn = document.getElementById('btnDemoPlay');
        if (playBtn) playBtn.textContent = '⏸ 暂停';

        const runLoop = () => {
            if (!this.isPlaying) return;
            const hasMore = this.nextStep();
            if (hasMore) {
                const delay = 1200 / this.speed;
                this.timer = setTimeout(runLoop, delay);
            } else {
                this.pause();
            }
        };

        const initialDelay = 400 / this.speed;
        this.timer = setTimeout(runLoop, initialDelay);
    }

    pause() {
        this.isPlaying = false;
        if (this.timer) clearTimeout(this.timer);
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

    setSpeed(spd) {
        this.speed = parseFloat(spd) || 1.0;
    }

    closeDemo() {
        this.pause();
        const panel = document.getElementById('demoPanel');
        if (panel) panel.classList.add('hidden');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DemoController };
} else {
    window.DemoController = DemoController;
}
