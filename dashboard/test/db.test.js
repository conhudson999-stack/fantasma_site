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
