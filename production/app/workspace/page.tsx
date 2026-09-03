import { Card } from "@/components/ui/card";

const metrics = [
  ["Net P&L", "—"],
  ["Win Rate", "—"],
  ["Profit Factor", "—"],
  ["Realized R", "—"],
];

export default function WorkspacePage() {
  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">OVERVIEW</p><h1>Trading Dashboard</h1></div>
        <p>Review performance, patterns and discipline from one workspace.</p>
      </div>
      <section className="metric-grid" aria-label="Performance metrics">
        {metrics.map(([label, value]) => <Card key={label} className="metric-card"><span>{label}</span><strong>{value}</strong><small>Waiting for migrated trade data</small></Card>)}
      </section>
      <section className="dashboard-grid">
        <Card className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">PERFORMANCE</p><h2>Equity & Calendar</h2></div><span className="data-state">Demo / unverified</span></div><div className="panel-placeholder">Chart and calendar migration area</div></Card>
        <Card className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">TRADOVIA INTELLIGENCE</p><h2>Know what drives your results.</h2></div></div><div className="insight-stack"><div><span>Strongest Edge</span><strong>Waiting for trade history</strong></div><div><span>Biggest Leak</span><strong>Waiting for trade history</strong></div><div><span>Discipline</span><strong>Waiting for playbook data</strong></div></div></Card>
      </section>
    </>
  );
}
