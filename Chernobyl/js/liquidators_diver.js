// codex: 2026-06-07 鼓泡池下潜排污阀紧急开启子游戏模块
/* js/liquidators_diver.js - 清理者行动：鼓泡池下潜排污阀开启子游戏 */

LiquidatorsManager.prototype.initDiver = function() {
    const canvas = document.getElementById('diver-canvas');
    canvas.width = 400; canvas.height = 400;
    this.diverPos = { x: 1, y: 1 }; this.state.diverBattery = 100; this.state.diverDose = 0.0;
    this.valves = [{ x: 2, y: 7, opened: false }, { x: 8, y: 1, opened: false }];
    const setupDpad = (btnId, dx, dy) => {
        const btn = document.getElementById(btnId); btn.replaceWith(btn.cloneNode(true));
        document.getElementById(btnId).addEventListener('click', () => this.moveDiver(dx, dy));
    };
    [['btn-dpad-up', 0, -1], ['btn-dpad-down', 0, 1], ['btn-dpad-left', -1, 0], ['btn-dpad-right', 1, 0]].forEach(([b, x, y]) => setupDpad(b, x, y));
    window.onkeydown = (e) => {
        if (this.activeSubgame !== 'diver') return;
        const keys = { ArrowUp: [0,-1], w: [0,-1], ArrowDown: [0,1], s: [0,1], ArrowLeft: [-1,0], a: [-1,0], ArrowRight: [1,0], d: [1,0] };
        if (keys[e.key]) this.moveDiver(keys[e.key][0], keys[e.key][1]);
    };
    const handleGridClick = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.floor((clientX - rect.left) * (canvas.width / rect.width) / 40);
        const gy = Math.floor((clientY - rect.top) * (canvas.height / rect.height) / 40);
        if (gx >= 0 && gx < 10 && gy >= 0 && gy < 10 && this.mazeGrid[gy][gx] === 0) this.moveDiver(gx - this.diverPos.x, gy - this.diverPos.y);
    };
    canvas.replaceWith(canvas.cloneNode(true));
    const newCanvas = document.getElementById('diver-canvas');
    newCanvas.addEventListener('mousedown', (e) => handleGridClick(e.clientX, e.clientY));
    newCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) handleGridClick(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    // 初始引导选择对话框
    this.state.showDialogue(
        "地下室积水排水任务",
        "水下排水任务已开启！在手机屏幕上，由于迷宫小且环境昏暗，使用虚拟按键或点击网格移动较为困难。您可选择直接操作，或进入文字交互式指挥模式。",
        [
            {
                text: "🕹️ 直接操作 (使用摇杆/键盘/点击画面)",
                callback: () => {
                    this.state.showDialogue("", "请在画面中探索寻路。");
                }
            },
            {
                text: "🎙️ 战术调度 (通过文字剧情对话完成任务)",
                callback: () => {
                    this.triggerDiverDialogue(1);
                }
            }
        ]
    );

    this.loopDiver();
};

LiquidatorsManager.prototype.moveDiver = function(dx, dy) {
    if (this.state.gameOver) return;
    const tx = this.diverPos.x + dx, ty = this.diverPos.y + dy;
    if (tx >= 0 && tx < 10 && ty >= 0 && ty < 10 && this.mazeGrid[ty][tx] === 0) {
        this.diverPos.x = tx; this.diverPos.y = ty;
        this.valves.forEach(v => {
            if (v.x === tx && v.y === ty && !v.opened) {
                v.opened = true; this.stop();
                if (window.audio) window.audio.playBeep(1800, 0.5, 0.15);
                const rem = this.valves.filter(vl => !vl.opened).length;
                this.state.showDialogue(`拧开第 ${2 - rem} 个排污阀`, rem > 0 ? "【水下生死搏斗】在冰冷刺骨且充满放射性废渣的黑水中，恐惧吞噬着呼吸。盖革计数器高频尖叫，手电筒光束在水波中颤抖。你终于摸到了排污阀！阀门因高温生锈卡死，你和同志们咬紧牙关，手掌磨出血泡，合力转动沉重的铁轮……只听‘咔吧’一声，第一个阀门终于拧开，混浊的水流喷涌而出！还剩 1 个排污阀！" : "【双阀全开】第二个排污阀也被拧开！管道发出剧烈颤鸣，积水开始倾泻宣泄，二次热爆炸危机解除！但注意，你们的空气与电量即将耗尽，低温让四肢开始僵硬，身体已到负荷极限！必须立刻在倒计时中往回撤退，爬回最上方的入口舱门 (1,1)！", [{ text: rem > 0 ? "继续寻找剩下的阀门" : "全速返航入口", callback: () => { this.activeSubgame = 'diver'; this.loopDiver(); } }]);
            }
        });
        if (tx === this.diverExit.x && ty === this.diverExit.y && this.valves.every(v => v.opened)) {
            this.stop(); document.getElementById('btn-liq-roof').disabled = false;
            this.state.showDialogue("排水任务成功：向伟大的工人们致敬", "你们精疲力竭地攀上铁梯，爬出淹没的地下室舱门。清凉的夜空空气涌入面罩，你们活下来了！阿纳嫩科、贝斯帕洛夫与巴拉诺夫，三位无畏的下潜英雄用血肉之躯粉碎了炉心毁损扩散的威胁，拯救了欧罗巴千万生灵！祖国和历史将永远铭记这些工人阶级的开路先锋与钢铁意志！", [{ text: "准备进入屋顶清理总决战", callback: () => this.showMenu() }]);
        }
    }
};

LiquidatorsManager.prototype.loopDiver = function() {
    if (this.activeSubgame !== 'diver') return;
    const canvas = document.getElementById('diver-canvas');
    const ctx = canvas.getContext('2d'), cell = 40;
    this.state.diverBattery = Math.max(0, this.state.diverBattery - 0.01);
    document.getElementById('diver-battery').textContent = Math.round(this.state.diverBattery);

    if (this.state.diverBattery <= 0) {
        this.stop();
        this.state.showDialogue("排水任务失败", "手电筒电池完全耗尽！小队在深不可测的黑暗洪水中迷失。", [{ text: "🔄 重新开始排水任务", callback: () => this.startSubgame('diver') }]);
        return;
    }

    let minDist = 999;
    this.hotspots.forEach(hs => minDist = Math.min(minDist, Math.sqrt((hs.x - this.diverPos.x)**2 + (hs.y - this.diverPos.y)**2)));

    let soundLv = 0;
    if (minDist <= 2.5) {
        soundLv = (2.5 - minDist) / 2.5;
        this.state.diverDose += soundLv * 0.05;
        document.getElementById('diver-dose').textContent = this.state.diverDose.toFixed(1);
        if (this.state.diverDose >= 50.0) {
            this.stop();
            this.state.showDialogue("排水任务失败", "潜水员小队遭遇极重辐射，累积剂量超致死阈值！", [{ text: "🔄 重新开始排水任务", callback: () => this.startSubgame('diver') }]);
            return;
        }
    }
    if (window.audio) window.audio.startGeigerStatic(soundLv * 0.7);

    ctx.fillStyle = '#020502'; ctx.fillRect(0, 0, 400, 400);
    ctx.save(); ctx.beginPath();
    const px = this.diverPos.x * cell + cell/2, py = this.diverPos.y * cell + cell/2;
    const rad = (this.state.diverBattery / 100) * 200 + 150;
    ctx.arc(px, py, rad, 0, Math.PI*2); ctx.clip();

    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            if (this.mazeGrid[y][x] === 1) {
                ctx.fillStyle = '#3a543a'; ctx.fillRect(x*cell, y*cell, cell, cell);
                ctx.strokeStyle = '#5a785a'; ctx.lineWidth = 1.5; ctx.strokeRect(x*cell + 1, y*cell + 1, cell - 2, cell - 2);
            } else {
                ctx.fillStyle = '#122412'; ctx.fillRect(x*cell, y*cell, cell, cell);
                ctx.strokeStyle = '#1a301a'; ctx.lineWidth = 0.5; ctx.strokeRect(x*cell, y*cell, cell, cell);
            }
        }
    }

    const gradSpot = ctx.createRadialGradient(px, py, cell/2, px, py, rad);
    gradSpot.addColorStop(0, 'rgba(0, 255, 0, 0.25)'); gradSpot.addColorStop(0.6, 'rgba(0, 255, 0, 0.05)'); gradSpot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradSpot; ctx.fillRect(0, 0, 400, 400);

    this.hotspots.forEach(hs => {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.beginPath(); ctx.arc(hs.x * cell + cell/2, hs.y * cell + cell/2, 15, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();

    this.valves.forEach(v => {
        ctx.save(); ctx.shadowBlur = 35; ctx.shadowColor = v.opened ? '#00ff00' : '#ff0000';
        ctx.fillStyle = v.opened ? '#00ff00' : '#ff0000';
        ctx.beginPath(); ctx.arc(v.x * cell + cell/2, v.y * cell + cell/2, 12, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = v.opened ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(v.x * cell + cell/2, v.y * cell + cell/2, 18, 0, Math.PI*2); ctx.stroke(); ctx.restore();
        ctx.fillStyle = '#000'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(v.opened ? "开" : "阀", v.x * cell + cell/2, v.y * cell + cell/2);
    });

    ctx.save(); ctx.shadowBlur = 35; ctx.shadowColor = '#ffaa00'; ctx.fillStyle = 'var(--warning-yellow)';
    ctx.fillRect(this.diverExit.x * cell + 4, this.diverExit.y * cell + 4, cell - 8, cell - 8);
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)'; ctx.lineWidth = 2;
    ctx.strokeRect(this.diverExit.x * cell + 2, this.diverExit.y * cell + 2, cell - 4, cell - 4); ctx.restore();
    ctx.fillStyle = '#000'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText("出口", this.diverExit.x * cell + cell/2, this.diverExit.y * cell + cell/2);

    ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = '#00ff00'; ctx.fillStyle = '#00ff00';
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI*2); ctx.fill(); ctx.restore();

    ctx.fillStyle = 'var(--terminal-green)'; ctx.textAlign = 'left'; ctx.font = 'bold 12px monospace';
    const v1 = this.valves[0].opened ? "阀1:已开启" : "阀1:未开启", v2 = this.valves[1].opened ? "阀2:已开启" : "阀2:未开启";
    ctx.fillText(`控制台: ${v1} | ${v2}`, 15, 20);
    ctx.fillStyle = this.valves.every(v => v.opened) ? 'var(--warning-yellow)' : 'var(--terminal-green)';
    ctx.fillText(this.valves.every(v => v.opened) ? "目标: 沿亮光路线前往出口撤离！" : "目标: 寻找并拧开 2 个红色指示灯处的排污阀", 15, 38);

    this.loopId = requestAnimationFrame(() => this.loopDiver());
};

LiquidatorsManager.prototype.triggerDiverDialogue = function(step) {
    if (step === 1) {
        this.state.showDialogue(
            "安德烈·阿纳嫩科 (值班工程师)",
            "【地下室黑水入口处】\n地下室是一片漆黑，积水已经淹没了大半。这里充满放射性粒子，我们穿戴着自制的橡胶潜水服与呼吸器，手电筒的光在浑浊的水中只能照亮身前几米。盖革计数器在耳机里疯狂叫着。迪亚特洛夫指示我们找到两个排污闸阀。我们要开始下水了。",
            [
                {
                    text: "【开始下潜】开启探照灯，拉动安全绳深入水下迷宫",
                    callback: () => {
                        this.diverPos = { x: 3, y: 2 };
                        this.state.diverBattery = 75;
                        this.state.diverDose = 12.5;
                        document.getElementById('diver-battery').textContent = Math.round(this.state.diverBattery);
                        document.getElementById('diver-dose').textContent = this.state.diverDose.toFixed(1);
                        if (window.audio) window.audio.playBeep(1000, 0.1, 0.05);
                        this.triggerDiverDialogue(2);
                    }
                }
            ]
        );
    } else if (step === 2) {
        this.state.showDialogue(
            "德米特里·贝斯帕洛夫 (机械工程师)",
            "【鼓泡池走廊中部】\n水下各种被炸断的管道和尖锐的水泥块横七竖八。我们在第一条死胡同发现了高放石墨碎块，幸好及时绕开！前方转角处的水域闪烁着红光发亮……那是第一个排污阀！",
            [
                {
                    text: "【转动阀门】咬紧牙关，与同志合力拧开生锈的铁轮阀！",
                    callback: () => {
                        this.valves[0].opened = true;
                        this.diverPos = { x: 2, y: 7 };
                        this.state.diverBattery = 45;
                        this.state.diverDose = 28.5;
                        document.getElementById('diver-battery').textContent = Math.round(this.state.diverBattery);
                        document.getElementById('diver-dose').textContent = this.state.diverDose.toFixed(1);
                        if (window.audio) window.audio.playBeep(1800, 0.5, 0.15);
                        this.triggerDiverDialogue(3);
                    }
                }
            ]
        );
    } else if (step === 3) {
        this.state.showDialogue(
            "巴拉诺夫 (值班长)",
            "【通往二号阀门深水区】\n第一个阀门喷出了水柱，积水开始倾泻流动！但我们的手电筒电量开始下降，水的能见度越来越低。我们必须穿过另一条狭窄管道，那里离堆芯正下方极近，盖革计数器的爆鸣变成了持续的尖啸！第二个红色灯标出现了！",
            [
                {
                    text: "【誓死排水】顶住强辐射与极寒，拼尽全力拧开第二个阀门！",
                    callback: () => {
                        this.valves[1].opened = true;
                        this.diverPos = { x: 8, y: 1 };
                        this.state.diverBattery = 20;
                        this.state.diverDose = 38.0;
                        document.getElementById('diver-battery').textContent = Math.round(this.state.diverBattery);
                        document.getElementById('diver-dose').textContent = this.state.diverDose.toFixed(1);
                        if (window.audio) window.audio.playBeep(1800, 0.5, 0.15);
                        this.triggerDiverDialogue(4);
                    }
                }
            ]
        );
    } else if (step === 4) {
        this.state.showDialogue(
            "三人小队 (撤退警示)",
            "【双阀全开 - 积水急剧宣泄】\n两个阀门均已全部打开！鼓泡池积水正在宣泄，二次热爆炸危机解除！但我们的呼吸器气压降到了警戒线，手电筒也开始闪烁。我们必须以最快的速度撤退回入口舱门！",
            [
                {
                    text: "【全速返航】摸索安全绳，用最后的力气爬出闸门！",
                    callback: () => {
                        this.diverPos = { x: 1, y: 1 };
                        this.state.diverBattery = 10;
                        this.state.diverDose = 42.0;
                        document.getElementById('diver-battery').textContent = Math.round(this.state.diverBattery);
                        document.getElementById('diver-dose').textContent = this.state.diverDose.toFixed(1);
                        this.stop();
                        document.getElementById('btn-liq-roof').disabled = false;
                        this.state.showDialogue(
                            "排水任务成功：向伟大的工人们致敬",
                            "你们精疲力竭地攀上铁梯，爬出淹没的地下室舱门。清凉的夜空空气涌入面罩，你们活下来了！阿纳嫩科、贝斯帕洛夫与巴拉诺夫，三位无畏的下潜英雄用血肉之躯粉碎了炉心毁损扩散的威胁，拯救了欧罗巴千万生灵！祖国和历史将永远铭记这些工人阶级的开路先锋与钢铁意志！",
                            [
                                {
                                    text: "准备进入屋顶清理总决战",
                                    callback: () => this.showMenu()
                                }
                            ]
                        );
                    }
                }
            ]
        );
    }
};
