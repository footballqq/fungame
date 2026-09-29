// codex: 2026-09-24 第二轮交互式截图：调整参数后重新截图，让画面更有教学表现力
const path = require('path');
const pwPath = 'E:/users/kpan/BaiduSyncdisk/program/aigc/book/inkos/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright';
const { chromium } = require(pwPath);

const ROOT = 'E:/users/kpan/BaiduSyncdisk/program/aigc/fungame';
const OUT = path.join(ROOT, 'ppt_materials', 'screenshots');
const CHROME = 'C:/Users/qixin/AppData/Local/ms-playwright/chromium-1155/chrome-win/chrome.exe';

async function setRange(page, idx, value) {
  await page.evaluate(({ idx, value }) => {
    const rs = document.querySelectorAll('input[type=range]');
    const el = rs[idx];
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { idx, value });
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);

  // 1) 微积分披萨：把切片调到 100，体现"越切越接近圆"
  try {
    await page.goto('file:///' + ROOT + '/pie.html', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await setRange(page, 0, 100);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'pie100.png') });
    console.log('OK  pie100');
  } catch (e) { console.log('FAIL pie100 : ' + e.message.split('\n')[0]); }

  // 2) 同余课件：点两次"继续探索"进入有内容的页面
  try {
    await page.goto('file:///' + ROOT + '/math/tongyu/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const btn = await page.getByText('继续探索', { exact: false }).first();
    await btn.click();
    await page.waitForTimeout(1500);
    try { await page.getByText('继续探索', { exact: false }).first().click({ timeout: 3000 }); } catch (e) {}
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, 'tongyu2.png') });
    console.log('OK  tongyu2');
  } catch (e) { console.log('FAIL tongyu2 : ' + e.message.split('\n')[0]); }

  // 3) 微积分探秘：多等 8 秒看能否加载完成
  try {
    await page.goto('file:///' + ROOT + '/math/calclus/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(OUT, 'calclus2.png') });
    console.log('OK  calclus2');
  } catch (e) { console.log('FAIL calclus2 : ' + e.message.split('\n')[0]); }

  // 4) 球盒模型：把球数调到 4、盒数调到 3，触发可视化渲染
  try {
    await page.goto('file:///' + ROOT + '/comb/dist/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await setRange(page, 0, 4);
    await setRange(page, 1, 3);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, 'comb2.png') });
    console.log('OK  comb2');
  } catch (e) { console.log('FAIL comb2 : ' + e.message.split('\n')[0]); }

  // 5) 因式分解探险：多等 8 秒
  try {
    await page.goto('file:///' + ROOT + '/math/factor/dist/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(OUT, 'factor2.png') });
    console.log('OK  factor2');
  } catch (e) { console.log('FAIL factor2 : ' + e.message.split('\n')[0]); }

  await browser.close();
  console.log('DONE');
})();
