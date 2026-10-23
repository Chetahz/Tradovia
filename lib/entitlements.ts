import type { WorkspaceData } from './domain';

export function effectiveSubscription(subscription: WorkspaceData['subscription'], owner: boolean): WorkspaceData['subscription'] {
  if (owner) return { plan: 'elite', status: 'owner', renewal: null, cancelAtPeriodEnd: false };
  const active = ['active', 'trialing'].includes(subscription.status);
  const expired = subscription.renewal !== null &&
    (!Number.isFinite(Date.parse(subscription.renewal)) || Date.parse(subscription.renewal) <= Date.now());
  if (!active || expired) return { plan: 'manual', status: 'free', renewal: null, cancelAtPeriodEnd: false };
  return subscription;
}
