import type { Trade, TradeDraft, TradeSide } from "./types";
import { enrichTradeDraft } from "./calculations";

const STORAGE_KEY = "tradoviaTrades";

type LegacyTrade = Record<string, unknown>;

export interface TradeRepository {
  list(): Trade[];
  create(draft: TradeDraft): Trade;
  update(id: string, draft: TradeDraft): Trade | undefined;
  remove(id: string): void;
}

export class LocalTradeRepository implements TradeRepository {
  list(): Trade[] {
    if (typeof window === "undefined") return [];
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = value ? JSON.parse(value) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item, index) => normalizeTrade(item as LegacyTrade, index)).filter((trade): trade is Trade => Boolean(trade));
    } catch {
      return [];
    }
  }

  create(draft: TradeDraft): Trade {
    const trade: Trade = { id: crypto.randomUUID(), ...enrichTradeDraft(draft) };
    this.write([trade, ...this.list()]);
    return trade;
  }

  update(id: string, draft: TradeDraft) {
    const trades = this.list();
    const index = trades.findIndex((trade) => trade.id === id);
    if (index < 0) return undefined;
    const updated: Trade = { id, ...enrichTradeDraft(draft) };
    trades[index] = updated;
    this.write(trades);
    return updated;
  }

  remove(id: string) { this.write(this.list().filter((trade) => trade.id !== id)); }

  private write(trades: Trade[]) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); }
}

function normalizeTrade(raw: LegacyTrade, index: number): Trade | undefined {
  const symbol = text(raw.symbol ?? raw.asset ?? raw.pair ?? raw.instrument);
  const openedAt = text(raw.openedAt ?? raw.dateTime ?? raw.datetime ?? raw.date ?? raw.time);
  const entry = numeric(raw.entry ?? raw.entryPrice);
  const stopLoss = numeric(raw.stopLoss ?? raw.sl ?? raw.initialSL);
  if (!symbol || !openedAt || entry === undefined || stopLoss === undefined) return undefined;
  const sideText = text(raw.side ?? raw.direction ?? raw.type).toLowerCase();
  const side: TradeSide = sideText.includes("short") || sideText.includes("sell") ? "Short" : "Long";
  const draft: TradeDraft = { symbol: symbol.toUpperCase(), side, openedAt, entry, stopLoss, takeProfit: numeric(raw.takeProfit ?? raw.tp), exit: numeric(raw.exit ?? raw.exitPrice), lotSize: numeric(raw.lotSize ?? raw.lot ?? raw.size), netPnl: numeric(raw.netPnl ?? raw.pnl ?? raw.profit), strategy: text(raw.strategy) || undefined, setup: text(raw.setup) || undefined, notes: text(raw.notes ?? raw.note) || undefined, initialRisk: numeric(raw.initialRisk ?? raw.riskAmount) };
  return { id: text(raw.id) || `legacy-${index}-${openedAt}`, ...enrichTradeDraft(draft) };
}

function text(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""; }
function numeric(value: unknown) { const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN; return Number.isFinite(n) ? n : undefined; }

export const tradeRepository = new LocalTradeRepository();
