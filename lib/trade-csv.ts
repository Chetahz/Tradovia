import { validateTrade, type Trade } from './domain.ts';

export const csvTemplate =
  'symbol,side,status,date,time,entry,lot,gross,fees,risk,sl,tp,setup,notes\r\nXAUUSD,LONG,CLOSED,2026-09-01,09:30,2500,0.10,100,5,50,2495,2510,Example,Replace this example with your trade\r\n';
export type CsvRow = { row: number; trade?: Trade; error?: string };

// Quoted fields may contain commas, newlines and escaped double quotes.
export function parseCsv(text: string): string[][] {
  if (text.length > 2 * 1024 * 1024)
    throw Error('File exceeds 2 MB / ไฟล์เกิน 2 MB');
  const rows: string[][] = [];
  let row: string[] = [],
    field = '',
    quoted = false,
    closed = false;
  const cell = () => {
    row.push(field);
    field = '';
    closed = false;
  };
  const line = () => {
    cell();
    if (row.some((v) => v.trim())) rows.push(row);
    row = [];
  };
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += c;
    } else if (c === ',') cell();
    else if (c === '\n' || c === '\r') {
      line();
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else if (c === '"' && !field && !closed) quoted = true;
    else if (closed || c === '"')
      throw Error('Invalid CSV quoting / รูปแบบเครื่องหมายคำพูดไม่ถูกต้อง');
    else field += c;
    if (rows.length > 501) throw Error('Maximum 500 trades / ไม่เกิน 500 รายการ');
  }
  if (quoted) throw Error('Unclosed CSV quote / เครื่องหมายคำพูดปิดไม่ครบ');
  if (field || row.length || closed) line();
  if (rows.length > 501) throw Error('Maximum 500 trades / ไม่เกิน 500 รายการ');
  return rows;
}

export function tradeFingerprint(t: Trade) {
  return JSON.stringify([
    t.accountId,
    t.symbol,
    t.side,
    t.status,
    t.date,
    t.time,
    t.entry,
    t.lot,
    t.gross,
    t.fees,
  ]);
}

export function previewCsv(text: string, accountId: string): CsvRow[] {
  const [header, ...rows] = parseCsv(text);
  if (!header || !rows.length)
    throw Error('CSV has no trades / ไม่พบรายการใน CSV');
  const keys = header.map((k) => k.trim().toLowerCase());
  const required = [
    'symbol',
    'side',
    'status',
    'date',
    'time',
    'entry',
    'lot',
    'gross',
    'fees',
  ];
  const missing = required.filter((k) => !keys.includes(k));
  if (missing.length)
    throw Error(
      `Missing columns / คอลัมน์ที่ขาด: ${missing.join(', ')}. Use the Tradovia template / ใช้แม่แบบ Tradovia`,
    );
  if (new Set(keys).size !== keys.length)
    throw Error('Duplicate column names / ชื่อคอลัมน์ซ้ำ');
  return rows.map((cells, index) => {
    try {
      if (cells.length !== keys.length)
        throw Error('Column count mismatch / จำนวนคอลัมน์ไม่ตรง');
      const v = Object.fromEntries(keys.map((k, i) => [k, cells[i].trim()]));
      const number = (key: string, optional = false) => {
        const raw = v[key] || '';
        if (!raw && optional) return 0;
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))
          throw Error(`Invalid number / ตัวเลขไม่ถูกต้อง: ${key}`);
        return Number(raw);
      };
      const trade = validateTrade({
        id: crypto.randomUUID(),
        accountId,
        symbol: v.symbol.toUpperCase(),
        side:
          ({ BUY: 'LONG', SELL: 'SHORT' } as Record<string, string>)[
            v.side.toUpperCase()
          ] || v.side.toUpperCase(),
        status: v.status.toUpperCase(),
        date: v.date,
        time: v.time,
        entry: number('entry'),
        lot: number('lot'),
        gross: number('gross'),
        fees: number('fees'),
        risk: number('risk', true),
        sl: number('sl', true),
        tp: number('tp', true),
        setup: v.setup || '',
        notes: v.notes || '',
        imageIds: [],
      });
      if (trade.status === 'OPEN' && (trade.gross !== 0 || trade.fees !== 0))
        throw Error(
          'Open trades need zero realized P&L and fees / รายการที่ยังเปิดต้องระบุ gross และ fees เป็น 0',
        );
      return { row: index + 2, trade };
    } catch (e) {
      return {
        row: index + 2,
        error: e instanceof Error ? e.message : 'Invalid row / แถวไม่ถูกต้อง',
      };
    }
  });
}
