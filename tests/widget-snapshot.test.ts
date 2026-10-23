import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildWidgetSnapshot } from '../lib/widget-snapshot.ts';
import type { Trade } from '../lib/domain.ts';

function trade(id: string, date: string, gross: number, reviewed = false): Trade {
  return {
    id, accountId: 'account-1', symbol: 'XAUUSD', side: 'LONG', status: 'CLOSED',
    date, time: '12:00', entry: 1, sl: 0, tp: 0, lot: 1, risk: 0,
    gross, fees: 1, setup: '', notes: '', imageIds: [],
    review: reviewed ? { checklist: [], emotion: 'calm', lesson: 'Wait', completedAt: `${date}T12:00:00Z` } : undefined,
  };
}

void test('widget snapshot uses the profile timezone and Monday week boundary', () => {
  const now = new Date('2026-09-27T18:30:00Z'); // Monday in Bangkok
  const snapshot = buildWidgetSnapshot([
    trade('a', '2026-09-28', 21),
    trade('b', '2026-09-27', -9, true),
  ], 'Asia/Bangkok', now);
  assert.equal(snapshot.today, '2026-09-28');
  assert.equal(snapshot.todayPnl, 20);
  assert.equal(snapshot.todayCount, 1);
  assert.equal(snapshot.weekPnl, 20);
  assert.equal(snapshot.weekCount, 1);
  assert.equal(snapshot.reviewCount, 1);
  assert.equal(snapshot.days.at(-1)?.date, '2026-09-28');
});

void test('widget snapshot keeps empty days and ignores open trade results', () => {
  const open = { ...trade('open', '2026-09-28', 100), status: 'OPEN' as const };
  const snapshot = buildWidgetSnapshot([open], 'Asia/Bangkok', new Date('2026-09-27T18:30:00Z'));
  assert.equal(snapshot.todayCount, 0);
  assert.equal(snapshot.todayOpenCount, 1);
  assert.equal(snapshot.todayPnl, 0);
  assert.equal(snapshot.days.length, 7);
  assert.equal(snapshot.days.at(-1)?.count, 0);
});
