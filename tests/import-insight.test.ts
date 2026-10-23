import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeImport } from '../lib/import-insight.ts';
import type { Trade } from '../lib/domain.ts';

const trade = (overrides: Partial<Trade>): Trade => ({
  id: crypto.randomUUID(),
  accountId: 'account-1',
  symbol: 'XAUUSD',
  side: 'LONG',
  status: 'CLOSED',
  date: '2026-10-01',
  time: '09:00',
  entry: 2500,
  sl: 2490,
  tp: 2520,
  lot: 0.1,
  risk: 100,
  gross: 200,
  fees: 5,
  setup: '',
  notes: '',
  imageIds: [],
  ...overrides,
});

void test('import summary reports facts without inventing an edge', () => {
  const rows = [
    trade({ gross: 205, fees: 5, date: '2026-09-30' }),
    trade({ gross: -95, fees: 5, symbol: 'EURUSD', date: '2026-10-02' }),
    trade({ gross: 0, fees: 0, risk: 0, date: '2026-10-01' }),
  ];
  const summary = summarizeImport(rows, rows);

  assert.equal(summary.imported, 3);
  assert.equal(summary.pnl, 100);
  assert.equal(summary.winRate, 50);
  assert.equal(summary.riskCoverage, 67);
  assert.equal(summary.reviewNeeded, 3);
  assert.equal(summary.firstDate, '2026-09-30');
  assert.equal(summary.lastDate, '2026-10-02');
  assert.deepEqual(summary.leadingSymbol, {
    symbol: 'XAUUSD',
    trades: 2,
    pnl: 200,
  });
  assert.equal(summary.edge.strongest, undefined);
});

void test('import summary can surface an evidence-backed workspace pattern', () => {
  const rows = Array.from({ length: 4 }, (_, index) =>
    trade({
      symbol: 'GBPUSD',
      setup: 'Breakout',
      date: `2026-10-0${index + 1}`,
      gross: 150,
      fees: 0,
    }),
  );
  const summary = summarizeImport(rows, rows);

  assert.equal(summary.edge.strongest?.key, 'Breakout');
  assert.equal(summary.edge.strongest?.riskTrades, 4);
  assert.equal(summary.edge.strongest?.averageR, 1.5);
});
