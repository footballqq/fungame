/* js/state.js - 全局状态机与视口切换 */
/* codex: 2026-06-06 状态机管理各章节切换、角色对话渲染及数值修改 */

class GameState {
    constructor() {
        this.currentPhase = 1; // 1-7 个游戏阶段
        this.time = new Date(1986, 3, 25, 1, 0, 0); // 1986年4月25日凌晨1点 (月份0-indexed)
        this.gameOver = false;
        
        // 反应堆核心状态变量 (RBMK-1000)
        this.power = 3200;       // 额定热功率 (MWth)
        this.orm = 30.0;         // 操作反应性裕度 (控制棒当量根数)
        this.xenon = 1.0;        // 相对氙-135浓度
        this.voidCoeff = 0.02;   // 空泡份额 (0 - 1)
        this.coolantFlow = 48000; // 冷却水流量 (m³/h)
        this.reactorTemp = 280;  // 堆芯平均温度 (℃)
        this.neutronFlux = 1.2e14; // 中子通量 (n/cm²·s)

        // 阶段 5 官僚数值
        this.suspicion = 10;     // KGB怀疑度 (0 - 100, 达到100则 Game Over)
        this.citizenDose = 0.0;  // 平民累积辐射剂量 (mSv)
        
        // 阶段 7 英雄数值
        this.heliSand = 0;       // 直升机投沙量 (吨)
        this.heliDose = 0.0;     // 直升机飞行员剂量 (Sv)
        this.diverDose = 0.0;    // 潜水员小队剂量 (mSv)
        this.diverBattery = 100; // 潜水员手电筒电量 (%)
        this.roofCleared = 0;    // 楼顶石墨清理块数

        // 对话框打字机效果计时器
        this.dialogueTimer = null;
    }

    // 时间前推
    addMinutes(m) {
        this.time.setMinutes(this.time.getMinutes() + m);
        this.updateHeaderTime();
    }

    addSeconds(s) {
        this.time.setSeconds(this.time.getSeconds() + s);
        this.updateHeaderTime();
    }

    // 格式化输出系统时间
    updateHeaderTime() {
        const timeEl = document.getElementById('game-time');
        if (timeEl) {
            const year = this.time.getFullYear();
            const month = String(this.time.getMonth() + 1).padStart(2, '0');
            const date = String(this.time.getDate()).padStart(2, '0');
            const hours = String(this.time.getHours()).padStart(2, '0');
            const minutes = String(this.time.getMinutes()).padStart(2, '0');
            const seconds = String(this.time.getSeconds()).padStart(2, '0');
            timeEl.textContent = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
        }
    }

    // 切换视口
    switchView(viewId) {
        // 隐藏所有交互面板子视口
        const views = document.querySelectorAll('.panel-view');
        views.forEach(v => v.classList.remove('active'));
        
        // 显示指定视口
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        } else {
            console.error(`View with id ${viewId} not found.`);
        }
    }

    // 渲染对话与选项
    showDialogue(speaker, text, choices = [], avatar = "👤") {
        const speakerInfo = document.getElementById('speaker-info');
        const speakerName = document.getElementById('speaker-name');
        const speakerAvatar = document.getElementById('speaker-avatar');
        const storyText = document.getElementById('story-text');
        const choiceContainer = document.getElementById('choice-container');

        // 清除之前的选择
        choiceContainer.innerHTML = '';

        if (speaker) {
            speakerInfo.style.display = 'flex';
            speakerName.textContent = speaker;
            speakerAvatar.textContent = avatar;
        } else {
            speakerInfo.style.display = 'none';
        }

        // 打字机效果渲染剧本内容
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        storyText.textContent = '';
        let index = 0;
        
        // 快捷音效：按键嘀声
        if (window.audio) {
            window.audio.playBeep(800, 0.03, 0.02);
        }

        this.dialogueTimer = setInterval(() => {
            if (index < text.length) {
                storyText.textContent += text[index];
                index++;
            } else {
                clearInterval(this.dialogueTimer);
                // 打字完成后渲染选项按钮
                this.renderChoices(choices);
            }
        }, 15); // 每字15毫秒
    }

    renderChoices(choices) {
        const choiceContainer = document.getElementById('choice-container');
        choiceContainer.innerHTML = '';
        
        choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = `btn ${c.danger ? 'btn-danger' : 'btn-primary'}`;
            btn.textContent = c.text;
            btn.addEventListener('click', () => {
                if (window.audio) {
                    window.audio.playBeep(1200, 0.05, 0.05);
                }
                c.callback();
            });
            choiceContainer.appendChild(btn);
        });
    }

    // 结束游戏逻辑
    triggerGameOver(reason) {
        this.gameOver = true;
        this.switchView('view-intro');
        
        const titleEl = document.querySelector('#view-intro h2');
        const descEl = document.querySelector('#view-intro p');
        const startBtn = document.getElementById('btn-start-game');

        if (window.audio) {
            window.audio.stopAlarm();
            window.audio.stopGeigerStatic();
        }

        titleEl.textContent = "【模拟终止 / GAME OVER】";
        titleEl.style.color = "var(--alert-red)";
        descEl.textContent = reason;
        descEl.className = "critical-alert";
        startBtn.textContent = "重新加载系统";
        startBtn.onclick = () => {
            window.location.reload();
        };
    }
}

// 挂载至全局
window.GameState = GameState;
