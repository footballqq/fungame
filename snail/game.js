// codex: 2026-01-25 冒险模式作弊：玩家选蜗牛时尽可能让其踩雷
const STRINGS = {
    EN: {
        title: "Snail vs Monsters",
        btn_menu: "Menu",
        btn_restart: "Restart Level",
        btn_rules: "Game Rules",
        btn_close: "Close",
        dialog_ok: "OK",
        btn_stop: "Stop",
        btn_resume: "Resume",
        btn_log: "Log",
        log_title: "Snail Log",
        btn_copy: "Copy",
        btn_clear: "Clear",
        speed_label: "Snail speed",
        mastermind_hint: "Click the snail to place a monster and stop it. How many times can you stop the smart snail?",
        btn_explain: "Explain",
        explain_title: "Why 3 attempts is optimal",
        explain_prev: "Prev",
        explain_next: "Next",
        explain_close: "Close",
        intro_p1: "Welcome to the maze! Hidden monsters are waiting.",
        intro_p2: "Choose your side:",
        mode_adventure_title: "Adventure Mode",
        mode_adventure_desc: "You are the Snail. Explore the grid, discover safe paths, and reach the finish line.",
        mode_mastermind_title: "Mastermind Mode",
        mode_mastermind_desc: "You are the Monster. Place traps to stop the Smart AI Snail.",
        stat_attempts: "Attempts",
        stat_status: "Status",
        status_ready: "Ready. Click start row to begin.",
        status_moving: "Moving...",
        status_win: "Victory!",
        status_hit: "Ouch! Monster hit!",
        msg_reset: "Snail Reset!",
        msg_ai_safe: "AI found safe path! Speeding up!",
        msg_ai_blocked: "AI blocked. Calculating Z-pattern...",
        msg_intercept: "Intercepted! Monster placed.",
        msg_bad_place: "Invalid Placement! (Row/Col constraint)",
        msg_bad_place_safe: "Invalid Placement! This cell is already confirmed safe.",
        msg_bad_place_row: "This row already has a monster.",
        msg_bad_place_col: "This column already has a monster.",
        msg_rules_reminder_row_missing: "Rule reminder: each middle row must have exactly one monster.\nTip: in Mastermind mode, click the snail to place a monster.\nSnail paused. Click OK to start the next attempt.",
        rules_title: "Game Rules",
        rules_generic: "Goal: Move from Row 1 to the Last Row.",
        rules_monsters_title: "Monsters:",
        rules_m1: "Hidden in Rows 2 to N-1.",
        rules_m2: "Exactly ONE monster per ROW.",
        rules_m3: "At most ONE monster per COLUMN.",
        rules_snail_title: "The Snail:",
        rules_s1: "Can move Up, Down, Left, Right to adjacent cells.",
        rules_s2: "If it hits a monster, it restarts from Row 1.",
        rules_s3: "Monsters remain revealed after discovery.",
        victory_title: "VICTORY!",
        victory_msg: "You completed the maze!"
    },
    CN: {
        title: "蜗牛与怪物",
        btn_menu: "主菜单",
        btn_restart: "重置关卡",
        btn_rules: "游戏规则",
        btn_close: "关闭",
        dialog_ok: "知道了",
        btn_stop: "停止",
        btn_resume: "继续",
        btn_log: "日志",
        log_title: "蜗牛日志",
        btn_copy: "复制",
        btn_clear: "清空",
        speed_label: "蜗牛速度",
        mastermind_hint: "点击蜗牛放置怪物阻止蜗牛。看看你能阻止聪明的蜗牛几次？",
        btn_explain: "解释",
        explain_title: "为什么 3 次就是最优解",
        explain_prev: "上一步",
        explain_next: "下一步",
        explain_close: "关闭",
        intro_p1: "欢迎来到迷宫！小心隐藏的怪物。",
        intro_p2: "请选择你的角色：",
        mode_adventure_title: "冒险模式 (我是蜗牛)",
        mode_adventure_desc: "你扮演蜗牛。探索网格，发现安全路径，到达终点。",
        mode_mastermind_title: "主宰模式 (我是怪物)",
        mode_mastermind_desc: "你扮演怪物。设置陷阱阻止智能AI蜗牛。",
        stat_attempts: "尝试次数",
        stat_status: "状态",
        status_ready: "准备就绪。点击第一行开始。",
        status_moving: "移动中...",
        status_win: "胜利！",
        status_hit: "哎哟！撞到怪物了！",
        msg_reset: "蜗牛已重置！",
        msg_ai_safe: "AI发现安全路径！加速中！",
        msg_ai_blocked: "AI受阻。计算Z字形走法...",
        msg_intercept: "拦截成功！放置怪物。",
        msg_bad_place: "放置失败！违反规则（同行/同列已有怪物）",
        msg_bad_place_safe: "放置失败！该格已被蜗牛走过，必为安全格，不能放怪物。",
        msg_bad_place_row: "该行已有怪物。",
        msg_bad_place_col: "该列已有怪物。",
        msg_rules_reminder_row_missing: "规则提示：中间每一行必须且只能有 1 个怪物。\n提示：主宰模式请点击蜗牛放置怪物。\n蜗牛已暂停行动，请点击“确定”开始下一次探索。",
        rules_title: "游戏规则",
        rules_generic: "目标：从第一行到达最后一行。",
        rules_monsters_title: "关于怪物：",
        rules_m1: "隐藏在第 2 行到第 N-1 行。",
        rules_m2: "每一行 *必须且只能* 有一个怪物。",
        rules_m3: "每一列 *最多* 有一个怪物。",
        rules_snail_title: "关于蜗牛：",
        rules_s1: "可以向上下左右相邻格子移动。",
        rules_s2: "如果撞到怪物，尝试结束，重置回起点。",
        rules_s3: "被撞到的怪物会永久显示。",
        victory_title: "游戏胜利！",
        victory_msg: "恭喜你完成了迷宫！"
    }
};

class GameController {
    constructor() {
        this.lang = 'CN';
        this.mode = null;
        this.rows = 10;
        this.cols = 9;

        this.currentGame = null;
        this.isAiPaused = false; // 是否暂停蜗牛（用于 Mastermind 自动移动）
        this.snailLogLines = []; // 蜗牛行动记录（用于 debug）
        this.maxSnailLogLines = 2000; // 日志上限，避免过大卡顿
        this.aiMoveDelayMs = 600; // aiMoveDelayMs：主宰模式蜗牛每步移动延迟（毫秒）

        // UI Elements
        this.uiOverlay = document.getElementById('start-overlay');
        this.uiGame = document.getElementById('game-ui');
        this.uiRules = document.getElementById('rules-overlay');
        this.uiVictory = document.getElementById('victory-modal');
        this.uiDialog = document.getElementById('cute-dialog'); // 可爱对话框容器
        this.dialogMessage = document.getElementById('cute-dialog-message'); // 可爱对话框正文
        this.btnDialogOk = document.getElementById('btn-dialog-ok'); // 可爱对话框确认按钮
        this.btnStopAi = document.getElementById('btn-stop-ai'); // 停止蜗牛按钮
        this.btnResumeAi = document.getElementById('btn-resume-ai'); // 继续蜗牛按钮
        this.btnToggleLog = document.getElementById('btn-toggle-log'); // 展开/收起日志
        this.logPanel = document.getElementById('snail-log-panel'); // 日志面板
        this.logTextarea = document.getElementById('snail-log-textarea'); // 日志文本框
        this.btnCopyLog = document.getElementById('btn-copy-log'); // 复制日志
        this.btnClearLog = document.getElementById('btn-clear-log'); // 清空日志
        this.aiSpeedControl = document.getElementById('ai-speed-control'); // 速度控制容器
        this.inputAiSpeed = document.getElementById('input-ai-speed'); // 速度滑块
        this.aiSpeedValue = document.getElementById('ai-speed-value'); // 速度数值展示
        this.mastermindHint = document.getElementById('mastermind-hint'); // 主宰模式引导文案
        this.btnExplain = document.getElementById('btn-explain'); // 解释按钮（主宰模式）
        this.explainOverlay = document.getElementById('explain-overlay'); // 解释弹层
        this.explainText = document.getElementById('explain-text'); // 解释正文
        this.explainStep = document.getElementById('explain-step'); // 步骤展示
        this.btnExplainPrev = document.getElementById('btn-explain-prev'); // 上一步
        this.btnExplainNext = document.getElementById('btn-explain-next'); // 下一步
        this.btnExplainClose = document.getElementById('btn-explain-close'); // 关闭
        this.explainBoard = document.getElementById('explain-board'); // 演示棋盘容器
        this.explainArrowLayer = document.getElementById('explain-arrow-layer'); // 箭头 SVG 图层

        this.inputRows = document.getElementById('input-rows');
        this.inputCols = document.getElementById('input-cols');
        this.btnLangCN = document.getElementById('btn-lang-cn');
        this.btnLangEN = document.getElementById('btn-lang-en');
        // Mode Cards
        this.cardAdventure = document.getElementById('card-adventure');
        this.cardMastermind = document.getElementById('card-mastermind');
        // Nav
        this.btnBack = document.getElementById('btn-back-menu');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnShowRules = document.getElementById('btn-show-rules');
        this.btnCloseRules = document.getElementById('btn-close-rules');

        // Victory
        this.btnVicRestart = document.getElementById('btn-victory-restart');
        this.btnVicMenu = document.getElementById('btn-victory-menu');
        this.dialogTimer = null; // 对话框自动关闭计时器
        this.dialogOkHandler = null; // dialogOkHandler：对话框“确定”按钮回调（用于暂停流程继续）

        this.explainIndex = 0; // explainIndex：交互式解释当前步骤索引
        this.explainWasPaused = false; // explainWasPaused：打开解释前是否已暂停 AI

        this.init();
    }

    init() {
        this.updateLanguageUI();
        this.updateAiSpeedUi();

        this.btnLangCN.addEventListener('click', () => this.setLang('CN'));
        this.btnLangEN.addEventListener('click', () => this.setLang('EN'));

        this.cardAdventure.addEventListener('click', () => this.startMode('ADVENTURE'));
        this.cardMastermind.addEventListener('click', () => this.startMode('MASTERMIND'));

        this.btnBack.addEventListener('click', () => this.showMenu());
        this.btnRestart.addEventListener('click', () => this.currentGame?.start());

        this.btnShowRules.addEventListener('click', () => this.uiRules.classList.remove('hidden'));
        this.btnCloseRules.addEventListener('click', () => this.uiRules.classList.add('hidden'));

        this.btnVicRestart.addEventListener('click', () => {
            this.uiVictory.classList.add('hidden');
            this.currentGame?.start();
        });
        this.btnVicMenu.addEventListener('click', () => {
            this.uiVictory.classList.add('hidden');
            this.showMenu();
        });

        this.btnDialogOk?.addEventListener('click', () => {
            const handler = this.dialogOkHandler;
            this.hideDialog();
            if (handler) handler();
        });
        this.uiDialog?.addEventListener('click', (event) => {
            if (event.target !== this.uiDialog) return;
            if (this.dialogOkHandler) return; // 有确认回调时，强制用户点“确定”避免遗漏流程
            this.hideDialog();
        });

        this.btnStopAi?.addEventListener('click', () => this.pauseAi(true));
        this.btnResumeAi?.addEventListener('click', () => this.pauseAi(false));
        this.btnToggleLog?.addEventListener('click', () => this.toggleLogPanel());
        this.btnCopyLog?.addEventListener('click', () => this.copyLogToClipboard());
        this.btnClearLog?.addEventListener('click', () => this.clearSnailLog());
        this.btnExplain?.addEventListener('click', () => this.openExplain());
        this.btnExplainClose?.addEventListener('click', () => this.closeExplain());
        this.btnExplainPrev?.addEventListener('click', () => this.setExplainIndex(this.explainIndex - 1));
        this.btnExplainNext?.addEventListener('click', () => this.setExplainIndex(this.explainIndex + 1));
        this.explainOverlay?.addEventListener('click', (event) => {
            if (event.target === this.explainOverlay) this.closeExplain();
        });
        window.addEventListener('resize', () => {
            if (this.explainOverlay && !this.explainOverlay.classList.contains('hidden')) {
                this.renderExplainBoard();
            }
        });
        this.inputAiSpeed?.addEventListener('input', () => {
            const value = parseInt(this.inputAiSpeed.value, 10);
            if (Number.isFinite(value) && value > 0) {
                this.aiMoveDelayMs = value;
                this.updateAiSpeedUi();
                this.appendSnailLog({ event_type: 'speed_changed', delay_ms: value });
            }
        });
    }

    setLang(lang) {
        this.lang = lang;
        this.btnLangCN.classList.toggle('active', lang === 'CN');
        this.btnLangEN.classList.toggle('active', lang === 'EN');
        this.updateLanguageUI();
        if (this.currentGame) this.currentGame.render();
    }

    updateLanguageUI() {
        const textCtx = STRINGS[this.lang];
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.dataset.key;
            if (textCtx[key]) el.textContent = textCtx[key];
        });

        const isVictoryVisible = this.uiVictory && !this.uiVictory.classList.contains('hidden');
        if (isVictoryVisible && this.mode === 'MASTERMIND') {
            const attemptsText = document.getElementById('victory-attempts')?.textContent || '0';
            const attempts = parseInt(attemptsText, 10);
            if (Number.isFinite(attempts) && attempts > 0) {
                const { title, message } = buildMastermindDefeatText(this.lang, attempts);
                const titleEl = this.uiVictory.querySelector('[data-key="victory_title"]');
                const msgEl = this.uiVictory.querySelector('[data-key="victory_msg"]');
                if (titleEl) titleEl.textContent = title;
                if (msgEl) msgEl.textContent = message;
            }
        }
    }

    startMode(mode) {
        this.mode = mode;
        if (this.inputRows && this.inputCols) {
            this.rows = parseInt(this.inputRows.value) || 10;
            this.cols = parseInt(this.inputCols.value) || 9;
        }
        this.uiOverlay.classList.add('hidden');
        this.uiGame.classList.remove('hidden');

        const modeTitleKey = mode === 'ADVENTURE' ? 'mode_adventure_title' : 'mode_mastermind_title';
        document.getElementById('mode-title').textContent = STRINGS[this.lang][modeTitleKey];

        const isMastermindMode = mode === 'MASTERMIND';
        this.btnToggleLog?.classList.toggle('hidden', !isMastermindMode);
        this.aiSpeedControl?.classList.toggle('hidden', !isMastermindMode);
        this.mastermindHint?.classList.toggle('hidden', !isMastermindMode);
        this.btnExplain?.classList.toggle('hidden', !isMastermindMode);
        if (!isMastermindMode) this.toggleLogPanel(false);

        this.isAiPaused = false;
        this.clearSnailLog();
        this.setStopResumeButtons();
        if (!isMastermindMode) {
            this.btnStopAi?.classList.add('hidden');
            this.btnResumeAi?.classList.add('hidden');
        }
        this.appendSnailLog({
            event_type: 'mode_start',
            mode,
            rows: this.rows,
            cols: this.cols,
        });

        if (mode === 'ADVENTURE') {
            this.currentGame = new AdventureMode(this);
        } else {
            this.currentGame = new MastermindMode(this);
        }
    }

    setExplainIndex(nextIndex) { // setExplainIndex：切换解释步骤并刷新 UI
        const steps = this.getExplainSteps();
        const clamped = Math.max(0, Math.min(steps.length - 1, nextIndex));
        this.explainIndex = clamped;
        this.updateExplainUi();
    }

    openExplain() { // openExplain：打开交互式解释（主宰模式），并暂停蜗牛移动避免干扰
        if (!this.explainOverlay) return;
        this.explainWasPaused = this.isAiPaused;
        this.isAiPaused = true;
        this.setStopResumeButtons();
        this.currentGame?.setPaused?.(true);

        this.explainIndex = 0;
        this.explainOverlay.classList.remove('hidden');
        requestAnimationFrame(() => this.updateExplainUi());
        this.appendSnailLog({ event_type: 'explain_open' });
    }

    closeExplain() { // closeExplain：关闭解释，并恢复打开前的暂停状态
        if (!this.explainOverlay) return;
        this.explainOverlay.classList.add('hidden');
        const shouldResume = !this.explainWasPaused;
        if (shouldResume) {
            this.isAiPaused = false;
            this.setStopResumeButtons();
            this.currentGame?.setPaused?.(false);
        }
        this.appendSnailLog({ event_type: 'explain_close', resumed: shouldResume });
    }

    updateExplainUi() { // 更新解释弹层文案/按钮状态，并渲染棋盘
        const steps = this.getExplainSteps();
        const step = steps[this.explainIndex] || steps[0];
        if (this.explainText) this.explainText.textContent = step.text;
        if (this.explainStep) this.explainStep.textContent = `${this.explainIndex + 1}/${steps.length}`;
        this.btnExplainPrev?.toggleAttribute('disabled', this.explainIndex <= 0);
        this.btnExplainNext?.toggleAttribute('disabled', this.explainIndex >= steps.length - 1);
        this.renderExplainBoard();
    }

    getExplainSteps() { // 演示步骤（固定小棋盘，不依赖当前关卡）
        const isCn = this.lang === 'CN';
        return [
            {
                key: 'intro',
                text: isCn
                    ? '规则：每一行恰好 1 个怪物；每一列最多 1 个怪物。蜗牛每次撞到怪物就重置回第 1 行。\n下面用一个小棋盘演示“为什么 3 次就是最优解”。'
                    : 'Rules: exactly 1 monster per row; at most 1 per column. If the snail hits a monster, it resets to row 1.\nBelow is a small demo of why 3 attempts is optimal.',
                state: {
                    rows: 5,
                    cols: 5,
                    snail: { r: 0, c: 2 },
                    monsters: [{ r: 1, c: 0 }, { r: 2, c: 3 }],
                    revealed: [{ r: 1, c: 0 }],
                    monsterIds: { '1,0': 'M1', '2,3': 'M2' },
                    arrows: [],
                },
            },
            {
                key: 'attempt1',
                text: isCn
                    ? '第 1 次：蜗牛会“扫描第 2 行”来找第一个怪物 M1。怪物方可以让它必撞到 M1，从而提供信息。'
                    : 'Attempt 1: the snail scans row 2 to find the first monster M1. The monster can force a hit, which reveals information.',
                state: {
                    rows: 5,
                    cols: 5,
                    snail: { r: 1, c: 0 },
                    monsters: [{ r: 1, c: 0 }, { r: 2, c: 3 }],
                    revealed: [{ r: 1, c: 0 }],
                    monsterIds: { '1,0': 'M1', '2,3': 'M2' },
                    arrows: [{ from: { r: 0, c: 2 }, to: { r: 1, c: 0 } }],
                },
            },
            {
                key: 'attempt2',
                text: isCn
                    ? '第 2 次：知道 M1 后，蜗牛会选一条“结构化路径”（阶梯或双路径）去逼出第二个关键信息 M2。怪物方也能让第 2 次失败，但必须暴露 M2。'
                    : 'Attempt 2: after knowing M1, the snail uses a structured path (staircase or dual-path) to force the next key info M2. The monster can stop attempt 2, but must reveal M2.',
                state: {
                    rows: 5,
                    cols: 5,
                    snail: { r: 2, c: 3 },
                    monsters: [{ r: 1, c: 0 }, { r: 2, c: 3 }],
                    revealed: [{ r: 1, c: 0 }, { r: 2, c: 3 }],
                    monsterIds: { '1,0': 'M1', '2,3': 'M2' },
                    arrows: [{ from: { r: 0, c: 2 }, to: { r: 2, c: 3 } }],
                },
            },
            {
                key: 'attempt3',
                text: isCn
                    ? '第 3 次：此时 M1 与 M2 都已暴露。结合“每行一个/每列最多一个”的约束，蜗牛能构造一条保证不再撞到怪物的绕行路径，必到终点。\n因此：怪物最强也只能让你赢在第 3 次；同时怪物也能保证前两次至少各撞一次，所以 2 次不可能保证通关。'
                    : 'Attempt 3: now M1 and M2 are known. Using the row/column constraints, the snail can construct a detour path that is guaranteed safe to the finish.\nSo: the monster can force at least 3 attempts in the worst case, but cannot prevent success by the 3rd.',
                state: {
                    rows: 5,
                    cols: 5,
                    snail: { r: 4, c: 4 },
                    monsters: [{ r: 1, c: 0 }, { r: 2, c: 3 }],
                    revealed: [{ r: 1, c: 0 }, { r: 2, c: 3 }],
                    monsterIds: { '1,0': 'M1', '2,3': 'M2' },
                    arrows: [{ from: { r: 2, c: 2 }, to: { r: 4, c: 4 } }],
                },
            },
        ];
    }

    renderExplainBoard() { // 渲染解释用小棋盘 + 箭头
        if (!this.explainBoard) return;
        const steps = this.getExplainSteps();
        const step = steps[this.explainIndex] || steps[0];
        const { rows, cols, snail, monsters, revealed, arrows } = step.state;

        this.explainBoard.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
        this.explainBoard.innerHTML = '';
        const revealedSet = new Set((revealed || []).map(p => `${p.r},${p.c}`));
        const monsterSet = new Set((monsters || []).map(p => `${p.r},${p.c}`));
        const monsterIds = step.state.monsterIds || {};

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const div = document.createElement('div');
                div.className = 'cell';
                div.dataset.r = r;
                div.dataset.c = c;
                const key = `${r},${c}`;
                if (monsterSet.has(key) && revealedSet.has(key)) {
                    div.classList.add('monster-revealed');
                    if (monsterIds[key]) div.dataset.monsterId = monsterIds[key];
                }
                if (snail && snail.r === r && snail.c === c) div.classList.add('snail');
                this.explainBoard.appendChild(div);
            }
        }

        requestAnimationFrame(() => this.renderExplainArrows(arrows || [], rows, cols));
    }

    renderExplainArrows(arrows, rows, cols) { // 用 SVG 在小棋盘上画箭头
        if (!this.explainArrowLayer || !this.explainBoard) return;
        const svg = this.explainArrowLayer;
        svg.innerHTML = '';

        const boardRect = this.explainBoard.getBoundingClientRect();
        svg.setAttribute('width', `${boardRect.width}`);
        svg.setAttribute('height', `${boardRect.height}`);
        svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '5');
        marker.setAttribute('orient', 'auto');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        path.setAttribute('fill', '#6c5ce7');
        marker.appendChild(path);
        defs.appendChild(marker);
        svg.appendChild(defs);

        const cellCenter = (r, c) => {
            const cellEl = this.explainBoard.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
            if (!cellEl) return null;
            const cellRect = cellEl.getBoundingClientRect();
            return {
                x: (cellRect.left - boardRect.left) + cellRect.width / 2,
                y: (cellRect.top - boardRect.top) + cellRect.height / 2,
            };
        };

        arrows.forEach(a => {
            const from = cellCenter(a.from.r, a.from.c);
            const to = cellCenter(a.to.r, a.to.c);
            if (!from || !to) return;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${from.x}`);
            line.setAttribute('y1', `${from.y}`);
            line.setAttribute('x2', `${to.x}`);
            line.setAttribute('y2', `${to.y}`);
            line.setAttribute('stroke', '#6c5ce7');
            line.setAttribute('stroke-width', '4');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            svg.appendChild(line);
        });
    }

    updateAiSpeedUi() { // 更新速度 UI 文案与数值
        if (this.inputAiSpeed) this.inputAiSpeed.value = String(this.aiMoveDelayMs);
        if (this.aiSpeedValue) this.aiSpeedValue.textContent = `${this.aiMoveDelayMs}ms`;
    }

    showMenu() {
        this.uiGame.classList.add('hidden');
        this.uiOverlay.classList.remove('hidden');
        this.hideDialog();
        this.isAiPaused = false;
        this.setStopResumeButtons();
        this.toggleLogPanel(false);
        if (this.currentGame) {
            this.currentGame.destroy();
            this.currentGame = null;
        }
    }

    showVictory(attempts) {
        this.uiVictory.classList.remove('hidden');
        document.getElementById('victory-attempts').textContent = attempts;

        const titleEl = this.uiVictory.querySelector('[data-key="victory_title"]');
        const msgEl = this.uiVictory.querySelector('[data-key="victory_msg"]');
        if (this.mode === 'MASTERMIND') {
            const { title, message } = buildMastermindDefeatText(this.lang, attempts);
            if (titleEl) titleEl.textContent = title;
            if (msgEl) msgEl.textContent = message;
        } else {
            if (titleEl) titleEl.textContent = STRINGS[this.lang].victory_title;
            if (msgEl) msgEl.textContent = STRINGS[this.lang].victory_msg;
        }
        // Should stop game loop if any
    }

    showDialog(message, options = {}) { // 显示可爱对话框
        if (!this.uiDialog || !this.dialogMessage) return;
        if (this.dialogTimer) {
            clearTimeout(this.dialogTimer);
            this.dialogTimer = null;
        }
        this.dialogMessage.textContent = message;
        this.uiDialog.classList.remove('hidden');
        this.dialogOkHandler = typeof options.onOk === 'function' ? options.onOk : null;
        if (options.autoCloseMs && !this.dialogOkHandler) {
            this.dialogTimer = setTimeout(() => {
                this.hideDialog();
            }, options.autoCloseMs);
        }
    }

    hideDialog() { // 隐藏可爱对话框
        if (!this.uiDialog) return;
        this.uiDialog.classList.add('hidden');
        this.dialogOkHandler = null;
        if (this.dialogTimer) {
            clearTimeout(this.dialogTimer);
            this.dialogTimer = null;
        }
    }

    toggleLogPanel(forceOpen = null) { // 展开/收起日志面板
        if (!this.logPanel) return;
        const shouldOpen = forceOpen === null ? this.logPanel.classList.contains('hidden') : forceOpen;
        this.logPanel.classList.toggle('hidden', !shouldOpen);
    }

    pauseAi(shouldPause) { // 暂停/恢复蜗牛（仅影响 Mastermind 的自动移动）
        this.isAiPaused = shouldPause;
        this.setStopResumeButtons();
        if (shouldPause) this.toggleLogPanel(true);
        this.currentGame?.setPaused?.(shouldPause);
        this.appendSnailLog({ event_type: shouldPause ? 'paused' : 'resumed' });
    }

    setStopResumeButtons() { // 切换按钮显示状态
        if (!this.btnStopAi || !this.btnResumeAi) return;
        this.btnStopAi.classList.toggle('hidden', this.isAiPaused);
        this.btnResumeAi.classList.toggle('hidden', !this.isAiPaused);
    }

    clearSnailLog() { // 清空日志
        this.snailLogLines = [];
        if (this.logTextarea) this.logTextarea.value = '';
    }

    formatSnailLogLine(data) { // 统一日志格式，便于复制给我 debug
        const timestamp = new Date().toISOString();
        const safeJson = (() => {
            try {
                return JSON.stringify(data);
            } catch {
                return JSON.stringify({ event_type: 'log_serialize_error' });
            }
        })();
        return `[${timestamp}] ${safeJson}`;
    }

    appendSnailLog(data) { // 追加日志
        const line = this.formatSnailLogLine(data);
        this.snailLogLines.push(line);
        if (this.snailLogLines.length > this.maxSnailLogLines) {
            this.snailLogLines.splice(0, this.snailLogLines.length - this.maxSnailLogLines);
        }
        if (this.logTextarea) {
            this.logTextarea.value = this.snailLogLines.join('\n');
            this.logTextarea.scrollTop = this.logTextarea.scrollHeight;
        }
    }

    async copyLogToClipboard() { // 复制日志到剪贴板
        const text = this.logTextarea ? this.logTextarea.value : this.snailLogLines.join('\n');
        if (!text) {
            this.showDialog(this.lang === 'CN' ? '没有可复制的日志。' : 'No log to copy.', { autoCloseMs: 1200 });
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            this.showDialog(this.lang === 'CN' ? '已复制日志，可以直接粘贴给我。' : 'Copied. Paste it here.', { autoCloseMs: 1200 });
        } catch {
            if (this.logTextarea) {
                this.logTextarea.focus();
                this.logTextarea.select();
            }
            this.showDialog(this.lang === 'CN' ? '复制失败：已选中日志，请手动复制。' : 'Copy failed: selected, please copy manually.', { autoCloseMs: 1600 });
        }
    }
}

class BaseGame {
    constructor(controller) {
        this.controller = controller;
        this.rows = controller.rows;
        this.cols = controller.cols;
        this.grid = [];
        this.monsters = [];
        this.snailPos = null;
        this.attempts = 0;
        this.gridEl = document.getElementById('game-grid');
        this.statusEl = document.getElementById('game-status');
        this.attemptEl = document.getElementById('attempt-count');

        this.start();

        this.clickHandler = this.handleCellClick.bind(this);
        this.gridEl.addEventListener('click', this.clickHandler);
    }

    destroy() {
        this.gridEl.removeEventListener('click', this.clickHandler);
        this.gridEl.innerHTML = '';
    }

    setPaused(_shouldPause) { /* 可选：由子类实现 */ }

    getText(key) { return STRINGS[this.controller.lang][key]; }

    start() {
        this.attempts = 0;
        this.monsters = this.generateMonsters(); // In Adventure Mode is Random. In Mastermind ??
        // Actually Base Game init monsters for Adventure. Mastermind should override to empty?

        this.initGrid();
        this.updateStats();
        this.render();
    }

    initGrid() {
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    r, c,
                    hasMonster: this.isMonsterAt(r, c),
                    visitedLayers: [],
                    isCurrentPath: false,
                    monsterRevealed: false
                });
            }
            this.grid.push(row);
        }
    }

    generateMonsters() {
        // Default random generation for Adventure Mode
        const monsters = [];
        const rows = [];
        for (let r = 1; r < this.rows - 1; r++) rows.push(r);

        const cols = Array.from({ length: this.cols }, (_, i) => i);
        // Shuffle cols
        for (let i = cols.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cols[i], cols[j]] = [cols[j], cols[i]];
        }

        rows.forEach((r, i) => {
            monsters.push({ r, c: cols[i % cols.length] });
        });
        return monsters;
    }

    isMonsterAt(r, c) { return this.monsters.some(m => m.r === r && m.c === c); }

    handleCellClick(e) { /* Override */ }

    updateStats() {
        this.attemptEl.textContent = this.attempts;
    }

    render() {
        this.gridEl.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
        this.gridEl.innerHTML = '';

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                const div = document.createElement('div');
                div.className = 'cell';
                div.dataset.r = r;
                div.dataset.c = c;

                cell.visitedLayers.forEach(layerIdx => {
                    const colorIdx = (layerIdx % 4) + 1;
                    div.classList.add(`path-layer-${colorIdx}`);
                });

                if (cell.monsterRevealed) div.classList.add('monster-revealed');
                if (cell.isCurrentPath) div.classList.add('path-current');

                if (this.snailPos && this.snailPos.r === r && this.snailPos.c === c) {
                    div.classList.add('snail');
                }

                this.gridEl.appendChild(div);
            }
        }
    }
}

class AdventureMode extends BaseGame {
    start() {
        super.start();
        this.snailPos = null;
        this.currentPath = [];
        this.statusEl.textContent = this.getText('status_ready');
    }

    handleCellClick(e) {
        const div = e.target.closest('.cell');
        if (!div) return;
        const r = parseInt(div.dataset.r);
        const c = parseInt(div.dataset.c);

        if (!this.snailPos) {
            const cell = this.grid[r][c];
            // 起点规则：允许从第 0 行任意格出发；或从“已确认安全”的格子出发（曾经走过且未揭示怪物）
            if (canStartAdventureAtCell(cell, r)) {
                this.snailPos = { r, c };
                this.visit(r, c);
                this.statusEl.textContent = this.getText('status_moving');
                this.render();
            }
            return;
        }

        const dr = Math.abs(r - this.snailPos.r);
        const dc = Math.abs(c - this.snailPos.c);
        if (dr + dc === 1) {
            this.moveTo(r, c);
        }
    }

    buildAdventureConfirmedSafeCellKeys() { // buildAdventureConfirmedSafeCellKeys：冒险模式“已确认安全格”集合（作弊布局时禁止放怪）
        const confirmedSafeCellKeys = new Set(); // confirmedSafeCellKeys：key='r,c'，用于约束作弊布局不把怪物放到已走过的安全格
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (!cell || cell.monsterRevealed) continue;
                const visitedBefore = Array.isArray(cell.visitedLayers) && cell.visitedLayers.length > 0;
                if (cell.isCurrentPath || visitedBefore) {
                    confirmedSafeCellKeys.add(`${r},${c}`);
                }
            }
        }
        return confirmedSafeCellKeys;
    }

    buildAdventureRevealedMonsters() { // buildAdventureRevealedMonsters：冒险模式已揭示怪物列表（作弊布局时必须固定）
        const revealedMonsters = []; // revealedMonsters：已揭示怪物坐标，用于固定每行怪物位置避免“已揭示却被移动”
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell && cell.monsterRevealed) revealedMonsters.push({ r, c });
            }
        }
        return revealedMonsters;
    }

    syncGridMonstersFromList() { // syncGridMonstersFromList：将 this.monsters 同步回 grid[*][*].hasMonster（支持动态作弊重排）
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell) cell.hasMonster = false;
            }
        }
        for (const monster of this.monsters) {
            if (!monster) continue;
            const r = monster.r;
            const c = monster.c;
            if (this.grid[r] && this.grid[r][c]) this.grid[r][c].hasMonster = true;
        }
    }

    tryCheatBeforeAdventureMove(r, c) { // tryCheatBeforeAdventureMove：冒险模式作弊——若能让下一步踩雷则强制重排怪物
        if (r <= 0 || r >= this.rows - 1) return; // 规则：第 0 行与终点行不放怪物
        const targetCell = this.grid?.[r]?.[c];
        if (!targetCell) return;
        if (targetCell.monsterRevealed) return; // 已揭示怪物无需作弊

        const confirmedSafeCellKeys = this.buildAdventureConfirmedSafeCellKeys();
        const forcedKey = `${r},${c}`;
        if (confirmedSafeCellKeys.has(forcedKey)) return; // 已确认安全格不能放怪，否则玩家会感知到“回溯改规则”

        const revealedMonsters = this.buildAdventureRevealedMonsters();
        const enforceUniqueColumns = this.cols >= Math.max(0, this.rows - 2);
        const nextMonsters = tryBuildAdventureCheatMonsterLayout({
            rows: this.rows,
            cols: this.cols,
            revealedMonsters,
            confirmedSafeCellKeys,
            forcedMonster: { r, c },
            enforceUniqueColumns,
        });
        if (!nextMonsters) return;

        this.monsters = nextMonsters;
        this.syncGridMonstersFromList();
    }

    moveTo(r, c) {
        // 作弊必须发生在 visit() 之前：visit() 会把目标格标记为“已确认安全”
        this.tryCheatBeforeAdventureMove(r, c);
        this.snailPos = { r, c };
        this.visit(r, c);

        const cell = this.grid[r][c];

        if (cell.hasMonster) {
            cell.monsterRevealed = true;
            this.statusEl.textContent = this.getText('status_hit');
            setTimeout(() => {
                this.controller.showDialog(this.getText('status_hit'), { autoCloseMs: 900 });
                this.resetSnail();
            }, 100);
        } else if (r === this.rows - 1) {
            this.statusEl.textContent = this.getText('status_win');
            this.controller.showVictory(this.attempts + 1);
        }

        this.render();
    }

    visit(r, c) {
        this.grid[r][c].isCurrentPath = true;
        this.currentPath.push({ r, c });
    }

    resetSnail() {
        const layerIdx = this.attempts;
        this.currentPath.forEach(p => {
            this.grid[p.r][p.c].visitedLayers.push(layerIdx);
            this.grid[p.r][p.c].isCurrentPath = false;
        });

        this.attempts++;
        this.updateStats();
        this.snailPos = null;
        this.currentPath = [];
        this.statusEl.textContent = this.getText('msg_reset');
        this.render();
    }
}

function canStartAdventureAtCell(cell, r) { // canStartAdventureAtCell：冒险模式起点校验（第0行任意格 / 已确认安全格）
    if (!cell) return false;
    if (r === 0) return true;
    return Array.isArray(cell.visitedLayers) && cell.visitedLayers.length > 0 && !cell.monsterRevealed;
}

function tryBuildAdventureCheatMonsterLayout({
    rows,
    cols,
    revealedMonsters,
    confirmedSafeCellKeys,
    forcedMonster,
    enforceUniqueColumns,
}) { // tryBuildAdventureCheatMonsterLayout：冒险模式作弊用“怪物布局求解器”（强制让 forcedMonster 变成怪物，且不放在已确认安全格）
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) return null;
    if (!forcedMonster || !Number.isInteger(forcedMonster.r) || !Number.isInteger(forcedMonster.c)) return null;
    const forcedRow = forcedMonster.r;
    const forcedCol = forcedMonster.c;
    const middleRowStart = 1;
    const middleRowEnd = rows - 2;
    if (forcedRow < middleRowStart || forcedRow > middleRowEnd) return null;
    if (forcedCol < 0 || forcedCol >= cols) return null;

    const safeKeys = confirmedSafeCellKeys instanceof Set ? confirmedSafeCellKeys : new Set();
    const fixedMonsterByRow = new Map(); // fixedMonsterByRow：row -> col，用于固定已揭示怪物位置
    const fixedCols = new Set();
    const revealedList = Array.isArray(revealedMonsters) ? revealedMonsters : [];

    for (const monster of revealedList) {
        if (!monster || !Number.isInteger(monster.r) || !Number.isInteger(monster.c)) continue;
        if (monster.r < middleRowStart || monster.r > middleRowEnd) continue;
        if (monster.c < 0 || monster.c >= cols) continue;
        const prev = fixedMonsterByRow.get(monster.r);
        if (prev !== undefined && prev !== monster.c) return null;
        fixedMonsterByRow.set(monster.r, monster.c);
        fixedCols.add(monster.c);
    }

    const safeForcedKey = `${forcedRow},${forcedCol}`;
    if (safeKeys.has(safeForcedKey)) return null;

    const fixedAtForcedRow = fixedMonsterByRow.get(forcedRow);
    if (fixedAtForcedRow !== undefined && fixedAtForcedRow !== forcedCol) return null;

    if (enforceUniqueColumns && fixedCols.has(forcedCol) && fixedAtForcedRow === undefined) {
        return null;
    }

    const middleRows = [];
    for (let r = middleRowStart; r <= middleRowEnd; r++) middleRows.push(r);

    if (!enforceUniqueColumns) {
        const monsters = [];
        for (const r of middleRows) {
            const fixedCol = fixedMonsterByRow.get(r);
            if (fixedCol !== undefined) {
                monsters.push({ r, c: fixedCol });
                continue;
            }
            if (r === forcedRow) {
                monsters.push({ r, c: forcedCol });
                continue;
            }
            let chosenCol = null;
            for (let c = 0; c < cols; c++) {
                if (!safeKeys.has(`${r},${c}`)) {
                    chosenCol = c;
                    break;
                }
            }
            if (chosenCol === null) return null;
            monsters.push({ r, c: chosenCol });
        }
        return monsters;
    }

    const allowedColsByRow = new Map(); // allowedColsByRow：row -> 可选列数组，用于二分图匹配求解唯一列布局
    for (const r of middleRows) {
        const fixedCol = fixedMonsterByRow.get(r);
        if (fixedCol !== undefined) {
            allowedColsByRow.set(r, [fixedCol]);
            continue;
        }
        if (r === forcedRow) {
            allowedColsByRow.set(r, [forcedCol]);
            continue;
        }
        const allowedCols = [];
        for (let c = 0; c < cols; c++) {
            if (fixedCols.has(c)) continue;
            if (safeKeys.has(`${r},${c}`)) continue;
            allowedCols.push(c);
        }
        if (allowedCols.length === 0) return null;
        allowedColsByRow.set(r, allowedCols);
    }

    const rowsSortedByConstraints = [...middleRows].sort((a, b) => {
        return (allowedColsByRow.get(a)?.length ?? 0) - (allowedColsByRow.get(b)?.length ?? 0);
    });

    const matchColToRow = new Map(); // matchColToRow：col -> row，表示该列已被哪一行占用
    function tryAssignRow(row, visitedCols) {
        const allowed = allowedColsByRow.get(row) || [];
        for (const col of allowed) {
            if (visitedCols.has(col)) continue;
            visitedCols.add(col);
            const matchedRow = matchColToRow.get(col);
            if (matchedRow === undefined || tryAssignRow(matchedRow, visitedCols)) {
                matchColToRow.set(col, row);
                return true;
            }
        }
        return false;
    }

    for (const row of rowsSortedByConstraints) {
        const ok = tryAssignRow(row, new Set());
        if (!ok) return null;
    }

    const assignedColByRow = new Map(); // assignedColByRow：row -> col，便于输出 monsters 列表
    for (const [col, row] of matchColToRow.entries()) {
        assignedColByRow.set(row, col);
    }
    // 固定列（已揭示怪物）可能未进入 match（若 cols 被过滤），这里兜底补齐
    for (const [row, col] of fixedMonsterByRow.entries()) {
        assignedColByRow.set(row, col);
    }

    if (assignedColByRow.get(forcedRow) !== forcedCol) return null;

    const monsters = [];
    for (const r of middleRows) {
        const col = assignedColByRow.get(r);
        if (col === undefined) return null;
        monsters.push({ r, c: col });
    }
    return monsters;
}

function validateMastermindIntercept({ safeCells, monsters, r, c }) { // validateMastermindIntercept：主宰模式放置怪物校验（安全格/同行/同列）
    const cellKey = `${r},${c}`;
    if (safeCells && safeCells.has(cellKey)) return { ok: false, reason: 'cell_already_safe' };
    if (monsters && monsters.some(m => m.r === r)) return { ok: false, reason: 'row_already_has_monster' };
    if (monsters && monsters.some(m => m.c === c)) return { ok: false, reason: 'col_already_has_monster' };
    return { ok: true, reason: 'ok' };
}

function buildMastermindDefeatText(lang, attempts) { // buildMastermindDefeatText：主宰模式“蜗牛到终点=玩家失败”的弹窗文案（纯函数，便于单测）
    const safeAttempts = Number.isFinite(attempts) && attempts > 0 ? attempts : 0;
    if (lang === 'CN') {
        const message = `蜗牛只用了 ${safeAttempts} 次探索就到达了终点。`;
        return { title: '你失败了', message, full: `你失败了，${message}` };
    }
    const message = `The snail reached the goal in only ${safeAttempts} attempts.`;
    return { title: 'You lost', message, full: `You lost. ${message}` };
}

function shouldAutoStartNextAttempt(isPaused) { // shouldAutoStartNextAttempt：主宰模式碰撞后是否自动进入下一次尝试（纯函数，便于单测）
    return !isPaused;
}

// codex: 2026-01-23 重构 MastermindMode，实现 IMO 2024 第5题最优 3 次尝试算法
// 算法核心：第一次扫描第二行找 M1，根据 M1 位置选择阶梯或双路径策略
class MastermindMode extends BaseGame {
    start() {
        this.attempts = 0;
        this.monsters = [];

        this.initGrid();
        this.updateStats();

        // 核心状态变量
        this.snailPos = null;
        this.moveInterval = null;
        this.nextAttemptTimer = null; // 下一次尝试的定时器（暂停/销毁时需要清理）
        this.isPaused = false; // 是否暂停蜗牛自动移动（由 Stop/Resume 控制）
        this.pathStack = [];          // 当前尝试的路径栈
        this.safeCells = new Set();   // 已确认安全的格子 "r,c" 格式

        // IMO 2024 算法状态
        this.aiPhase = 'ATTEMPT_1';   // ATTEMPT_1, ATTEMPT_2, ATTEMPT_3
        this.aiState = 'INIT';        // 当前阶段内的子状态
        this.m1Pos = null;            // 第一个怪物位置
        this.m2Pos = null;            // 第二个怪物位置
        this.m2EncounterAxis = null;  // M2 遇到时的移动轴：HORIZONTAL(向东/西) 或 VERTICAL(向南)，用于第三次路径分支
        this.staircaseDir = 0;        // 阶梯方向: 1=向右下, -1=向左下
        this.plannedPath = [];        // 预规划路径
        this.plannedPathIndex = 0;    // 当前执行到的路径索引

        this.statusEl.textContent = this.getText('status_ready');

        this.controller.appendSnailLog({
            event_type: 'ai_init',
            ai_phase: this.aiPhase,
            ai_state: this.aiState,
            rows: this.rows,
            cols: this.cols,
        });

        // 自动开始第一次尝试
        this.startAttempt();
    }

    destroy() {
        super.destroy();
        clearTimeout(this.moveInterval);
        clearTimeout(this.nextAttemptTimer);
    }

    generateMonsters() { return []; }

    setPaused(shouldPause) { // 主宰模式：暂停/恢复蜗牛自动移动
        this.isPaused = shouldPause;
        if (shouldPause) {
            clearTimeout(this.moveInterval);
            this.moveInterval = null;
            clearTimeout(this.nextAttemptTimer);
            this.nextAttemptTimer = null;
            return;
        }

        // 恢复时：若当前有位置则继续移动，否则进入下一次尝试
        if (this.snailPos) {
            this.gameLoop();
        } else {
            this.startAttempt();
        }
    }

    // 开始新的尝试
    startAttempt() {
        if (this.isPaused) {
            this.controller.appendSnailLog({ event_type: 'start_attempt_skipped_paused', ai_phase: this.aiPhase, ai_state: this.aiState });
            return;
        }

        // 清除当前路径标记
        this.pathStack.forEach(p => {
            if (this.grid[p.r] && this.grid[p.r][p.c]) {
                this.grid[p.r][p.c].isCurrentPath = false;
            }
        });
        this.pathStack = [];

        // 根据当前阶段确定起始位置
        let startCol = Math.floor(this.cols / 2);

        if (this.aiPhase === 'ATTEMPT_1') {
            this.aiState = 'SCAN_ROW2';
            startCol = Math.floor(this.cols / 2);
        } else if (this.aiPhase === 'ATTEMPT_2') {
            // 根据 M1 位置规划第二次尝试
            this.planAttempt2();
            startCol = this.plannedPath.length > 0 ? this.plannedPath[0].c : 0;
        } else if (this.aiPhase === 'ATTEMPT_3') {
            // 规划第三次尝试
            this.planAttempt3();
            startCol = this.plannedPath.length > 0 ? this.plannedPath[0].c : 0;
        }

        this.snailPos = { r: 0, c: startCol };
        this.pathStack.push({ ...this.snailPos });

        this.controller.appendSnailLog({
            event_type: 'attempt_start',
            attempt_index: this.attempts + 1,
            ai_phase: this.aiPhase,
            ai_state: this.aiState,
            start_pos: { ...this.snailPos },
            m1_pos: this.m1Pos,
            m2_pos: this.m2Pos,
            m2_encounter_axis: this.m2EncounterAxis,
            staircase_dir: this.staircaseDir,
            planned_path_len: this.plannedPath.length,
            planned_path_head: this.plannedPath.slice(0, 6),
            planned_path_tail: this.plannedPath.slice(-6),
        });

        this.statusEl.textContent = this.getText('status_moving');
        this.render();
        this.gameLoop();
    }

    // 第二次尝试规划
    planAttempt2() {
        this.plannedPath = [];
        this.plannedPathIndex = 0;

        if (!this.m1Pos) {
            // 没发现 M1，直接向下走
            this.aiState = 'DIRECT_DOWN';
            return;
        }

        const m1Col = this.m1Pos.c;

        // 判断 M1 是否在边缘
        if (m1Col === 0) {
            // M1 在左边缘，使用右下阶梯
            this.staircaseDir = 1;
            this.aiState = 'STAIRCASE';
            this.buildStaircasePath(1);
        } else if (m1Col === this.cols - 1) {
            // M1 在右边缘，使用左下阶梯
            this.staircaseDir = -1;
            this.aiState = 'STAIRCASE';
            this.buildStaircasePath(this.cols - 2);
        } else {
            // M1 不在边缘，选择双路径策略（先尝试左侧）
            this.aiState = 'DUAL_PATH_LEFT';
            this.buildDualPath(m1Col - 1);
        }
    }

    // 构建阶梯路径
    buildStaircasePath(startCol) {
        this.plannedPath = [];
        let c = startCol;

        // 从第 0 行开始
        this.plannedPath.push({ r: 0, c: c });

        // 阶梯式向下
        for (let r = 1; r < this.rows; r++) {
            this.plannedPath.push({ r, c });

            // 如果还没到底，水平移动一格
            if (r < this.rows - 1 && c + this.staircaseDir >= 0 && c + this.staircaseDir < this.cols) {
                c += this.staircaseDir;
                this.plannedPath.push({ r, c });
            }
        }
    }

    // 构建双路径（IMO 2024 正确解法）
    // 关键洞察：M1 所在列从第2行开始是安全的（M1 是该列唯一怪物）
    // 两条路径都进入 M1 列，只是入口不同（左侧或右侧）
    // 每行只有一个怪物，所以两条路径在第2行不可能同时被阻塞
    buildDualPath(sideCol) {
        this.plannedPath = [];
        const m1Col = this.m1Pos.c;

        // 路径策略：
        // 1. 从 sideCol 列进入
        // 2. 经过第1行（M1 在该行的 m1Col 列，不影响 sideCol 列）
        // 3. 到达第2行的 sideCol 列
        // 4. 水平移动到 m1Col 列
        // 5. 从 m1Col 列向下走到底（该列从第2行开始安全）

        // 第0行：起点
        this.plannedPath.push({ r: 0, c: sideCol });

        // 第1行：sideCol 列（安全，因为 M1 在 m1Col 列）
        this.plannedPath.push({ r: 1, c: sideCol });

        // 第2行：先到 sideCol 列
        this.plannedPath.push({ r: 2, c: sideCol });

        // 如果 sideCol != m1Col，水平移动到 m1Col
        let currentCol = sideCol;
        while (currentCol !== m1Col) {
            currentCol += (m1Col > currentCol) ? 1 : -1;
            this.plannedPath.push({ r: 2, c: currentCol });
        }

        // 从 m1Col 列第3行开始向下走到底
        for (let r = 3; r < this.rows; r++) {
            this.plannedPath.push({ r, c: m1Col });
        }
    }

    // 第三次尝试规划
    planAttempt3() {
        this.plannedPath = [];
        this.plannedPathIndex = 0;

        if (this.aiState === 'DUAL_PATH_LEFT' && this.m1Pos) {
            // 双路径模式，切换到右侧
            this.aiState = 'DUAL_PATH_RIGHT';
            this.buildDualPath(this.m1Pos.c + 1);
        } else if (this.aiState === 'STAIRCASE' && this.m1Pos && this.m2Pos) {
            // 阶梯模式遇到 M2，切入 M1 下方
            this.aiState = 'CUT_BELOW_M1';
            this.buildCutBelowPath();
        } else {
            // 其他情况，使用已知安全路径
            this.aiState = 'SAFE_RUN';
            this.buildSafeRunPath();
        }
    }

    // 构建切入 M1 下方的路径
    // 关键：避免重复点，确保路径是有效的相邻格子序列
    buildCutBelowPath() {
        this.plannedPath = [];
        if (!this.m1Pos || !this.m2Pos) return;

        const plannedPath = buildImoEdgeEscapePath({
            rows: this.rows,
            cols: this.cols,
            m1Col: this.m1Pos.c,
            m2Row: this.m2Pos.r,
            m2Col: this.m2Pos.c,
            staircaseDir: this.staircaseDir,
            m2EncounterAxis: this.m2EncounterAxis,
        });

        if (!plannedPath || plannedPath.length === 0) {
            this.buildSafeRunPath();
            return;
        }

        this.plannedPath = plannedPath;
    }

    // 获取本次尝试最后一步的移动轴，用于区分“向东/西遇到 M2”与“向南遇到 M2”。
    getCurrentAttemptLastMoveAxis() {
        return getLastMoveAxisFromPath(this.pathStack);
    }

    // 构建基于已知安全格子的路径
    buildSafeRunPath() {
        this.plannedPath = [];

        // 简单策略：找一个没有已知怪物的列直接向下
        const monsterCols = new Set(this.monsters.map(m => m.c));
        let safeCol = 0;

        for (let c = 0; c < this.cols; c++) {
            if (!monsterCols.has(c)) {
                safeCol = c;
                break;
            }
        }

        for (let r = 0; r < this.rows; r++) {
            this.plannedPath.push({ r, c: safeCol });
        }
    }

    markCellSafe(r, c) {
        this.safeCells.add(`${r},${c}`);
    }

    isCellSafe(r, c) {
        return this.safeCells.has(`${r},${c}`);
    }

    handleCellClick(e) {
        if (this.isPaused) return;
        const div = e.target.closest('.cell');
        if (!div) return;
        const r = parseInt(div.dataset.r);
        const c = parseInt(div.dataset.c);

        // 只允许在蜗牛当前位置拦截
        if (this.snailPos && this.snailPos.r === r && this.snailPos.c === c && r > 0 && r < this.rows - 1) {
            this.triggerIntercept(r, c);
        }
    }

    triggerIntercept(r, c) {
        // 验证放置规则（已走过=安全格 / 同行 / 同列）
        const validation = validateMastermindIntercept({ safeCells: this.safeCells, monsters: this.monsters, r, c });
        if (!validation.ok) {
            this.controller.appendSnailLog({
                event_type: 'intercept_invalid',
                reason: validation.reason,
                pos: { r, c },
                ai_phase: this.aiPhase,
                ai_state: this.aiState,
                monsters: this.monsters.slice(),
            });

            let dialogMessage = this.getText('msg_bad_place');
            if (validation.reason === 'cell_already_safe') {
                dialogMessage = this.getText('msg_bad_place_safe');
            } else if (validation.reason === 'row_already_has_monster') {
                dialogMessage = `${this.getText('msg_bad_place')}\n${this.getText('msg_bad_place_row')}`; // 组合后的放置错误提示
            } else if (validation.reason === 'col_already_has_monster') {
                dialogMessage = `${this.getText('msg_bad_place')}\n${this.getText('msg_bad_place_col')}`; // 组合后的放置错误提示
            }

            this.controller.showDialog(dialogMessage, { autoCloseMs: 1400 });
            return;
        }

        // 放置怪物
        const cell = this.grid[r][c];
        cell.monsterRevealed = true;
        cell.hasMonster = true;
        this.monsters.push({ r, c });

        this.controller.appendSnailLog({
            event_type: 'intercept_placed',
            pos: { r, c },
            ai_phase: this.aiPhase,
            ai_state: this.aiState,
            monsters: this.monsters.slice(),
        });

        this.statusEl.textContent = this.getText('msg_intercept');
        clearTimeout(this.moveInterval);

        // 记录怪物位置
        this.recordMonsterHit(r, c);

        setTimeout(() => {
            this.handleCollision(r, c);
        }, 100);
        this.render();
    }

    forceIntercept(r, c) {
        const cell = this.grid[r][c];
        cell.monsterRevealed = true;
        cell.hasMonster = true;
        this.monsters.push({ r, c });

        this.recordMonsterHit(r, c);
        this.handleCollision(r, c);
    }

    recordMonsterHit(r, c) {
        if (this.aiPhase === 'ATTEMPT_1') {
            this.m1Pos = { r, c };
            this.controller.appendSnailLog({ event_type: 'monster_recorded', monster_id: 'M1', pos: { r, c } });
        } else if (this.aiPhase === 'ATTEMPT_2') {
            this.m2Pos = { r, c };
            this.controller.appendSnailLog({ event_type: 'monster_recorded', monster_id: 'M2', pos: { r, c } });
        }
    }

    hasMonsterInRow(r) {
        return this.monsters.some(m => m.r === r);
    }

    async gameLoop() {
        if (!this.snailPos) return;
        if (this.isPaused) return;

        const delay = Math.max(60, Number(this.controller.aiMoveDelayMs) || 600);

        this.moveInterval = setTimeout(() => {
            this.executeMove();
        }, delay);
    }

    executeMove() {
        if (this.isPaused) return;
        const fromPos = this.snailPos ? { ...this.snailPos } : null;
        const move = this.calculateNextMove();
        if (move) {
            // 蜗牛能离开当前格，说明当前格不含怪物 => 记为“已确认安全格”
            if (fromPos) this.markCellSafe(fromPos.r, fromPos.c);

            this.controller.appendSnailLog({
                event_type: 'move_execute',
                from: fromPos,
                to: { r: move.r, c: move.c },
                ai_phase: this.aiPhase,
                ai_state: this.aiState,
                attempts: this.attempts,
            });
            this.moveTo(move.r, move.c);

            this.controller.appendSnailLog({
                event_type: 'move_result',
                after_pos: this.snailPos ? { ...this.snailPos } : null,
                ai_phase: this.aiPhase,
                ai_state: this.aiState,
                attempts: this.attempts,
            });

            // 如果没有撞到怪物且没到终点，继续移动
            if (this.snailPos && this.snailPos.r < this.rows - 1) {
                const cell = this.grid[this.snailPos.r][this.snailPos.c];
                if (!cell.hasMonster || !cell.monsterRevealed) {
                    this.gameLoop();
                }
            }
        }
    }

    calculateNextMove() {
        if (!this.snailPos) return null;
        const { r, c } = this.snailPos;

        // 已到达终点
        if (r >= this.rows - 1) return null;

        // 如果有预规划路径，跟随路径
        if (this.plannedPath.length > 0) {
            // 找到当前位置在路径中的位置
            let foundIndex = -1;
            for (let i = 0; i < this.plannedPath.length; i++) {
                if (this.plannedPath[i].r === r && this.plannedPath[i].c === c) {
                    foundIndex = i;
                    break;
                }
            }

            this.controller.appendSnailLog({
                event_type: 'ai_decision',
                branch: 'planned_path',
                pos: { r, c },
                found_index: foundIndex,
                path_len: this.plannedPath.length,
            });

            if (foundIndex >= 0 && foundIndex < this.plannedPath.length - 1) {
                const next = this.plannedPath[foundIndex + 1];
                // 验证是移动到相邻格子
                const dr = Math.abs(next.r - r);
                const dc = Math.abs(next.c - c);
                if (dr + dc === 1) {
                    this.controller.appendSnailLog({
                        event_type: 'ai_decision_chosen',
                        branch: 'planned_path_follow_next',
                        from: { r, c },
                        to: { r: next.r, c: next.c },
                    });
                    return next;
                }
            }

            // 如果在路径末尾，已完成
            if (foundIndex === this.plannedPath.length - 1) {
                this.controller.appendSnailLog({
                    event_type: 'ai_decision_stop',
                    reason: 'planned_path_end',
                    pos: { r, c },
                });
                return null;
            }

            // 如果找不到当前位置，尝试移动到路径起点
            if (foundIndex === -1 && this.plannedPath.length > 0) {
                const pathStart = this.plannedPath[0];
                // 计算到起点的移动
                const dr = Math.abs(pathStart.r - r);
                const dc = Math.abs(pathStart.c - c);
                if (dr + dc === 1) {
                    this.controller.appendSnailLog({
                        event_type: 'ai_decision_chosen',
                        branch: 'planned_path_move_to_start_adjacent',
                        from: { r, c },
                        to: { r: pathStart.r, c: pathStart.c },
                    });
                    return pathStart;
                } else if (dr === 0 && dc > 0) {
                    // 水平移动到起点列
                    const nextC = c + (pathStart.c > c ? 1 : -1);
                    this.controller.appendSnailLog({
                        event_type: 'ai_decision_chosen',
                        branch: 'planned_path_seek_horizontal',
                        from: { r, c },
                        to: { r, c: nextC },
                        target_start: { r: pathStart.r, c: pathStart.c },
                    });
                    return { r, c: nextC };
                } else if (dc === 0 && dr > 0) {
                    // 垂直移动到起点行
                    const nextR = r + (pathStart.r > r ? 1 : -1);
                    this.controller.appendSnailLog({
                        event_type: 'ai_decision_chosen',
                        branch: 'planned_path_seek_vertical',
                        from: { r, c },
                        to: { r: nextR, c },
                        target_start: { r: pathStart.r, c: pathStart.c },
                    });
                    return { r: nextR, c };
                }
            }
        }

        // 第一次尝试：扫描第二行
        if (this.aiPhase === 'ATTEMPT_1') {
            const next = this.calculateAttempt1Move(r, c);
            this.controller.appendSnailLog({
                event_type: 'ai_decision_chosen',
                branch: 'attempt_1_scan',
                from: { r, c },
                to: next ? { r: next.r, c: next.c } : null,
                ai_state: this.aiState,
            });
            return next;
        }

        // 默认：向下移动（备用逻辑）
        if (r < this.rows - 1) {
            this.controller.appendSnailLog({
                event_type: 'ai_decision_chosen',
                branch: 'fallback_down',
                from: { r, c },
                to: { r: r + 1, c },
                ai_phase: this.aiPhase,
                ai_state: this.aiState,
            });
            return { r: r + 1, c };
        }

        this.controller.appendSnailLog({
            event_type: 'ai_decision_stop',
            reason: 'already_at_last_row',
            pos: { r, c },
            ai_phase: this.aiPhase,
            ai_state: this.aiState,
        });
        return null;
    }

    // 第一次尝试的移动逻辑
    calculateAttempt1Move(r, c) {
        // 如果在第 0 行，进入第 1 行
        if (r === 0) {
            return { r: 1, c };
        }

        // 在第 1 行，扫描整行
        if (r === 1) {
            // 先向右扫描
            if (this.aiState === 'SCAN_ROW2') {
                if (c < this.cols - 1) {
                    return { r, c: c + 1 };
                } else {
                    // 到达右边缘，改为向左扫描
                    this.aiState = 'SCAN_LEFT';
                }
            }

            if (this.aiState === 'SCAN_LEFT') {
                if (c > 0) {
                    return { r, c: c - 1 };
                } else {
                    // 扫描完成但没有怪物：提示规则，并在最后探索的格子强制“发现”怪物（引导玩家理解必须每行一个怪物）
                    if (!this.hasMonsterInRow(1)) {
                        this.controller.appendSnailLog({
                            event_type: 'rules_enforced_row_missing',
                            row: 1,
                            forced_pos: { r, c },
                            ai_phase: this.aiPhase,
                            ai_state: this.aiState,
                        });
                        this.controller.pauseAi(true);
                        this.controller.showDialog(this.getText('msg_rules_reminder_row_missing'), {
                            onOk: () => {
                                this.controller.uiRules?.classList.add('hidden');
                                this.controller.pauseAi(false);
                            },
                        });
                        this.controller.uiRules?.classList.remove('hidden');
                        this.forceIntercept(r, c);
                        return null;
                    }

                    return { r: r + 1, c };
                }
            }
        }

        // 如果已经不在第 1 行，继续向下
        return { r: r + 1, c };
    }

    moveTo(r, c) {
        this.snailPos = { r, c };
        this.pathStack.push({ r, c });
        this.grid[r][c].isCurrentPath = true;

        const cell = this.grid[r][c];

        if (cell.hasMonster && cell.monsterRevealed) {
            this.handleCollision(r, c);
        } else if (r === this.rows - 1) {
            // 到达终点
            const attemptsUsed = this.attempts + 1;
            const defeatText = buildMastermindDefeatText(this.controller.lang, attemptsUsed);
            this.statusEl.textContent = defeatText.full;
            this.controller.showVictory(attemptsUsed);
            clearTimeout(this.moveInterval);
        }

        this.render();
    }

    handleCollision(r, c) {
        this.grid[r][c].monsterRevealed = true;
        clearTimeout(this.moveInterval);
        this.moveInterval = null;
        clearTimeout(this.nextAttemptTimer);
        this.nextAttemptTimer = null;

        this.controller.appendSnailLog({
            event_type: 'collision',
            pos: { r, c },
            ai_phase: this.aiPhase,
            ai_state: this.aiState,
            attempts_before: this.attempts,
            m1_pos: this.m1Pos,
            m2_pos: this.m2Pos,
            m2_encounter_axis: this.m2EncounterAxis,
            planned_path_len: this.plannedPath.length,
        });

        // 记录 M2 的“碰撞方向”，用于第三次逃脱路径分支（见 IMO 原文两种紫色路径）
        if (this.aiPhase === 'ATTEMPT_2' && this.m2Pos && this.m2Pos.r === r && this.m2Pos.c === c) {
            this.m2EncounterAxis = this.getCurrentAttemptLastMoveAxis();
            this.controller.appendSnailLog({
                event_type: 'm2_encounter_axis_recorded',
                pos: { r, c },
                axis: this.m2EncounterAxis,
            });
        }

        // 保存当前路径的访问层
        const layerIdx = this.attempts;
        this.pathStack.forEach(p => {
            if (this.grid[p.r] && this.grid[p.r][p.c]) {
                this.grid[p.r][p.c].visitedLayers.push(layerIdx);
                this.grid[p.r][p.c].isCurrentPath = false;
            }
        });

        const attemptIndex = this.attempts + 1;
        this.attempts++;
        this.updateStats();
        this.snailPos = null;

        this.controller.appendSnailLog({
            event_type: 'attempt_end',
            attempt_index: attemptIndex,
            collision_pos: { r, c },
            next_attempt_index: this.attempts + 1,
            ai_phase_before: this.aiPhase,
            m1_pos: this.m1Pos,
            m2_pos: this.m2Pos,
            m2_encounter_axis: this.m2EncounterAxis,
        });

        // 进入下一阶段
        if (this.aiPhase === 'ATTEMPT_1') {
            this.aiPhase = 'ATTEMPT_2';
            this.statusEl.textContent = `发现 M1 @ (${r},${c})，规划第二次尝试...`;
            this.controller.appendSnailLog({ event_type: 'phase_transition', from: 'ATTEMPT_1', to: 'ATTEMPT_2', collision_pos: { r, c } });
        } else if (this.aiPhase === 'ATTEMPT_2') {
            this.aiPhase = 'ATTEMPT_3';
            this.statusEl.textContent = `发现 M2 @ (${r},${c})，规划第三次尝试...`;
            this.controller.appendSnailLog({ event_type: 'phase_transition', from: 'ATTEMPT_2', to: 'ATTEMPT_3', collision_pos: { r, c } });
        } else {
            // 第三次尝试失败（理论上不应该发生）
            const isCn = this.controller.lang === 'CN';
            this.statusEl.textContent = isCn ? '算法异常：已暂停（请复制日志）' : 'AI error: paused (copy log)';
            this.controller.appendSnailLog({
                event_type: 'algo_error_attempts_exceeded',
                collision_pos: { r, c },
                attempts: this.attempts,
                ai_phase: this.aiPhase,
                ai_state: this.aiState,
                m1_pos: this.m1Pos,
                m2_pos: this.m2Pos,
                m2_encounter_axis: this.m2EncounterAxis,
            });
            this.render();
            this.controller.showDialog(
                isCn
                    ? '算法异常：蜗牛在第 3 次尝试仍失败（理论上不该发生）。已自动停止。\n请点“日志→复制”把完整记录发给我。'
                    : 'AI error: failed on 3rd attempt (should not happen). Paused.\nClick Log→Copy and send it to me.',
                { autoCloseMs: 2600 }
            );
            this.controller.pauseAi(true);
            return;
        }

        this.render();

        // 短暂延迟后开始下一次尝试
        if (!shouldAutoStartNextAttempt(this.isPaused)) {
            this.controller.appendSnailLog({ event_type: 'next_attempt_deferred_paused', ai_phase: this.aiPhase, ai_state: this.aiState });
            return;
        }
        this.nextAttemptTimer = setTimeout(() => {
            this.nextAttemptTimer = null;
            this.startAttempt();
        }, 800);
    }
}

// 仅在浏览器环境启动 UI；Node 单测/脚本加载时跳过。
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    new GameController();
}

// getLastMoveAxisFromPath：从路径点序列中推断最后一步的移动轴（纯函数，便于单测）。
function getLastMoveAxisFromPath(pathPoints) {
    if (!Array.isArray(pathPoints) || pathPoints.length < 2) return null;
    const prev = pathPoints[pathPoints.length - 2];
    const curr = pathPoints[pathPoints.length - 1];
    if (!prev || !curr) return null;
    const dr = curr.r - prev.r;
    const dc = curr.c - prev.c;
    if (Math.abs(dr) + Math.abs(dc) !== 1) return null;
    return dr === 0 ? 'HORIZONTAL' : 'VERTICAL';
}

// buildImoEdgeEscapePath：IMO 2024/5 “M1 在边缘 + 阶梯遇到 M2”场景下的第三次尝试逃脱路径（纯函数，便于单测）。
function buildImoEdgeEscapePath({
    rows,
    cols,
    m1Col,
    m2Row,
    m2Col,
    staircaseDir,
    m2EncounterAxis,
}) {
    if (
        !Number.isInteger(rows) ||
        !Number.isInteger(cols) ||
        !Number.isInteger(m1Col) ||
        !Number.isInteger(m2Row) ||
        !Number.isInteger(m2Col) ||
        (staircaseDir !== 1 && staircaseDir !== -1)
    ) {
        return null;
    }

    const staircaseStartCol = staircaseDir === 1 ? 1 : cols - 2;
    if (staircaseStartCol < 0 || staircaseStartCol >= cols) return null;

    const isHorizontalEncounter = m2EncounterAxis === 'HORIZONTAL';
    const pivotRow = isHorizontalEncounter ? m2Row : m2Row - 1;
    const pivotCol = m2Col - staircaseDir;

    if (pivotRow < 0 || pivotRow >= rows) return null;
    if (pivotCol < 0 || pivotCol >= cols) return null;

    const path = [];
    const addStep = (r, c) => {
        const last = path[path.length - 1];
        if (last && last.r === r && last.c === c) return;
        path.push({ r, c });
    };

    // 1) 沿第二次尝试的阶梯安全路径走到 pivot（避免进入 M2）
    let currentCol = staircaseStartCol;
    addStep(0, currentCol);

    for (let r = 1; r <= pivotRow && r < rows; r++) {
        addStep(r, currentCol); // 向下
        if (r === pivotRow && currentCol === pivotCol) break;

        const nextCol = currentCol + staircaseDir;
        if (nextCol < 0 || nextCol >= cols) break;
        addStep(r, nextCol); // 水平（阶梯）
        currentCol = nextCol;
        if (r === pivotRow && currentCol === pivotCol) break;
    }

    const last = path[path.length - 1];
    if (!last || last.r !== pivotRow || last.c !== pivotCol) return null;

    // 2) 若是“向南撞上”，从对角点下移到 M2 左侧/右侧的安全格
    if (!isHorizontalEncounter) {
        addStep(m2Row, pivotCol);
    }

    // 3) 在 M2 所在行水平移动到 M1 所在列（不会跨过 M2 列）
    let escapeCol = path[path.length - 1].c;
    while (escapeCol !== m1Col) {
        escapeCol += m1Col > escapeCol ? 1 : -1;
        addStep(m2Row, escapeCol);
    }

    // 4) 沿 M1 列直达终点（该列除 M1 行外无怪物）
    for (let r = m2Row + 1; r < rows; r++) {
        addStep(r, m1Col);
    }

    return path;
}

// Node 环境导出：用于单测路径规划（浏览器环境下 module 不存在，不影响运行）。
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        buildImoEdgeEscapePath,
        getLastMoveAxisFromPath,
        validateMastermindIntercept,
        canStartAdventureAtCell,
        tryBuildAdventureCheatMonsterLayout,
        buildMastermindDefeatText,
        shouldAutoStartNextAttempt,
    };
}
