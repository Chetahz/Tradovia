export type Playbook = {
  id: string;
  name: string;
  technique: string;
  entry: string;
  exit: string;
  risk: string;
  checklist: string;
  archived: boolean;
  version: number;
};
export type Trade = {
  playbook?: Playbook;
  adherence?: 'yes' | 'partial' | 'no' | '';
  id: string;
  accountId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED';
  date: string;
  time: string;
  entry: number;
  sl: number;
  tp: number;
  lot: number;
  risk: number;
  gross: number;
  fees: number;
  setup: string;
  notes: string;
  imageIds: string[];
  importRef?: {
    format: 'MT5';
    positionId: string;
    brokerSymbol: string;
    closeDate: string;
    closeTime: string;
    closePrice: number;
    reportedSl: number;
    reportedTp: number;
    commission: number;
    swap: number;
  };
};
export type Portfolio = {
  id: string;
  name: string;
  balance: number;
  currency: 'USD';
};
export type Account = {
  id: string;
  portfolioId: string;
  name: string;
  type: 'manual' | 'mt5';
  balance: number;
};
export type Goal = {
  id: string;
  period: 'week' | 'month' | 'year';
  target: number;
  type: 'pnl' | 'trades';
};
export type Rule = { id: string; text: string; enabled: boolean };
export type Connection = {
  id: string;
  accountId: string;
  provider: string;
  status: 'not_configured' | 'disconnected' | 'error' | 'connected';
  lastSync: string | null;
  error: string | null;
};
export type WorkspaceData = {
  playbooks?: Playbook[];
  portfolios: Portfolio[];
  accounts: Account[];
  trades: Trade[];
  goals: Goal[];
  rules: Rule[];
  connections: Connection[];
  profile: { name: string; timezone: string; watchlist?: string[] };
  subscription: {
    plan: 'manual' | 'pro' | 'elite';
    status: string;
    renewal: string | null;
    cancelAtPeriodEnd: boolean;
  };
};
export const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
export const net = (t: Trade) => Math.round((t.gross - t.fees) * 100) / 100;
export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function statistics(trades: Trade[], capital: number) {
  const closed = trades
    .filter((t) => t.status === 'CLOSED')
    .sort((a, b) =>
      (a.date + a.time + a.id).localeCompare(b.date + b.time + b.id),
    );
  let equity = capital,
    peak = capital,
    drawdown = 0,
    gain = 0,
    loss = 0,
    wins = 0,
    totalR = 0,
    rCount = 0;
  const curve = [{ date: 'Start', value: capital, pnl: 0 }];
  for (const t of closed) {
    const pnl = net(t);
    equity = Math.round((equity + pnl) * 100) / 100;
    peak = Math.max(peak, equity);
    drawdown = Math.max(
      drawdown,
      peak > 0 ? ((peak - equity) / peak) * 100 : 0,
    );
    if (pnl > 0) {
      gain += pnl;
      wins++;
    } else loss -= pnl;
    if (t.risk > 0) {
      totalR += pnl / t.risk;
      rCount++;
    }
    curve.push({ date: t.date, value: equity, pnl });
  }
  return {
    count: closed.length,
    open: trades.length - closed.length,
    pnl: Math.round((gain - loss) * 100) / 100,
    wins,
    winRate: closed.length ? (wins / closed.length) * 100 : 0,
    profitFactor: loss ? gain / loss : gain ? Infinity : 0,
    expectancy: closed.length ? (gain - loss) / closed.length : 0,
    averageR: rCount ? totalR / rCount : 0,
    drawdown,
    equity,
    curve,
  };
}
export function dailyStats(trades: Trade[]) {
  const result: Record<string, { pnl: number; count: number }> = {};
  for (const t of trades.filter((t) => t.status === 'CLOSED')) {
    result[t.date] ??= { pnl: 0, count: 0 };
    result[t.date].pnl = Math.round((result[t.date].pnl + net(t)) * 100) / 100;
    result[t.date].count++;
  }
  return result;
}
export function inPeriod(
  date: string,
  period: 'week' | 'month' | 'year',
  now = new Date(),
) {
  const d = new Date(`${date}T12:00:00`);
  if (period === 'year') return d.getFullYear() === now.getFullYear();
  if (period === 'month')
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}
export const assets = {
  EURUSD: {
    label: 'EUR / USD',
    tickSize: 0.00001,
    tickValue: 1,
    step: 0.01,
    min: 0.01,
    unit: 'lots',
  },
  GBPUSD: {
    label: 'GBP / USD',
    tickSize: 0.00001,
    tickValue: 1,
    step: 0.01,
    min: 0.01,
    unit: 'lots',
  },
  XAUUSD: {
    label: 'Gold / USD',
    tickSize: 0.01,
    tickValue: 1,
    step: 0.01,
    min: 0.01,
    unit: 'lots',
  },
  BTCUSD: {
    label: 'Bitcoin / USD',
    tickSize: 1,
    tickValue: 1,
    step: 0.001,
    min: 0.001,
    unit: 'BTC',
  },
  NAS100: {
    label: 'Nasdaq 100 CFD',
    tickSize: 1,
    tickValue: 1,
    step: 0.1,
    min: 0.1,
    unit: 'contracts',
  },
  AAPL: {
    label: 'Apple shares',
    tickSize: 0.01,
    tickValue: 0.01,
    step: 1,
    min: 1,
    unit: 'shares',
  },
  CUSTOM: {
    label: 'Custom contract',
    tickSize: 0.01,
    tickValue: 1,
    step: 0.01,
    min: 0.01,
    unit: 'units',
  },
};
export type RiskInput = {
  balance: number;
  percent: number;
  entry: number;
  stop: number;
  tickSize: number;
  tickValue: number;
  step: number;
  min: number;
  costPerUnit: number;
  max: number;
};
export function sizePosition(v: RiskInput) {
  if (
    [
      v.balance,
      v.percent,
      v.entry,
      v.stop,
      v.tickSize,
      v.tickValue,
      v.step,
      v.min,
      v.max,
      v.costPerUnit,
    ].some((x) => !Number.isFinite(x)) ||
    v.balance <= 0 ||
    v.percent <= 0 ||
    v.percent > 100 ||
    v.entry <= 0 ||
    v.stop <= 0 ||
    v.entry === v.stop ||
    v.tickSize <= 0 ||
    v.tickValue <= 0 ||
    v.step < 1e-8 ||
    v.min <= 0 ||
    v.costPerUnit < 0 ||
    v.max <= 0
  )
    throw new Error(
      'Enter valid, positive values and a stop different from entry.',
    );
  const budget = Math.floor(v.balance * v.percent) / 100;
  const perUnit =
    (Math.abs(v.entry - v.stop) / v.tickSize) * v.tickValue + v.costPerUnit;
  let steps = Math.floor(Math.min(budget / perUnit, v.max) / v.step);
  if (!Number.isFinite(perUnit) || !Number.isSafeInteger(steps))
    throw new Error('Contract precision is outside the supported range.');
  let quantity = Number((steps * v.step).toFixed(8));
  while (quantity * perUnit > budget && steps > 0) {
    steps--;
    quantity = Number((steps * v.step).toFixed(8));
  }
  if (quantity < v.min) quantity = 0;
  return {
    budget,
    quantity,
    estimatedRisk: quantity * perUnit,
    perUnit,
    unused: budget - quantity * perUnit,
  };
}
function finite(v: unknown, name: string, min = -1e9, max = 1e9) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)
    throw new Error(`Invalid ${name}`);
  return v;
}
export function validateTrade(value: unknown): Trade {
  if (!value || typeof value !== 'object') throw new Error('Invalid trade');
  const t = value as Trade;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(t.id) || typeof t.accountId !== 'string')
    throw new Error('Invalid trade ID');
  if (typeof t.symbol !== 'string' || !/^[A-Z0-9.:/_-]{1,24}$/.test(t.symbol))
    throw new Error('Invalid symbol');
  if (
    !['LONG', 'SHORT'].includes(t.side) ||
    !['OPEN', 'CLOSED'].includes(t.status)
  )
    throw new Error('Invalid direction or status');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(t.date) ||
    dateKey(new Date(t.date + 'T12:00:00')) !== t.date ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time)
  )
    throw new Error('Invalid date or time');
  ['entry', 'sl', 'tp', 'lot', 'risk'].forEach((k) =>
    finite(t[k as keyof Trade], k, 0),
  );
  finite(t.gross, 'gross');
  finite(t.fees, 'fees', 0);
  if (t.entry <= 0 || t.lot <= 0)
    throw new Error('Entry and size must be positive');
  if (
    t.sl > 0 &&
    ((t.side === 'LONG' && t.sl >= t.entry) ||
      (t.side === 'SHORT' && t.sl <= t.entry))
  )
    throw new Error('Stop loss must be on the loss side of entry');
  if (
    t.tp > 0 &&
    ((t.side === 'LONG' && t.tp <= t.entry) ||
      (t.side === 'SHORT' && t.tp >= t.entry))
  )
    throw new Error('Target must be on the profit side of entry');
  if (
    typeof t.notes !== 'string' ||
    t.notes.length > 10000 ||
    typeof t.setup !== 'string' ||
    t.setup.length > 160 ||
    !Array.isArray(t.imageIds) ||
    t.imageIds.length > 5 ||
    t.imageIds.some(
      (x) => typeof x !== 'string' || !/^[-a-zA-Z0-9]{1,80}$/.test(x),
    )
  )
    throw new Error('Invalid notes, technique tags or images');
  let importRef: Trade['importRef'];
  if (t.importRef !== undefined) {
    const ref = t.importRef;
    if (
      !ref ||
      ref.format !== 'MT5' ||
      typeof ref.positionId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,80}$/.test(ref.positionId) ||
      typeof ref.brokerSymbol !== 'string' ||
      !/^[A-Z0-9.:/_-]{1,24}$/.test(ref.brokerSymbol) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(ref.closeDate) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(ref.closeTime)
    )
      throw new Error('Invalid import reference');
    finite(ref.closePrice, 'close price', 0);
    finite(ref.reportedSl, 'reported stop loss', 0);
    finite(ref.reportedTp, 'reported target', 0);
    finite(ref.commission, 'commission');
    finite(ref.swap, 'swap');
    importRef = { ...ref };
  }
  return {
    id: t.id,
    accountId: t.accountId,
    symbol: t.symbol,
    side: t.side,
    status: t.status,
    date: t.date,
    time: t.time,
    entry: t.entry,
    sl: t.sl,
    tp: t.tp,
    lot: t.lot,
    risk: t.risk,
    gross: t.gross,
    fees: t.fees,
    notes: t.notes,
    setup: t.setup,
    imageIds: t.imageIds,
    ...(importRef ? { importRef } : {}),
  };
}
export function demoData(now = new Date()): WorkspaceData {
  const outcomes = [
    180, -100, 240, 85, -125, 310, -90, 165, 215, -105, 0, 280, -140, 190, 320,
    -100, 155, 210, -115, 260, -80, 175, 305, -120,
  ];
  const trades: Trade[] = outcomes.map((gross, i) => {
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      Math.max(1, now.getDate() - 27),
    );
    d.setDate(d.getDate() + i);
    if (d > now) d.setMonth(d.getMonth() - 1);
    const gold = i % 3 === 0;
    return {
      id: `demo-trade-${i}`,
      accountId: i % 4 === 0 ? 'demo-account-2' : 'demo-account-1',
      symbol: gold ? 'XAUUSD' : i % 2 ? 'EURUSD' : 'GBPUSD',
      side: 'LONG',
      status: 'CLOSED',
      date: dateKey(d),
      time: `${String(9 + (i % 8)).padStart(2, '0')}:30`,
      entry: gold ? 2510 : 1.084,
      sl: gold ? 2500 : 1.08,
      tp: gold ? 2530 : 1.092,
      lot: gold ? 0.1 : 0.25,
      risk: 100,
      gross,
      fees: 3.5,
      setup: ['FVG + MSS', 'Liquidity sweep', 'Breakout & retest'][i % 3],
      notes: [
        'Waited for confirmation at the session open. Entry followed the plan.',
        'Reviewed the higher timeframe before execution.',
        'Screenshot and execution review to follow.',
      ][i % 3],
      imageIds: [],
    };
  });
  return {
    portfolios: [
      {
        id: 'demo-portfolio',
        name: 'Demo Portfolio',
        balance: 10000,
        currency: 'USD',
      },
    ],
    accounts: [
      {
        id: 'demo-account-1',
        portfolioId: 'demo-portfolio',
        name: 'Main trading account',
        type: 'manual',
        balance: 8000,
      },
      {
        id: 'demo-account-2',
        portfolioId: 'demo-portfolio',
        name: 'Swing account',
        type: 'manual',
        balance: 2000,
      },
    ],
    trades,
    goals: [
      { id: 'goal-week', period: 'week', target: 500, type: 'pnl' },
      { id: 'goal-month', period: 'month', target: 1500, type: 'pnl' },
      { id: 'goal-year', period: 'year', target: 15000, type: 'pnl' },
    ],
    rules: [
      {
        id: 'rule-risk',
        text: 'Risk no more than 1% per trade',
        enabled: true,
      },
      {
        id: 'rule-session',
        text: 'Review the economic calendar before entry',
        enabled: true,
      },
    ],
    connections: [],
    profile: { name: 'Demo Trader', timezone: 'Asia/Bangkok' },
    subscription: {
      plan: 'manual',
      status: 'free',
      renewal: null,
      cancelAtPeriodEnd: false,
    },
  };
}
export const emptyData = (): WorkspaceData => ({
  portfolios: [],
  accounts: [],
  trades: [],
  goals: [],
  rules: [],
  connections: [],
  profile: { name: 'Trader', timezone: 'Asia/Bangkok' },
  subscription: {
    plan: 'manual',
    status: 'free',
    renewal: null,
    cancelAtPeriodEnd: false,
  },
});
