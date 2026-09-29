# 趣味数学游戏集 · 主页架构与新游戏集成开发指南 (INDEX_GUIDE.md)

本文档面向本项目的协作工程师与后续开发者，详细说明根目录主入口 [`index.html`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/index.html) 的技术架构、分类规范，以及**未来开发新游戏后如何标准、规范地接入主页的完整操作指引（SOP）**。

---

## 一、主页设计定位与三层解耦架构

本项目遵循**高内聚、低耦合、关注点分离**的工程规范。主入口由三层解耦构成：

```
fungame/
├── index.html           # 页面骨架：5 大专区容器、卡片列表与搜索筛选挂载点（~320 行）
├── css/
│   └── index.css        # 样式中心：Hero 展台、吸顶控制栏、胶囊按键、卡片网格与响应式（~420 行）
├── js/
│   └── index.js         # 交互核心：极速模糊搜索、分类标签过滤、按键快捷键与空状态（~110 行）
├── tests/
│   └── test_index_hub.py# 质量门禁：自动验证专区完备性、无重复卡片、路径规范与单测回归
└── INDEX_GUIDE.md       # 本接入开发文档
```

---

## 二、五大科学分类专区（Taxonomy）

为了防止卡片无序堆叠，全库项目按认知规律划分为 **5 大专属专区**：

| 专区标识 (`data-section-category`) | 专区名称 | 推荐徽章 (`.badge`) | 包含典型范例 |
| :--- | :--- | :--- | :--- |
| `concepts` | 📐 **数学概念与直觉可视化** | `.badge-math` | 微积分披萨、同余小学习、因式分解、方程卷子、速算挑战 |
| `olympiad` | 🧩 **奥数思维与组合极值谜题** | `.badge-olympiad` | 正方形拼图挑战、星芒阵封印、青蛙跳跃、齿轮谜题、切分三角形 |
| `boardgame` | ♟️ **策略棋盘与人机对弈** | `.badge-ai` / `.badge-touch` | Dittle 骰战棋、Quixo 战棋、滑冰棋、奇偶棋子谜题、狐狸和鹅、GIPF 系列 |
| `language` | 📖 **英语与双语词汇** | `.badge-lang` | 单词拼写游戏、RAZ 分级阅读测试、数学英语学习 |
| `life` | 🌍 **生活数学与启蒙素养** | `.badge-life` | 烙饼运筹、机车调度、立方配色、数组求和、莫比乌斯带、民国教育委员会 |

---

## 三、新游戏接入标准作业流程（SOP）

当你在本项目中完成了一个新游戏（例如新建了 `boardgame/mygame/` 或 `apps/mygame/`）后，请按以下 6 个标准步骤接入主页：

### 步骤 1：确认新游戏产物完备
在集成前，请确认新项目符合以下标准：
1. 具备独立的入口网页（通常为 `index.html` 或 `mygame.html`）。
2. （可选）具备独立的说明文档或规则手册（如 `README.md` 或 `rules_zh.html`）。
3. 单文件代码遵循高内聚低耦合规范，逻辑清晰。

### 步骤 2：选择归属专区并定位代码位置
打开根目录 [`index.html`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/index.html)，找到对应专区的 `<section>` 标签：
- 数学概念类：`<section data-section-category="concepts">` 内的 `.games-grid`
- 奥数谜题类：`<section data-section-category="olympiad">` 内的 `.games-grid`
- 策略棋类：`<section data-section-category="boardgame">` 内的 `.games-grid`
- 语言词汇类：`<section data-section-category="language">` 内的 `.games-grid`
- 生活素养类：`<section data-section-category="life">` 内的 `.games-grid`

### 步骤 3：编写游戏卡片 HTML

在选定专区的 `.games-grid` 末尾追加卡片代码，参考以下标准模板：

#### 模板 A：标准单按钮卡片（适用于普通小游戏）
```html
<div class="game-card" data-category="concepts" data-keywords="新游戏 拼音 关键词 英文名 mygame">
  <div class="card-top">
    <h3>新游戏名称</h3>
    <span class="badge badge-math">数学概念</span>
  </div>
  <p>一句话介绍核心玩法与数学思维，突出探索性与教学价值。</p>
  <div class="card-actions">
    <a href="boardgame/mygame/index.html" class="btn-action btn-primary">开始探索</a>
  </div>
</div>
```

#### 模板 B：多维多按钮卡片（适用于带规则书、原理解析的重量级游戏）
```html
<div class="game-card" data-category="olympiad" data-keywords="拼图 奥数 极值 证明 square">
  <div class="card-top">
    <h3>正方形拼图挑战</h3>
    <span class="badge badge-olympiad">⭐ 经典奥数</span>
  </div>
  <p>奥数经典真题：用 1~4 规格纸片无重漏拼接 10×10 最少几块？四元鸡兔同笼升维几何装箱证明。</p>
  <div class="card-actions">
    <a href="boardgame/square/index.html" class="btn-action btn-primary">开始挑战</a>
    <a href="boardgame/square/index.html#rules" class="btn-action btn-coral">玩法规则</a>
    <a href="boardgame/square/index.html#math" class="btn-action btn-indigo">数学原理</a>
    <a href="boardgame/square/README.md" class="btn-action btn-amber">说明文档</a>
  </div>
</div>
```

### 步骤 4：关键属性配置规范

1. **`data-category` 属性**：必须与父级 `<section>` 的 `data-section-category` 保持一致（如 `olympiad`），以便分类筛选正常运作。
2. **`data-keywords` 属性（极为重要！）**：
   - 填写与游戏强相关的中文词、拼音、简称、英文名或数学定理名词（空格分隔）。
   - 用户在顶部搜索框输入这些词时，卡片将被毫秒级即时检索出来。
3. **按钮颜色类规范**：
   - `.btn-primary`：默认青绿色主按钮（如“开始挑战”、“开始对弈”）。
   - `.btn-coral`：珊瑚红强调按钮（如“玩法规则”、“规则手册”）。
   - `.btn-indigo`：学术靛蓝按钮（如“数学原理”）。
   - `.btn-amber`：琥珀金按钮（如“说明文档”）。
   - `.btn-secondary`：柔和浅灰副按钮（如 GIPF 各独立规则书）。
4. **链接格式红线**：
   - **严禁使用 Windows 反斜杠**（例如禁止 `\mygame\index.html`）。
   - **必须统一使用标准 Web 正斜杠**（例如 `boardgame/mygame/index.html`）。

### 步骤 5：同步更新统计数字与页脚版本

新增卡片后，请同步修改 [`index.html`](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/index.html) 上的两处计数：
1. **Hero 展台与“全部项目”总数**：
   - 将 `<span class="stat-chip">✨ N 个独立互动程序</span>` 更新为最新数字。
   - 将 `<button class="pill-btn active" data-category="all">全部项目 <span class="pill-count">N</span></button>` 更新。
2. **对应分类胶囊计数**：
   - 更新对应胶囊的数字，例如 `<button class="pill-btn" data-category="olympiad">🧩 奥数谜题 <span class="pill-count">新数字</span></button>`。
3. **页脚版本号**：
   - 在 `<footer>` 中将版本号更新为当日日期，如 `(Ver: 2026.XX.XX)`。

### 步骤 6：运行自动化门禁测试

完成添加后，打开 PowerShell 运行全套自动化测试，确保主页与全库测试 100% 绿灯：
```powershell
python -m pytest tests/test_index_hub.py
python -m pytest tests/
```
测试会自动校验：
- `index.html`、`css/index.css`、`js/index.js` 等核心文件均完备且正常加载；
- 无任何重复卡片标题；
- 无任何 Windows 反斜杠破损路径；
- 5 大分类专区与检索容器完整无缺。

---

## 四、常见问题与排错指南 (FAQ)

### Q1：为什么在搜索框输入关键词搜不到我的新游戏？
**排查**：检查卡片的 `data-keywords` 属性是否包含该词，或者卡片的 `<h3>` 标题与 `<p>` 描述是否包含该词。搜索算法为忽略大小写的子串匹配。

### Q2：为什么我的卡片按钮与其他卡片底部不在同一水平线上？
**排查**：确保卡片的底部按键包裹在 `<div class="card-actions">...</div>` 中。该容器设置了 `margin-top: auto`，无论上方文字描述多长，都会自动撑满并将按钮钉在卡片最底部。

### Q3：如果卡片数量持续大幅增加怎么办？
**建议**：如果未来项目持续增加使 `index.html` 卡片极多，可将卡片数据提炼为静态 JSON 配置（如 `data/games.json`），或进一步通过模板渲染挂载。
