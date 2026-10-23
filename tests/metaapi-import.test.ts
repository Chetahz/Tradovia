import assert from 'node:assert/strict';
import { test } from 'node:test';
import { closedPositionIds, positionFromMetaApiDeals, type MetaApiDeal } from '../lib/metaapi-import.ts';
import { createMetaApiDraft, metaApiConfigurationLink, validMt5Server } from '../lib/metaapi.ts';

const entered: MetaApiDeal = {
  id: '1', positionId: '9001', platform: 'mt5', type: 'DEAL_TYPE_BUY', entryType: 'DEAL_ENTRY_IN',
  symbol: 'XAUUSD.pro', volume: 0.01, price: 2491, profit: 0, commission: -0.1, swap: 0,
  time: '2026-09-20T02:30:00.000Z', brokerTime: '2026-09-20 09:30:00.000', stopLoss: 2480,
};
const exited: MetaApiDeal = {
  ...entered, id: '2', type: 'DEAL_TYPE_SELL', entryType: 'DEAL_ENTRY_OUT',
  price: 2500, profit: 9, commission: -0.1, time: '2026-09-20T03:00:00.000Z', brokerTime: '2026-09-20 10:00:00.000',
};

void test('MetaApi closed MT5 position maps from server times, preserving net costs', () => {
  const position = positionFromMetaApiDeals([exited, entered]);
  assert.equal(position?.positionId, '9001');
  assert.equal(position?.openTime, '2026.09.20 09:30:00');
  assert.equal(position?.closeTime, '2026.09.20 10:00:00');
  assert.equal(position?.profit, 9);
  assert.equal(position?.commission, -0.2);
  assert.deepEqual(closedPositionIds([entered, exited]), ['9001']);
});

void test('partial exit, reversal and mismatched deal are not published as a closed trade', () => {
  assert.equal(positionFromMetaApiDeals([entered, { ...exited, volume: 0.005 }]), null);
  assert.equal(positionFromMetaApiDeals([entered, { ...exited, entryType: 'DEAL_ENTRY_INOUT' }]), null);
  assert.equal(positionFromMetaApiDeals([entered, { ...exited, positionId: '9002' }]), null);
});

void test('MT5 server must be an exact plausible server name, not a URL', () => {
  assert.equal(validMt5Server('ICMarketsSC-MT5'), true);
  assert.equal(validMt5Server('Broker Live 01'), true);
  assert.equal(validMt5Server('https://evil.example'), false);
});

void test('provider draft receives no broker login or password and configuration stays on MetaApi', async () => {
  const original = globalThis.fetch;
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    calls.push({ url, init: init || {} });
    return Response.json(calls.length === 1 ? { id: '00000000-0000-0000-0000-000000000001', state: 'DRAFT' }
      : { configurationLink: 'https://app.metaapi.cloud/configure-trading-account-credentials/example' },
      { status: calls.length === 1 ? 201 : 200 });
  };
  try {
    await createMetaApiDraft('test-token', 'Journal', 'Broker-MT5', '00000000000000000000000000000001');
    const rawBody = calls[0].init.body;
    if (typeof rawBody !== 'string') throw new Error('Expected a JSON request body');
    const body = JSON.parse(rawBody);
    assert.equal(body.platform, 'mt5');
    assert.equal(body.server, 'Broker-MT5');
    assert.equal(body.login, undefined);
    assert.equal(body.password, undefined);
    assert.equal(await metaApiConfigurationLink('test-token', '00000000-0000-0000-0000-000000000001'),
      'https://app.metaapi.cloud/configure-trading-account-credentials/example');
  } finally { globalThis.fetch = original; }
});
