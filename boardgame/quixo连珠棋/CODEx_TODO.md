# Quixo 立方体战棋 HTML 游戏 - 开发计划

## 阶段一：核心游戏逻辑
- [x] 1.1 创建游戏数据模型（棋盘、棋子状态、玩家）- 完成于 `js/game-model.js`
- [x] 1.2 实现取子规则（外围判定、所有权判定）- 完成于 `js/game-rules.js`
- [x] 1.3 实现推入规则（方向限制、滑动逻辑、禁止原位放回）- 完成于 `js/game-rules.js`
- [x] 1.4 实现胜负判定（五连检测、自杀规则）- 完成于 `js/game-rules.js`

## 阶段二：UI 界面
- [x] 2.1 创建 HTML 页面结构与 CSS 样式（拟真木质立体棋盘与立体积木效果）- 完成于 `index.html` 与 `css/style.css`
- [x] 2.2 实现棋盘渲染与棋子显示（○/×/空白状态与高亮可取状态）- 完成于 `js/game-ui.js`
- [x] 2.3 实现交互流程（选子→动态出现推入方向按钮/箭头→推入动画→落子）- 完成于 `js/game-ui.js` 与 `js/main.js`
- [x] 2.4 实现游戏状态提示（当前轮次、步骤提示、连线高亮、胜负模态框）- 完成于 `js/game-ui.js` 与 `index.html`

## 阶段三：AI 对手
- [x] 3.1 实现基础 AI（随机合法走法）- 完成于 `js/game-ai.js`
- [x] 3.2 实现进阶 AI（评估函数 + Minimax + Alpha-Beta 剪枝）- 完成于 `js/game-ai.js`

## 阶段四：完善与测试
- [x] 4.1 添加音效（基于 Web Audio API 拟真木质敲击与滑动音效）与动效 - 完成于 `js/game-ui.js`
- [x] 4.2 添加游戏设置（双人对弈、人机对弈[初级/中级/高级]、悔棋、重开）- 完成于 `js/main.js`
- [x] 4.3 全面测试与 bug 修复（pytest 测试套件 + Node 集成测试，验证 Quixo 核心规则 100% 通过）- 完成于 `tests/test_quixo_logic.py` 与 `tests/verify_js.js`
- [x] 4.4 更新文档与操作指南 - 完成于 `README.md`

## 阶段五：致命 bug 修复、配色完善与多端适配（2026-09-14）
- [x] 5.1 修复致命 bug①：`game-rules.js`/`game-ai.js` 顶层 `var { CellState }` 声明提升后与 `game-model.js` 全局 `const` 冲突，浏览器抛 SyntaxError 致两脚本整体失效、游戏无法初始化（Node CommonJS 测试因函数作用域无法发现）；改为仅在 CommonJS 环境经 `globalThis` 注入 - 完成于 `js/game-rules.js`、`js/game-ai.js`
- [x] 5.2 修复致命 bug②：选子触发 `renderBoard` 重建棋格使被点棋子脱离文档，其 click 冒泡到"点击外部取消选子"监听器时被误判为外部点击，选子瞬间被取消、点击完全失效；判定抽为 `QuixoGameController.shouldCancelSelection` 静态方法并跳过 `isConnected=false` 的游离目标 - 完成于 `js/main.js`
- [x] 5.3 修复小 bug③：AI 走完后悔棋按钮未解锁（`updateView` 在 `isProcessing` 复位前执行）- 完成于 `js/main.js`
- [x] 5.4 新增浏览器作用域回归测试（Node `vm` 模拟 `<script>` 共享全局作用域 + 游离目标判定单测）- 完成于 `tests/verify_browser_scope.js`、`tests/test_browser_scope.py`
- [x] 5.5 完善配色：深漆胡桃木夜色底 + 琥珀点缀，○蓝方/×红方棋子顶面分色着色、金色渐变标题、流光胜利格 - 完成于 `css/style.css`
- [x] 5.6 多端适配：`--cell-size` 流式 clamp（vw+vh 双分量）自适应手机/Pad/PC/横屏，箭头按钮尺寸随棋格等比缩放，新增手机/平板/横屏断点 - 完成于 `css/style.css`、`css/responsive.css`
- [x] 5.7 棋盘大小手动调节：底部滑杆（40~96px）+ "自动"恢复流式适配 + localStorage 持久化，窗口变化时箭头自动重定位 - 完成于 `js/main.js`、`index.html`
- [x] 5.8 静态资源加 `?v=` 版本号防旧版缓存；弹窗移除 `backdrop-filter` 规避低端 WebView 合成问题；样式拆分 `css/modal.css` 保持单文件 ≤500 行
- [x] 5.9 全流程回归验证：pytest 7 项 + Node 集成 + 浏览器作用域模拟全部通过；浏览器实测手机 375×667 / Pad 768×1024 / PC 1280×720×800 / 手机横屏 667×375 四种视口的初始化、走子、AI 应答、悔棋、弹窗与滑杆
- [x] 5.10 沉淀调试文档 `DEBUGGING.md`：完整保留两个致命 bug 的排查过程、根因机理（var 提升/GlobalDeclarationInstantiation、事件路径固化与游离目标 closest 语义）、修复方案、回归防线与调试环境踩坑经验（启发式缓存、无限动画点击超时、截图合成器伪影、evaluate 传参形式、多视口布局断言清单）
