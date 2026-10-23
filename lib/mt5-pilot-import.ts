import { mt5Trade, validateMt5Position } from './mt5-sync.ts';
import type { Trade } from './domain.ts';

/** Prepare a connector batch without writing to the journal or trusting its payload. */
export function prepareMt5PilotImport(
  input: unknown,
  accountId: string,
  connectionId: string,
  existingTrades: Pick<Trade, 'accountId' | 'importRef'>[],
) {
  if (!Array.isArray(input) || input.length > 500 ||
      !/^[a-zA-Z0-9_-]{1,80}$/.test(accountId) ||
      !/^[a-f0-9-]{36}$/.test(connectionId))
    throw new Error('Invalid MT5 pilot batch');

  const known = new Set(existingTrades
    .filter((trade) => trade.accountId === accountId && trade.importRef?.format === 'MT5')
    .map((trade) => trade.importRef!.positionId));
  const accepted: Trade[] = [];
  let duplicate = 0;
  let invalid = 0;
  for (const value of input) {
    try {
      const position = validateMt5Position(value);
      if (known.has(position.positionId)) { duplicate++; continue; }
      const id = `mt5_${connectionId.replaceAll('-', '')}_${position.positionId}`;
      accepted.push(mt5Trade(position, accountId, id));
      known.add(position.positionId);
    } catch {
      invalid++;
    }
  }
  return { accepted, duplicate, invalid };
}
