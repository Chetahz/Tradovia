import type { Trade } from './domain';
export type BrokerPosition = {
  externalId: string;
  accountRef: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  openedAt: string;
  closedAt: string | null;
  entry: number;
  stop: number;
  target: number;
  volume: number;
  grossUsd: number;
  feesUsd: number;
  initialRiskUsd: number;
};
export type BrokerSyncPage = {
  positions: BrokerPosition[];
  nextCursor: string | null;
  asOf: string;
};
export interface BrokerAdapter {
  id: string;
  label: string;
  capabilities: {
    multipleAccounts: boolean;
    history: boolean;
    positions: boolean;
  };
  connect(accountRef: string, secretRef: string): Promise<void>;
  sync(accountRef: string, cursor: string | null): Promise<BrokerSyncPage>;
  disconnect(accountRef: string): Promise<void>;
}
export class BrokerNotConfigured extends Error {
  constructor(provider: string) {
    super(
      `${provider} requires a configured provider endpoint and server-side credentials`,
    );
    this.name = 'BrokerNotConfigured';
  }
}
export const brokerAdapters: Readonly<Record<string, BrokerAdapter>> =
  Object.fromEntries(
    ['metaapi', 'mt5-bridge', 'ctrader'].map((id) => [
      id,
      {
        id,
        label: id,
        capabilities: {
          multipleAccounts: true,
          history: true,
          positions: true,
        },
        async connect() {
          throw new BrokerNotConfigured(id);
        },
        async sync() {
          throw new BrokerNotConfigured(id);
        },
        async disconnect() {
          throw new BrokerNotConfigured(id);
        },
      },
    ]),
  );
// Stable provider/account/external IDs make ingestion idempotent. Never match on symbol/time alone.
export async function normalizePosition(
  provider: string,
  accountId: string,
  p: BrokerPosition,
): Promise<Trade> {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${provider}:${accountId}:${p.externalId}`),
  );
  const id = Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, '0'),
  ).join('');
  return {
    id,
    accountId,
    symbol: p.symbol,
    side: p.side,
    status: p.closedAt ? 'CLOSED' : 'OPEN',
    date: p.openedAt.slice(0, 10),
    time: p.openedAt.slice(11, 16),
    entry: p.entry,
    sl: p.stop,
    tp: p.target,
    lot: p.volume,
    risk: p.initialRiskUsd,
    gross: p.grossUsd,
    fees: p.feesUsd,
    setup: '',
    notes: '',
    imageIds: [],
  };
}
