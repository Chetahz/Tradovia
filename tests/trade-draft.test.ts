import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../lib/domain.ts';
import {
  clearTradeDraft,
  readTradeDraft,
  saveTradeDraft,
  tradeDraftKey,
} from '../lib/trade-draft.ts';

function memoryStorage() {
  const rows = new Map<string, string>();
  return {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => {
      rows.set(key, value);
    },
    removeItem: (key: string) => {
      rows.delete(key);
    },
  };
}

void test('unfinished entry restores exact decimal values and step without storing chart references', () => {
  const data = demoData();
  const storage = memoryStorage();
  const key = tradeDraftKey('demo', data.accounts)!;
  const trade = {
    ...data.trades[0],
    lot: 0.01,
    notes: 'Waited for confirmation',
    imageIds: ['private-chart'],
    imageStages: { 'private-chart': 'before' as const },
  };
  assert.equal(saveTradeDraft(storage, key, trade, 1, 1000), true);
  const restored = readTradeDraft(storage, key, data.accounts, 2000);
  assert.equal(restored?.trade.lot, 0.01);
  assert.equal(restored?.trade.notes, 'Waited for confirmation');
  assert.equal(restored?.step, 1);
  assert.deepEqual(restored?.trade.imageIds, []);
  assert.equal(storage.getItem(key)?.includes('private-chart'), false);
  clearTradeDraft(storage, key);
  assert.equal(readTradeDraft(storage, key, data.accounts, 2000), null);
});

void test('drafts are scoped by environment and account identity', () => {
  const accounts = demoData().accounts;
  const other = accounts.map((account) => ({
    ...account,
    id: `other-${account.id}`,
  }));
  assert.notEqual(
    tradeDraftKey('real', accounts),
    tradeDraftKey('demo', accounts),
  );
  assert.notEqual(
    tradeDraftKey('real', accounts),
    tradeDraftKey('real', other),
  );
  assert.equal(tradeDraftKey('real', []), null);
  const storage = memoryStorage();
  const key = tradeDraftKey('real', accounts)!;
  saveTradeDraft(storage, key, demoData().trades[0], 0, 1000);
  assert.equal(readTradeDraft(storage, key, other, 2000), null);
});

void test('expired and invalid drafts are discarded', () => {
  const data = demoData();
  const storage = memoryStorage();
  const key = tradeDraftKey('demo', data.accounts)!;
  saveTradeDraft(storage, key, data.trades[0], 0, 1000);
  assert.equal(
    readTradeDraft(storage, key, data.accounts, 32 * 86400_000),
    null,
  );
  storage.setItem(key, '{bad json');
  assert.equal(readTradeDraft(storage, key, data.accounts, 2000), null);
});
