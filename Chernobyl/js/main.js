/* js/main.js - 游戏主控制与初始化脚本 */
/* codex: 2026-06-06 实例化各系统类，绑定按钮监听器，衔接整体系统 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 实例化全局游戏管理模块
    window.state = new GameState();
    window.audio = new ChernobylAudio();
    window.reactor = new ReactorSimulator(window.state);
    window.skala = new SkalaTerminal(window.state);
    window.geiger = new GeigerExplorer(window.state);
    window.evacuation = new EvacuationManager(window.state);
    window.forsmark = new ForsmarkManager(window.state);
    window.liquidators = new LiquidatorsManager(window.state);
    window.scenario = new ScenarioEngine(window.state);

    // 2. 绑定开始按钮
    const startBtn = document.getElementById('btn-start-game');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // 初始化音频上下文 (避开浏览器拦截)
            window.audio.init();
            
            // 播放界面欢迎嘀声
            window.audio.playBeep(1000, 0.1, 0.1);
            
            // 切换到剧情首屏
            window.state.switchView('view-reactor');
            
            // 启动剧情引擎
            window.scenario.startStory();
        });
    }

    // 3. 反应堆控制面板交互绑定：AZ-5 停堆安全盖
    const az5Shield = document.getElementById('az5-shield');
    const btnAz5 = document.getElementById('btn-az5');

    if (az5Shield && btnAz5) {
        az5Shield.addEventListener('click', () => {
            if (!az5Shield.classList.contains('open')) {
                // 打开玻璃罩
                az5Shield.classList.add('open');
                az5Shield.querySelector('.shield-label').textContent = "安全罩已开";
                btnAz5.disabled = false; // 激活停堆按钮
                
                if (window.audio) {
                    window.audio.playBeep(500, 0.15, 0.08); // 打开防护罩的金属碰声
                }
            } else {
                // 关闭玻璃罩
                az5Shield.classList.remove('open');
                az5Shield.querySelector('.shield-label').textContent = "AZ-5 安全罩";
                btnAz5.disabled = true; // 锁定按钮
                
                if (window.audio) {
                    window.audio.playBeep(400, 0.1, 0.08);
                }
            }
        });

        // 4. 按下 AZ-5 红色按钮
        btnAz5.addEventListener('click', () => {
            if (window.audio) {
                window.audio.playBeep(200, 0.5, 0.25); // 沉闷的机械按下声
            }
            
            // 触发反应堆停堆逻辑
            window.reactor.pressAZ5();
        });
    }

    // 5. 控制棒滑动条交互音效反馈 (限制高频触发，只在松开时或者变动时偶尔发出短嘀声)
    const rodSlider = document.getElementById('rod-slider');
    if (rodSlider) {
        rodSlider.addEventListener('change', () => {
            if (window.audio) {
                window.audio.playBeep(800, 0.04, 0.02); // 微弱调节机械声
            }
        });
    }
});
