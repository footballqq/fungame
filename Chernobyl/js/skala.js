/* js/skala.js - SKALA 中央计算机模拟系统 */
/* codex: 2026-06-06 SKALA 终端八进制查询逻辑与磁带读取时延模拟 */

class SkalaTerminal {
    constructor(gameState) {
        this.state = gameState;
        this.logEl = null;
        this.inputEl = null;
    }

    init() {
        this.logEl = document.getElementById('skala-log');
        this.inputEl = document.getElementById('skala-input');

        if (this.inputEl) {
            // 绑定回车事件
            this.inputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const command = this.inputEl.value.trim();
                    this.executeCommand(command);
                    this.inputEl.value = '';
                }
            });
        }

        this.clearLog();
        this.printLine("SKALA 中央控制台已就绪 (RBMK-1000 CPU v1986)");
        this.printLine("系统采用八进制编址。请输入指令进行参数轮询。");
        this.printLine("等待输入...");
    }

    clearLog() {
        if (this.logEl) this.logEl.innerHTML = '';
    }

    printLine(text, isWarning = false) {
        if (!this.logEl) return;
        const line = document.createElement('div');
        line.style.color = isWarning ? 'var(--alert-red)' : 'var(--terminal-green)';
        line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
        this.logEl.appendChild(line);
        this.logEl.scrollTop = this.logEl.scrollHeight; // 滚动到底部

        // 播放击键声
        if (window.audio) {
            window.audio.playBeep(1000, 0.02, 0.03);
        }
    }

    executeCommand(cmd) {
        if (!cmd) return;
        this.printLine(`SKALA> 执行: ${cmd}`);

        // 校验输入格式，是否为8位数字
        if (!/^[0-7]{8}$/.test(cmd)) {
            this.printLine("错误: 非法八进制指令格式。必须为8位八进制数！", true);
            return;
        }

        // 模拟指令执行
        switch (cmd) {
            case "00000104": // 查询堆芯温度 (℃)
                this.printLine("正在查询传感器组 104 (堆芯温度)...");
                setTimeout(() => {
                    this.printLine(`堆芯平均温度: ${Math.round(this.state.reactorTemp)} ℃`);
                }, 400);
                break;

            case "00000201": // 查询中子通量 (n/cm²·s)
                this.printLine("正在查询传感器组 201 (中子通量密度)...");
                setTimeout(() => {
                    this.printLine(`中子通量: ${this.state.neutronFlux.toExponential(4)} n/cm²·s`);
                }, 400);
                break;

            case "00000410": // 查询冷却剂总流量 (m³/h)
                this.printLine("正在查询传感器组 410 (主泵流量和蒸汽压力)...");
                setTimeout(() => {
                    this.printLine(`当前冷却剂流量: ${this.state.coolantFlow} m³/h`);
                }, 400);
                break;

            case "00000302": // 调用 PRIZMA 计算 ORM
                this.printLine("!!! 启动 PRIZMA 程序 !!!");
                this.printLine("正在读取磁带驱动器 M302...");
                
                // 模拟磁带读写时延，展现技术落后带来的无力感
                let progress = 0;
                const interval = setInterval(() => {
                    if (progress >= 3) {
                        clearInterval(interval);
                        this.printLine(`PRIZMA 计算完成。ORM (操作反应性裕度) = ${this.state.orm.toFixed(1)} 棒当量`);
                        if (this.state.orm < 15.0) {
                            this.printLine("警告: ORM 低于安全界限 15! 必须立即停堆!", true);
                        } else {
                            this.printLine("ORM 处于允许试验范围内。");
                        }
                        // 触发剧情事件，进行下一步
                        setTimeout(() => {
                            if (window.scenario) window.scenario.onPrizmaQueried();
                        }, 1500);
                    } else {
                        progress++;
                        this.printLine("正在进行磁鼓扇区定位和积分计算..." + ".".repeat(progress));
                        if (window.audio) {
                            window.audio.playBeep(400, 0.2, 0.02); // 磁带转动噪底
                        }
                    }
                }, 1000);
                break;

            default:
                this.printLine("错误码: 404 - 未定义物理通道或数据不可达。", true);
                break;
        }
    }
}

// 挂载至全局
window.SkalaTerminal = SkalaTerminal;
