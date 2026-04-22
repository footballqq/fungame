# Map Game - Codex 开发规范 (SPEC)

## 项目概述
开发一个基于 HTML5 的地理知识问答网页游戏，使用 GeoJSON 地图数据。

## 技术栈
- **前端：** HTML5 + CSS3 + JavaScript (ES6+)
- **地图库：** D3.js v7（推荐）或 Leaflet
- **数据格式：** GeoJSON（地图） + JSON（城市坐标）
- **打包工具：** 无需打包，纯前端

---

## 项目结构
```
~/games/map/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件（古典风格）
├── js/
│   ├── game.js        # 游戏主逻辑
│   └── utils.js       # 工具函数（距离计算、坐标转换等）
├── data/
│   ├── china-provinces.geojson  # 中国省界（34省 + 边界）
│   ├── china-cities.json        # 中国省会（34个）
│   ├── world-countries.geojson  # 世界国家（180个）
│   └── world-cities.json        # 世界城市（272个）
└── tests/
    └── game-test.js   # Playwright 测试
```

---

## 数据结构

### 地图数据（GeoJSON）
```javascript
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "吉林省",
        "adcode": "220000",
        "center": [125.3245, 43.886841]  // [lon, lat]
      },
      "geometry": {
        "type": "Polygon" | "MultiPolygon",
        "coordinates": [...]
      }
    }
  ]
}
```

### 城市数据（JSON）
```javascript
{
  "name": "长春",           // 中文名称
  "enName": "Changchun",   // 英文名称
  "lat": 43.886841,        // 纬度
  "lon": 125.3245,         // 经度
  "type": "capital",       // capital（省会/首都） 或 major（主要城市）
  "province": "吉林省",    // 所属省份（仅中国）
  "country": "China"       // 所属国家（仅世界）
}
```

### 游戏状态
```javascript
{
  // 当前游戏状态
  mode: "province-click" | "city-click" | "world-province" | "world-city",
  currentQuestion: 0,
  totalQuestions: 10,
  score: 0,
  accuracy: 0,
  totalDistance: 0,  // 总距离（仅城市模式）

  // 当前题目
  currentTarget: {
    type: "province" | "city",
    name: "吉林省",
    actualPosition: { lat: 43.886841, lon: 125.3245 },
    playerClick: null
  },

  // 题目列表
  questions: [
    { type: "province", name: "吉林省", actualPosition: {...} },
    { type: "city", name: "长春", actualPosition: {...} }
  ],

  // 游戏历史（用于结果展示）
  history: [
    {
      question: "吉林省",
      actualPosition: { lat: ..., lon: ... },
      playerPosition: { lat: ..., lon: ... },
      distance: 123.456  // km
    }
  ]
}
```

---

## 游戏模式

### 模式1：省份点击
**游戏流程：**
1. 显示空白中国地图（仅外边界）
2. 随机选择10个省份
3. 每题显示："请点击：吉林省"
4. 玩家点击地图
5. 判断点击是否在对应省份边界内
6. 计算准确率（正确题数 / 10）

**评分标准：**
- 10/10: 料事如神
- 8-9: 深不可测
- 6-7: 出类拔萃
- 4-5: 马马虎虎
- 0-3: 还得再练练

### 模式2：省会定位
**游戏流程：**
1. 显示中国省界地图
2. 随机选择10个省会城市
3. 每题显示："请点击：吉林省会"
4. 玩家点击地图
5. 计算点击位置与实际位置的距离（Haversine 公式）
6. 累计总距离
7. 根据总距离评分

**评分标准（总距离 km）：**
- < 500: 料事如神
- 500-1000: 深不可测
- 1000-2000: 出类拔萃
- 2000-5000: 马马虎虎
- > 5000: 还得再练练

### 模式3：世界地图
**子模式：**
- 国家点击（类似模式1）
- 国家首都（类似模式2）
- 主要大城市（类似模式2，使用主要城市列表）

---

## 核心功能

### 1. 地图渲染
```javascript
// 使用 D3.js 渲染 GeoJSON
function renderMap(geojsonData, svgContainer, options) {
  const svg = d3.select(svgContainer)
    .append("svg")
    .attr("width", options.width)
    .attr("height", options.height);

  const projection = d3.geoMercator()
    .scale(options.scale)
    .translate([options.width / 2, options.height / 2]);

  const path = d3.geoPath().projection(projection);

  svg.selectAll("path")
    .data(geojsonData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", options.fillColor)
    .attr("stroke", options.strokeColor)
    .on("click", handleClick);

  return { svg, projection, path };
}
```

### 2. 点击检测
```javascript
// 省份点击检测
function detectProvinceClick(clickPosition, geojsonData, projection) {
  const [x, y] = projection.invert([clickPosition.x, clickPosition.y]);
  const point = turf.point([y, x]);  // [lon, lat]

  for (const feature of geojsonData.features) {
    const polygon = turf.polygon(feature.geometry.coordinates);
    if (turf.booleanPointInPolygon(point, polygon)) {
      return feature.properties.name;
    }
  }
  return null;
}

// 城市距离计算
function calculateDistance(playerPosition, actualPosition) {
  const R = 6371;  // 地球半径（km）

  const dLat = (playerPosition.lat - actualPosition.lat) * Math.PI / 180;
  const dLon = (playerPosition.lon - actualPosition.lon) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(actualPosition.lat * Math.PI / 180) *
            Math.cos(playerPosition.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;  // km
}
```

### 3. 地图操作
```javascript
// 缩放
function zoomMap(scale, center) {
  // 使用 D3 zoom 或手写缩放逻辑
}

// 平移
function panMap(deltaX, deltaY) {
  // 使用 D3 zoom 或手写平移逻辑
}
```

### 4. 题目生成
```javascript
// 随机生成题目
function generateQuestions(mode, citiesData, provincesData, count = 10) {
  const questions = [];

  if (mode === "province-click") {
    const provinces = provincesData.features
      .filter(f => f.properties.level === "province")
      .map(f => ({
        type: "province",
        name: f.properties.name,
        actualPosition: {
          lat: f.properties.center[1],
          lon: f.properties.center[0]
        }
      }));

    return shuffleArray(provinces).slice(0, count);
  }

  if (mode === "city-click") {
    const cities = citiesData.filter(c => c.type === "capital");
    return shuffleArray(cities).slice(0, count);
  }

  // 世界地图模式类似
}
```

### 5. 评分系统
```javascript
// 省份点击评分
function getProvinceScore(accuracy) {
  if (accuracy === 1.0) return "料事如神";
  if (accuracy >= 0.8) return "深不可测";
  if (accuracy >= 0.6) return "出类拔萃";
  if (accuracy >= 0.4) return "马马虎虎";
  return "还得再练练";
}

// 城市定位评分
function getCityScore(totalDistance) {
  if (totalDistance < 500) return "料事如神";
  if (totalDistance < 1000) return "深不可测";
  if (totalDistance < 2000) return "出类拔萃";
  if (totalDistance < 5000) return "马马虎虎";
  return "还得再练练";
}
```

---

## UI 设计

### 视觉风格
**配色方案（古典三国风格）：**
- 主色：#8B4513（鞍褐色）
- 次色：#D2691E（巧克力色）
- 强调色：#FFD700（金色）
- 背景：#F5DEB3（小麦色）
- 文字：#2C1810（深棕色）

### 界面结构

#### 1. 首页
```html
<div id="home-page">
  <h1>地理知识问答</h1>
  <div id="mode-selection">
    <button data-mode="province-click">省份大挑战</button>
    <button data-mode="city-click">省会定位</button>
    <button data-mode="world-province">世界探索</button>
    <button data-mode="world-city">首都挑战</button>
  </div>
</div>
```

#### 2. 游戏页
```html
<div id="game-page">
  <div id="header">
    <span id="question">请点击：吉林省</span>
    <span id="progress">1/10</span>
  </div>
  <div id="map-container">
    <!-- SVG 地图渲染区域 -->
  </div>
  <div id="controls">
    <button id="next-btn">下一题</button>
  </div>
</div>
```

#### 3. 结果页
```html
<div id="result-page">
  <h1 id="score-text">料事如神</h1>
  <div id="details">
    <p>准确率: 80%</p>
    <p>正确题数: 8/10</p>
  </div>
  <div id="map-review">
    <!-- 显示所有题目结果的地图 -->
  </div>
  <button id="restart-btn">重新开始</button>
</div>
```

---

## 响应式设计

### 移动端适配
```css
@media (max-width: 768px) {
  #map-container {
    width: 100%;
    height: 60vh;
    touch-action: none;  /* 禁止浏览器默认触摸行为 */
  }
}

@media (min-width: 769px) {
  #map-container {
    width: 80%;
    height: 70vh;
    margin: 0 auto;
  }
}
```

### 触摸事件
```javascript
// 支持触摸操作
mapSvg.on("touchstart", handleTouchStart)
     .on("touchmove", handleTouchMove)
     .on("touchend", handleTouchEnd);
```

---

## 工具函数

### 坐标转换
```javascript
// 地理坐标 → 屏幕坐标
function geoToScreen(lat, lon, projection) {
  const [x, y] = projection([lon, lat]);
  return { x, y };
}

// 屏幕坐标 → 地理坐标
function screenToGeo(x, y, projection) {
  const [lon, lat] = projection.invert([x, y]);
  return { lat, lon };
}
```

### 数组工具
```javascript
// 洗牌算法
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

---

## 测试要求

### Playwright 测试
```javascript
// tests/game-test.js
const { test, expect } = require('@playwright/test');

test('省份点击模式', async ({ page }) => {
  await page.goto('file://./index.html');

  // 选择模式
  await page.click('button[data-mode="province-click"]');

  // 验证游戏页加载
  await expect(page.locator('#game-page')).toBeVisible();

  // 验证题目显示
  const question = await page.textContent('#question');
  expect(question).toMatch(/请点击：/);

  // 模拟点击
  await page.click('svg path:nth-child(1)');

  // 验证结果
  await expect(page.locator('#result-page')).toBeVisible();
});
```

---

## 性能优化

### 数据优化
- 使用 GeoJSON 压缩（TopoJSON）
- 懒加载地图数据
- 缓存渲染结果

### 渲染优化
- 使用 SVG canvas（如果数据量大）
- 虚拟滚动（如果题目列表长）
- 防抖缩放和平移事件

---

## 交付清单

### 核心文件
- [x] index.html
- [x] css/style.css
- [x] js/game.js
- [x] js/utils.js
- [x] data/*.geojson
- [x] data/*.json

### 可选文件
- [ ] tests/game-test.js
- [ ] README.md

---

**SPEC 版本：** 1.0
**创建时间：** 2026-02-19 21:29
**状态：** 已完成
