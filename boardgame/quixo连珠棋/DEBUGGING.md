// codex: 2026-09-14 沉淀本次两个致命bug的完整排查过程、根因机理与调试环境踩坑经验
# Quixo 立方体战棋 — 开发调试文档

> 本文档记录 2026-09-14 修复"游戏完全无法使用"过程中定位到的两个致命 bug 与一个小 bug，
> 完整保留排查思路、根因机理、修复方案与调试环境踩坑经验，供后续开发与同类问题参考。

---

## 0. 快速命令

```powershell
# 运行全部 pytest 测试（含浏览器作用域回归测试）
python -m pytest tests/ -v

# Node 集成测试（核心类加载、44 种开局走法、AI 对弈闭环）
node tests/verify_js.js

# 浏览器作用域回归测试（模拟 <script> 共享全局作用域，防 Bug① 复发）
node tests/verify_browser_scope.js

# 本地调试服务器（浏览器无法直接打开 file: 链接时使用）
python -m http.server 8932 --bind 127.0.0.1
```

---

## 1. 致命 Bug①：浏览器全局 `var` 与 `const` 冲突 → 游戏无法初始化

### 1.1 现象

- 页面能打开，标题/文案正常（这些写在 HTML 里），但棋盘 **0 个格子**；
- `window.gameApp` 为 `undefined`；
- 控制台无直接报错提示（脚本级 SyntaxError 只在元素上触发 error 事件，容易被忽略）。

### 1.2 排查过程（分层定位：网络 → 脚本求值 → 运行时）

1. **查网络**：HTTP 服务器日志显示全部 5 个 JS 文件均 200，排除加载失败；
2. **查求值**：在页面里逐个 `typeof` 检查核心类：
   ```js
   // 结果：GameModel=function, GameUI=function, QuixoGameController=function
   //       GameRules=未定义, GameAI=未定义   ← 只有带 require 守卫的两个文件失效！
   ['CellState','Direction','GamePhase','GameModel','GameRules','GameAI','GameUI','QuixoGameController']
     .forEach(n => console.log(n, typeof eval(n)));
   ```
3. **提假设**：两个失效文件顶部都有 `var { CellState, Direction } = require(...)`，
   怀疑 `var` 声明提升与 `game-model.js` 的全局 `const CellState` 冲突；
4. **验假设**（最小探针）：向页面注入一个只含 `var CellState;` 的 `<script>`：
   ```js
   // 结果立即抛出：Uncaught SyntaxError: Identifier 'CellState' has already been declared
   const s = document.createElement('script');
   s.textContent = 'var CellState;';
   document.head.appendChild(s);
   ```

### 1.3 根因机理（重要！）

```js
// 出错的原写法（game-rules.js / game-ai.js 顶部）：
if (typeof require !== 'undefined' && typeof CellState === 'undefined') {
    var { CellState, Direction } = require('./game-model.js');
}
```

- **`var` 声明是静态提升的**：即使 `if` 条件为假，`var CellState` 也会在脚本实例化时
  被 `GlobalDeclarationInstantiation` 登记；
- 浏览器中所有经典 `<script>` 共享同一全局作用域，`game-model.js` 已用 `const CellState`
  建立了**全局词法绑定**；
- 规范规定：`var` 名字与既有全局词法绑定（let/const）同名 → 直接抛 `SyntaxError`，
  **整个脚本文件求值失败**，`GameRules`/`GameAI` 类从未被定义；
- 随后 `DOMContentLoaded` 里 `new QuixoGameController()` 构造器内
  `new GameRules(...)` 抛 `ReferenceError`，游戏初始化中断。

### 1.4 为什么 Node 测试没发现？

CommonJS 模块被包在**函数作用域**里，`var` 是模块局部变量，守卫逻辑完全正常工作。
这是典型的"**Node 测试盲区**"：同一份代码在浏览器与 Node 的全局作用域语义不同。

### 1.5 修复方案

```js
// 修复后：不用 var 声明常量名，仅在 Node 环境挂到 globalThis
if (typeof require !== 'undefined' && typeof CellState === 'undefined') {
    const gameModelModule = require('./game-model.js');
    globalThis.CellState = gameModelModule.CellState;
    globalThis.Direction = gameModelModule.Direction;
}
```

- 浏览器：`require` 未定义 → 整块跳过，裸引用解析到 `game-model.js` 建立的全局 `const`；
- Node：模块内 `typeof CellState === 'undefined'` 成立 → 挂到 globalThis，
  模块内裸引用经全局对象属性解析命中。

### 1.6 回归防线

`tests/verify_browser_scope.js`：用 Node 的 `vm.runInContext` 把 5 个 JS 文件
**依次注入同一个上下文**（等价于浏览器共享全局作用域），断言全部类可见、
44 种开局走法正确。Bug① 在此测试下会以同样的 SyntaxError 复现。
`tests/test_browser_scope.py` 用 pytest 包装并支持未装 Node 时跳过。

### 1.7 经验教训

- ⚠️ **浏览器全局作用域内严禁用 `var` 声明与其他脚本 `const/let` 同名的名字**——
  即使声明写在永远不会执行的分支里也没用（提升是静态的）；
- ⚠️ **只有 Node 测试的 JS 项目，测不出浏览器全局作用域问题**；
  需要 `vm` 模拟或真实浏览器端到端测试兜底；
- 💡 "部分类定义成功、部分失败"是按文件粒度的脚本求值失败信号，先 `typeof` 逐类排查。

---

## 2. 致命 Bug②：游离目标点击误判 → 点击完全无响应

### 2.1 现象

修复 Bug① 后游戏能初始化、棋盘正常渲染，但**点击棋子毫无反应**：
阶段停在 `pick`、方向箭头不出现。直接在控制台调用
`gameApp.handleCellClick(0, 0)` 却一切正常。

### 2.2 排查过程（逐步缩小：直接调用 → 事件派发 → 监听器 → 状态追踪）

1. **JS 派发点击也无效**（排除输入通道坐标问题）：
   ```js
   document.querySelector('[data-row="0"][data-col="0"]').click();
   // phase 仍是 'pick'
   ```
2. **探针监听证明事件确实到达**：给 cell 临时挂监听 + document 捕获/冒泡探针，
   三者全部触发 → 原始监听器在执行，但效果被"抹掉"；
3. **打桩追踪**：包装 `handleCellClick` 记录入参与调用瞬间各判定条件：
   ```js
   app.handleCellClick = function (row, col) {
       logs.push({
           isProcessing: app.isProcessing,      // false ✓
           isAiTurn: app.isAiTurn(),            // false ✓
           phaseBefore: app.model.phase,        // 'pick' ✓
           canPick: app.rules.canPick(...),     // true  ✓
       });
       return orig(row, col);
   };
   // 结果：条件全绿、无异常，phaseAfter 仍是 'pick' ！
   ```
4. **推理**：方法内部必然执行了 `phase = PUSH`，但 `click()` 同步返回前
   又有代码把它改回 `PICK` —— 全代码只有 `cancelSelection()` 和 `executeMove`
   会设回 PICK，唯一嫌疑是 **document 上的"点击外部取消选子"监听器**；
5. **对照实验**：不经过事件、直接调用方法 → 一切正常。差异只在**事件冒泡路径**。

### 2.3 根因机理（重要！）

```
点击棋子
  → cell 的 click 监听器执行 handleCellClick
      → renderBoard() 用 innerHTML='' 重建全部棋格
      → 被点击的 cell 元素被从 DOM 上移除（游离）
  → 事件沿派发时已固化的路径继续冒泡到 document
  → "点击外部取消选子"监听器判定：
      e.target.closest('.board-outer')  // 游离节点 parentNode 已断 → null ！
      → 被误判为"棋盘外部点击" → cancelSelection() → 选子瞬间被取消
```

- DOM 规范：事件路径在**派发时一次性计算**，祖先监听器照常触发（哪怕目标已游离）；
- `closest()` 依赖**当前**父链，游离节点的父链为空 → 返回 null；
- 于是"每次选子"都会同步触发一次"取消选子"，表现就是完全无法操作。

### 2.4 修复方案

判定抽成可单测的静态方法，跳过已脱离文档的目标：

```js
static shouldCancelSelection(target, phase) {
    if (phase !== GamePhase.PUSH) return false;
    if (!target || typeof target.isConnected !== 'boolean' || !target.isConnected) return false;
    return !target.closest('.board-outer') && !target.closest('.push-btn');
}

// initEvents 中：
document.addEventListener('click', (e) => {
    if (QuixoGameController.shouldCancelSelection(e.target, this.model.phase)) {
        this.cancelSelection();
    }
});
```

回归测试在 `tests/verify_browser_scope.js` 第 4 节：用
`{ isConnected: false, closest: () => null }` 模拟重渲染后的游离棋子，
断言不触发取消；真实外部点击、棋盘内部点击、非 PUSH 阶段三个分支同样覆盖。

### 2.5 经验教训

- ⚠️ **不要在元素的 click 监听器里同步 `innerHTML=''` 重建该元素所在的子树**，
  如果祖先上还挂着依赖 `e.target` 判断来源的全局点击处理器；
- ⚠️ 判定"点击来源"时务必先检查 `e.target.isConnected`，
  SPA/重渲染型页面极易踩中；
- 💡 "直接调用正常、事件触发异常" ⇒ 顺着事件冒泡路径找**其他监听器**的副作用；
- 💡 "条件全绿但结果没生效" ⇒ 怀疑效果被**同一次派发里的后续代码**回滚，
  在 `click()` 返回后再读状态即可捕捉。

---

## 3. 小 Bug③：AI 走子后"悔棋"按钮未解锁

- **现象**：PvE 下 AI 落子完成后悔棋按钮仍为禁用，直到玩家再走一步才恢复；
- **根因**：`executeMove()` 中 `updateView()`（刷新按钮 disabled 状态）在
  `this.isProcessing = false` **之前**执行，刷新时读到的是旧的处理锁；
- **修复**：调整顺序——先复位 `isProcessing`，再 `updateView()`；
- **教训**：⚠️ 刷新 UI 状态的动作应放在所有相关状态复位**之后**；
  按钮可用性这类"派生状态"要在状态机稳定后再采样。

---

## 4. 调试环境踩坑记录

### 4.1 浏览器无法直接打开 `file:` 链接

浏览器自动化/部分环境不接受 `file:` 导航。用本地 HTTP 服务器代替：

```powershell
python -m http.server 8932 --bind 127.0.0.1
```

### 4.2 启发式缓存掩盖修复（重要！）

- `python -m http.server` **不发送 Cache-Control**，浏览器按启发式规则缓存：
  新鲜度 ≈ (当前时间 − Last-Modified) × 10%，期间**不再回源验证**；
- 表现：服务器上文件已更新、`fetch(..., {cache:'no-store'})` 拉到新代码，
  但 `<script>` 标签仍用旧缓存 → "改了没生效"的假象；
- 对策：
  1. HTML 中静态资源统一带 `?v=YYYYMMDDx` 版本号（本次采用，已固化到 index.html），
     每次改动 JS/CSS 后递增后缀；
  2. 调试期换端口（新源 = 全新缓存栈）立即可见效果；
  3. 注意 **HTML 本身也可能被缓存**，必要时 `tab.reload()` 或加查询参数。

### 4.3 无限动画元素导致自动化点击超时

`.cell.pickable`（脉冲）与 `.push-btn`（跳动）都是 `infinite` 动画，
Playwright 等待"包围盒连续两帧稳定"会超时。对策：

- locator 加 `{ force: true }`；或
- 改用 `tab.cua.click({x, y})` 坐标点击；或
- 测试语境下直接 `evaluate(() => el.click())`（监听器照常触发）。
- 注意：真实用户点击不受影响，这只是自动化工具的稳定性判定问题。

### 4.4 截图合成器伪影 vs 真实页面状态

- 现象：弹窗关闭后（computed opacity = 0）截图里仍有"幽灵弹窗"叠印、
  `fullPage` 截图出现四宫格平铺伪影；
- 判定方法：**以 DOM/computed style 为准**（`classList.contains('show')`、
  `getComputedStyle().opacity`），单帧不可能出现"同一元素文字实心而面板透明"；
- 根因：截图合成器对 `backdrop-filter` / `background-attachment: fixed`
  图层的帧混叠；
- 处置：弹窗已移除 `backdrop-filter`（低端 WebView 同样受益），
  视觉验收以普通视口截图 + 计算样式双重确认。

### 4.5 自动化 evaluate 的传参形式

传模板字符串可能得到空对象，应传**函数形式**：

```js
// ✅ 正确
await tab.playwright.evaluate(() => JSON.stringify({ a: 1 }));
// ❌ 某些环境下序列化异常返回 {}
await tab.playwright.evaluate(`(() => ({ a: 1 }))()`);
```

复杂结果统一 `JSON.stringify` 后返回，避免结构化克隆丢字段。

### 4.6 多视口程序化布局检查清单

截图之外，用这些断言快速判定"适配是否合格"：

```js
// 1) 无横向溢出
document.documentElement.scrollWidth <= innerWidth
// 2) 逐元素越界检查
[...document.querySelectorAll('body *')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.right > document.documentElement.clientWidth + 1 || r.left < -1;
})
// 3) 关键元素命中检查（是否被其他元素遮挡）
document.elementFromPoint(x, y) === expectedEl
// 4) 棋盘实际格宽（验证 --cell-size 流式计算结果）
document.querySelector('.cell').getBoundingClientRect().width
```

本次实测基线：375×667→49px、768×1024→88px、1280×720→60px、
1280×800→76px（= (800−420)/5，与 `--cell-size` 的 vh 分量公式吻合）、
667×375→40px（clamp 下限）。

---

## 5. 调试方法论总结

1. **分层定位**：网络(状态码) → 脚本求值(typeof 逐类) → 运行时(直接调用) → 事件(冒泡/监听器)。本例 Bug① 卡在第二层、Bug② 卡在第四层；
2. **最小探针验证假设**：每个假设用一个 5 行以内的注入实验证实/证伪（如 `var CellState;` 探针），不要靠读代码脑补；
3. **对照实验**："直接调用 OK / 事件触发失败"这类差异是最好的定位线索，刻意构造两组只有单一变量不同的场景；
4. **警惕测试盲区**：Node 单测 ≠ 浏览器行为。涉及全局作用域、DOM 事件路径、缓存的改动，必须有浏览器端到端验证 + 针对性的模拟测试（vm）；
5. **修完必须加回归测试**：Bug①/Bug② 都补了能精确复现原始场景的自动化测试，防止下次重构复发；
6. **缓存是"改了没生效"的第一嫌疑**：先证伪缓存（no-store 拉源码对比），再怀疑自己的修改；
7. **视觉验收双通道**：截图（看整体观感/配色）+ 计算样式/几何断言（判定真实状态），截图管线有伪影时以前者为准。

---

## 6. 相关文件索引

| 文件 | 作用 |
| --- | --- |
| `js/game-rules.js` / `js/game-ai.js` | Bug① 修复点（CommonJS 守卫改为 globalThis 注入） |
| `js/main.js` | Bug② 修复点（`shouldCancelSelection`）、Bug③ 修复点、棋盘大小调节 |
| `tests/verify_browser_scope.js` | Bug①/Bug② 回归测试（浏览器作用域模拟 + 游离目标判定） |
| `tests/test_browser_scope.py` | 上述测试的 pytest 包装 |
| `css/style.css` | `--cell-size` 流式尺寸变量定义（vh 分量 420px 为实测固定 UI 高度） |
| `CODEx_TODO.md` 阶段五 | 本次全部改动的清单 |
