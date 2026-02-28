const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  const filePath = 'file:///' + path.resolve('social/instagram-posts.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2' });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const slides = await page.$$('.slide');
  const desktop = path.join(require('os').homedir(), 'OneDrive', 'Desktop');

  for (let i = 0; i < slides.length; i++) {
    const clip = await slides[i].boundingBox();
    await page.screenshot({
      path: path.join(desktop, `fantasma-post-${i + 1}.png`),
      clip: {
        x: clip.x,
        y: clip.y,
        width: 1080,
        height: 1080
      }
    });
    console.log(`Saved fantasma-post-${i + 1}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${slides.length} images saved to Desktop.`);
})();
