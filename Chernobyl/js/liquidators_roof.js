// codex: 2026-06-07 Masha屋顶石墨清理子游戏模块
/* js/liquidators_roof.js - 清理者行动：Masha屋顶清理子游戏 */

LiquidatorsManager.prototype.initRoof = function() {
    const canvas = document.getElementById('roof-canvas');
    canvas.width = 400; canvas.height = 300;
    this.roofTimer = 90;
    document.getElementById('roof-cleared').textContent = "0";
    this.roofInterval = setInterval(() => {
        this.roofTimer--;
        const el = document.getElementById('roof-timer');
        if (el) el.textContent = this.roofTimer;
        if (this.roofTimer <= 0) {
            this.stop();
            this.state.triggerGameOver("90秒已过！生物机器人没有及时返回铅室，吸收了超致死极量的伽马射线，当场倒在屋顶。");
        }
    }, 1000);
    if (window.audio) window.audio.startGeigerStatic(0.99);
    this.triggerRoofDialogue(1);
    this.loopRoof();
};

LiquidatorsManager.prototype.triggerRoofDialogue = function(step) {
    if (step === 1) {
        this.state.showDialogue(
            "尼古拉·塔拉卡诺夫 少将",
            "【警报！辐射计指针爆表！】\n屋顶环境辐射高达 12,000 伦琴。西德进口抢险机器人的电路板在几秒内就被强中子束击穿烧毁。国家正处于最危险的关头，人民正处于水深火热之中。我们现在唯一的希望是——“生物机器人”（无畏牺牲的无产阶级工人与士兵同志们）！\n\n同志们，穿上用铅板手工缝制的厚重装甲，拿起铲子，为了祖国，为了千千万万的同胞，冲锋！",
            [{ text: "【下达命令】排队冲上3号堆顶瓦砾堆", callback: () => {
                document.getElementById('roof-cleared').textContent = "5";
                if (window.audio) window.audio.playBeep(1000, 0.2, 0.1);
                this.triggerRoofDialogue(2);
            }}]
        );
    } else if (step === 2) {
        this.state.showDialogue(
            "清理者冲锋（Masha屋顶前线）",
            "【极度高辐射引起臭氧剧烈燃烧，视网膜上闪烁着射线撞击的微弱蓝光】\n你们踏在了被炸飞的石墨堆上，Geiger计数器发出了撕裂般高频尖啸。每一铲石墨的辐射强度都足以在几天内夺去你的生命。但工人们在怒吼，他们在用尽全身力气，把死神抛回炉心！",
            [
                { text: "【争分夺秒】合力铲起滚烫石墨，抛入堆芯深渊！", callback: () => {
                    document.getElementById('roof-cleared').textContent = "10";
                    if (window.audio) window.audio.playBeep(1200, 0.2, 0.1);
                    this.triggerRoofDialogue(3);
                }},
                { text: "【歌颂英雄】用双手与铁撬，撬动压在管道上的庞大石墨！", callback: () => {
                    document.getElementById('roof-cleared').textContent = "10";
                    if (window.audio) window.audio.playBeep(1200, 0.2, 0.1);
                    this.triggerRoofDialogue(3);
                }}
            ]
        );
    } else if (step === 3) {
        this.state.showDialogue(
            "生死撤退（警钟连环长鸣）",
            "【口腔中充斥着厚重的铜锈铁锈味，防毒面具下呼吸困难】\n最后一批石墨碎块被清理抛下！在这场凡人与核裂变死神的直接搏斗中，清理者们用血肉与钢铁意志赢了！但在强辐射的阻击下，每一秒钟都是在消耗生命，快！立刻撤离！",
            [{ text: "【全速奔跑】跟随急促警钟，立刻狂奔回安全通道！", callback: () => {
                document.getElementById('roof-cleared').textContent = "15";
                this.stop();
                if (window.scenario) window.scenario.onRoofCleaned();
            }}]
        );
    }
};

LiquidatorsManager.prototype.loopRoof = function() {
    if (this.activeSubgame !== 'roof') return;
    const canvas = document.getElementById('roof-canvas');
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#050a05'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; ctx.fillRect(0, (Date.now() / 4) % h, w, 2);

    ctx.fillStyle = '#ff3333'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
    ctx.fillText("⚠️ RADIATION CAMERA OVERLOAD ⚠️", w/2, h/2 - 20);
    ctx.font = '11px monospace';
    ctx.fillText("DOSE RATE: > 12,000 R/h | TELEMETRY ERROR", w/2, h/2 + 10);
    ctx.fillStyle = 'rgba(255, 50, 50, ' + (0.3 + 0.3 * Math.sin(Date.now() / 100)) + ')';
    ctx.fillText("HUMAN CLEANUP TEAM OPERATING...", w/2, h/2 + 35);
    this.loopId = requestAnimationFrame(() => this.loopRoof());
};
