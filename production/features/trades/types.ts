export type TradeSide = "Long" | "Short";

export type Trade = {
  id: string;
  symbol: string;
  side: TradeSide;
  openedAt: string;
  entry: number;
  stopLoss: number;
  takeProfit?: number;
  exit?: number;
  lotSize?: number;
  netPnl?: number;
  strategy?: string;
  setup?: string;
  notes?: string;
  initialRisk?: number;
  plannedRR?: number;
  realizedR?: number;
};

export type TradeDraft = Omit<Trade, "id" | "plannedRR" | "realizedR">;
