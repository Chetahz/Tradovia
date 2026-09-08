import test from 'node:test';
import assert from 'node:assert/strict';
import {
  statistics,
  dailyStats,
  net,
  demoData,
  emptyData,
  sizePosition,
  validateTrade,
  inPeriod,
  assets,
} from '../lib/domain.ts';
import { verifyStripeSignature } from '../lib/stripe.ts';
void test('asset metadata does not invalidate numeric risk inputs', () => {
  const result = sizePosition({
    ...assets.XAUUSD,
    balance: 10000,
    percent: 1,
    entry: 2500,
    stop: 2490,
    max: 100,
    costPerUnit: 0,
  });
  assert.equal(result.quantity, 0.1);
  assert.equal(result.estimatedRisk, 100);
});
void test('dashboard, calendar and analytics agree after create, edit and delete', () => {
  const original = demoData(new Date(2026, 8, 7)).trades;
  const base = statistics(original, 10000);
  const trade = { ...original[0], id: 'test-new', gross: 250, fees: 5 };
  const added = [...original, trade];
  assert.equal(statistics(added, 10000).pnl, base.pnl + 245);
  assert.equal(
    Object.values(dailyStats(added)).reduce((n, d) => n + d.pnl, 0),
    base.pnl + 245,
  );
  const edited = added.map((t) =>
    t.id === 'test-new' ? { ...t, gross: -100 } : t,
  );
  assert.equal(statistics(edited, 10000).pnl, base.pnl - 105);
  assert.equal(
    statistics(
      edited.filter((t) => t.id !== 'test-new'),
      10000,
    ).pnl,
    base.pnl,
  );
});
void test('open trades do not affect performance or calendar totals', () => {
  const trade = demoData().trades[0];
  assert.equal(
    statistics([{ ...trade, status: 'OPEN', gross: 9999 }], 10000).pnl,
    0,
  );
  assert.deepEqual(dailyStats([{ ...trade, status: 'OPEN' }]), {});
});
void test('drawdown is measured from capital and running peaks', () => {
  const t = demoData().trades[0];
  const trades = [
    { ...t, id: '1', date: '2026-01-01', gross: 100, fees: 0 },
    { ...t, id: '2', date: '2026-01-02', gross: -220, fees: 0 },
  ];
  const s = statistics(trades, 1000);
  assert.equal(s.drawdown, 20);
  assert.equal(s.equity, 880);
  assert.equal(s.winRate, 50);
});
void test('real workspace is empty and independent of demo', () => {
  const real = emptyData();
  const demo = demoData();
  demo.trades.pop();
  assert.equal(real.trades.length, 0);
  assert.equal(demoData().trades.length, 24);
});
void test('risk is always rounded down including fees across asset specifications', () => {
  for (let i = 1; i <= 1000; i++) {
    const v = {
      balance: 1000 + i * 13.71,
      percent: 0.25 + (i % 10) / 10,
      entry: 2500,
      stop: 2500 - ((i % 97) + 1) * 0.37,
      tickSize: 0.01,
      tickValue: 1,
      step: 0.01,
      min: 0.01,
      max: 100,
      costPerUnit: 3.9,
    };
    const r = sizePosition(v);
    assert.ok(r.estimatedRisk <= r.budget);
    assert.ok(r.quantity === 0 || r.quantity >= v.min);
    assert.ok(r.unused >= 0);
  }
});
void test('risk rejects zero stops, invalid precision, non-finite input and oversize minimum', () => {
  const v = {
    balance: 100,
    percent: 1,
    entry: 2500,
    stop: 2490,
    tickSize: 0.01,
    tickValue: 1,
    step: 0.01,
    min: 0.01,
    max: 100,
    costPerUnit: 0,
  };
  assert.equal(sizePosition(v).quantity, 0);
  assert.throws(() => sizePosition({ ...v, stop: 2500 }));
  assert.throws(() => sizePosition({ ...v, percent: Infinity }));
  assert.throws(() => sizePosition({ ...v, step: 0 }));
});
void test('journal rejects invalid dates, numbers and stop direction', () => {
  const t = demoData().trades[0];
  assert.throws(() => validateTrade({ ...t, date: '2026-02-30' }));
  assert.throws(() => validateTrade({ ...t, gross: NaN }));
  assert.throws(() => validateTrade({ ...t, sl: t.entry + 1 }));
  assert.equal(net(validateTrade({ ...t, gross: 123.45, fees: 3.45 })), 120);
});
void test('weekly boundaries cross month and year correctly', () => {
  assert.ok(inPeriod('2025-12-29', 'week', new Date(2026, 0, 1)));
  assert.ok(!inPeriod('2026-01-05', 'week', new Date(2026, 0, 1)));
});
void test('Stripe verifies raw payload, rejects tampering and expired signatures', async () => {
  const raw = '{"type":"test"}',
    secret = 'test-only-secret',
    now = 1780000000;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${now}.${raw}`),
  );
  const hex = Array.from(new Uint8Array(sig), (x) =>
    x.toString(16).padStart(2, '0'),
  ).join('');
  await verifyStripeSignature(raw, `t=${now},v1=${hex}`, secret, now);
  await assert.rejects(() =>
    verifyStripeSignature(raw + ' ', `t=${now},v1=${hex}`, secret, now),
  );
  await assert.rejects(() =>
    verifyStripeSignature(raw, `t=${now},v1=${hex}`, secret, now + 301),
  );
});
