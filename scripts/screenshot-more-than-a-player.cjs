const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  const filePath = path.resolve(__dirname, '..', 'social', 'post-more-than-a-player.html').replace(/\\/g, '/');
  await page.goto('file:///' + filePath, { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));
  const slides = await page.$$('.slide');
  const clip = await slides[0].boundingBox();
  await page.screenshot({
    path: path.join(__dirname, '..', 'posts', 'more-than-a-player.png'),
    clip: { x: clip.x, y: clip.y, width: 1080, height: 1350 },
  });
  console.log('Done: posts/more-than-a-player.png');
  await browser.close();
})();
