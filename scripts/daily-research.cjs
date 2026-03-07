/**
 * daily-research.cjs — Daily research, post generation, and email pipeline
 *
 * Runs in GitHub Actions at 6:30 AM ET daily.
 * 1. Researches Pittsburgh soccer training market via Gemini AI
 * 2. Generates an Interference-style Instagram post
 * 3. Screenshots it with Puppeteer, uploads to ImgBB
 * 4. Builds a daily plan JSON
 * 5. Emails a mobile-friendly report with APPROVE buttons
 */

const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Load .env.local for local testing (GitHub Actions uses env vars directly)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// ── Config ───────────────────────────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const APPROVE_SECRET = process.env.APPROVE_SECRET;
const SITE_URL = process.env.SITE_URL || 'https://fantasma-site.vercel.app';

const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const DAY_OF_WEEK = new Date().getDay(); // 0=Sun, 1=Mon, ...

const PLANS_DIR = path.join(__dirname, '..', 'docs', 'daily-plans');
const TEMPLATE_PATH = path.join(__dirname, '..', 'social', 'daily-template.html');

// ── Day-of-week focus topics ─────────────────────────────────────────────────
const DAILY_FOCUS = [
  'Week-ahead planning: content calendar preview and strategy for the coming week',          // Sun
  'Marketing angles: what messaging and positioning would resonate with Pittsburgh parents',  // Mon
  'SEO keywords: search ranking opportunities for Pittsburgh soccer training',                // Tue
  'Content strategy: what type of soccer Instagram content is performing best right now',     // Wed
  'Local soccer news: club announcements, tryout dates, tournaments in Pittsburgh area',      // Thu
  'Community engagement: Facebook groups, local events, partnership opportunities',           // Fri
  'Weekly performance summary: what worked this week, engagement analysis, key takeaways',   // Sat
];

// ── Post types and creative angles ──────────────────────────────────────────
const POST_TYPES = ['stat-highlight', 'training-tip', 'quote', 'local-callout', 'data-blocks', 'cta'];

const CREATIVE_ANGLES = [
  {
    name: 'bold',
    direction: `ANGLE: Bold & confrontational. Challenge the viewer. Make them feel like they're falling behind if they're not training. Use urgency, edge, and a little bit of attitude. Think Nike poster, not Hallmark card.`,
  },
  {
    name: 'data',
    direction: `ANGLE: Data-driven & informative. Lead with a specific, compelling stat or insight that makes parents think "my kid needs this." Be the smartest voice in the room. Back up claims with numbers that feel earned and real.`,
  },
  {
    name: 'community',
    direction: `ANGLE: Pittsburgh pride & community hype. Make it feel local — reference neighborhoods, steel city grit, the youth soccer scene. This isn't a national brand, it's YOUR city's trainer. Warm but never soft.`,
  },
];

// ── OpenAI Chat Completions API (for post generation, site changes) ─────────
function callAI(prompt, temperature = 0.7) {
  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: 4096,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content);
          } else {
            reject(new Error('OpenAI returned no choices: ' + data.substring(0, 500)));
          }
        } catch (e) {
          reject(new Error('Failed to parse OpenAI response: ' + data.substring(0, 500)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Research phase ───────────────────────────────────────────────────────────
async function runResearch() {
  console.log(`\n=== DAILY RESEARCH: ${TODAY} ===`);
  console.log(`Day focus: ${DAILY_FOCUS[DAY_OF_WEEK]}\n`);

  // Load yesterday's plan for context (if exists)
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const yesterdayPath = path.join(PLANS_DIR, `${yesterday}.json`);
  let yesterdayContext = '';
  if (fs.existsSync(yesterdayPath)) {
    const yPlan = JSON.parse(fs.readFileSync(yesterdayPath, 'utf-8'));
    yesterdayContext = `\nYesterday's research focused on: ${yPlan.research?.focus || 'general'}\nYesterday's post type was: ${yPlan.social?.type || 'unknown'}\n`;
  }

  const researchPrompt = `You are a market research analyst for Fantasma Football, a private soccer training business in Pittsburgh, PA.

Today is ${TODAY} (${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][DAY_OF_WEEK]}).

TODAY'S FOCUS: ${DAILY_FOCUS[DAY_OF_WEEK]}
${yesterdayContext}

ABOUT FANTASMA FOOTBALL:
- Private 1-on-1 soccer training in Pittsburgh, PA
- Target: youth players ages 8-18, parents who want their kids to improve
- Brand: premium, elite, mysterious ("phantom" theme)
- Differentiators: personalized attention, flexible scheduling, results-focused

TASK: Research and analyze the Pittsburgh soccer training market. Provide:

1. CONTENT OPPORTUNITIES (what type of content would resonate right now)
2. SEO KEYWORDS (3-5 high-opportunity search terms for this week)
3. RECOMMENDED ACTION (one specific thing Fantasma should do today for maximum impact)

Respond in JSON format:
{
  "focus": "brief description of today's focus",
  "content_opportunities": ["opportunity 1", "opportunity 2"],
  "keywords": [
    { "term": "...", "opportunity": "high/medium/low" }
  ],
  "recommended_action": "specific recommendation",
  "reasoning": "why this matters for Fantasma"
}

Return ONLY valid JSON, no markdown fences.`;

  console.log('Running research analysis...');
  const researchRaw = await callAI(researchPrompt, 0.5);
  let research;
  try {
    research = JSON.parse(researchRaw.trim());
  } catch {
    // Try extracting JSON from markdown
    const match = researchRaw.match(/\{[\s\S]*\}/);
    if (match) {
      research = JSON.parse(match[0]);
    } else {
      throw new Error('Could not parse research JSON from Gemini');
    }
  }
  console.log('Research complete.');
  return research;
}

// ── Post generation phase ────────────────────────────────────────────────────
function pickPostTypes() {
  // Pick 3 different post types, shuffled by day to avoid repetition
  const shuffled = [...POST_TYPES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

const TYPE_SCHEMAS = {
  'stat-highlight': {
    fields: `"label": "top label text (ALL CAPS)",
    "stat": "the number (e.g. 87%, 3x, 12+)",
    "headline": "headline (ALL CAPS, up to 5 words)",
    "body": "one sentence of context"`,
    example: `"content": {
      "label": "STEEL CITY STANDARDS",
      "stat": "92%",
      "headline": "PLAYERS WHO COME BACK",
      "body": "Nine out of ten athletes return after their first session. That's not marketing — that's the work speaking."
    }`,
  },
  'training-tip': {
    fields: `"number": "DRILL // 001",
    "headline": "DRILL NAME (ALL CAPS)",
    "steps": ["step 1", "step 2", "step 3"]`,
    example: `"content": {
      "number": "DRILL // 007",
      "headline": "THE GHOST TOUCH",
      "steps": ["Receive the ball on the half-turn — no square-on touches.", "First touch goes forward, into space you've already scanned.", "Accelerate into the pocket before the defender resets."]
    }`,
  },
  'quote': {
    fields: `"text": "THE QUOTE TEXT (ALL CAPS)",
    "attribution": "— SOURCE NAME"`,
    example: `"content": {
      "text": "THE BALL DOESN'T CARE ABOUT YOUR EXCUSES",
      "attribution": "— FANTASMA TRAINING STAFF"
    }`,
  },
  'local-callout': {
    fields: `"badge": "PITTSBURGH",
    "headline": "HEADLINE (ALL CAPS, up to 5 words)",
    "body": "one sentence of context"`,
    example: `"content": {
      "badge": "PITTSBURGH",
      "headline": "SOUTH HILLS KIDS ARE DIFFERENT",
      "body": "We've trained players from every corner of this city. The ones who show up hungry leave dangerous."
    }`,
  },
  'data-blocks': {
    fields: `"label": "SECTION LABEL (ALL CAPS)",
    "headline": "TOPIC (ALL CAPS, up to 5 words)",
    "blocks": [
      { "value": "12+", "label": "SHORT LABEL" },
      { "value": "$60", "label": "SHORT LABEL" },
      { "value": "1:1", "label": "SHORT LABEL" },
      { "value": "87%", "label": "SHORT LABEL" }
    ]`,
    example: `"content": {
      "label": "THE FANTASMA DIFFERENCE",
      "headline": "NUMBERS DON'T LIE",
      "blocks": [
        { "value": "200+", "label": "PLAYERS TRAINED" },
        { "value": "1:1", "label": "PERSONAL ATTENTION" },
        { "value": "92%", "label": "RETURN RATE" },
        { "value": "4.9", "label": "PARENT RATING" }
      ]
    }`,
  },
  'cta': {
    fields: `"label": "urgency phrase (ALL CAPS)",
    "headline": "HEADLINE (ALL CAPS, up to 5 words)",
    "body": "one sentence",
    "button": "BUTTON TEXT (ALL CAPS)"`,
    example: `"content": {
      "label": "SPRING SPOTS ARE FILLING",
      "headline": "TRAIN LIKE A PHANTOM",
      "body": "Your first session is where everything changes. Don't wait until tryouts to find out you're behind.",
      "button": "BOOK YOUR SESSION"
    }`,
  },
};

function buildPostPrompt(research, postType, angle) {
  const schema = TYPE_SCHEMAS[postType];

  return `You are the creative director for Fantasma Football — a premium private soccer training brand in Pittsburgh, PA.

Write like a coach who's seen everything. No corporate speak. No generic motivational fluff. Every word should hit.

BRAND IDENTITY:
- Brand pillars: PASSION (unconditional love for the game), TACTICAL INTELLIGENCE (smart players solve problems), DESIRE (outwork everyone, refuse to settle)
- Brand voice: Bold. Editorial. Confident. Aspirational. Athletic. Poetic. "Fear the Phantom. Train Fantasma."
- Colors: Dark Navy #040C14, Vegas Gold #C5B358, Light Cream #F8F7F4, Rich Black #0A0A0A
- Fonts: Bebas Neue (headlines — big, loud, unapologetic), Outfit (body — clean, modern)
- Design: Corner bracket marks, gold accent bars, scanline texture, film grain, radial glow
- Watermark: @FANTASMAFOOTBALL

${angle.direction}

TODAY'S RESEARCH:
${JSON.stringify(research, null, 2)}

YOUR TASK: Generate a single ${postType} Instagram post.

The "content" object must contain EXACTLY these fields (no more, no less):
{
  ${schema.fields}
}

EXAMPLE of a good response:
{
  "type": "${postType}",
  ${schema.example},
  "caption": "Your excuses don't train. You do. Book a session.",
  "hashtags": ["#PittsburghSoccer", "#SoccerTraining", "#TrainFantasma", "#YouthSoccer", "#FearThePhantom"]
}

Now generate YOUR version. Respond in this exact JSON structure:
{
  "type": "${postType}",
  "content": { ... },
  "caption": "Instagram caption — 2-3 punchy sentences. Under 200 chars before hashtags.",
  "hashtags": ["#PittsburghSoccer", "#SoccerTraining", "...5-8 relevant tags"]
}

RULES:
- The "content" object must ONLY have the fields listed above. Do NOT include fields from other post types.
- Headlines ALL CAPS, up to 5 words — make them punch
- Body text should feel real, not templated
- Caption should sound like a human wrote it, not an AI
- Stats should feel specific and earned, not pulled from nowhere
- Pittsburgh references welcome — neighborhoods, steel city culture, local soccer scene

Return ONLY valid JSON, no markdown fences.`;
}

async function generatePosts(research) {
  const types = pickPostTypes();
  const posts = [];

  for (let i = 0; i < 3; i++) {
    const postType = types[i];
    const angle = CREATIVE_ANGLES[i];
    const prompt = buildPostPrompt(research, postType, angle);

    console.log(`Generating option ${i + 1}: ${postType} (${angle.name})...`);
    const postRaw = await callAI(prompt, 0.9);
    let post;
    try {
      post = JSON.parse(postRaw.trim());
    } catch {
      const match = postRaw.match(/\{[\s\S]*\}/);
      if (match) {
        post = JSON.parse(match[0]);
      } else {
        throw new Error(`Could not parse post JSON for option ${i + 1}`);
      }
    }
    // Normalize: if AI nested content under the type key, flatten it
    if (post.content && post.content[post.type] && typeof post.content[post.type] === 'object') {
      post.content = post.content[post.type];
    }
    console.log(`  Option ${i + 1} generated: ${post.type}`);
    posts.push(post);
  }

  return posts;
}

// ── Visual themes (one per option) ───────────────────────────────────────────
const VISUAL_THEMES = ['theme-dark', 'theme-cream', 'theme-bold'];

const LAYOUT_SLUG = {
  'stat-highlight': 'stat',
  'training-tip': 'tip',
  'quote': 'quote',
  'local-callout': 'callout',
  'data-blocks': 'data',
  'cta': 'cta',
};

// ── Write post HTML to template ──────────────────────────────────────────────
function writePostHTML(post, theme = 'theme-dark') {
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Normalize content: if AI nested fields under the type key, extract them
  let c = post.content;
  if (c && c[post.type] && typeof c[post.type] === 'object') {
    c = c[post.type];
  }

  const layout = LAYOUT_SLUG[post.type] || 'stat';
  let contentHTML;

  switch (post.type) {
    case 'stat-highlight':
      contentHTML = `
    <div class="label">${esc(c.label || 'DID YOU KNOW')}</div>
    <div class="stat-number">${esc(c.stat || '87%')}</div>
    <div class="headline headline-md">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="body-text">${esc(c.body || '')}</div>`;
      break;

    case 'training-tip': {
      const stepsHtml = (c.steps || []).map(s =>
        `<div class="tip-step"><div class="step-marker"></div><div class="step-text">${esc(s)}</div></div>`
      ).join('\n      ');
      contentHTML = `
    <div class="tip-number">${esc(c.number || 'DRILL // 001')}</div>
    <div class="headline headline-lg">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="tip-steps">${stepsHtml}</div>`;
      break;
    }

    case 'quote':
      contentHTML = `
    <div class="quote-marks">&ldquo;</div>
    <div class="quote-text">${esc(c.text || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="quote-attr">${esc(c.attribution || '— FANTASMA FOOTBALL')}</div>`;
      break;

    case 'local-callout':
      contentHTML = `
    <div class="callout-badge">
      <div class="callout-badge-dot"></div>
      <div class="callout-badge-text">${esc(c.badge || 'PITTSBURGH')}</div>
    </div>
    <div class="headline headline-xl">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="body-text">${esc(c.body || '')}</div>`;
      break;

    case 'data-blocks': {
      const blocksHtml = (c.blocks || []).map(b =>
        `<div class="data-block"><div class="data-value">${esc(b.value)}</div><div class="data-label">${esc(b.label)}</div></div>`
      ).join('\n        ');
      contentHTML = `
    <div class="label">${esc(c.label || 'BY THE NUMBERS')}</div>
    <div class="headline headline-md">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="data-grid">${blocksHtml}</div>`;
      break;
    }

    case 'cta':
      contentHTML = `
    <div class="label">${esc(c.label || 'LIMITED AVAILABILITY')}</div>
    <div class="headline headline-xl">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="body-text">${esc(c.body || '')}</div>
    <div class="cta-button">
      <span class="cta-button-text">${esc(c.button || 'BOOK NOW')}</span>
      <span class="cta-arrow">&rarr;</span>
    </div>`;
      break;
  }

  const slideHTML = `
<div class="slide">
  <div class="slide-inner ${theme} layout-${layout}">
    <div class="theme-glow"></div>
    <div class="theme-grain"></div>
    <div class="theme-scanlines"></div>
    <div class="theme-decor"></div>
    <div class="theme-decor-2"></div>
    <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div><div class="corner corner-br"></div>
    ${contentHTML}
    <div class="watermark">@FANTASMAFOOTBALL</div>
  </div>
</div>`;

  html = html.replace(/<body>[\s\S]*<\/body>/, `<body>\n${slideHTML}\n</body>`);
  fs.writeFileSync(TEMPLATE_PATH, html, 'utf-8');
  console.log(`Template updated with ${post.type} slide (${theme}).`);
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Screenshot all post options ──────────────────────────────────────────────
async function screenshotPosts(posts) {
  console.log(`Screenshotting ${posts.length} post options...`);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  const postsDir = path.join(__dirname, '..', 'posts');
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  const paths = [];
  for (let i = 0; i < posts.length; i++) {
    writePostHTML(posts[i], VISUAL_THEMES[i]);

    const fileUrl = 'file:///' + path.resolve(TEMPLATE_PATH).replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 2000));

    const slide = await page.$('.slide');
    if (!slide) throw new Error(`No .slide element found for option ${i + 1}`);

    const clip = await slide.boundingBox();
    const outPath = path.join(postsDir, `daily-${TODAY}-${i + 1}.png`);
    await page.screenshot({
      path: outPath,
      clip: { x: clip.x, y: clip.y, width: 1080, height: 1080 },
    });
    console.log(`  Screenshot ${i + 1}: daily-${TODAY}-${i + 1}.png`);
    paths.push(outPath);
  }

  await browser.close();
  return paths;
}

// ── ImgBB upload ─────────────────────────────────────────────────────────────
function uploadToImgBB(imagePath) {
  if (!IMGBB_API_KEY) throw new Error('IMGBB_API_KEY not set');

  const imageData = fs.readFileSync(imagePath).toString('base64');

  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="key"\r\n\r\n${IMGBB_API_KEY}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image"\r\n\r\n${imageData}\r\n` +
      `--${boundary}--\r\n`;

    const req = https.request({
      hostname: 'api.imgbb.com',
      path: '/1/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) resolve(json.data.url);
          else reject(new Error('ImgBB upload failed: ' + (json.error?.message || data)));
        } catch (e) {
          reject(new Error('Failed to parse ImgBB response: ' + data.substring(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Generate site change recommendations ─────────────────────────────────────
async function generateSiteChanges(research) {
  const sitePrompt = `You are an SEO and web optimization expert for Fantasma Football (fantasmafootball.com).

Based on today's research findings, suggest 0-2 small, specific site changes that could improve SEO or conversions.

RESEARCH: ${JSON.stringify(research)}

SITE INFO:
- Main page: index.html (private soccer training in Pittsburgh)
- Booking page: booking.html
- Formation page: formation.html
- Privacy page: privacy.html

Only suggest changes that are:
- Small and safe (meta tags, text tweaks, not structural changes)
- Directly tied to today's research findings
- High-impact for SEO or conversions

Respond in JSON:
{
  "changes": [
    {
      "file": "index.html",
      "description": "what the change does",
      "type": "meta_tag | text_update | schema_markup",
      "search": "existing text to find in the file",
      "replace": "new text to replace it with"
    }
  ]
}

If no changes are warranted today, return: { "changes": [] }
Return ONLY valid JSON, no markdown fences.`;

  console.log('Generating site change recommendations...');
  const raw = await callAI(sitePrompt, 0.3);
  try {
    return JSON.parse(raw.trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { changes: [] };
  }
}

// ── Build daily plan JSON ────────────────────────────────────────────────────
function savePlan(research, posts, imageUrls, siteChanges) {
  const options = posts.map((post, i) => ({
    type: post.type,
    content: post.content,
    caption: post.caption,
    hashtags: post.hashtags,
    image_url: imageUrls[i],
  }));

  const plan = {
    date: TODAY,
    generated_at: new Date().toISOString(),
    research: {
      focus: research.focus,
      content_opportunities: research.content_opportunities,
      keywords: research.keywords,
      recommended_action: research.recommended_action,
      reasoning: research.reasoning,
    },
    social: { options },
    site_changes: siteChanges.changes || [],
    status: 'pending',
  };

  if (!fs.existsSync(PLANS_DIR)) fs.mkdirSync(PLANS_DIR, { recursive: true });
  const planPath = path.join(PLANS_DIR, `${TODAY}.json`);
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf-8');
  console.log(`Plan saved: docs/daily-plans/${TODAY}.json`);
  return plan;
}

// ── Email report ─────────────────────────────────────────────────────────────
async function sendEmail(plan) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log('Skipping email — GMAIL credentials not set');
    return;
  }

  const approveBase = `${SITE_URL}/api/daily/approve?date=${TODAY}&token=${APPROVE_SECRET}`;

  const keywordsHTML = (plan.research.keywords || [])
    .map(k => `<span style="display:inline-block;padding:4px 12px;margin:2px;background:rgba(197,179,88,0.15);border-radius:4px;font-size:13px;color:#C5B358">${k.term} (${k.opportunity})</span>`)
    .join(' ');

  const siteChangesHTML = plan.site_changes.length > 0
    ? plan.site_changes.map(c => `<li>${c.description} <em>(${c.file})</em></li>`).join('')
    : '<li style="color:rgba(255,255,255,0.4)">No site changes recommended today</li>';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px">

    <!-- Header -->
    <div style="text-align:center;padding:32px 0;border-bottom:1px solid rgba(197,179,88,0.2)">
      <div style="font-size:12px;letter-spacing:6px;color:rgba(197,179,88,0.6);margin-bottom:8px">FANTASMA FOOTBALL</div>
      <div style="font-size:28px;font-weight:700;color:#F8F7F4;letter-spacing:2px">DAILY BRIEF</div>
      <div style="font-size:14px;color:rgba(248,247,244,0.4);margin-top:4px">${TODAY}</div>
    </div>

    <!-- Research Summary -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:12px">TODAY'S FOCUS</div>
      <div style="font-size:16px;color:#F8F7F4;line-height:1.5">${plan.research.focus || ''}</div>
    </div>

    <!-- Keywords -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:12px">SEO KEYWORDS</div>
      <div>${keywordsHTML}</div>
    </div>

    <!-- Recommended Action -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:12px">RECOMMENDED ACTION</div>
      <div style="font-size:15px;color:#F8F7F4;line-height:1.5;font-weight:500">${plan.research.recommended_action || ''}</div>
      <div style="font-size:13px;color:rgba(248,247,244,0.4);margin-top:8px">${plan.research.reasoning || ''}</div>
    </div>

    <!-- Post Options -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:24px">PICK A POST</div>

      ${(plan.social.options || []).map((opt, i) => `
      <div style="margin-bottom:${i < 2 ? '32px' : '0'};padding:24px;background:rgba(255,255,255,0.03);border:1px solid rgba(197,179,88,0.1);border-radius:8px">
        <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:4px">OPTION ${i + 1}</div>
        <div style="font-size:13px;color:rgba(248,247,244,0.35);margin-bottom:16px;letter-spacing:1px">${opt.type.toUpperCase().replace('-', ' ')}</div>
        ${opt.image_url
          ? `<img src="${opt.image_url}" alt="Option ${i + 1}" style="width:100%;border-radius:6px;margin-bottom:16px">`
          : '<div style="color:rgba(255,255,255,0.3);font-style:italic;margin-bottom:16px">Image unavailable</div>'
        }
        <div style="font-size:13px;color:rgba(248,247,244,0.6);line-height:1.5;margin-bottom:16px">${opt.caption || ''}</div>
        <a href="${approveBase}&action=social&option=${i + 1}" style="display:block;padding:14px 24px;background:#C5B358;color:#040C14;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:3px;text-align:center;border-radius:4px">
          POST THIS ONE &rarr;
        </a>
      </div>`).join('')}
    </div>

    <!-- Site Changes -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:12px">SITE CHANGES</div>
      <ul style="color:rgba(248,247,244,0.7);font-size:14px;line-height:1.6;padding-left:20px">${siteChangesHTML}</ul>
    </div>

    <!-- Site Only Button -->
    <div style="padding:32px 0;text-align:center">
      <a href="${approveBase}&action=site" style="display:block;padding:12px 16px;border:1px solid #C5B358;color:#C5B358;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:2px;text-align:center;border-radius:4px">
        APPLY SITE CHANGES ONLY
      </a>
      <div style="margin-top:16px;font-size:12px;color:rgba(248,247,244,0.25)">Don't tap anything to skip today</div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;border-top:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;color:rgba(248,247,244,0.2);letter-spacing:2px">FANTASMA FOOTBALL &middot; DAILY INTELLIGENCE</div>
    </div>
  </div>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: GMAIL_USER,
    to: GMAIL_USER,
    subject: `Fantasma Daily Brief — ${TODAY}`,
    html,
  });

  console.log('Email sent to ' + GMAIL_USER);
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    // 1. Research
    const research = await runResearch();

    // 2. Generate 3 post options
    const posts = await generatePosts(research);

    // 3. Screenshot all 3 options
    const screenshotPaths = await screenshotPosts(posts);

    // 4. Upload all 3 to ImgBB
    console.log('Uploading to ImgBB...');
    const imageUrls = [];
    for (let i = 0; i < screenshotPaths.length; i++) {
      const url = await uploadToImgBB(screenshotPaths[i]);
      console.log(`  Option ${i + 1}: ${url}`);
      imageUrls.push(url);
    }

    // 5. Generate site change recommendations
    const siteChanges = await generateSiteChanges(research);

    // 6. Save plan
    const plan = savePlan(research, posts, imageUrls, siteChanges);

    // 7. Send email
    await sendEmail(plan);

    console.log('\n=== DAILY RESEARCH COMPLETE ===');
  } catch (err) {
    console.error('Daily research failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
