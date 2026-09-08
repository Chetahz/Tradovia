'use client';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  ChartNoAxesCombined,
  Sun,
  Moon,
} from 'lucide-react';
import { useState } from 'react';
export default function Home() {
  const [th, setTh] = useState(false),
    [dark, setDark] = useState(false);
  const t = (a: string, b: string) => (th ? b : a);
  return (
    <div className={`landing ${dark ? 'dark' : ''}`} lang={th ? 'th' : 'en'}>
      <header className="land-nav">
        <Link prefetch={false} href="/" className="brand">
          <span className="brand-mark">t</span>tradovia<sup>®</sup>
        </Link>
        <nav>
          <Link prefetch={false} href="#workspace">
            {t('Workspace', 'เวิร์กสเปซ')}
          </Link>
          <Link prefetch={false} href="#features">
            {t('Why Tradovia', 'ทำไมต้อง Tradovia')}
          </Link>
          <Link prefetch={false} href="#pricing">
            {t('Pricing', 'แพ็กเกจ')}
          </Link>
        </nav>
        <div className="actions">
          <button
            className="icon-button"
            onClick={() => setDark(!dark)}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="text-button" onClick={() => setTh(!th)}>
            {th ? 'EN' : 'TH'}
          </button>
          <Link prefetch={false} className="text-button sign-in" href="/auth">
            {t('Sign in', 'เข้าสู่ระบบ')}
          </Link>
          <Link prefetch={false} className="button ink" href="/auth">
            {t('Get started', 'เริ่มต้นใช้งาน')}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <section className="hero">
        <div className="eyebrow">
          <span className="status-dot" />
          {t('YOUR TRADING. CONNECTED.', 'ทุกส่วนของการเทรด เชื่อมถึงกัน')}
        </div>
        <h1>
          {t('A clearer mind.', 'มองชัดขึ้น')}
          <br />
          {t('A stronger edge.', 'เทรดอย่างมีระบบ')}
        </h1>
        <p>
          {t(
            'Your entire trading process, in one calm workspace.',
            'จัดการทุกขั้นตอนการเทรดในพื้นที่เดียว',
          )}
          <br />
          {t(
            'Plan with intention. Execute with discipline. Grow with insight.',
            'วางแผนอย่างมั่นใจ รักษาวินัย และเรียนรู้จากข้อมูลจริง',
          )}
        </p>
        <div className="hero-actions">
          <Link prefetch={false} href="/auth" className="button ink">
            {t('Build your workspace', 'สร้างเวิร์กสเปซของคุณ')}
            <ArrowUpRight size={18} />
          </Link>
          <Link prefetch={false} href="/demo" className="button ghost">
            {t('Explore the live demo', 'ลองใช้งานเดโม')}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-note">
          {t(
            'Manual journaling, always. No broker connection required.',
            'บันทึกการเทรดได้เสมอ โดยไม่ต้องเชื่อมต่อโบรกเกอร์',
          )}
        </div>
        <div id="workspace" className="product-preview">
          <div className="preview-side">
            <Link prefetch={false} className="brand" href="/demo">
              <span className="brand-mark">t</span>tradovia
            </Link>
            <small>WORKSPACE</small>
            {[
              'Overview',
              'Trade Journal',
              'Trading Calendar',
              'Analytics',
              'Risk Center',
            ].map((x, i) => (
              <div className={i === 0 ? 'selected' : ''} key={x}>
                <ChartNoAxesCombined size={15} />
                {x}
              </div>
            ))}
            <span className="preview-account">
              Demo Portfolio <span className="status-dot" />
            </span>
          </div>
          <div className="preview-main">
            <div className="preview-top">
              {t('WORKSPACE / OVERVIEW', 'เวิร์กสเปซ / ภาพรวม')}
              <span className="pill">
                {t('Interactive demo', 'เดโมแบบโต้ตอบ')}
              </span>
            </div>
            <h2>
              {t('Your next chapter starts here.', 'เริ่มบทใหม่ของการเทรดที่นี่')}
            </h2>
            <p>
              {t(
                'Every trade tells a story. See the bigger picture.',
                'ทุกไม้มีเรื่องราว มองให้เห็นภาพรวม',
              )}
            </p>
            <div className="preview-metrics">
              {[
                ['Net P&L', '+$1,284.00'],
                ['Win rate', '62.5%'],
                ['Profit factor', '2.18'],
              ].map((x) => (
                <div key={x[0]}>
                  <span>{x[0]}</span>
                  <strong>{x[1]}</strong>
                  <small>Illustrative demo preview</small>
                </div>
              ))}
            </div>
            <div className="preview-chart">
              <div className="section-heading">
                <b>
                  {t(
                    'The progress behind the process',
                    'ความก้าวหน้าจากกระบวนการที่ดี',
                  )}
                </b>
                <span className="positive">+12.84%</span>
              </div>
              <svg
                viewBox="0 0 800 175"

                aria-label="Illustrative equity curve"
              >
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#45ac84" stopOpacity=".18" />
                    <stop offset="100%" stopColor="#45ac84" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 150 L35 144 L65 153 L100 134 L130 140 L170 115 L210 128 L240 109 L270 117 L310 78 L350 87 L385 65 L425 80 L460 54 L500 64 L540 41 L580 50 L620 23 L660 31 L700 16 L740 28 L800 8 V175 H0Z"
                  fill="url(#eq)"
                />
                <path
                  d="M0 150 L35 144 L65 153 L100 134 L130 140 L170 115 L210 128 L240 109 L270 117 L310 78 L350 87 L385 65 L425 80 L460 54 L500 64 L540 41 L580 50 L620 23 L660 31 L700 16 L740 28 L800 8"
                  fill="none"
                  stroke="#329b75"
                  strokeWidth="2.5"
                />
              </svg>
              <div className="chart-axis">
                <span>WEEK 01</span>
                <span>WEEK 02</span>
                <span>WEEK 03</span>
                <span>WEEK 04</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="asset-strip">
        <span>{t('ONE WORKSPACE. EVERY MARKET.', 'พื้นที่เดียว สำหรับทุกตลาด')}</span>
        {['Forex', 'Metals', 'Indices', 'Crypto', 'Equities'].map((x) => (
          <b key={x}>{x}</b>
        ))}
      </div>
      <section id="features" className="land-section">
        <div className="eyebrow">
          {t('LESS FRICTION. MORE FOCUS.', 'จัดการง่ายขึ้น โฟกัสได้มากขึ้น')}
        </div>
        <h2>
          {t('Built around the way', 'ออกแบบให้เข้ากับ')}
          <br />
          {t('you trade.', 'วิธีที่คุณเทรด')}
        </h2>
        <div className="feature-grid">
          {[
            {
              icon: BookOpen,
              en: 'Every trade, understood.',
              th: 'เข้าใจทุกการเทรด',
              desc: 'Capture your execution, screenshots and thinking. Find what works in your own history.',
              td: 'เก็บรายละเอียด ภาพกราฟ และแนวคิด ค้นหาสิ่งที่ได้ผลจากประวัติของคุณ',
            },
            {
              icon: ShieldCheck,
              en: 'Discipline, by design.',
              th: 'สร้างวินัยอย่างเป็นระบบ',
              desc: 'Size positions around your risk. Set rules and goals that keep your process grounded.',
              td: 'คำนวณขนาดสัญญาตามความเสี่ยง พร้อมกฎและเป้าหมายที่ช่วยรักษาวินัย',
            },
            {
              icon: ChartNoAxesCombined,
              en: 'Your process, in perspective.',
              th: 'เห็นภาพรวมของกระบวนการ',
              desc: 'Connect your calendar, portfolio and analytics. One trade record, one consistent picture.',
              td: 'เชื่อมปฏิทิน พอร์ต และผลวิเคราะห์ ด้วยข้อมูลชุดเดียวกัน',
            },
          ].map((x, i) => (
            <article className="feature-card" key={x.en}>
              <span className="feature-number">0{i + 1}</span>
              <x.icon size={34} strokeWidth={1.3} />
              <h3>{t(x.en, x.th)}</h3>
              <p>{t(x.desc, x.td)}</p>
              <Link prefetch={false} href="/demo">
                {t('Explore workspace', 'สำรวจเวิร์กสเปซ')}
                <ArrowUpRight size={18} />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="manifesto">
        <div className="eyebrow">
          {t('YOUR EDGE IS IN YOUR PROCESS', 'ความได้เปรียบ เริ่มที่กระบวนการ')}
        </div>
        <h2>
          {t('More than a journal.', 'มากกว่าสมุดบันทึก')}
          <br />
          <span>
            {t('Your trading operating system.', 'ระบบจัดการการเทรดของคุณ')}
          </span>
        </h2>
        <p>
          {t(
            'From the first idea to the final review. Everything in its place.',
            'ตั้งแต่ไอเดียแรก จนถึงการทบทวน ทุกอย่างอยู่ในที่เดียว',
          )}
        </p>
        <Link prefetch={false} className="button ink" href="/demo">
          {t('Take it for a spin', 'ลองด้วยตัวคุณเอง')}
          <ArrowUpRight size={18} />
        </Link>
      </section>
      <section className="land-section" id="pricing">
        <div className="eyebrow">{t('ROOM TO GROW', 'เติบโตไปด้วยกัน')}</div>
        <h2>{t('Find your rhythm.', 'เลือกจังหวะที่ใช่สำหรับคุณ')}</h2>
        <p className="section-intro">
          {t(
            'Start with your process. Upgrade when you need more.',
            'เริ่มจากการสร้างระบบ อัปเกรดเมื่อคุณพร้อม',
          )}
        </p>
        <div className="pricing-grid">
          {[
            [
              'Manual',
              'Free',
              '1 portfolio',
              'Manual journal & images',
              'Calendar, analytics & risk',
            ],
            [
              'Pro',
              '$19',
              'Unlimited portfolios',
              'Advanced reviews & reports',
              'Broker sync when available',
            ],
            [
              'Elite',
              '$39',
              'Everything in Pro',
              'Expanded account capacity',
              'Priority support',
            ],
          ].map((p, i) => (
            <article
              className={`price-card ${i === 1 ? 'featured' : ''}`}
              key={p[0]}
            >
              <b>{p[0]}</b>
              <h3>
                {p[1]}
                {i > 0 && <small> / {t('month', 'เดือน')}</small>}
              </h3>
              <p>
                {t('A workspace that grows with you.', 'เวิร์กสเปซที่เติบโตไปกับคุณ')}
              </p>
              <Link
                prefetch={false}
                className={`button ${i === 1 ? 'ink' : 'ghost'}`}
                href="/auth"
              >
                {t(
                  i ? 'Explore launch plans' : 'Get started',
                  i ? 'ดูแพ็กเกจเปิดตัว' : 'เริ่มต้นใช้งาน',
                )}
                <ArrowUpRight size={16} />
              </Link>
              <ul>
                {p.slice(2).map((x, j) => (
                  <li key={x}>
                    ✓{' '}
                    {th
                      ? [
                          [
                            '1 พอร์ต',
                            'บันทึกการเทรดและภาพกราฟ',
                            'ปฏิทิน วิเคราะห์ และคำนวณความเสี่ยง',
                          ],
                          [
                            'ไม่จำกัดพอร์ต',
                            'ทบทวนและรายงานเชิงลึก',
                            'ซิงก์โบรกเกอร์เมื่อเปิดให้บริการ',
                          ],
                          [
                            'ทุกฟีเจอร์ของ Pro',
                            'รองรับบัญชีเพิ่มเติม',
                            'บริการช่วยเหลือแบบพิเศษ',
                          ],
                        ][i][j]
                      : x}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="pricing-note">
          {t(
            'Proposed launch pricing. Paid subscriptions and broker sync are not yet available. No charge today.',
            'ราคาเบื้องต้นสำหรับวันเปิดตัว ยังไม่เปิดรับชำระเงินหรือซิงก์โบรกเกอร์ ไม่มีค่าใช้จ่ายในวันนี้',
          )}
        </p>
      </section>
      <footer>
        <Link prefetch={false} className="brand" href="/">
          tradovia®
        </Link>
        <p>{t('Trade with intention.', 'เทรดอย่างมีเป้าหมาย')}</p>
        <span>© {new Date().getFullYear()} Tradovia</span>
        <Link prefetch={false} href="/demo">
          {t('Explore demo', 'ลองเดโม')} ↗
        </Link>
      </footer>
    </div>
  );
}
