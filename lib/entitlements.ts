import type { WorkspaceData } from './domain';

export function effectiveSubscription(
  subscription: WorkspaceData['subscription'],
  owner: boolean,
): WorkspaceData['subscription'] {
  if (owner)
    return {
      plan: 'elite',
      status: 'owner',
      renewal: null,
      cancelAtPeriodEnd: false,
    };
  const active = ['active', 'trialing'].includes(subscription.status);
  const expired =
    subscription.renewal !== null &&
    (!Number.isFinite(Date.parse(subscription.renewal)) ||
      Date.parse(subscription.renewal) <= Date.now());
  // Preserve the provider state for billing recovery and account clarity. Feature
  // access is decided by plan-access.ts, not by hiding an inactive paid plan.
  if (active && expired) return { ...subscription, status: 'expired' };
  return subscription;
}
