// codex: 2026-09-24 补充截图：迎春杯题库、地图大作战（新增 PPT 页面素材）
const path = require('path');
const pwPath = 'E:/users/kpan/BaiduSyncdisk/program/aigc/book/inkos/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright';
const { chromium } = require(pwPath);

const ROOT = 'E:/users/kpan/BaiduSyncdisk/program/aigc/fungame';
const OUT = path.join(ROOT, 'ppt_materials', 'screenshots');
const CHROME = 'C:/Users/qixin/AppData/Local/ms-playwright/chromium-1155/chrome-win/chrome.exe';

const pages = [
  { name: 'yingchun', file: 'apps/yingchun/index.html?db=y2' }, // 迎春杯题库
  { name: 'mapgame',  file: 'map-game/index.html' },            // 地图大作战
];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  for (const p of pages) {
    try {
      await page.goto('file:///' + ROOT.replace(/\\/g, '/') + '/' + p.file, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(OUT, p.name + '.png') });
      console.log('OK  ' + p.name);
    } catch (e) { console.log('FAIL ' + p.name + ' : ' + e.message.split('\n')[0]); }
  }
  await browser.close();
  console.log('DONE');
})();
