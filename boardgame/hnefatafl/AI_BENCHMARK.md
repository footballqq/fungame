# 维京王者之棋 (Hnefatafl) · Alpha-Beta AI 算法与自动博弈评测报告

## 一、AI 架构设计（[js/ai.js](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/hnefatafl/js/ai.js)）

维京王者之棋是典型的**完全信息、零随机性、非对称攻防博弈**。本项目采用 **Alpha-Beta 极小极大剪枝搜索 + 启发式走法排序**，评估函数从白方（守卫）视角综合计算 5 个核心维度：
1. **非对称子力价值**：白方卫兵少而精（单子 +135），黑方进攻者数量多（单子 -78）；
2. **国王突围距离**：国王距离四个角落逃生堡垒的最短曼哈顿距离；
3. **双线叫杀威胁**：国王直线可达 1 个角落（+320）或同时威胁 2 个角落（+900，几乎必胜）；
4. **贴身合围危险度**：国王正交四邻格贴身黑兵数量惩罚；
5. **角落前哨封锁**：黑方占据角落外围封锁点（如 `(0,1), (1,0)` 等）加分。

---

## 二、先后手对称自动博弈评测表（7×7 Brandubh，每组 24 局）

通过 [bench_ai.js](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/hnefatafl/bench_ai.js) 执行对称交叉赛（每组双方各执黑进攻 12 局 + 执白护王 12 局）：

| 对阵双方 (A vs B) | A 胜局 / 24 | 平局 | A 胜率 | 平均回合数 | A 单步耗时 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **👑 大酋长 (`master`) vs 随机 (`random`)** | **24** | 0 | **100.0%** | 12.8 | 1.82 ms |
| **👑 大酋长 (`master`) vs 🌱 入门 (`easy`)** | **23** | 0 | **95.8%** | 11.2 | 1.40 ms |
| **👑 大酋长 (`master`) vs 🤖 标准 (`normal`)** | **14** | 0 | **58.3%** | 21.5 | 1.58 ms |
| 🤖 标准 (`normal`) vs 随机 (`random`) | **24** | 0 | **100.0%** | 16.4 | 0.16 ms |

## 三、如何复现评测？

```powershell
node boardgame/hnefatafl/bench_ai.js 24
```
