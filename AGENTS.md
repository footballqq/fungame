# AGENTS.md

## 角色与环境

- 你是本仓库（`fungame`）的协作开发工程师，负责设计、开发、重构、测试与文档维护。
- 对用户输出始终使用中文，文件路径使用绝对路径。
- 运行环境为 Windows PowerShell（`pwsh`）：
  - 复杂命令避免单行引号嵌套，优先使用清晰的 PowerShell 语法或临时 `.ps1` 脚本。
  - 路径与常量字符串使用单引号 `'...'`，需要变量展开时使用双引号 `"..."`。

## 项目结构

本仓库为面向青少年的交互式数学、奥数思维、策略棋盘与启蒙教学网页游戏合集：

- `index.html`、`css/index.css`、`js/index.js`：全站统一导航主页（接入规范见 `INDEX_GUIDE.md`）。
- `math/`：数学概念与奥数互动教学项目（如 `math/fold/`、`math/papercut/`、`math/calculus/` 等）。
- `boardgame/`：策略棋盘与几何拼图类网页游戏（如 `boardgame/square/`、`boardgame/triangleremove/`、`boardgame/tzarr/`、`boardgame/jumpfrog/` 等）。
- `study/`、`oldgame/`、`apps/` 等：专题学习与益智小游戏模块。
- `tests/`：基于 `pytest`（配合 `node` 校验前端逻辑）的自动化测试套件。

## 开发与质量规范

- **模块化拆分**：按职责拆分 HTML / CSS（布局、棋盘、弹窗、动效）/ JS（核心数学引擎、关卡或教学数据、音频、皮肤、UI 控制器），避免单文件过度膨胀（建议不超过 1500 行）。
- **防剧透与教学体验**：益智/奥数类游戏默认先让孩子自主探索，不提前直接剧透答案；提供清晰的游戏目的说明与分步启发式教学。
- **前端细节**：
  - 严禁在网页正文中残留原始 LaTeX 标记（如 `$$`、`\times`、`\le`），统一使用语义 HTML 与标准数学 Unicode 符号（`×`、`≤`、`≥`、`<sup>`、`<sub>`）。
  - 严禁使用浏览器原生 `alert()` / `confirm()`，统一使用项目内模态弹窗与 Toast 提示。
  - 静态资源引用附加版本参数（如 `?v=YYYYMMDD`）防缓存。
  - 默认兼顾 PC、平板（iPad）与手机端响应式与触控体验（`100dvh`、`viewport-fit=cover`、`touch-action: none` 等）。
- **音效与离线可用**：优先使用纯前端 Web Audio API 合成音效，零外部 CDN/音频依赖，双击本地 `index.html` 即可离线流畅运行。

## 测试与提交门禁

- 所有新增功能或修复必须附带 `pytest` 自动化测试（前端核心模块可结合 `node` 校验逻辑与 `node --check` 校验语法）。
- 运行测试示例：
  - 单模块：`python -m pytest -q tests/test_<module>.py`
  - 全量：`python -m pytest -q tests`
- 仅暂存与当前任务相关的文件，提交信息简洁说明改动内容与动机。
