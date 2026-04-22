# CODEx_TODO.md

- [ ] 阶段一：项目基础搭建
  - [X] 创建并配置 CODEx_TODO.md 与 .codex/state.json
  - [X] 构建底层数据结构 (`js/app.js`)，载入初始 30 题 JSON
- [X] 阶段二：管理后台 (`edit.html`, `js/edit.js`)
  - [X] 牌库配置界面（选择花色、数字范围、重置卡池）
  - [X] 题库列表渲染
  - [X] 题目增删改功能及 LocalStorage 导入导出
- [X] 阶段三：抽奖前台 (`draw.html`, `js/draw.js`, `css/style.css`)
  - [X] 页面布局与极客紫风格 CSS
  - [X] 扑克牌池初始化与按空格抽卡防抖逻辑
  - [X] 抽卡动画效果（CSS 翻转/随机乱闪）
  - [X] 随机抽取题目逻辑（3 必答 + 3 选答去重）
  - [X] 抽中牌与对应题目的最终展示
- [X] 阶段四：验证与测试
  - [X] 测试去重逻辑是否严谨
  - [X] 测试缓存机制是否正常工作
