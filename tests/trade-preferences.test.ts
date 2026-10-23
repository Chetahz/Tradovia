import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../lib/domain.ts';
import {
  readTradeDefaults,
  saveTradeDefaults,
  tradeDefaultsKey,
} from '../lib/trade-preferences.ts';

function memoryStorage() {
  const rows = new Map<string, string>();
  return {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  };
}

void test('restores the last successfully saved account and normalized symbol', () => {
  const accounts = demoData().accounts;
  const storage = memoryStorage();
  const key = tradeDefaultsKey('demo', accounts)!;
  assert.equal(
    saveTradeDefaults(storage, key, {
      accountId: accounts[0].id,
      symbol: ' eurusd ',
    }),
    true,
  );
  assert.deepEqual(readTradeDefaults(storage, key, accounts), {
    accountId: accounts[0].id,
    symbol: 'EURUSD',
  });
});

void test('defaults stay isolated by environment and account identity', () => {
  const accounts = demoData().accounts;
  const otherAccounts = accounts.map((account) => ({
    ...account,
    id: `other-${account.id}`,
  }));
  assert.notEqual(
    tradeDefaultsKey('demo', accounts),
    tradeDefaultsKey('real', accounts),
  );
  assert.notEqual(
    tradeDefaultsKey('real', accounts),
    tradeDefaultsKey('real', otherAccounts),
  );
  assert.equal(tradeDefaultsKey('real', []), null);
});

void test('stale accounts and malformed symbols are discarded', () => {
  const accounts = demoData().accounts;
  const storage = memoryStorage();
  const key = tradeDefaultsKey('demo', accounts)!;
  storage.setItem(
    key,
    JSON.stringify({ accountId: 'removed-account', symbol: 'EURUSD' }),
  );
  assert.equal(readTradeDefaults(storage, key, accounts), null);
  storage.setItem(
    key,
    JSON.stringify({ accountId: accounts[0].id, symbol: '<script>' }),
  );
  assert.equal(readTradeDefaults(storage, key, accounts), null);
});
