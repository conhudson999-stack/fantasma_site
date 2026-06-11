const crypto = require('crypto');

const COOKIE = 'dash_session';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function sign(payloadObj, secret) {
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

function verify(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(mac); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let obj;
  try { obj = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
  if (!obj || typeof obj.exp !== 'number' || obj.exp < Date.now()) return null;
  return obj;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function ctEqual(a, b) {
  const ab = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// In production (Turso configured) require Secure cookies; locally allow http.
function cookieFlags(maxAgeSec) {
  const secure = process.env.TURSO_DATABASE_URL ? ' Secure;' : '';
  return `HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAgeSec}; Path=/`;
}

const LOGIN_PAGE = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fantasma Dashboard — Login</title>
<style>
  body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#040C14;font-family:system-ui,sans-serif}
  .box{background:#0a1420;padding:32px;border-radius:12px;width:300px;text-align:center;border:1px solid #1d2a3a}
  h1{color:#C5B358;font-size:20px;margin:0 0 20px;letter-spacing:1px}
  input{width:100%;padding:12px;margin-bottom:12px;border-radius:8px;border:1px solid #2a3a4a;background:#040C14;color:#F8F7F4;box-sizing:border-box}
  button{width:100%;padding:12px;border:0;border-radius:8px;background:#C5B358;color:#040C14;font-weight:700;cursor:pointer}
  .err{color:#e98a8a;font-size:13px;min-height:18px;margin-bottom:8px}
</style></head><body>
<form class="box" onsubmit="return go(event)">
  <h1>FANTASMA DASHBOARD</h1>
  <div class="err" id="e"></div>
  <input type="password" id="p" placeholder="Password" autofocus autocomplete="current-password">
  <button type="submit">Enter</button>
</form>
<script>
async function go(ev){ev.preventDefault();
  const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('p').value})});
  if(r.ok){location.href='/';}else{document.getElementById('e').textContent='Incorrect password';}
  return false;}
</script></body></html>`;

function requireAuth(req, res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (verify(token, process.env.SESSION_SECRET)) return next();
  if ((req.headers.accept || '').includes('text/html')) {
    return res.status(200).type('html').send(LOGIN_PAGE);
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

function mountAuth(app) {
  app.post('/api/login', (req, res) => {
    const password = req.body && req.body.password;
    const expected = process.env.DASHBOARD_PASSWORD || '';
    if (!password || !expected || !ctEqual(password, expected)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    const token = sign({ exp: Date.now() + MAX_AGE_MS }, process.env.SESSION_SECRET);
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieFlags(MAX_AGE_MS / 1000)}`);
    res.json({ ok: true });
  });
  app.post('/api/logout', (req, res) => {
    res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieFlags(0)}`);
    res.json({ ok: true });
  });
}

module.exports = { sign, verify, parseCookies, requireAuth, mountAuth, COOKIE };
