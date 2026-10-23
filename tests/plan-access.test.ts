import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { WorkspaceData } from '../lib/domain.ts';
import {
  FREE_LIMITS,
  PRO_LIMITS,
  hasProAccess,
  planLimits,
} from '../lib/plan-access.ts';

const subscription = (
  plan: WorkspaceData['subscription']['plan'],
  status: string,
): WorkspaceData['subscription'] => ({
  plan,
  status,
  renewal: null,
  cancelAtPeriodEnd: false,
});

await test('Free receives the launch limits', () => {
  const free = subscription('manual', 'active');
  assert.equal(hasProAccess(free), false);
  assert.deepEqual(planLimits(free), FREE_LIMITS);
  assert.deepEqual(FREE_LIMITS, {
    portfolios: 1,
    accounts: 1,
    trades: 50,
    images: 10,
    playbooks: 2,
    calendarDays: 30,
  });
});

await test('active, trialing and owner paid subscriptions receive Pro limits', () => {
  for (const status of ['active', 'trialing', 'owner']) {
    const paid = subscription(status === 'owner' ? 'elite' : 'pro', status);
    assert.equal(hasProAccess(paid), true);
    assert.deepEqual(planLimits(paid), PRO_LIMITS);
  }
});

await test('inactive paid subscriptions fall back to Free limits', () => {
  for (const status of ['canceled', 'expired', 'past_due']) {
    const inactive = subscription('pro', status);
    assert.equal(hasProAccess(inactive), false);
    assert.deepEqual(planLimits(inactive), FREE_LIMITS);
  }
});
