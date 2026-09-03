import type { Trade, TradeDraft } from "./types";
import { enrichTradeDraft } from "./calculations";

const STORAGE_KEY = "tradoviaTrades";

export interface TradeRepository {
  list(): Trade[];
  create(draft: TradeDraft): Trade;
  remove(id: string): void;
}

export class LocalTradeRepository implements TradeRepository {
  list(): Trade[] {
    if (typeof window === "undefined") return [];
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  }

  create(draft: TradeDraft): Trade {
    const trade: Trade = { id: crypto.randomUUID(), ...enrichTradeDraft(draft) };
    const trades = [trade, ...this.list()];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    return trade;
  }

  remove(id: string) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.list().filter((trade) => trade.id !== id)));
  }
}

export const tradeRepository = new LocalTradeRepository();
