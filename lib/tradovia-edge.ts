import { isTradeReviewed, net, type Trade } from './domain.ts';

export const EDGE_MIN_SAMPLE = 4;

export type EdgeDimension = 'setup' | 'symbol' | 'session' | 'emotion';

export type EdgeGroup = {
  dimension: EdgeDimension;
  key: string;
  trades: number;
  riskTrades: number;
  wins: number;
  pnl: number;
  averageR: number;
};

export type EdgeAnalysis = {
  closed: number;
  reviewed: number;
  riskRecorded: number;
  playbookLinked: number;
  followed: number;
  processScore: number;
  reviewCoverage: number;
  riskCoverage: number;
  playbookCoverage: number;
  adherenceRate: number;
  groups: EdgeGroup[];
  strongest?: EdgeGroup;
  weakest?: EdgeGroup;
  followedAverageR: number | null;
  outsideAverageR: number | null;
  followedSample: number;
  outsideSample: number;
  focus: 'record' | 'review' | 'risk' | 'playbook' | 'discipline' | 'weakness' | 'repeat';
};

const percent = (value: number, total: number) =>
  total ? (value / total) * 100 : 0;

export const tradeSession = (time: string) => {
  const hour = Number(time.slice(0, 2));
  if (!Number.isFinite(hour)) return 'unknown';
  if (hour < 8) return 'asia';
  if (hour < 13) return 'london';
  if (hour < 21) return 'new-york';
  return 'late';
};

function summarizeGroup(
  rows: Trade[],
  dimension: EdgeDimension,
  key: string,
): EdgeGroup | null {
  const riskRows = rows.filter((trade) => trade.risk > 0);
  if (riskRows.length < EDGE_MIN_SAMPLE) return null;
  return {
    dimension,
    key,
    trades: rows.length,
    riskTrades: riskRows.length,
    wins: rows.filter((trade) => net(trade) > 0).length,
    pnl: Math.round(rows.reduce((sum, trade) => sum + net(trade), 0) * 100) / 100,
    averageR:
      riskRows.reduce((sum, trade) => sum + net(trade) / trade.risk, 0) /
      riskRows.length,
  };
}

function groupBy(
  rows: Trade[],
  dimension: EdgeDimension,
  keyFor: (trade: Trade) => string,
) {
  const buckets = new Map<string, Trade[]>();
  for (const trade of rows) {
    const key = keyFor(trade).trim();
    if (!key) continue;
    const bucket = buckets.get(key) ?? [];
    bucket.push(trade);
    buckets.set(key, bucket);
  }
  return [...buckets]
    .map(([key, trades]) => summarizeGroup(trades, dimension, key))
    .filter((group): group is EdgeGroup => Boolean(group));
}

function averageR(rows: Trade[]) {
  const valid = rows.filter((trade) => trade.risk > 0);
  return {
    sample: valid.length,
    value: valid.length
      ? valid.reduce((sum, trade) => sum + net(trade) / trade.risk, 0) /
        valid.length
      : null,
  };
}

export function analyzeTradoviaEdge(trades: Trade[]): EdgeAnalysis {
  const closed = trades.filter((trade) => trade.status === 'CLOSED');
  const reviewed = closed.filter(isTradeReviewed);
  const riskRecorded = closed.filter((trade) => trade.risk > 0).length;
  const playbookLinked = closed.filter((trade) => trade.playbook).length;
  const decisions = reviewed.filter(
    (trade) => trade.adherence === 'yes' || trade.adherence === 'no',
  );
  const followed = decisions.filter((trade) => trade.adherence === 'yes').length;
  const reviewCoverage = percent(reviewed.length, closed.length);
  const riskCoverage = percent(riskRecorded, closed.length);
  const playbookCoverage = percent(playbookLinked, closed.length);
  const adherenceRate = percent(followed, decisions.length);
  const processScore = Math.round(
    reviewCoverage * 0.3 +
      riskCoverage * 0.25 +
      playbookCoverage * 0.2 +
      adherenceRate * 0.25,
  );

  const emotionRows = closed.filter((trade) => trade.review?.emotion);
  const groups = [
    ...groupBy(closed, 'setup', (trade) => trade.setup),
    ...groupBy(closed, 'symbol', (trade) => trade.symbol),
    ...groupBy(closed, 'session', (trade) => tradeSession(trade.time)),
    ...groupBy(emotionRows, 'emotion', (trade) => trade.review?.emotion ?? ''),
  ].sort((a, b) => b.averageR - a.averageR);
  const strongest = groups[0];
  const weakest = [...groups].sort((a, b) => a.averageR - b.averageR)[0];
  const followedR = averageR(
    closed.filter((trade) => trade.adherence === 'yes'),
  );
  const outsideR = averageR(
    closed.filter((trade) => trade.adherence === 'no'),
  );

  let focus: EdgeAnalysis['focus'] = 'repeat';
  if (!closed.length) focus = 'record';
  else if (reviewCoverage < 70) focus = 'review';
  else if (riskCoverage < 80) focus = 'risk';
  else if (playbookCoverage < 70) focus = 'playbook';
  else if (decisions.length >= EDGE_MIN_SAMPLE && adherenceRate < 75)
    focus = 'discipline';
  else if (weakest && weakest.averageR < 0) focus = 'weakness';

  return {
    closed: closed.length,
    reviewed: reviewed.length,
    riskRecorded,
    playbookLinked,
    followed,
    processScore,
    reviewCoverage,
    riskCoverage,
    playbookCoverage,
    adherenceRate,
    groups,
    strongest,
    weakest,
    followedAverageR:
      followedR.sample >= EDGE_MIN_SAMPLE ? followedR.value : null,
    outsideAverageR:
      outsideR.sample >= EDGE_MIN_SAMPLE ? outsideR.value : null,
    followedSample: followedR.sample,
    outsideSample: outsideR.sample,
    focus,
  };
}
