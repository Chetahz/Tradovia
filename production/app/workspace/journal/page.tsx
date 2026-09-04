import { TradeJournal } from "@/features/trades/trade-journal";

export default function JournalPage() {
  return <>
    <div className="page-heading"><div><p className="eyebrow">TRADING</p><h1>Journal</h1></div><p>Record trades quickly, then use the history to review execution and performance.</p></div>
    <TradeJournal />
  </>;
}
