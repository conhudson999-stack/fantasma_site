# Dashboard Cloud Access Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Fantasma dashboard reachable from any phone at `https://dashboard.fantasmafootball.com`, always-on and free, behind a single-password login, with its data in a Turso cloud database.

**Architecture:** The existing Express app runs unchanged in structure but (1) talks to a cloud SQLite database (Turso/libSQL) through one async data-access module that also works locally against a `file:` DB, (2) sits behind a signed-cookie auth middleware, and (3) is exported as a single catch-all Vercel serverless function in its own Vercel project rooted at `dashboard/`.

**Tech Stack:** Node.js (CommonJS), Express 5, `@libsql/client` (Turso), Node built-in `crypto` (auth) and `node:test` (tests), Vercel (hosting), Turso (DB).

**Spec:** `docs/superpowers/specs/2026-06-10-dashboard-cloud-access-design.md`

**Branch:** `dashboard-cloud-access`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `dashboard/package.json` | **New.** Declares the dashboard as its own package + Vercel project root; deps (`@libsql/client`, `express`); no `"type":"module"` (stays CommonJS). |
| `dashboard/db.js` | **New.** Async data-access wrapper over `@libsql/client`. `get/all/run/batch/transaction`. Picks Turso vs local `file:` from env. Normalizes rows to plain objects. |
| `dashboard/migrate.cjs` | **New.** One-time, run manually: creates schema, applies column-migrations, seeds accounts, and copies existing rows from the local `file:` DB into the target DB. Loads `.env.local`. |
| `dashboard/auth.js` | **New.** Cookie sign/verify (HMAC + expiry), cookie parser, login/logout routes, `requireAuth` middleware, inline login page. |
| `dashboard/dashboard.cjs` | **Modify.** Swap `better-sqlite3` → `db.js` (all handlers async); remove schema/seed/migration from import; mount auth; `module.exports = app` + guarded `listen`. |
| `dashboard/api/index.js` | **New.** One line: `module.exports = require('../dashboard.cjs');` — the Vercel function handler. |
| `dashboard/vercel.json` | **New.** Rewrite `/(.*)` → `/api/index`. |
| `dashboard/public/app.js` | **Modify.** `api()` helper: on HTTP 401, reload (server serves login page). |
| `dashboard/test/*.test.js` | **New.** `node:test` unit tests for `db.js` and `auth.js`. |

**Conventions for this codebase:** vanilla CommonJS, 2-space indent, integer cents for money, no test framework currently → use Node's built-in `node:test` (no new dependency). Commit after each task.

**Shell note:** the owner's machine is Windows 11 / PowerShell. The `curl`/`/dev/null`/inline-`VAR=x` smoke-test commands below are written for bash — run them via the **Bash tool** (available), or translate to PowerShell. Turso CLI steps assume WSL or the Windows installer.

**Env-var note:** `db.js` selects Turso vs local by the **presence of `TURSO_DATABASE_URL`** (no separate `DB_TARGET` flag). Do not add a `DB_TARGET` env var — it would be unused.

---

## Chunk 1: Local libSQL migration

Goal of this chunk: the dashboard runs **exactly as today** but on `@libsql/client` against a local `file:` DB, with schema/seed moved into `migrate.cjs`. Fully testable locally; no cloud yet.

### Task 1.1: Scaffold the dashboard package + test runner

**Files:**
- Create: `dashboard/package.json`

- [ ] **Step 1: Create `dashboard/package.json`**

```json
{
  "name": "fantasma-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node dashboard.cjs",
    "test": "node --test",
    "migrate": "node migrate.cjs"
  },
  "dependencies": {
    "@libsql/client": "^0.14.0",
    "express": "^5.2.1"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run (from repo root): `npm install --prefix dashboard`
Expected: `@libsql/client` and `express` install under `dashboard/node_modules`. (`@libsql/client` is pure-JS over HTTP/file — no native build step, unlike `better-sqlite3`.)

- [ ] **Step 3: Verify the package resolves**

Run: `node -e "require('./dashboard/node_modules/@libsql/client'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 4: Commit**

```bash
git add dashboard/package.json
git commit -m "chore(dashboard): add package.json with libsql + express"
```

Note: do **not** commit `dashboard/node_modules` (already covered by the repo's root `.gitignore` for `node_modules`; verify with `git status` that it is ignored — if not, add `node_modules/` to a `dashboard/.gitignore`).

---

### Task 1.2: Create the async DB wrapper (`db.js`) with tests

**Files:**
- Create: `dashboard/db.js`
- Test: `dashboard/test/db.test.js`

The wrapper hides `@libsql/client` behind a small surface that mirrors how the routes already think (`get` → one row, `all` → rows, `run` → `{lastInsertRowid, changes}`). It **normalizes rows to plain objects** so the existing `{ ...r, balance }` spreads in the reports code keep working (raw libSQL `Row` objects can carry array indices when spread).

- [ ] **Step 1: Write the failing test**

`dashboard/test/db.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

// Point db.js at a throwaway file DB BEFORE requiring it.
const tmp = path.join(os.tmpdir(), `dbtest-${process.pid}.db`);
process.env.DASHBOARD_DB_FILE = tmp;       // db.js honors this override for tests
delete process.env.TURSO_DATABASE_URL;

const db = require('../db');

test('run returns numeric lastInsertRowid and changes; get/all return plain objects', async () => {
  await db.run('CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, amt INTEGER)');
  const r1 = await db.run('INSERT INTO t (name, amt) VALUES (?, ?)', ['a', 100]);
  assert.strictEqual(typeof r1.lastInsertRowid, 'number');
  assert.strictEqual(r1.lastInsertRowid, 1);
  assert.strictEqual(r1.changes, 1);

  const one = await db.get('SELECT * FROM t WHERE id = ?', [1]);
  assert.deepStrictEqual({ ...one }, { id: 1, name: 'a', amt: 100 }); // spread yields only named cols
  assert.strictEqual(await db.get('SELECT * FROM t WHERE id = ?', [999]), undefined);

  const rows = await db.all('SELECT * FROM t ORDER BY id');
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].amt, 100);
});

test('transaction commits header+children atomically and exposes lastInsertRowid', async () => {
  const tx = await db.transaction();
  const ins = await tx.execute({ sql: 'INSERT INTO t (name, amt) VALUES (?, ?)', args: ['b', 200] });
  const newId = Number(ins.lastInsertRowid);
  await tx.execute({ sql: 'UPDATE t SET amt = amt + 1 WHERE id = ?', args: [newId] });
  await tx.commit();
  const row = await db.get('SELECT amt FROM t WHERE id = ?', [newId]);
  assert.strictEqual(row.amt, 201);
});

test.after(() => { try { fs.unlinkSync(tmp); } catch {} });
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `node --test dashboard/test/db.test.js`
Expected: FAIL — `Cannot find module '../db'`.

- [ ] **Step 3: Implement `dashboard/db.js`**

```js
const path = require('path');
const { createClient } = require('@libsql/client');

function makeClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  // Local dev/tests: absolute file path so the cwd doesn't matter.
  const file = process.env.DASHBOARD_DB_FILE || path.join(__dirname, 'fantasma.db');
  return createClient({ url: `file:${file}` });
}

const client = makeClient();

// Normalize each row to a plain object keyed by column name (defensive; keeps
// the reports code's `{ ...r, balance }` spreads predictable across driver versions).
function toObj(row, columns) {
  const o = {};
  for (const c of columns) o[c] = row[c];
  return o;
}

async function get(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return rs.rows.length ? toObj(rs.rows[0], rs.columns) : undefined;
}

async function all(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return rs.rows.map((r) => toObj(r, rs.columns));
}

async function run(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return {
    lastInsertRowid: rs.lastInsertRowid != null ? Number(rs.lastInsertRowid) : undefined,
    changes: rs.rowsAffected,
  };
}

// statements: [{ sql, args }] — atomic, no mid-batch id reads.
async function batch(statements) {
  return client.batch(statements, 'write');
}

// Interactive write transaction: use when a later statement needs an id from an earlier insert.
async function transaction() {
  return client.transaction('write');
}

module.exports = { client, get, all, run, batch, transaction };
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `node --test dashboard/test/db.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add dashboard/db.js dashboard/test/db.test.js
git commit -m "feat(dashboard): add async libsql data-access module with tests"
```

---

### Task 1.3: Create `migrate.cjs` (schema + seed + row copy)

**Files:**
- Create: `dashboard/migrate.cjs`

This is the one-time setup script. It runs the same DDL/seed/migrations the app used to run on import, then copies existing rows from the old local DB into the **target** DB (local file or Turso, chosen by env). It is idempotent.

- [ ] **Step 1: Implement `dashboard/migrate.cjs`**

```js
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
```

- [ ] **Step 2: Run it against the local DB (no Turso env yet)**

Run: `node dashboard/migrate.cjs`
Expected: prints schema/seed actions (or notes they already exist) and per-table counts. Because `db.js` and the app already point at this same `dashboard/fantasma.db`, the existing data is preserved; counts should match the current DB (e.g. `journal_entries: 102`).

- [ ] **Step 3: Verify idempotency**

Run: `node dashboard/migrate.cjs` again
Expected: no duplicate seeding ("target already has N rows, skipping copy" / no "Seeded"); identical counts.

- [ ] **Step 4: Commit**

```bash
git add dashboard/migrate.cjs
git commit -m "feat(dashboard): add idempotent migrate.cjs (schema, seed, row copy)"
```

---

### Task 1.4: Convert `dashboard.cjs` to the async DB module

**Files:**
- Modify: `dashboard/dashboard.cjs`

This is the largest task: replace every `better-sqlite3` call with the async `db.js` API, make all DB-touching route handlers `async`, remove the on-import schema/seed/migration block, and export the app.

**Mechanical conversion rule (apply to every handler):**
- `const db = new Database(...)` and all pragmas → delete; add `const db = require('./db');` at top.
- `db.prepare(SQL).get(args)` → `await db.get(SQL, [args])`
- `db.prepare(SQL).all(args)` → `await db.all(SQL, [args])`
- `db.prepare(SQL).run(args)` → `await db.run(SQL, [args])`
- `result.lastInsertRowid` → unchanged (db.run already returns a Number).
- `result.changes` → `result.changes` (db.run maps `rowsAffected`).
- Make the enclosing `app.get/post/put/delete((req,res) => {...})` callback `async (req, res) => {...}` and `await` every db call.
- Wrap each handler body in `try { ... } catch (e) { res.status(500).json({ error: e.message }); }` so a rejected query returns JSON, not an unhandled rejection.
- **Args must be a single array.** The current code passes params two ways: as an array (`.all(...params)`) and as inline positional args (`.get(from, ...)`). Both become a single array arg: `.all(SQL, ...params)` → `await db.all(SQL, params)`; `.get(from, ...(validClass ? [classification] : []))` → `await db.get(SQL, [from, ...(validClass ? [classification] : [])])`.
- **Some handlers run multiple queries** (e.g. `balance-sheet` has `rows` + `incomeRows`; `dashboard/stats` has three; `export` has one per `type` branch). `await` **every** query in the handler, not just the first.

**The two transaction paths get explicit rewrites (below).** Everything else follows the rule.

- [ ] **Step 1: Replace the top-of-file DB setup + schema/seed/migration block**

Delete lines that create the `better-sqlite3` Database, set pragmas, run `CREATE TABLE`, seed accounts, run the mileage + classification migrations, and the unbalanced-entries integrity check (all of that now lives in `migrate.cjs`). Replace with:

```js
const path = require('path');
const express = require('express');
const db = require('./db');
```

(Auth is wired in Chunk 2 — do **not** add `require('./auth')` here yet, or this chunk's smoke test fails because `auth.js` doesn't exist until Chunk 2.)

Keep the helpers (`now`, `today`, `isValidDate`, `normalSideFor`), the `VALID_*` constants, `express()` setup, and `express.json()`.

- [ ] **Step 2: Rewrite the journal-entry CREATE transaction (`POST /api/journal-entries`)**

Replace the `better-sqlite3` `db.transaction(() => {...})` block with an interactive libSQL transaction (needs the header's new id for the line inserts):

```js
  // ... after validation ...
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
```

`getEntryWithLines` becomes `async` and uses `await db.get/all`.

- [ ] **Step 3: Rewrite the journal-entry UPDATE transaction (`PUT /api/journal-entries/:id`)**

No mid-statement id dependency → use `batch`:

```js
  // ... after validation ...
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
```

- [ ] **Step 4: Convert all remaining handlers by the mechanical rule**

Convert each of these handlers (make `async`, `await` db calls, wrap in try/catch). Checklist — tick each:
- [ ] `GET /api/accounts`
- [ ] `POST /api/accounts`
- [ ] `PUT /api/accounts/:id`
- [ ] `GET /api/journal-entries` and `GET /api/journal-entries/:id` (+ `getEntryWithLines`)
- [ ] `DELETE /api/journal-entries/:id`
- [ ] `GET /api/reports/trial-balance`
- [ ] `GET /api/reports/income-statement`
- [ ] `GET /api/reports/balance-sheet`
- [ ] `GET /api/reports/export` (note: it builds CSV from multiple `db.all` calls; convert each)
- [ ] `GET /api/reports/cash-flow` (convert the `.get(...).balance` begin/end-cash queries to `await db.get(...)` then read `.balance`)
- [ ] `GET /api/reports/monthly-summary`
- [ ] `GET /api/dashboard/stats`
- [ ] `GET /api/inquiries/stats`, `POST/GET/PUT/DELETE /api/inquiries[/:id]`, notes routes
- [ ] `GET/POST/PUT/DELETE /api/todos[/:id]`

- [ ] **Step 5: Replace `app.listen` with export + guarded listen**

At the bottom, replace the `app.listen(...)` block with:

```js
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Fantasma Dashboard running at http://localhost:${PORT}`));
}

module.exports = app;
```

- [ ] **Step 6: Smoke-test the whole app locally**

Run (terminal A): `node dashboard/dashboard.cjs`
Run (terminal B) — exercise representative endpoints and confirm parity with current behavior:

```bash
curl -s localhost:3000/api/dashboard/stats
curl -s "localhost:3000/api/reports/trial-balance?as_of=2026-06-10" | head -c 200
curl -s "localhost:3000/api/reports/monthly-summary?from=2025-11-01&to=2026-06-10"
# create + read back + delete a journal entry (round-trips the interactive transaction)
curl -s -X POST localhost:3000/api/journal-entries -H 'Content-Type: application/json' \
  -d '{"date":"2026-06-10","memo":"smoke test","classification":"operations","lines":[{"account_id":1,"debit":100,"credit":0},{"account_id":10,"debit":0,"credit":100}]}'
curl -s localhost:3000/api/todos | head -c 200
```
Expected: same shapes/values as before the migration; the POST returns a 201 with `lines`; no server stack traces. Delete the smoke-test entry afterward.

- [ ] **Step 7: Commit**

```bash
git add dashboard/dashboard.cjs
git commit -m "refactor(dashboard): migrate routes from better-sqlite3 to async libsql"
```

---

## Chunk 2: Authentication

Goal: everything behind a single-password signed-cookie login, testable locally with curl.

### Task 2.1: Create `auth.js` with sign/verify tests

**Files:**
- Create: `dashboard/auth.js`
- Test: `dashboard/test/auth.test.js`

- [ ] **Step 1: Write the failing test**

`dashboard/test/auth.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const auth = require('../auth');

const SECRET = 'test-secret';

test('sign then verify round-trips and returns payload', () => {
  const token = auth.sign({ exp: Date.now() + 10000 }, SECRET);
  const payload = auth.verify(token, SECRET);
  assert.ok(payload && payload.exp);
});

test('verify rejects tampered token, wrong secret, and expired token', () => {
  const good = auth.sign({ exp: Date.now() + 10000 }, SECRET);
  assert.strictEqual(auth.verify(good, 'other-secret'), null);
  assert.strictEqual(auth.verify(good.slice(0, -2) + 'xx', SECRET), null);
  const expired = auth.sign({ exp: Date.now() - 1 }, SECRET);
  assert.strictEqual(auth.verify(expired, SECRET), null);
  assert.strictEqual(auth.verify(undefined, SECRET), null);
});

test('parseCookies handles multiple cookies', () => {
  const c = auth.parseCookies('a=1; dash_session=xyz; b=2');
  assert.strictEqual(c.dash_session, 'xyz');
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `node --test dashboard/test/auth.test.js`
Expected: FAIL — `Cannot find module '../auth'`.

- [ ] **Step 3: Implement `dashboard/auth.js`**

```js
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
```

- [ ] **Step 4: Run, verify it passes**

Run: `node --test dashboard/test/auth.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add dashboard/auth.js dashboard/test/auth.test.js
git commit -m "feat(dashboard): add signed-cookie auth module with tests"
```

---

### Task 2.2: Wire auth into the Express app

**Files:**
- Modify: `dashboard/dashboard.cjs`

- [ ] **Step 1: Mount auth in the correct order**

Just after `app.use(express.json());`, add — login/logout first (open), then the gate, then static + routes:

```js
const auth = require('./auth');
app.use(express.json());

auth.mountAuth(app);        // /api/login, /api/logout — must be BEFORE requireAuth
app.use(auth.requireAuth);  // everything below requires a valid cookie
app.use(express.static(path.join(__dirname, 'public')));
```

(Ensure the existing `express.static` line is removed from its old position so static is served *after* the gate.)

- [ ] **Step 2: Set local auth env + smoke-test the gate**

Run (terminal A):
```bash
DASHBOARD_PASSWORD=localtest SESSION_SECRET=devsecret node dashboard/dashboard.cjs
```
Run (terminal B):
```bash
# No cookie, API request -> 401 JSON
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/dashboard/stats          # expect 401
# No cookie, browser navigation -> login page HTML
curl -s -H 'Accept: text/html' localhost:3000/ | grep -o 'FANTASMA DASHBOARD'        # expect match
# Wrong password -> 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/login -H 'Content-Type: application/json' -d '{"password":"nope"}'  # expect 401
# Correct password -> sets cookie; capture it
curl -s -c cookies.txt -X POST localhost:3000/api/login -H 'Content-Type: application/json' -d '{"password":"localtest"}'  # expect {"ok":true}
# With cookie -> 200 JSON
curl -s -b cookies.txt -o /dev/null -w "%{http_code}\n" localhost:3000/api/dashboard/stats  # expect 200
rm -f cookies.txt
```
Expected: the codes/matches in the comments. (`Secure` is omitted locally because `TURSO_DATABASE_URL` is unset, so curl keeps the cookie.)

- [ ] **Step 3: Commit**

```bash
git add dashboard/dashboard.cjs
git commit -m "feat(dashboard): gate app behind auth middleware"
```

---

### Task 2.3: Frontend 401 handling

**Files:**
- Modify: `dashboard/public/app.js`

- [ ] **Step 1: Update the `api()` helper**

In `dashboard/public/app.js`, in `api()`, immediately after `const res = await fetch(path, opts);` add:

```js
  if (res.status === 401) {
    // Session expired mid-use: reload so the server serves the login page.
    location.reload();
    throw new Error('Unauthorized');
  }
```

- [ ] **Step 2: Manual verify**

With the app running and authed in a browser, run in the console `await fetch('/api/logout',{method:'POST'})` then trigger any in-app action (e.g. switch tabs). Expected: the page reloads to the login screen.

- [ ] **Step 3: Commit**

```bash
git add dashboard/public/app.js
git commit -m "feat(dashboard): show login on 401 from api helper"
```

---

## Chunk 3: Vercel packaging, Turso, and deploy

Goal: the app is the Vercel function, data lives in Turso, and it's live at the custom domain. This chunk interleaves **owner-performed account steps** (clearly marked 👤) with code/verification.

### Task 3.1: Add the Vercel function entry + config

**Files:**
- Create: `dashboard/api/index.js`
- Create: `dashboard/vercel.json`

- [ ] **Step 1: Create `dashboard/api/index.js`**

```js
module.exports = require('../dashboard.cjs');
```

- [ ] **Step 2: Create `dashboard/vercel.json`**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index" }
  ]
}
```

- [ ] **Step 3: Verify the handler resolves and is an Express app**

Run: `node -e "const a=require('./dashboard/api/index.js'); console.log(typeof a, typeof a.handle)"`
Expected: `function function` (an Express app is a function with a `.handle` method).

- [ ] **Step 4: Commit**

```bash
git add dashboard/api/index.js dashboard/vercel.json
git commit -m "feat(dashboard): add vercel function entry + rewrite config"
```

---

### Task 3.2: 👤 Create the Turso database (owner) + migrate data

**Owner-performed.** Provide exact commands; the user runs the auth/signup parts. Use the `!`-prefix in the session for interactive logins.

- [ ] **Step 1: 👤 Install the Turso CLI and sign up**

macOS/Linux: `curl -sSfL https://get.tur.so/install.sh | bash`
Windows (the owner's machine): install via the documented method (WSL or the Windows installer) — confirm `turso --version` works.
Then: `turso auth signup` (opens browser; free account).

- [ ] **Step 2: 👤 Create the database and a token**

```bash
turso db create fantasma-dashboard
turso db show fantasma-dashboard --url          # -> TURSO_DATABASE_URL (libsql://...)
turso db tokens create fantasma-dashboard       # -> TURSO_AUTH_TOKEN
```

- [ ] **Step 3: Put the two values in `.env.local`** (repo root) for the migration step:

```
TURSO_DATABASE_URL=libsql://fantasma-dashboard-<org>.turso.io
TURSO_AUTH_TOKEN=<token>
```

- [ ] **Step 4: Run the migration into Turso**

Run: `node dashboard/migrate.cjs`
Expected: schema created, accounts seeded only if empty, rows copied from the local `file:` DB, and final per-table counts that **match the local DB** (e.g. `journal_entries: 102`).

- [ ] **Step 5: Verify counts independently**

Run: `turso db shell fantasma-dashboard "SELECT (SELECT COUNT(*) FROM journal_entries) AS je, (SELECT COUNT(*) FROM accounts) AS acc, (SELECT COUNT(*) FROM inquiries) AS inq, (SELECT COUNT(*) FROM todos) AS td"`
Expected: matches the local counts.

(No commit — `.env.local` is gitignored and must never be committed.)

---

### Task 3.3: 👤 Create the Vercel project + env vars, deploy

- [ ] **Step 1: Generate a strong session secret and choose a passphrase**

Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` → use as `SESSION_SECRET`.
Choose a long `DASHBOARD_PASSWORD` (a 4–5 word passphrase; the owner picks and stores it).

- [ ] **Step 2: 👤 Create a new, separate Vercel project**

In the Vercel dashboard: **Add New → Project → import the existing `fantasma-site` repo → set Root Directory = `dashboard` →** Framework Preset = "Other". Do **not** reuse the existing fantasma-site project.

- [ ] **Step 3: 👤 Add Environment Variables** (Production + Preview) in the new project:

```
TURSO_DATABASE_URL = libsql://...
TURSO_AUTH_TOKEN   = <token>
SESSION_SECRET     = <hex from step 1>
DASHBOARD_PASSWORD = <chosen passphrase>
```

- [ ] **Step 4: 👤 Deploy**

Trigger a deploy (push to the branch, or "Deploy" in the dashboard). After it builds, note the `*.vercel.app` URL.

- [ ] **Step 5: Smoke-test the deployment over HTTPS**

```bash
BASE=https://<project>.vercel.app
curl -s -o /dev/null -w "%{http_code}\n" $BASE/api/dashboard/stats                 # expect 401
# CRITICAL: a static asset must ALSO be gated (proves Vercel routes static through the function, not its CDN).
curl -s $BASE/app.js | grep -o 'FANTASMA DASHBOARD' && echo "GATED (login page)" || echo "LEAK: static served unauthenticated"
curl -s -c c.txt -X POST $BASE/api/login -H 'Content-Type: application/json' -d '{"password":"<passphrase>"}'   # {"ok":true}
curl -s -b c.txt $BASE/api/dashboard/stats                                          # expect real JSON
curl -s -b c.txt $BASE/app.js | head -c 40                                         # now expect the real app.js source
rm -f c.txt
```
Expected: `/api/dashboard/stats` → 401; **unauthenticated `/app.js` → the login page, NOT the real script** (if it returns the real JS, static is bypassing the auth gate — stop and fix by removing `dashboard/public` as a Vercel static output / forcing all routes through the function before continuing); after login, both return real content. (Here `Secure` is set and honored over HTTPS.)

---

### Task 3.4: 👤 Custom domain `dashboard.fantasmafootball.com`

- [ ] **Step 1: 👤 Add the domain in the Vercel project**

Project → Settings → Domains → add `dashboard.fantasmafootball.com`. Vercel shows the required DNS record (typically a CNAME to `cname.vercel-dns.com`).

- [ ] **Step 2: 👤 Add the DNS record** at the domain's DNS host (wherever `fantasmafootball.com` DNS is managed), exactly as Vercel specifies.

- [ ] **Step 3: Verify DNS + HTTPS**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://dashboard.fantasmafootball.com/api/dashboard/stats`
Expected: `401` (reachable, TLS valid, gate working). May take a few minutes for DNS/cert.

- [ ] **Step 4: 👤 End-to-end phone test**

On the phone: open `https://dashboard.fantasmafootball.com`, see the login page, enter the passphrase, and confirm every section loads real data (accounts, journal, reports, charts, inquiries, todos) and that creating/editing a record works.

---

### Task 3.5: Documentation + cleanup

**Files:**
- Modify: `CLAUDE.md` (or `dashboard/`-local notes)

- [ ] **Step 1: Document the new setup** in `CLAUDE.md`: the dashboard's URL, that it's a separate Vercel project rooted at `dashboard/`, the env vars it needs, how to run locally (`node dashboard/dashboard.cjs`), and how to re-run `migrate.cjs`.

- [ ] **Step 2: Confirm `better-sqlite3` is no longer imported by the dashboard**

Run: `grep -rn "better-sqlite3" dashboard/ --include=*.cjs --include=*.js` (exclude `node_modules`)
Expected: no matches in dashboard source.

- [ ] **Step 3: Commit + open PR**

```bash
git add CLAUDE.md
git commit -m "docs: document dashboard cloud deployment"
git push -u origin dashboard-cloud-access
```
Then open a PR from `dashboard-cloud-access` → `main`.

---

## Done When

- All `node --test dashboard/test/*.test.js` pass.
- Local app runs identically to pre-migration (smoke tests green).
- `https://dashboard.fantasmafootball.com` shows the login page, accepts the passphrase, and serves all features with the migrated data — verified from the phone.
- Turso row counts match the original local DB.
- `better-sqlite3` is no longer imported by the dashboard.
