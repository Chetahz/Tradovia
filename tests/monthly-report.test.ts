import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMonthlyReport, availableTradeMonths, previousMonth } from '../lib/monthly-report.ts';
import type { Trade } from '../lib/domain.ts';

const trade = (id: string, date: string, setup: string, result: number, adherence: Trade['adherence'] = 'yes'): Trade => ({
  id,
  accountId: 'a',
  symbol: 'XAUUSD',
  side: 'LONG',
  status: 'CLOSED',
  date,
  time: '09:30',
  entry: 1,
  sl: 0,
  tp: 0,
  lot: 0.1,
  risk: 100,
  gross: result,
  fees: 0,
  setup,
  notes: '',
  imageIds: [],
  adherence,
  review: {
    emotion: 'calm',
    lesson: 'Wait',
    completedAt: `${date}T10:00:00Z`,
    checklist: [{ text: 'Wait for confirmation', answer: id === '2' ? 'no' : 'yes' }],
  },
});

void test('monthly report isolates the month and compares the previous month', () => {
  const rows = [
    trade('1', '2026-09-02', 'Breakout', 100),
    trade('2', '2026-09-03', 'Breakout', -50, 'no'),
    trade('3', '2026-08-20', 'Breakout', 25),
  ];
  const report = analyzeMonthlyReport(rows, '2026-09', 10_000);
  assert.equal(report.count, 2);
  assert.equal(report.pnl, 50);
  assert.equal(report.previous.pnl, 25);
  assert.equal(report.strongest?.name, 'Breakout');
  assert.equal(report.repeatedMiss?.text, 'Wait for confirmation');
  assert.equal(report.adherenceRate, 50);
});

void test('monthly patterns need repeated comparable trades', () => {
  const report = analyzeMonthlyReport(
    [trade('1', '2026-09-02', 'One-off', 100)],
    '2026-09',
    10_000,
  );
  assert.equal(report.strongest, undefined);
  assert.equal(report.averageR, 1);
});

void test('month utilities sort available history and cross year boundaries', () => {
  const rows = [trade('1', '2025-12-02', 'A', 10), trade('2', '2026-01-02', 'A', 10)];
  assert.deepEqual(availableTradeMonths(rows), ['2026-01', '2025-12']);
  assert.equal(previousMonth('2026-01'), '2025-12');
});
