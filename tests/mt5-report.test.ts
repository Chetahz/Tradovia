import assert from 'node:assert/strict';
import test from 'node:test';
import {
  detectMt5ReportSource,
  previewMt5Html,
  previewMt5Rows,
} from '../lib/mt5-report.ts';
import { net } from '../lib/domain.ts';

const rows = [
  ['Positions'],
  [
    'Time',
    'Position',
    'Symbol',
    'Type',
    'Volume',
    'Price',
    'S / L',
    'T / P',
    'Time',
    'Price',
    'Commission',
    'Swap',
    'Profit',
  ],
  [
    '2026.04.01 10:28:07',
    '300640609',
    'XAUUSD.G',
    'sell',
    '0.05',
    '4719.60',
    '4700',
    '',
    '2026.04.01 10:28:48',
    '4723.50',
    '-1.25',
    '-0.50',
    '-19.50',
  ],
  ['Orders'],
];

void test('MT5 Positions map to one closed trade with source metadata', () => {
  const [result] = previewMt5Rows(rows, 'account-1');
  assert.equal(result.error, undefined);
  assert.equal(result.trade?.symbol, 'XAUUSD');
  assert.equal(result.trade?.side, 'SHORT');
  assert.equal(result.trade?.sl, 0);
  assert.equal(result.trade?.importRef?.reportedSl, 4700);
  assert.equal(result.trade?.importRef?.closeTime, '10:28');
  assert.equal(net(result.trade!), -21.25);
});

void test('MT5 HTML reports are accepted', () => {
  const html = `<table>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('')}</table>`;
  const result = previewMt5Html(html, 'account-1');
  assert.equal(result.length, 1);
  assert.equal(result[0].trade?.importRef?.positionId, '300640609');
});

void test('Exness MT5 reports are detected and flexible closed-trade headers map correctly', () => {
  const exnessRows = [
    ['Exness Technologies Ltd'],
    ['Closed Positions'],
    [
      'Open Time',
      'Ticket',
      'Instrument',
      'Direction',
      'Lots',
      'Open Price',
      'Stop Loss',
      'Take Profit',
      'Close Time',
      'Close Price',
      'P/L',
    ],
    [
      '2026-04-02 08:05:00',
      '91234567',
      'EURUSD',
      'long',
      '0.10',
      '1.0840',
      '1.0800',
      '1.0920',
      '2026-04-02 09:15:00',
      '1.0880',
      '$40.00',
    ],
    ['Summary'],
  ];
  assert.equal(detectMt5ReportSource(exnessRows), 'Exness MT5');
  const [result] = previewMt5Rows(exnessRows, 'account-1');
  assert.equal(result.error, undefined);
  assert.equal(result.trade?.side, 'LONG');
  assert.equal(result.trade?.gross, 40);
  assert.equal(result.trade?.fees, 0);
  assert.equal(result.trade?.importRef?.reportedTp, 1.092);
});

void test('broker numbers with accounting negatives are accepted', () => {
  const accountingRows = rows.map((row) => [...row]);
  accountingRows[2][10] = '($1.25)';
  accountingRows[2][11] = '−0.50';
  accountingRows[2][12] = '$19.50';
  const [result] = previewMt5Rows(accountingRows, 'account-1');
  assert.equal(result.error, undefined);
  assert.equal(net(result.trade!), 17.75);
});
