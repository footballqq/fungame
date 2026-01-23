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

class MastermindMode extends BaseGame {
    start() {
        this.attempts = 0;
        this.monsters = []; // Start EMPTY in Mastermind?
        // User says: "Player places traps". BUT "Hidden in Rows 2..N-1".
        // Does Setup exist? Or Player places dynamically?
        // Rules say: "Player intercepts... on the cell he has stepped on".
        // Constraints: "Row has at least 1, max 1. Col max 1."
        // "If snail traversed row, auto-place".
        // IMPLICATION: Monsters are NOT pre-generated. They are Quantum?
        // Or user places them on the fly.
        // Let's assume Monsters are EMPTY initially and defined by "Intercepts".

        this.initGrid(); // Empty grid
        this.updateStats();
        this.snailPos = { r: 0, c: 0 };
        this.statusEl.textContent = this.getText('status_moving');
        this.moveInterval = null;
        this.aiState = 'PROBE';
        this.pathStack = [];
        this.gameLoop();
    }

    destroy() {
        super.destroy();
        clearTimeout(this.moveInterval);
    }

    // Override base generate (Empty)
    generateMonsters() { return []; }

    handleCellClick(e) {
        const div = e.target.closest('.cell');
        if (!div) return;
        const r = parseInt(div.dataset.r);
        const c = parseInt(div.dataset.c);

        // Allow intercept ONLY at snail position
        if (this.snailPos.r === r && this.snailPos.c === c && r > 0 && r < this.rows - 1) {
            this.triggerIntercept(r, c);
        }
    }

    triggerIntercept(r, c) {
        // VALIDATION
        // 1. One per Row check
        const rowHas = this.monsters.some(m => m.r === r);
        if (rowHas) {
            alert(this.getText('msg_bad_place') + " (Row already has monster)");
            return;
        }
        // 2. One per Col check
        const colHas = this.monsters.some(m => m.c === c);
        if (colHas) {
            alert(this.getText('msg_bad_place') + " (Col already has monster)");
            return;
        }

        // PLACE
        const cell = this.grid[r][c];
        cell.monsterRevealed = true;
        cell.hasMonster = true;
        this.monsters.push({ r, c });

        this.statusEl.textContent = this.getText('msg_intercept');
        clearTimeout(this.moveInterval);

        setTimeout(() => {
            alert(this.getText('msg_intercept'));
            this.handleCollision(r, c);
        }, 100);
        this.render();
    }

    forceIntercept(r, c) {
        // Auto-placement logic (override constraints? No, must satisfy constraints, but user design ensures solvability?)
        // "If row has no monster and we reached end... auto place".
        // We force place at {r, c}.
        // Note: Logic must ensure we don't violate Col constraint if possible. 
        // But if 'Auto-place' is rule, it dominates.
        const cell = this.grid[r][c];
        cell.monsterRevealed = true;
        cell.hasMonster = true;
        this.monsters.push({ r, c });

        alert("Auto-Intercept! (End of Row)");
        this.handleCollision(r, c);
    }

    hasMonsterInRow(r) {
        return this.monsters.some(m => m.r === r);
    }

    async gameLoop() {
        if (!this.snailPos) return;

        const delay = this.aiState === 'SAFE_RUN' ? 200 : 1000;

        this.moveInterval = setTimeout(() => {
            this.executeMove();
        }, delay);
    }

    executeMove() {
        const move = this.calculateNextMove();
        if (move) {
            // Check Auto-Placement Logic BEFORE moving? Or AFTER?
            // "If snail walks horizontally... and player hasn't placed... last one auto placed".
            // Suggests Check BEFORE leaving the row? Or AT the last cell?
            // "Walked to col N-1 (last col)". 
            // So if Snail Moves To Last Col... and still no monster... Intercept!

            // Logic:
            // If we are MOVING TO (move.r, move.c).
            // If move.r == current.r (Horizontal move to Right)
            // AND move.c is the last column (cols-1) or end of sequence?
            // Actually, if we are AT (r, c) and we move Right...

            // Let's check: If we are AT the last column?
            // If Snail is at (r, lastCol). It can't move Right. It must move Down?
            // If it moves Down, it leaves the row.
            // If it leaves the row and `!hasMonsterInRow(r)`, we must FAIL or Intercept.
            // User says "Automatic place".
            // Where? At current pos? Or next?
            // "Last one auto placed". imply at the last cell of the row.

            // Refined Check:
            // If Snail is at (r, c).
            // If calculating move implies leaving the row (move.r != r)
            // AND `!hasMonsterInRow(r)`
            // THEN we MUST intercept at (r, c) NOW. (Unless r=0).

            const currentR = this.snailPos.r;
            if (currentR > 0 && currentR < this.rows - 1 && move.r !== currentR) {
                if (!this.hasMonsterInRow(currentR)) {
                    // Force Intercept HERE before moving
                    this.forceIntercept(currentR, this.snailPos.c);
                    return; // Collision handler will loop.
                }
            }

            this.moveTo(move.r, move.c);

            // Continue Loop if safe
            if (this.snailPos.r < this.rows - 1 && !this.grid[this.snailPos.r][this.snailPos.c].monsterRevealed) {
                this.gameLoop();
            }
        }
    }

    calculateNextMove() {
        const { r, c } = this.snailPos;

        // 0. Win
        if (r >= this.rows - 1) return null;

        // 1. PROBE (0,0 -> 1,0)
        if (this.aiState === 'PROBE') {
            if (r === 0) return { r: 1, c: 0 };
            this.aiState = 'SWEEP';
        }

        // 2. ESCAPE (Left -> Down)
        if (this.aiState === 'ESCAPE') {
            if (c > 0) return { r, c: c - 1 };
            this.aiState = 'SWEEP'; // Resume sweep
            return { r: r + 1, c };
        }

        // 3. SAFE RUN / OPTIMIZATION
        // If we know row r+1 is safe to cross?
        const knownMonster = this.monsters.find(m => m.r === r + 1);
        if (knownMonster) {
            // We know where monster is in next row.
            // If our current column != monster column, we can go Down.
            // But we must check if we are in Z mode?
            // User: "If optimal path found...". 
            // Let's apply: If known monster is NOT at (r+1, c), and we want to go down...
            if (knownMonster.c !== c) {
                // Optimization: Go Down immediately?
                // Unless we are strictly Sweeping? 
                // User: "If no monster... continue right...". 
                // If we KNOW monster is elsewhere, we don't need to sweep.
                this.statusEl.textContent = this.getText('msg_ai_safe');
                return { r: r + 1, c };
            }
        }

        // 4. SWEEP (Right until... blocked? Or End?)
        if (this.aiState === 'SWEEP') {
            // If we can move right?
            if (c < this.cols - 1) {
                return { r, c: c + 1 };
            } else {
                // End of row. 
                // Logic check: If no monster found, Force Intercept will fail us before we go down.
                // So we try to go down.
                return { r: r + 1, c };
            }
        }

        // 5. Z_PATTERN
        if (this.aiState === 'Z_PATTERN') {
            // Toggles between Down and Right
            // Heuristic: If we are at C, try Down.
            if (!this.isKnownMonster(r + 1, c)) return { r: r + 1, c };
            if (c < this.cols - 1 && !this.isKnownMonster(r, c + 1)) return { r, c: c + 1 };
            return { r: r + 1, c };
        }

        return { r: r + 1, c };
    }

    isKnownMonster(r, c) {
        if (r >= this.rows) return false;
        return this.grid[r][c].monsterRevealed;
    }

    moveTo(r, c) {
        const lastPos = this.snailPos;
        this.snailPos = { r, c };
        this.pathStack.push({ r, c });

        // Check if we walked into a PRE-EXISTING monster (Known)
        const cell = this.grid[r][c];
        if (cell.hasMonster && cell.monsterRevealed) {
            this.handleCollision(r, c);
        } else if (r === this.rows - 1) {
            this.statusEl.textContent = this.getText('status_win');
            this.controller.showVictory(this.attempts);
            clearTimeout(this.moveInterval);
        }

        this.render();
    }

    handleCollision(r, c) {
        this.grid[r][c].monsterRevealed = true;

        let validSafeSpot = { r: Math.max(0, r), c: Math.max(0, c - 1) };

        if (this.aiState === 'PROBE' || this.aiState === 'SWEEP') {
            this.aiState = 'Z_PATTERN';
            // Valid spot: If we moved Right (r, c-1). If we moved Down (r-1, c).
            // Logic: Reset to previous step.
            validSafeSpot = this.pathStack.length > 1 ? this.pathStack[this.pathStack.length - 2] : { r: 0, c: 0 };
        } else if (this.aiState === 'Z_PATTERN') {
            this.aiState = 'ESCAPE';
            if (r > 0 && c > 0) validSafeSpot = { r: r - 1, c: c - 1 };
            else validSafeSpot = { r: 0, c: 0 };
        }

        this.snailPos = validSafeSpot;
        this.attempts++;
        this.updateStats();
        // Loop restart handled by trigger? No, trigger stops loop. We must restart it.
        this.gameLoop();
    }
}

new GameController();
