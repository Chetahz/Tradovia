'use client';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Images,
  Upload,
  Sun,
  Moon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import LaunchPricing from '@/components/launch-pricing';
import { LandingGuide, LandingFAQ } from '@/components/landing-guide';
export default function Home() {
  const [th, setTh] = useState(false),
    [dark, setDark] = useState(false);
  useEffect(() => {
    setTh(localStorage.getItem('tradovia.language') === 'th');
    setDark(localStorage.getItem('tradovia.theme') === 'dark');
  }, []);
  const t = (a: string, b: string) => (th ? b : a);
  return (
    <div className={`landing ${dark ? 'dark' : ''}`} lang={th ? 'th' : 'en'}>
      <header className="land-nav">
        <Link prefetch={false} href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          tradovia
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
          <Link prefetch={false} href="#faq">
            {t('FAQ', 'คำถามที่พบบ่อย')}
          </Link>
        </nav>
        <div className="actions">
          <button
            className="icon-button"
            onClick={() => {
              setDark(!dark);
              localStorage.setItem('tradovia.theme', dark ? 'light' : 'dark');
            }}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="text-button"
            onClick={() => {
              setTh(!th);
              localStorage.setItem('tradovia.language', th ? 'en' : 'th');
            }}
          >
            {th ? 'EN' : 'TH'}
          </button>
          <Link prefetch={false} className="text-button sign-in" href="/auth">
            {t('Sign in', 'เข้าสู่ระบบ')}
          </Link>
          <Link
            prefetch={false}
            className="button ink"
            href="/auth?view=signup"
          >
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
          <Link
            prefetch={false}
            href="/auth?view=signup"
            className="button ink"
          >
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
            'Journal manually or import an MT5 report. No broker connection required.',
            'บันทึกเองหรือนำเข้ารายงาน MT5 ได้ โดยไม่ต้องเชื่อมต่อโบรกเกอร์',
          )}
        </div>
        <div id="workspace" className="product-preview">
          <div className="preview-side">
            <Link prefetch={false} className="brand" href="/demo">
              <span className="brand-mark" aria-hidden="true" />
              tradovia
            </Link>
            <small>{t('WORKSPACE', 'เวิร์กสเปซ')}</small>
            {[
              t('Overview', 'ภาพรวม'),
              t('Trade Journal', 'บันทึกการเทรด'),
              t('Playbook', 'แผนการเทรด'),
              t('Analytics', 'วิเคราะห์ผล'),
              t('Trading Calendar', 'ปฏิทินการเทรด'),
            ].map((x, i) => (
              <div className={i === 0 ? 'selected' : ''} key={x}>
                <ChartNoAxesCombined size={15} />
                {x}
              </div>
            ))}
            <span className="preview-account">
              {t('Demo Portfolio', 'พอร์ตตัวอย่าง')}{' '}
              <span className="status-dot" />
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
                [t('Net P&L', 'กำไร/ขาดทุนสุทธิ'), '+$1,284.00'],
                [t('Win rate', 'อัตราชนะ'), '62.5%'],
                ['Profit factor', '2.18'],
              ].map((x) => (
                <div key={x[0]}>
                  <span>{x[0]}</span>
                  <strong>{x[1]}</strong>
                  <small>
                    {t('Illustrative demo preview', 'ข้อมูลตัวอย่างประกอบ')}
                  </small>
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

                aria-label={t(
                  'Illustrative equity curve',
                  'ตัวอย่างกราฟมูลค่าพอร์ต',
                )}
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
                {[1, 2, 3, 4].map((week) => (
                  <span key={week}>
                    {t('WEEK', 'สัปดาห์')} 0{week}
                  </span>
                ))}
              </div>
            </div>
            <div
              className="preview-workflow"
              aria-label={t('Tradovia workflow', 'ขั้นตอนการใช้งาน Tradovia')}
            >
              {[
                ['01', t('Plan', 'วางแผน')],
                ['02', t('Record', 'บันทึก')],
                ['03', t('Review', 'ทบทวน')],
                ['04', t('Improve', 'พัฒนา')],
              ].map(([number, label]) => (
                <span key={number}>
                  <small>{number}</small>
                  {label}
                </span>
              ))}
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
              en: 'Turn rules into a Playbook.',
              th: 'เปลี่ยนกฎให้เป็น Playbook',
              desc: 'Build reusable entry, exit and risk checklists. Attach the right version to every trade.',
              td: 'สร้างเช็กลิสต์เข้า ออก และความเสี่ยง แล้วผูกเวอร์ชันของแผนกับทุกการเทรด',
              link: '/demo#playbook',
              label: t('PLAN', 'วางแผน'),
            },
            {
              icon: Upload,
              en: 'Bring trades in, your way.',
              th: 'นำเข้าข้อมูลในแบบของคุณ',
              desc: 'Record manually or preview an MT5 XLSX, HTML or Tradovia CSV before importing.',
              td: 'บันทึกเอง หรือตรวจรายงาน MT5 แบบ XLSX, HTML และ CSV ก่อนยืนยันนำเข้า',
              link: '/demo#journal',
              label: t('CAPTURE', 'บันทึก'),
            },
            {
              icon: Images,
              en: 'Review the chart, not just the number.',
              th: 'ทบทวนกราฟ มากกว่าดูแค่ตัวเลข',
              desc: 'Keep before-and-after chart images together. Browse the gallery and return to the source trade.',
              td: 'เก็บภาพกราฟก่อนเข้าและหลังจบไว้ด้วยกัน เปิดดูในแกลเลอรีและย้อนกลับไปยังเทรดต้นทาง',
              link: '/demo#journal',
              label: t('REVIEW', 'ทบทวน'),
            },
            {
              icon: ChartNoAxesCombined,
              en: 'See the behavior behind results.',
              th: 'เห็นพฤติกรรมที่อยู่เบื้องหลังผลลัพธ์',
              desc: 'Compare Playbooks, sessions, risk and outcomes. Open the exact trades behind every insight.',
              td: 'เปรียบเทียบ Playbook ช่วงเวลา ความเสี่ยง และผลลัพธ์ พร้อมเปิดดูเทรดจริงเบื้องหลังทุก Insight',
              link: '/demo#analytics',
              label: t('IMPROVE', 'พัฒนา'),
            },
          ].map((x, i) => (
            <article className="feature-card" key={x.en}>
              <span className="feature-number">
                0{i + 1} · {x.label}
              </span>
              <x.icon size={34} strokeWidth={1.3} />
              <h3>{t(x.en, x.th)}</h3>
              <p>{t(x.desc, x.td)}</p>
              <Link prefetch={false} href={x.link}>
                {t('See it in the demo', 'ดูในเดโม')}
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
      <LandingGuide th={th} />
      <LaunchPricing th={th} />
      <LandingFAQ th={th} />
      <footer>
        <Link prefetch={false} className="brand" href="/">
          tradovia
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
