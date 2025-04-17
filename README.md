# 微积分披萨教学演示

## 项目概述

这个交互式演示项目旨在通过切披萨的方式，向数学基础好的小朋友直观地展示割圆术与微积分的关系。通过增加切片数量来逐渐逼近圆的精确面积，从而引入极限和积分的概念。

## 教学目标

1. 理解割圆术的基本原理
2. 体验通过增加分割数量来提高近似精度的过程
3. 直观感受极限的概念
4. 建立对定积分作为面积和的理解
5. 认识微积分的基本思想：无限分割、求和与极限

## 项目结构

```
├── README.md                 # 项目文档
├── index.html                # 主页面
├── css/                      # 样式文件
│   └── style.css             # 主样式表
├── js/                       # JavaScript模块
│   ├── main.js               # 主程序入口
│   ├── calculator.js         # 计算模块
│   ├── visualizer.js         # 可视化模块
│   └── ui-controller.js      # 用户界面控制模块
└── assets/                   # 图片等资源
```

## 功能模块

### 计算模块 (calculator.js)
- 计算不同切片数量下的近似面积
- 计算与真实面积的误差
- 提供数学公式的计算支持

### 可视化模块 (visualizer.js)
- 绘制披萨及其切片
- 动态展示切片过程
- 显示面积计算结果

### 用户界面控制模块 (ui-controller.js)
- 处理用户交互事件
- 控制动画效果
- 更新界面显示

## 教学流程

1. **引入问题**：如何计算一个圆形披萨的面积？
2. **初步尝试**：将披萨切成几块三角形，计算三角形面积之和
3. **改进方法**：增加切片数量，观察近似值的变化
4. **极限概念**：当切片数趋于无穷大时，近似值趋近于真实面积
5. **微积分联系**：介绍这一过程与积分的关系

## 交互特性

- 滑动条控制切片数量
- 动态显示面积计算过程
- 图表展示误差随切片数量的变化
- 公式展示区，显示相关数学公式
- 步骤解释区，配合可视化过程提供文字说明

## 技术实现

- 使用HTML5 Canvas进行图形绘制
- 使用JavaScript实现交互逻辑
- 响应式设计，适应不同屏幕尺寸
- 动画效果增强学习体验

## 教育价值

这个演示通过直观、有趣的方式，帮助小朋友理解微积分中最核心的思想——通过无限分割和求和来计算复杂图形的面积。这种方法将抽象的数学概念转化为具体可见的过程，有助于建立直觉理解，为未来深入学习微积分奠定基础。