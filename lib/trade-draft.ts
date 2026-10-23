import type { Account, Trade } from './domain.ts';

const PREFIX = 'tradovia.trade-draft.v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type TradeDraft = { trade: Trade; step: number; updatedAt: number };

export function tradeDraftKey(mode: 'demo' | 'real', accounts: Account[]) {
  if (!accounts.length) return null;
  return `${PREFIX}.${mode}.${accounts
    .map((account) => account.id)
    .sort()
    .join('.')}`;
}

export function clearTradeDraft(
  storage: Pick<Storage, 'removeItem'>,
  key: string,
) {
  try {
    storage.removeItem(key);
  } catch {
    /* Storage may be unavailable. */
  }
}

export function saveTradeDraft(
  storage: Pick<Storage, 'setItem'>,
  key: string,
  trade: Trade,
  step: number,
  now = Date.now(),
) {
  // Keep text and numbers only. Chart images stay in the image store.
  const {
    imageIds: _imageIds,
    imageStages: _imageStages,
    importRef: _importRef,
    ...fields
  } = trade;
  const draft: TradeDraft = {
    trade: { ...fields, imageIds: [] },
    step: Math.max(0, Math.min(2, Math.floor(step))),
    updatedAt: now,
  };
  try {
    storage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function readTradeDraft(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  accounts: Account[],
  now = Date.now(),
): TradeDraft | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<TradeDraft>;
    const trade = value.trade;
    if (
      !trade ||
      typeof trade !== 'object' ||
      typeof value.updatedAt !== 'number' ||
      value.updatedAt > now ||
      now - value.updatedAt > MAX_AGE_MS ||
      !accounts.some((account) => account.id === trade.accountId) ||
      typeof trade.id !== 'string' ||
      typeof trade.symbol !== 'string' ||
      typeof trade.date !== 'string' ||
      typeof trade.time !== 'string' ||
      typeof trade.notes !== 'string' ||
      (trade.side !== 'LONG' && trade.side !== 'SHORT') ||
      (trade.status !== 'OPEN' && trade.status !== 'CLOSED') ||
      !['entry', 'sl', 'tp', 'lot', 'risk', 'gross', 'fees'].every((field) =>
        Number.isFinite(trade[field as keyof Trade]),
      )
    ) {
      clearTradeDraft(storage, key);
      return null;
    }
    return {
      trade: { ...trade, imageIds: [], imageStages: undefined } as Trade,
      step: Number.isInteger(value.step)
        ? Math.max(0, Math.min(2, value.step!))
        : 0,
      updatedAt: value.updatedAt,
    };
  } catch {
    clearTradeDraft(storage, key);
    return null;
  }
}
