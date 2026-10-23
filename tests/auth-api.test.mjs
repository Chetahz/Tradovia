// Run only against the local fixture prepared by scripts/prepare-auth-test.mjs.
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seal } from '../lib/auth-core.ts';
const { vars } = JSON.parse(await readFile('.wrangler/auth-runtime.json', 'utf8'));
const origin = 'http://localhost:3000';
async function client(id) {
  const cookie = 'tradovia_session=' + await seal({ sid: 'test-' + id, sub: 'auth0|test-' + id }, vars.AUTH_SESSION_SECRET, 'session', 3600);
  return async (value, path = '/api/workspace') => fetch(origin + path, {
    method: value ? 'POST' : 'GET', redirect: 'manual',
    headers: { cookie, Origin: origin, 'Content-Type': 'application/json' },
    body: value ? JSON.stringify(value) : undefined,
  });
}
test('real accounts persist independently, Owner is server assigned and logout revokes session', async () => {
  const a = await client('a'), b = await client('b'), owner = await client('owner');
  assert.equal((await fetch(origin + '/api/workspace')).status, 401);
  assert.equal((await fetch(origin + '/api/workspace', { headers: { 'oai-authenticated-user-id': 'forged', 'oai-authenticated-user-email': 'fake@example.invalid' } })).status, 401);
  const dataA = await (await a()).json(), dataB = await (await b()).json();
  assert.equal(dataA.subscription.plan, 'manual');
  assert.equal(dataB.subscription.plan, 'manual');
  assert.equal((await (await owner()).json()).subscription.status, 'owner');
  const name = 'Account A ' + Date.now();
  assert.equal((await a({ action: 'saveProfile', value: { name, timezone: 'Asia/Bangkok', role: 'owner' } })).status, 200);
  assert.equal((await (await a()).json()).profile.name, name);
  assert.notEqual((await (await b()).json()).profile.name, name);
  assert.equal((await (await a()).json()).subscription.plan, 'manual');
  const planResponse = await a({ action: 'savePlaybook', value: { name: 'Private plan', entry: 'Confirmed entry' } });
  assert.equal(planResponse.status, 200);
  const plans = await planResponse.json();
  assert.ok(plans.playbooks.length > 0);
  assert.equal((await (await b()).json()).playbooks.length, 0);
  assert.equal((await owner({ action: 'checkout', plan: 'pro' }, '/api/billing')).status, 403);
  const logout = await a({}, '/auth/logout');
  assert.equal(logout.status, 303);
  assert.equal((await a()).status, 401);
  assert.equal((await b()).status, 200);
  assert.equal((await fetch(origin + '/auth/logout', { method: 'POST', headers: { Origin: 'https://evil.example' } })).status, 403);
});
