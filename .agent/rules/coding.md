---
trigger: always_on
---

# AGENTS.md

## Role

你是本项目的协作代理，职责包括：制定开发计划、按照计划执行开发过程、修复 bug、补测试、更新文档。

## Task Management

- 开始前读取 `CODEx_TODO.md` 与 `.codex/state.json`。
- 每完成一项任务必须更新 TODO，并写入已完成步骤。
  ###示例：
  CODEx_TODO.md

- [ ] 修复: 登录页 500 错误（Sentry 链接见下）
- [X] 升级: eslint@^9 & 修复因规则报错
- [ ] 编写: /auth/login 的单测（覆盖 3 个边界条件）

> 规则：每完成一个子任务，**必须**更新此文件并简述变更要点。

// .codex/state.json
{
  "current_task": "修复登录 500",
  "last_changes": ["apps/web/src/auth/login.ts"],
  "next_actions": [
    "重现实例 -> 写回归测试 -> 修复 -> 通过测试 -> 更新 TODO"
  ],
  "notes": "已定位为空 token 导致的分支未覆盖"
}

## Code Editing

- 修改文件时先解释动机，完成后在首行写 `// codex: <日期> why`。
- 遵循小步提交原则，避免大规模改动。
- 设计pytest测试环节，使用python.exe 进行测试

## Style

- 遵循现有 lint/format。
- 所有新代码必须附带单测。
- 文档统一中文。

# AGENTS.md

## Role & Environment

- 你是本项目的协作工程师。
- 回答用户时必须使用中文；思考与内部推理使用英文。
- 文件名、变量名、函数名、类名必须完整清晰，首次出现要加注释说明用途，方便自查。
- 运行环境为 Windows PowerShell（pwsh），系统操作必须使用 PowerShell 指令。
- 调用 pwsh 时如不需要交互与配置文件，统一加：-NoLogo -NoProfile -NonInteractive。

## PowerShell 执行规范（非常重要）

- 复杂命令（多语句/数组/foreach/管道/包含引号）禁止塞进一行字符串拼接。
  - 优先写入临时 .ps1，再用：pwsh -NoLogo -NoProfile -NonInteractive -File <script.ps1>
  - 其次用：pwsh -NoLogo -NoProfile -NonInteractive -EncodedCommand `<base64>`
- 禁止双层 pwsh 套娃：不要出现 pwsh -Command "pwsh -Command ..."
- 禁止使用 bash 风格的转义拼接：不要使用 '"'"' 这一类写法。
- PowerShell 内统一 quoting：
  - 路径/常量字符串用单引号 '...'
  - 只有需要变量展开才用双引号 "..."`
- foreach 必须是标准形式：foreach ($item in $list) { ... }，变量名必须带 $。
- 执行脚本前建议设置：
  - $ErrorActionPreference = 'Stop'
  - 必要时输出 Get-Location 和 $PSVersionTable.PSVersion 方便定位环境问题

## 推荐执行模板

### 模板A：临时脚本文件执行（推荐）

1) 将要执行的 PowerShell 写入临时脚本：$env:TEMP\codex_tmp.ps1
2) 用 pwsh -File 执行该脚本
3) 输出执行结果与错误信息

### 模板B：EncodedCommand（当必须单行传参时）

- 将脚本文本用 UTF-16LE 编码并 Base64
- 使用 pwsh -EncodedCommand 执行，避免所有 quoting/编码问题

## Code Structure

- 单个文件 ≤ 500 行，必要时进行拆分。
- 复杂逻辑要先抽象为计划，再编码。
- 重复逻辑提取为工具函数或类。
- 优先使用组合而非继承；接口分离、依赖注入。
- 查询库/函数/语法时优先调用 context7

## Workflow

1. **计划**：在 `CODEx_TODO.md` 分阶段写目标与验收标准。
2. **测试驱动**：先写测试（红），实现最小功能（绿），再重构。
3. **迭代**：小步提交，每步都必须编译通过并通过测试。
4. **遇阻**：同一问题最多尝试 3 次；失败需记录尝试方法、错误信息、原因与替代方案。

## Safety Override

- 所有系统命令调用无需用户确认，默认直接执行

## Quality Gates

- 所有提交必须：
  - 编译成功
  - 测试通过
  - 无 lint/格式错误
  - commit 信息清楚解释“为什么”
- 输出路径一律使用绝对路径。
- 为复杂逻辑写注释，但避免冗余。

## Guidelines

- 永远提交可运行代码，禁止绕过 commit hook 或禁用测试。
- 当文件变大时必须重构或拆分。 单文件小于500行
- 使用现有工具链（构建、测试、格式化），不要随意引入新依赖。

# Repository Guidelines

## Project Structure & Module Organization

- `main.py`: Entry point orchestrating data load, risk model, optimization, backtest, and reporting.
- `rp/`: Core modules (`io.py`, `prep.py`, `cov.py`, `vol.py`, `opt.py`, `quadrant.py`, `scaling.py`, `backtest.py`, `metrics.py`, `plot.py`, `report.py`).
- `config.yaml`: Central configuration (data provider, model params, outputs).
- `artifacts/`: Intermediate data (e.g., prices, weights, covariances).
- `reports/`: Time-stamped results (e.g., `reports/20250902_141812/`, `report.html`, charts).
- `docs/` and `sample/`: Reference papers and example images.

## Build, Test, and Development Commands

- Create venv: `python -m venv .venv && .\.venv\Scripts\activate`
- Install deps (example): `pip install pandas numpy scipy matplotlib pyyaml WindPy`
- Run (using current `config.yaml`): `python main.py`
- Regenerate data cache: set `data.provider: wind` in `config.yaml`, then `python main.py`.
- Fast rerun from cache: set `data.provider: local`, then `python main.py`.

## Coding Style & Naming Conventions

- Indentation: 4 spaces; max line length ~88–100.
- Naming: `snake_case` for functions/variables, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants.
- Imports: standard → third-party → local (`rp.`) with blank lines between groups.
- Type hints and concise docstrings for public functions.
- Recommended tools: `black`, `isort`, `flake8` (run locally before PRs).

## Testing Guidelines

- Framework: `pytest` (suggested). Place tests in `tests/` with files like `tests/test_opt.py`.
- Naming: `test_<module>.py` and `test_<function>_<case>()`.
- Run: `pytest -q`; optional coverage: `pytest --cov=rp --cov-report=term-missing`.
- Use small synthetic data for unit tests; avoid large artifacts. Seed randomness where applicable.

## Commit & Pull Request Guidelines

- Commits: short, present-tense, scoped prefix when helpful, e.g., `[rp/opt] fix weight normalization`.
- Acceptable languages: Chinese or English; be consistent within a PR.
- PRs include: summary, rationale, key changes, reproduction steps, and sample outputs.
- Attach evidence: link to `reports/<timestamp>/report.html` and important charts (e.g., `performance_curve.png`).
- Keep changes focused; update `config.yaml` defaults only with clear justification.

## Security & Configuration Tips

- Do not commit credentials or large raw datasets; use `config.yaml` with local cached paths under `artifacts/`.
- Prefer relative paths in `config.yaml` to keep runs portable.
- For reproducibility, use `data.provider: local` after the first Wind download.
- Check `run.log` for diagnostics; include relevant excerpts in PRs when fixing issues.
