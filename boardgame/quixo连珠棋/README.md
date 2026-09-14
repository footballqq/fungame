# Quixo 立方体战棋 (扭转战棋) - HTML5 游戏

《Quixo》（扭转战棋）是一款融合了滑动拼图与五子棋机制的经典抽象对弈木质棋盘游戏。本作严格遵循官方原版规则与《Quixo立方体战棋.docx》博弈数学逻辑，提供拟真木质质感界面、自适应触控交互、内置 Web Audio 拟真音效、多级 AI 对弈与双人同屏对战。

---

## 游戏规则与数学逻辑

### 1. 棋盘与初始状态
- **棋盘**：5×5 凹槽木盘，包含 25 个正方体积木。
- **棋子**：每个积木有 6 个面：一面为 **○**，相对面为 **×**，其余 4 个侧面全部是**空白**。
- **开局**：所有 25 块积木均以**空白面朝上**平铺在棋盘中。玩家分别执 **○** 与 **×**。

### 2. 回合流程（两步强制操作）
每回合玩家必须严格完成“取子”与“推入”两个动作：
1. **第一步：取子（边缘判定）**
   - 只能从棋盘**最外围一圈（共 16 个位置）**取出一枚积木，绝对不能抽取内部 3×3 的积木。
   - 取出的积木必须是**空白面朝上**，或者**自身图案朝上**。严禁抽取对手图案朝上的积木。
2. **第二步：推入（滑动移位）**
   - 将取出的积木翻转为你自己的图案朝上。
   - 从该积木被取出后留有空位的**行或列的顶端推入**，将该行/列其余 4 块积木整体朝空缺处平推一格，将你的积木补入最外侧。
   - **推入方向限制**：
     - 角位（Corner）：只能沿构成该角的两条边之一推入（2 种推法）。
     - 边缘非角位（Edge）：可以从该行/列的相对端推入，或者垂直方向的两端推入（3 种推法）。
     - **禁手限制**：不能原样放回原位（必须使这一行/列发生位移）。

### 3. 胜负判定与关键“自杀”规则
- **胜利**：横向、纵向或对角线任意方向率先排成**连续 5 个自己的图案**即获胜。
- **“自杀”负判定（极其关键）**：如果某步推入导致双方**同时**达成 5 连，或者你推入后**只让对手**达成了 5 连，无论如何，**行动方直接判负，对手获胜**。

---

## 项目架构与技术亮点

- **架构清晰**：遵循高内聚、低耦合的模块化设计，每个代码文件均在 500 行以内。
  - [`index.html`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/index.html): 主界面与视图容器（静态资源带 `?v=` 版本号防旧版缓存）
  - [`css/style.css`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/css/style.css): 深漆胡桃木配色体系、流式棋盘尺寸变量（`--cell-size`）、拟真积木立体质感
  - [`css/modal.css`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/css/modal.css): 规则说明与胜负结算弹窗样式
  - [`css/responsive.css`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/css/responsive.css): 手机 / Pad / PC / 横屏矮窗口多端断点适配
  - [`js/game-model.js`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/js/game-model.js): 棋盘数据模型与状态流转
  - [`js/game-rules.js`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/js/game-rules.js): 核心规则引擎（外圈判定、取子合法性、滑动算法、胜负自杀判定）
  - [`js/game-ai.js`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/js/game-ai.js): 智能对手（简单随机、中等启发式评估、困难 Minimax+Alpha-Beta 剪枝）
  - [`js/game-ui.js`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/js/game-ui.js): 视图控制、随棋格等比缩放的推入箭头定位、Web Audio API 合成音效
  - [`js/main.js`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/js/main.js): 游戏生命周期控制、对局模式流转、悔棋支持、棋盘大小调节
- **零外部资源依赖**：音频使用浏览器内置 `Web Audio API` 合成，图标使用纯 Unicode 字符与 CSS 渲染，无需网络加载任何外部字体或音频文件，离线即开即玩。
- **多端自适应**：
  - 棋盘格子尺寸由 `--cell-size: clamp(40px, min(视口宽分量, 视口高分量), 88px)` 流式计算，手机、Pad、PC、横屏矮窗口均自动适配不溢出。
  - 底部「🔍 棋盘大小」滑杆可手动调节格子边长（40~96px），点击「自动」恢复流式适配；手动值通过 `localStorage` 持久化，下次打开自动恢复。
  - 推入方向箭头按钮随棋格等比缩放，小屏不遮挡棋格；窗口尺寸/方向变化时箭头自动重新定位。
- **已修复的关键 bug**（根因剖析与排查过程详见 [`DEBUGGING.md`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/DEBUGGING.md) 调试文档）：
  1. `var { CellState }` 全局声明与 `game-model.js` 的 `const` 冲突，浏览器端规则与 AI 脚本整体 SyntaxError 失效，游戏无法初始化（Node 测试因模块函数作用域无法发现）。
  2. 选子后棋盘重渲染使被点棋子脱离文档，其点击冒泡被"点击外部取消选子"监听器误判，选子瞬间被取消、点击完全无响应。
  3. AI 走子后悔棋按钮未及时解锁。

---

## 快速开始

### 1. 运行游戏
直接在现代浏览器（Chrome、Edge、Safari、Firefox）中双击打开：
- [`index.html`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/quixo%E8%BF%9E%E7%8F%A0%E6%A3%8B/index.html)

### 2. 运行自动化测试套件

#### Python pytest 测试（验证几何判定、滑动逻辑、自杀判定）
```powershell
python -m pytest tests/test_quixo_logic.py -v
```

#### Node.js 集成测试（验证核心类、44 种开局走法与 AI 走子闭环）
```powershell
node tests/verify_js.js
```

#### 浏览器作用域回归测试（模拟 `<script>` 共享全局作用域，防 var/const 冲突致命 bug 复发）
```powershell
node tests/verify_browser_scope.js
python -m pytest tests/test_browser_scope.py -v
```
