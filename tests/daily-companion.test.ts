import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../lib/domain.ts';
import {
  companionClock,
  companionGreeting,
  companionPrompt,
  latestReviewedLesson,
  relevantReviewedLesson,
} from '../lib/daily-companion.ts';

void test('lesson recall uses the latest completed review, not profit or entry order', () => {
  const base = demoData().trades[0];
  const older = {
    ...base,
    id: 'older',
    status: 'CLOSED' as const,
    review: {
      checklist: [],
      emotion: '' as const,
      lesson: 'Wait for confirmation',
      completedAt: '2026-09-22T12:00:00Z',
    },
  };
  const newest = {
    ...older,
    id: 'newest',
    date: '2026-08-01',
    gross: -100,
    review: {
      ...older.review,
      lesson: 'Respect my stop',
      completedAt: '2026-09-24T12:00:00Z',
    },
  };
  const rows = [older, newest];
  assert.equal(latestReviewedLesson(rows)?.id, 'newest');
  assert.equal(rows[0].id, 'older');
  assert.equal(latestReviewedLesson([older])?.id, 'older');
});

void test('new trade recalls a reviewed lesson from its own account and prefers a matching plan', () => {
  const base = demoData().trades[0];
  const reviewed = {
    ...base,
    status: 'CLOSED' as const,
    review: {
      checklist: [],
      emotion: '' as const,
      lesson: 'Wait for confirmation',
      completedAt: '2026-09-22T12:00:00Z',
    },
  };
  const samePlan = { ...reviewed, id: 'plan', symbol: 'EURUSD', playbook: { id: 'plan-a' } as typeof base.playbook };
  const recentSymbol = {
    ...reviewed,
    id: 'symbol',
    review: { ...reviewed.review, completedAt: '2026-09-24T12:00:00Z' },
  };
  const anotherAccount = {
    ...recentSymbol,
    id: 'other-account',
    accountId: 'other',
    playbook: samePlan.playbook,
  };
  const draft = { ...base, id: 'new', playbook: samePlan.playbook };
  assert.deepEqual(
    relevantReviewedLesson([recentSymbol, anotherAccount, samePlan], draft),
    { trade: samePlan, reason: 'playbook' },
  );
  assert.equal(
    relevantReviewedLesson([anotherAccount], draft),
    undefined,
  );
  assert.equal(
    relevantReviewedLesson([recentSymbol], { ...draft, playbook: undefined, setup: '' })?.reason,
    'symbol',
  );
});

void test('lesson recall excludes open trades, blank lessons and unfinished reviews', () => {
  const base = demoData().trades[0];
  const review = {
    checklist: [],
    emotion: '' as const,
    lesson: 'Keep my process',
    completedAt: '2026-09-24T12:00:00Z',
  };
  assert.equal(
    latestReviewedLesson([
      { ...base, status: 'OPEN', review },
      { ...base, status: 'CLOSED', review: { ...review, lesson: '  ' } },
      {
        ...base,
        status: 'CLOSED',
        review: { ...review, completedAt: undefined },
      },
    ]),
    undefined,
  );
  assert.equal(latestReviewedLesson([]), undefined);
});

void test('greeting follows the account timezone and switches at day boundaries', () => {
  const instant = new Date('2026-09-24T03:30:00Z');
  const bangkok = companionClock(instant, 'Asia/Bangkok');
  const newYork = companionClock(instant, 'America/New_York');
  assert.deepEqual(bangkok, { hour: 10, minute: 30, date: '2026-09-24' });
  assert.deepEqual(newYork, { hour: 23, minute: 30, date: '2026-09-23' });
  assert.equal(companionGreeting(bangkok.hour).th, 'สวัสดีตอนเช้า');
  assert.equal(companionGreeting(newYork.hour).en, 'Good evening');
  assert.equal(companionGreeting(newYork.hour).th, 'สวัสดีตอนค่ำ');
});

void test('daily prompt uses the journal before suggesting any new entry', () => {
  const trades = demoData().trades;
  assert.equal(companionPrompt(trades, '2026-09-24').kind, 'review');
  assert.equal(
    companionPrompt(
      [...trades, { ...trades[0], id: 'open-now', status: 'OPEN' }],
      '2026-09-24',
    ).kind,
    'open',
  );
  assert.equal(companionPrompt([], '2026-09-24').kind, 'capture');
  assert.equal(
    companionPrompt(
      [{ ...trades[0], date: '2026-09-24', status: 'OPEN' }],
      '2026-09-24',
    ).kind,
    'open',
  );
});
