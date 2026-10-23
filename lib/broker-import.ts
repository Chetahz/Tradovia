import { validateTrade } from './domain.ts';
import { parseCsv, type CsvRow } from './trade-csv.ts';

export type BrokerField =
  | 'symbol'
  | 'side'
  | 'openedAt'
  | 'date'
  | 'time'
  | 'entry'
  | 'lot'
  | 'profit'
  | 'commission'
  | 'swap'
  | 'ticket';

export type BrokerMapping = Partial<Record<BrokerField, number>>;

export type BrokerSheet = {
  headerRow: number;
  headers: string[];
  rows: string[][];
  mapping: BrokerMapping;
};

export const brokerFieldOrder: BrokerField[] = [
  'symbol',
  'side',
  'openedAt',
  'date',
  'time',
  'entry',
  'lot',
  'profit',
  'commission',
  'swap',
  'ticket',
];

const aliases: Record<BrokerField, string[]> = {
  symbol: ['symbol', 'instrument', 'market', 'asset', 'product'],
  side: ['side', 'type', 'direction', 'buysell', 'ordertype'],
  openedAt: ['opentime', 'openingtime', 'timeopen', 'openedat', 'datetime'],
  date: ['date', 'opendate', 'openingdate', 'วันที่'],
  time: ['time', 'entrytime', 'เวลา'],
  entry: ['entry', 'entryprice', 'openprice', 'openingprice', 'priceopen'],
  lot: ['lot', 'lots', 'volume', 'size', 'quantity', 'qty'],
  profit: ['profit', 'pnl', 'pl', 'result', 'netprofit', 'realizedpnl'],
  commission: ['commission', 'commissions', 'fee', 'fees', 'commissionusd'],
  swap: ['swap', 'swaps', 'rollover'],
  ticket: ['ticket', 'position', 'positionid', 'order', 'orderid', 'tradeid'],
};

function normalized(value: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s/_().-]+/g, '');
}

function delimiterFor(text: string) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .slice(0, 20);
  const score = (character: string) =>
    Math.max(0, ...lines.map((line) => line.split(character).length - 1));
  return [',', ';', '\t'].sort((a, b) => score(b) - score(a))[0];
}

export function parseBrokerCsv(text: string) {
  return parseCsv(text, delimiterFor(text));
}

export function inferBrokerMapping(headers: string[]): BrokerMapping {
  const labels = headers.map(normalized);
  const mapping: BrokerMapping = {};
  for (const field of brokerFieldOrder) {
    const index = labels.findIndex((value) => aliases[field].includes(value));
    if (index >= 0) mapping[field] = index;
  }
  const timeColumns = labels
    .map((value, index) => (value === 'time' ? index : -1))
    .filter((index) => index >= 0);
  const priceColumns = labels
    .map((value, index) => (value === 'price' ? index : -1))
    .filter((index) => index >= 0);
  if (mapping.openedAt === undefined && timeColumns.length > 1)
    mapping.openedAt = timeColumns[0];
  if (mapping.entry === undefined && priceColumns.length)
    mapping.entry = priceColumns[0];
  return mapping;
}

function mappingScore(mapping: BrokerMapping) {
  return brokerFieldOrder.filter((field) => mapping[field] !== undefined)
    .length;
}

export function prepareBrokerSheet(rows: string[][]): BrokerSheet {
  let best = { index: -1, score: -1, mapping: {} as BrokerMapping };
  for (let index = 0; index < Math.min(rows.length, 25); index++) {
    const mapping = inferBrokerMapping(rows[index]);
    const score = mappingScore(mapping);
    if (score > best.score) best = { index, score, mapping };
  }
  if (best.index < 0 || best.score < 3)
    throw Error(
      'Could not find broker column headers / ไม่พบหัวคอลัมน์ของรายงานโบรกเกอร์',
    );
  const headers = rows[best.index].map(
    (value, index) => value.trim() || `Column ${index + 1}`,
  );
  const data = rows
    .slice(best.index + 1)
    .filter((row) => row.some((value) => value?.trim()));
  if (!data.length)
    throw Error('Broker file has no trades / ไม่พบรายการเทรดในไฟล์โบรกเกอร์');
  return {
    headerRow: best.index + 1,
    headers,
    rows: data,
    mapping: best.mapping,
  };
}

function numeric(value: string, field: string, optional = false) {
  let clean = String(value ?? '')
    .trim()
    .replace(/[\s,฿$€£¥]/g, '')
    .replace(/−/g, '-');
  if (/^\(.+\)$/.test(clean)) clean = `-${clean.slice(1, -1)}`;
  if (!clean && optional) return 0;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(clean))
    throw Error(`Invalid ${field} / ${field} ไม่ถูกต้อง`);
  return Number(clean);
}

function excelDate(value: string) {
  const serial = Number(value);
  if (!Number.isFinite(serial) || serial < 20_000 || serial > 80_000)
    return null;
  const date = new Date(Math.round((serial - 25569) * 86_400_000));
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 16),
  };
}

function dateTime(value: string, separateTime = '') {
  const serialDate = excelDate(String(value ?? '').trim());
  if (serialDate && separateTime) {
    const timeSerial = Number(separateTime);
    if (Number.isFinite(timeSerial) && timeSerial >= 0 && timeSerial < 1) {
      const minutes = Math.round(timeSerial * 24 * 60);
      return {
        date: serialDate.date,
        time: `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
      };
    }
  }
  const raw =
    `${String(value ?? '').trim()} ${String(separateTime ?? '').trim()}`.trim();
  const fromSerial = excelDate(raw);
  if (fromSerial) return fromSerial;
  const match = raw.match(
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::\d{2})?)?$/,
  );
  if (!match)
    throw Error('Use YYYY-MM-DD date format / วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD');
  const month = match[2].padStart(2, '0');
  const day = match[3].padStart(2, '0');
  const hour = (match[4] || '00').padStart(2, '0');
  const minute = match[5] || '00';
  return { date: `${match[1]}-${month}-${day}`, time: `${hour}:${minute}` };
}

export function brokerMappingReady(mapping: BrokerMapping) {
  return (
    mapping.symbol !== undefined &&
    mapping.side !== undefined &&
    (mapping.openedAt !== undefined || mapping.date !== undefined) &&
    mapping.entry !== undefined &&
    mapping.lot !== undefined &&
    mapping.profit !== undefined
  );
}

export function previewBrokerRows(
  sheet: Pick<BrokerSheet, 'headerRow' | 'rows'>,
  mapping: BrokerMapping,
  accountId: string,
): CsvRow[] {
  if (!brokerMappingReady(mapping))
    throw Error('Map all required columns / กรุณาจับคู่คอลัมน์ที่จำเป็นให้ครบ');
  const value = (row: string[], field: BrokerField) => {
    const index = mapping[field];
    return index === undefined ? '' : (row[index] ?? '');
  };
  return sheet.rows.slice(0, 500).map((cells, index) => {
    try {
      const opened =
        mapping.openedAt !== undefined
          ? dateTime(value(cells, 'openedAt'))
          : dateTime(value(cells, 'date'), value(cells, 'time'));
      const rawSide = value(cells, 'side').trim().toLowerCase();
      const side = ['buy', 'long', 'b'].includes(rawSide)
        ? 'LONG'
        : ['sell', 'short', 's'].includes(rawSide)
          ? 'SHORT'
          : rawSide.toUpperCase();
      const commission = numeric(
        value(cells, 'commission'),
        'commission',
        true,
      );
      const swap = numeric(value(cells, 'swap'), 'swap', true);
      const profit = numeric(value(cells, 'profit'), 'profit');
      const brokerSymbol = value(cells, 'symbol').trim().toUpperCase();
      const ticket = value(cells, 'ticket').trim();
      const trade = validateTrade({
        id: crypto.randomUUID(),
        accountId,
        symbol: brokerSymbol,
        side,
        status: 'CLOSED',
        date: opened.date,
        time: opened.time,
        entry: numeric(value(cells, 'entry'), 'entry'),
        sl: 0,
        tp: 0,
        lot: numeric(value(cells, 'lot'), 'lot'),
        risk: 0,
        gross: profit + swap + Math.max(commission, 0),
        fees: Math.max(-commission, 0),
        setup: '',
        notes: '',
        imageIds: [],
        ...(ticket
          ? {
              importRef: {
                format: 'BROKER' as const,
                positionId: ticket,
                brokerSymbol,
                closeDate: opened.date,
                closeTime: opened.time,
                closePrice: 0,
                reportedSl: 0,
                reportedTp: 0,
                commission,
                swap,
              },
            }
          : {}),
      });
      return { row: sheet.headerRow + index + 1, trade };
    } catch (error) {
      return {
        row: sheet.headerRow + index + 1,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid broker row / แถวข้อมูลโบรกเกอร์ไม่ถูกต้อง',
      };
    }
  });
}
