export const SUPPORT_CATEGORIES = [
  'account',
  'billing',
  'import',
  'bug',
  'suggestion',
  'other',
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type SupportStatus = 'open' | 'waiting_customer' | 'resolved';

export type SupportTicket = {
  id: string;
  category: SupportCategory;
  subject: string;
  status: SupportStatus;
  createdAt: number;
  updatedAt: number;
  closedAt: number | null;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  authorType: 'member' | 'admin';
  body: string;
  createdAt: number;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt: number | null;
  createdAt: number;
};

const compact = (value: unknown, max: number) =>
  typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().slice(0, max)
    : '';

export function validateNewTicket(input: unknown) {
  const value =
    input && typeof input === 'object'
      ? (input as Record<string, unknown>)
      : {};
  const category = SUPPORT_CATEGORIES.includes(
    value.category as SupportCategory,
  )
    ? (value.category as SupportCategory)
    : null;
  const subject = compact(value.subject, 120);
  const message = compact(value.message, 2000);
  if (!category || subject.length < 4 || message.length < 10)
    throw new Error('Invalid support ticket');
  return { category, subject, message };
}

export function validateTicketReply(input: unknown) {
  const value =
    input && typeof input === 'object'
      ? (input as Record<string, unknown>)
      : {};
  const ticketId =
    typeof value.ticketId === 'string' &&
    /^[a-f0-9-]{36}$/i.test(value.ticketId)
      ? value.ticketId
      : '';
  const message = compact(value.message, 2000);
  if (!ticketId || message.length < 2) throw new Error('Invalid support reply');
  return { ticketId, message };
}

export function validateAdminTicketUpdate(input: unknown) {
  const value =
    input && typeof input === 'object'
      ? (input as Record<string, unknown>)
      : {};
  const ticketId =
    typeof value.ticketId === 'string' &&
    /^[a-f0-9-]{36}$/i.test(value.ticketId)
      ? value.ticketId
      : '';
  const action =
    value.action === 'reply' ||
    value.action === 'resolve' ||
    value.action === 'reopen'
      ? value.action
      : '';
  const message = compact(value.message, 2000);
  if (!ticketId || !action || (action === 'reply' && message.length < 2))
    throw new Error('Invalid support update');
  return { ticketId, action, message };
}
