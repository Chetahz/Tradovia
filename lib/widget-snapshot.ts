import { net, isTradeReviewed, type Trade } from './domain.ts';

export type WidgetDay = { date: string; pnl: number; count: number };
export type WidgetSnapshot = {
  today: string;
  todayPnl: number;
  todayCount: number;
  todayOpenCount: number;
  weekPnl: number;
  weekCount: number;
  reviewCount: number;
  recent: Pick<Trade, 'symbol' | 'side' | 'date'> | null;
  days: WidgetDay[];
};

function zonedDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isoDay(date: Date): string { return date.toISOString().slice(0, 10); }

export function buildWidgetSnapshot(trades: Trade[], timezone: string, now: Date): WidgetSnapshot {
  const today = zonedDate(now, timezone);
  const todayDate = new Date(`${today}T12:00:00Z`);
  const weekday = (todayDate.getUTCDay() + 6) % 7;
  const monday = new Date(todayDate);
  monday.setUTCDate(monday.getUTCDate() - weekday);
  const weekStart = isoDay(monday);
  const days: WidgetDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayDate);
    date.setUTCDate(date.getUTCDate() - 6 + index);
    return { date: isoDay(date), pnl: 0, count: 0 };
  });
  const dayMap = new Map(days.map(day => [day.date, day]));
  let todayPnl = 0, todayCount = 0, todayOpenCount = 0, weekPnl = 0, weekCount = 0, reviewCount = 0;
  for (const trade of trades) {
    if (trade.status === 'OPEN' && trade.date === today) todayOpenCount++;
    if (trade.status !== 'CLOSED') continue;
    if (!isTradeReviewed(trade)) reviewCount++;
    const pnl = net(trade);
    if (trade.date === today) { todayPnl += pnl; todayCount++; }
    if (trade.date >= weekStart && trade.date <= today) { weekPnl += pnl; weekCount++; }
    const day = dayMap.get(trade.date);
    if (day) { day.pnl += pnl; day.count++; }
  }
  const recent = [...trades].sort((a, b) =>
    `${b.date}${b.time}${b.id}`.localeCompare(`${a.date}${a.time}${a.id}`))[0] ?? null;
  return {
    today, todayPnl: Math.round(todayPnl * 100) / 100, todayCount, todayOpenCount,
    weekPnl: Math.round(weekPnl * 100) / 100, weekCount,
    reviewCount,
    recent: recent ? { symbol: recent.symbol, side: recent.side, date: recent.date } : null,
    days: days.map(day => ({ ...day, pnl: Math.round(day.pnl * 100) / 100 })),
  };
}
