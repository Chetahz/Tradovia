import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isQuietTime,
  reviewReminderDue,
  validateReviewReminder,
} from '../lib/review-reminder.ts';

void test('quiet hours support an overnight range', () => {
  assert.equal(isQuietTime('23:15', '22:00', '07:00'), true);
  assert.equal(isQuietTime('06:59', '22:00', '07:00'), true);
  assert.equal(isQuietTime('07:00', '22:00', '07:00'), false);
  assert.equal(isQuietTime('20:30', '22:00', '07:00'), false);
});

void test('review reminder becomes due after its time and outside quiet hours', () => {
  const reminder = {
    enabled: true,
    time: '19:30',
    quietStart: '22:00',
    quietEnd: '07:00',
  };
  assert.equal(reviewReminderDue('19:29', reminder), false);
  assert.equal(reviewReminderDue('19:30', reminder), true);
  assert.equal(reviewReminderDue('22:01', reminder), false);
});

void test('review reminder input is validated', () => {
  assert.deepEqual(
    validateReviewReminder({
      enabled: false,
      time: '20:00',
      quietStart: '22:00',
      quietEnd: '07:00',
    }),
    {
      enabled: false,
      time: '20:00',
      quietStart: '22:00',
      quietEnd: '07:00',
    },
  );
  assert.throws(() =>
    validateReviewReminder({
      enabled: true,
      time: '25:00',
      quietStart: '22:00',
      quietEnd: '07:00',
    }),
  );
});
