import test from 'node:test';
import assert from 'node:assert/strict';
const origin = process.env.TEST_ORIGIN || 'http://localhost:3000';
function client() {
  let cookie = '';
  return async (path, body, method) => {
    const response = await fetch(origin + path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(body ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = response.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: response.status, data: await response.json(), cookie };
  };
}
await test('persisted CRUD, goals, accounts and cross-session isolation', async () => {
  const a = client(),
    b = client();
  const first = await a('/api/workspace?mode=demo'),
    second = await b('/api/workspace?mode=demo');
  assert.equal(first.status, 200);
  assert.equal(second.data.trades.length, 24);
  assert.notEqual(first.cookie, second.cookie);
  const trade = {
    ...first.data.trades[0],
    id: crypto.randomUUID(),
    gross: 444,
    fees: 4,
    setup: 'API verification',
  };
  const created = await a('/api/workspace?mode=demo', {
    action: 'saveTrade',
    value: trade,
  });
  assert.equal(created.status, 200);
  assert.equal(created.data.trades.length, 25);
  const read = await a('/api/workspace?mode=demo');
  assert.equal(read.data.trades.find((t) => t.id === trade.id).gross, 444);
  const isolated = await b('/api/workspace?mode=demo');
  assert.equal(isolated.data.trades.length, 24);
  const watched = await a('/api/workspace?mode=demo', {
    action: 'saveWatchlist',
    value: ['BITSTAMP:BTCUSD'],
  });
  assert.deepEqual(watched.data.profile.watchlist, ['BITSTAMP:BTCUSD']);
  const reloaded = await a('/api/workspace?mode=demo');
  assert.deepEqual(reloaded.data.profile.watchlist, ['BITSTAMP:BTCUSD']);
  assert.equal(isolated.data.profile.watchlist, undefined);
  const edited = await a('/api/workspace?mode=demo', {
    action: 'saveTrade',
    value: { ...trade, gross: -80 },
  });
  assert.equal(edited.data.trades.find((t) => t.id === trade.id).gross, -80);
  const invalid = await a('/api/workspace?mode=demo', {
    action: 'saveTrade',
    value: { ...trade, accountId: 'foreign-account' },
  });
  assert.equal(invalid.status, 403);
  const goal = await a('/api/workspace?mode=demo', {
    action: 'saveGoal',
    value: { period: 'week', type: 'pnl', target: 777 },
  });
  assert.ok(goal.data.goals.some((g) => g.target === 777));
  const portfolio = await a('/api/workspace?mode=demo', {
    action: 'createPortfolio',
    value: { name: 'Verification portfolio', balance: 2000 },
  });
  assert.equal(portfolio.data.portfolios.length, 2);
  const newAccount = portfolio.data.accounts.at(-1);
  const other = await b('/api/workspace?mode=demo', {
    action: 'saveTrade',
    value: { ...trade, accountId: newAccount.id },
  });
  assert.equal(other.status, 403);
  const deleted = await a('/api/workspace?mode=demo', {
    action: 'deleteTrade',
    value: trade.id,
  });
  assert.equal(deleted.data.trades.length, 24);
  const reset = await a('/api/workspace?mode=demo', { action: 'resetDemo' });
  assert.equal(reset.data.portfolios.length, 1);
  assert.equal(reset.data.trades.length, 24);
  const billing = await a('/api/billing?mode=demo', {
    action: 'checkout',
    plan: 'pro',
  });
  assert.equal(billing.status, 403);
});
await test('cross-origin mutations fail closed', async () => {
  const r = await fetch(origin + '/api/workspace?mode=demo', {
    method: 'POST',
    headers: {
      Origin: 'https://untrusted.example',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'resetDemo' }),
  });
  assert.equal(r.status, 403);
});
await test('uploaded images are private to the owning demo session', async () => {
  const a = client(),
    b = client();
  const one = await a('/api/workspace?mode=demo'),
    two = await b('/api/workspace?mode=demo');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZKkAAAAASUVORK5CYII=',
    'base64',
  );
  const form = new FormData();
  form.set('image', new Blob([png], { type: 'image/png' }), 'verification.png');
  const upload = await fetch(origin + '/api/images?mode=demo', {
    method: 'POST',
    headers: { Origin: origin, cookie: one.cookie },
    body: form,
  });
  assert.equal(upload.status, 200);
  const image = await upload.json();
  const read = await fetch(origin + `/api/images/${image.id}?mode=demo`, {
    headers: { cookie: one.cookie },
  });
  assert.equal(read.status, 200);
  const blocked = await fetch(origin + `/api/images/${image.id}?mode=demo`, {
    headers: { cookie: two.cookie },
  });
  assert.equal(blocked.status, 404);
  const invalidForm = new FormData();
  invalidForm.set(
    'image',
    new Blob(['<script>bad</script>'], { type: 'image/png' }),
    'bad.png',
  );
  const invalid = await fetch(origin + '/api/images?mode=demo', {
    method: 'POST',
    headers: { Origin: origin, cookie: one.cookie },
    body: invalidForm,
  });
  assert.equal(invalid.status, 400);
});
