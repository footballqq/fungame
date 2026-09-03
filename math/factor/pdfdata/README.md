# 代数因式分解 PDF 题库解析与 JSON 化项目 (README.md)

本项目是一个专门用于将数学因式分解 PDF 习题/讲义自动提取、格式清洗、分类打标、符号计算求解并导出为标准 JSON 题库的自动化工具集。

---

## 🎯 1. 项目目标

1. **题目自动提取**：高效准确地解析 `docs/` 目录下的 4 个 PDF 文件（`Factoring_Methods.pdf`、`Factoring_Practice.pdf`、`Factorisation.pdf`、`LM-maths-section-3-Tversion-1.pdf`），提取题干、算式表达式、所属章节及位置信息。
2. **多维智能分类**：参考 [basicfactor.md](file:///E:/users/kpan/BaiduSyncdisk/doc/DingDang/study/math/factorization/docs/basicfactor.md) 中定义的 10+ 种代数因式分解方法体系，自动为每道题目打上标准分类标签。
3. **程序化符号计算求解**：引入 Python SymPy 符号计算引擎，自动求解出精确的代数因式分解答案与最大公因式 (GCF)，补全书本缺失的答案，并与书本原答案交叉校验。
4. **标准化 JSON 结构**：导出符合 [SCHEMA.md](file:///E:/users/kpan/BaiduSyncdisk/doc/DingDang/study/math/factorization/docs/SCHEMA.md) 规范的题库文件，便于程序化读取、搜索、刷题软件接入与数据分享。

---

## 🏗️ 2. 系统设计与架构

项目采用高内聚、低耦合的模块化设计，主流程如下：

```
+-------------------+     +-------------------------+     +-------------------------+
|   4 个 PDF 文件   | --> |  src/pdf_parser.py      | --> |  src/classifier.py      |
|  (docs/*.pdf)     |     |  PDF 文本与题目提取器   |     |  题目分类引擎           |
+-------------------+     +-------------------------+     +-------------------------+
                                                                       |
+-------------------+     +-------------------------+                  v
|  output/*.json    | <-- |  src/exporter.py        | <-- +-------------------------+
|  JSON 导出文件    |     |  格式化 JSON 导出器     |     |  src/solver.py          |
+-------------------+     +-------------------------+     |  SymPy 求解与答案计算   |
                                                          +-------------------------+
```

### 📁 目录与模块说明

```
E:/users/kpan/BaiduSyncdisk/doc/DingDang/study/math/factorization/
├── docs/                                # 文档与原始 PDF 目录
│   ├── README.md                        # 本说明文档
│   ├── DESIGN.md                        # 架构与计算设计文档
│   ├── SCHEMA.md                        # JSON Schema 字段规范文档
│   ├── basicfactor.md                   # 10+种因式分解方法分类指南
│   └── *.pdf                            # 原始 PDF 题库文件
├── src/                                 # 核心 Python 模块
│   ├── config.py                        # 全局配置与路径字典
│   ├── pdf_parser.py                    # PDF 文本解析与 Glyph 恢复
│   ├── classifier.py                    # 基于规则与 AST 结构的分类引擎
│   ├── solver.py                        # SymPy 符号因式分解与 GCF 求解器
│   └── exporter.py                      # 全量、按分类、摘要 JSON 导出器
├── output/                              # 导出的 JSON 结果文件
│   ├── questions_all.json               # 254 道题目的全量 JSON 题库
│   ├── questions_by_category.json       # 按 basicfactor.md 归类的分组题库
│   └── questions_summary.json           # 题库数据统计摘要
└── main.py                              # 主程序运行入口
```

---

## 💡 3. 技术经验与坑点总结 (Lessons Learned)

在解析数学 PDF 文件和符号计算过程中，总结了以下关键的技术经验与处理技巧：

### 1) PDF 特殊数学字体乱码与 Glyph 控制字符还原
- **问题**：在 `Factoring_Practice.pdf` 等文件中，嵌入的数学斜体 Font 将字母 $x$、二次方 $x^2$、加号 $+$、减号 $-$ 及括号符号编码映射为了 Unicode 控制字符（如 `\u0002`, `\u0007`, `\u0003`, `%`, `&`）。如果直接提取 text 会出现类似 `%\u0002 \u0003 4&\u0007` 的乱码。
- **解决方案**：在 `src/solver.py` 中建立 Glyph 字符映射还原引擎：
  - `\u0002` -> `x`, `\u0007` -> `^2`, `\u0003` -> `+`, `\b` -> `-`
  - `%` -> `(`, `&` -> `)`
  - 自动将 `%\u0002 \u0003 4&\u0007` 还原为人类可读且 SymPy 可解析的 `(x + 4)^2`。

### 2) Unicode 特殊减号与算式标准化
- **问题**：PDF 中广泛存在 Unicode 减号 `−` (U+2212) 或连字符 `–` (U+2013)，直接送入 Python `sp.sympify()` 会报语法解析错误。
- **解决方案**：在清洗阶段统一替换为标准的 ASCII `-`，并替换 `×` -> `*`, `÷` -> `/`，以及处理上标数字（如 `x⁴` -> `x^4`）。

### 3) 隐式乘法与乘方补全
- **问题**：数学代数式习惯省略乘号（如 `5x^4`, `10ab`, `(x+1)(x+2)`），但计算机语法树解析器（SymPy）需要明确的算符。
- **解决方案**：利用正则表达式进行两阶段补全：
  - 数字与变量间补全乘号：`(\d)([a-zA-Z])` -> `\1*\2` （如 `5x` -> `5*x`）
  - 括号之间补全乘号：`\)\s*\(` -> `)*(` （如 `(a+b)(a-b)` -> `(a+b)*(a-b)`）

### 4) 双轨答案机制 (Book Answer vs Calculated Answer)
- **设计**：对于 PDF 自带答案（如 Answer Key 页）的题目，保留 `book_answer`；对于书本未提供答案或包含范例步骤的题目，利用 SymPy 计算出 `calculated_answer`。主字段 `answer` 优先使用规范化后的书本答案，无书本答案时以程序计算答案为准，并通过 `is_calculated_answer: true/false` 予以明确标识。

---

## 🚀 4. 运行说明

### 环境要求
- Python 3.8+
- 依赖第三方库：`pypdf`, `pdfplumber`, `PyMuPDF` (`fitz`), `sympy`

### 命令行运行
在项目根目录下，执行主入口脚本：

```powershell
python "E:\users\kpan\BaiduSyncdisk\doc\DingDang\study\math\factorization\main.py"
```

### 运行输出示例
```text
=== 开始解析 4 个因式分解 PDF 题库文件 ===
Factoring_Methods.pdf 提取到 23 题
Factoring_Practice.pdf 提取到 206 题
Factorisation.pdf 提取到 7 题
LM-maths-section-3-Tversion-1.pdf 提取到 18 题

全量提取完成，共获取 254 道原始题目。正在进行智能分类与 SymPy 答案求解...

[OK] 导出全量题库: E:\users\kpan\BaiduSyncdisk\doc\DingDang\study\math\factorization\output\questions_all.json (共 254 题)
[OK] 导出按分类归类题库: E:\users\kpan\BaiduSyncdisk\doc\DingDang\study\math\factorization\output\questions_by_category.json
[OK] 导出题库统计摘要: E:\users\kpan\BaiduSyncdisk\doc\DingDang\study\math\factorization\output\questions_summary.json

=== 全部任务处理完成！JSON 文件已保存至 output/ 目录 ===
```

---

## 📖 5. 题目 JSON 数据结构说明 (Schema 摘要)

详细格式规范请查阅 [SCHEMA.md](file:///E:/users/kpan/BaiduSyncdisk/doc/DingDang/study/math/factorization/docs/SCHEMA.md)。

单个题目对象的 JSON 结构示例：

```json
{
  "id": "factoring_practice_secIV_q2",
  "source": {
    "file": "Factoring_Practice.pdf",
    "page": 2,
    "section": "IV. Factoring Perfect Square Trinomials"
  },
  "category": "完全平方公式 (Perfect Square Trinomial)",
  "category_code": "perfect_square",
  "question_type": "factorization",
  "raw_text": "2. x^2 - 16x + 64",
  "expression": "x^2 - 16*x + 64",
  "answer": "(x - 8)^2",
  "book_answer": "(x - 8)^2",
  "calculated_answer": "(x - 8)^2",
  "is_calculated_answer": false
}
```

---

## 🏷️ 6. 分类体系对应表 (参考 basicfactor.md)

| category_code | 分类中文名称 | 说明/算式特征 |
| :--- | :--- | :--- |
| `common_factoring` | 提取公因式 (Common Factoring) | 提取单项式/多项式最大公因式 GCF |
| `grouping` | 分组分解法 (Factoring by Grouping) | 4 项及以上按组提取公因式 |
| `trinomial_a1` | 首项系数为1的二次三项式 | $x^2 + bx + c$ |
| `trinomial_a_neq1` | 首项系数不为1的二次三项式 | $ax^2 + bx + c$ ($a \neq 1$) / 十字相乘法 |
| `diff_squares` | 平方差公式 (Difference of Squares) | $a^2 - b^2 = (a-b)(a+b)$ |
| `perfect_square` | 完全平方公式 (Perfect Square Trinomial) | $a^2 \pm 2ab + b^2 = (a \pm b)^2$ |
| `sum_diff_cubes` | 立方和与立方差公式 | $a^3 \pm b^3 = (a \pm b)(a^2 \mp ab + b^2)$ |
| `substitution` | 换元法 (Factoring by Substitution) | 高次伪二次或复杂重复表达式 |
| `long_division` | 长除法与因式定理 | 高次多项式因式分解 |
| `synthetic_division` | 综合除法 (Synthetic Division) | 一次二项式除法 |
| `complex_grouping` | 多变量/高阶复合分解 | 3 个及以上变量复合多项式 |
| `putting_together` | 综合应用 (Putting It All Together) | 综合训练或多步推导题 |
