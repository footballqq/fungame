const STRINGS = {
    EN: {
        title: "Snail vs Monsters",
        btn_menu: "Menu",
        btn_restart: "Restart Level",
        btn_rules: "Game Rules",
        btn_close: "Close",
        intro_p1: "Welcome to the maze! Hidden monsters are waiting.",
        intro_p2: "Choose your side:",
        mode_adventure_title: "Adventure Mode",
        mode_adventure_desc: "You are the Snail. Explore the grid, discover safe paths, and reach the finish line.",
        mode_mastermind_title: "Mastermind Mode",
        mode_mastermind_desc: "You are the Monster. Place traps to stop the Smart AI Snail.",
        legend_safe: "Safe",
        legend_monster: "Monster",
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
        intro_p1: "欢迎来到迷宫！小心隐藏的怪物。",
        intro_p2: "请选择你的角色：",
        mode_adventure_title: "冒险模式 (我是蜗牛)",
        mode_adventure_desc: "你扮演蜗牛。探索网格，发现安全路径，到达终点。",
        mode_mastermind_title: "主宰模式 (我是怪物)",
        mode_mastermind_desc: "你扮演怪物。设置陷阱阻止智能AI蜗牛。",
        legend_safe: "安全",
        legend_monster: "怪物",
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

        // UI Elements
        this.uiOverlay = document.getElementById('start-overlay');
        this.uiGame = document.getElementById('game-ui');
        this.uiRules = document.getElementById('rules-overlay');
        this.uiVictory = document.getElementById('victory-modal');

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

        this.init();
    }

    init() {
        this.updateLanguageUI();

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

        if (mode === 'ADVENTURE') {
            this.currentGame = new AdventureMode(this);
        } else {
            this.currentGame = new MastermindMode(this);
        }
    }

    showMenu() {
        this.uiGame.classList.add('hidden');
        this.uiOverlay.classList.remove('hidden');
        if (this.currentGame) {
            this.currentGame.destroy();
            this.currentGame = null;
        }
    }

    showVictory(attempts) {
        this.uiVictory.classList.remove('hidden');
        document.getElementById('victory-attempts').textContent = attempts;
        // Should stop game loop if any
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
        this.gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 45px)`;
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
            // Start at any cell in Row 0
            if (r === 0) {
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

    moveTo(r, c) {
        this.snailPos = { r, c };
        this.visit(r, c);

        const cell = this.grid[r][c];

        if (cell.hasMonster) {
            cell.monsterRevealed = true;
            this.statusEl.textContent = this.getText('status_hit');
            setTimeout(() => {
                alert(this.getText('status_hit'));
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
        this.pathStack = [];          // 当前尝试的路径栈
        this.safeCells = new Set();   // 已确认安全的格子 "r,c" 格式

        // IMO 2024 算法状态
        this.aiPhase = 'ATTEMPT_1';   // ATTEMPT_1, ATTEMPT_2, ATTEMPT_3
        this.aiState = 'INIT';        // 当前阶段内的子状态
        this.m1Pos = null;            // 第一个怪物位置
        this.m2Pos = null;            // 第二个怪物位置
        this.staircaseDir = 0;        // 阶梯方向: 1=向右下, -1=向左下
        this.plannedPath = [];        // 预规划路径
        this.plannedPathIndex = 0;    // 当前执行到的路径索引

        this.statusEl.textContent = this.getText('status_ready');

        // 自动开始第一次尝试
        this.startAttempt();
    }

    destroy() {
        super.destroy();
        clearTimeout(this.moveInterval);
    }

    generateMonsters() { return []; }

    // 开始新的尝试
    startAttempt() {
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
        this.markCellSafe(0, startCol);
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

        const m1Col = this.m1Pos.c;  // M1 在边缘（0 或 cols-1）
        const m2Row = this.m2Pos.r;

        // 使用 Set 避免重复点
        const addedPoints = new Set();
        const addPoint = (r, c) => {
            const key = `${r},${c}`;
            if (!addedPoints.has(key)) {
                addedPoints.add(key);
                this.plannedPath.push({ r, c });
            }
        };

        // 从阶梯起始列开始
        let col = this.staircaseDir === 1 ? 1 : this.cols - 2;

        // 第 0 行起点
        addPoint(0, col);

        // 沿阶梯走到 M2 上一行（避免到达 M2）
        for (let r = 1; r < m2Row; r++) {
            addPoint(r, col);
            // 阶梯水平移动
            if (r < m2Row - 1) {  // 在 M2 之前的行才水平移动
                if (col + this.staircaseDir >= 0 && col + this.staircaseDir < this.cols) {
                    col += this.staircaseDir;
                    addPoint(r, col);
                }
            }
        }

        // 现在在 (m2Row - 1, col) 位置
        // 需要水平移动到 M1 所在列
        const targetRow = m2Row - 1;
        while (col !== m1Col) {
            col += (m1Col > col) ? 1 : -1;
            addPoint(targetRow, col);
        }

        // 从 M1 所在列向下走到底部
        for (let r = targetRow + 1; r < this.rows; r++) {
            addPoint(r, m1Col);
        }

        console.log(`[AI] buildCutBelowPath: ${this.plannedPath.length} points, from (0,${this.staircaseDir === 1 ? 1 : this.cols - 2}) to M1 col ${m1Col}`);
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
        // 验证放置规则
        const rowHas = this.monsters.some(m => m.r === r);
        if (rowHas) {
            alert(this.getText('msg_bad_place') + " (Row already has monster)");
            return;
        }
        const colHas = this.monsters.some(m => m.c === c);
        if (colHas) {
            alert(this.getText('msg_bad_place') + " (Col already has monster)");
            return;
        }

        // 放置怪物
        const cell = this.grid[r][c];
        cell.monsterRevealed = true;
        cell.hasMonster = true;
        this.monsters.push({ r, c });

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
        } else if (this.aiPhase === 'ATTEMPT_2') {
            this.m2Pos = { r, c };
        }
    }

    hasMonsterInRow(r) {
        return this.monsters.some(m => m.r === r);
    }

    async gameLoop() {
        if (!this.snailPos) return;

        // 根据状态调整速度
        const delay = (this.aiState === 'SAFE_RUN' || this.plannedPath.length > 0) ? 300 : 600;

        this.moveInterval = setTimeout(() => {
            this.executeMove();
        }, delay);
    }

    executeMove() {
        const move = this.calculateNextMove();
        if (move) {
            // 检查是否要离开当前行
            const currentR = this.snailPos.r;
            if (currentR > 0 && currentR < this.rows - 1 && move.r !== currentR) {
                if (!this.hasMonsterInRow(currentR)) {
                    this.forceIntercept(currentR, this.snailPos.c);
                    return;
                }
            }

            this.moveTo(move.r, move.c);

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

            console.log(`[AI] pos=(${r},${c}), foundIdx=${foundIndex}, pathLen=${this.plannedPath.length}`);

            if (foundIndex >= 0 && foundIndex < this.plannedPath.length - 1) {
                const next = this.plannedPath[foundIndex + 1];
                // 验证是移动到相邻格子
                const dr = Math.abs(next.r - r);
                const dc = Math.abs(next.c - c);
                if (dr + dc === 1) {
                    console.log(`[AI] following path to (${next.r},${next.c})`);
                    return next;
                }
            }

            // 如果在路径末尾，已完成
            if (foundIndex === this.plannedPath.length - 1) {
                console.log(`[AI] at path end`);
                return null;
            }

            // 如果找不到当前位置，尝试移动到路径起点
            if (foundIndex === -1 && this.plannedPath.length > 0) {
                const pathStart = this.plannedPath[0];
                // 计算到起点的移动
                const dr = Math.abs(pathStart.r - r);
                const dc = Math.abs(pathStart.c - c);
                if (dr + dc === 1) {
                    console.log(`[AI] moving to path start (${pathStart.r},${pathStart.c})`);
                    return pathStart;
                } else if (dr === 0 && dc > 0) {
                    // 水平移动到起点列
                    const nextC = c + (pathStart.c > c ? 1 : -1);
                    console.log(`[AI] horizontal move to (${r},${nextC})`);
                    return { r, c: nextC };
                } else if (dc === 0 && dr > 0) {
                    // 垂直移动到起点行
                    const nextR = r + (pathStart.r > r ? 1 : -1);
                    console.log(`[AI] vertical move to (${nextR},${c})`);
                    return { r: nextR, c };
                }
            }
        }

        // 第一次尝试：扫描第二行
        if (this.aiPhase === 'ATTEMPT_1') {
            return this.calculateAttempt1Move(r, c);
        }

        // 默认：向下移动（备用逻辑）
        if (r < this.rows - 1) {
            return { r: r + 1, c };
        }

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
                    // 扫描完成，没有怪物（理论上不应该发生）
                    // 向下移动
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

        // 标记为安全
        this.markCellSafe(r, c);

        const cell = this.grid[r][c];

        if (cell.hasMonster && cell.monsterRevealed) {
            this.handleCollision(r, c);
        } else if (r === this.rows - 1) {
            // 到达终点
            this.statusEl.textContent = this.getText('status_win');
            this.controller.showVictory(this.attempts + 1);
            clearTimeout(this.moveInterval);
        }

        this.render();
    }

    handleCollision(r, c) {
        this.grid[r][c].monsterRevealed = true;

        // 保存当前路径的访问层
        const layerIdx = this.attempts;
        this.pathStack.forEach(p => {
            if (this.grid[p.r] && this.grid[p.r][p.c]) {
                this.grid[p.r][p.c].visitedLayers.push(layerIdx);
                this.grid[p.r][p.c].isCurrentPath = false;
            }
        });

        this.attempts++;
        this.updateStats();
        this.snailPos = null;

        // 进入下一阶段
        if (this.aiPhase === 'ATTEMPT_1') {
            this.aiPhase = 'ATTEMPT_2';
            this.statusEl.textContent = `发现 M1 @ (${r},${c})，规划第二次尝试...`;
        } else if (this.aiPhase === 'ATTEMPT_2') {
            this.aiPhase = 'ATTEMPT_3';
            this.statusEl.textContent = `发现 M2 @ (${r},${c})，规划第三次尝试...`;
        } else {
            // 第三次尝试失败（理论上不应该发生）
            this.statusEl.textContent = '算法异常，重新开始...';
            this.aiPhase = 'ATTEMPT_1';
        }

        this.render();

        // 短暂延迟后开始下一次尝试
        setTimeout(() => {
            this.startAttempt();
        }, 800);
    }
}

new GameController();
