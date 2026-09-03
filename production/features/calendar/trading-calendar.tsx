"use client";

import { useEffect, useMemo, useState } from "react";
import { tradeRepository } from "@/features/trades/storage";
import type { Trade } from "@/features/trades/types";

type View = "Day" | "Week" | "Month" | "Year";
const weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export function TradingCalendar(){
 const [trades,setTrades]=useState<Trade[]>([]),[view,setView]=useState<View>("Month"),[cursor,setCursor]=useState(()=>new Date()),[selected,setSelected]=useState<Date|null>(null);
 useEffect(()=>setTrades(tradeRepository.list()),[]);
 const days=useMemo(()=>calendarDays(cursor),[cursor]);
 const stats=useMemo(()=>summarize(trades),[trades]);
 const selectedTrades=selected?trades.filter(t=>sameDay(parseDate(t.openedAt),selected)):[];
 const move=(step:number)=>setCursor(c=>{const n=new Date(c); if(view==="Year")n.setFullYear(n.getFullYear()+step);else if(view==="Month")n.setMonth(n.getMonth()+step);else n.setDate(n.getDate()+step*(view==="Week"?7:1));return n});
 return <>
  <div className="calendar-toolbar"><div className="calendar-views">{(["Day","Week","Month","Year"] as View[]).map(v=><button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>{v}</button>)}</div><div className="calendar-nav"><button onClick={()=>move(-1)}>‹</button><strong>{title(cursor,view)}</strong><button onClick={()=>move(1)}>›</button><button onClick={()=>setCursor(new Date())}>Today</button></div></div>
  {view==="Month"&&<div className="calendar-card"><div className="weekday-row">{weekdays.map(d=><span key={d}>{d}</span>)}</div><div className="month-grid">{days.map((day,i)=>{if(!day)return <div className="day-cell muted-cell" key={`blank-${i}`}/>;const s=stats[key(day)];return <button key={key(day)} className={`day-cell ${s?.pnl>0?"profit-day":s?.pnl<0?"loss-day":""}`} onClick={()=>setSelected(day)}><span className="day-number">{day.getDate()}</span>{s&&<div className="day-result"><strong className={s.pnl>=0?"positive":"negative"}>{money(s.pnl)}</strong><small>{s.count} trade{s.count===1?"":"s"}</small></div>}</button>})}</div></div>}
  {view==="Week"&&<PeriodGrid dates={weekDates(cursor)} stats={stats} onSelect={setSelected}/>} 
  {view==="Day"&&<DayPanel date={cursor} trades={trades.filter(t=>sameDay(parseDate(t.openedAt),cursor))}/>} 
  {view==="Year"&&<YearGrid year={cursor.getFullYear()} trades={trades} onMonth={m=>{setCursor(new Date(cursor.getFullYear(),m,1));setView("Month")}}/>}
  {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><article className="trade-modal calendar-detail"><div className="modal-heading"><div><p className="eyebrow">TRADING DAY</p><h2>{selected.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</h2></div><button className="icon-button" onClick={()=>setSelected(null)}>×</button></div><DayPanel date={selected} trades={selectedTrades}/></article></div>}
 </>;
}
function DayPanel({date,trades}:{date:Date;trades:Trade[]}){const pnl=trades.reduce((s,t)=>s+(t.netPnl??0),0);return <div className="day-panel"><div className="day-summary"><div><span>Trades</span><strong>{trades.length}</strong></div><div><span>Realized P&L</span><strong className={pnl>=0?"positive":"negative"}>{money(pnl)}</strong></div></div><div className="day-trades">{trades.length?trades.map(t=><div key={t.id}><span><strong>{t.symbol}</strong> · {t.side}</span><span className={(t.netPnl??0)>=0?"positive":"negative"}>{money(t.netPnl??0)}</span></div>):<p>No trades recorded for this day.</p>}</div></div>}
function PeriodGrid({dates,stats,onSelect}:{dates:Date[];stats:Record<string,{count:number;pnl:number}>;onSelect:(d:Date)=>void}){return <div className="week-grid">{dates.map(d=>{const s=stats[key(d)];return <button key={key(d)} className={`week-day ${s?.pnl>0?"profit-day":s?.pnl<0?"loss-day":""}`} onClick={()=>onSelect(d)}><span>{d.toLocaleDateString(undefined,{weekday:"short"})}</span><strong>{d.getDate()}</strong><small>{s?`${s.count} trades · ${money(s.pnl)}`:"No trades"}</small></button>})}</div>}
function YearGrid({year,trades,onMonth}:{year:number;trades:Trade[];onMonth:(m:number)=>void}){return <div className="year-grid">{Array.from({length:12},(_,m)=>{const mt=trades.filter(t=>{const d=parseDate(t.openedAt);return d.getFullYear()===year&&d.getMonth()===m});const pnl=mt.reduce((s,t)=>s+(t.netPnl??0),0);return <button key={m} onClick={()=>onMonth(m)}><span>{new Date(year,m,1).toLocaleDateString(undefined,{month:"long"})}</span><strong className={pnl>0?"positive":pnl<0?"negative":""}>{mt.length?money(pnl):"—"}</strong><small>{mt.length} trades</small></button>})}</div>}
function summarize(trades:Trade[]){return trades.reduce<Record<string,{count:number;pnl:number}>>((a,t)=>{const d=parseDate(t.openedAt),k=key(d);if(!a[k])a[k]={count:0,pnl:0};a[k].count++;a[k].pnl+=t.netPnl??0;return a},{})}
function calendarDays(d:Date){const first=new Date(d.getFullYear(),d.getMonth(),1),last=new Date(d.getFullYear(),d.getMonth()+1,0),offset=(first.getDay()+6)%7;return [...Array(offset).fill(null),...Array.from({length:last.getDate()},(_,i)=>new Date(d.getFullYear(),d.getMonth(),i+1))] as (Date|null)[]}
function weekDates(d:Date){const start=new Date(d);start.setDate(d.getDate()-((d.getDay()+6)%7));return Array.from({length:7},(_,i)=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+i))}
function parseDate(v:string){return new Date(v)} function sameDay(a:Date,b:Date){return key(a)===key(b)} function key(d:Date){return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`} function money(v:number){return `${v<0?"-":""}$${Math.abs(v).toFixed(2)}`} function title(d:Date,v:View){if(v==="Year")return String(d.getFullYear());if(v==="Month")return d.toLocaleDateString(undefined,{month:"long",year:"numeric"});if(v==="Week"){const w=weekDates(d);return `${w[0].toLocaleDateString()} – ${w[6].toLocaleDateString()}`}return d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
