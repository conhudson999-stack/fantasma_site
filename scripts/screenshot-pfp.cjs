const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });
  const fileUrl = 'file:///' + path.resolve('social/profile-pic.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const el = await page.$('.slide');
  const clip = await el.boundingBox();
  await page.screenshot({
    path: 'posts/profile-pic.png',
    clip: { x: clip.x, y: clip.y, width: 1080, height: 1080 },
    omitBackground: true,
  });
  console.log('Saved posts/profile-pic.png');
  await browser.close();
})();
