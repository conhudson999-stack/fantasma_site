/**
 * daily-implement.cjs — Implements an approved daily plan
 *
 * Usage: node scripts/daily-implement.cjs <date> <action>
 *   date:   YYYY-MM-DD
 *   action: all | social | site
 *
 * Triggered by GitHub Actions after the approve button is tapped.
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

// Load .env.local for local testing
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const PLANS_DIR = path.join(__dirname, '..', 'docs', 'daily-plans');

// ── Instagram Graph API (reused from publish-post.cjs) ──────────────────────
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
          if (data.error) reject(new Error(`Instagram API: ${data.error.message}`));
          else resolve(data);
        } catch (e) {
          reject(new Error('Failed to parse Instagram response: ' + body));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function postToInstagram(imageUrl, caption) {
  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!userId || !token) throw new Error('INSTAGRAM_USER_ID or INSTAGRAM_ACCESS_TOKEN not set');

  console.log('Creating Instagram media container...');
  const container = await graphRequest(`/${userId}/media`, {
    image_url: imageUrl,
    caption: caption,
    access_token: token,
  });
  console.log(`Container created: ${container.id}`);

  console.log('Waiting for processing...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('Publishing...');
  const result = await graphRequest(`/${userId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  console.log(`Published! Post ID: ${result.id}`);
  return result.id;
}

// ── Facebook Graph API ───────────────────────────────────────────────────────
function fbGraphRequest(endpoint, params) {
  const query = new URLSearchParams(params).toString();
  const url = `https://graph.facebook.com/v21.0${endpoint}?${query}`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST' }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) reject(new Error(`Facebook API: ${data.error.message}`));
          else resolve(data);
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
  if (!pageId || !token) {
    console.log('Skipping Facebook — credentials not set');
    return null;
  }

  console.log('Posting to Facebook...');
  const result = await fbGraphRequest(`/${pageId}/photos`, {
    url: imageUrl,
    message: caption || '',
    access_token: token,
  });
  console.log(`Facebook post: ${result.post_id || result.id}`);
  return result.post_id || result.id;
}

// ── Apply site changes ───────────────────────────────────────────────────────
function applySiteChanges(changes) {
  let applied = 0;

  for (const change of changes) {
    const filePath = path.join(__dirname, '..', change.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping: ${change.file} not found`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    if (change.search && change.replace) {
      if (content.includes(change.search)) {
        content = content.replace(change.search, change.replace);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  Applied: ${change.description} (${change.file})`);
        applied++;
      } else {
        console.log(`  Skipped: search text not found in ${change.file}`);
      }
    } else if (change.search && change.insert_after) {
      if (content.includes(change.search)) {
        content = content.replace(change.search, change.search + '\n  ' + change.insert_after);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  Applied: ${change.description} (${change.file})`);
        applied++;
      } else {
        console.log(`  Skipped: search text not found in ${change.file}`);
      }
    }
  }

  return applied;
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const date = process.argv[2];
  const action = process.argv[3];

  if (!date || !action) {
    console.error('Usage: node daily-implement.cjs <date> <action>');
    process.exit(1);
  }

  const planPath = path.join(PLANS_DIR, `${date}.json`);
  if (!fs.existsSync(planPath)) {
    console.error(`Plan not found: ${planPath}`);
    process.exit(1);
  }

  const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  console.log(`\n=== IMPLEMENTING PLAN: ${date} (action: ${action}) ===\n`);

  const doSocial = action === 'all' || action === 'social';
  const doSite = action === 'all' || action === 'site';

  // Social: Post to Instagram + Facebook
  if (doSocial && plan.social?.recommended && plan.social?.image_url) {
    console.log('--- SOCIAL MEDIA ---');
    const caption = plan.social.caption + '\n\n' + (plan.social.hashtags || []).join(' ');

    try {
      await postToInstagram(plan.social.image_url, caption);
    } catch (err) {
      console.error('Instagram post failed:', err.message);
    }

    try {
      await postToFacebook(plan.social.image_url, caption);
    } catch (err) {
      console.error('Facebook post failed:', err.message);
    }
  } else if (doSocial) {
    console.log('No social post recommended today.');
  }

  // Site: Apply changes
  if (doSite && plan.site_changes?.length > 0) {
    console.log('\n--- SITE CHANGES ---');
    const applied = applySiteChanges(plan.site_changes);
    console.log(`Applied ${applied}/${plan.site_changes.length} changes.`);
  } else if (doSite) {
    console.log('No site changes recommended today.');
  }

  // Update plan status
  plan.status = action === 'all' ? 'implemented' : `implemented-${action}`;
  plan.implemented_at = new Date().toISOString();
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf-8');

  console.log('\n=== IMPLEMENTATION COMPLETE ===');
})();
