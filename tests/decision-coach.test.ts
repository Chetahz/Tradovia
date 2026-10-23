import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../lib/domain.ts';
import {
  decisionCoach,
  mostMissedRule,
  pendingReviewTrades,
} from '../lib/decision-coach.ts';

void test('coach protects open risk before asking for a review', () => {
  const trades = demoData().trades;
  assert.equal(decisionCoach(trades, '2026-10-03').kind, 'review');
  assert.equal(
    decisionCoach(
      [...trades, { ...trades[0], id: 'open', status: 'OPEN' }],
      '2026-10-03',
    ).kind,
    'open',
  );
});

void test('review inbox contains only closed unfinished reviews with newest first', () => {
  const base = demoData().trades[0];
  const rows = [
    {
      ...base,
      id: 'old',
      date: '2026-09-01',
      status: 'CLOSED' as const,
      review: undefined,
      adherence: '' as const,
    },
    {
      ...base,
      id: 'new',
      date: '2026-10-01',
      status: 'CLOSED' as const,
      review: undefined,
      adherence: '' as const,
    },
    { ...base, id: 'open', status: 'OPEN' as const },
    {
      ...base,
      id: 'done',
      status: 'CLOSED' as const,
      review: {
        checklist: [],
        emotion: '' as const,
        lesson: '',
        completedAt: '2026-10-01T00:00:00Z',
      },
    },
  ];
  assert.deepEqual(
    pendingReviewTrades(rows).map((trade) => trade.id),
    ['new', 'old'],
  );
});

void test('coach only reports a missed rule after it repeats', () => {
  const base = demoData().trades[0];
  const reviewed = (id: string, answer: 'yes' | 'no') => ({
    ...base,
    id,
    review: {
      checklist: [{ text: 'Wait for confirmation', answer }],
      emotion: '' as const,
      lesson: '',
      completedAt: '2026-10-01T00:00:00Z',
    },
  });
  assert.equal(mostMissedRule([reviewed('a', 'no')]), undefined);
  assert.deepEqual(
    mostMissedRule([
      reviewed('a', 'no'),
      reviewed('b', 'no'),
      reviewed('c', 'yes'),
    ]),
    {
      text: 'Wait for confirmation',
      count: 2,
    },
  );
});
