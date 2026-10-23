import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  authConfig,
  safeReturnTo,
  seal,
  unseal,
  isOwner,
  cookieNames,
} from '../lib/auth-core.ts';
import { effectiveSubscription } from '../lib/entitlements.ts';
import { validAccountDeletionConfirmation } from '../lib/account-deletion.ts';
import {
  auth0ManagementConfig,
  deleteAuth0Identity,
} from '../lib/auth0-management.ts';
import { requireStripe } from '../lib/stripe.ts';

const secret = 'ab'.repeat(32);
await test('session cannot be forged, reused as a login transaction, or decrypted with another key', async () => {
  const token = await seal(
    { sid: 'session-a', sub: 'auth0|a' },
    secret,
    'session',
    60,
  );
  assert.equal((await unseal(token, secret, 'session')).sub, 'auth0|a');
  await assert.rejects(unseal(token, secret, 'login'));
  await assert.rejects(unseal(token, 'cd'.repeat(32), 'session'));
  const parts = token.split('.');
  parts[3] = (parts[3][0] === 'A' ? 'B' : 'A') + parts[3].slice(1);
  await assert.rejects(unseal(parts.join('.'), secret, 'session'));
  await assert.rejects(
    unseal(
      await seal({ sid: 'old' }, secret, 'session', -1),
      secret,
      'session',
    ),
  );
});
await test('return paths reject external URLs and auth loops', () => {
  for (const path of [
    '//evil.test',
    '/\\evil.test',
    '/auth/logout',
    'https://evil.test',
    '/workspace/../auth/login',
    '/ workspace',
  ])
    assert.equal(safeReturnTo(path), '/workspace');
  assert.equal(safeReturnTo('/workspace#journal'), '/workspace#journal');
  assert.equal(safeReturnTo('/admin'), '/admin');
  assert.equal(safeReturnTo('/admin?focus=issues'), '/admin?focus=issues');
});
await test('auth configuration requires canonical secure origins and a full encryption key', () => {
  const config = {
    APP_ORIGIN: 'https://app.example',
    AUTH_ISSUER: 'https://tradovia.jp.auth0.com/',
    AUTH_CLIENT_ID: 'client',
    AUTH_CLIENT_SECRET: 'secret',
    AUTH_SESSION_SECRET: secret,
  };
  assert.equal(authConfig(config).secure, true);
  for (const origin of [
    'http://app.example',
    'https://app.example/path',
    'https://app.example/',
  ])
    assert.throws(() => authConfig({ ...config, APP_ORIGIN: origin }));
  assert.throws(() => authConfig({ ...config, AUTH_SESSION_SECRET: 'short' }));
  assert.equal(cookieNames(true).session, '__Host-tradovia_session');
});
await test('Owner requires exact server configured subject; expired subscriptions lose paid access', () => {
  assert.equal(isOwner('auth0|a', ''), false);
  assert.equal(isOwner('auth0|a', 'auth0|b'), false);
  assert.equal(isOwner('auth0|a', 'auth0|a'), true);
  const sub = {
    plan: 'pro' as const,
    status: 'active',
    renewal: '2099-01-01',
    cancelAtPeriodEnd: false,
  };
  assert.equal(effectiveSubscription(sub, false).plan, 'pro');
  assert.equal(
    effectiveSubscription({ ...sub, status: 'canceled' }, false).plan,
    'manual',
  );
  assert.equal(
    effectiveSubscription({ ...sub, renewal: '2020-01-01' }, false).plan,
    'manual',
  );
  assert.equal(effectiveSubscription(sub, true).status, 'owner');
});
await test('account deletion requires an explicit exact confirmation', () => {
  assert.equal(validAccountDeletionConfirmation('DELETE'), true);
  assert.equal(validAccountDeletionConfirmation(' delete '), true);
  assert.equal(validAccountDeletionConfirmation('ลบบัญชี'), true);
  assert.equal(validAccountDeletionConfirmation('delete my account'), false);
  assert.equal(validAccountDeletionConfirmation(null), false);
});

await test('Stripe launch catalog requires aligned monthly and annual Pro prices', () => {
  const base = {
    APP_ORIGIN: 'https://app.example',
    STRIPE_SECRET_KEY: 'sk_test_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRO_ANNUAL_PRICE_ID: 'price_year',
  };
  assert.throws(() => requireStripe(base));
  const current = requireStripe({
    ...base,
    STRIPE_PRO_MONTHLY_PRICE_ID: 'price_month',
  });
  assert.equal(current.proMonthlyPriceId, 'price_month');
  assert.equal(current.proAnnualPriceId, 'price_year');
  const legacy = requireStripe({
    ...base,
    STRIPE_PRO_PRICE_ID: 'price_legacy_month',
  });
  assert.equal(legacy.proMonthlyPriceId, 'price_legacy_month');
});

await test('Auth0 identity deletion is optional, encoded, and uses a short-lived management token', async () => {
  assert.equal(auth0ManagementConfig({}), null);
  assert.throws(() =>
    auth0ManagementConfig({
      AUTH_ISSUER: 'https://tenant.example/',
      AUTH_MANAGEMENT_CLIENT_ID: 'client',
    }),
  );
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fakeFetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({
      url:
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      init,
    });
    if (calls.length === 1)
      return new Response(
        JSON.stringify({ access_token: 'management-token' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    return new Response(null, { status: 204 });
  };
  assert.equal(
    await deleteAuth0Identity(
      {
        AUTH_ISSUER: 'https://tenant.example/',
        AUTH_MANAGEMENT_CLIENT_ID: 'client',
        AUTH_MANAGEMENT_CLIENT_SECRET: 'secret',
      },
      'auth0|user/name',
      fakeFetch as typeof fetch,
    ),
    true,
  );
  assert.equal(calls[0].url, 'https://tenant.example/oauth/token');
  assert.equal(
    calls[1].url,
    'https://tenant.example/api/v2/users/auth0%7Cuser%2Fname',
  );
  const deleteHeaders = calls[1].init?.headers as
    | Record<string, string>
    | undefined;
  assert.equal(deleteHeaders?.Authorization, 'Bearer management-token');
});
