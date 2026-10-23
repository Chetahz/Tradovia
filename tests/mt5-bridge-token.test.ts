import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bridgeBearer, createMt5BridgeToken, hashMt5BridgeToken } from '../lib/mt5-bridge-token.ts';

void test('connection token is random, scoped by exact bearer syntax and stored only as a hash', async () => {
  const first = createMt5BridgeToken();
  const second = createMt5BridgeToken();
  assert.notEqual(first, second);
  assert.equal(bridgeBearer(`Bearer ${first}`), first);
  assert.equal(bridgeBearer(`Basic ${first}`), null);
  assert.equal(bridgeBearer(`Bearer ${first}extra`), null);
  const hash = await hashMt5BridgeToken(first);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, await hashMt5BridgeToken(second));
  assert.doesNotMatch(hash, /tdv_mt5_/);
});
