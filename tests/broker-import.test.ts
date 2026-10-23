import assert from 'node:assert/strict';
import test from 'node:test';
import {
  brokerMappingReady,
  parseBrokerCsv,
  prepareBrokerSheet,
  previewBrokerRows,
} from '../lib/broker-import.ts';
import { net } from '../lib/domain.ts';

void test('universal broker CSV detects semicolon headers after a preamble', () => {
  const table = parseBrokerCsv(
    'Broker statement\nSymbol;Direction;Open Time;Open Price;Lots;P/L;Commission;Swap;Ticket\nEURUSD;Buy;2026-10-02 09:30;1.1750;0.10;42.50;(1.25);-0.50;A-1001',
  );
  const sheet = prepareBrokerSheet(table);
  assert.equal(sheet.headerRow, 2);
  assert.equal(sheet.rows.length, 1);
  assert.equal(brokerMappingReady(sheet.mapping), true);
  const [result] = previewBrokerRows(sheet, sheet.mapping, 'account-1');
  assert.equal(result.error, undefined);
  assert.equal(result.trade?.symbol, 'EURUSD');
  assert.equal(result.trade?.side, 'LONG');
  assert.equal(result.trade?.importRef?.format, 'BROKER');
  assert.equal(result.trade?.importRef?.positionId, 'A-1001');
  assert.equal(net(result.trade!), 40.75);
});

void test('manual mappings support separate Excel date and time columns', () => {
  const sheet = prepareBrokerSheet([
    ['Instrument', 'Side', 'Date', 'Time', 'Entry', 'Volume', 'Profit'],
    ['XAUUSD', 'sell', '45932', '0.5', '2500', '0.02', '$15.00'],
  ]);
  assert.equal(brokerMappingReady(sheet.mapping), true);
  const [result] = previewBrokerRows(sheet, sheet.mapping, 'account-1');
  assert.equal(result.error, undefined);
  assert.equal(result.trade?.side, 'SHORT');
  assert.equal(result.trade?.time, '12:00');
});

void test('unmapped required broker fields cannot be previewed', () => {
  const sheet = prepareBrokerSheet([
    ['Symbol', 'Side', 'Date'],
    ['EURUSD', 'buy', '2026-10-02'],
  ]);
  assert.equal(brokerMappingReady(sheet.mapping), false);
  assert.throws(
    () => previewBrokerRows(sheet, sheet.mapping, 'account-1'),
    /Map all required columns/,
  );
});
