const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Load env
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const DESKTOP = path.join(require('os').homedir(), 'OneDrive', 'Desktop');

async function screenshotPosts() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  const filePath = 'file:///' + path.resolve('social/instagram-posts.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2' });

  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const slides = await page.$$('.slide');
  const savedFiles = [];

  for (let i = 0; i < slides.length; i++) {
    const clip = await slides[i].boundingBox();
    const filePath = path.join(DESKTOP, `fantasma-post-${i + 1}.png`);
    await page.screenshot({
      path: filePath,
      clip: { x: clip.x, y: clip.y, width: 1080, height: 1080 }
    });
    savedFiles.push(filePath);
    console.log(`Saved fantasma-post-${i + 1}.png`);
  }

  await browser.close();
  return savedFiles;
}

async function emailPosts(files) {
  console.log('\nSending email...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });

  const attachments = files.map((f, i) => ({
    filename: `fantasma-post-${i + 1}.png`,
    path: f
  }));

  await transporter.sendMail({
    from: GMAIL_USER,
    to: GMAIL_USER,
    subject: 'Fantasma Football - Instagram Posts',
    text: `Here are your ${files.length} Instagram posts. Save them to your phone and post away.`,
    attachments
  });

  console.log('Email sent to ' + GMAIL_USER);
}

(async () => {
  try {
    const files = await screenshotPosts();
    await emailPosts(files);
    console.log('\nDone! Check your email.');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
