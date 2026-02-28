// Vercel Serverless Function — /api/daily/approve
// Validates the approve token, triggers GitHub Actions via repository_dispatch

const https = require('https');

module.exports = async (req, res) => {
  const { date, action, token } = req.query;

  // Validate token
  if (!token || token !== process.env.APPROVE_SECRET) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(401).send(page('Unauthorized', 'Invalid or missing approval token.', 'red'));
  }

  // Validate params
  if (!date || !action) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(page('Bad Request', 'Missing date or action parameter.', 'red'));
  }

  const validActions = ['all', 'social', 'site'];
  if (!validActions.includes(action)) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(page('Bad Request', `Invalid action: ${action}`, 'red'));
  }

  // Trigger GitHub Actions repository_dispatch
  const ghPat = process.env.GITHUB_PAT;
  const ghRepo = process.env.GITHUB_REPO; // e.g. "conhudson999-stack/fantasma_site"

  if (!ghPat || !ghRepo) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(page('Config Error', 'Server missing GITHUB_PAT or GITHUB_REPO.', 'red'));
  }

  try {
    await triggerDispatch(ghPat, ghRepo, {
      event_type: 'approve-daily-plan',
      client_payload: { date, action }
    });

    const actionLabel = action === 'all' ? 'Site + Social Media'
      : action === 'social' ? 'Social Media Only'
      : 'Site Changes Only';

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(page(
      'Approved!',
      `Your daily plan for ${date} is being implemented now.<br><br><strong>${actionLabel}</strong><br><br>You'll get a confirmation email when it's done.`,
      '#C5B358'
    ));
  } catch (err) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(page('Error', `Failed to trigger implementation: ${err.message}`, 'red'));
  }
};

function triggerDispatch(token, repo, body) {
  const data = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${repo}/dispatches`,
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'fantasma-daily-approve',
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function page(title, message, color) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fantasma Football — ${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #040C14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #F8F7F4;
      padding: 24px;
    }
    .card {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 32px;
      color: ${color};
      margin-bottom: 16px;
      letter-spacing: 2px;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(248, 247, 244, 0.7);
    }
    strong { color: ${color}; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${color === 'red' ? '&#10060;' : '&#9889;'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
