import { isTradeReviewed, type Trade } from './domain.ts';

// Call with the selected portfolio's trades so lessons never cross account scope.
export function latestReviewedLesson(trades: Trade[]): Trade | undefined {
  return trades
    .filter(
      (trade) =>
        trade.status === 'CLOSED' &&
        Boolean(trade.review?.completedAt) &&
        Boolean(trade.review?.lesson.trim()),
    )
    .sort(
      (a, b) =>
        Date.parse(b.review!.completedAt!) -
          Date.parse(a.review!.completedAt!) ||
        (b.date + b.time + b.id).localeCompare(a.date + a.time + a.id),
    )[0];
}

export function relevantReviewedLesson(trades: Trade[], draft: Trade) {
  const same = (a: string, b: string) =>
    Boolean(a.trim()) && a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
  const reviewed = trades
    .filter(
      (trade) =>
        trade.id !== draft.id &&
        trade.accountId === draft.accountId &&
        trade.status === 'CLOSED' &&
        Boolean(trade.review?.completedAt) &&
        Boolean(trade.review?.lesson.trim()),
    )
    .sort(
      (a, b) =>
        Date.parse(b.review!.completedAt!) - Date.parse(a.review!.completedAt!),
    );
  const playbook = draft.playbook?.id && reviewed.find(
    (trade) => trade.playbook?.id === draft.playbook?.id,
  );
  if (playbook) return { trade: playbook, reason: 'playbook' as const };
  const setup = reviewed.find((trade) => same(draft.setup, trade.setup));
  if (setup) return { trade: setup, reason: 'setup' as const };
  const symbol = reviewed.find((trade) => same(draft.symbol, trade.symbol));
  if (symbol) return { trade: symbol, reason: 'symbol' as const };
  return undefined;
}

export type CompanionPrompt = {
  kind: 'review' | 'open' | 'capture' | 'plan';
  title: { en: string; th: string };
  body: { en: string; th: string };
  action: { en: string; th: string };
};

export function companionClock(now: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const value = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';
    return {
      hour: Number(value('hour')),
      minute: Number(value('minute')),
      date: `${value('year')}-${value('month')}-${value('day')}`,
    };
  } catch {
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    };
  }
}

export function companionGreeting(hour: number) {
  if (hour >= 5 && hour < 11) return { en: 'Good morning', th: 'สวัสดีตอนเช้า' };
  if (hour >= 11 && hour < 14)
    return { en: 'Good afternoon', th: 'สวัสดีตอนเที่ยง' };
  if (hour >= 14 && hour < 18)
    return { en: 'Good afternoon', th: 'สวัสดีตอนบ่าย' };
  if (hour >= 18 && hour < 21) return { en: 'Good evening', th: 'สวัสดีตอนเย็น' };
  return { en: 'Good evening', th: 'สวัสดีตอนค่ำ' };
}

export function companionPrompt(
  trades: Trade[],
  today: string,
): CompanionPrompt {
  const open = trades.filter((trade) => trade.status === 'OPEN').length;
  if (open)
    return {
      kind: 'open',
      title: {
        en: `${open} open ${open === 1 ? 'trade' : 'trades'} to keep in view`,
        th: `มี ${open} ไม้ที่ยังเปิดอยู่`,
      },
      body: {
        en: 'Check your planned risk before making another decision.',
        th: 'เช็กความเสี่ยงตามแผนก่อนตัดสินใจครั้งถัดไป',
      },
      action: { en: 'View open trades', th: 'ดูไม้ที่ยังเปิด' },
    };
  const pending = trades.filter(
    (trade) => trade.status === 'CLOSED' && !isTradeReviewed(trade),
  ).length;
  if (pending)
    return {
      kind: 'review',
      title: {
        en: `${pending} ${pending === 1 ? 'trade is' : 'trades are'} ready to review`,
        th: `มี ${pending} เทรดรอทบทวน`,
      },
      body: {
        en: 'Choose one trade and keep a lesson for next time.',
        th: 'เลือกสักหนึ่งไม้ แล้วเก็บบทเรียนไว้ใช้ครั้งหน้า',
      },
      action: { en: 'Review a trade', th: 'ทบทวนสักหนึ่งไม้' },
    };
  if (!trades.some((trade) => trade.date === today))
    return {
      kind: 'capture',
      title: { en: 'A fresh page for today', th: 'วันนี้ยังเป็นหน้าใหม่' },
      body: {
        en: 'If you traded today, capture the essentials. A rest day is fine too.',
        th: 'ถ้าวันนี้มีเทรด จดสั้น ๆ ไว้ได้ วันพักก็สำคัญเหมือนกัน',
      },
      action: { en: 'Add a trade', th: 'บันทึกการเทรด' },
    };
  return {
    kind: 'plan',
    title: { en: 'Today is recorded', th: 'บันทึกวันนี้ไว้แล้ว' },
    body: {
      en: 'Take a breath, then check your plan before the next trade.',
      th: 'พักสักนิด แล้วค่อยดูแผนก่อนเทรดครั้งถัดไป',
    },
    action: { en: 'Open playbook', th: 'เปิดแผนการเทรด' },
  };
}
