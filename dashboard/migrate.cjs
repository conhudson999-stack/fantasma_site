// One-time setup + data migration. Run manually:
//   node dashboard/migrate.cjs            -> builds/updates the LOCAL target db.js points at
//   (with TURSO_* env set)                -> builds/updates the Turso db, copying local rows in
const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

// Load .env.local from repo root if present (documented project pattern).
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const seed = require('./seed.json');

async function setupSchema(target) {
  await target.executeMultiple(`
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
      name TEXT NOT NULL, email TEXT, phone TEXT, source TEXT, interest TEXT, message TEXT,
      player_age INTEGER, player_position TEXT,
      status TEXT NOT NULL DEFAULT 'new', external_id TEXT UNIQUE, follow_up_date TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
      due_date TEXT, completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inquiry_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
    );
  `);

  // Column migration: classification on journal_entries (idempotent probe).
  try {
    await target.execute('SELECT classification FROM journal_entries LIMIT 1');
  } catch {
    await target.execute("ALTER TABLE journal_entries ADD COLUMN classification TEXT NOT NULL DEFAULT 'operations' CHECK (classification IN ('operations','tax'))");
    console.log('Added classification column');
  }

  // Seed accounts if empty.
  const cnt = (await target.execute('SELECT COUNT(*) AS c FROM accounts')).rows[0].c;
  if (Number(cnt) === 0) {
    for (const a of seed.accounts) {
      await target.execute({ sql: 'INSERT INTO accounts (code, name, type, normal_side) VALUES (?, ?, ?, ?)', args: [a.code, a.name, a.type, a.normal_side] });
    }
    console.log(`Seeded ${seed.accounts.length} accounts`);
  }
  // Mileage account migration.
  const mileage = (await target.execute("SELECT id FROM accounts WHERE code = '5100'")).rows[0];
  if (!mileage) {
    await target.execute("INSERT INTO accounts (code, name, type, normal_side) VALUES ('5100', 'Mileage Expense', 'expense', 'debit')");
    console.log('Added Mileage Expense account (5100)');
  }
}

async function copyRows(source, target) {
  // Copy in FK-safe order. Skip if target table already has rows (idempotent).
  const tables = ['accounts', 'journal_entries', 'journal_lines', 'inquiries', 'inquiry_notes', 'todos'];
  for (const t of tables) {
    const tgtCount = Number((await target.execute(`SELECT COUNT(*) AS c FROM ${t}`)).rows[0].c);
    if (tgtCount > 0) { console.log(`${t}: target already has ${tgtCount} rows, skipping copy`); continue; }
    const rs = await source.execute(`SELECT * FROM ${t}`);
    if (rs.rows.length === 0) { console.log(`${t}: source empty`); continue; }
    const cols = rs.columns;
    const placeholders = cols.map(() => '?').join(', ');
    for (const row of rs.rows) {
      const args = cols.map((c) => row[c]);
      await target.execute({ sql: `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${placeholders})`, args });
    }
    console.log(`${t}: copied ${rs.rows.length} rows`);
  }
}

(async () => {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const target = tursoUrl
    ? createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })
    : createClient({ url: `file:${path.join(__dirname, 'fantasma.db')}` });

  await setupSchema(target);

  // If migrating to Turso, copy from the existing local file DB.
  if (tursoUrl) {
    const source = createClient({ url: `file:${path.join(__dirname, 'fantasma.db')}` });
    await copyRows(source, target);
  }

  // Verify counts.
  for (const t of ['accounts', 'journal_entries', 'journal_lines', 'inquiries', 'inquiry_notes', 'todos']) {
    const c = (await target.execute(`SELECT COUNT(*) AS c FROM ${t}`)).rows[0].c;
    console.log(`${t}: ${c} rows`);
  }
  console.log('Migration complete.');
})().catch((e) => { console.error(e); process.exit(1); });
