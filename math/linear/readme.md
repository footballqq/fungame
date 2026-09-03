# 方程与方程组自动出题系统 (Equation Generator System)

本系统是一个专为中小学数学方程专项训练设计的**自动出题与排版系统**。支持自动产生**一元一次方程（含双重及三重嵌套括号）**、**二元一次方程组**以及**三元一次方程组**，并且**保证所有题目均存在正整数解**（$x, y, z \in \mathbb{Z}^+$）。试卷末尾附带 180 度倒置印刷的参考答案，方便打印后翻转核对。

系统同时提供**纯 HTML 免依赖单文件版**（双击即用）与 **Python 后端 Web/CLI 版**，灵活满足不同场景的需求。

---

## 📁 目录文件结构

```
linear/
├── index.html                  # 🌟 纯前端单文件版（零依赖，直接双击浏览器打开）
├── equation_generator.py       # Python 核心出题算法库
├── html_renderer.py            # Python HTML 试卷模板渲染器
├── web_server.py               # Python 原生 Web HTTP 服务端
├── main.py                     # Python 统一入口（支持 Web 模式与 CLI 模式）
├── sample_paper.html           # 自动生成的 HTML 试卷排版示例
├── docs/
│   └── readme.md               # 详细设计与实现文档
├── readme.md                   # 本说明文件
└── .gitignore                  # Git 忽略规则
```

---

## 📐 设计思路与数学原理

### 1. 正整数解逆向构造算法
为了避免随机生成系数导致方程出现分数、无解或无穷多解的问题，系统采用**逆向约束构造法**：
1. **解的初始化**：首先生成随机的目标正整数解 $x, y, z \in [1, N]$（默认 $N=15$）。
2. **多层代数式拆分**：
   - **一元一次方程**：支持 7 种代数结构模板，包含单重括号、**双重括号 `[ ( ) ]`** 及 **三重括号 `{ [ ( ) ] }`**。按照从内到外递推计算表达式的值，确保每一层括号内部数值均为正数，最后反向求出右侧平衡常数。
   - **二元/三元方程组**：生成系数矩阵 $A$，通过校验行列式 $\det(A) \neq 0$ 确保方程组存在唯一解，再利用矩阵相乘 $A \cdot X = B$ 计算出常数向量 $B$。
3. **代数式排版规范化**：
   - 隐藏系数 1（如 `1x` $\to$ `x`，`1(2x+1)` $\to$ `(2x+1)`）。
   - 处理负号（如 `-1y` $\to$ `-y`）。
   - 自动滤除 0 项系数（避免出现 `+ 0y` 等非规范表述）。

### 2. 试卷排版与倒置答案设计
- **大括号联立格式**：方程组采用 CSS flex 布局与标准大括号 `{` 渲染。
- **180 度倒置参考答案**：利用 CSS `transform: rotate(180deg)`，将试卷页脚答案区倒置印刷。打印后只需将纸张上下颠倒即可查阅答案，有效防止学生做题时提前瞟见答案。
- **A4 打印优化**：采用 `@media print` 媒体查询，隐藏控制面板，保留纯净试卷排版。

---

## 🚀 使用方法

### 方式一：纯 HTML 单文件版（推荐，零依赖双击即用）

直接在本地用浏览器双击打开 **[`index.html`](file:///E:/users/kpan/BaiduSyncdisk/doc/DingDang/study/math/linear/index.html)** 即可使用：
- **零依赖**：不需要安装 Python，不需要运行命令行服务。
- **全功能**：包含完整的 JavaScript 引擎，支持选择题型数量、选择难度（含多重嵌套括号）、选择解的范围。
- **一键打印/导出**：界面提供“🔄 刷新生成试卷”、“🖨️ 打印试卷 (A4/PDF)”、“💾 下载 HTML 网页”按钮。

---

### 方式二：Python Web 可视化界面

在 PowerShell 或 cmd 终端中运行：

```powershell
# 默认端口 8080 启动
python E:\users\kpan\BaiduSyncdisk\doc\DingDang\study\math\linear\main.py

# 或指定自定义端口（如 9000 端口）
python E:\users\kpan\BaiduSyncdisk\doc\DingDang\study\math\linear\main.py --port 9000
```

服务启动后会自动打开浏览器访问 `http://localhost:8080`（或指定的端口），在网页中即可交互式生成与打印试卷。

---

### 方式三：命令行 (CLI) 批量导出 HTML 试卷

适合批量生成或脚本自动化调用的场景：

```powershell
python E:\users\kpan\BaiduSyncdisk\doc\DingDang\study\math\linear\main.py --cli --title "方程与方程组综合小测验" --c1 5 --c2 3 --c3 2 --output "E:\users\kpan\BaiduSyncdisk\doc\DingDang\study\math\linear\my_paper.html"
```

**参数说明**：
- `--cli`：启用命令行模式。
- `--port` / `-p`：指定 Web 服务端口号（默认 8080）。
- `--title`：设置试卷标题。
- `--c1`：一元一次方程数量（默认 3）。
- `--c2`：二元一次方程组数量（默认 2）。
- `--c3`：三元一次方程组数量（默认 1）。
- `--difficulty`：难度等级（`advanced` 进阶复杂/多重括号型，`basic` 基础型）。
- `--sol-max`：正整数解的最大上限（默认 15）。
- `--output`：输出 HTML 文件路径。
