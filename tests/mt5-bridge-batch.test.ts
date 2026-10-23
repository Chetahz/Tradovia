import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareMt5PilotImport } from '../lib/mt5-pilot-import.ts';

const id = 'b6801b64-b393-4c21-8d57-fc202b4ed1ce';
const position = {
  positionId: '712345', symbol: 'XAUUSD.pro', side: 'LONG',
  openTime: '2026.09.27 03:30:00', closeTime: '2026.09.27 04:15:00',
  entry: 2500, closePrice: 2510, volume: 0.01,
  profit: 10, commission: -0.3, swap: -0.1, reportedSl: 0, reportedTp: 0,
};

void test('bridge replay remains idempotent when SL/TP are unknown', () => {
  const first = prepareMt5PilotImport([position], 'owner-account', id, []);
  assert.equal(first.accepted.length, 1);
  assert.equal(first.accepted[0].importRef?.reportedSl, 0);
  const replay = prepareMt5PilotImport([position], 'owner-account', id, first.accepted);
  assert.equal(replay.accepted.length, 0);
  assert.equal(replay.duplicate, 1);
});

void test('same broker position in another journal account has a different identity', () => {
  const first = prepareMt5PilotImport([position], 'owner-account', id, []);
  const second = prepareMt5PilotImport([position], 'other-account', id, first.accepted);
  assert.equal(second.accepted.length, 1);
  assert.equal(second.accepted[0].accountId, 'other-account');
});
