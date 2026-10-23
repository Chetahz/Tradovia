import type { WorkspaceData } from './domain';

export const FREE_LIMITS = {
  portfolios: 1,
  accounts: 1,
  trades: 50,
  images: 10,
  playbooks: 2,
  calendarDays: 30,
} as const;

export const PRO_LIMITS = {
  portfolios: 20,
  accounts: 100,
  trades: 5000,
  images: 100,
  playbooks: 100,
} as const;

export function hasProAccess(subscription: WorkspaceData['subscription']) {
  return ['pro', 'elite'].includes(subscription.plan) &&
    ['active', 'trialing', 'owner'].includes(subscription.status);
}

export function planLimits(subscription: WorkspaceData['subscription']) {
  return hasProAccess(subscription) ? PRO_LIMITS : FREE_LIMITS;
}
