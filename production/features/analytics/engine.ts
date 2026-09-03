import type { Trade } from "@/features/trades/types";

export type AnalyticsSummary = {
  totalTrades: number; netPnl: number; wins: number; losses: number; winRate?: number;
  averageWin?: number; averageLoss?: number; profitFactor?: number; averageRealizedR?: number;
  bestSymbol?: GroupStat; bestStrategy?: GroupStat; worstStrategy?: GroupStat;
};
export type GroupStat = { name:string; trades:number; netPnl:number; winRate:number };

export function analyzeTrades(trades: Trade[]): AnalyticsSummary {
  const closed=trades.filter(t=>Number.isFinite(t.netPnl));
  const wins=closed.filter(t=>(t.netPnl??0)>0), losses=closed.filter(t=>(t.netPnl??0)<0);
  const grossWin=sum(wins), grossLoss=Math.abs(sum(losses));
  const realized=closed.map(t=>t.realizedR).filter((v):v is number=>Number.isFinite(v));
  const symbols=groups(closed,t=>t.symbol), strategies=groups(closed,t=>t.strategy?.trim()||"Unspecified");
  return { totalTrades:trades.length, netPnl:sum(closed), wins:wins.length, losses:losses.length,
    winRate:closed.length?wins.length/closed.length*100:undefined,
    averageWin:wins.length?grossWin/wins.length:undefined, averageLoss:losses.length?-grossLoss/losses.length:undefined,
    profitFactor:grossLoss>0?grossWin/grossLoss:undefined, averageRealizedR:realized.length?realized.reduce((a,b)=>a+b,0)/realized.length:undefined,
    bestSymbol:symbols[0], bestStrategy:strategies[0], worstStrategy:strategies.length?strategies[strategies.length-1]:undefined };
}
export function groupBySymbol(trades:Trade[]){return groups(trades,t=>t.symbol)}
export function groupByStrategy(trades:Trade[]){return groups(trades,t=>t.strategy?.trim()||"Unspecified")}
function groups(trades:Trade[],key:(t:Trade)=>string){const map=new Map<string,Trade[]>();for(const t of trades){const k=key(t);map.set(k,[...(map.get(k)||[]),t])}return [...map].map(([name,items])=>({name,trades:items.length,netPnl:sum(items),winRate:items.length?items.filter(t=>(t.netPnl??0)>0).length/items.length*100:0})).sort((a,b)=>b.netPnl-a.netPnl)}
function sum(trades:Trade[]){return trades.reduce((a,t)=>a+(t.netPnl??0),0)}
