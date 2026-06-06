// codex: 2026-06-07 增加大结局解锁的盖革计数器沙盒主界面启动按钮与点击绑定
/* js/main.js - 游戏主控制与初始化脚本 */
/* codex: 2026-06-06 引入 localStorage 自动加载进度与重置进度按钮逻辑 */

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
            // 情节触发校验：在试验惰转开始前，或手动卡死前，禁止操作安全罩
            if (!window.reactor || !window.reactor.az5Unlockable) {
                if (window.audio) {
                    window.audio.playBeep(150, 0.15, 0.12); // 报错低音
                }
                az5Shield.classList.add('locked-flash');
                setTimeout(() => {
                    az5Shield.classList.remove('locked-flash');
                }, 400);
                return;
            }

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

    const rodSlider = document.getElementById('rod-slider');
    if (rodSlider) {
        rodSlider.addEventListener('change', () => {
            if (window.audio) {
                window.audio.playBeep(800, 0.04, 0.02);
            }
        });
    }

    // 6. 重置进度按钮事件绑定
    const resetBtn = document.getElementById('btn-reset-game');
    if (resetBtn) {
        const savedPhase = localStorage.getItem('chernobyl_game_phase');
        if (savedPhase) {
            resetBtn.style.display = 'inline-block';
        }
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem('chernobyl_game_phase');
            window.location.reload();
        });
    }

    // 7. 页面加载时如果存在 localStorage 进度，则自动跳转
    const savedPhase = localStorage.getItem('chernobyl_game_phase');
    if (savedPhase) {
        const phaseNum = parseInt(savedPhase, 10);
        if (phaseNum >= 1 && phaseNum <= 7) {
            const initAudioOnGesture = () => {
                window.audio.init();
                window.removeEventListener('click', initAudioOnGesture);
                window.removeEventListener('touchstart', initAudioOnGesture);
            };
            window.addEventListener('click', initAudioOnGesture);
            window.addEventListener('touchstart', initAudioOnGesture);

            // 直接跳转至保存的阶段
            window.scenario.jumpToPhase(phaseNum);
        }
    }

    // 8. 盖革计数器沙盒入口绑定
    const geigerUnlocked = localStorage.getItem('chernobyl_geiger_unlocked') === 'true';
    const sandboxBtn = document.getElementById('btn-start-geiger-sandbox');
    if (sandboxBtn) {
        if (geigerUnlocked) {
            sandboxBtn.style.display = 'block';
        }
        sandboxBtn.addEventListener('click', () => {
            window.audio.init();
            window.audio.playBeep(1000, 0.1, 0.1);
            if (!window.geigerSandbox) {
                window.geigerSandbox = new GeigerSandboxManager(window.state);
            }
            window.geigerSandbox.enterSandbox();
        });
    }
});
