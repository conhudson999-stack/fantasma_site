const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1700, height: 3000 });

  const fileUrl = 'file:///' + path.resolve('social/profile-banner.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const banners = await page.$$('.banner');

  // X / Twitter banner — 1500x500
  const clip1 = await banners[0].boundingBox();
  await page.screenshot({
    path: 'posts/banner-x.png',
    clip: { x: clip1.x, y: clip1.y, width: 1500, height: 500 },
  });
  console.log('Saved posts/banner-x.png (1500x500)');

  // Facebook banner — 820x312
  const clip2 = await banners[1].boundingBox();
  await page.screenshot({
    path: 'posts/banner-facebook.png',
    clip: { x: clip2.x, y: clip2.y, width: 820, height: 312 },
  });
  console.log('Saved posts/banner-facebook.png (820x312)');

  await browser.close();
})();
