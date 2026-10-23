import { validateTrade, type Trade } from './domain.ts';

export type Mt5Position = {
  positionId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  openTime: string;
  closeTime: string;
  entry: number;
  closePrice: number;
  volume: number;
  profit: number;
  commission: number;
  swap: number;
  reportedSl: number;
  reportedTp: number;
};

const dateTime = /^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$/;
const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1e12;

export function validateMt5Position(value: unknown): Mt5Position {
  const p = value as Mt5Position;
  if (!p || typeof p !== 'object' ||
      typeof p.positionId !== 'string' || !/^\d{1,20}$/.test(p.positionId) ||
      typeof p.symbol !== 'string' || !/^[A-Za-z0-9#.+:/_-]{1,40}$/.test(p.symbol) ||
      !['LONG', 'SHORT'].includes(p.side) ||
      typeof p.openTime !== 'string' || !dateTime.test(p.openTime) ||
      typeof p.closeTime !== 'string' || !dateTime.test(p.closeTime) ||
      p.closeTime < p.openTime ||
      ![p.entry, p.closePrice, p.volume, p.profit, p.commission, p.swap, p.reportedSl, p.reportedTp].every(finite) ||
      p.entry <= 0 || p.closePrice <= 0 || p.volume <= 0 || p.reportedSl < 0 || p.reportedTp < 0)
    throw new Error('Invalid MT5 position');
  return p;
}

export function mt5Trade(p: Mt5Position, accountId: string, id: string): Trade {
  const [openDate, openClock] = p.openTime.split(' ');
  const [closeDate, closeClock] = p.closeTime.split(' ');
  return validateTrade({
    id, accountId, symbol: p.symbol.toUpperCase().replace(/\.[A-Z0-9]+$/, ''),
    side: p.side, status: 'CLOSED',
    date: openDate.replaceAll('.', '-'), time: openClock.slice(0, 5),
    entry: p.entry, sl: 0, tp: 0, lot: p.volume, risk: 0,
    gross: p.profit + p.swap + Math.max(p.commission, 0),
    fees: Math.max(-p.commission, 0), setup: '', notes: '', imageIds: [],
    importRef: {
      format: 'MT5', positionId: p.positionId, brokerSymbol: p.symbol.toUpperCase(),
      closeDate: closeDate.replaceAll('.', '-'), closeTime: closeClock.slice(0, 5),
      closePrice: p.closePrice, reportedSl: p.reportedSl, reportedTp: p.reportedTp,
      commission: p.commission, swap: p.swap,
    },
  });
}
