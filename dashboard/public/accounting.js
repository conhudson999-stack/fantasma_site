/* ══════════════════════════════════════════════════════════════════════
   ACCOUNTING VIEWS
   ══════════════════════════════════════════════════════════════════════ */

let cachedAccounts = null;

async function getAccounts() {
  if (!cachedAccounts) cachedAccounts = await api('GET', '/api/accounts');
  return cachedAccounts;
}

function invalidateAccounts() { cachedAccounts = null; }

function accountSelect(accounts, selectedId, filterActive) {
  const list = filterActive !== false ? accounts.filter(a => a.active) : accounts;
  let html = '<option value="">Select account...</option>';
  const types = ['asset', 'liability', 'equity', 'revenue', 'expense'];
  for (const type of types) {
    const group = list.filter(a => a.type === type);
    if (group.length === 0) continue;
    html += `<optgroup label="${type.charAt(0).toUpperCase() + type.slice(1)}">`;
    for (const a of group) {
      html += `<option value="${a.id}" ${a.id == selectedId ? 'selected' : ''}>${a.code} — ${a.name}</option>`;
    }
    html += '</optgroup>';
  }
  return html;
}

function parseDollars(str) {
  const v = parseFloat((str || '').replace(/[^0-9.\-]/g, ''));
  return isNaN(v) ? 0 : Math.round(v * 100);
}

/* ── New Entry ───────────────────────────────────────────────────── */
async function renderNewEntry(editId) {
  const content = $('#content');
  const accounts = await getAccounts();
  let entry = null;

  if (editId) {
    entry = await api('GET', `/api/journal-entries/${editId}`);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  content.innerHTML = `
    <h1 class="page-title">${entry ? 'EDIT ENTRY' : 'NEW ENTRY'}</h1>
    <div id="entry-msg"></div>
    <div class="card">
      <div class="form-row">
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="entry-date" value="${entry ? entry.date : todayStr}">
        </div>
        <div class="form-group" style="flex:3">
          <label>Memo</label>
          <input type="text" id="entry-memo" placeholder="Description of transaction" value="${entry ? entry.memo : ''}">
        </div>
      </div>

      <div class="quick-btns">
        <button class="quick-btn" data-quick="training">Training Session</button>
        <button class="quick-btn" data-quick="field">Field Rental</button>
        <button class="quick-btn" data-quick="equipment">Equipment Purchase</button>
      </div>

      <table class="line-table">
        <thead>
          <tr>
            <th style="width:40%">Account</th>
            <th style="width:22%">Debit ($)</th>
            <th style="width:22%">Credit ($)</th>
            <th style="width:40px"></th>
          </tr>
        </thead>
        <tbody id="entry-lines"></tbody>
      </table>

      <div style="margin-top:8px">
        <button class="btn btn-outline btn-sm" id="add-row-btn">+ Add Row</button>
      </div>

      <div class="line-totals" id="entry-totals">
        <span>Debits: $0.00</span>
        <span>Credits: $0.00</span>
        <span>Difference: $0.00</span>
      </div>

      <div class="flex gap-8 mt-16">
        <button class="btn btn-gold" id="save-entry-btn" disabled>
          ${entry ? 'Update Entry' : 'Save Entry'}
        </button>
        ${entry ? '<button class="btn btn-outline" onclick="location.hash=\'#journal\'">Cancel</button>' : ''}
      </div>
    </div>
  `;

  const linesBody = $('#entry-lines');

  function addLine(accountId, debit, credit) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><select class="line-account">${accountSelect(accounts, accountId)}</select></td>
      <td><input type="text" class="amount-input line-debit" placeholder="0.00" value="${debit ? (debit / 100).toFixed(2) : ''}"></td>
      <td><input type="text" class="amount-input line-credit" placeholder="0.00" value="${credit ? (credit / 100).toFixed(2) : ''}"></td>
      <td><button class="remove-row">&times;</button></td>
    `;
    linesBody.appendChild(tr);

    // Mutual exclusion: typing in debit clears credit
    const debitInput = tr.querySelector('.line-debit');
    const creditInput = tr.querySelector('.line-credit');
    debitInput.addEventListener('input', () => { if (debitInput.value) creditInput.value = ''; recalc(); });
    creditInput.addEventListener('input', () => { if (creditInput.value) debitInput.value = ''; recalc(); });
    tr.querySelector('.remove-row').addEventListener('click', () => { tr.remove(); recalc(); });
  }

  function recalc() {
    let totalDebit = 0, totalCredit = 0;
    linesBody.querySelectorAll('tr').forEach(tr => {
      totalDebit += parseDollars(tr.querySelector('.line-debit').value);
      totalCredit += parseDollars(tr.querySelector('.line-credit').value);
    });
    const diff = totalDebit - totalCredit;
    const balanced = totalDebit > 0 && diff === 0;
    const totalsDiv = $('#entry-totals');
    totalsDiv.innerHTML = `
      <span>Debits: ${formatCents(totalDebit)}</span>
      <span>Credits: ${formatCents(totalCredit)}</span>
      <span>Difference: ${formatCents(diff)}</span>
    `;
    totalsDiv.className = 'line-totals ' + (balanced ? 'balanced' : 'unbalanced');
    $('#save-entry-btn').disabled = !balanced;
  }

  // Populate lines
  if (entry && entry.lines) {
    for (const l of entry.lines) addLine(l.account_id, l.debit, l.credit);
  } else {
    addLine(); addLine();
  }

  $('#add-row-btn').addEventListener('click', () => addLine());

  // Quick entry buttons
  const quickMap = {
    training: () => {
      const cash = accounts.find(a => a.code === '1000');
      const rev = accounts.find(a => a.code === '4000');
      if (!cash || !rev) return;
      linesBody.innerHTML = '';
      addLine(cash.id, 0, 0);
      addLine(rev.id, 0, 0);
    },
    field: () => {
      const field = accounts.find(a => a.code === '5000');
      const cash = accounts.find(a => a.code === '1000');
      if (!field || !cash) return;
      linesBody.innerHTML = '';
      addLine(field.id, 0, 0);
      addLine(cash.id, 0, 0);
    },
    equipment: () => {
      const equip = accounts.find(a => a.code === '5010');
      const cash = accounts.find(a => a.code === '1000');
      if (!equip || !cash) return;
      linesBody.innerHTML = '';
      addLine(equip.id, 0, 0);
      addLine(cash.id, 0, 0);
    }
  };

  content.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fn = quickMap[btn.dataset.quick];
      if (fn) fn();
      recalc();
    });
  });

  // Save
  $('#save-entry-btn').addEventListener('click', async () => {
    const lines = [];
    let valid = true;
    linesBody.querySelectorAll('tr').forEach(tr => {
      const accountId = parseInt(tr.querySelector('.line-account').value);
      const debit = parseDollars(tr.querySelector('.line-debit').value);
      const credit = parseDollars(tr.querySelector('.line-credit').value);
      if (!accountId) valid = false;
      lines.push({ account_id: accountId, debit, credit });
    });

    if (!valid) {
      $('#entry-msg').innerHTML = '<div class="msg msg-error">Select an account for every line.</div>';
      return;
    }

    const body = {
      date: $('#entry-date').value,
      memo: $('#entry-memo').value,
      lines
    };

    try {
      if (entry) {
        await api('PUT', `/api/journal-entries/${entry.id}`, body);
      } else {
        await api('POST', '/api/journal-entries', body);
      }
      refreshStats();
      if (entry) {
        location.hash = '#journal';
      } else {
        $('#entry-msg').innerHTML = '<div class="msg msg-success">Entry saved.</div>';
        $('#entry-memo').value = '';
        linesBody.innerHTML = '';
        addLine(); addLine();
        recalc();
      }
    } catch (e) {
      $('#entry-msg').innerHTML = `<div class="msg msg-error">${e.message}</div>`;
    }
  });
}

/* ── Journal ─────────────────────────────────────────────────────── */
async function renderJournal() {
  const content = $('#content');
  const accounts = await getAccounts();

  content.innerHTML = `
    <h1 class="page-title">JOURNAL</h1>
    <div class="filter-bar">
      <div class="form-group">
        <label>From</label>
        <input type="date" id="j-from">
      </div>
      <div class="form-group">
        <label>To</label>
        <input type="date" id="j-to">
      </div>
      <div class="form-group">
        <label>Account</label>
        <select id="j-account" style="min-width:200px">
          <option value="">All accounts</option>
          ${accounts.map(a => `<option value="${a.id}">${a.code} — ${a.name}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-navy btn-sm" id="j-filter">Filter</button>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Memo</th>
            <th class="text-right">Amount</th>
            <th class="text-center">Lines</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="j-body"></tbody>
      </table>
    </div>
  `;

  async function load() {
    const params = new URLSearchParams();
    const from = $('#j-from').value;
    const to = $('#j-to').value;
    const accountId = $('#j-account').value;
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (accountId) params.set('account_id', accountId);

    const entries = await api('GET', '/api/journal-entries?' + params);
    const tbody = $('#j-body');
    tbody.innerHTML = '';

    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:24px">No entries found.</td></tr>';
      return;
    }

    for (const e of entries) {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td>${formatDate(e.date)}</td>
        <td>${e.memo}</td>
        <td class="text-right">${formatCents(e.total_amount)}</td>
        <td class="text-center">${e.line_count}</td>
        <td class="text-right">
          <button class="btn btn-outline btn-sm edit-btn" data-id="${e.id}">Edit</button>
          <button class="btn btn-danger btn-sm del-btn" data-id="${e.id}">Del</button>
        </td>
      `;

      // Expand row
      const expandTr = document.createElement('tr');
      expandTr.className = 'expand-row';
      expandTr.style.display = 'none';
      expandTr.innerHTML = '<td colspan="5" id="expand-' + e.id + '" style="padding:0 12px 12px 24px"></td>';

      tr.addEventListener('click', async (ev) => {
        if (ev.target.closest('.edit-btn') || ev.target.closest('.del-btn')) return;
        if (expandTr.style.display === 'none') {
          expandTr.style.display = '';
          const detail = await api('GET', `/api/journal-entries/${e.id}`);
          const cell = expandTr.querySelector('td');
          let linesHtml = '<table style="width:auto;margin:8px 0"><thead><tr><th>Account</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr></thead><tbody>';
          for (const l of detail.lines) {
            linesHtml += `<tr><td>${l.account_code} — ${l.account_name}</td><td class="text-right">${l.debit ? formatCents(l.debit) : ''}</td><td class="text-right">${l.credit ? formatCents(l.credit) : ''}</td></tr>`;
          }
          linesHtml += '</tbody></table>';
          cell.innerHTML = linesHtml;
        } else {
          expandTr.style.display = 'none';
        }
      });

      // Edit
      tr.querySelector('.edit-btn').addEventListener('click', () => {
        renderNewEntry(e.id);
      });

      // Delete
      tr.querySelector('.del-btn').addEventListener('click', async () => {
        if (!confirm('Delete this entry?')) return;
        await api('DELETE', `/api/journal-entries/${e.id}`);
        refreshStats();
        load();
      });

      tbody.appendChild(tr);
      tbody.appendChild(expandTr);
    }
  }

  $('#j-filter').addEventListener('click', load);
  load();
}

/* ── Ledger ──────────────────────────────────────────────────────── */
async function renderLedger() {
  const content = $('#content');
  const accounts = await getAccounts();

  content.innerHTML = `
    <h1 class="page-title">GENERAL LEDGER</h1>
    <div class="filter-bar">
      <div class="form-group">
        <label>Account</label>
        <select id="l-account" style="min-width:260px">
          ${accountSelect(accounts, '', false)}
        </select>
      </div>
      <div class="form-group">
        <label>From</label>
        <input type="date" id="l-from">
      </div>
      <div class="form-group">
        <label>To</label>
        <input type="date" id="l-to">
      </div>
      <button class="btn btn-navy btn-sm" id="l-go">Load</button>
    </div>
    <div id="ledger-content"></div>
  `;

  async function load() {
    const accountId = $('#l-account').value;
    if (!accountId) {
      $('#ledger-content').innerHTML = '<p class="text-muted">Select an account to view its ledger.</p>';
      return;
    }

    const account = accounts.find(a => a.id == accountId);
    const params = new URLSearchParams({ account_id: accountId });
    const from = $('#l-from').value;
    const to = $('#l-to').value;
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const entries = await api('GET', '/api/journal-entries?' + params);

    // Get all lines for this account from each entry
    let rows = [];
    for (const e of entries) {
      const detail = await api('GET', `/api/journal-entries/${e.id}`);
      for (const l of detail.lines) {
        if (l.account_id == accountId) {
          rows.push({ date: e.date, memo: e.memo, debit: l.debit, credit: l.credit });
        }
      }
    }

    // Sort by date
    rows.sort((a, b) => a.date.localeCompare(b.date));

    // Compute running balance
    let balance = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    for (const r of rows) {
      totalDebit += r.debit;
      totalCredit += r.credit;
      if (account.normal_side === 'debit') {
        balance += r.debit - r.credit;
      } else {
        balance += r.credit - r.debit;
      }
      r.balance = balance;
    }

    let html = `
      <div class="card">
        <div class="flex justify-between items-center mb-16">
          <div>
            <span style="font-size:13px;color:var(--gray-500)">${account.code}</span>
            <h2 class="card-title">${account.name}</h2>
          </div>
          <div class="flex gap-16" style="text-align:center">
            <div><div class="text-muted" style="font-size:11px;text-transform:uppercase">Total Debits</div><div style="font-weight:600">${formatCents(totalDebit)}</div></div>
            <div><div class="text-muted" style="font-size:11px;text-transform:uppercase">Total Credits</div><div style="font-weight:600">${formatCents(totalCredit)}</div></div>
            <div><div class="text-muted" style="font-size:11px;text-transform:uppercase">Balance</div><div style="font-weight:600">${formatCents(balance)}</div></div>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Date</th><th>Memo</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th class="text-right">Balance</th></tr>
          </thead>
          <tbody>
    `;

    if (rows.length === 0) {
      html += '<tr><td colspan="5" class="text-center text-muted" style="padding:24px">No transactions found.</td></tr>';
    } else {
      for (const r of rows) {
        html += `<tr>
          <td>${formatDate(r.date)}</td>
          <td>${r.memo}</td>
          <td class="text-right">${r.debit ? formatCents(r.debit) : ''}</td>
          <td class="text-right">${r.credit ? formatCents(r.credit) : ''}</td>
          <td class="text-right" style="font-weight:600">${formatCents(r.balance)}</td>
        </tr>`;
      }
    }

    html += '</tbody></table></div>';
    $('#ledger-content').innerHTML = html;
  }

  $('#l-go').addEventListener('click', load);
  $('#l-account').addEventListener('change', load);
}

/* ── Reports ─────────────────────────────────────────────────────── */
async function renderReports() {
  const content = $('#content');
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStart = todayStr.slice(0, 7) + '-01';

  content.innerHTML = `
    <h1 class="page-title">REPORTS</h1>
    <div class="report-tabs">
      <button class="report-tab active" data-tab="trial-balance">Trial Balance</button>
      <button class="report-tab" data-tab="income-statement">Income Statement</button>
      <button class="report-tab" data-tab="balance-sheet">Balance Sheet</button>
    </div>
    <div class="filter-bar" id="report-filters"></div>
    <div class="card" id="report-body" style="padding:0;overflow:hidden"></div>
  `;

  let activeTab = 'trial-balance';

  function renderFilters() {
    const f = $('#report-filters');
    if (activeTab === 'income-statement') {
      f.innerHTML = `
        <div class="form-group"><label>From</label><input type="date" id="r-from" value="${monthStart}"></div>
        <div class="form-group"><label>To</label><input type="date" id="r-to" value="${todayStr}"></div>
        <button class="btn btn-navy btn-sm" id="r-go">Run</button>
        <button class="btn btn-outline btn-sm" id="r-export">Export CSV</button>
      `;
    } else {
      f.innerHTML = `
        <div class="form-group"><label>As of</label><input type="date" id="r-asof" value="${todayStr}"></div>
        <button class="btn btn-navy btn-sm" id="r-go">Run</button>
        <button class="btn btn-outline btn-sm" id="r-export">Export CSV</button>
      `;
    }
    $('#r-go').addEventListener('click', loadReport);
    $('#r-export').addEventListener('click', exportReport);
  }

  async function loadReport() {
    const body = $('#report-body');

    if (activeTab === 'trial-balance') {
      const asOf = $('#r-asof').value;
      const data = await api('GET', `/api/reports/trial-balance?as_of=${asOf}`);

      let html = '<table><thead><tr><th>Code</th><th>Account</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr></thead><tbody>';
      for (const a of data.accounts) {
        if (a.debit_balance === 0 && a.credit_balance === 0) continue;
        html += `<tr><td>${a.code}</td><td>${a.name}</td><td class="text-right">${a.debit_balance ? formatCents(a.debit_balance) : ''}</td><td class="text-right">${a.credit_balance ? formatCents(a.credit_balance) : ''}</td></tr>`;
      }
      html += `<tr class="report-total-row"><td></td><td>TOTALS</td><td class="text-right">${formatCents(data.totalDebits)}</td><td class="text-right">${formatCents(data.totalCredits)}</td></tr>`;
      html += '</tbody></table>';
      body.innerHTML = html;

    } else if (activeTab === 'income-statement') {
      const from = $('#r-from').value;
      const to = $('#r-to').value;
      const data = await api('GET', `/api/reports/income-statement?from=${from}&to=${to}`);

      let html = '<div style="padding:20px 24px">';
      html += '<div class="report-section-title">REVENUE</div>';
      html += '<table><tbody>';
      for (const a of data.revenue) {
        if (a.balance === 0) continue;
        html += `<tr><td style="padding-left:24px">${a.name}</td><td class="text-right">${formatCents(a.balance)}</td></tr>`;
      }
      html += `<tr class="report-total-row"><td>TOTAL REVENUE</td><td class="text-right">${formatCents(data.totalRevenue)}</td></tr>`;
      html += '</tbody></table>';

      html += '<div class="report-section-title">EXPENSES</div>';
      html += '<table><tbody>';
      for (const a of data.expenses) {
        if (a.balance === 0) continue;
        html += `<tr><td style="padding-left:24px">${a.name}</td><td class="text-right">${formatCents(a.balance)}</td></tr>`;
      }
      html += `<tr class="report-total-row"><td>TOTAL EXPENSES</td><td class="text-right">${formatCents(data.totalExpenses)}</td></tr>`;
      html += '</tbody></table>';

      html += '<table><tbody>';
      html += `<tr class="report-net-row"><td>NET INCOME</td><td class="text-right">${formatCents(data.netIncome)}</td></tr>`;
      html += '</tbody></table></div>';
      body.innerHTML = html;

    } else if (activeTab === 'balance-sheet') {
      const asOf = $('#r-asof').value;
      const data = await api('GET', `/api/reports/balance-sheet?as_of=${asOf}`);

      let html = '<div style="padding:20px 24px">';

      html += '<div class="report-section-title">ASSETS</div>';
      html += '<table><tbody>';
      for (const a of data.assets) {
        if (a.balance === 0) continue;
        html += `<tr><td style="padding-left:24px">${a.name}</td><td class="text-right">${formatCents(a.balance)}</td></tr>`;
      }
      html += `<tr class="report-total-row"><td>TOTAL ASSETS</td><td class="text-right">${formatCents(data.totalAssets)}</td></tr>`;
      html += '</tbody></table>';

      html += '<div class="report-section-title">LIABILITIES</div>';
      html += '<table><tbody>';
      for (const a of data.liabilities) {
        if (a.balance === 0) continue;
        html += `<tr><td style="padding-left:24px">${a.name}</td><td class="text-right">${formatCents(a.balance)}</td></tr>`;
      }
      html += `<tr class="report-total-row"><td>TOTAL LIABILITIES</td><td class="text-right">${formatCents(data.totalLiabilities)}</td></tr>`;
      html += '</tbody></table>';

      html += '<div class="report-section-title">EQUITY</div>';
      html += '<table><tbody>';
      for (const a of data.equity) {
        if (a.balance === 0) continue;
        html += `<tr><td style="padding-left:24px">${a.name}</td><td class="text-right">${formatCents(a.balance)}</td></tr>`;
      }
      if (data.netIncome !== 0) {
        html += `<tr><td style="padding-left:24px">Net Income</td><td class="text-right">${formatCents(data.netIncome)}</td></tr>`;
      }
      html += `<tr class="report-total-row"><td>TOTAL EQUITY</td><td class="text-right">${formatCents(data.totalEquity)}</td></tr>`;
      html += '</tbody></table>';

      html += '<table><tbody>';
      html += `<tr class="report-net-row"><td>TOTAL LIABILITIES + EQUITY</td><td class="text-right">${formatCents(data.totalLiabilities + data.totalEquity)}</td></tr>`;
      html += '</tbody></table></div>';
      body.innerHTML = html;
    }
  }

  function exportReport() {
    const params = new URLSearchParams({ type: activeTab });
    if (activeTab === 'income-statement') {
      params.set('from', $('#r-from').value);
      params.set('to', $('#r-to').value);
    } else {
      params.set('as_of', $('#r-asof').value);
    }
    window.open('/api/reports/export?' + params, '_blank');
  }

  // Tab switching
  content.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      content.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderFilters();
      loadReport();
    });
  });

  renderFilters();
  loadReport();
}

/* ── Accounts Settings ───────────────────────────────────────────── */
async function renderAccounts() {
  const content = $('#content');
  invalidateAccounts();
  const accounts = await getAccounts();

  const types = ['asset', 'liability', 'equity', 'revenue', 'expense'];
  const normalFor = t => (t === 'asset' || t === 'expense') ? 'debit' : 'credit';

  let html = `
    <h1 class="page-title">ACCOUNTS</h1>
    <div id="acct-msg"></div>
    <div class="card mb-16">
      <h3 class="card-title" style="margin-bottom:12px">ADD ACCOUNT</h3>
      <div class="form-row">
        <div class="form-group" style="flex:0.5">
          <label>Code</label>
          <input type="text" id="new-code" placeholder="5100">
        </div>
        <div class="form-group" style="flex:2">
          <label>Name</label>
          <input type="text" id="new-name" placeholder="Account name">
        </div>
        <div class="form-group" style="flex:1">
          <label>Type</label>
          <select id="new-type">
            ${types.map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="flex:0.7">
          <label>Normal Side</label>
          <input type="text" id="new-normal" value="debit" readonly style="background:var(--gray-100)">
        </div>
        <div class="form-group" style="flex:0.5;display:flex;align-items:flex-end">
          <button class="btn btn-gold" id="add-acct-btn">Add</button>
        </div>
      </div>
    </div>
  `;

  // Group accounts by type
  html += '<div class="card" style="padding:0;overflow:hidden"><table>';
  for (const type of types) {
    const group = accounts.filter(a => a.type === type);
    html += `<tr><td colspan="5" class="account-type-header">${type.toUpperCase()}</td></tr>`;
    html += '<tr><th style="background:var(--gray-100);color:var(--navy);font-family:Outfit;font-size:12px;font-weight:600">Code</th><th style="background:var(--gray-100);color:var(--navy);font-family:Outfit;font-size:12px;font-weight:600">Name</th><th style="background:var(--gray-100);color:var(--navy);font-family:Outfit;font-size:12px;font-weight:600">Normal Side</th><th style="background:var(--gray-100);color:var(--navy);font-family:Outfit;font-size:12px;font-weight:600" class="text-right">Balance</th><th style="background:var(--gray-100);color:var(--navy);font-family:Outfit;font-size:12px;font-weight:600" class="text-center">Active</th></tr>';
    for (const a of group) {
      html += `<tr>
        <td>${a.code}</td>
        <td class="acct-name" data-id="${a.id}" contenteditable="true" style="cursor:text">${a.name}</td>
        <td>${a.normal_side}</td>
        <td class="text-right">${formatCents(a.balance)}</td>
        <td class="text-center">
          <label class="toggle">
            <input type="checkbox" ${a.active ? 'checked' : ''} data-id="${a.id}" class="acct-toggle">
            <span class="toggle-slider"></span>
          </label>
        </td>
      </tr>`;
    }
  }
  html += '</table></div>';

  content.innerHTML = html;

  // Auto-fill normal side
  $('#new-type').addEventListener('change', () => {
    $('#new-normal').value = normalFor($('#new-type').value);
  });

  // Add account
  $('#add-acct-btn').addEventListener('click', async () => {
    try {
      await api('POST', '/api/accounts', {
        code: $('#new-code').value,
        name: $('#new-name').value,
        type: $('#new-type').value
      });
      invalidateAccounts();
      renderAccounts();
    } catch (e) {
      $('#acct-msg').innerHTML = `<div class="msg msg-error">${e.message}</div>`;
    }
  });

  // Toggle active
  content.querySelectorAll('.acct-toggle').forEach(toggle => {
    toggle.addEventListener('change', async () => {
      await api('PUT', `/api/accounts/${toggle.dataset.id}`, { active: toggle.checked });
      invalidateAccounts();
    });
  });

  // Inline name edit
  content.querySelectorAll('.acct-name').forEach(cell => {
    cell.addEventListener('blur', async () => {
      const newName = cell.textContent.trim();
      if (newName) {
        await api('PUT', `/api/accounts/${cell.dataset.id}`, { name: newName });
        invalidateAccounts();
      }
    });
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); cell.blur(); }
    });
  });
}
