# 地理知识问答游戏

## 项目概述
一个基于 HTML5 的地理知识问答网页游戏，使用 GeoJSON 地图数据，支持中国地图和世界地图两种模式，包括省份点击和城市定位两种玩法。

## 游戏模式

### 1. 省份大挑战
- 显示空白中国地图（仅外边界）
- 系统随机出题：如"请点击：吉林省"
- 玩家点击地图上对应省份位置
- 题目数量：10题
- 评分：根据准确率给出成语评价

### 2. 省会定位
- 显示中国省界地图
- 系统随机出题：如"请定位：吉林省会（长春）"
- 玩家点击省会城市位置
- 题目数量：10题
- 评分：计算所有点击位置与实际位置的真实地理距离总和

### 3. 世界国家挑战
- 显示世界地图
- 随机选择国家
- 玩家点击国家位置
- 评分：类似省份大挑战

### 4. 世界城市定位
- 显示世界地图
- 随机选择首都或主要大城市（272个城市：246首都 + 26主要大城市）
- 玩家点击城市位置
- 评分：基于总距离

## 技术栈
- **前端：** HTML5 + CSS3 + JavaScript (ES6+)
- **地图库：** D3.js v7
- **数据格式：** GeoJSON（地图） + JSON（城市坐标）
- **距离计算：** Haversine 公式（真实地理距离）
- **打包工具：** 无需打包，纯前端

## 项目结构
```
map/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件（古典风格）
├── js/
│   ├── game.js        # 游戏主逻辑
│   └── utils.js       # 工具函数（距离计算、坐标转换、地图渲染）
├── data/
│   ├── china-provinces.geojson  # 中国省界（34省 + 边界）
│   ├── china-cities.json        # 中国省会（34个）
│   ├── world-countries.geojson  # 世界国家（180个）
│   └── world-cities.json        # 世界城市（272个）
├── tests/
│   └── game-test.js   # Playwright 测试
├── docs/
│   └── design.md      # 详细设计文档
├── logs/
│   └── project-log.md # 项目日志
├── package.json        # 项目配置
└── README.md           # 项目说明
```

## 快速开始

### 本地运行
```bash
# 使用 Python 内置服务器
cd ~/games/map
python3 -m http.server 8000

# 或使用 Node.js 服务器
cd ~/games/map
npx serve -p 8000

# 访问
http://localhost:8000
```

### 运行测试
```bash
cd ~/games/map

# 安装 Playwright 浏览器
npx playwright install

# 运行测试
npm test
```

## 功能特性
- ✅ 4种游戏模式（省份点击、省会定位、世界国家、世界城市）
- ✅ D3.js v7 地图渲染
- ✅ 古典三国风格 UI
- ✅ 触摸 + 鼠标交互
- ✅ 响应式设计（支持手机/平板/桌面）
- ✅ Haversine 真实地理距离计算
- ✅ 成语评价系统
- ✅ 结果回顾（地图 + 历史记录）

## 评分系统

### 省份点击模式（准确率）
| 准确率 | 评价 |
|--------|------|
| 100% | 料事如神 |
| 80-99% | 深不可测 |
| 60-79% | 出类拔萃 |
| 40-59% | 马马虎虎 |
| 0-39% | 还得再练练 |

### 城市定位模式（总距离 km）
| 总距离 | 评价 |
|--------|------|
| < 500 | 料事如神 |
| 500-999 | 深不可测 |
| 1000-1999 | 出类拔萃 |
| 2000-4999 | 马马虎虎 |
| ≥ 5000 | 还得再练练 |

## 部署

### GitHub Pages（推荐）
1. 创建 GitHub 仓库
2. 推送代码
3. 启用 GitHub Pages

详细部署步骤请参考 `DEPLOYMENT.md`。

### Cloudflare Pages（备选）
1. 安装 Wrangler CLI
2. 登录 Cloudflare
3. 部署项目

详细部署步骤请参考 `DEPLOYMENT.md`。

## 数据来源
- **中国地图：** 阿里 DataV API (https://geo.datav.aliyun.com/)
- **世界地图：** GitHub - johan/world.geo.json
- **世界城市：** restcountries.com API + 手动整理

## 开发工具
- **代码生成：** Codex (OpenAI)
- **测试框架：** Playwright

## 浏览器兼容性
- ✅ Chrome (最新版)
- ✅ Firefox (最新版)
- ✅ Safari (最新版)
- ✅ Edge (最新版)
- ✅ 移动端浏览器

## 许可证
MIT

## 作者
TMNT

## 版本历史
- v1.0.0 (2026-02-19) - 初始版本，4种游戏模式，基础功能完成
