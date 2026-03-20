const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

// ── Database Setup ────────────────────────────────────────────────────
const dbPath = path.join(__dirname, 'fantasma.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ── Create Tables ─────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
    normal_side TEXT NOT NULL CHECK (normal_side IN ('debit','credit')),
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    memo TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS journal_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_entry_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    debit INTEGER NOT NULL DEFAULT 0,
    credit INTEGER NOT NULL DEFAULT 0,
    CHECK ((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT,
    interest TEXT,
    message TEXT,
    player_age INTEGER,
    player_position TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    external_id TEXT UNIQUE,
    follow_up_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiry_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
  );
`);

// ── Seed Accounts ─────────────────────────────────────────────────────
const accountCount = db.prepare('SELECT COUNT(*) as cnt FROM accounts').get().cnt;
if (accountCount === 0) {
  const seed = require('./seed.json');
  const insert = db.prepare(
    'INSERT INTO accounts (code, name, type, normal_side) VALUES (?, ?, ?, ?)'
  );
  const seedAll = db.transaction((accounts) => {
    for (const a of accounts) {
      insert.run(a.code, a.name, a.type, a.normal_side);
    }
  });
  seedAll(seed.accounts);
  console.log(`Seeded ${seed.accounts.length} accounts`);
}

// ── Integrity Check ───────────────────────────────────────────────────
const unbalanced = db.prepare(
  'SELECT journal_entry_id FROM journal_lines GROUP BY journal_entry_id HAVING SUM(debit) != SUM(credit)'
).all();
if (unbalanced.length > 0) {
  console.warn('WARNING: Unbalanced journal entries:', unbalanced.map(r => r.journal_entry_id));
}

// ── Express App ───────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ───────────────────────────────────────────────────────────
function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

const VALID_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

function normalSideFor(type) {
  return (type === 'asset' || type === 'expense') ? 'debit' : 'credit';
}

// ══════════════════════════════════════════════════════════════════════
// ACCOUNTS API
// ══════════════════════════════════════════════════════════════════════

// GET /api/accounts
app.get('/api/accounts', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, COALESCE(SUM(jl.debit), 0) as total_debit, COALESCE(SUM(jl.credit), 0) as total_credit
    FROM accounts a LEFT JOIN journal_lines jl ON jl.account_id = a.id
    GROUP BY a.id ORDER BY a.code
  `).all();

  const accounts = rows.map(r => ({
    ...r,
    balance: r.normal_side === 'debit'
      ? r.total_debit - r.total_credit
      : r.total_credit - r.total_debit
  }));

  res.json(accounts);
});

// POST /api/accounts
app.post('/api/accounts', (req, res) => {
  const { code, name, type } = req.body;

  if (!code || !name || !type) {
    return res.status(400).json({ error: 'code, name, and type are required' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }

  const existing = db.prepare('SELECT id FROM accounts WHERE code = ?').get(code);
  if (existing) {
    return res.status(409).json({ error: 'Account code already exists' });
  }

  const normal_side = normalSideFor(type);
  const result = db.prepare(
    'INSERT INTO accounts (code, name, type, normal_side) VALUES (?, ?, ?, ?)'
  ).run(code, name, type, normal_side);

  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(account);
});

// PUT /api/accounts/:id
app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const { name, active } = req.body;
  const newName = name !== undefined ? name : account.name;
  const newActive = active !== undefined ? (active ? 1 : 0) : account.active;

  db.prepare('UPDATE accounts SET name = ?, active = ? WHERE id = ?').run(newName, newActive, id);

  const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
  res.json(updated);
});

// ══════════════════════════════════════════════════════════════════════
// JOURNAL ENTRIES API
// ══════════════════════════════════════════════════════════════════════

// POST /api/journal-entries
app.post('/api/journal-entries', (req, res) => {
  const { date, memo, lines } = req.body;

  // Validate header
  if (!date) return res.status(400).json({ error: 'date is required' });
  if (!isValidDate(date)) return res.status(400).json({ error: 'date must be a valid ISO date (YYYY-MM-DD)' });
  if (!memo || !memo.trim()) return res.status(400).json({ error: 'memo is required' });
  if (!Array.isArray(lines) || lines.length < 2) {
    return res.status(400).json({ error: 'At least 2 lines are required' });
  }

  // Validate lines
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    const account = db.prepare('SELECT id FROM accounts WHERE id = ?').get(line.account_id);
    if (!account) return res.status(400).json({ error: `Invalid account_id: ${line.account_id}` });

    const debit = line.debit || 0;
    const credit = line.credit || 0;

    if (!Number.isInteger(debit) || !Number.isInteger(credit)) {
      return res.status(400).json({ error: 'debit and credit must be integers' });
    }
    if (debit < 0 || credit < 0) {
      return res.status(400).json({ error: 'Amounts must be positive' });
    }
    if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      return res.status(400).json({ error: 'Each line must have debit > 0 XOR credit > 0' });
    }

    totalDebit += debit;
    totalCredit += credit;
  }

  if (totalDebit !== totalCredit) {
    return res.status(400).json({ error: `Debits ($${(totalDebit/100).toFixed(2)}) must equal credits ($${(totalCredit/100).toFixed(2)})` });
  }

  // Insert in transaction
  const createEntry = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO journal_entries (date, memo, created_at) VALUES (?, ?, ?)'
    ).run(date, memo.trim(), now());

    const entryId = result.lastInsertRowid;
    const insertLine = db.prepare(
      'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)'
    );

    for (const line of lines) {
      insertLine.run(entryId, line.account_id, line.debit || 0, line.credit || 0);
    }

    return entryId;
  });

  const entryId = createEntry();
  const entry = getEntryWithLines(entryId);
  res.status(201).json(entry);
});

// Helper: get entry with lines
function getEntryWithLines(id) {
  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
  if (!entry) return null;

  const lines = db.prepare(`
    SELECT jl.*, a.name as account_name, a.code as account_code
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl.account_id
    WHERE jl.journal_entry_id = ?
    ORDER BY jl.id
  `).all(id);

  return { ...entry, lines };
}

// GET /api/journal-entries
app.get('/api/journal-entries', (req, res) => {
  const { from, to, account_id } = req.query;

  let where = [];
  let params = [];

  if (from) { where.push('je.date >= ?'); params.push(from); }
  if (to) { where.push('je.date <= ?'); params.push(to); }
  if (account_id) {
    where.push('je.id IN (SELECT journal_entry_id FROM journal_lines WHERE account_id = ?)');
    params.push(account_id);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const entries = db.prepare(`
    SELECT je.*,
      COUNT(jl.id) as line_count,
      SUM(jl.debit) as total_amount
    FROM journal_entries je
    LEFT JOIN journal_lines jl ON jl.journal_entry_id = je.id
    ${whereClause}
    GROUP BY je.id
    ORDER BY je.date DESC, je.id DESC
  `).all(...params);

  res.json(entries);
});

// GET /api/journal-entries/:id
app.get('/api/journal-entries/:id', (req, res) => {
  const entry = getEntryWithLines(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Journal entry not found' });
  res.json(entry);
});

// PUT /api/journal-entries/:id
app.put('/api/journal-entries/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Journal entry not found' });

  const { date, memo, lines } = req.body;

  // Same validation as POST
  if (!date) return res.status(400).json({ error: 'date is required' });
  if (!isValidDate(date)) return res.status(400).json({ error: 'date must be a valid ISO date (YYYY-MM-DD)' });
  if (!memo || !memo.trim()) return res.status(400).json({ error: 'memo is required' });
  if (!Array.isArray(lines) || lines.length < 2) {
    return res.status(400).json({ error: 'At least 2 lines are required' });
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    const account = db.prepare('SELECT id FROM accounts WHERE id = ?').get(line.account_id);
    if (!account) return res.status(400).json({ error: `Invalid account_id: ${line.account_id}` });

    const debit = line.debit || 0;
    const credit = line.credit || 0;

    if (!Number.isInteger(debit) || !Number.isInteger(credit)) {
      return res.status(400).json({ error: 'debit and credit must be integers' });
    }
    if (debit < 0 || credit < 0) {
      return res.status(400).json({ error: 'Amounts must be positive' });
    }
    if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      return res.status(400).json({ error: 'Each line must have debit > 0 XOR credit > 0' });
    }

    totalDebit += debit;
    totalCredit += credit;
  }

  if (totalDebit !== totalCredit) {
    return res.status(400).json({ error: `Debits ($${(totalDebit/100).toFixed(2)}) must equal credits ($${(totalCredit/100).toFixed(2)})` });
  }

  const updateEntry = db.transaction(() => {
    db.prepare('DELETE FROM journal_lines WHERE journal_entry_id = ?').run(id);
    db.prepare('UPDATE journal_entries SET date = ?, memo = ? WHERE id = ?').run(date, memo.trim(), id);

    const insertLine = db.prepare(
      'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)'
    );
    for (const line of lines) {
      insertLine.run(id, line.account_id, line.debit || 0, line.credit || 0);
    }
  });

  updateEntry();
  const entry = getEntryWithLines(id);
  res.json(entry);
});

// DELETE /api/journal-entries/:id
app.delete('/api/journal-entries/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Journal entry not found' });

  db.prepare('DELETE FROM journal_entries WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ══════════════════════════════════════════════════════════════════════
// REPORTS API
// ══════════════════════════════════════════════════════════════════════

// GET /api/reports/trial-balance
app.get('/api/reports/trial-balance', (req, res) => {
  const asOf = req.query.as_of || today();

  const rows = db.prepare(`
    SELECT a.*,
      COALESCE(SUM(jl.debit), 0) as total_debit,
      COALESCE(SUM(jl.credit), 0) as total_credit
    FROM accounts a
    LEFT JOIN journal_lines jl ON jl.account_id = a.id
      AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date <= ?)
    GROUP BY a.id
    ORDER BY a.code
  `).all(asOf);

  let totalDebits = 0;
  let totalCredits = 0;

  const accounts = rows.map(r => {
    let debit_balance = 0;
    let credit_balance = 0;

    if (r.normal_side === 'debit') {
      const net = r.total_debit - r.total_credit;
      if (net >= 0) debit_balance = net;
      else credit_balance = -net;
    } else {
      const net = r.total_credit - r.total_debit;
      if (net >= 0) credit_balance = net;
      else debit_balance = -net;
    }

    totalDebits += debit_balance;
    totalCredits += credit_balance;

    return { ...r, debit_balance, credit_balance };
  });

  res.json({ as_of: asOf, accounts, totalDebits, totalCredits });
});

// GET /api/reports/income-statement
app.get('/api/reports/income-statement', (req, res) => {
  const from = req.query.from || today().slice(0, 7) + '-01';
  const to = req.query.to || today();

  const rows = db.prepare(`
    SELECT a.*,
      COALESCE(SUM(jl.debit), 0) as total_debit,
      COALESCE(SUM(jl.credit), 0) as total_credit
    FROM accounts a
    LEFT JOIN journal_lines jl ON jl.account_id = a.id
      AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date >= ? AND date <= ?)
    WHERE a.type IN ('revenue', 'expense')
    GROUP BY a.id
    ORDER BY a.code
  `).all(from, to);

  const revenue = [];
  const expenses = [];
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const r of rows) {
    const balance = r.normal_side === 'credit'
      ? r.total_credit - r.total_debit
      : r.total_debit - r.total_credit;

    const item = { ...r, balance };

    if (r.type === 'revenue') {
      revenue.push(item);
      totalRevenue += balance;
    } else {
      expenses.push(item);
      totalExpenses += balance;
    }
  }

  res.json({
    from, to,
    revenue, expenses,
    totalRevenue, totalExpenses,
    netIncome: totalRevenue - totalExpenses
  });
});

// GET /api/reports/balance-sheet
app.get('/api/reports/balance-sheet', (req, res) => {
  const asOf = req.query.as_of || today();

  const rows = db.prepare(`
    SELECT a.*,
      COALESCE(SUM(jl.debit), 0) as total_debit,
      COALESCE(SUM(jl.credit), 0) as total_credit
    FROM accounts a
    LEFT JOIN journal_lines jl ON jl.account_id = a.id
      AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date <= ?)
    GROUP BY a.id
    ORDER BY a.code
  `).all(asOf);

  const assets = [];
  const liabilities = [];
  const equity = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const r of rows) {
    const balance = r.normal_side === 'debit'
      ? r.total_debit - r.total_credit
      : r.total_credit - r.total_debit;

    const item = { ...r, balance };

    if (r.type === 'asset') {
      assets.push(item);
      totalAssets += balance;
    } else if (r.type === 'liability') {
      liabilities.push(item);
      totalLiabilities += balance;
    } else if (r.type === 'equity') {
      equity.push(item);
      totalEquity += balance;
    }
  }

  // Calculate net income (revenue - expenses) to include in equity
  const incomeRows = db.prepare(`
    SELECT a.type, a.normal_side,
      COALESCE(SUM(jl.debit), 0) as total_debit,
      COALESCE(SUM(jl.credit), 0) as total_credit
    FROM accounts a
    LEFT JOIN journal_lines jl ON jl.account_id = a.id
      AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date <= ?)
    WHERE a.type IN ('revenue', 'expense')
    GROUP BY a.id
  `).all(asOf);

  let netIncome = 0;
  for (const r of incomeRows) {
    const balance = r.normal_side === 'credit'
      ? r.total_credit - r.total_debit
      : r.total_debit - r.total_credit;
    if (r.type === 'revenue') netIncome += balance;
    else netIncome -= balance;
  }

  totalEquity += netIncome;

  res.json({
    as_of: asOf,
    assets, liabilities, equity,
    totalAssets, totalLiabilities, totalEquity,
    netIncome,
    balanced: totalAssets === totalLiabilities + totalEquity
  });
});

// GET /api/reports/export
app.get('/api/reports/export', (req, res) => {
  const { type, from, to } = req.query;
  const asOf = req.query.as_of || to || today();

  if (!type) return res.status(400).json({ error: 'type parameter required' });

  let csv = '';
  let filename = '';

  if (type === 'journal') {
    filename = `journal-${from || 'all'}-to-${to || 'all'}.csv`;
    csv = 'Date,Memo,Account Code,Account Name,Debit,Credit\n';

    let where = [];
    let params = [];
    if (from) { where.push('je.date >= ?'); params.push(from); }
    if (to) { where.push('je.date <= ?'); params.push(to); }
    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const rows = db.prepare(`
      SELECT je.date, je.memo, a.code, a.name, jl.debit, jl.credit
      FROM journal_entries je
      JOIN journal_lines jl ON jl.journal_entry_id = je.id
      JOIN accounts a ON a.id = jl.account_id
      ${whereClause}
      ORDER BY je.date, je.id, jl.id
    `).all(...params);

    for (const r of rows) {
      csv += `${r.date},"${r.memo.replace(/"/g, '""')}",${r.code},"${r.name.replace(/"/g, '""')}",${(r.debit / 100).toFixed(2)},${(r.credit / 100).toFixed(2)}\n`;
    }
  } else if (type === 'trial-balance') {
    filename = `trial-balance-${asOf}.csv`;
    csv = 'Code,Account,Debit,Credit\n';

    const rows = db.prepare(`
      SELECT a.code, a.name, a.normal_side,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
        AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date <= ?)
      GROUP BY a.id ORDER BY a.code
    `).all(asOf);

    for (const r of rows) {
      let db_bal = 0, cr_bal = 0;
      if (r.normal_side === 'debit') {
        const net = r.total_debit - r.total_credit;
        if (net >= 0) db_bal = net; else cr_bal = -net;
      } else {
        const net = r.total_credit - r.total_debit;
        if (net >= 0) cr_bal = net; else db_bal = -net;
      }
      csv += `${r.code},"${r.name.replace(/"/g, '""')}",${(db_bal / 100).toFixed(2)},${(cr_bal / 100).toFixed(2)}\n`;
    }
  } else if (type === 'income-statement') {
    filename = `income-statement-${from || 'all'}-to-${to || 'all'}.csv`;
    csv = 'Type,Code,Account,Amount\n';

    const qFrom = from || today().slice(0, 7) + '-01';
    const qTo = to || today();

    const rows = db.prepare(`
      SELECT a.code, a.name, a.type, a.normal_side,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
        AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date >= ? AND date <= ?)
      WHERE a.type IN ('revenue', 'expense')
      GROUP BY a.id ORDER BY a.code
    `).all(qFrom, qTo);

    for (const r of rows) {
      const balance = r.normal_side === 'credit'
        ? r.total_credit - r.total_debit
        : r.total_debit - r.total_credit;
      csv += `${r.type},${r.code},"${r.name.replace(/"/g, '""')}",${(balance / 100).toFixed(2)}\n`;
    }
  } else if (type === 'balance-sheet') {
    filename = `balance-sheet-${asOf}.csv`;
    csv = 'Type,Code,Account,Balance\n';

    const rows = db.prepare(`
      SELECT a.code, a.name, a.type, a.normal_side,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
        AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date <= ?)
      WHERE a.type IN ('asset', 'liability', 'equity')
      GROUP BY a.id ORDER BY a.code
    `).all(asOf);

    for (const r of rows) {
      const balance = r.normal_side === 'debit'
        ? r.total_debit - r.total_credit
        : r.total_credit - r.total_debit;
      csv += `${r.type},${r.code},"${r.name.replace(/"/g, '""')}",${(balance / 100).toFixed(2)}\n`;
    }
  } else {
    return res.status(400).json({ error: 'Invalid type. Use: journal, trial-balance, income-statement, balance-sheet' });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// GET /api/dashboard/stats
app.get('/api/dashboard/stats', (req, res) => {
  // Cash balance (account code 1000)
  const cashRow = db.prepare(`
    SELECT COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl.account_id
    WHERE a.code = '1000'
  `).get();

  // Revenue this month
  const monthStart = today().slice(0, 7) + '-01';
  const revenueRow = db.prepare(`
    SELECT COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0) as total
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE a.type = 'revenue' AND je.date >= ?
  `).get(monthStart);

  // Open inquiries
  const inquiryRow = db.prepare(
    "SELECT COUNT(*) as cnt FROM inquiries WHERE status IN ('new', 'contacted')"
  ).get();

  res.json({
    cashBalance: cashRow.balance,
    revenueMTD: revenueRow.total,
    openInquiries: inquiryRow.cnt
  });
});

// ══════════════════════════════════════════════════════════════════════
// INQUIRIES API
// ══════════════════════════════════════════════════════════════════════

// IMPORTANT: stats route BEFORE :id to avoid route shadowing
// GET /api/inquiries/stats
app.get('/api/inquiries/stats', (req, res) => {
  const byStatus = db.prepare(
    'SELECT status, COUNT(*) as count FROM inquiries GROUP BY status'
  ).all();

  const bySource = db.prepare(
    'SELECT source, COUNT(*) as count FROM inquiries WHERE source IS NOT NULL GROUP BY source'
  ).all();

  const byInterest = db.prepare(
    'SELECT interest, COUNT(*) as count FROM inquiries WHERE interest IS NOT NULL GROUP BY interest'
  ).all();

  res.json({ byStatus, bySource, byInterest });
});

// POST /api/inquiries
app.post('/api/inquiries', (req, res) => {
  const { name, email, phone, source, interest, message, player_age, player_position, external_id, follow_up_date } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const ts = now();
  const result = db.prepare(`
    INSERT INTO inquiries (name, email, phone, source, interest, message, player_age, player_position, status, external_id, follow_up_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)
  `).run(
    name.trim(),
    email || null, phone || null, source || null, interest || null,
    message || null, player_age || null, player_position || null,
    external_id || null, follow_up_date || null,
    ts, ts
  );

  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(inquiry);
});

// GET /api/inquiries
app.get('/api/inquiries', (req, res) => {
  const { status, source } = req.query;

  let where = [];
  let params = [];

  if (status) { where.push('status = ?'); params.push(status); }
  if (source) { where.push('source = ?'); params.push(source); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const inquiries = db.prepare(`
    SELECT * FROM inquiries ${whereClause}
    ORDER BY
      CASE WHEN follow_up_date IS NULL THEN 1 ELSE 0 END,
      follow_up_date ASC,
      created_at DESC
  `).all(...params);

  res.json(inquiries);
});

// GET /api/inquiries/:id
app.get('/api/inquiries/:id', (req, res) => {
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

  const notes = db.prepare(
    'SELECT * FROM inquiry_notes WHERE inquiry_id = ? ORDER BY created_at'
  ).all(req.params.id);

  res.json({ ...inquiry, notes });
});

// PUT /api/inquiries/:id
app.put('/api/inquiries/:id', (req, res) => {
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

  const fields = ['name', 'email', 'phone', 'source', 'interest', 'message', 'player_age', 'player_position', 'status', 'follow_up_date'];
  const updates = [];
  const params = [];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = ?');
  params.push(now());
  params.push(req.params.id);

  db.prepare(`UPDATE inquiries SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/inquiries/:id
app.delete('/api/inquiries/:id', (req, res) => {
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

  db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// POST /api/inquiries/:id/notes
app.post('/api/inquiries/:id/notes', (req, res) => {
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

  const { note } = req.body;
  if (!note || !note.trim()) return res.status(400).json({ error: 'note is required' });

  const ts = now();
  const result = db.prepare(
    'INSERT INTO inquiry_notes (inquiry_id, note, created_at) VALUES (?, ?, ?)'
  ).run(req.params.id, note.trim(), ts);

  const created = db.prepare('SELECT * FROM inquiry_notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// DELETE /api/inquiries/:id/notes/:noteId
app.delete('/api/inquiries/:id/notes/:noteId', (req, res) => {
  const note = db.prepare(
    'SELECT * FROM inquiry_notes WHERE id = ? AND inquiry_id = ?'
  ).get(req.params.noteId, req.params.id);

  if (!note) return res.status(404).json({ error: 'Note not found' });

  db.prepare('DELETE FROM inquiry_notes WHERE id = ?').run(req.params.noteId);
  res.json({ message: 'Deleted' });
});

// ── Start Server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fantasma Dashboard running at http://localhost:${PORT}`);
});
