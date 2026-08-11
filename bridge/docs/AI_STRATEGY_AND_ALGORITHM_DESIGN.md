# 《架桥》(Bridg-It) AI 策略分级、博弈算法与性能优化设计文档

本文档详细记录了网页游戏《架桥》（Bridg-It）中人工智能（AI）的算法演进、小棋盘穷举与大棋盘剪枝策略、0ms 战术截杀机制、时间熔断保护以及马丁·加德纳《数学游戏》第 18 章中奥利弗·格罗斯（Oliver Gross）“虚线配对策略”的理论与工程落地。

---

## 1. 马丁·加德纳第 18 章：奥利弗·格罗斯配对策略 (Oliver Gross Pairing Strategy)

根据 `bookchapter-12.pdf` (Chapter 18: Bridg-it and Other Games)：

### 1.1 配对策略 (Pairing Strategy) 的博弈论定义
- **元素划分**：将棋盘上所有可落子线段划分为互不重叠的二元组集合 $\{(a_1, b_1), (a_2, b_2), \dots, (a_k, b_k)\}$。
- **无脑应答**：当对手占据 $a_i$ 时，己方立即占领对应的 $b_i$。
- **民主特性 (Democratic Property)**：无需复杂深搜，面对任何水平的对手都能保证在拓扑上阻断对手并完成己方连通。

### 1.2 任意尺寸棋盘 ($7\times 8, 8\times 9$) 的通用有效性证明
- **书本原句证明**：Martin Gardner 在书中特别强调：
  > *"Gross picked this strategy because of its regularity and the ease with which it can be extended to a Bridg-it board of any size."*
  （格罗斯选择该配对策略，正是因为它具有极强的正则性，**可以天然推广扩展到任意尺寸的 Bridg-it 棋盘上**。）
- **Lehman 定理**：1964 年 Alfred Lehman 在 Journal of SIAM 上证明了香农切换游戏（Shannon Switching Game）的图论通解：只要网格具备两棵边不相交的生成树，**在任意大尺寸网格图上配对策略均 100% 成立**。
- **大棋盘的降维打击**：对于 $7 \times 8$ 或 $8 \times 9$ 棋盘，Minimax 树深搜容易引发 $O(B^D)$ 指数爆发，而配对策略的计算复杂度为 **$O(1)$ 常数查表**，单步耗时 $< 0.1\text{ms}$，在大棋盘上优势极为显著。

---

## 2. 棋盘尺寸分级与策略矩阵 (Adaptive Strategy Matrix)

Bridg-It 游戏支持 6 种棋盘尺寸（由 $3 \times 4$ 至 $8 \times 9$），不同棋盘规模下的搜索分支因子 $B$ 和博弈树复杂度呈指数级差异：

| 棋盘尺寸 | 状态节点总数估算 | 分支因子 $B$ | 采用的 AI 策略方案 | 单步计算耗时上限 |
| :--- | :--- | :--- | :--- | :--- |
| **3 × 4 (经典)** | 约 34 条边 | $15 \sim 25$ | **完全 Minimax 极小化极大穷举搜索** (深度 3~4) | $< 5 \text{ ms}$ |
| **4 × 5** | 约 49 条边 | $25 \sim 35$ | **小范围 Minimax 穷举 + 必胜/必防剪枝** | $< 10 \text{ ms}$ |
| **5 × 6** | 约 64 条边 | $35 \sim 45$ | **启发式候选边剪枝 ($K=8$) + Alpha-Beta 剪枝** | $< 20 \text{ ms}$ |
| **6 × 7** | 约 79 条边 | $45 \sim 55$ | **候选边剪枝 ($K=8$) + 150ms 时间预算熔断** | $< 30 \text{ ms}$ |
| **7 × 8 / 8 × 9** | 超过 100 条边 | $> 60$ | **配对策略查表 ($O(1)$) + 战术截杀 + 0-1 BFS** | $< 150 \text{ ms}$ (严格熔断) |
