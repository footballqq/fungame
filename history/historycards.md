# historycards：成语历史卡片批量生成器

`history/historycards.py` 用于从成语词表批量生成卡片元数据（JSON），并写入资源目录下的 `manifest.json`。

目标结构参考：`history/resource.md`（字段 `popular` 为本脚本新增：1-10 常用程度）。

---

## 1. 输入

- 默认输入文件：`history/resources/汉语成语词典_词表_23889条.txt`
  - UTF-8
  - 每行一个成语
  - 空行忽略
  - 以 `#` 或 `####` 开头的行视为注释/标题会忽略

---

## 2. 输出（写到资源目录）

默认写入到 `history/resources/`：

- 单卡元数据：`history/resources/cards/<id>/data.json`
- 总索引：`history/resources/manifest.json`

你也可以写到“安全沙盒目录”进行测试/预生成（不影响游戏现有资源）：

- `--resources-dir history/resources/data`
  - 输出：`history/resources/data/manifest.json`
  - 输出：`history/resources/data/cards/<id>/data.json`

> `image_path` 默认写入 `cards/{id}/image.png`（相对 `--resources-dir`）。

---

## 3. LLM 调用方式（复用项目 utils）

脚本直接使用项目现成的：

- `utils/llm_api.py`：`load_llm_config()` / `setup_llm_client()` / `generate_llm_response()`
- 默认读取 `utils/config.ini`

如需切换模型/渠道：编辑 `utils/config.ini`，或用参数指定：

- `--config path/to/config.ini`
- `--llmsource zhipuai`（临时覆盖 `config.ini` 的 `[llmsources].llmsource`）
- `--models modelA,modelB`（临时覆盖模型列表）
- `--max-models 3`（限制回退尝试的模型数量，避免 `openrouter` 配置过长导致很慢）

参考：`utils/llm_api.md`

---

## 4. 断点续传设计

脚本默认使用进度文件：

- `history/.historycards_progress.json`

生成每条成语后，会写入：

- `next_index`：下一条要处理的 1-based 索引（基于过滤后的成语列表）
- `last_idiom` / `last_status` / `last_id`

使用断点续传：

- `python history/historycards.py --resume`

说明：

- **默认失败会停止**，避免跳过失败项导致“进度文件已前进但缺卡”的情况
- 如果你希望失败后继续往后跑：加 `--continue-on-failure`

---

## 5. 运行区间 / 条数控制

支持三种常用方式：

- 指定区间（包含端点）：`--range 5-10`
- 指定起点 + 终点：`--start 5 --end 10`
- 指定起点 + 条数：`--start 5 --limit 6`（即 5-10）

预览不调用模型：

- `--dry-run`

---

## 6. 已存在跳过策略（避免重复）

默认会跳过已生成内容（便于反复运行）：

- 如果 `manifest.json` 已存在同名 `name`
- 或 `cards/<id>/data.json` 已存在

强制重生成（覆盖 `data.json`；`manifest` 若同名/同 id 则不会重复追加）：

- `--force`

同时做了 `id` 冲突规避：当拼音 id 与既有卡片不一致时，会自动追加稳定后缀。

---

## 7. 调用节奏（随机等待）

避免触发限流：

- `--sleep-min 2 --sleep-max 5`

每次成功生成一条后随机 sleep（秒）。

---

## 8. “10 条测试”建议流程

建议输出到 `history/resources/data/`，避免污染正式资源：

1) 试运行确认选中条目：

```bash
python history/historycards.py --resources-dir history/resources/data --range 1-10 --dry-run
```

2) 真正生成（可加随机间隔）：

```bash
python history/historycards.py --resources-dir history/resources/data --range 1-10 --sleep-min 1 --sleep-max 3
```

> 当你使用 `--resources-dir history/resources/data` 时，若不额外指定 `--progress-file`，进度文件会自动写到 `history/resources/data/.historycards_progress.json`。

3) 检查输出：

- `history/resources/data/manifest.json` 是否存在且包含 10 个 `cards`
- `history/resources/data/cards/<id>/data.json` 是否都存在
- 每个卡片应包含字段：`id,name,period,year_estimate,popular,meaning,story,image_path,prompt`

---

## 9. 关键节点（实现要点）

- 读取词表并过滤注释/空行
- 生成 id（默认拼音；碰撞自动加后缀）
- 调用 `utils/llm_api.generate_llm_response()` 获取 JSON
- 清理模型可能输出的代码块围栏并 `json.loads`
- 规范化字段：`year_estimate` 转 int；`popular` 转 int 并限制在 1-10
- 写入 `data.json`（原子写）
- 追加到 `manifest.json`（原子写）
- 每条更新 progress 文件，支持断点续传
