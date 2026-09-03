import type { TradeDraft } from "./types";

export function calculatePlannedRR(entry: number, stopLoss: number, takeProfit?: number) {
  if (!Number.isFinite(entry) || !Number.isFinite(stopLoss) || !Number.isFinite(takeProfit)) return undefined;
  const riskDistance = Math.abs(entry - stopLoss);
  if (riskDistance === 0 || takeProfit === undefined) return undefined;
  return Math.abs(takeProfit - entry) / riskDistance;
}

export function calculateXauUsdInitialRisk(entry: number, stopLoss: number, lotSize?: number) {
  if (!Number.isFinite(entry) || !Number.isFinite(stopLoss) || !Number.isFinite(lotSize) || lotSize === undefined) return undefined;
  return Math.abs(entry - stopLoss) * 100 * lotSize;
}

export function calculateRealizedR(netPnl?: number, initialRisk?: number) {
  if (!Number.isFinite(netPnl) || !Number.isFinite(initialRisk) || !initialRisk || netPnl === undefined) return undefined;
  return netPnl / initialRisk;
}

export function enrichTradeDraft(draft: TradeDraft) {
  const plannedRR = calculatePlannedRR(draft.entry, draft.stopLoss, draft.takeProfit);
  const initialRisk = draft.initialRisk ?? (draft.symbol.toUpperCase().includes("XAUUSD") ? calculateXauUsdInitialRisk(draft.entry, draft.stopLoss, draft.lotSize) : undefined);
  const realizedR = calculateRealizedR(draft.netPnl, initialRisk);
  return { ...draft, initialRisk, plannedRR, realizedR };
}
