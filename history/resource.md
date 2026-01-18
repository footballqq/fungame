# 资源生成指南 (Resource Generation Guide)

本文件详细说明了《成语接龙 - 历史长河》游戏的资源结构与生成标准。我们将基于此结构开发自动化生成工具。

## 1. 目录结构

所有游戏资源存储在 `history/resources/` 目录下：

```text
history/
  ├── resources/
  │    ├── manifest.json       # 核心资源索引文件 (包含所有卡片元数据)
  │    ├── images/             # 图片资源目录
  │    │    ├── 1001.png       # 卡片图片 (命名与ID对应)
  │    │    ├── 1002.png
  │    │    └── ...
  │    └── audio/              # 音效资源 (可选)
```

## 2. 核心索引文件 (`manifest.json`)

这是游戏加载数据的入口。

### Json 结构
```json
{
  "version": "1.0",
  "updated_at": "2024-01-18",
  "cards": [
    {
      "id": "1001",
      "name": "完璧归赵",
      "period": "战国",
      "year_estimate": -283,
      "meaning": "本指蔺相如将和氏璧完好地自秦送回赵国。后比喻把原物完好地归还本人。",
      "story": "战国时期，赵国得到和氏璧，秦王欲以十五城交换...",
      "image_path": "images/1001.png",
      "prompt": "High quality, historical illustration, ancient Chinese official Lin Xiangru holding a jade disc, standing in a grand Qin dynasty palace hall, facing strict soldiers, dramatic lighting, detailed texture, cinematic compilation."
    },
    // ... 更多卡片
  ]
}
```

### 字段说明
*   **id**: 唯一标识符 (字符串)，建议使用数字编号。
*   **name**: 成语名称。
*   **period**: 历史时期 (如 "战国", "东汉")。
*   **year_estimate**: 估算年份 (整数)。
    *   **负数**代表公元前 (BC)。
    *   **正数**代表公元后 (AD)。
    *   **排序逻辑**: 游戏按此字段从小到大排序。
    *   **对于年份相同的处理**: 游戏逻辑视为**“相等”**。这意味着玩家将这些卡片放在任何相对顺序都被视为正确，只要它们整体处于正确的时间段内（即比它小的在左边，比它大的在右边）。
*   **meaning**: 成语释义。
*   **story**: 简短的历史典故或背景故事。
*   **image_path**: 相对于 `resources/` 目录的图片路径。
*   **prompt**: 用于生成该图片的 AI 提示词 (方便后续重新生成)。

## 3. 图片规范
*   **格式**: PNG 或 JPG。
*   **尺寸**: 建议 512x768 (竖版) 或 1024x1024 (方形)，游戏 CSS 会自适应。
*   **风格**: 统一为"厚涂/历史插画风格" (Impasto/Historical Illustration)，色调偏古铜/水墨。

## 4. 自动化生成流程 (Planned)

我们将编写 Python 脚本 (`tools/generate_resources.py`) 来辅助生成：

1.  **输入**: 接收一个成语列表 (Excel/CSV/Text)。
2.  **LLM 处理**:
    *   自动补全成语的 `period`, `year_estimate`, `meaning`, `story`。
    *   生成对应的绘画 `prompt`。
3.  **图像生成**: 调用文生图 API 批量生成图片并保存至 `images/`。
4.  **输出**: 自动更新 `manifest.json`。
