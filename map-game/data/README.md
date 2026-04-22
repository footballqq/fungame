# 数据资源说明文档

## 数据文件列表

### 中国地图数据
```
data/
├── china-provinces.geojson  # 中国省界数据
├── china-cities.json        # 中国省会城市坐标
└── china-outline.geojson    # 中国外边界
```

### 世界地图数据
```
data/
├── world-countries.geojson  # 世界国家边界
├── world-cities.json        # 世界城市坐标（国家首都+主要城市）
└── world-outline.geojson    # 世界外边界
```

---

## 数据格式说明

### GeoJSON 格式
- **用途：** 存储地图边界数据
- **结构：** FeatureCollection，包含多个 Feature
- **每个 Feature 包含：**
  - `type`: "Feature"
  - `properties`: 属性信息（名称、ID等）
  - `geometry`: 几何形状（Polygon 或 MultiPolygon）

**示例结构：**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "吉林省",
        "id": "22"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

### 城市坐标格式
- **用途：** 存储城市地理坐标
- **结构：** JSON 数组，每个城市包含名称、坐标
- **必需字段：**
  - `name`: 城市名称（中文）
  - `enName`: 城市名称（英文，可选）
  - `lat`: 纬度
  - `lon`: 经度
  - `type`: 类型（capital/省会, major/主要城市）
  - `country`: 所属国家（仅世界地图需要）

**示例结构：**
```json
[
  {
    "name": "长春",
    "lat": 43.8171,
    "lon": 125.3235,
    "type": "capital"
  }
]
```

---

## 中国省份数据要求

### 省份列表（34个省级行政区）

**直辖市（4个）：**
- 北京市、天津市、上海市、重庆市

**省（23个）：**
- 河北省、山西省、辽宁省、吉林省、黑龙江省、江苏省、浙江省、安徽省、福建省、江西省、山东省、河南省、湖北省、湖南省、广东省、海南省、四川省、贵州省、云南省、陕西省、甘肃省、青海省、台湾省

**自治区（5个）：**
- 内蒙古自治区、广西壮族自治区、西藏自治区、宁夏回族自治区、新疆维吾尔自治区

**特别行政区（2个）：**
- 香港特别行政区、澳门特别行政区

### 省会城市列表
每个省份必须有对应的省会城市坐标数据。

---

## 世界地图数据要求

### 国家数据
- 包含所有主权国家的边界
- 至少包含：名称、ID、边界坐标

### 首都城市
- 所有主权国家的首都
- 每个国家至少1个首都城市坐标

### 主要城市（前50大城市）
根据人口、知名度、经济地位等指标确定

**示例城市：**
- 亚洲：东京、首尔、曼谷、新加坡、雅加达、马尼拉、胡志明市、孟买、德里、迪拜
- 欧洲：伦敦、巴黎、柏林、罗马、马德里、莫斯科、伊斯坦布尔
- 北美洲：纽约、洛杉矶、芝加哥、多伦多、墨西哥城
- 南美洲：圣保罗、布宜诺斯艾利斯、利马
- 大洋洲：悉尼、墨尔本
- 非洲：开罗、拉各斯、约翰内斯堡

---

## 数据来源

### 推荐数据源

**中国地图：**
1. 阿里 DataV 地图数据
   - URL: https://datav.aliyun.com/portal/school/atlas/area_selector
   - 格式：GeoJSON
   - 特点：高精度、免费

2. GitHub 开源项目
   - 搜索关键词：china geojson、china map json
   - 仓库：如 modood/Administrative-divisions-of-China

**世界地图：**
1. 阿里 DataV 世界地图
   - URL: https://datav.aliyun.com/portal/school/atlas/area_selector
   - 格式：GeoJSON

2. Natural Earth Data
   - URL: https://www.naturalearthdata.com/
   - 格式：GeoJSON/SHP
   - 特点：开源、高精度

3. GitHub 开源项目
   - 搜索关键词：world geojson、world map json
   - 仓库：如 johan/world.geo.json

---

## 数据质量要求

### 精度要求
- 坐标精度：至少 4 位小数（~10米精度）
- 边界精度：符合实际地理边界

### 完整性要求
- 中国：覆盖所有 34 个省级行政区
- 世界：覆盖所有主权国家
- 城市：包含所有省会和国家首都

### 兼容性要求
- 标准 GeoJSON 格式
- UTF-8 编码
- 兼容主流地图库（D3.js、Leaflet）

---

## 数据验证检查表

- [ ] 文件格式正确（GeoJSON/JSON）
- [ ] 编码格式正确（UTF-8）
- [ ] 数据完整性（所有省份/国家都有数据）
- [ ] 坐标精度（经纬度在合理范围内）
- [ ] 边界闭合（Polygon 首尾坐标相同）
- [ ] 属性完整（名称、ID等必需字段）
- [ ] 无重复数据
- [ ] 文件大小合理（<10MB 单文件）

---

## 使用说明

### 读取数据
```javascript
// 读取 GeoJSON
const mapData = await fetch('data/china-provinces.geojson')
  .then(res => res.json());

// 读取城市坐标
const cityData = await fetch('data/china-cities.json')
  .then(res => res.json());
```

### 渲染地图
使用 D3.js 或 Leaflet 库渲染 GeoJSON 数据

### 坐标转换
将地理坐标（经纬度）转换为地图像素坐标

### 距离计算
使用 Haversine 公式计算两点间地理距离

---

**文档创建时间：** 2026-02-19 21:23
**状态：** 待填充数据
