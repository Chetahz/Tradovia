import { isTradeReviewed, net, type Trade } from './domain.ts';
import { analyzeTradoviaEdge, type EdgeAnalysis } from './tradovia-edge.ts';

export type ImportInsight = {
  imported: number;
  closed: number;
  pnl: number;
  wins: number;
  losses: number;
  winRate: number;
  riskCoverage: number;
  reviewNeeded: number;
  firstDate: string;
  lastDate: string;
  leadingSymbol: {
    symbol: string;
    trades: number;
    pnl: number;
  } | null;
  edge: EdgeAnalysis;
};

const rounded = (value: number) => Math.round(value * 100) / 100;
const percent = (value: number, total: number) =>
  total ? Math.round((value / total) * 100) : 0;

export function summarizeImport(
  importedTrades: Trade[],
  workspaceTrades: Trade[],
): ImportInsight {
  const closed = importedTrades.filter((trade) => trade.status === 'CLOSED');
  const results = closed.map(net);
  const symbols = new Map<string, { trades: number; pnl: number }>();

  for (const trade of closed) {
    const symbol = trade.symbol.trim().toUpperCase();
    const current = symbols.get(symbol) ?? { trades: 0, pnl: 0 };
    current.trades += 1;
    current.pnl += net(trade);
    symbols.set(symbol, current);
  }

  const leadingSymbol = [...symbols.entries()]
    .map(([symbol, value]) => ({
      symbol,
      trades: value.trades,
      pnl: rounded(value.pnl),
    }))
    .sort(
      (a, b) => b.trades - a.trades || Math.abs(b.pnl) - Math.abs(a.pnl),
    )[0];

  const dates = closed
    .map((trade) => trade.date)
    .filter(Boolean)
    .sort();
  const riskRecorded = closed.filter((trade) => trade.risk > 0).length;

  return {
    imported: importedTrades.length,
    closed: closed.length,
    pnl: rounded(results.reduce((sum, result) => sum + result, 0)),
    wins: results.filter((result) => result > 0).length,
    losses: results.filter((result) => result < 0).length,
    winRate: percent(
      results.filter((result) => result > 0).length,
      results.filter((result) => result !== 0).length,
    ),
    riskCoverage: percent(riskRecorded, closed.length),
    reviewNeeded: closed.filter((trade) => !isTradeReviewed(trade)).length,
    firstDate: dates[0] ?? '',
    lastDate: dates.at(-1) ?? '',
    leadingSymbol: leadingSymbol ?? null,
    edge: analyzeTradoviaEdge(workspaceTrades),
  };
}
