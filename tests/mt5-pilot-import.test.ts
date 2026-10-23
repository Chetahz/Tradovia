import assert from 'node:assert/strict';
import { test } from 'node:test';
import { net } from '../lib/domain.ts';
import { prepareMt5PilotImport } from '../lib/mt5-pilot-import.ts';

const connectionId = 'b6801b64-b393-4c21-8d57-fc202b4ed1ce';
const position = {
  positionId: '10001', symbol: 'XAUUSD.pro', side: 'LONG',
  openTime: '2026.09.27 03:30:00', closeTime: '2026.09.27 04:15:00',
  entry: 2500, closePrice: 2510, volume: 0.01,
  profit: 10, commission: -0.3, swap: -0.1, reportedSl: 2490, reportedTp: 2520,
};

await test('pilot import validates, deduplicates and maps closed MT5 positions', () => {
  const batch = prepareMt5PilotImport(
    [position, position, { ...position, positionId: '10002', volume: 0 }],
    'journal-1', connectionId, [],
  );
  assert.equal(batch.accepted.length, 1);
  assert.equal(batch.duplicate, 1);
  assert.equal(batch.invalid, 1);
  assert.equal(batch.accepted[0].id, 'mt5_b6801b64b3934c218d57fc202b4ed1ce_10001');
  assert.equal(batch.accepted[0].lot, 0.01);
  assert.equal(net(batch.accepted[0]), 9.6);
  assert.equal(batch.accepted[0].importRef?.brokerSymbol, 'XAUUSD.PRO');
  assert.equal(batch.accepted[0].importRef?.closeTime, '04:15');
  const replay = prepareMt5PilotImport([position], 'journal-1', connectionId, batch.accepted);
  assert.equal(replay.accepted.length, 0);
  assert.equal(replay.duplicate, 1);
});

await test('pilot import keeps different journal accounts isolated', () => {
  const first = prepareMt5PilotImport([position], 'journal-1', connectionId, []);
  const second = prepareMt5PilotImport([position], 'journal-2', connectionId, first.accepted);
  assert.equal(second.accepted.length, 1);
  assert.equal(second.accepted[0].accountId, 'journal-2');
});

await test('pilot import rejects oversized or malformed batches', () => {
  assert.throws(() => prepareMt5PilotImport(Array(501).fill(position), 'journal-1', connectionId, []));
  assert.throws(() => prepareMt5PilotImport([position], '../foreign', connectionId, []));
  assert.throws(() => prepareMt5PilotImport([position], 'journal-1', 'bad-connection', []));
});
