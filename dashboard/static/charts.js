/* ── Charts ───────────────────────────────────────────────────────────
   Visual analytics built from accounts + journal entries.
   Depends on: api(), formatCents() from app.js, and Chart.js (global Chart).
   ──────────────────────────────────────────────────────────────────── */

const CHART_COLORS = {
  navy: '#040C14',
  gold: '#C5B358',
  cream: '#F8F7F4',
  green: '#2a9d2a',
  red: '#d44',
  grid: 'rgba(4,12,20,0.07)',
  text: '#48453f',
};

// Categorical palette (brand-led) for pie/donut slices.
const CHART_PALETTE = [
  '#C5B358', '#1d3b53', '#8a7d3a', '#3a5872', '#b0a96f',
  '#6e6a64', '#9b8f4a', '#27506e', '#d4c98a', '#48453f',
];

let _chartInstances = [];

function destroyCharts() {
  for (const c of _chartInstances) {
    try { c.destroy(); } catch (e) { /* noop */ }
  }
  _chartInstances = [];
}

// cents -> dollars number
function toDollars(cents) { return Math.round(cents) / 100; }

// "2026-04" -> "Apr '26"
function monthLabel(ym) {
  const [y, m] = ym.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

// Full currency string for tooltips
function usd(dollars) {
  const neg = dollars < 0;
  const s = '$' + Math.abs(dollars).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return neg ? '-' + s : s;
}

// Compact currency for axis ticks ($1.2k)
function usdCompact(dollars) {
  const abs = Math.abs(dollars);
  let s;
  if (abs >= 1000) s = '$' + (dollars / 1000).toFixed(abs >= 10000 ? 0 : 1) + 'k';
  else s = '$' + dollars.toFixed(0);
  return s;
}

const moneyTooltip = {
  callbacks: {
    label: (ctx) => {
      const label = ctx.dataset.label ? ctx.dataset.label + ': ' : '';
      const raw = ctx.parsed.y !== undefined && ctx.parsed.y !== null
        ? ctx.parsed.y
        : (ctx.parsed.x !== undefined ? ctx.parsed.x : ctx.parsed);
      return label + usd(raw);
    },
  },
};

function moneyAxis(extra = {}) {
  return {
    grid: { color: CHART_COLORS.grid },
    ticks: { color: CHART_COLORS.text, callback: (v) => usdCompact(v), font: { family: 'Outfit' } },
    ...extra,
  };
}

async function renderCharts() {
  const content = $('#content');
  const todayStr = todayLocal();

  // Default range: trailing 12 months through today
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  const fromDefault = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;

  content.innerHTML = `
    <h1 class="page-title">CHARTS</h1>
    <div class="filter-bar">
      <div class="form-group"><label>From</label><input type="date" id="c-from" value="${fromDefault}"></div>
      <div class="form-group"><label>To</label><input type="date" id="c-to" value="${todayStr}"></div>
      <div class="form-group">
        <label>Books</label>
        <select id="c-class">
          <option value="">All</option>
          <option value="operations">Operations</option>
          <option value="tax">Tax</option>
        </select>
      </div>
      <button class="btn btn-navy btn-sm" id="c-go">Run</button>
    </div>

    <div class="chart-kpis" id="c-kpis"></div>

    <div class="charts-grid">
      <div class="chart-card full">
        <div class="chart-card-title">REVENUE VS EXPENSES</div>
        <div class="chart-card-sub">Monthly totals with net income trend</div>
        <div class="chart-canvas-wrap"><canvas id="chart-revexp"></canvas></div>
      </div>

      <div class="chart-card">
        <div class="chart-card-title">EXPENSE BREAKDOWN</div>
        <div class="chart-card-sub">By account, over selected range</div>
        <div class="chart-canvas-wrap"><canvas id="chart-expenses"></canvas></div>
      </div>

      <div class="chart-card">
        <div class="chart-card-title">REVENUE BREAKDOWN</div>
        <div class="chart-card-sub">By account, over selected range</div>
        <div class="chart-canvas-wrap"><canvas id="chart-revenue"></canvas></div>
      </div>

      <div class="chart-card full">
        <div class="chart-card-title">BALANCE SHEET COMPOSITION</div>
        <div class="chart-card-sub">Assets vs Liabilities + Equity, as of end date</div>
        <div class="chart-canvas-wrap" style="min-height:180px"><canvas id="chart-balance"></canvas></div>
      </div>
    </div>
  `;

  $('#c-go').addEventListener('click', loadCharts);
  await loadCharts();

  async function loadCharts() {
    const from = $('#c-from').value;
    const to = $('#c-to').value;
    const cls = $('#c-class').value;
    const clsQ = cls ? `&classification=${cls}` : '';

    destroyCharts();

    const [summary, income, balance] = await Promise.all([
      api('GET', `/api/reports/monthly-summary?from=${from}&to=${to}${clsQ}`),
      api('GET', `/api/reports/income-statement?from=${from}&to=${to}${clsQ}`),
      api('GET', `/api/reports/balance-sheet?as_of=${to}${clsQ}`),
    ]);

    renderKpis(income);
    renderRevExpChart(summary);
    renderBreakdownChart('chart-expenses', income.expenses, 'No expenses in range');
    renderBreakdownChart('chart-revenue', income.revenue, 'No revenue in range');
    renderBalanceChart(balance);
  }
}

function renderKpis(income) {
  const net = income.netIncome;
  const netClass = net > 0 ? 'pos' : (net < 0 ? 'neg' : '');
  $('#c-kpis').innerHTML = `
    <div class="chart-kpi">
      <div class="chart-kpi-label">Total Revenue</div>
      <div class="chart-kpi-value">${formatCents(income.totalRevenue)}</div>
    </div>
    <div class="chart-kpi">
      <div class="chart-kpi-label">Total Expenses</div>
      <div class="chart-kpi-value">${formatCents(income.totalExpenses)}</div>
    </div>
    <div class="chart-kpi">
      <div class="chart-kpi-label">Net Income</div>
      <div class="chart-kpi-value ${netClass}">${formatCents(net)}</div>
    </div>
  `;
}

// Show an empty-state message WITHOUT destroying the canvas, so a later
// "Run" with data can still find and draw on it.
function showEmpty(canvasId, msg) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.style.display = 'none';
  let msgEl = canvas.parentElement.querySelector('.chart-empty');
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.className = 'chart-empty';
    canvas.parentElement.appendChild(msgEl);
  }
  msgEl.textContent = msg;
  msgEl.style.display = '';
}

// Restore a canvas before (re)drawing: un-hide it and clear any prior
// empty-state message. Returns the canvas element, or null if missing.
function resetCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  canvas.style.display = '';
  const msgEl = canvas.parentElement.querySelector('.chart-empty');
  if (msgEl) msgEl.remove();
  return canvas;
}

function renderRevExpChart(summary) {
  const months = summary.months || [];
  if (months.length === 0) { showEmpty('chart-revexp', 'No journal activity in this range'); return; }

  const labels = months.map(m => monthLabel(m.month));
  const revenue = months.map(m => toDollars(m.revenue));
  const expenses = months.map(m => toDollars(m.expenses));
  const net = months.map(m => toDollars(m.netIncome));

  const ctx = resetCanvas('chart-revexp');
  _chartInstances.push(new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Revenue', data: revenue, backgroundColor: CHART_COLORS.gold, borderRadius: 4, order: 2 },
        { label: 'Expenses', data: expenses, backgroundColor: CHART_COLORS.navy, borderRadius: 4, order: 2 },
        {
          label: 'Net Income', data: net, type: 'line', order: 1,
          borderColor: CHART_COLORS.green, backgroundColor: CHART_COLORS.green,
          borderWidth: 2, tension: 0.3, pointRadius: 3, pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: CHART_COLORS.text, font: { family: 'Outfit', size: 13 }, usePointStyle: true } },
        tooltip: moneyTooltip,
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: CHART_COLORS.text, font: { family: 'Outfit' } } },
        y: moneyAxis({ beginAtZero: true }),
      },
    },
  }));
}

function renderBreakdownChart(canvasId, items, emptyMsg) {
  const data = (items || []).filter(a => a.balance && a.balance !== 0);
  if (data.length === 0) { showEmpty(canvasId, emptyMsg); return; }

  data.sort((a, b) => b.balance - a.balance);
  const labels = data.map(a => a.name);
  const values = data.map(a => toDollars(a.balance));
  const colors = data.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);

  const ctx = resetCanvas(canvasId);
  _chartInstances.push(new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: {
        legend: { position: 'right', labels: { color: CHART_COLORS.text, font: { family: 'Outfit', size: 12 }, usePointStyle: true, boxWidth: 8, padding: 10 } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
              const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
              return `${ctx.label}: ${usd(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    },
  }));
}

function renderBalanceChart(balance) {
  const assets = toDollars(balance.totalAssets);
  const liabilities = toDollars(balance.totalLiabilities);
  const equity = toDollars(balance.totalEquity);

  if (assets === 0 && liabilities === 0 && equity === 0) {
    showEmpty('chart-balance', 'No balance sheet data as of this date');
    return;
  }

  const ctx = resetCanvas('chart-balance');
  _chartInstances.push(new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Assets', 'Liabilities', 'Equity'],
      datasets: [{
        label: 'Balance',
        data: [assets, liabilities, equity],
        backgroundColor: [CHART_COLORS.gold, CHART_COLORS.red, CHART_COLORS.navy],
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => usd(ctx.parsed.x) } },
      },
      scales: {
        x: moneyAxis({ beginAtZero: true }),
        y: { grid: { display: false }, ticks: { color: CHART_COLORS.text, font: { family: 'Outfit', size: 13 } } },
      },
    },
  }));
}
