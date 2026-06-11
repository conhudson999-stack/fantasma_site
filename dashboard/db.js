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
