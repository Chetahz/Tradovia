import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCsv,
  previewCsv,
  csvTemplate,
  tradeFingerprint,
} from '../lib/trade-csv.ts';
import { statistics } from '../lib/domain.ts';

test('CSV preserves quoted commas, multiline text, BOM and escaped quotes', () => {
  assert.deepEqual(
    parseCsv('\uFEFFa,b\r\n"hello, world","line1\n""line2"""\r\n'),
    [
      ['a', 'b'],
      ['hello, world', 'line1\n"line2"'],
    ],
  );
  assert.throws(() => parseCsv('a,b\n"unclosed,x'));
  assert.throws(() => parseCsv('a,b\n"closed"junk,x'));
});
test('Template validates and reconciles net P&L in existing analytics', () => {
  const rows = previewCsv(csvTemplate, 'account-1');
  assert.equal(rows.length, 1);
  assert.ok(rows[0].trade);
  assert.equal(rows[0].trade.accountId, 'account-1');
  assert.equal(statistics([rows[0].trade], 1000).pnl, 95);
  assert.equal(statistics([rows[0].trade], 1000).averageR, 1.9);
});
test('Missing columns, duplicate headers, invalid dates and ambiguous numbers are rejected', () => {
  assert.throws(() => previewCsv('symbol,side\nXAUUSD,BUY', 'a'));
  assert.throws(() =>
    previewCsv(csvTemplate.replace('symbol,', 'symbol,symbol,'), 'a'),
  );
  for (const text of [
    csvTemplate.replace('2026-09-01', '2026-02-30'),
    csvTemplate.replace('2500,', '2e3,'),
    csvTemplate.replace(',5,50,', ',-5,50,'),
    csvTemplate.replace(',100,5,', ',,5,'),
  ]) {
    assert.ok(previewCsv(text, 'a')[0].error);
  }
});
test('Duplicate fingerprint ignores generated IDs but keeps accounts separate', () => {
  const a = previewCsv(csvTemplate, 'a')[0].trade!;
  const b = previewCsv(csvTemplate, 'a')[0].trade!;
  assert.notEqual(a.id, b.id);
  assert.equal(tradeFingerprint(a), tradeFingerprint(b));
  assert.notEqual(
    tradeFingerprint(a),
    tradeFingerprint({ ...b, accountId: 'b' }),
  );
});
test('Row limit and open-trade results are enforced', () => {
  const [header, row] = csvTemplate.trim().split('\r\n');
  assert.throws(() =>
    previewCsv([header, ...Array(501).fill(row)].join('\n'), 'a'),
  );
  assert.ok(previewCsv(csvTemplate.replace('CLOSED', 'OPEN'), 'a')[0].error);
});
