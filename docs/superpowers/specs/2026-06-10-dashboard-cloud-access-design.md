# Fantasma Dashboard — Cloud Access Design

**Date:** 2026-06-10
**Author:** Connor Hudson (with Claude)
**Status:** Approved design — pending implementation plan

## Problem

The Fantasma bookkeeping + inquiry/CRM dashboard currently runs only as a local
Express server (`dashboard/dashboard.cjs`) backed by a local SQLite file
(`dashboard/fantasma.db`). It is reachable only from the owner's PC on the local
network. The owner wants to access it from his phone, anywhere, anytime —
including when his PC is off — without a monthly cost.

## Goals

- Reach the dashboard from any phone/browser at a memorable HTTPS URL.
- Always available, independent of whether the owner's PC is on.
- $0 recurring cost.
- Protected by a login (the app currently has none).
- Preserve all existing data and all existing features/behavior.
- Keep a working local development setup.

## Non-Goals (YAGNI)

- Multiple users / roles. Single user only.
- Password-reset flows, account management UI.
- Two-factor authentication.
- Rewriting the dashboard's features or UI.
- Real-time/offline/PWA capabilities.

## Chosen Approach

Host the dashboard as its **own separate Vercel project** (rooted at the
`dashboard/` folder of the existing `fantasma-site` repo), backed by a free
**Turso** (libSQL) cloud database, protected by a single-password login. Custom
domain: `dashboard.fantasmafootball.com`.

This was chosen over: (a) a local-PC tunnel like Tailscale/Cloudflare Tunnel
(rejected — requires the PC to be on), and (b) a paid always-on VPS (rejected —
monthly cost). Vercel + Turso is always-on, free, and reuses infrastructure the
owner already has (the site already deploys on Vercel).

## Architecture

### Runtime: single catch-all function

The existing Express app runs **as one Vercel serverless function** (a catch-all),
rather than being split into many per-route function files. The app continues to
serve both the static frontend (`dashboard/public/`) and the JSON API, exactly as
it does locally. This minimizes divergence from the working local app and lets a
single auth middleware sit in front of every request (static and API alike).

**Module system / wiring (explicit, to avoid Vercel ambiguity):**
- Everything stays **CommonJS** (`require` / `module.exports`). The `dashboard/`
  project's `package.json` has **no** `"type": "module"`, so `.js` files there are
  CommonJS.
- `dashboard/dashboard.cjs` exports the Express app: `module.exports = app`. It
  only calls `app.listen(PORT)` when run directly:
  `if (require.main === module) app.listen(PORT, ...)`. This preserves local dev.
- `dashboard/api/index.js` is the Vercel function handler. Its entire body is
  `module.exports = require('../dashboard.cjs');` (an Express `app` is a valid
  `(req, res)` handler).
- `dashboard/vercel.json` rewrites **all** paths to that function:
  `{ "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }] }`. Express's
  own router (including `express.static`) then handles routing inside the function.

### Components

1. **`dashboard/api/index.js`** (new) — one line; exports the Express app from
   `dashboard.cjs` as the Vercel function handler.
2. **`dashboard/dashboard.cjs`** — the Express app (existing routes), modified to:
   - use the new async DB module instead of `better-sqlite3`,
   - register auth middleware + login/logout routes,
   - **not** run schema/seed/migration on import (see "One-time setup" below),
   - `module.exports = app`, and `app.listen` only under `require.main === module`.
3. **`dashboard/db.js`** (new) — a thin data-access module wrapping
   `@libsql/client`. Exposes async helpers (`get`, `all`, `run`, `batch`,
   `transaction`) so route code reads similarly to before. Chooses its target from
   env:
   - local dev → an **absolute** `file:` URL,
     `file:${path.join(__dirname, 'fantasma.db')}`, so it resolves correctly
     regardless of `cwd` (the app may be launched from the repo root).
   - production → Turso (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`).
   - In production the function never writes a local file DB, so the current
     `journal_mode = WAL` / `foreign_keys` pragmas are dropped or applied only for
     the local `file:` target.
4. **`dashboard/auth.js`** (new) — login route, logout route, a minimal
   `Cookie`-header parser (no `cookie-parser` dependency — a small helper using
   `req.headers.cookie`), and middleware that verifies the signed cookie.
5. **`dashboard/vercel.json`** (new) — the catch-all rewrite (above).
6. **`dashboard/migrate.cjs`** (new) — one-time setup/migration script (see below),
   run manually, not in the request path.
7. **Frontend** (`dashboard/public/*`) — the only change is in the **shared `api()`
   helper in `app.js`**: detect a `401` response (a session that expires while the
   app is already open) and show the login view (every page already routes its
   requests through this one helper, so this is a single change point, not a
   per-page change). Fresh navigations while unauthenticated are handled server-side
   by the middleware's inline login page (see Authentication), so this hook only
   covers mid-session expiry.

### Data flow

```
Phone browser
  → https://dashboard.fantasmafootball.com
  → Vercel (catch-all function = Express app)
  → auth middleware checks signed cookie
      • no/invalid cookie + HTML request → serve login screen
      • no/invalid cookie + /api/* request → 401
      • valid cookie → proceed
  → route handler → await db (Turso/libSQL) → JSON
  → browser renders
```

## Database Migration: better-sqlite3 → libSQL

`better-sqlite3` is synchronous; `@libsql/client` is asynchronous. Every query
(`db.prepare(sql).get()/all()/run()`) becomes `await db.get/all/run(sql, args)`,
and all route handlers that touch the DB become `async`. This is mechanical but
touches every query (~40) across accounts, journal entries, reports, inquiries,
notes, and todos.

Specific conversion notes:
- **Transactions — two distinct cases:**
  - **Create journal entry** (`POST`): inserts the header, then needs its new
    `lastInsertRowid` to insert the lines. `client.batch()` cannot read an id
    mid-batch, so this path uses an **interactive transaction**
    (`await db.transaction('write')` → `tx.execute(...)` → `tx.commit()`), which
    allows reading the inserted id before the dependent inserts.
  - **Update journal entry** (`PUT`): DELETE lines → UPDATE header → re-INSERT
    lines, with no mid-statement id dependency, so `client.batch([...], 'write')`
    is sufficient.
- **Insert results.** `result.lastInsertRowid` (better-sqlite3) → libSQL
  `result.lastInsertRowid` (a BigInt; cast to `Number` where used as an id).
- **Affected rows.** `result.changes` → libSQL `result.rowsAffected`.
- **Parameters.** Positional `?` placeholders are supported by both; arg arrays
  carry over.

### One-time setup and data migration

Schema creation, account seeding, and the column-migrations currently run on import
in `dashboard.cjs`. **These move out of the request path** into a standalone
`dashboard/migrate.cjs` run manually once during setup. Rationale: running
`CREATE TABLE` / `ALTER TABLE` / seed on every serverless cold start adds remote
round-trips to requests and risks two concurrent cold starts racing on the same
`ALTER TABLE`. The deployed function assumes the schema already exists.

`migrate.cjs` loads credentials from `.env.local` (the project's documented
env-loading pattern) and does, against the target Turso DB:
1. Create tables (`CREATE TABLE IF NOT EXISTS …`), apply the same column migrations
   (e.g. add `5100 Mileage Expense`, add `classification` — the existing
   `SELECT … ; catch → ALTER` probe becomes an `await` in `try/catch`), and seed
   accounts if empty — all idempotent.
2. Copy existing rows from the local `file:` DB into Turso. Mechanism: a Node
   script using `@libsql/client` to open the local `file:fantasma.db`, read each
   table (`accounts`, `journal_entries`, `journal_lines`, `inquiries`,
   `inquiry_notes`, `todos`), and insert into Turso (preserving ids). (Equivalent
   manual path: `sqlite3 fantasma.db .dump` → load via `turso db shell`.)
3. Verify: per-table row counts match between local and Turso.

The local `fantasma.db` file is retained as a backup.

## Authentication

- **Secrets (Vercel env vars):**
  - `DASHBOARD_PASSWORD` — the single login passphrase (owner sets a long one).
  - `SESSION_SECRET` — random string used to sign the session cookie.
- **Login:** `POST /api/login` compares the submitted password to
  `DASHBOARD_PASSWORD` using a constant-time comparison
  (`crypto.timingSafeEqual`). On success, set cookie `dash_session`.
- **Cookie format (with server-side expiry):** the signed payload includes an
  expiry timestamp so the session actually expires server-side (an HMAC over a
  constant value would never expire even after the browser's `Max-Age`). Payload =
  `base64url({ exp: <now + 30 days, ms> })`; cookie value =
  `<payload>.<HMAC-SHA256(payload, SESSION_SECRET)>`. Cookie flags:
  `HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`.
- **Verification middleware:** runs before all protected routes. Recomputes the
  HMAC (constant-time compare) **and** checks `exp > now`. Reads the cookie via a
  small `req.headers.cookie` parser (no `cookie-parser` dependency). On
  absence/mismatch/expiry it branches on the request's `Accept` header rather than
  the URL prefix:
  - request accepts `text/html` (a browser navigation) → respond `200` with a
    **self-contained login page** (inline HTML/CSS/JS, no external assets).
  - otherwise (a `fetch`/XHR, which `app.js`'s `api()` sends) → `401` JSON.
  Using `Accept` (not the `/api/` prefix) means the CSV export — an `/api/...` GET
  opened via `window.open` as a navigation — correctly shows the login page when
  the session is expired, instead of a raw JSON error tab.
- **Self-contained login page:** because the middleware serves an inline login page
  for unauthenticated navigations, no static file needs to be reachable pre-auth.
  The page posts to `POST /api/login` and on success reloads into the app.
- **`SameSite=Lax` is correct:** the dashboard UI and its API are the same origin
  (the catch-all function serves both), so `Lax` works and `None` is unnecessary.
- **Logout:** `POST /api/logout` clears the cookie (`Max-Age=0`).
- **Open paths:** `POST /api/login` only. Every other path (including all static
  assets) requires a valid cookie; unauthenticated navigations get the inline login
  page.
- **Brute-force posture:** a single shared password on a public URL relies on
  passphrase entropy. The owner uses a long passphrase. (Optional future hardening:
  Cloudflare in front, or a delay — out of scope here.)

## Deployment

- **New Vercel project** with **Root Directory = `dashboard/`**, connected to the
  existing GitHub repo. Pushes to the repo trigger auto-deploy (same model as the
  main site).
- **Env vars** set in the Vercel project: `TURSO_DATABASE_URL`,
  `TURSO_AUTH_TOKEN`, `DASHBOARD_PASSWORD`, `SESSION_SECRET`,
  `DB_TARGET=turso` (or equivalent flag).
- **Custom domain:** add `dashboard.fantasmafootball.com` to the Vercel project;
  add the corresponding DNS record at the domain's DNS host.
- **Local dev unchanged:** `node dashboard/dashboard.cjs` still runs against the
  local `file:` database via the same `db.js` module.

### Owner-performed steps (guided, with exact commands)

1. Create a free Turso account + database; provide `TURSO_DATABASE_URL` and
   `TURSO_AUTH_TOKEN`.
2. Create the new Vercel project (root `dashboard/`); set env vars.
3. Add the `dashboard.fantasmafootball.com` DNS record.

## Dependencies

- Add `@libsql/client`.
- Remove `better-sqlite3` from the dashboard's runtime path (may remain in the repo
  for other tooling, but the dashboard no longer imports it).
- No framework added; auth uses Node's built-in `crypto` for HMAC.

## Testing / Verification

- **Local:** run the app against a `file:` libSQL DB; smoke-test every page and the
  key API routes (create/edit/delete journal entry, inquiry, todo; run each report;
  load charts). Confirm parity with current behavior.
- **Auth:** unauthenticated `/api/*` returns 401; wrong password rejected; correct
  password sets cookie and unlocks; logout clears access.
- **Migration:** per-table row counts match between local SQLite and Turso.
- **Production:** after deploy, load `dashboard.fantasmafootball.com` on a phone,
  log in, and verify data + each feature end-to-end.

## Risks

- **Sync→async conversion is broad.** Mitigated by doing it module-by-module with
  the local file DB and smoke-testing before cloud cutover.
- **Cold-start schema/seed must stay idempotent.** Existing guards already handle
  this; verify they don't double-seed against Turso.
- **Free-tier limits.** Single-user usage is far under Turso/Vercel free limits;
  low risk.
- **Public exposure.** Addressed by the login; passphrase strength is the key
  control.

## Out of Scope / Future

- Cloudflare Access or 2FA.
- Multi-user accounts.
- Automated periodic backups of Turso (manual export remains possible).
```
