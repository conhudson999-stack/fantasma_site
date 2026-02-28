/**
 * publish-post.cjs — Screenshot an HTML post and publish to Instagram / Facebook
 *
 * Usage:
 *   node publish-post.cjs --caption "Your caption here"
 *   node publish-post.cjs --caption "Caption" --dry-run
 *   node publish-post.cjs --caption "Caption" --html custom.html
 *   node publish-post.cjs --caption "Caption" --email
 *   node publish-post.cjs --caption "Caption" --preview   (sends SMS preview for approval)
 *   node publish-post.cjs --caption "Caption" --facebook   (post to Facebook Page)
 *   node publish-post.cjs --caption "Caption" --facebook --instagram  (post to both)
 *
 * Required .env.local variables:
 *   IMGBB_API_KEY            — Free API key from api.imgbb.com
 *
 * Instagram variables:
 *   INSTAGRAM_ACCESS_TOKEN  — Long-lived token from Meta Developer Portal
 *   INSTAGRAM_USER_ID       — IG Business account user ID
 *
 * Facebook variables:
 *   FACEBOOK_PAGE_ACCESS_TOKEN — Page Access Token with pages_manage_posts permission
 *   FACEBOOK_PAGE_ID           — Facebook Page ID
 *
 * Optional .env.local variables (for --email flag):
 *   GMAIL_USER
 *   GMAIL_APP_PASSWORD
 *
 * Setup:
 *   1. Instagram token: developers.facebook.com → Create App → Add Instagram Graph API
 *      → Generate long-lived token (60-day expiry, refresh before it expires)
 *   2. Instagram user ID: GET /me?fields=id&access_token={token}
 *   3. ImgBB API key: api.imgbb.com → Sign up → Copy API key (free, instant)
 *   4. Facebook Page token: Graph API Explorer → select app → add pages_manage_posts
 *      → generate token → GET /me/accounts to get Page Access Token + Page ID
 */

const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// ── Parse CLI args ──────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    caption: '',
    html: 'social/post-draft.html',
    dryRun: false,
    email: false,
    preview: false,
    facebook: false,
    instagram: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--caption':
        opts.caption = args[++i] || '';
        break;
      case '--html':
        opts.html = args[++i] || opts.html;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--email':
        opts.email = true;
        break;
      case '--preview':
        opts.preview = true;
        break;
      case '--facebook':
        opts.facebook = true;
        break;
      case '--instagram':
        opts.instagram = true;
        break;
    }
  }

  // Default: if neither --facebook nor --instagram specified, post to Instagram only (backwards-compatible)
  if (!opts.facebook && !opts.instagram) {
    opts.instagram = true;
  }

  return opts;
}

// ── Screenshot ──────────────────────────────────────────────────────────────
async function screenshotPost(htmlFile) {
  console.log(`Screenshotting ${htmlFile}...`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Use a tall viewport so all slides are laid out vertically
  await page.setViewport({ width: 1080, height: 10000 });

  const fileUrl = 'file:///' + path.resolve(htmlFile).replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });

  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const slides = await page.$$('.slide');
  if (!slides.length) {
    await browser.close();
    throw new Error('No .slide elements found in ' + htmlFile);
  }

  const paths = [];
  for (let i = 0; i < slides.length; i++) {
    const clip = await slides[i].boundingBox();
    const outPath = path.join(__dirname, '..', 'posts', `post-screenshot-${i + 1}.png`);
    await page.screenshot({
      path: outPath,
      clip: { x: clip.x, y: clip.y, width: 1080, height: 1080 },
    });
    paths.push(outPath);
    console.log(`  Slide ${i + 1} → post-screenshot-${i + 1}.png`);
  }

  await browser.close();
  console.log(`Screenshotted ${paths.length} slide(s).`);
  return paths;
}

// ── ImgBB upload ─────────────────────────────────────────────────────────────
function uploadToImgBB(imagePath) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error('IMGBB_API_KEY not set in .env.local');

  const imageData = fs.readFileSync(imagePath).toString('base64');

  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="key"\r\n\r\n${apiKey}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image"\r\n\r\n${imageData}\r\n` +
      `--${boundary}--\r\n`;

    const req = https.request(
      {
        hostname: 'api.imgbb.com',
        path: '/1/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.success) {
              resolve(json.data.url);
            } else {
              reject(new Error('ImgBB upload failed: ' + (json.error?.message || data)));
            }
          } catch (e) {
            reject(new Error('Failed to parse ImgBB response: ' + data));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Instagram Graph API ─────────────────────────────────────────────────────
function graphRequest(endpoint, params) {
  const query = new URLSearchParams(params).toString();
  const url = `https://graph.instagram.com/v21.0${endpoint}?${query}`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST' }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            reject(new Error(`Instagram API error: ${data.error.message}`));
          } else {
            resolve(data);
          }
        } catch (e) {
          reject(new Error('Failed to parse Instagram response: ' + body));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function postToInstagram(imageUrls, caption) {
  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!userId) throw new Error('INSTAGRAM_USER_ID not set in .env.local');
  if (!token) throw new Error('INSTAGRAM_ACCESS_TOKEN not set in .env.local');

  // Single image — original flow
  if (imageUrls.length === 1) {
    console.log('Creating Instagram media container...');
    const container = await graphRequest(`/${userId}/media`, {
      image_url: imageUrls[0],
      caption: caption,
      access_token: token,
    });
    console.log(`Media container created: ${container.id}`);
    console.log('Waiting for media processing...');
    await new Promise(r => setTimeout(r, 5000));
    console.log('Publishing to Instagram...');
    const result = await graphRequest(`/${userId}/media_publish`, {
      creation_id: container.id,
      access_token: token,
    });
    console.log(`Published! Post ID: ${result.id}`);
    return result.id;
  }

  // Multiple images — carousel flow
  console.log(`Creating carousel with ${imageUrls.length} images...`);

  // Step 1: Create individual image containers
  const childIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    console.log(`  Creating container for slide ${i + 1}...`);
    const child = await graphRequest(`/${userId}/media`, {
      image_url: imageUrls[i],
      is_carousel_item: 'true',
      access_token: token,
    });
    childIds.push(child.id);
    console.log(`  Container ${i + 1}: ${child.id}`);
  }

  // Step 2: Wait for all images to process
  console.log('Waiting for media processing...');
  await new Promise(r => setTimeout(r, 8000));

  // Step 3: Create carousel container
  console.log('Creating carousel container...');
  const carousel = await graphRequest(`/${userId}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption: caption,
    access_token: token,
  });
  console.log(`Carousel container: ${carousel.id}`);

  // Step 4: Wait, then publish
  console.log('Waiting for carousel processing...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('Publishing carousel to Instagram...');
  const result = await graphRequest(`/${userId}/media_publish`, {
    creation_id: carousel.id,
    access_token: token,
  });

  console.log(`Published carousel! Post ID: ${result.id}`);
  return result.id;
}

// ── Facebook Graph API ──────────────────────────────────────────────────────
function fbGraphRequest(endpoint, params, method = 'POST') {
  const query = new URLSearchParams(params).toString();
  const url = `https://graph.facebook.com/v21.0${endpoint}?${query}`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            reject(new Error(`Facebook API error: ${data.error.message}`));
          } else {
            resolve(data);
          }
        } catch (e) {
          reject(new Error('Failed to parse Facebook response: ' + body));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function postToFacebook(imageUrl, caption) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId) throw new Error('FACEBOOK_PAGE_ID not set in .env.local');
  if (!token) throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN not set in .env.local');

  console.log('Posting photo to Facebook Page...');
  const result = await fbGraphRequest(`/${pageId}/photos`, {
    url: imageUrl,
    message: caption || '',
    access_token: token,
  });

  console.log(`Published to Facebook! Post ID: ${result.post_id || result.id}`);
  return result.post_id || result.id;
}

// ── Email (optional) ────────────────────────────────────────────────────────
async function emailPost(imagePath, caption) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.log('Skipping email — GMAIL_USER or GMAIL_APP_PASSWORD not set');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: user,
    to: user,
    subject: 'Fantasma Football - Instagram Post',
    text: caption || 'New Instagram post attached.',
    attachments: [{ filename: 'fantasma-post.png', path: imagePath }],
  });

  console.log('Email sent to ' + user);
}

// ── SMS preview ─────────────────────────────────────────────────────────────
const SMS_GATEWAY = '4127372858@vtext.com';

async function sendPreviewSMS(imageUrl, caption) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER/GMAIL_APP_PASSWORD needed for SMS');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  // Keep it short — SMS gateway truncates long messages
  const shortCaption = caption && caption.length > 100
    ? caption.substring(0, 100) + '...'
    : caption;
  const message = `${imageUrl}\n\n${shortCaption || '(no caption)'}`;

  await transporter.sendMail({
    from: user,
    to: SMS_GATEWAY,
    subject: '',
    text: message,
  });

  console.log('Preview SMS sent to your phone.');
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  const opts = parseArgs();

  if (!opts.caption && !opts.dryRun && !opts.preview) {
    console.error('Error: --caption is required (or use --dry-run / --preview)');
    process.exit(1);
  }

  try {
    // 1. Screenshot all slides
    const imagePaths = await screenshotPost(opts.html);

    if (opts.dryRun) {
      console.log(`\n--dry-run: ${imagePaths.length} screenshot(s) saved. Skipping upload and post.`);
      if (opts.email) await emailPost(imagePaths[0], opts.caption);
      return;
    }

    // 2. Upload all images to ImgBB
    console.log(`\nUploading ${imagePaths.length} image(s) to ImgBB...`);
    const imageUrls = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const url = await uploadToImgBB(imagePaths[i]);
      imageUrls.push(url);
      console.log(`  Slide ${i + 1}: ${url}`);
    }

    // 3. Preview mode — send SMS with first image and stop
    if (opts.preview) {
      await sendPreviewSMS(imageUrls[0], opts.caption);
      console.log('\nPreview sent! Approve it, then run again without --preview to publish.');
      return;
    }

    // 4. Post to platform(s)
    console.log('');
    if (opts.instagram) {
      await postToInstagram(imageUrls, opts.caption);
    }
    if (opts.facebook) {
      await postToFacebook(imageUrls[0], opts.caption);
    }

    // 5. Optional email
    if (opts.email) await emailPost(imagePaths[0], opts.caption);

    const slideCount = imagePaths.length > 1 ? ` (${imagePaths.length}-slide carousel)` : '';
    const platforms = [opts.instagram && 'Instagram', opts.facebook && 'Facebook'].filter(Boolean).join(' + ');
    console.log(`\nDone! Post is live on ${platforms}${slideCount}.`);
  } catch (err) {
    console.error('\nError:', err.message);
    process.exit(1);
  }
})();
