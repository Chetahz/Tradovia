import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mt5Trade, validateMt5Position } from '../lib/mt5-sync.ts';
import { net } from '../lib/domain.ts';

const position = {
  positionId: '123456789012345678', symbol: 'XAUUSD.pro', side: 'LONG' as const,
  openTime: '2026.09.25 09:30:00', closeTime: '2026.09.25 10:35:00',
  entry: 2491.25, closePrice: 2503.5, volume: 0.01,
  profit: 12.25, commission: -0.35, swap: -0.1,
  reportedSl: 2480, reportedTp: 2500,
};

await test('MT5 position becomes a closed journal entry with net fees and source metadata', () => {
  const trade = mt5Trade(validateMt5Position(position), 'account-1', 'mt5_position_1');
  assert.equal(trade.symbol, 'XAUUSD');
  assert.equal(trade.lot, 0.01);
  assert.equal(trade.sl, 0);
  assert.equal(trade.tp, 0);
  assert.equal(net(trade), 11.8);
  assert.equal(trade.importRef?.positionId, position.positionId);
  assert.equal(trade.importRef?.closeDate, '2026-09-25');
});

await test('MT5 payload rejects open, malformed and implausible positions', () => {
  assert.throws(() => validateMt5Position({ ...position, volume: 0 }));
  assert.throws(() => validateMt5Position({ ...position, positionId: 'bad-id' }));
  assert.throws(() => validateMt5Position({ ...position, closeTime: '2026.09.24 10:35:00' }));
  assert.throws(() => validateMt5Position({ ...position, profit: Infinity }));
});
