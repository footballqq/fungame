# 成语排序 (Idiom Sorting) - 产品设计文档

## 1. 游戏概述
**游戏名称**: 成语排序
**核心玩法**: 玩家通过拖拽卡片对成语进行排序，并在完成后提交验证。
**目标用户**: 所有年龄段，特别是对中国传统文化感兴趣的用户。
**平台**: Web (适配手机、平板、电脑)

## 2. 游戏机制

### 2.1 难度设置
*   **高难度**: 10 张卡片
*   **中难度**: 7 张卡片
*   **低难度**: 5 张卡片

### 2.2 游戏流程
1.  **开始游戏**: 用户选择难度。
2.  **发牌**: 系统随机抽取对应数量的成语卡片，打乱顺序显示在屏幕上。
    *   卡片正面显示: 成语名称、成语配图。
3.  **排序**: 用户拖拽卡片交换位置，排列成语顺序（例如按时间顺序、首字母拼音、或故事关联性，需明确排序规则，根据描述推测可能是按“产生时间”排序，因背面有“预估产生时间”）。
    *   *设计补充*: 默认按**成语典故发生的时间先后**进行排序。
4.  **提交**: 用户点击“提交”按钮。
5.  **结算**:
    *   **成功**: 顺序完全正确，游戏结束，显示胜利动画。
    *   **失败**: 提示错误及错误次数。用户可继续挑战或选择“看答案”。
6.  **看答案**:
    *   点击“看答案”后，卡片变为可交互状态。
    *   点击卡片翻转，显示背面信息。

### 2.3 卡片设计
*   **正面**:
    *   成语名称 (Bold, Clear Font)
    *   成语图片 (Historical Style, e.g., Koei Three Kingdoms style)
*   **背面**:
    *   成语名称
    *   典故来历 (Story)
    *   成语释义 (Meaning)
    *   预估产生时间 (Year/Dynasty)

### 2.4 视觉与交互
*   **特效**:
    *   鼠标悬停 (Hover): 卡片轻微晃动，背景发光。
    *   拖拽: 平滑的交换动画。
    *   翻转: 3D 翻转效果。
*   **风格**: 古风，厚重历史感，参考《三国志》风格。青铜边框，云纹，龙纹。

## 3. 资源文件管理系统方案

### 3.1 目录结构
所有资源存储在 `resources` 目录下，建议结构如下：

```text
/resources
  /cards
    /001_taoyuanjieyi
      image.png        (卡片正面图)
      data.json        (卡片元数据)
    /002_kongrongrangli
      image.png
      data.json
    ...
  manifest.json        (总索引文件，包含所有成语的列表和基本信息，用于快速加载)
```

### 3.2 数据格式 (data.json)
```json
{
  "id": "taoyuanjieyi",
  "name": "桃园结义",
  "period": "东汉末年",
  "year_estimate": 184,
  "meaning": "比喻情投意合的人结合为兄弟，共同干一番事业。",
  "story": "...",
  "prompt": "..."
}
```

## 4. 资源生成系统设计

### 4.1 系统架构
系统由 CLI (命令行界面) 驱动，包含以下独立模块。建议使用 Node.js 或 Python 开发。

### 4.2 模块功能

#### 模块 A: 信息补全 (Metadata Generator)
*   **输入**: 成语列表 (CSV/Text)，每行一个成语名称，可选包含部分信息。
*   **处理**: 调用 LLM (e.g., GPT-4, Gemini) 获取成语的详细信息（典故、释义、产生年代、绘画提示词）。
*   **输出**: 更新 `manifest.json` 或生成个体的 `data.json`。
*   **断点续传**: 检查已存在的数据文件，跳过已生成的成语。

#### 模块 B: 图片生成 (Image Generator)
*   **输入**: 包含 `prompt` 字段的 JSON 数据。
*   **处理**: 调用绘图接口 (Mock/API) 根据提示词生成图片。
    *   *提示词模板*: 使用用户提供的 reference prompt 风格。
*   **输出**: 保存为 `image.png`。
*   **断点续传**: 检查目录下是否存在 `image.png`，存在则跳过。

#### 模块 C: 验证与打包 (Validator & Packer)
*   **功能**: 检查数据完整性，生成最终的 `manifest.json` 供游戏通过 HTTP 读取。

### 4.3 提示词策略 (Prompt Engineering)
为保证风格统一，需设计 System Prompt:
"You are a historian and art director. For the idiom '{idiom}', provide:
1. Estimated year/period.
2. Meaning.
3. The story background.
4. An image generation prompt describing a scene from the story, strictly following this style: 'A trading card design with a heavy historical feel...'"

## 5. 开发路线
1.  **Phase 1**: 实现资源生成系统的 Core Logic (Node.js script)。
2.  **Phase 2**: 生成一批测试数据 (5-10个成语)。
3.  **Phase 3**: 开发前端游戏原型 (HTML/JS/CSS)。
4.  **Phase 4**: 集成资源与前端，调试动画与交互。
