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
