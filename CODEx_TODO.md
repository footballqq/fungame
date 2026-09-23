<!-- codex: 2026-09-23 开发正三角形点阵移除(triangleremove)网页游戏，支持启发式教学、规则图解、星阵故事、连线指示剩余三角形、历史记录、答案演示与Web Audio音效 -->
- [X] 算法设计与单元测试（`boardgame/triangleremove/triangle_math.py`, `tests/test_triangle_game.py`），全量验证 15 点 35 个正三角形分类、严格 7 点下界与 3 组对称最优解、以及 3/6/10 点阶梯关卡，6项pytest全绿通过
- [X] 核心数据与几何拓扑引擎（`boardgame/triangleremove/js/config.js`, `boardgame/triangleremove/js/engine.js`），支持点阵拓扑、正/倒/倾斜正三角形判定、实时剩余三角形计算与分类统计
- [X] 纯算法 Web Audio 实时音效系统（`boardgame/triangleremove/js/audio.js`），支持星石点按、消除、复原、剩余三角形警示连线弦音与胜利华彩
- [X] 动态画布与剩余正三角形高亮连线渲染引擎（`boardgame/triangleremove/js/canvas.js`），实现星石发光质感、动态连线描绘所有或选定剩余正三角形、动画过渡
- [X] 启发式教学系统与阶梯关卡（`boardgame/triangleremove/js/teaching.js`），5 阶段教学（认知35个三角形/鸽巢原理5下界/为什么6点不够/7点最优构造/3~15点阶梯关卡）
- [X] 沉浸式星阵封印故事系统（`boardgame/triangleremove/js/story.js`），星辰守望者剧情、打字机对话、章节推进与角色羁绊
- [X] 本地持久化与历史复盘系统（`boardgame/triangleremove/js/history.js`），localStorage 保存尝试历史、自定义收藏解法、一键载入棋盘复盘
- [X] 答案演示与交互控制器（`boardgame/triangleremove/js/demo_player.js`, `boardgame/triangleremove/js/ui.js`），支持 3 组最优解单步/连续播放演示、剩余三角形列表交互、撤销重置、帮助弹窗
- [X] 页面结构与自适应样式（`boardgame/triangleremove/index.html`, `boardgame/triangleremove/css/style.css`, `css/board.css`, `css/modal.css`），单文件严格 ≤ 500 行
- [X] 项目根目录主页 `index.html` 游戏导航集成与全流程单测验证，64项pytest全部绿灯通过
- [X] 移动端体验专项适配：修复 `touchend` 触摸坐标丢失与手势穿透Bug，优化移动端顶栏横向滑动紧凑排版，动态自适应画布比例与点击命中热区半径，排查雷达面板移动端解除全屏锁定，模态弹窗与2x2按钮自适应小屏，64项单测全绿通过


- [X] 核心状态与求解引擎（`boardgame/jumpfrog/js/game_state.js`, `boardgame/jumpfrog/js/solver.js`），支持双向/单向规则、合法走法判定、死局检测与最优路径计算
- [X] 表情包皮肤系统（`boardgame/jumpfrog/js/skins.js`），支持荷塘萌蛙、Pepe表情包、柴犬猫猫、魔性黄脸等多种主题与动态表情
- [X] 夸奖与鼓励激励系统（`boardgame/jumpfrog/js/praise.js`），包含连击夸奖、越蛙赞美、死局/受挫温柔提示、通关星级与彩屑动画
- [X] Web Audio 实时音效（`boardgame/jumpfrog/js/audio.js`），水滴/跃起/落荷/通关礼乐纯算法零外链生成
- [X] 自动教学演示控制器（`boardgame/jumpfrog/js/demo.js`），支持播放/暂停/单步快进/倒退与详细战术解说
- [X] 交互与渲染模块（`boardgame/jumpfrog/js/ui.js`），荷塘莲叶布局、平滑抛物线跳跃动效、提示高亮与撤销重做
- [X] 页面与样式（`boardgame/jumpfrog/index.html`, `boardgame/jumpfrog/css/style.css`, `boardgame/jumpfrog/css/modal.css`, `boardgame/jumpfrog/css/animations.css`），严格控制单文件 ≤500 行
- [X] 集成至主页 `index.html`，更新 `.codex/state.json` 与测试验证，12 项 pytest 全绿通过

<!-- codex: 2026-09-14 修复Dittle连跳转弯被"对角线"预检查误杀的校验顺序bug -->
- [X] 修复: `boardgame/tzarr/dittle_game_files/engine.js` Bug#8 `validateMoveAttempt` 校验顺序错误——"后退/对角线"预检查跑在合法走法表匹配之前，导致连跳中途 90° 转弯（规则 FAQ Q3 明确允许，落点相对起点为斜向位移）被"严禁对角线"误拒；改为先查 `getLegalMovesForDie` 权威匹配（BFS 已正确生成转弯连跳路径），方向预检查降级为非法尝试时的诊断提示；浏览器实测六类走法（转弯连跳/东西北直跳合法、后退/斜向提示正确），新增 `test_bug8_turned_jump_chain_not_blocked_by_diagonal_precheck` 回归测试，42 项 pytest 全部通过；`?v=` 升级 20260914c 防缓存
<!-- codex: 2026-09-14 修复Dittle骰战棋视觉顶面映射与初始朝向两大顽疾并整体加固 -->
- [X] 根因修复: `boardgame/tzarr/dittle_game_files/` 视觉顶面映射错误——CSS `.face-front`(translateZ 朝观众) 才是骰子坐在棋盘上的"视觉顶面"，`.face-top`(rotateX90) 实际显示为朝北背面，但旧代码把 front 填进视觉顶面、top 填进朝北面，导致无论初始值如何"顶面永远不是6"，且东西向翻滚(不改变 front)看起来"横滚点数不变"；新建独立渲染模块 `dice_view.js` 修正映射（视觉顶面填 top、朝北面填 7-front、朝东面填 right）并配数学法向投影单测锁定
- [X] 朝向修正: `dice_math.js`/`engine.js` 恢复初始朝向为 6 顶面朝上、3 面向对面玩家（白方 front=4/北面 back=3，黑方 front=3，两军 3 互相对视），此前一次提交误改为"3 朝向玩家自己"
- [X] 动画修复: `dittle_components.css` 东西向翻滚动画从 rotateZ(绕竖直轴自旋，观感像转盘) 恢复为 rotateY(绕南北水平轴真实翻面)；`animator.js` 翻滚点数改为动画中段(骰面侧立最模糊时)交换，观感如真实翻面
- [X] 健壮性: `ui.js` 新增 gameSeq 对局序号令牌与 aiTimer 管理——开新局后滞后的 AI 思考回调、动画完成回调自动作废，杜绝跨局走子；超时判负等 UI 侧终局同步设置 engine.gameOver 并取消挂起动画；骰子渲染拆分出 ui.js 保持单文件 ≤500 行
- [X] 防缓存: `dittle_game.html` 全部 css/js 引用加 `?v=20260914b` 版本号，防止浏览器缓存旧脚本造成"改了看不到"
- [X] 测试: `tests/test_dittle_game_engine.py` 更新初始朝向/翻滚运动学断言，新增视觉面值映射、法向投影(视觉顶面=face-front)、初始摆盘、rotateY 翻滚关键帧(禁 rotateZ)、竞态守卫、?v= 缓存参数 6 项测试，全套 42 项 pytest 通过；浏览器实测：初始三面点数(白顶6/朝对面3、黑顶6)、向北滚 6→4、向东滚 4→5→3、向西滚 3→5 引擎与页面渲染完全一致
<!-- codex: 2026-09-14 修复quixo连珠棋两个致命bug并完善配色与多端适配 -->
- [X] 体验: `boardgame/quixo连珠棋/` 推子动作可视化——被推棋子平滑滑动、新子翻面入场动画；AI 行动三阶段放慢（思考→取子播报“第x行第y列，向x推入”→推入动画）并引入 moveToken 防滞后回调误结算，玩家可完整看清电脑每一步
- [X] 文档: 沉淀 `boardgame/quixo连珠棋/DEBUGGING.md` 本地调试文档，完整保留两个致命 bug 的排查过程、根因机理、修复方案、回归防线与调试环境踩坑经验（启发式缓存/自动化点击超时/截图伪影/布局断言清单/调试方法论）
- [X] 修复: `boardgame/quixo连珠棋/` 致命bug① `game-rules.js`/`game-ai.js` 顶层 `var { CellState }` 提升后与 `game-model.js` 全局 `const` 冲突，浏览器端两脚本整体 SyntaxError 失效导致游戏无法初始化（Node CommonJS 测试因函数作用域无法发现）；改为仅 CommonJS 环境经 `globalThis` 注入
- [X] 修复: 致命bug② 选子后 `renderBoard` 重建棋格使被点棋子脱离文档，其点击冒泡被"点击外部取消选子"监听器误判，选子瞬间被取消、点击完全无响应；判定抽为 `shouldCancelSelection` 静态方法并跳过 `isConnected=false` 游离目标；另修复 AI 走子后悔棋按钮未解锁
- [X] 测试: 新增 `tests/verify_browser_scope.js`（Node vm 模拟浏览器共享全局作用域 + 游离目标判定单测）与 `tests/test_browser_scope.py`（pytest 包装），全套 7 项 pytest 通过
- [X] 视觉: 完善配色为深漆胡桃木夜色 + 琥珀点缀，○蓝方/×红方棋子顶面分色着色、金色渐变标题、流光胜利格
- [X] 适配: `--cell-size` 流式 clamp（vw+vh 双分量）自适应手机/Pad/PC/横屏；推入箭头随棋格等比缩放并在窗口变化时重定位；新增 `css/responsive.css` 断点；底部滑杆手动调节棋盘大小（40~96px，localStorage 持久化）+「自动」恢复
- [X] 健壮性: 静态资源加 `?v=` 版本号防旧缓存；弹窗移除 `backdrop-filter` 规避低端 WebView 合成问题；样式拆分 `css/modal.css` 保持单文件 ≤500 行；浏览器实测手机/Pad/PC/横屏四种视口全流程通过
<!-- codex: 2026-09-09 详述分块循环矩阵构造算法与三重合法性保证证明 -->
- [X] 优化: `stones/` 重构原理解析，详述分块循环矩阵构造算法 $A = \begin{pmatrix} I_k + P_k & 0 \\ I_k & I_k \end{pmatrix}$、坐标通式、三重数学保证（无格重叠、行和全为2、列容量容纳3/1枚）及 0-1 矩阵图解
<!-- codex: 2026-09-09 将 stones 奇偶棋子谜题加入项目主索引 index.html -->
- [X] 新增: 将 `stones/` 奇偶棋子谜题加入项目主入口 `index.html` 游戏列表并推送
<!-- codex: 2026-09-09 优化 stones 数学原理解析与大屏/移动端多端适配 -->
- [X] 优化: `stones/` 原理解析补充“任意 n 的奇偶解边界”数学证明（奇数无解、n=2无解、偶数n>=4严格2n及总结表格）
- [X] 优化: `stones/` 屏幕适配（全面适配手机与平板触摸排版，PC高分屏引入棋盘放大与尺寸缩放控制）
<!-- codex: 2026-09-09 新增 stones 奇偶棋子谜题网页游戏与算法测试 -->
- [X] 新增: `stones/` 6×6 奇偶棋盘谜题网页游戏（木质象棋质感、支持 4×4/6×6/8×8、最少棋子挑战、原理解析与最优解展示）
- [X] 测试: 使用 `pytest` 编写 `tests/test_stones_parity_puzzle.py` 覆盖奇偶性下界定理证明、构造解合法性与求解器各分支（并补 Node 单测 `stones/solver.test.js`）
<!-- codex: 2026-08-11 新增 foxchick 狐狸和鹅 网页游戏 -->
- [X] 新增: `foxchick/` “狐狸和鹅”网页游戏，基于 8x8 网格与一条对角线实现规则。支持双人对战、玩家扮演狐狸（PvE）、玩家扮演鹅（PvE），其中 AI 使用极小化极大算法确保最佳策略。
- [X] 新增: `chesshorse/` 国际象棋“马”走遍棋盘（默认 4×4，可选 N×N），走过格子变色不可再踩，支持“显示答案/动画演示/提示一步/撤销”，含春节元素与祝福语、玩家记录
- [X] 测试: 使用 `pytest` 覆盖 Knight's Tour 求解器的“无解/有解/路径合法性”关键场景（新增 `tests/test_chesshorse_knight_tour_solver.py`；并补 Node 单测 `chesshorse/knight_tour_solver.test.js`）
- [X] 文档: 补齐 `chesshorse/README.md`（玩法/按钮/答案与演示说明）

- [X] 新增: `history/historycards.py` 失败记录后继续处理，连续失败达到阈值才停止（默认 10）（新增 `--max-consecutive-failures`/`--stop-on-failure`）
- [X] 新增: 将失败条目汇总写入 `history/resources/cards/_errors.jsonl` 便于后续统一处理（新增 `--errors-file`，默认写到 `cards/_errors.jsonl`）
- [X] 测试: 使用 `pytest` 覆盖“继续处理/连续失败停止/错误汇总写入”3 个场景（新增 `tests/test_historycards_failure_handling.py`）
- [X] 修复: `snail/game.js` Mastermind 模式 AI 卡死，按 IMO 2024/5 三次尝试策略重写“边缘 M1 + 阶梯遇到 M2”的第三次逃脱路径，并移除自动强制放怪物逻辑
- [X] 测试: 使用 `node --test` 覆盖第三次逃脱路径规划关键分支（新增 `snail/ai_strategy.test.js`）
- [X] 体验: 用居中可爱对话框替换系统 alert，并补齐中英文文案（新增 `dialog_ok`/错误细分文案）
- [X] 适配: 改造 `snail/index.html`/`snail/style.css`，让游戏在手机与平板自适应布局与字号
- [X] 新增: 主宰模式 Stop/Resume + 可复制蜗牛日志（含决策/行动/碰撞），并在“第三次仍失败”时自动暂停提示复制日志；新增速度滑块可调蜗牛移动速度
- [X] 优化: 移除“安全/怪物”图例；主宰模式底部加引导文案与“解释”按钮（含棋盘+箭头演示为什么 3 次最优）；若第一轮扫描未放怪物则强制在最后格揭示怪物并弹出规则提示
- [X] 修复: `snail/game.js` 主宰模式“已走过=安全格”禁放怪物（新增中英文提示文案 + 校验函数 + Node 单测）
- [X] 优化: `snail/game.js` 冒险模式允许从任意“已确认安全格”（走过且未揭示怪物）出发（新增起点校验函数 + Node 单测）
- [X] 体验: 主宰模式蜗牛到终点改为失败提示（含探索次数 N）
- [X] 体验: 主宰模式第一轮未放怪物时弹窗暂停，玩家确认后再进入下一次探索（对话框支持 `onOk` 回调）
- [X] 测试: 使用 `node --test` 覆盖失败提示文案与“暂停不自动进入下一次”分支（新增纯函数 + 单测）
- [X] 新增: `snail/game.js` 冒险模式作弊：玩家选择蜗牛时，移动前动态重排怪物；若存在合法布局则强制下一步踩雷（新增 `tryBuildAdventureCheatMonsterLayout`）
- [X] 测试: 使用 `node --test` 覆盖冒险模式作弊布局求解器关键分支（更新 `snail/ai_strategy.test.js`）
- [X] 修复: `history/historycards.py` 兼容缺依赖环境（`pypinyin`/`openai` 缺失时可导入，便于 `pytest` 运行）

- [X] 新增: `apps/yingchun/` 首页“每日一题”，默认从 3–4 年级考试池确定性随机抽 1 题（支持开始练习/本设备换一题，并带缓存与加载提示）
- [X] 文档: 优化 `boardgame/tzarr/Tzaar_ I play the game_zh.html` 游戏规则说明（修正获胜条件表述及中心黑洞不可跨越等细节）
<!-- codex: 2026-09-13 参考 Tzaar 风格全文翻译 pyxorDittle 规则小册子并生成带图本地 HTML -->
- [X] 翻译: 参考 Tzaar 风格全文翻译 `boardgame/tzarr/pyxorDittle_rules_booklet_v1.pdf`，生成 `pyxorDittle_rules_zh.html`（提取并矫正全套示意图、涵盖走法/禁止规则/计分/Dittle Clash 冲突变体及 PocketMod 便携小册子折叠指南）
- [X] 规则: 补充消极防守例外处理（底线算上对手棋子填满即终局，每颗滞留己方骰子扣 10 分）并在吃子模式突出确认“单子达阵即获胜”
- [X] 体验: 新增一键切换纯黑白打印版按钮与 `@media print` 打印适配（纯黑白配色、去除深色阴影、A4/Letter 宽度自适应与分页优化，支持一键调用系统打印）
- [X] 测试: 使用 `pytest` 编写 `tests/test_dittle_rules_html.py` 覆盖 HTML 文件存在性、CSS 样式表、所有引用的图像资源有效性、关键规则完整性与黑白打印模式支持
<!-- codex: 2026-09-13 开发 Dittle 7x7 骰战棋网页对弈游戏（支持人机/人人/规则切换/独立棋钟/电脑放大/手机面对面翻转） -->
- [X] 新增: `boardgame/tzarr/dittle_game.html` 骰战棋对弈网页游戏，支持“标准骰战棋”与“冲突变体（Dittle Clash）”自选规则
- [X] 新增: 核心 3D 骰子物理旋转引擎 `dice_math.js` 与规则求解器 `engine.js`，实现精准走法校验与错误提示（禁止后退/斜走/跳跃着陆空位/变体禁跳等友善反馈）
- [X] 新增: 智能 AI 对手 `ai.js`（含初级/中级/高级三档极小化极大与战术评估）与极简 Web Audio 触觉音效 `sound.js`
- [X] 新增: 双路独立棋钟 `clock.js`，支持双方独立设定时长（1m/3m/5m/10m/不限时/自定义让时）及加秒，带超时判负与低时间告警
- [X] 适配: 多端自适应排版，PC 端支持放大/缩小/重置/全屏，手机端实现长短两端双人面对面对弈与 180° 翻转黑方显示
- [X] 入口: 将 Dittle 骰战棋集成至项目主入口 `index.html`，并与规则书双向互通跳转
<!-- codex: 2026-09-13 棋盘与骰子立体化：轻微斜视角 3D 棋盘与顶/前/右三面可视真实 3D 骰子 -->
- [X] 视觉: 实现轻微倾斜（19° 透视）的 3D 立体棋盘与木质边框立体阴影，支持顶部一键切换 3D 立体视角与 2D 俯视平面
- [X] 视觉: 实现真实 3D 骰子方块渲染，同时清晰呈现【顶面 Top】、【正面/南面 Front】与【右侧面 Right】三个面及对应点数，并附带微标提示，方便玩家即时预判翻滚点数
- [X] 测试: 在 `tests/test_dittle_game_engine.py` 补充 3D 视角与三面法向量向观众投影（Z>0）的数学验证单测，全部通过
<!-- codex: 2026-09-13 修正跳跃规则：单次跳跃只能越过 1 颗棋子，严禁越过 >= 2 颗连续棋子 -->
- [X] 规则: 修正 `engine.js` 中 `getSingleJumpsFrom` 与 `validateMoveAttempt`，严格限制单次跳跃只能且必须越过 1 颗相邻棋子并落入紧接的空格，严禁一次性跳过连续 2 颗或更多棋子；并在非法跳跃时提示具体原因
- [X] 文档: 在 `pyxorDittle_rules_zh.html` 与 `Dittle_rules_zh.html` 明确强调“单次只能跳过 1 颗棋子，连跳之间必须有落脚空格”
- [X] 测试: 在 `tests/test_dittle_game_engine.py` 补充跳跃障碍数严格为 1 的单测覆盖，全部 27 项测试通过
<!-- codex: 2026-09-13 移动过程增加暂停过场与步步动画（彻底杜绝瞬移，方便看清电脑步骤） -->
- [X] 动效: 新增 `animator.js` 独立动效模块，实现起步定格（320ms 高亮起步棋子）与分步平滑推进；跳跃实现 3D 抛物线空中飞跃（`anim-hop`），翻滚实现倾斜动效（`anim-tilt`），每步均播放音效并停顿 ~350ms
- [X] 视觉: 增加最后一步完整轨迹高亮（起始格琥珀金虚线框、终点格青碧呼吸光晕、跳跃途经落脚点小圆标），即使动效播放完毕依然清晰可见
- [X] 体验: AI 思考增加 450ms 过渡停顿，走棋期间禁用玩家点击（`isAnimating` 互斥保护），防止误触卡死
- [X] 测试: 在 `tests/test_dittle_game_engine.py` 补充动效模块与过渡样式校验单测，全部 28 项测试通过
<!-- codex: 2026-09-13 调亮棋盘与单元格，增强木质层次与黑白骰子高对比度 -->
- [X] 视觉: 调亮棋盘外框、沟壑网格与 49 个单元格色调（微暖柚木与胡桃木轻质感 `#482e1d`~`#382012`），底线增加鲜明金色边界标线，黑骰与白骰反差对比度大幅提升
<!-- codex: 2026-09-13 澄清骰子初始朝向规则与消除角标方向歧义 -->
- [X] 规则: 详述官方英文规则“All 7 dice must show #6 facing up and #3 facing the player”与图解力学原理（3 必须朝向玩家自己，向前翻滚后 3 顺势转为顶面；朝向对面为 4）；并在 UI 中移除易混淆的“前:”字标签，改为纯净数字角标并附带悬浮详细朝向解析提示
<!-- codex: 2026-09-13 实现沉浸式对弈背景音乐合成器(BGM)与全套交互走棋音效(SFX) -->
- [X] 音频: 打造基于 Web Audio API 的轻柔对弈背景音乐合成器（BGM），纯算法实时生成 Cmaj7-Am9-Fmaj7-Gsus4 温暖和弦垫声与五度晶莹八音盒琶音，离线零依赖、平滑淡入淡出
- [X] 音效: 补齐拾起骰子(playSelect)、放下(playDeselect)、扎实双重木质翻滚(playTilt)、飞跃着落(playJump)、冲突消除(playClash)、非法操作警告(playIllegal)、开局钟鸣(playGameStart)、换回合微响(playTurn)与胜负和弦(playWin/playLose)
- [X] 控制: 顶栏增加『🎵 音乐』与『🔊 音效』双路独立切换控制及高亮状态，并在设置弹窗同步提供独立开关联动
- [X] 测试: 在 `tests/test_dittle_game_engine.py` 补充音效合成器与音频控制单测覆盖，全部 29 项测试通过
<!-- codex: 2026-09-13 将 Dittle 7x7 骰战棋对弈游戏与规则手册双向整合至主页 index.html -->
- [X] 入口: 在项目根目录 `index.html` 的主游戏网格（紧随“奇偶棋子谜题”）与棋盘游戏专区全面加入 `dittle_game.html` 游戏对弈入口与规则手册双按钮卡片
- [X] 测试: 在 `tests/test_dittle_game_engine.py` 补充验证 `index.html` 完整包含 `boardgame/tzarr/dittle_game.html` 链接引用，单测全部通过
<!-- codex: 2026-09-14 设定黑白双方初始朝向均为6是top、3面向对面 -->
- [X] 规则: 更新 `dice_math.js`、`engine.js`、`ui.js` 以及中英文规则小册子，设定双方骰子初始均为 6 顶面朝上、3 面向对面（白方朝北为 3/迎面为 4，黑方朝南为 3/迎面为 3，两军对垒双方 3 互相对视）
- [X] 测试: 在 `tests/test_dittle_game_engine.py` 补充验证白棋与黑棋 6 朝上、3 面向对面初始状态与翻滚运动学，29 项测试全部通过
<!-- codex: 2026-09-14 实现向左向右侧向真实3D翻滚、终局复盘检视与可折叠对局记录一键复制 -->
- [X] 物理与动效: 在 `animator.js` 与 `dittle_components.css` 实现向左向右侧向真实 3D 翻滚动画（`anim-tilt-west` / `anim-tilt-east`）与向前向后纵向翻滚动画，并在落脚点即时呈现新顶面点数；UI 悬浮提示增加前/左/右三向翻滚点数预判
- [X] 体验: 终局结算弹窗新增“🔍 查看当前棋盘”与右上角关闭按钮，配套 `#gameOverReviewBanner` 终局检视横幅，彻底杜绝强制重新开局，允许玩家自由查看终局棋盘、骰子三面点数并随意切换 2D/3D 视角，随时可再开新局
- [X] 调试与记录: 新增独立模块 `logger.js` 与右侧可折叠对局记录侧栏（`#gameLogSidebar`），步步追踪走棋方、动作类型（向北/南/东/西翻滚、跳跃）、坐标路径、骰子顶/前/右三面点数变化及碰撞吃子详情，并支持一键复制完整文本记录粘贴发给 AI
- [X] 测试: 在 `tests/test_dittle_game_engine.py` 补充侧向翻滚运动学、终局检视非阻塞性与记录器导出单测，全套 32 项 pytest 全部通过，且所有文件严格小于 500 行
<!-- codex: 2026-09-14 参照官方规则 PDF 审计并修复 7 个 bug -->
- [X] 高危修复: `engine.js` checkGameOver 先切换回合再检查无子可动，防止误判走子方判负（Bug#1）
- [X] 高危修复: `ui.js` AI 无合法走法时正确宣布人类获胜，不再 UI 假死冻结（Bug#2）
- [X] 高危修复: `engine.js` Clash 模式达阵即胜判定优先于碰撞裁决，防止达阵棋子被误杀（Bug#3）
- [X] 中危修复: `engine.js` 跳跃 BFS 起点加入 visited 集合 + 直接跳跃用临时棋盘清空起点（Bug#4）
- [X] 中危修复: `ui.js` 超时/无步判负时不再显示无意义的 0-0=0 得分面板（Bug#5）
- [X] 低危修复: `engine.js` 对角线非法检测扩展到任意步长（Bug#6）
- [X] 低危修复: `ui.js` 移除构造函数重复渲染调用，消除 startNewGame 双重执行（Bug#7）
- [X] 测试: 补充 8 项针对性 bug 修复单测，全套 21 项 pytest 全部通过
<!-- codex: 2026-09-14 完善滑冰棋 (Slide Chess) UI及体验 -->
- [X] 体验: 修复 2D 棋盘画面跳动与缩放问题，锁定更新逻辑，加入拖拽与滑块控制纯视口缩放
- [X] 记录: 增加对局日志拷贝、隐藏与每局自动清空功能
- [X] 入口: 将滑冰棋链接加入根目录 index.html
