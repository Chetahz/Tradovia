import { unzipSync } from 'fflate';
import { validateTrade } from './domain.ts';
import type { CsvRow } from './trade-csv.ts';

const MAX_FILE = 5 * 1024 * 1024;
const MAX_UNPACKED = 30 * 1024 * 1024;

function decodeXml(value: Uint8Array) {
  const utf16 =
    (value[0] === 0xff && value[1] === 0xfe) ||
    (value[0] === 0x3c && value[1] === 0);
  return new TextDecoder(utf16 ? 'utf-16le' : 'utf-8').decode(value);
}

function entities(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(x?[0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(
        code[0].toLowerCase() === 'x'
          ? parseInt(code.slice(1), 16)
          : parseInt(code, 10),
      ),
    )
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .trim();
}

function number(value: string, label: string, optional = false) {
  let clean = String(value ?? '')
    .trim()
    .replace(/[\s,฿$€£¥]/g, '')
    .replace(/−/g, '-');
  if (/^\(.+\)$/.test(clean)) clean = `-${clean.slice(1, -1)}`;
  if (!clean && optional) return 0;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(clean))
    throw Error(`Invalid ${label} / ${label} ไม่ถูกต้อง`);
  return Number(clean);
}

function label(value: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&nbsp;/g, '')
    .replace(/[\s/_-]+/g, '');
}

const POSITION_SECTIONS = new Set([
  'positions',
  'closedpositions',
  'closedtrades',
  'tradehistory',
]);

const END_SECTIONS = new Set([
  'orders',
  'deals',
  'transactions',
  'summary',
  'accountsummary',
]);

function sectionIndex(rows: string[][]) {
  return rows.findIndex((row) =>
    row.some((cell) => POSITION_SECTIONS.has(label(cell))),
  );
}

export type Mt5ReportPreview = {
  rows: CsvRow[];
  source: string;
};

export function detectMt5ReportSource(rows: string[][]) {
  const heading = rows.slice(0, 30).flat().join(' ').toLowerCase();
  if (heading.includes('exness')) return 'Exness MT5';
  return 'MetaTrader 5';
}

function mt5DateTime(value: string) {
  const match = value
    .trim()
    .match(/^(\d{4})[./-](\d{2})[./-](\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) throw Error('Invalid MT5 date/time / วันเวลา MT5 ไม่ถูกต้อง');
  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: `${match[4]}:${match[5]}`,
  };
}

function columnIndex(reference: string) {
  let result = 0;
  for (const char of reference.match(/^[A-Z]+/i)?.[0] ?? '')
    result = result * 26 + char.toUpperCase().charCodeAt(0) - 64;
  return result - 1;
}

function parseXlsxTables(buffer: ArrayBuffer) {
  if (buffer.byteLength > MAX_FILE) throw Error('Maximum 5 MB / ขนาดสูงสุด 5 MB');
  const zip = unzipSync(new Uint8Array(buffer));
  const unpacked = Object.values(zip).reduce(
    (sum, value) => sum + value.length,
    0,
  );
  if (unpacked > MAX_UNPACKED)
    throw Error('Workbook is too large / ไฟล์มีข้อมูลมากเกินไป');
  const sharedXml = zip['xl/sharedStrings.xml']
    ? decodeXml(zip['xl/sharedStrings.xml'])
    : '';
  const shared = [...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi)].map(
    (match) =>
      [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)]
        .map((part) => entities(part[1]))
        .join(''),
  );
  const sheets = Object.keys(zip)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort();
  return sheets.map((sheet) => {
    const xml = decodeXml(zip[sheet]);
    const rows = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)].map(
      (rowMatch) => {
        const row: string[] = [];
        for (const cell of rowMatch[1].matchAll(
          /<c\b([^>]*?)(?:\s*\/>|>([\s\S]*?)<\/c>)/gi,
        )) {
          const ref = cell[1].match(/\br="([A-Z]+)\d+"/i)?.[1];
          const index = ref ? columnIndex(ref) : row.length;
          const type = cell[1].match(/\bt="([^"]+)"/i)?.[1];
          const content = cell[2] ?? '';
          const raw = content.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i)?.[1] ?? '';
          const inline = content.match(/<t\b[^>]*>([\s\S]*?)<\/t>/i)?.[1];
          row[index] =
            type === 's'
              ? (shared[Number(raw)] ?? '')
              : entities(inline ?? raw);
        }
        return row;
      },
    );
    return rows;
  });
}

export function parseXlsxRows(buffer: ArrayBuffer) {
  const tables = parseXlsxTables(buffer);
  const best = tables
    .filter((rows) => rows.length)
    .sort(
      (a, b) =>
        b.reduce((sum, row) => sum + row.filter(Boolean).length, 0) -
        a.reduce((sum, row) => sum + row.filter(Boolean).length, 0),
    )[0];
  if (!best) throw Error('Workbook has no rows / ไม่พบข้อมูลในไฟล์ Excel');
  return best;
}

export function parseMt5XlsxRows(buffer: ArrayBuffer) {
  for (const rows of parseXlsxTables(buffer)) {
    if (sectionIndex(rows) >= 0) return rows;
  }
  throw Error(
    'MT5 closed positions section not found / ไม่พบรายการเทรดที่ปิดแล้วในรายงาน MT5',
  );
}

function htmlRows(text: string) {
  if (text.length > MAX_FILE) throw Error('Maximum 5 MB / ขนาดสูงสุด 5 MB');
  return [...text.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((rowMatch) => {
    const row: string[] = [];
    for (const cell of rowMatch[1].matchAll(
      /<(?:td|th)\b([^>]*)>([\s\S]*?)<\/(?:td|th)>/gi,
    )) {
      row.push(entities(cell[2]));
      const colspan = Math.min(
        30,
        Math.max(1, Number(cell[1].match(/\bcolspan=["']?(\d+)/i)?.[1] ?? 1)),
      );
      for (let i = 1; i < colspan; i++) row.push('');
    }
    return row;
  });
}

function findHeader(rows: string[][], start: number) {
  const find = (labels: string[], aliases: string[]) =>
    labels.findIndex((value) => aliases.includes(value));
  for (let i = start; i < Math.min(rows.length, start + 10); i++) {
    const labels = rows[i].map(label);
    const position = find(labels, [
      'position',
      'positionid',
      'ticket',
      'order',
      'orderid',
    ]);
    const symbol = find(labels, ['symbol', 'instrument']);
    const type = find(labels, ['type', 'side', 'direction']);
    const volume = find(labels, ['volume', 'lot', 'lots', 'size']);
    if (position >= 0 && symbol >= 0 && type >= 0 && volume >= 0)
      return { row: i, position, symbol, type, volume, labels };
  }
  throw Error('MT5 trade columns not found / ไม่พบคอลัมน์ประวัติเทรดของ MT5');
}

function findColumn(labels: string[], aliases: string[]) {
  return labels.findIndex((value) => aliases.includes(value));
}

function findPair(
  labels: string[],
  firstAliases: string[],
  secondAliases: string[],
  fallback: string,
) {
  let first = findColumn(labels, firstAliases);
  let second = findColumn(labels, secondAliases);
  if (first < 0 || second < 0) {
    const matches = labels
      .map((value, index) => (value === fallback ? index : -1))
      .filter((index) => index >= 0);
    if (first < 0) first = matches[0] ?? -1;
    if (second < 0) second = matches[1] ?? -1;
  }
  return [first, second] as const;
}

export function previewMt5Rows(rows: string[][], accountId: string): CsvRow[] {
  const section = sectionIndex(rows);
  if (section < 0)
    throw Error(
      'MT5 closed positions section not found / ไม่พบรายการเทรดที่ปิดแล้วในรายงาน MT5',
    );
  const header = findHeader(rows, section + 1);
  const h = header.labels;
  const [openTime, closeTime] = findPair(
    h,
    ['opentime', 'openingtime', 'timeopen'],
    ['closetime', 'closingtime', 'timeclose'],
    'time',
  );
  const [openPrice, closePrice] = findPair(
    h,
    ['openprice', 'openingprice', 'priceopen'],
    ['closeprice', 'closingprice', 'priceclose'],
    'price',
  );
  const sl = findColumn(h, ['sl', 'stoploss']);
  const tp = findColumn(h, ['tp', 'takeprofit']);
  const commission = findColumn(h, [
    'commission',
    'commissionusd',
    'commissions',
  ]);
  const swap = findColumn(h, ['swap', 'swaps']);
  const profit = findColumn(h, ['profit', 'pnl', 'pl', 'netprofit', 'result']);
  if ([openTime, closeTime, openPrice, closePrice, profit].some((i) => i < 0))
    throw Error('Unsupported MT5 trade layout / รูปแบบรายงาน MT5 นี้ยังไม่รองรับ');
  const result: CsvRow[] = [];
  for (let i = header.row + 1; i < rows.length; i++) {
    const cells = rows[i];
    const first = cells.find((cell) => cell?.trim())?.trim() ?? '';
    if (END_SECTIONS.has(label(first))) break;
    if (!cells[header.position]?.trim()) continue;
    try {
      const opened = mt5DateTime(cells[openTime]);
      const closed = mt5DateTime(cells[closeTime]);
      const brokerSymbol = cells[header.symbol].trim().toUpperCase();
      const positionId = cells[header.position].trim();
      const side = cells[header.type].trim().toLowerCase();
      const commissionValue =
        commission >= 0 ? number(cells[commission], 'commission', true) : 0;
      const swapValue = swap >= 0 ? number(cells[swap], 'swap', true) : 0;
      const profitValue = number(cells[profit], 'profit');
      const trade = validateTrade({
        id: crypto.randomUUID(),
        accountId,
        symbol: brokerSymbol.replace(/\.[A-Z0-9]+$/, ''),
        side:
          side === 'buy' || side === 'long'
            ? 'LONG'
            : side === 'sell' || side === 'short'
              ? 'SHORT'
              : side,
        status: 'CLOSED',
        date: opened.date,
        time: opened.time,
        entry: number(cells[openPrice], 'entry'),
        // MT5 history shows the final modified SL/TP, not necessarily the planned values.
        // Preserve them as source metadata instead of treating them as initial risk inputs.
        sl: 0,
        tp: 0,
        lot: number(cells[header.volume], 'volume'),
        risk: 0,
        gross: profitValue + swapValue + Math.max(commissionValue, 0),
        fees: Math.max(-commissionValue, 0),
        setup: '',
        notes: '',
        imageIds: [],
        importRef: {
          format: 'MT5',
          positionId,
          brokerSymbol,
          closeDate: closed.date,
          closeTime: closed.time,
          closePrice: number(cells[closePrice], 'close price'),
          reportedSl: sl >= 0 ? number(cells[sl], 'stop loss', true) : 0,
          reportedTp: tp >= 0 ? number(cells[tp], 'target', true) : 0,
          commission: commissionValue,
          swap: swapValue,
        },
      });
      result.push({ row: i + 1, trade });
    } catch (error) {
      result.push({
        row: i + 1,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid MT5 row / แถว MT5 ไม่ถูกต้อง',
      });
    }
    if (result.length > 500)
      throw Error('Maximum 500 trades / ไม่เกิน 500 รายการ');
  }
  if (!result.length)
    throw Error('No closed positions found / ไม่พบ Positions ที่ปิดแล้ว');
  return result;
}

export function previewMt5Xlsx(buffer: ArrayBuffer, accountId: string) {
  return previewMt5Rows(parseMt5XlsxRows(buffer), accountId);
}

export function inspectMt5Xlsx(
  buffer: ArrayBuffer,
  accountId: string,
): Mt5ReportPreview {
  const table = parseMt5XlsxRows(buffer);
  return {
    rows: previewMt5Rows(table, accountId),
    source: detectMt5ReportSource(table),
  };
}

export function previewMt5Html(text: string, accountId: string) {
  return previewMt5Rows(htmlRows(text), accountId);
}

export function inspectMt5Html(
  text: string,
  accountId: string,
): Mt5ReportPreview {
  const table = htmlRows(text);
  return {
    rows: previewMt5Rows(table, accountId),
    source: detectMt5ReportSource(table),
  };
}
