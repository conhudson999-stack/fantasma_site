const path = require('path');
const express = require('express');
const db = require('./db');
const auth = require('./auth');

// ── Express App ───────────────────────────────────────────────────────
const app = express();
app.use(express.json());

auth.mountAuth(app);        // /api/login, /api/logout — must be BEFORE requireAuth
app.use(auth.requireAuth);  // everything below requires a valid cookie
// Served from 'static/' (NOT 'public/') so Vercel does not auto-serve these files
// from its CDN, which would bypass requireAuth. All requests route through the
// function and are gated, then Express serves the assets.
app.use(express.static(path.join(__dirname, 'static')));

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
const VALID_INQUIRY_STATUS = ['new', 'contacted', 'booked', 'lost'];
const VALID_TODO_PRIORITY = ['low', 'medium', 'high'];

function normalSideFor(type) {
  return (type === 'asset' || type === 'expense') ? 'debit' : 'credit';
}

// ══════════════════════════════════════════════════════════════════════
// ACCOUNTS API
// ══════════════════════════════════════════════════════════════════════

// GET /api/accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT a.*, COALESCE(SUM(jl.debit), 0) as total_debit, COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a LEFT JOIN journal_lines jl ON jl.account_id = a.id
      GROUP BY a.id ORDER BY a.code
    `);

    const accounts = rows.map(r => ({
      ...r,
      balance: r.normal_side === 'debit'
        ? r.total_debit - r.total_credit
        : r.total_credit - r.total_debit
    }));

    res.json(accounts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/accounts
app.post('/api/accounts', async (req, res) => {
  try {
    const { code, name, type } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({ error: 'code, name, and type are required' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const existing = await db.get('SELECT id FROM accounts WHERE code = ?', [code]);
    if (existing) {
      return res.status(409).json({ error: 'Account code already exists' });
    }

    const normal_side = normalSideFor(type);
    const result = await db.run(
      'INSERT INTO accounts (code, name, type, normal_side) VALUES (?, ?, ?, ?)',
      [code, name, type, normal_side]
    );

    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(account);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/accounts/:id
app.put('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [id]);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const { name, active } = req.body;
    const newName = name !== undefined ? name : account.name;
    const newActive = active !== undefined ? (active ? 1 : 0) : account.active;

    await db.run('UPDATE accounts SET name = ?, active = ? WHERE id = ?', [newName, newActive, id]);

    const updated = await db.get('SELECT * FROM accounts WHERE id = ?', [id]);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// JOURNAL ENTRIES API
// ══════════════════════════════════════════════════════════════════════

// POST /api/journal-entries
app.post('/api/journal-entries', async (req, res) => {
  try {
    const { date, memo, lines, classification } = req.body;

    // Validate header
    if (!date) return res.status(400).json({ error: 'date is required' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'date must be a valid ISO date (YYYY-MM-DD)' });
    if (!memo || !memo.trim()) return res.status(400).json({ error: 'memo is required' });
    if (!classification || !['operations', 'tax'].includes(classification)) {
      return res.status(400).json({ error: 'classification must be "operations" or "tax"' });
    }
    if (!Array.isArray(lines) || lines.length < 2) {
      return res.status(400).json({ error: 'At least 2 lines are required' });
    }

    // Validate lines
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      const account = await db.get('SELECT id FROM accounts WHERE id = ?', [line.account_id]);
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
    const tx = await db.transaction();
    let entryId;
    try {
      const header = await tx.execute({
        sql: 'INSERT INTO journal_entries (date, memo, classification, created_at) VALUES (?, ?, ?, ?)',
        args: [date, memo.trim(), classification, now()],
      });
      entryId = Number(header.lastInsertRowid);
      for (const line of lines) {
        await tx.execute({
          sql: 'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)',
          args: [entryId, line.account_id, line.debit || 0, line.credit || 0],
        });
      }
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      return res.status(500).json({ error: e.message });
    }

    const entry = await getEntryWithLines(entryId);
    res.status(201).json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper: get entry with lines
async function getEntryWithLines(id) {
  const entry = await db.get('SELECT * FROM journal_entries WHERE id = ?', [id]);
  if (!entry) return null;

  const lines = await db.all(`
    SELECT jl.*, a.name as account_name, a.code as account_code
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl.account_id
    WHERE jl.journal_entry_id = ?
    ORDER BY jl.id
  `, [id]);

  return { ...entry, lines };
}

// GET /api/journal-entries
app.get('/api/journal-entries', async (req, res) => {
  try {
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

    const entries = await db.all(`
      SELECT je.*,
        COUNT(jl.id) as line_count,
        SUM(jl.debit) as total_amount
      FROM journal_entries je
      LEFT JOIN journal_lines jl ON jl.journal_entry_id = je.id
      ${whereClause}
      GROUP BY je.id
      ORDER BY je.date DESC, je.id DESC
    `, params);

    res.json(entries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/journal-entries/:id
app.get('/api/journal-entries/:id', async (req, res) => {
  try {
    const entry = await getEntryWithLines(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Journal entry not found' });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/journal-entries/:id
app.put('/api/journal-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM journal_entries WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Journal entry not found' });

    const { date, memo, lines, classification } = req.body;

    // Same validation as POST
    if (!date) return res.status(400).json({ error: 'date is required' });
    if (!isValidDate(date)) return res.status(400).json({ error: 'date must be a valid ISO date (YYYY-MM-DD)' });
    if (!memo || !memo.trim()) return res.status(400).json({ error: 'memo is required' });
    if (!classification || !['operations', 'tax'].includes(classification)) {
      return res.status(400).json({ error: 'classification must be "operations" or "tax"' });
    }
    if (!Array.isArray(lines) || lines.length < 2) {
      return res.status(400).json({ error: 'At least 2 lines are required' });
    }

    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      const account = await db.get('SELECT id FROM accounts WHERE id = ?', [line.account_id]);
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

    const stmts = [
      { sql: 'DELETE FROM journal_lines WHERE journal_entry_id = ?', args: [id] },
      { sql: 'UPDATE journal_entries SET date = ?, memo = ?, classification = ? WHERE id = ?', args: [date, memo.trim(), classification, id] },
      ...lines.map((line) => ({
        sql: 'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)',
        args: [id, line.account_id, line.debit || 0, line.credit || 0],
      })),
    ];
    await db.batch(stmts);

    const entry = await getEntryWithLines(id);
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/journal-entries/:id
app.delete('/api/journal-entries/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM journal_entries WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Journal entry not found' });

    await db.run('DELETE FROM journal_entries WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// REPORTS API
// ══════════════════════════════════════════════════════════════════════

// GET /api/reports/trial-balance
app.get('/api/reports/trial-balance', async (req, res) => {
  try {
    const asOf = req.query.as_of || today();

    const rows = await db.all(`
      SELECT a.*,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
        AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date <= ?)
      GROUP BY a.id
      ORDER BY a.code
    `, [asOf]);

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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/income-statement
app.get('/api/reports/income-statement', async (req, res) => {
  try {
    const from = req.query.from || today().slice(0, 7) + '-01';
    const to = req.query.to || today();
    const classification = req.query.classification; // 'operations', 'tax', or undefined (both)

    let entryFilter = 'date >= ? AND date <= ?';
    const entryParams = [from, to];
    if (classification && ['operations', 'tax'].includes(classification)) {
      entryFilter += ' AND classification = ?';
      entryParams.push(classification);
    }

    const rows = await db.all(`
      SELECT a.*,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
        AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE ${entryFilter})
      WHERE a.type IN ('revenue', 'expense')
      GROUP BY a.id
      ORDER BY a.code
    `, entryParams);

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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/balance-sheet
app.get('/api/reports/balance-sheet', async (req, res) => {
  try {
    const asOf = req.query.as_of || today();
    const classification = req.query.classification;

    let entryFilter = 'date <= ?';
    const entryParams = [asOf];
    if (classification && ['operations', 'tax'].includes(classification)) {
      entryFilter += ' AND classification = ?';
      entryParams.push(classification);
    }

    const rows = await db.all(`
      SELECT a.*,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
        AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE ${entryFilter})
      GROUP BY a.id
      ORDER BY a.code
    `, entryParams);

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
    const incomeRows = await db.all(`
      SELECT a.type, a.normal_side,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
        AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE ${entryFilter})
      WHERE a.type IN ('revenue', 'expense')
      GROUP BY a.id
    `, entryParams);

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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/export
app.get('/api/reports/export', async (req, res) => {
  try {
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

      const rows = await db.all(`
        SELECT je.date, je.memo, a.code, a.name, jl.debit, jl.credit
        FROM journal_entries je
        JOIN journal_lines jl ON jl.journal_entry_id = je.id
        JOIN accounts a ON a.id = jl.account_id
        ${whereClause}
        ORDER BY je.date, je.id, jl.id
      `, params);

      for (const r of rows) {
        csv += `${r.date},"${r.memo.replace(/"/g, '""')}",${r.code},"${r.name.replace(/"/g, '""')}",${(r.debit / 100).toFixed(2)},${(r.credit / 100).toFixed(2)}\n`;
      }
    } else if (type === 'trial-balance') {
      filename = `trial-balance-${asOf}.csv`;
      csv = 'Code,Account,Debit,Credit\n';

      const rows = await db.all(`
        SELECT a.code, a.name, a.normal_side,
          COALESCE(SUM(jl.debit), 0) as total_debit,
          COALESCE(SUM(jl.credit), 0) as total_credit
        FROM accounts a
        LEFT JOIN journal_lines jl ON jl.account_id = a.id
          AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date <= ?)
        GROUP BY a.id ORDER BY a.code
      `, [asOf]);

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

      const rows = await db.all(`
        SELECT a.code, a.name, a.type, a.normal_side,
          COALESCE(SUM(jl.debit), 0) as total_debit,
          COALESCE(SUM(jl.credit), 0) as total_credit
        FROM accounts a
        LEFT JOIN journal_lines jl ON jl.account_id = a.id
          AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date >= ? AND date <= ?)
        WHERE a.type IN ('revenue', 'expense')
        GROUP BY a.id ORDER BY a.code
      `, [qFrom, qTo]);

      for (const r of rows) {
        const balance = r.normal_side === 'credit'
          ? r.total_credit - r.total_debit
          : r.total_debit - r.total_credit;
        csv += `${r.type},${r.code},"${r.name.replace(/"/g, '""')}",${(balance / 100).toFixed(2)}\n`;
      }
    } else if (type === 'balance-sheet') {
      filename = `balance-sheet-${asOf}.csv`;
      csv = 'Type,Code,Account,Balance\n';

      const rows = await db.all(`
        SELECT a.code, a.name, a.type, a.normal_side,
          COALESCE(SUM(jl.debit), 0) as total_debit,
          COALESCE(SUM(jl.credit), 0) as total_credit
        FROM accounts a
        LEFT JOIN journal_lines jl ON jl.account_id = a.id
          AND jl.journal_entry_id IN (SELECT id FROM journal_entries WHERE date <= ?)
        WHERE a.type IN ('asset', 'liability', 'equity')
        GROUP BY a.id ORDER BY a.code
      `, [asOf]);

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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/cash-flow
app.get('/api/reports/cash-flow', async (req, res) => {
  try {
    const from = req.query.from || today().slice(0, 7) + '-01';
    const to = req.query.to || today();
    const classification = req.query.classification;

    const validClass = classification && ['operations', 'tax'].includes(classification);
    let classFilter = '';
    const queryParams = [from, to];
    if (validClass) {
      classFilter = ' AND je.classification = ?';
      queryParams.push(classification);
    }

    // Get all journal lines with account info for the period
    const rows = await db.all(`
      SELECT a.code, a.name, a.type, a.normal_side, jl.debit, jl.credit
      FROM journal_lines jl
      JOIN accounts a ON a.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE je.date >= ? AND je.date <= ?${classFilter}
      ORDER BY a.code
    `, queryParams);

    // Classify into cash flow categories based on account type/code
    // Operating: revenue + expense accounts + AR + AP + unearned revenue
    // Investing: equipment/asset accounts (excluding cash/checking/digital payments)
    // Financing: equity + draws accounts
    const operating = [];
    const investing = [];
    const financing = [];
    let totalOperating = 0;
    let totalInvesting = 0;
    let totalFinancing = 0;

    // Aggregate by account
    const byAccount = {};
    for (const r of rows) {
      if (!byAccount[r.code]) byAccount[r.code] = { ...r, totalDebit: 0, totalCredit: 0 };
      byAccount[r.code].totalDebit += r.debit;
      byAccount[r.code].totalCredit += r.credit;
    }

    // Cash accounts (1000, 1010, 1020) are the result, not a category
    const cashCodes = ['1000', '1010', '1020'];

    for (const [code, a] of Object.entries(byAccount)) {
      if (cashCodes.includes(code)) continue;

      // Net cash effect: how this account's activity moved cash
      // For revenue (credit-normal): credits = cash in, debits = adjustments
      // For expense (debit-normal): debits = cash out, credits = adjustments
      let netCash = 0;
      if (a.type === 'revenue') {
        netCash = a.totalCredit - a.totalDebit; // positive = cash in
      } else if (a.type === 'expense') {
        netCash = -(a.totalDebit - a.totalCredit); // negative = cash out
      } else if (a.normal_side === 'debit') {
        netCash = -(a.totalDebit - a.totalCredit); // asset increase = cash out
      } else {
        netCash = a.totalCredit - a.totalDebit; // liability/equity increase = cash in
      }

      const item = { code, name: a.name, type: a.type, amount: netCash };

      if (a.type === 'revenue' || a.type === 'expense' || ['1100', '2000', '2100'].includes(code)) {
        operating.push(item);
        totalOperating += netCash;
      } else if (a.type === 'asset') {
        investing.push(item);
        totalInvesting += netCash;
      } else {
        financing.push(item);
        totalFinancing += netCash;
      }
    }

    // Beginning and ending cash balances
    const beginCashRow = await db.get(`
      SELECT COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
      FROM journal_lines jl
      JOIN accounts a ON a.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE a.code IN ('1000','1010','1020') AND je.date < ?${classFilter}
    `, [from, ...(validClass ? [classification] : [])]);
    const beginCash = beginCashRow.balance;

    const endCashRow = await db.get(`
      SELECT COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
      FROM journal_lines jl
      JOIN accounts a ON a.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE a.code IN ('1000','1010','1020') AND je.date <= ?${classFilter}
    `, [to, ...(validClass ? [classification] : [])]);
    const endCash = endCashRow.balance;

    const netChange = totalOperating + totalInvesting + totalFinancing;

    res.json({
      from, to,
      operating, investing, financing,
      totalOperating, totalInvesting, totalFinancing,
      netChange,
      beginningCash: beginCash,
      endingCash: endCash
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/monthly-summary
// Returns per-month revenue, expenses, and net income for charting.
app.get('/api/reports/monthly-summary', async (req, res) => {
  try {
    const from = req.query.from || '2000-01-01';
    const to = req.query.to || today();
    const classification = req.query.classification;

    let classFilter = '';
    const params = [from, to];
    if (classification && ['operations', 'tax'].includes(classification)) {
      classFilter = ' AND je.classification = ?';
      params.push(classification);
    }

    const rows = await db.all(`
      SELECT substr(je.date, 1, 7) as month, a.type,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM journal_entries je
      JOIN journal_lines jl ON jl.journal_entry_id = je.id
      JOIN accounts a ON a.id = jl.account_id
      WHERE je.date >= ? AND je.date <= ?${classFilter}
        AND a.type IN ('revenue', 'expense')
      GROUP BY month, a.type
      ORDER BY month
    `, params);

    const map = {};
    for (const r of rows) {
      if (!map[r.month]) map[r.month] = { month: r.month, revenue: 0, expenses: 0 };
      if (r.type === 'revenue') {
        map[r.month].revenue = r.total_credit - r.total_debit;
      } else {
        map[r.month].expenses = r.total_debit - r.total_credit;
      }
    }

    const months = Object.values(map).map(m => ({
      ...m,
      netIncome: m.revenue - m.expenses
    }));

    res.json({ from, to, months });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/dashboard/stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Cash balance (account code 1000)
    const cashRow = await db.get(`
      SELECT COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
      FROM journal_lines jl
      JOIN accounts a ON a.id = jl.account_id
      WHERE a.code = '1000'
    `);

    // Revenue this month
    const monthStart = today().slice(0, 7) + '-01';
    const revenueRow = await db.get(`
      SELECT COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0) as total
      FROM journal_lines jl
      JOIN accounts a ON a.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE a.type = 'revenue' AND je.date >= ?
    `, [monthStart]);

    // Open inquiries
    const inquiryRow = await db.get(
      "SELECT COUNT(*) as cnt FROM inquiries WHERE status IN ('new', 'contacted')"
    );

    res.json({
      cashBalance: cashRow.balance,
      revenueMTD: revenueRow.total,
      openInquiries: inquiryRow.cnt
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// INQUIRIES API
// ══════════════════════════════════════════════════════════════════════

// IMPORTANT: stats route BEFORE :id to avoid route shadowing
// GET /api/inquiries/stats
app.get('/api/inquiries/stats', async (req, res) => {
  try {
    const byStatus = await db.all(
      'SELECT status, COUNT(*) as count FROM inquiries GROUP BY status'
    );

    const bySource = await db.all(
      'SELECT source, COUNT(*) as count FROM inquiries WHERE source IS NOT NULL GROUP BY source'
    );

    const byInterest = await db.all(
      'SELECT interest, COUNT(*) as count FROM inquiries WHERE interest IS NOT NULL GROUP BY interest'
    );

    res.json({ byStatus, bySource, byInterest });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/inquiries
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, phone, source, interest, message, player_age, player_position, external_id, follow_up_date } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (external_id) {
      const dup = await db.get('SELECT id FROM inquiries WHERE external_id = ?', [external_id]);
      if (dup) return res.status(409).json({ error: 'An inquiry with this external_id already exists' });
    }

    const ts = now();
    const result = await db.run(`
      INSERT INTO inquiries (name, email, phone, source, interest, message, player_age, player_position, status, external_id, follow_up_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)
    `, [
      name.trim(),
      email || null, phone || null, source || null, interest || null,
      message || null, player_age || null, player_position || null,
      external_id || null, follow_up_date || null,
      ts, ts
    ]);

    const inquiry = await db.get('SELECT * FROM inquiries WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(inquiry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/inquiries
app.get('/api/inquiries', async (req, res) => {
  try {
    const { status, source } = req.query;

    let where = [];
    let params = [];

    if (status) { where.push('status = ?'); params.push(status); }
    if (source) { where.push('source = ?'); params.push(source); }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const inquiries = await db.all(`
      SELECT * FROM inquiries ${whereClause}
      ORDER BY
        CASE WHEN follow_up_date IS NULL THEN 1 ELSE 0 END,
        follow_up_date ASC,
        created_at DESC
    `, params);

    res.json(inquiries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/inquiries/:id
app.get('/api/inquiries/:id', async (req, res) => {
  try {
    const inquiry = await db.get('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const notes = await db.all(
      'SELECT * FROM inquiry_notes WHERE inquiry_id = ? ORDER BY created_at',
      [req.params.id]
    );

    res.json({ ...inquiry, notes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/inquiries/:id
app.put('/api/inquiries/:id', async (req, res) => {
  try {
    const inquiry = await db.get('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    if (req.body.status !== undefined && !VALID_INQUIRY_STATUS.includes(req.body.status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_INQUIRY_STATUS.join(', ')}` });
    }

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

    await db.run(`UPDATE inquiries SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await db.get('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/inquiries/:id
app.delete('/api/inquiries/:id', async (req, res) => {
  try {
    const inquiry = await db.get('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    await db.run('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/inquiries/:id/notes
app.post('/api/inquiries/:id/notes', async (req, res) => {
  try {
    const inquiry = await db.get('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const { note } = req.body;
    if (!note || !note.trim()) return res.status(400).json({ error: 'note is required' });

    const ts = now();
    const result = await db.run(
      'INSERT INTO inquiry_notes (inquiry_id, note, created_at) VALUES (?, ?, ?)',
      [req.params.id, note.trim(), ts]
    );

    const created = await db.get('SELECT * FROM inquiry_notes WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/inquiries/:id/notes/:noteId
app.delete('/api/inquiries/:id/notes/:noteId', async (req, res) => {
  try {
    const note = await db.get(
      'SELECT * FROM inquiry_notes WHERE id = ? AND inquiry_id = ?',
      [req.params.noteId, req.params.id]
    );

    if (!note) return res.status(404).json({ error: 'Note not found' });

    await db.run('DELETE FROM inquiry_notes WHERE id = ?', [req.params.noteId]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// TODOS API
// ══════════════════════════════════════════════════════════════════════

// GET /api/todos
app.get('/api/todos', async (req, res) => {
  try {
    const { completed } = req.query;
    let where = [];
    let params = [];

    if (completed !== undefined) {
      where.push('completed = ?');
      params.push(completed === 'true' ? 1 : 0);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const todos = await db.all(`
      SELECT * FROM todos ${whereClause}
      ORDER BY completed ASC,
        CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
        CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
        due_date ASC,
        created_at DESC
    `, params);

    res.json(todos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/todos
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description, priority, due_date } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    const p = priority || 'medium';
    if (!['low', 'medium', 'high'].includes(p)) {
      return res.status(400).json({ error: 'priority must be low, medium, or high' });
    }

    if (due_date && !isValidDate(due_date)) {
      return res.status(400).json({ error: 'due_date must be a valid date (YYYY-MM-DD)' });
    }

    const ts = now();
    const result = await db.run(`
      INSERT INTO todos (title, description, priority, due_date, completed, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `, [title.trim(), description || null, p, due_date || null, ts, ts]);

    const todo = await db.get('SELECT * FROM todos WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(todo);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/todos/:id
app.put('/api/todos/:id', async (req, res) => {
  try {
    const todo = await db.get('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    if (req.body.priority !== undefined && !VALID_TODO_PRIORITY.includes(req.body.priority)) {
      return res.status(400).json({ error: 'priority must be low, medium, or high' });
    }
    // due_date may be cleared (null/empty); otherwise it must be a valid date.
    if (req.body.due_date !== undefined && req.body.due_date !== null && req.body.due_date !== ''
        && !isValidDate(req.body.due_date)) {
      return res.status(400).json({ error: 'due_date must be a valid date (YYYY-MM-DD)' });
    }

    const fields = ['title', 'description', 'priority', 'due_date', 'completed'];
    const updates = [];
    const params = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        params.push(f === 'completed' ? (req.body[f] ? 1 : 0) : req.body[f]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    params.push(now());
    params.push(req.params.id);

    await db.run(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await db.get('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const todo = await db.get('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    await db.run('DELETE FROM todos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start Server ──────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Fantasma Dashboard running at http://localhost:${PORT}`));
}

module.exports = app;
