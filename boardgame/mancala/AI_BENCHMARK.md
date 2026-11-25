# 非洲播棋 (Mancala · Kalah) · 7 层 Alpha-Beta AI 与自动博弈评测报告

## 一、AI 架构设计（[js/ai.js](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/mancala/js/ai.js)）

非洲播棋每回合最多只有 6 个合法坑位，但因存在**连续免费连击（额外回合）**与**跨岸对坑截胡**，人类很难凭直觉看穿 5 步之后的连锁反应。本项目采用 **Alpha-Beta 极小极大剪枝搜索 + 免费连击优先排序**：
- **🌱 入门 AI (`easy`)**：42% 随机 + Depth 2 浅搜，适合新手体验；
- **🤖 标准 AI (`normal`)**：Depth 4 Alpha-Beta 搜索；
- **👑 酋长大师 AI (`master`)**：**Depth 7 Alpha-Beta 深度搜索**，综合大宝库净胜分（×12）、己方蓄水池余量与可触发免费连击坑数，单步决策仅需 **0.24–0.27 毫秒**！

---

## 二、先后手对称自动博弈评测表（每坑 4 颗经典局，每组 40 局）

通过 [bench_ai.js](file:///E:/users/kpan/BaiduSyncdisk/program/aigc/fungame/boardgame/mancala/bench_ai.js) 执行对称交叉赛（每组双方各执南岸先手 20 局 + 北岸后手 20 局）：

| 对阵双方 (A vs B) | A 胜局 / 40 | 平局 | A 胜率 | 平均回合数 | A 单步耗时 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **👑 酋长大师 (`master`) vs 随机 (`random`)** | **40** | 0 | **100.0%** | 18.6 | 0.27 ms |
| **👑 酋长大师 (`master`) vs 🌱 入门 (`easy`)** | **40** | 0 | **100.0%** | 20.8 | 0.24 ms |
| **👑 酋长大师 (`master`) vs 🤖 标准 (`normal`)** | **31** | 9 | **77.5%（0 负）** | 21.9 | 0.26 ms |
| 🤖 标准 (`normal`) vs 随机 (`random`) | **40** | 0 | **100.0%** | 21.6 | 0.02 ms |

## 三、如何复现评测？

```powershell
node boardgame/mancala/bench_ai.js 40
```
