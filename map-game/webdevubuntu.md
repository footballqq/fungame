# Ubuntu 无 GUI Web 调试手册（可复用于其他项目）

## 1. 目标
这份文档用于在 Ubuntu 无图形界面（headless）环境下，稳定完成 Web 开发调试、问题复现、回归验证与发布排查。

## 2. 核心原则
1. 不依赖“肉眼看页面”，用可量化指标替代主观判断。
2. 先复现再修复，修复后必须回归。
3. 每次问题都沉淀成脚本或 checklist，避免重复踩坑。
4. 缓存问题默认高概率存在，版本号与资源参数必须联动更新。

## 3. 基础环境
安装依赖：
```bash
npm install
npx playwright install --with-deps
```

常用启动方式：
```bash
# 方式1：直接跑 E2E（通常会自动起服务）
npm test

# 方式2：手动静态服务
npx http-server -p 8080 -s
# 或 python3 -m http.server 8080
```

## 4. 无 GUI 下“看页面”的方法
### 4.1 截图
```bash
node - <<'NODE'
const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/smoke.png', fullPage: true });
  await browser.close();
})();
NODE
```

### 4.2 读取布局几何数据
用于排查“地图太小/偏移/遮挡”：
```bash
node - <<'NODE'
const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle' });
  await page.waitForSelector('#map-container svg');
  const box = await page.locator('#map-container').boundingBox();
  console.log({ mapW: Math.round(box.width), mapH: Math.round(box.height) });
  await browser.close();
})();
NODE
```

### 4.3 读取 DOM 状态
用于判断按钮、面板、错误提示是否符合预期：
```bash
node - <<'NODE'
const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle' });
  const state = await page.evaluate(()=>({
    version: document.querySelector('#home-version')?.textContent?.trim(),
    hasMap: !!document.querySelector('#map-container svg'),
    assistHidden: document.querySelector('#assist-tools')?.classList.contains('hidden')
  }));
  console.log(state);
  await browser.close();
})();
NODE
```

## 5. 交互问题调试（重点）
## 5.1 点击/拖动/缩放要分流
常见 bug：拖动后点击失效、缩放被判成答题。

建议：
1. `pointerdown` 记录起点与地图 transform。
2. `pointerup` 比较位移和 transform 变化。
3. 多指触控与 `pointercancel` 必须清理状态。
4. 非主指针（`isPrimary=false`）不要进入答题主流程。

## 5.2 不依赖单一路径命中
常见 bug：拖动后 `event.target` 失效导致“点了没反应”。

建议：
1. 先尝试 `event.target` 命中 feature。
2. 回退到“屏幕坐标 -> 经纬度 -> geoContains(feature)”匹配。
3. 两条路径都失败才判定为地图外点击。

## 5.3 地图外点击策略
建议统一为：
- 不计错
- 不跳题
- 给提示（例如“请点击地图轮廓内区域”）

## 6. 移动端专项调试
Playwright 设备仿真：
```bash
node - <<'NODE'
const { chromium, devices } = require('playwright');
(async()=>{
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices['iPad Pro 11'] });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle' });
  // 在这里模拟 tap/drag/pinch 场景
  await browser.close();
})();
NODE
```

移动端高频问题与处理：
1. 悬停高亮残留：
- 仅在 `@media (hover: hover) and (pointer: fine)` 下启用 `:hover`。

2. 工具栏遮挡地图：
- 默认折叠辅助操作，提供显隐开关。

3. 误触拖动：
- 触屏阈值大于鼠标阈值。

## 7. 数据与地图正确性检查
### 7.1 数据完整性
```bash
node - <<'NODE'
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('data/china-provinces.geojson','utf8'));
console.log('province features:', p.features.length);
NODE
```

### 7.2 特殊要素存在性
地图项目建议显式校验关键要素是否存在：
- 台湾
- 九段线
- 极小目标（如澳门）是否按玩法策略过滤

## 8. 回归测试策略
最低标准：
1. 自动化：`npm test` 全绿。
2. 手工脚本：
- 至少验证一次“拖动后点击仍有效”。
- 至少验证一次“地图外点击不计错”。
- 至少验证一次“移动端按钮不遮挡关键区域”。
3. 发布前：版本号与资源 query 参数同步递增。

## 9. 缓存与发布排查
当用户反馈“我这边没更新”时，优先检查：
1. 页面显示版本号是否已变化。
2. `index.html` 中 CSS/JS 的 `?v=` 是否同步更新。
3. Pages/CDN 是否仍在旧缓存窗口。

建议固定流程：
1. 改代码。
2. 改 `APP_VERSION`。
3. 改 `index.html` 的资源版本参数。
4. 回归测试。
5. 提交推送。

## 10. 可复用排障模板
可按下面模板记录每个问题：

```md
问题：
- 现象：
- 设备/浏览器：
- 复现步骤：

定位：
- 关键日志：
- 根因：

修复：
- 修改文件：
- 方案：

验证：
- 自动化：
- 手工脚本：
- 截图/日志路径：
```

## 11. 常用命令速查
```bash
# 测试
npm test

# 查看端口占用
lsof -i :8080 -sTCP:LISTEN -n -P

# 快速搜索代码
rg "pointerup|geoContains|haversine" js/

# 查看最近一次提交
git log -1 --oneline
```
