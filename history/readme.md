# 历史成语排序游戏 (Idiom Sorting Game) - 使用指南

本项目是一个基于 Web 的成语排序游戏，玩家需要根据成语典故发生的历史年代对卡片进行排序。
项目包含游戏前端和一套用于生成游戏资源的 Python 工具链。

## 1. 快速开始 (Quick Start)

### 运行游戏
直接在浏览器中打开 `game/index.html` 即可开始游戏。
*   建议使用 Chrome 或 Edge 浏览器。
*   游戏加载时会读取 `resources/manifest.json` 和 `resources/cards/` 下的资源。

## 2. 内容生成与更新 (Content Generation)

如果你想添加新的成语或更新现有内容，请按照以下步骤操作：

### 第一步：准备列表
编辑 `raw_data/idioms.txt` 文件，每行输入一个成语。
例如：
```text
桃园结义
草船借箭
负荆请罪
...
```

### 第二步：生成数据
在项目根目录下 (`program/aigc/fungame`)，依次运行以下命令：

1.  **生成元数据 (Metadata)**
    ```powershell
    python history/tools/gen_meta.py
    ```
    *   **作用**: 调用 LLM (大模型) 为每个成语生成 JSON 数据，包含年代 (`year_estimate`)、释义、典故和图片提示词。
    *   **位置**: 生成的文件保存在 `history/resources/cards/{拼音ID}/data.json`。
    *   **注意**: 首次运行需要配置好 `utils/config.ini` 中的 LLM Key。

2.  **生成图片 (Assets)**
    ```powershell
    python history/tools/gen_image.py
    ```
    *   **作用**: 为每个成语生成展示用的图片。目前版本生成的是 Mock (占位) 图片。
    *   **位置**: `history/resources/cards/{拼音ID}/image.png`。

3.  **打包资源 (Pack)**
    ```powershell
    python history/tools/pack.py
    ```
    *   **作用**: 扫描所有有效的卡片，生成游戏所需的总索引文件 `manifest.json`。
    *   **必须执行**: 每次修改数据或添加图片后，都**必须**运行此步骤，否则游戏无法加载更新。

## 3. 常见问题：如何确保排序准确？

游戏的排序判定完全依赖于 LLM 生成的 `year_estimate` (年代预估值)。由于 LLM 可能出现幻觉或对模糊年代判断不一致，建议人工校验。

### 校验与修正步骤：

1.  **运行生成脚本** (`gen_meta.py`) 完成后，不要急着运行 `pack.py`。
2.  **进入目录**: 打开 `history/resources/cards/` 目录。
3.  **检查 JSON**: 查看各个成语文件夹下的 `data.json`。
    *   重点检查 `"year_estimate"` 字段（整数年份）。
    *   例如：“桃园结义”应该是 184 (年)，“负荆请罪”应该是 -279 (年/公元前)。
4.  **手动修正**: 如果发现年份不准确，直接用文本编辑器修改 `data.json` 中的 `year_estimate` 值。
5.  **应用更改**: 修正完成后，运行 `python history/tools/pack.py` 更新索引。

### 技巧
*   如果成语属于同一个历史时期（如都在三国），确保它们的 `year_estimate` 有明显的区分，否则排序时可能会出现逻辑冲突（虽然代码只比较大小）。
*   修改 `data.json` 中的 `meaning` (释义) 或 `story` (典故) 也可以优化游戏体验，这些内容会在“查看答案”时显示。

## 4. 目录说明

*   `history/game/`: 游戏前端代码 (HTML/CSS/JS)。
*   `history/tools/`: Python 工具脚本。
*   `history/resources/`: 存放所有生成后的游戏资源。
*   `history/raw_data/`: 原始输入文件。
