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

// ── Competitors ──────────────────────────────────────────────────────────────
const COMPETITORS = [
  {
    name: 'Curran Soccer Academy',
    url: 'https://www.curransocceracademy.com',
    instagram: '@curransocceracademy',
    type: 'Private training academy',
  },
  {
    name: 'Pittsburgh Soccer Academy',
    url: 'https://www.pittsburghsocceracademy.com',
    instagram: '@pittsburghsocceracademy',
    type: '1-on-1 training, youth camps',
  },
  {
    name: 'Lorei Private Coaching',
    url: 'https://www.loreiprivatecoaching.com',
    instagram: '@loreiprivatecoaching',
    type: 'Private soccer coaching',
  },
  {
    name: 'Brazilian Soccer Academy (Moreira)',
    url: 'https://www.braziliansocceracademyllc.com',
    instagram: '@moreirabsa',
    type: 'Private training, Brazilian style',
  },
  {
    name: 'Riverhounds Development Academy',
    url: 'https://www.riverhounds.com/private-training/',
    instagram: '@riverhoundsacademy',
    type: 'Private & small group, pro pathway',
  },
  {
    name: 'Ultimate Youth Soccer',
    url: 'https://ultimateyouthsoccer.com',
    instagram: '@ultimateyouthsoccer',
    type: 'Academy teams, skills training',
  },
  {
    name: 'FC Pittsburgh',
    url: 'https://fcpittsburgh.com',
    instagram: '@fcpittsburgh',
    type: 'Club soccer, camps',
  },
  {
    name: 'Train.Soccer',
    url: 'https://train.soccer',
    instagram: null,
    type: 'Private training marketplace',
  },
  {
    name: 'Dribbler',
    url: 'https://dribblersoccer.com',
    instagram: '@dribblersoccer',
    type: 'Mobile 1-on-1 training',
  },
  {
    name: 'Soccer Shots Pittsburgh',
    url: 'https://www.soccershots.com/pittsburgh/',
    instagram: '@soccershotspgh',
    type: 'Youth ages 2-8',
  },
];

// ── Day-of-week focus topics ─────────────────────────────────────────────────
const DAILY_FOCUS = [
  'Week-ahead planning: content calendar preview and strategy for the coming week',          // Sun
  'Competitor deep-dive: analyze competitor pricing, offerings, and recent website changes',  // Mon
  'SEO keywords: search ranking opportunities for Pittsburgh soccer training',                // Tue
  'Content strategy: what type of soccer Instagram content is performing best right now',     // Wed
  'Local soccer news: club announcements, tryout dates, tournaments in Pittsburgh area',      // Thu
  'Community engagement: Facebook groups, local events, partnership opportunities',           // Fri
  'Weekly performance summary: what worked this week, engagement analysis, key takeaways',   // Sat
];

// ── Post type rotation ───────────────────────────────────────────────────────
const POST_TYPES = ['stat-highlight', 'training-tip', 'quote', 'local-callout', 'data-blocks', 'cta'];

// ── OpenAI API ───────────────────────────────────────────────────────────────
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

  const competitorList = COMPETITORS.map(c => `- ${c.name} (${c.url}) — ${c.type}`).join('\n');

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

COMPETITORS:
${competitorList}

ABOUT FANTASMA FOOTBALL:
- Private 1-on-1 soccer training in Pittsburgh, PA
- Target: youth players ages 8-18, parents who want their kids to improve
- Brand: premium, elite, mysterious ("phantom" theme)
- Differentiators: personalized attention, flexible scheduling, results-focused

TASK: Research and analyze the Pittsburgh soccer training market. Provide:

1. COMPETITOR INSIGHTS (2-3 bullet points about what competitors are doing)
2. SEASONAL FACTORS (what's happening in the soccer calendar right now — tryouts, camps, school schedules)
3. CONTENT OPPORTUNITIES (what type of content would resonate right now)
4. SEO KEYWORDS (3-5 high-opportunity search terms for this week)
5. RECOMMENDED ACTION (one specific thing Fantasma should do today for maximum impact)

Respond in JSON format:
{
  "focus": "brief description of today's focus",
  "competitors": [
    { "name": "...", "insight": "..." }
  ],
  "seasonal": "current seasonal context",
  "content_opportunities": ["opportunity 1", "opportunity 2"],
  "keywords": [
    { "term": "...", "opportunity": "high/medium/low" }
  ],
  "recommended_action": "specific recommendation",
  "reasoning": "why this matters for Fantasma"
}

Return ONLY valid JSON, no markdown fences.`;

  console.log('Running Gemini research analysis...');
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
async function generatePost(research) {
  // Pick post type — rotate based on day, avoiding yesterday's type
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const yesterdayPath = path.join(PLANS_DIR, `${yesterday}.json`);
  let lastType = null;
  if (fs.existsSync(yesterdayPath)) {
    const yPlan = JSON.parse(fs.readFileSync(yesterdayPath, 'utf-8'));
    lastType = yPlan.social?.type;
  }

  let postType = POST_TYPES[DAY_OF_WEEK % POST_TYPES.length];
  if (postType === lastType) {
    postType = POST_TYPES[(DAY_OF_WEEK + 1) % POST_TYPES.length];
  }

  const postPrompt = `You are a social media content creator for Fantasma Football, a premium private soccer training brand in Pittsburgh, PA.

BRAND VOICE: Confident, elite, mysterious. Short punchy lines. Data-driven when possible.
BRAND COLORS: Navy #040C14, Gold #C5B358, Cream #F8F7F4
FONTS: Bebas Neue (headlines), Outfit (body)
WATERMARK: @fantasmafootball

TODAY'S RESEARCH FINDINGS:
${JSON.stringify(research, null, 2)}

POST TYPE: ${postType}

Generate content for a ${postType} Instagram post based on today's research.

POST TYPE FORMATS:
- stat-highlight: Big stat number + context (e.g., "87%" + "OF D1 PLAYERS TRAINED PRIVATELY")
- training-tip: Drill name + 3 step instructions
- quote: Bold motivational statement
- local-callout: Pittsburgh-specific announcement or callout
- data-blocks: 4 data points in a grid
- cta: Call-to-action with booking prompt

Respond in JSON:
{
  "type": "${postType}",
  "content": {
    // For stat-highlight:
    "label": "short top label (3-4 words)",
    "stat": "the number/stat (e.g., 87%)",
    "headline": "2-3 word headline (ALL CAPS)",
    "body": "one sentence context"

    // For training-tip:
    "number": "DRILL // 001",
    "headline": "DRILL NAME (ALL CAPS)",
    "steps": ["step 1", "step 2", "step 3"]

    // For quote:
    "text": "THE QUOTE TEXT (ALL CAPS, short)",
    "attribution": "— SOURCE"

    // For local-callout:
    "badge": "PITTSBURGH",
    "headline": "2-3 WORD HEADLINE",
    "body": "one sentence context"

    // For data-blocks:
    "label": "BY THE NUMBERS",
    "headline": "TOPIC HEADLINE",
    "blocks": [
      { "value": "12+", "label": "SHORT LABEL" },
      { "value": "$60", "label": "SHORT LABEL" },
      { "value": "1:1", "label": "SHORT LABEL" },
      { "value": "87%", "label": "SHORT LABEL" }
    ]

    // For cta:
    "label": "short urgency phrase",
    "headline": "ACTION HEADLINE",
    "body": "one sentence",
    "button": "BOOK NOW"
  },
  "caption": "Full Instagram caption with hashtags (2-3 short sentences + 5-8 relevant hashtags)",
  "hashtags": ["#PittsburghSoccer", "#SoccerTraining", "..."]
}

RULES:
- Headlines must be SHORT (2-4 words max, ALL CAPS)
- Body text should be one clean sentence
- Caption should be engaging but not too long (under 200 chars before hashtags)
- Use only the content fields for the chosen post type
- Make it relevant to today's research findings

Return ONLY valid JSON, no markdown fences.`;

  console.log(`Generating ${postType} post content...`);
  const postRaw = await callAI(postPrompt, 0.8);
  let post;
  try {
    post = JSON.parse(postRaw.trim());
  } catch {
    const match = postRaw.match(/\{[\s\S]*\}/);
    if (match) {
      post = JSON.parse(match[0]);
    } else {
      throw new Error('Could not parse post JSON from Gemini');
    }
  }
  console.log(`Post generated: ${post.type}`);
  return post;
}

// ── Write post HTML to template ──────────────────────────────────────────────
function writePostHTML(post) {
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const c = post.content;

  // Build only the active slide based on type
  let slideHTML;

  switch (post.type) {
    case 'stat-highlight':
      slideHTML = `
<div class="slide" id="slide-stat">
  <div class="slide-inner bg-navy scanlines grain layout-stat">
    <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div><div class="corner corner-br"></div>
    <div class="label text-gold">${esc(c.label || 'DID YOU KNOW')}</div>
    <div class="stat-number">${esc(c.stat || '87%')}</div>
    <div class="headline headline-md text-white">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="body-text text-muted">${esc(c.body || '')}</div>
    <div class="watermark">@FANTASMAFOOTBALL</div>
  </div>
</div>`;
      break;

    case 'training-tip':
      const steps = (c.steps || []).map(s =>
        `<div class="tip-step"><div class="step-marker"></div><div class="step-text">${esc(s)}</div></div>`
      ).join('\n      ');
      slideHTML = `
<div class="slide" id="slide-tip">
  <div class="slide-inner bg-navy scanlines grain layout-tip">
    <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div><div class="corner corner-br"></div>
    <div class="tip-number">${esc(c.number || 'DRILL // 001')}</div>
    <div class="headline headline-lg text-white">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="tip-steps">${steps}</div>
    <div class="watermark">@FANTASMAFOOTBALL</div>
  </div>
</div>`;
      break;

    case 'quote':
      slideHTML = `
<div class="slide" id="slide-quote">
  <div class="slide-inner bg-navy scanlines grain layout-quote">
    <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div><div class="corner corner-br"></div>
    <div class="quote-marks">&ldquo;</div>
    <div class="quote-text">${esc(c.text || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="quote-attr">${esc(c.attribution || 'FANTASMA FOOTBALL')}</div>
    <div class="watermark">@FANTASMAFOOTBALL</div>
  </div>
</div>`;
      break;

    case 'local-callout':
      slideHTML = `
<div class="slide" id="slide-callout">
  <div class="slide-inner bg-navy scanlines grain layout-callout">
    <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div><div class="corner corner-br"></div>
    <div class="callout-badge">
      <div class="callout-badge-dot"></div>
      <div class="callout-badge-text">${esc(c.badge || 'PITTSBURGH')}</div>
    </div>
    <div class="headline headline-xl text-white">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="body-text text-muted">${esc(c.body || '')}</div>
    <div class="watermark">@FANTASMAFOOTBALL</div>
  </div>
</div>`;
      break;

    case 'data-blocks':
      const blocks = (c.blocks || []).map(b =>
        `<div class="data-block"><div class="data-value">${esc(b.value)}</div><div class="data-label">${esc(b.label)}</div></div>`
      ).join('\n        ');
      slideHTML = `
<div class="slide" id="slide-data">
  <div class="slide-inner bg-navy scanlines grain layout-data">
    <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div><div class="corner corner-br"></div>
    <div class="label text-gold">${esc(c.label || 'BY THE NUMBERS')}</div>
    <div class="headline headline-md text-white">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="data-grid">${blocks}</div>
    <div class="watermark">@FANTASMAFOOTBALL</div>
  </div>
</div>`;
      break;

    case 'cta':
      slideHTML = `
<div class="slide" id="slide-cta">
  <div class="slide-inner bg-navy scanlines grain layout-cta">
    <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div><div class="corner corner-br"></div>
    <div class="label text-gold">${esc(c.label || 'LIMITED AVAILABILITY')}</div>
    <div class="headline headline-xl text-white">${esc(c.headline || '').replace(/\n/g, '<br>')}</div>
    <div class="gold-bar"></div>
    <div class="body-text text-muted">${esc(c.body || '')}</div>
    <div class="cta-button">
      <span class="cta-button-text">${esc(c.button || 'BOOK NOW')}</span>
      <span class="cta-arrow">&rarr;</span>
    </div>
    <div class="watermark">@FANTASMAFOOTBALL</div>
  </div>
</div>`;
      break;
  }

  // Replace everything between <body> and </body> with just the active slide
  html = html.replace(/<body>[\s\S]*<\/body>/, `<body>\n${slideHTML}\n</body>`);
  fs.writeFileSync(TEMPLATE_PATH, html, 'utf-8');
  console.log(`Template updated with ${post.type} slide.`);
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Screenshot ───────────────────────────────────────────────────────────────
async function screenshotPost() {
  console.log('Screenshotting post...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  const fileUrl = 'file:///' + path.resolve(TEMPLATE_PATH).replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const slide = await page.$('.slide');
  if (!slide) throw new Error('No .slide element found in template');

  const clip = await slide.boundingBox();
  const outPath = path.join(__dirname, '..', 'posts', `daily-${TODAY}.png`);
  await page.screenshot({
    path: outPath,
    clip: { x: clip.x, y: clip.y, width: 1080, height: 1080 },
  });

  await browser.close();
  console.log(`Screenshot saved: daily-${TODAY}.png`);
  return outPath;
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
function savePlan(research, post, imageUrl, siteChanges) {
  const plan = {
    date: TODAY,
    generated_at: new Date().toISOString(),
    research: {
      focus: research.focus,
      competitors: research.competitors,
      seasonal: research.seasonal,
      content_opportunities: research.content_opportunities,
      keywords: research.keywords,
      recommended_action: research.recommended_action,
      reasoning: research.reasoning,
    },
    social: {
      recommended: true,
      type: post.type,
      content: post.content,
      caption: post.caption,
      hashtags: post.hashtags,
      image_url: imageUrl,
    },
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

  const competitorHTML = (plan.research.competitors || [])
    .map(c => `<li><strong>${c.name}</strong>: ${c.insight}</li>`)
    .join('');

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

    <!-- Competitor Intel -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:12px">COMPETITOR INTEL</div>
      <ul style="color:rgba(248,247,244,0.7);font-size:14px;line-height:1.6;padding-left:20px">${competitorHTML}</ul>
    </div>

    <!-- Seasonal -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:12px">SEASONAL CONTEXT</div>
      <div style="font-size:14px;color:rgba(248,247,244,0.7);line-height:1.5">${plan.research.seasonal || ''}</div>
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

    <!-- Post Preview -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:16px">TODAY'S POST</div>
      ${plan.social.image_url
        ? `<img src="${plan.social.image_url}" alt="Post preview" style="width:100%;border-radius:8px;margin-bottom:16px">`
        : '<div style="color:rgba(255,255,255,0.3);font-style:italic">Image preview unavailable</div>'
      }
      <div style="font-size:14px;color:rgba(248,247,244,0.7);line-height:1.5">${plan.social.caption || ''}</div>
    </div>

    <!-- Site Changes -->
    <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:12px">SITE CHANGES</div>
      <ul style="color:rgba(248,247,244,0.7);font-size:14px;line-height:1.6;padding-left:20px">${siteChangesHTML}</ul>
    </div>

    <!-- Approve Buttons -->
    <div style="padding:32px 0;text-align:center">
      <div style="font-size:11px;letter-spacing:4px;color:rgba(248,247,244,0.3);margin-bottom:20px">TAP TO APPROVE</div>

      <a href="${approveBase}&action=all" style="display:block;padding:16px 32px;background:#C5B358;color:#040C14;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:3px;text-align:center;border-radius:4px;margin-bottom:12px">
        APPROVE ALL
      </a>

      <div style="display:flex;gap:12px;justify-content:center">
        <a href="${approveBase}&action=social" style="flex:1;padding:12px 16px;border:1px solid #C5B358;color:#C5B358;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:2px;text-align:center;border-radius:4px">
          SOCIAL ONLY
        </a>
        <a href="${approveBase}&action=site" style="flex:1;padding:12px 16px;border:1px solid #C5B358;color:#C5B358;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:2px;text-align:center;border-radius:4px">
          SITE ONLY
        </a>
      </div>

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

    // 2. Generate post
    const post = await generatePost(research);

    // 3. Write post HTML and screenshot
    writePostHTML(post);
    const screenshotPath = await screenshotPost();

    // 4. Upload to ImgBB
    console.log('Uploading to ImgBB...');
    const imageUrl = await uploadToImgBB(screenshotPath);
    console.log(`Image URL: ${imageUrl}`);

    // 5. Generate site change recommendations
    const siteChanges = await generateSiteChanges(research);

    // 6. Save plan
    const plan = savePlan(research, post, imageUrl, siteChanges);

    // 7. Send email
    await sendEmail(plan);

    console.log('\n=== DAILY RESEARCH COMPLETE ===');
  } catch (err) {
    console.error('Daily research failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
