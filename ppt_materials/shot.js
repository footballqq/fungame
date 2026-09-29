// codex: 2026-09-24 批量打开本地学习游戏页面并截图，供 PPT 素材使用
const path = require('path');
// 复用 inkos 项目里已安装的 playwright（pnpm 结构下的真实包路径）
const pwPath = 'E:/users/kpan/BaiduSyncdisk/program/aigc/book/inkos/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright';
const { chromium } = require(pwPath);

const ROOT = 'E:/users/kpan/BaiduSyncdisk/program/aigc/fungame';
const OUT = path.join(ROOT, 'ppt_materials', 'screenshots');

// 需要截图的页面：name -> 相对路径
const pages = [
  { name: 'home', file: 'index.html' },                       // 游戏集主页
  { name: 'pie', file: 'pie.html' },                          // 微积分披萨（割圆术）
  { name: 'calclus', file: 'math/calclus/index.html' },       // 微积分探秘之旅
  { name: 'tongyu', file: 'math/tongyu/index.html' },         // 同余小学习
  { name: 'factor', file: 'math/factor/dist/index.html' },    // 因式分解探险
  { name: 'chilun', file: 'chilun.html' },                    // 烧脑齿轮谜题
  { name: 'train', file: 'train.html' },                      // 机车排队（排序）
  { name: 'jumpfrog', file: 'boardgame/jumpfrog/index.html' },// 青蛙跳跃（荷塘换位）
  { name: 'comb', file: 'comb/dist/index.html' },             // n球放m盒（组合计数）
  { name: 'triangleremove', file: 'boardgame/triangleremove/index.html' }, // 星芒阵封印
  { name: 'stones', file: 'stones/index.html' },              // 奇偶棋子谜题
  { name: 'cookcake', file: 'cookcake.html' },                // 烘焙蛋糕（比例）
  { name: 'words', file: 'words.html' },                      // 单词拼写
  { name: 'horse', file: 'horse/index.html' },                // 小马回家（骑士行棋）
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/qixin/AppData/Local/ms-playwright/chromium-1155/chrome-win/chrome.exe',
  });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  for (const p of pages) {
    const url = 'file:///' + ROOT.replace(/\\/g, '/') + '/' + p.file;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1800); // 等待动画/字体/图片就绪
      await page.screenshot({ path: path.join(OUT, p.name + '.png') });
      console.log('OK  ' + p.name);
    } catch (e) {
      console.log('FAIL ' + p.name + ' : ' + e.message.split('\n')[0]);
    }
  }

  await browser.close();
  console.log('DONE');
})();
