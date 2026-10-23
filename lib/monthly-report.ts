import { isTradeReviewed, net, statistics, type Trade } from './domain.ts';

export const MONTHLY_PATTERN_MIN = 2;

export type MonthlyPattern = {
  name: string;
  trades: number;
  riskTrades: number;
  pnl: number;
  averageR: number;
};

export type MonthlyReportData = {
  month: string;
  rows: Trade[];
  pnl: number;
  count: number;
  winRate: number;
  averageR: number | null;
  drawdown: number;
  reviewed: number;
  reviewCoverage: number;
  riskRecorded: number;
  riskCoverage: number;
  followed: number;
  outside: number;
  adherenceRate: number | null;
  followedAverageR: number | null;
  outsideAverageR: number | null;
  strongest?: MonthlyPattern;
  weakest?: MonthlyPattern;
  repeatedMiss?: { text: string; count: number };
  previous: { pnl: number; count: number; averageR: number | null };
  focus: 'record' | 'review' | 'risk' | 'discipline' | 'weakness' | 'repeat';
};

const averageR = (rows: Trade[]) => {
  const comparable = rows.filter((trade) => trade.risk > 0);
  return comparable.length
    ? comparable.reduce((sum, trade) => sum + net(trade) / trade.risk, 0) /
        comparable.length
    : null;
};

export const monthKey = (date: string) => date.slice(0, 7);

export function previousMonth(month: string) {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(year, value - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function availableTradeMonths(trades: Trade[]) {
  return [...new Set(trades.filter((trade) => trade.status === 'CLOSED').map((trade) => monthKey(trade.date)))]
    .filter((month) => /^\d{4}-\d{2}$/.test(month))
    .sort((a, b) => b.localeCompare(a));
}

function patterns(rows: Trade[]) {
  const buckets = new Map<string, Trade[]>();
  for (const trade of rows) {
    const name = trade.setup.trim();
    if (!name) continue;
    const bucket = buckets.get(name) ?? [];
    bucket.push(trade);
    buckets.set(name, bucket);
  }
  return [...buckets]
    .map(([name, trades]) => {
      const comparable = trades.filter((trade) => trade.risk > 0);
      if (comparable.length < MONTHLY_PATTERN_MIN) return null;
      return {
        name,
        trades: trades.length,
        riskTrades: comparable.length,
        pnl: Math.round(trades.reduce((sum, trade) => sum + net(trade), 0) * 100) / 100,
        averageR:
          comparable.reduce((sum, trade) => sum + net(trade) / trade.risk, 0) /
          comparable.length,
      };
    })
    .filter((pattern): pattern is MonthlyPattern => Boolean(pattern));
}

function summarizePrevious(trades: Trade[], month: string, capital: number) {
  const rows = trades.filter(
    (trade) => trade.status === 'CLOSED' && monthKey(trade.date) === month,
  );
  const result = statistics(rows, capital);
  return {
    pnl: result.pnl,
    count: rows.length,
    averageR: averageR(rows),
  };
}

export function analyzeMonthlyReport(
  trades: Trade[],
  month: string,
  capital: number,
): MonthlyReportData {
  const rows = trades
    .filter((trade) => trade.status === 'CLOSED' && monthKey(trade.date) === month)
    .sort((a, b) => (a.date + a.time + a.id).localeCompare(b.date + b.time + b.id));
  const result = statistics(rows, capital);
  const reviewed = rows.filter(isTradeReviewed);
  const decisions = reviewed.filter(
    (trade) => trade.adherence === 'yes' || trade.adherence === 'no',
  );
  const followedRows = decisions.filter((trade) => trade.adherence === 'yes');
  const outsideRows = decisions.filter((trade) => trade.adherence === 'no');
  const riskRecorded = rows.filter((trade) => trade.risk > 0).length;
  const ranked = patterns(rows).sort((a, b) => b.averageR - a.averageR);
  const misses = new Map<string, number>();
  for (const trade of reviewed) {
    for (const item of trade.review?.checklist ?? []) {
      if (item.answer !== 'no') continue;
      const text = item.text.trim();
      if (text) misses.set(text, (misses.get(text) ?? 0) + 1);
    }
  }
  const miss = [...misses].sort((a, b) => b[1] - a[1])[0];
  const strongest = ranked[0];
  const weakest = [...ranked].sort((a, b) => a.averageR - b.averageR)[0];
  const reviewCoverage = rows.length ? (reviewed.length / rows.length) * 100 : 0;
  const riskCoverage = rows.length ? (riskRecorded / rows.length) * 100 : 0;
  const adherenceRate = decisions.length
    ? (followedRows.length / decisions.length) * 100
    : null;
  let focus: MonthlyReportData['focus'] = 'repeat';
  if (!rows.length) focus = 'record';
  else if (reviewCoverage < 70) focus = 'review';
  else if (riskCoverage < 80) focus = 'risk';
  else if (decisions.length >= 3 && (adherenceRate ?? 100) < 75)
    focus = 'discipline';
  else if (weakest && weakest.averageR < 0) focus = 'weakness';

  return {
    month,
    rows,
    pnl: result.pnl,
    count: rows.length,
    winRate: result.winRate,
    averageR: averageR(rows),
    drawdown: result.drawdown,
    reviewed: reviewed.length,
    reviewCoverage,
    riskRecorded,
    riskCoverage,
    followed: followedRows.length,
    outside: outsideRows.length,
    adherenceRate,
    followedAverageR: averageR(followedRows),
    outsideAverageR: averageR(outsideRows),
    strongest,
    weakest,
    repeatedMiss: miss ? { text: miss[0], count: miss[1] } : undefined,
    previous: summarizePrevious(trades, previousMonth(month), capital),
    focus,
  };
}
