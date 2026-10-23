import { isTradeReviewed, type Trade } from './domain.ts';
import type { DailyCheckin } from './daily-checkin.ts';

export type CoachPriority = {
  kind: 'open' | 'review' | 'intention' | 'rest' | 'ready';
  count: number;
  title: { en: string; th: string };
  body: { en: string; th: string };
};

export function pendingReviewTrades(trades: Trade[]) {
  return trades
    .filter((trade) => trade.status === 'CLOSED' && !isTradeReviewed(trade))
    .sort((a, b) =>
      (b.date + b.time + b.id).localeCompare(a.date + a.time + a.id),
    );
}

export function mostMissedRule(trades: Trade[]) {
  const counts = new Map<string, number>();
  for (const trade of trades) {
    for (const item of trade.review?.checklist || []) {
      const text = item.text.trim();
      if (item.answer === 'no' && text)
        counts.set(text, (counts.get(text) || 0) + 1);
    }
  }
  const repeated = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return repeated && repeated[1] >= 2
    ? { text: repeated[0], count: repeated[1] }
    : undefined;
}

export function decisionCoach(
  trades: Trade[],
  today: string,
  checkin?: DailyCheckin,
): CoachPriority {
  const open = trades.filter((trade) => trade.status === 'OPEN').length;
  if (open)
    return {
      kind: 'open',
      count: open,
      title: {
        en: `Protect the risk on ${open} open ${open === 1 ? 'trade' : 'trades'}`,
        th: `ดูแลความเสี่ยงของ ${open} ไม้ที่ยังเปิดอยู่`,
      },
      body: {
        en: 'Confirm the stop and planned risk before considering another entry.',
        th: 'เช็ก Stop และความเสี่ยงตามแผนก่อนพิจารณาเข้าไม้ใหม่',
      },
    };
  const pending = pendingReviewTrades(trades).length;
  if (pending)
    return {
      kind: 'review',
      count: pending,
      title: {
        en: 'Finish one review while the decision is still fresh',
        th: 'ทบทวนหนึ่งไม้ ขณะที่การตัดสินใจยังสดอยู่',
      },
      body: {
        en: `${pending} ${pending === 1 ? 'trade is' : 'trades are'} waiting. A quick plan check is enough to start.`,
        th: `มี ${pending} เทรดรออยู่ เริ่มจากตอบสั้น ๆ ว่าทำตามแผนหรือไม่`,
      },
    };
  if (checkin?.kind === 'rest')
    return {
      kind: 'rest',
      count: 0,
      title: { en: 'Protect the decision to rest', th: 'รักษาการตัดสินใจที่จะพัก' },
      body: {
        en: 'A no-trade day is part of a disciplined process.',
        th: 'วันที่ไม่เทรดก็เป็นส่วนหนึ่งของกระบวนการที่มีวินัย',
      },
    };
  if (!checkin && !trades.some((trade) => trade.date === today))
    return {
      kind: 'intention',
      count: 0,
      title: { en: 'Choose one rule for today', th: 'เลือกหนึ่งกฎที่จะยึดไว้วันนี้' },
      body: {
        en: 'Set a focus before the market asks you to make a fast decision.',
        th: 'ตั้งโฟกัสก่อนตลาดบังคับให้คุณต้องตัดสินใจเร็ว',
      },
    };
  return {
    kind: 'ready',
    count: 0,
    title: { en: 'Your journal is caught up', th: 'บันทึกของคุณตามทันแล้ว' },
    body: {
      en: 'Keep the next decision simple: plan, risk, then execute.',
      th: 'รักษาการตัดสินใจครั้งถัดไปให้ง่าย: วางแผน เช็กความเสี่ยง แล้วจึงลงมือ',
    },
  };
}
