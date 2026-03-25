/* ── Helpers ──────────────────────────────────────────────────────── */
function formatCents(cents) {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const str = '$' + (abs / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return neg ? '-' + str : str;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysAgo(iso) {
  const d = new Date(iso);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

async function api(method, path, body) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

/* ── Router ──────────────────────────────────────────────────────── */
const routes = {
  'new-entry': () => renderNewEntry(),
  'journal': () => renderJournal(),
  'ledger': () => renderLedger(),
  'reports': () => renderReports(),
  'board': () => renderBoard(),
  'add-inquiry': () => renderAddInquiry(),
  'accounts': () => renderAccounts(),
};

function navigate() {
  const hash = location.hash.slice(1) || 'board';
  const route = hash.split('/')[0];

  // Update active nav
  $$('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });

  // Close detail panel if open
  const panel = $('.detail-panel');
  if (panel) panel.classList.remove('open');

  // Render route
  if (routes[route]) {
    routes[route]();
  } else {
    $('#content').innerHTML = '<h1 class="page-title">NOT FOUND</h1>';
  }
}

window.addEventListener('hashchange', navigate);

/* ── Stats ───────────────────────────────────────────────────────── */
async function refreshStats() {
  try {
    const stats = await api('GET', '/api/dashboard/stats');
    $('#stat-cash').textContent = formatCents(stats.cashBalance);
    $('#stat-revenue').textContent = formatCents(stats.revenueMTD);
    $('#stat-inquiries').textContent = stats.openInquiries;
  } catch (e) {
    console.error('Stats fetch failed:', e);
  }
}

/* ── Init ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  refreshStats();
  setInterval(refreshStats, 30000);
  navigate();
});
