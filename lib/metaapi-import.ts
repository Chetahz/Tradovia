import { validateMt5Position, type Mt5Position } from './mt5-sync.ts';

export type MetaApiDeal = {
  id: string;
  positionId?: string;
  platform?: string;
  type: string;
  entryType?: string;
  symbol?: string;
  volume?: number;
  price?: number;
  profit?: number;
  commission?: number;
  swap?: number;
  time: string;
  brokerTime?: string;
  stopLoss?: number;
  takeProfit?: number;
};

function localTime(deal: MetaApiDeal) {
  const raw = deal.brokerTime || deal.time.replace('T', ' ');
  const match = raw.match(/^(\d{4})-(\d\d)-(\d\d) (\d\d:\d\d:\d\d)/);
  if (!match) throw new Error('Invalid MT5 deal time');
  return `${match[1]}.${match[2]}.${match[3]} ${match[4]}`;
}

/** Return a closed position only. Partial exits, reversals and malformed broker data wait for review. */
export function positionFromMetaApiDeals(deals: MetaApiDeal[]): Mt5Position | null {
  if (!deals.length || deals.some(d => (d.platform && d.platform !== 'mt5') || d.entryType === 'DEAL_ENTRY_INOUT')) return null;
  const executions = deals.filter(d => ['DEAL_TYPE_BUY', 'DEAL_TYPE_SELL'].includes(d.type) && ['DEAL_ENTRY_IN', 'DEAL_ENTRY_OUT', 'DEAL_ENTRY_OUT_BY'].includes(d.entryType || ''));
  const ins = executions.filter(d => d.entryType === 'DEAL_ENTRY_IN');
  const outs = executions.filter(d => d.entryType === 'DEAL_ENTRY_OUT' || d.entryType === 'DEAL_ENTRY_OUT_BY');
  if (!ins.length || !outs.length) return null;
  const positionId = ins[0].positionId;
  const symbol = ins[0].symbol;
  const openType = ins[0].type;
  if (!positionId || !symbol || ins.some(d => d.positionId !== positionId || d.symbol !== symbol || d.type !== openType) ||
      outs.some(d => d.positionId !== positionId || d.symbol !== symbol || d.type === openType)) return null;
  const validVolume = (d: MetaApiDeal) => typeof d.volume === 'number' && Number.isFinite(d.volume) && d.volume > 0 &&
    typeof d.price === 'number' && Number.isFinite(d.price) && d.price > 0;
  if (!executions.every(validVolume)) return null;
  const inVolume = ins.reduce((n, d) => n + d.volume!, 0);
  const outVolume = outs.reduce((n, d) => n + d.volume!, 0);
  if (Math.abs(inVolume - outVolume) > Math.max(1e-7, inVolume * 1e-6)) return null;
  const sortedIn = [...ins].sort((a, b) => a.time.localeCompare(b.time));
  const sortedOut = [...outs].sort((a, b) => a.time.localeCompare(b.time));
  const last = sortedOut.at(-1)!;
  const finiteSum = (key: 'profit' | 'commission' | 'swap') => deals.reduce((n, d) => n + (Number.isFinite(d[key]) ? d[key]! : 0), 0);
  try { return validateMt5Position({
    positionId, symbol, side: openType === 'DEAL_TYPE_BUY' ? 'LONG' : 'SHORT',
    openTime: localTime(sortedIn[0]), closeTime: localTime(last),
    entry: ins.reduce((n, d) => n + d.price! * d.volume!, 0) / inVolume,
    closePrice: outs.reduce((n, d) => n + d.price! * d.volume!, 0) / outVolume,
    volume: inVolume, profit: finiteSum('profit'), commission: finiteSum('commission'), swap: finiteSum('swap'),
    reportedSl: Math.max(0, last.stopLoss || sortedIn[0].stopLoss || 0),
    reportedTp: Math.max(0, last.takeProfit || sortedIn[0].takeProfit || 0),
  }); } catch { return null; }
}

export function closedPositionIds(deals: MetaApiDeal[]) {
  return [...new Set(deals.filter(d => (d.entryType === 'DEAL_ENTRY_OUT' || d.entryType === 'DEAL_ENTRY_OUT_BY') && /^\d{1,20}$/.test(d.positionId || ''))
    .map(d => d.positionId!))];
}
