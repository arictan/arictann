// Tests for the reference server: node server/test.mjs
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
process.env.DATA = path.join(os.tmpdir(), `sushi-test-${process.pid}.json`);
const { server, stop, LIMITS } = await import('./server.mjs');
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const call = async (method, p, body) => {
  const res = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return [res.status, await res.json()];
};
const day = new Date().toISOString().slice(0, 10);
let n = 0;
const test = async (name, fn) => { await fn(); n++; console.log('✓', name); };

await test('health', async () => assert.deepEqual(await call('GET', '/health'), [200, { ok: true }]));
await test('daily: best score per player, rank and top list', async () => {
  await call('POST', '/daily', { day, player: 'AAAAAA', name: 'Ana', score: 30 });
  await call('POST', '/daily', { day, player: 'AAAAAA', name: 'Ana', score: 20 }); // lower: ignored
  const [s, r] = await call('POST', '/daily', { day, player: 'BBBBBB', name: '<b>Bo</b>', score: 25 });
  assert.equal(s, 200);
  assert.equal(r.players, 2);
  assert.deepEqual(r.top, [{ name: 'Ana', score: 30 }, { name: 'bBo/b', score: 25 }]);
  assert.equal(r.rank, 2);
});
await test('daily: impossible scores and far-off days are refused', async () => {
  assert.equal((await call('POST', '/daily', { day, player: 'CCCCCC', score: LIMITS.dailyScore + 1 }))[0], 400);
  assert.equal((await call('POST', '/daily', { day: '2020-01-01', player: 'CCCCCC', score: 5 }))[0], 400);
  assert.equal((await call('POST', '/daily', { day, player: 'bad id', score: 5 }))[0], 400);
});
await test('friends: daily scores of the asked players only', async () => {
  const [, r] = await call('POST', '/friends', { day, players: ['AAAAAA', 'ZZZZZZ'] });
  assert.deepEqual(Object.keys(r.scores), ['AAAAAA']);
  assert.equal(r.scores.AAAAAA.score, 30);
});
await test('world: layers add up, per-player daily cap', async () => {
  await call('POST', '/world', { day, player: 'AAAAAA', layers: 100 });
  const [, r] = await call('POST', '/world', { day, player: 'BBBBBB', layers: 50 });
  assert.equal(r.total, 150);
  assert.equal(r.players, 2);
  assert.equal((await call('POST', '/world', { day, player: 'AAAAAA', layers: LIMITS.worldPerPost + 1 }))[0], 400);
  for (let i = 0; i < 12; i++) await call('POST', '/world', { day, player: 'DDDDDD', layers: LIMITS.worldPerPost });
  const [, w] = await call('GET', `/world?day=${day}`);
  assert.equal(w.total, 150 + LIMITS.worldPerDay);
});
await test('country: average of players’ bests, one country per player a week', async () => {
  const week = '2026-W44';
  await call('POST', '/country', { week, player: 'AAAAAA', country: 'TR', best: 40 });
  await call('POST', '/country', { week, player: 'BBBBBB', country: 'TR', best: 60 });
  await call('POST', '/country', { week, player: 'CCCCCC', country: 'JP', best: 45 });
  const [, r] = await call('POST', '/country', { week, player: 'AAAAAA', country: 'JP', best: 80 }); // stays TR
  assert.deepEqual(r.countries, [{ id: 'TR', players: 2, score: 70 }, { id: 'JP', players: 1, score: 45 }]);
});
await test('backup: save with ID + PIN, restore, wrong PIN locks after 5 tries', async () => {
  assert.equal((await call('POST', '/backup', { code: 'nope' }))[0], 400);
  const [, b] = await call('POST', '/backup', { code: 'SS1.abc.XYZ1' });
  assert.match(b.id, /^[A-Z2-9]{8}$/);
  assert.match(b.pin, /^\d{4}$/);
  assert.deepEqual(await call('POST', '/restore', { id: b.id.toLowerCase(), pin: b.pin }), [200, { code: 'SS1.abc.XYZ1' }]);
  assert.equal((await call('POST', '/backup', { id: b.id, pin: b.pin, code: 'SS1.new.XYZ2' }))[1].updated, true);
  const wrong = b.pin === '0000' ? '0001' : '0000';
  for (let i = 0; i < LIMITS.pinTries; i++) assert.equal((await call('POST', '/restore', { id: b.id, pin: wrong }))[0], 403);
  assert.equal((await call('POST', '/restore', { id: b.id, pin: b.pin }))[0], 429);
});
await test('forget: removes a player everywhere, and their backup with the PIN', async () => {
  const [, b] = await call('POST', '/backup', { code: 'SS1.x.Y' });
  const [, r] = await call('POST', '/forget', { player: 'AAAAAA', backupId: b.id, pin: b.pin });
  assert.ok(r.removed >= 4);
  const [, d] = await call('GET', `/daily?day=${day}`);
  assert.ok(!d.top.some((x) => x.name === 'Ana'));
  assert.equal((await call('POST', '/restore', { id: b.id, pin: b.pin }))[0], 404);
});
await test('bad requests', async () => {
  assert.equal((await call('GET', '/nope'))[0], 404);
  const res = await fetch(`${base}/daily`, { method: 'POST', body: '{oops' });
  assert.equal(res.status, 400);
});
await test('rate limit', async () => {
  let last = 200;
  for (let i = 0; i < LIMITS.perMinute + 5; i++) last = (await call('GET', '/health'))[0];
  assert.equal(last, 429);
});
stop();
console.log(`${n} tests passed`);
