import type { Account } from './domain.ts';

const PREFIX = 'tradovia.trade-defaults.v1';

export type TradeDefaults = {
  accountId: string;
  symbol: string;
};

export function tradeDefaultsKey(
  mode: 'demo' | 'real',
  accounts: Account[],
) {
  if (!accounts.length) return null;
  return `${PREFIX}.${mode}.${accounts
    .map((account) => account.id)
    .sort()
    .join('.')}`;
}

export function saveTradeDefaults(
  storage: Pick<Storage, 'setItem'>,
  key: string,
  defaults: TradeDefaults,
) {
  try {
    storage.setItem(
      key,
      JSON.stringify({
        accountId: defaults.accountId,
        symbol: defaults.symbol.trim().toUpperCase(),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function readTradeDefaults(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  accounts: Account[],
): TradeDefaults | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<TradeDefaults>;
    const symbol = value.symbol?.trim().toUpperCase();
    if (
      typeof value.accountId !== 'string' ||
      !accounts.some((account) => account.id === value.accountId) ||
      !symbol ||
      symbol.length > 24 ||
      !/^[A-Z0-9._-]+$/.test(symbol)
    ) {
      storage.removeItem(key);
      return null;
    }
    return { accountId: value.accountId, symbol };
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      /* Storage may be unavailable. */
    }
    return null;
  }
}
