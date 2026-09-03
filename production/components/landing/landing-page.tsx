import Link from "next/link";
import { TradoviaLogo } from "@/components/brand/tradovia-logo";
import { Card } from "@/components/ui/card";

const workflow = ["Trades", "Data", "Patterns", "Insights", "Decisions", "Improvement"];
const productAreas = [
  ["Trading Journal", "Capture the trade, context, screenshots and execution without turning journaling into admin work."],
  ["Trading Calendar", "See trading activity and realized P&L by day, week, month and year."],
  ["Performance Intelligence", "Turn trade history into understandable patterns, leaks and areas worth reviewing."],
];

export function LandingPage() {
  return <div className="landing-page landing-grid">
    <header className="landing-header">
      <TradoviaLogo />
      <nav><a href="#product">Product</a><a href="#intelligence">Intelligence</a><a href="#pricing">Pricing</a></nav>
      <div className="landing-actions"><button className="lang-button">EN / TH</button><Link className="link-button" href="/workspace">Open Workspace</Link></div>
    </header>
    <main>
      <section className="landing-hero">
        <div className="hero-copy"><p className="eyebrow">TRADING INTELLIGENCE PLATFORM</p><h1>Know your trading.<br/><span>Build your edge.</span></h1><p>Turn your trades into data, patterns and insights you can actually review. Tradovia is built to help traders understand their own performance and improve their process over time.</p><div className="hero-actions"><Link className="cta-primary" href="/workspace">Start with Tradovia</Link><a className="cta-secondary" href="#product">Explore the platform</a></div><small>Thailand first · Web first · Mobile-ready · No Buy/Sell signals</small></div>
        <Card className="product-preview glow"><div className="preview-top"><span>Performance Overview</span><span className="data-state">Illustrative preview</span></div><div className="preview-metrics"><div><span>Net P&L</span><strong>—</strong></div><div><span>Win Rate</span><strong>—</strong></div><div><span>Realized R</span><strong>—</strong></div></div><div className="preview-chart"><div className="chart-line"/><span>Your real performance appears after you add or import trades.</span></div><div className="preview-insight"><span>TRADOVIA INTELLIGENCE</span><strong>Result → Why → Action</strong><p>Every insight is designed to trace back to your own trading data.</p></div></Card>
      </section>
      <section className="workflow-strip" aria-label="Tradovia improvement loop">{workflow.map((item,index)=><div key={item}><strong>{item}</strong>{index<workflow.length-1&&<span>→</span>}</div>)}</section>
      <section id="product" className="landing-section"><div className="section-intro"><p className="eyebrow">ONE WORKSPACE</p><h2>From recording trades to understanding them.</h2><p>Keep the daily workflow simple while your accumulated trading data becomes more useful over time.</p></div><div className="product-grid">{productAreas.map(([title,copy],index)=><Card key={title} className="product-card"><span className="product-index">0{index+1}</span><h3>{title}</h3><p>{copy}</p></Card>)}</div></section>
      <section id="intelligence" className="landing-section intelligence-section"><div><p className="eyebrow">TRADOVIA INTELLIGENCE</p><h2>Not more data.<br/>Better understanding.</h2></div><Card className="intelligence-card"><div><span>RESULT</span><strong>What happened?</strong></div><div><span>WHY</span><strong>What patterns contributed?</strong></div><div><span>ACTION</span><strong>What should you review next?</strong></div><p>No Buy/Sell signals. Tradovia Intelligence is designed to help users understand their own recorded performance.</p></Card></section>
      <section id="pricing" className="landing-section"><div className="section-intro"><p className="eyebrow">PLANS</p><h2>Start simple. Upgrade when your workflow needs more.</h2></div><div className="pricing-grid"><Card className="price-card"><span>Starter</span><strong>Free</strong><p>Core manual journal, calendar and basic analytics.</p></Card><Card className="price-card featured"><span>Pro</span><strong>฿199 <small>/ month</small></strong><p>฿1,990/year · Unlimited journal, full analytics and Edge Intelligence · 7-day free trial.</p></Card><Card className="price-card"><span>Elite</span><strong>฿299 <small>/ month</small></strong><p>฿2,990/year · Connected-account and advanced intelligence roadmap.</p></Card></div></section>
    </main>
    <footer className="landing-footer"><TradoviaLogo compact/><span>Know your trading. Build your edge.</span><span>© Tradovia</span></footer>
  </div>;
}
