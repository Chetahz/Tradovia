"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { tradeRepository } from "./storage";
import type { Trade, TradeDraft, TradeSide } from "./types";
import { enrichTradeDraft } from "./calculations";

const emptyDraft: TradeDraft = { symbol: "XAUUSD", side: "Long", openedAt: "", entry: 0, stopLoss: 0 };

export function TradeJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [draft, setDraft] = useState<TradeDraft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => setTrades(tradeRepository.list()), []);
  const preview = useMemo(() => enrichTradeDraft(draft), [draft]);
  const filtered = trades.filter((trade) => `${trade.symbol} ${trade.strategy ?? ""} ${trade.setup ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.symbol.trim() || !draft.openedAt || !draft.entry || !draft.stopLoss) return;
    tradeRepository.create(draft);
    setTrades(tradeRepository.list()); setDraft(emptyDraft); setOpen(false);
  }

  return <>
    <div className="journal-toolbar"><input className="tv-field" placeholder="Search symbol, strategy or setup" value={query} onChange={e=>setQuery(e.target.value)}/><button className="tv-button tv-button--primary" onClick={()=>setOpen(true)}>+ Add Trade</button></div>
    <div className="journal-table-wrap"><table className="journal-table"><thead><tr><th>Date / Time</th><th>Asset</th><th>Side</th><th>Entry</th><th>Initial Risk</th><th>Planned R:R</th><th>Net P&L</th><th>Realized R</th></tr></thead><tbody>{filtered.length ? filtered.map(trade=><tr key={trade.id}><td>{new Date(trade.openedAt).toLocaleString()}</td><td><strong>{trade.symbol}</strong></td><td>{trade.side}</td><td>{trade.entry}</td><td>{money(trade.initialRisk)}</td><td>{ratio(trade.plannedRR)}</td><td className={(trade.netPnl??0)>=0?"positive":"negative"}>{money(trade.netPnl)}</td><td>{ratio(trade.realizedR)}</td></tr>) : <tr><td colSpan={8}><div className="empty-state"><strong>No trades yet</strong><span>Add your first trade to start building your trading history.</span><button className="tv-button" onClick={()=>setOpen(true)}>Add Trade</button></div></td></tr>}</tbody></table></div>
    {open && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><form className="trade-modal" onSubmit={submit}><div className="modal-heading"><div><p className="eyebrow">JOURNAL</p><h2>Add Trade</h2></div><button type="button" className="icon-button" onClick={()=>setOpen(false)}>×</button></div><div className="trade-form-grid">
      <label>Asset<input className="tv-field" value={draft.symbol} onChange={e=>setDraft({...draft,symbol:e.target.value.toUpperCase()})}/></label>
      <label>Side<select className="tv-field" value={draft.side} onChange={e=>setDraft({...draft,side:e.target.value as TradeSide})}><option>Long</option><option>Short</option></select></label>
      <label>Date & Time<input className="tv-field" type="datetime-local" value={draft.openedAt} onChange={e=>setDraft({...draft,openedAt:e.target.value})}/></label>
      <label>Lot Size<input className="tv-field" type="number" step="any" onChange={e=>setDraft({...draft,lotSize:num(e.target.value)})}/></label>
      <label>Entry<input className="tv-field" type="number" step="any" onChange={e=>setDraft({...draft,entry:Number(e.target.value)})}/></label>
      <label>Initial SL<input className="tv-field" type="number" step="any" onChange={e=>setDraft({...draft,stopLoss:Number(e.target.value)})}/></label>
      <label>Take Profit<input className="tv-field" type="number" step="any" onChange={e=>setDraft({...draft,takeProfit:num(e.target.value)})}/></label>
      <label>Net P&L<input className="tv-field" type="number" step="any" onChange={e=>setDraft({...draft,netPnl:num(e.target.value)})}/></label>
      <label>Strategy<input className="tv-field" value={draft.strategy??""} onChange={e=>setDraft({...draft,strategy:e.target.value})}/></label>
      <label>Setup<input className="tv-field" value={draft.setup??""} onChange={e=>setDraft({...draft,setup:e.target.value})}/></label>
    </div><div className="risk-summary"><div><span>Planned R:R</span><strong>{ratio(preview.plannedRR)}</strong></div><div><span>Initial Risk</span><strong>{money(preview.initialRisk)}</strong></div><div><span>Realized R</span><strong>{ratio(preview.realizedR)}</strong></div></div><label className="notes-label">Notes<textarea className="tv-field" rows={4} value={draft.notes??""} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label><div className="modal-actions"><button type="button" className="tv-button" onClick={()=>setOpen(false)}>Cancel</button><button className="tv-button tv-button--primary" type="submit">Save Trade</button></div></form></div>}
  </>;
}

function num(value:string){return value===""?undefined:Number(value)}
function money(value?:number){return value===undefined||!Number.isFinite(value)?"—":`${value<0?"-":""}$${Math.abs(value).toFixed(2)}`}
function ratio(value?:number){return value===undefined||!Number.isFinite(value)?"—":`${value.toFixed(2)}R`}
