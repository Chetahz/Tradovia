import type { Trade, TradeDraft, TradeImage, TradeSide } from "./types";
import { enrichTradeDraft } from "./calculations";

const LEGACY_STORAGE_KEY = "tradoviaTrades";
const PRODUCTION_STORAGE_KEY = "tradovia.production.trades.v1";
const MIGRATION_BACKUP_KEY = "tradovia.production.legacy-trades-backup.v1";

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
    const production = this.read(PRODUCTION_STORAGE_KEY);
    if (production) return normalizeTrades(production);

    const legacy = this.read(LEGACY_STORAGE_KEY);
    if (!legacy) return [];

    const normalized = normalizeTrades(legacy);
    try {
      if (!window.localStorage.getItem(MIGRATION_BACKUP_KEY)) {
        window.localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify(legacy));
      }
      window.localStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Migration remains copy-only. If storage is full/unavailable, legacy data is still returned untouched.
    }
    return normalized;
  }

  create(draft: TradeDraft) {
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

  remove(id: string) {
    this.write(this.list().filter((trade) => trade.id !== id));
  }

  private read(key: string): LegacyTrade[] | undefined {
    try {
      const value = window.localStorage.getItem(key);
      if (!value) return undefined;
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as LegacyTrade[]) : undefined;
    } catch {
      return undefined;
    }
  }

  private write(trades: Trade[]) {
    window.localStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(trades));
  }
}

function normalizeTrades(items: LegacyTrade[]) {
  return items.map(normalizeTrade).filter((trade): trade is Trade => Boolean(trade));
}

function normalizeTrade(raw: LegacyTrade, index: number): Trade | undefined {
  const symbol = text(raw.symbol ?? raw.asset ?? raw.pair ?? raw.instrument);
  const openedAt = normalizeOpenedAt(raw);
  const entry = numeric(raw.entry ?? raw.entryPrice);
  const stopLoss = numeric(raw.stopLoss ?? raw.sl ?? raw.initialSL);
  if (!symbol || !openedAt || entry === undefined || stopLoss === undefined) return undefined;

  const sideText = text(raw.side ?? raw.direction ?? raw.type).toLowerCase();
  const side: TradeSide = sideText.includes("short") || sideText.includes("sell") ? "Short" : "Long";
  const draft: TradeDraft = {
    symbol: symbol.toUpperCase(),
    side,
    openedAt,
    entry,
    stopLoss,
    takeProfit: numeric(raw.takeProfit ?? raw.tp),
    exit: numeric(raw.exit ?? raw.exitPrice),
    lotSize: numeric(raw.lotSize ?? raw.lot ?? raw.size),
    netPnl: numeric(raw.netPnl ?? raw.pnl ?? raw.profit),
    strategy: text(raw.strategy) || undefined,
    setup: text(raw.setup) || undefined,
    notes: text(raw.notes ?? raw.note) || undefined,
    images: normalizeImages(raw.images ?? raw.screenshots ?? raw.attachments),
    initialRisk: numeric(raw.initialRisk ?? raw.riskAmount),
  };
  return { id: text(raw.id) || `legacy-${index}-${openedAt}`, ...enrichTradeDraft(draft) };
}

function normalizeImages(value: unknown): TradeImage[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const images = value.map((item, index) => {
    if (typeof item === "string" && item.startsWith("data:image/")) {
      return { id: `legacy-image-${index}`, name: `Screenshot ${index + 1}`, dataUrl: item };
    }
    if (item && typeof item === "object") {
      const raw = item as Record<string, unknown>;
      const dataUrl = text(raw.dataUrl ?? raw.src ?? raw.url);
      if (dataUrl.startsWith("data:image/")) {
        return { id: text(raw.id) || `legacy-image-${index}`, name: text(raw.name) || `Screenshot ${index + 1}`, dataUrl };
      }
    }
    return undefined;
  }).filter((image): image is TradeImage => Boolean(image));
  return images.length ? images : undefined;
}

function normalizeOpenedAt(raw: LegacyTrade) {
  const direct = text(raw.openedAt ?? raw.dateTime ?? raw.datetime);
  if (direct) return direct;
  const date = text(raw.date ?? raw.tradeDate ?? raw.openDate);
  const time = text(raw.time ?? raw.tradeTime ?? raw.openTime);
  if (date && time) return `${date}T${time}`;
  return date || time;
}
function text(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""; }
function numeric(value: unknown) { const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN; return Number.isFinite(n) ? n : undefined; }

export const tradeRepository = new LocalTradeRepository();
