import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDailyCheckin } from '../lib/daily-checkin.ts';

void test('daily plan keeps only validated fields and the server-selected date', () => {
  const row = validateDailyCheckin(
    {
      kind: 'plan',
      focus: 'risk',
      playbookId: 'mine',
      maxLoss: 75,
      note: '  Wait for my zone  ',
      date: '2099-01-01',
    },
    '2026-09-29',
    ['mine'],
    false,
  );
  assert.equal(row.date, '2026-09-29');
  assert.equal(row.kind, 'plan');
  assert.equal(row.note, 'Wait for my zone');
  assert.equal(row.maxLoss, 75);
  assert.throws(() =>
    validateDailyCheckin(
      { kind: 'plan', focus: 'risk', playbookId: 'another', note: '' },
      '2026-09-29',
      ['mine'],
      false,
    ),
  );
  assert.throws(() =>
    validateDailyCheckin(
      { kind: 'plan', focus: 'risk', maxLoss: -1, note: '' },
      '2026-09-29',
      [],
      false,
    ),
  );
});

void test('a no-trade day cannot be recorded after a trade exists', () => {
  const input = { kind: 'rest', reason: 'no-setup', note: '' };
  assert.equal(
    validateDailyCheckin(input, '2026-09-29', [], false).kind,
    'rest',
  );
  assert.throws(
    () => validateDailyCheckin(input, '2026-09-29', [], true),
    /trade is already recorded/,
  );
});
