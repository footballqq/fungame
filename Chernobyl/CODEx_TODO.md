# Chernobyl Game Development TODO

- [X] **Phase 1: Game Design Document & Asset Preparation**
  - [X] Write detailed game design document (`docs/design_document.md` / `game_design.md` in artifact) detailing the narrative, UI mockup designs, character dialogues, state machine variables, and minigames.
  - [X] Formulate directory layout and verify existing resources (maps, images).
- [X] **Phase 2: Project Setup & Style Base**
  - [X] Initialize `index.html` structure.
  - [X] Create `index.css` and sub-styles in `style/` (e.g. `style/reactor_skala.css`, `style/exploration.css`, `style/forsmark_liq.css`) with dark theme, terminal effects, CRT monitor look, retro fonts, and responsive grid layouts. Checked code lines limit (<= 500 lines per file).
  - [X] Create `js/audio.js` using Web Audio API to dynamically synthesize geiger clicks, alarms, and system beeps.
- [X] **Phase 3: Core Simulation Engines (Js Modules)**
  - [X] Create `js/state.js` to manage global game state, characters, and transitions.
  - [X] Create `js/reactor.js` with reactor thermal power calculations, xenon poisoning simulation, control rods ORM, void coefficient feedback, and the AZ-5 positive SCRAM explosion.
  - [X] Create `js/skala.js` implementing the SKALA central computer command-line, octal querying, and delayed computation.
  - [X] Create `js/geiger.js` for post-accident corridor navigation, Geiger counter clicks, radiation hotspot estimation, and the high-range radiometer search puzzle.
- [X] **Phase 4: Global & Narrative Modules**
  - [X] Create `js/scenario.js` containing dialogue branches, character scripts (Dyatlov, Akimov, Toptunov), KGB phone line-cutting, and evacuation city map.
  - [X] Create `js/forsmark.js` for the Swedish laboratory portal alarm, gamma spectrometer analysis, and wind map overlay.
  - [X] Create `js/liquidators.js` for helicopter cargo planning, bubbler pool diver maze (2D tile-based or pathfinding), and Masha roof 90s cleanup minigame.
- [X] **Phase 5: UI Assembly & Responsive Adaptation**
  - [X] Update `index.html` with component containers.
  - [X] Write `js/main.js` to coordinate state changes and UI views.
  - [X] Ensure mobile touch interactions work for sliders, keypads, and canvas mazes.
- [X] **Phase 6: Automated Verification & Manual Testing**
  - [X] Write a python script (`tests/test_game_assets.py`) to verify all assets and files exist and conform to layout.
  - [X] Write unit tests for the reactor physics equations in Python to verify reactor-core logic mathematically.
  - [X] Perform final review and verify cross-device responsive layout. Tests run successfully and show all green.
- [X] **Phase 7: Optimization & User Feedback (2026-06-06)**
  - [X] 放大反应堆控制面板仪表与滑块比例，优化桌面端布局占比（75% 与 25% 分离）。
  - [X] 实现手动控制棒插入失败逻辑：当玩家试图插入控制棒时，控制棒在 65% 深处卡死，并弹出高温管道变形警告对话框。
  - [X] 优化停堆后反应堆功率增长曲线：AZ-5 正停堆效应和蒸汽空泡正反馈被调整为强烈的指数级上升，热功率在 4-5 秒内暴增超 30,000 MW 触爆，配以骤增的盖革计数器爆鸣。
  - [X] 重构控制棒 2D Canvas 切面动画：所有像素位置和元素（碳化硼、石墨慢化体、X卡死红叉）完全重写为基于容器高度的动态比例自适应。
  - [X] 修复 PowerShell 自动化测试脚本在中文 Windows 系统的 CP936 编码解析问题。
  - [X] 优化直升机空投关卡：修复 targetX 和 targetY 初始 NaN 导致直升机消失的 bug，移除飞行物理迟滞，使直升机零延迟跟随鼠标/手指移动，并在 CSS 隐藏系统鼠标指针，使鼠标本身变身直升机；阻止移动端触控滑动触发页面滚动。
  - [X] 简化空投操作：直升机每次载重提升为 2000 吨并增加 1 秒装填冷却，无需飞回基地，直接在堆芯附近点击 3 次即达 6000 吨过关。
  - [X] 实现 LocalStorage 进度自动保存与加载：通过 `GameState` 的 `currentPhase` 状态属性 setter 自动将关卡进度写入缓存。页面刷新后直接无缝跳入之前正在调试/运行的关卡，并添加全局一次性监听器以兼容浏览器的 Audio 交互策略。
  - [X] 添加“重置进度”重玩按钮：在页面顶部状态栏新增“重置进度”按钮，仅在有保存进度时显示。点击即可清空 LocalStorage 缓存并重载网页回初始界面。
  - [X] 增加直升机文字交互指令空投按钮：在 Canvas 视图下方增加了“直接向反应堆核心投沙”大按钮，点击自动对准核心并投沙，解决大拉伸或手机屏幕上的物理热区难对齐问题。
  - [X] 优化地下室排水潜水员关卡：失败后直接在原地弹出“重新开始排水任务”对话框，无需退回欢迎页；支持鼠标和手机触屏点击迷宫网格直接瞬移，极大方便了操作；将电池消耗速度调慢 3 倍、辐射累积速度减弱 4倍，方便玩家轻松通关。
  - [X] 强化历史英雄叙事：在排水任务通关时，以庄严科普和尊崇的笔触，叙述了阿纳嫩科、贝斯帕洛夫、巴拉诺夫三位英雄虽受高剂量辐射但并未当场牺牲、而是奇迹幸存至晚年并见证历史的真实史实，彰显了无畏献身的血肉盾牌精神。
  - [X] 增强潜水迷宫引导与视口大小适配：在迷宫内为阀门和出口绘制清晰的“阀”和“出口”文字标识，并在 Canvas 左上角绘制绿色终端文字 HUD 实时更新开启状态与动作指引；当玩家碰到排污阀时，自动弹窗展示“拧开沉重生锈阀门”的明确动作文字描写；将迷宫画布的最大宽度从 260px 调大为 360px (小屏适配为 280px)，画布物理尺寸调大为 400x400 (网格大小 40px)；调亮迷宫网格与通道，引入手电筒高亮绿色偏心光晕渐变，并将排污阀与出口提取到裁剪区外绘制，加持炫酷的红/绿/黄发光阴影特效，使其作为黑暗中的指示灯标灯塔始终可见，彻底解决“太暗、太小、找不到或只能看见一个阀门”的痛点。
  - [X] 优化潜水员和屋顶关卡：将潜水员出口改回最上方的入口 `(1,1)`（符合潜水员爬下并原路返回的物理常理，增加取回阀门后往回狂奔的紧张感），进一步调高排污阀/出口发光指示灯亮度（追加了亮绿/亮红/亮黄的霓虹灯外描边与 `shadowBlur = 35` 强外发光）；将生物机器人屋顶清理（Masha）关卡彻底重构为极度紧张刺激的战术叙事对话树（以塔拉卡诺夫将军对“人类清理者”的英勇动员和战士顶着致死辐射英勇投掷石墨、同原子死神展开殊死搏斗的悲壮文字作选择驱动，Canvas 画布上则展示因高剂量辐射严重干扰雪花撕裂的监控摄像画面），歌颂工人和战士的无私奉献与英雄主义，完美解决了触碰无反应的痛点。
  - [X] 优化游戏结束与重玩体验：在游戏结束界面（Game Over）新增“🔄 重玩本关”与“⚡ 重开整场游戏 (清空存档)”两个明确动作选项。点击“重玩本关”无需重新加载页面即可清空本阶段临时累积的危险数值并瞬间将剧情与视口重置回当前关卡起点，彻底消除因“重新加载系统”文案含义模糊而让玩家误以为会丢失整场进度的焦虑。
  - [X] 实现盖革计数器沙盒模拟器：在大结局阶段通过 `localStorage.setItem('chernobyl_geiger_unlocked', 'true')` 缓存解锁标记；在游戏大结局处提供“🔮 进入盖革计数器沙盒模拟器”与“🚪 返回系统引导主界面”两个选项；在主界面根据已解锁缓存显示绿色“☢️ 盖革计数器沙盒模拟器 (已解锁)”按钮并支持点击直接进入；在 `js/geiger_sandbox.js` 中独立实现 `GeigerSandboxManager` 模块以遵守单文件不超过500行的门禁约束；通过 Canvas 动态绘制带有对数刻度、黄色中心轴以及伴随辐射场强抖动的红色荧光指针；配合滑块拖动及常见/突发辐射源（香蕉、镭表表盘、熔融象脚、中子突增、核降雨等）以实时换算数字显示和动态更新背景 Geiger 计数爆鸣音强。
  - [X] 优化手机布局及潜水员关卡：在移动端媒体查询中为 `.narrative-panel` 增加 `padding-bottom: 30px` 并为 `.choice-container` 增加 `margin-bottom: 20px`，彻底解决手机屏幕上对话选择按钮最底部被遮挡剪切的问题；为地下室潜水排污阀开启关卡新增“文字交互式战术调度”模式分支，玩家可以在手机上通过高沉浸感剧情选择，分步骤开阀门并及时撤退通关，且数值同步渲染更新；将 `js/liquidators.js` 按子游戏拆分出 `js/liquidators_diver.js` 和 `js/liquidators_roof.js` 两个新文件，确保每个脚本均低于 500 行。
  - [X] 丰富游戏背景、说明及科学科普：在初始引导界面 `view-intro` 嵌入了极具终端感的历史背景与游戏操作说明；重构 `scenario.startStory()`，在游戏最开始插入了切尔诺贝利4号堆发电厂安全惰转试验开篇背景介绍对话；在 `js/scenario.js` 关键剧情处增加了物理科普选项（如氙-135中子毒化阱、冷却沸腾蒸汽正空泡反馈、AZ-5置换端头正停堆引爆等机制），并新增未来核聚变与裂变能对比、氘-氚循环及锂-6造氚机理，内容全部精练并提炼自 `叮当核物理_extracted.txt`；创建独立文件 `js/scenario_science.js` 以保持每个 JavaScript 脚本在 500 行安全限制以内。



