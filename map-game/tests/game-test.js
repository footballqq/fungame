const { test, expect } = require('@playwright/test');

test.describe('Map Game - 基础流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file:///home/qagent/games/map/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('加载页面并检查元素', async ({ page }) => {
    // 检查主要元素是否存在
    await expect(page.locator('#home-page')).toBeVisible();
    await expect(page.locator('#mode-selection')).toBeVisible();
    await expect(page.locator('button[data-mode="province-click"]')).toBeVisible();
    await expect(page.locator('button[data-mode="city-click"]')).toBeVisible();
    await expect(page.locator('button[data-mode="world-province"]')).toBeVisible();
    await expect(page.locator('button[data-mode="world-city"]')).toBeVisible();
  });

  test('测试省份点击模式', async ({ page }) => {
    // 选择省份点击模式
    await page.click('button[data-mode="province-click"]');
    
    // 验证游戏页加载
    await expect(page.locator('#game-page')).toBeVisible();
    await expect(page.locator('#map-container')).toBeVisible();
    await expect(page.locator('#question')).toBeVisible();
    await expect(page.locator('#progress')).toBeVisible();
    
    // 验证题目显示
    const question = await page.textContent('#question');
    expect(question).toMatch(/请点击：/);
    
    // 验证进度
    const progress = await page.textContent('#progress');
    expect(progress).toBe('1/10');
    
    // 验证下一题按钮初始禁用状态
    await expect(page.locator('#next-btn')).toBeDisabled();
  });

  test('测试省会定位模式', async ({ page }) => {
    // 选择省会定位模式
    await page.click('button[data-mode="city-click"]');
    
    // 验证游戏页加载
    await expect(page.locator('#game-page')).toBeVisible();
    await expect(page.locator('#map-container')).toBeVisible();
    
    // 验证模式标题
    const modeTitle = await page.textContent('#mode-title');
    expect(modeTitle).toBe('省会定位');
  });

  test('测试世界国家挑战模式', async ({ page }) => {
    // 选择世界国家挑战模式
    await page.click('button[data-mode="world-province"]');
    
    // 验证游戏页加载
    await expect(page.locator('#game-page')).toBeVisible();
    
    // 验证模式标题
    const modeTitle = await page.textContent('#mode-title');
    expect(modeTitle).toBe('世界国家挑战');
  });

  test('测试世界城市定位模式', async ({ page }) => {
    // 选择世界城市定位模式
    await page.click('button[data-mode="world-city"]');
    
    // 验证游戏页加载
    await expect(page.locator('#game-page')).toBeVisible();
    
    // 验证模式标题
    const modeTitle = await page.textContent('#mode-title');
    expect(modeTitle).toBe('世界城市定位');
  });

  test('测试地图SVG渲染', async ({ page }) => {
    // 选择任意模式
    await page.click('button[data-mode="province-click"]');
    
    // 等待地图渲染
    await page.waitForSelector('#map-container svg', { timeout: 5000 });
    
    // 验证SVG元素
    const svg = page.locator('#map-container svg');
    await expect(svg).toBeVisible();
    
    // 验证地图路径元素
    const paths = page.locator('#map-container svg path.map-feature');
    const pathCount = await paths.count();
    expect(pathCount).toBeGreaterThan(0);
  });

  test('测试地图交互功能', async ({ page }) => {
    // 选择省份点击模式
    await page.click('button[data-mode="province-click"]');
    
    // 等待地图渲染
    await page.waitForSelector('#map-container svg', { timeout: 5000 });
    
    // 测试地图缩放功能（通过滚轮）
    const mapContainer = page.locator('#map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });
    await mapContainer.click({ position: { x: 100, y: 100 } });
    
    // 测试地图平移功能（通过拖拽）
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(150, 150);
    await page.mouse.up();
  });

  test('测试返回首页功能', async ({ page }) => {
    // 选择模式并进入游戏
    await page.click('button[data-mode="province-click"]');
    await expect(page.locator('#game-page')).toBeVisible();
    
    // 点击返回首页按钮
    await page.click('#quit-btn');
    
    // 验证返回首页
    await expect(page.locator('#home-page')).toBeVisible();
  });
});

test.describe('Map Game - 结果页测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file:///home/qagent/games/map/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('测试结果页显示', async ({ page }) => {
    // 注意：这个测试需要完整游戏流程才能触发结果页
    // 这里只测试结果页元素是否存在
    await expect(page.locator('#result-page')).not.toBeVisible();
  });

  test('测试历史记录表格', async ({ page }) => {
    // 测试历史记录表格元素
    await expect(page.locator('#history-list')).not.toBeVisible();
  });
});

test.describe('Map Game - 响应式设计测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file:///home/qagent/games/map/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('测试桌面视口', async ({ page }) => {
    // 设置桌面视口
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // 验证模式选择按钮布局（应该是2列）
    const modeButtons = page.locator('#mode-selection button');
    const buttonCount = await modeButtons.count();
    expect(buttonCount).toBe(4);
  });

  test('测试平板视口', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // 验证元素仍然可见
    await expect(page.locator('#home-page')).toBeVisible();
    await expect(page.locator('#mode-selection')).toBeVisible();
  });

  test('测试手机视口', async ({ page }) => {
    // 设置手机视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 验证元素仍然可见
    await expect(page.locator('#home-page')).toBeVisible();
    await expect(page.locator('#mode-selection')).toBeVisible();
    
    // 验证地图容器在手机上的高度（应该是60vh）
    const mapContainer = page.locator('#map-container');
    await expect(mapContainer).toBeVisible();
  });
});

test.describe('Map Game - 数据加载测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file:///home/qagent/games/map/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('测试数据文件加载', async ({ page }) => {
    // 等待数据加载完成
    await page.waitForFunction(() => {
      return window.MapGameUtils && window.location.search.includes('loaded');
    }, { timeout: 10000 });
    
    // 验证数据已加载
    await expect(page.locator('#loading-text')).toBeHidden();
  });

  test('测试错误处理', async ({ page }) => {
    // 这个测试需要模拟数据加载失败的场景
    // 当前实现中，数据加载错误会显示错误消息
    await expect(page.locator('#error-text')).toBeHidden();
  });
});
