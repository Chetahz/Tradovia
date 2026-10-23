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
  ShieldCheck,
  LockKeyhole,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import LaunchPricing from '@/components/launch-pricing';
import { LandingFAQ } from '@/components/landing-guide';
import LandingProductPreview, {
  MobileCapturePreview,
} from '@/components/landing-product-preview';
import LandingScrollReveal from '@/components/landing-scroll-reveal';
export default function Home() {
  const [th, setTh] = useState(false),
    [dark, setDark] = useState(false);
  useEffect(() => {
    const restorePreferences = window.setTimeout(() => {
      setTh(localStorage.getItem('tradovia.language') === 'th');
      setDark(localStorage.getItem('tradovia.theme') === 'dark');
    }, 0);
    return () => window.clearTimeout(restorePreferences);
  }, []);
  useEffect(() => {
    document.documentElement.lang = th ? 'th' : 'en';
  }, [th]);
  const t = (a: string, b: string) => (th ? b : a);
  return (
    <div
      className={`landing landing-aligned ${dark ? 'dark' : ''}`}
      lang={th ? 'th' : 'en'}
    >
      <LandingScrollReveal />
      <div className="cinematic-intro">
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
              href="/demo"
            >
              {t('Explore demo', 'ลองเดโม')}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </header>
        <section className="hero cinematic-hero">
          <div className="cinematic-copy">
            <div className="eyebrow reveal-delay-1" data-reveal>
              <span className="status-dot" />
              {t('YOUR TRADING WORKSPACE', 'พื้นที่ของทุกการเทรด และการเติบโต')}
            </div>
            <h1 className="reveal-delay-2" data-reveal>
              {t('Every trade.', 'ทุกการเทรด')}
              <br />
              <span>{t('A clearer you.', 'เข้าใจตัวเองชัดขึ้น')}</span>
            </h1>
            <p className="reveal-delay-3" data-reveal>
              {t(
                'Plan, capture and review in one calm workspace. See your trading days, revisit your charts, and understand the decisions behind your results.',
                'วางแผน จดเทรด และทบทวนในพื้นที่เดียว เห็นวันที่คุณเทรด ย้อนดูกราฟ และเข้าใจการตัดสินใจที่อยู่เบื้องหลังผลลัพธ์',
              )}
            </p>
            <div className="hero-actions reveal-delay-4" data-reveal>
              <Link
                prefetch={false}
                href="/demo"
                className="button ink"
              >
                {t('Explore the live demo', 'ลองใช้งานเดโม')}
                <ArrowUpRight size={18} />
              </Link>
              <Link prefetch={false} href="#features" className="button ghost">
                {t('See how it works', 'ดูวิธีการใช้งาน')}
                <ArrowRight size={18} />
              </Link>
            </div>
            <div
              className="hero-proof reveal-delay-5"
              data-reveal
              aria-label={t('Product assurances', 'ข้อมูลสำคัญของผลิตภัณฑ์')}
            >
              <span>
                <ShieldCheck size={15} />
                {t('No broker connection', 'ไม่ต้องเชื่อมโบรกเกอร์')}
              </span>
              <span>
                <LockKeyhole size={15} />
                {t('Private account workspace', 'ข้อมูลแยกตามบัญชี')}
              </span>
              <span>
                <Upload size={15} />
                {t('MT5 report import', 'นำเข้ารายงาน MT5')}
              </span>
            </div>
          </div>
        </section>
        <div className="product-stage">
          <LandingProductPreview th={th} />
        </div>
      </div>
      <div className="asset-strip" data-reveal>
        <span>{t('ONE WORKSPACE. EVERY MARKET.', 'พื้นที่เดียว สำหรับทุกตลาด')}</span>
        {['Forex', 'Metals', 'Indices', 'Crypto', 'Equities'].map((x) => (
          <b key={x}>{x}</b>
        ))}
      </div>
      <MobileCapturePreview th={th} />
      <section id="features" className="land-section">
        <div className="eyebrow" data-reveal>
          {t('LESS FRICTION. MORE FOCUS.', 'จัดการง่ายขึ้น โฟกัสได้มากขึ้น')}
        </div>
        <h2 className="reveal-delay-1" data-reveal>
          {t('Built around the way', 'ออกแบบให้เข้ากับ')}
          <br />
          {t('you trade.', 'วิธีที่คุณเทรด')}
        </h2>
        <div className="feature-grid">
          {[
            {
              icon: BookOpen,
              en: 'Judge the decision, not the outcome.',
              th: 'วัดการตัดสินใจ ไม่ใช่ดูแค่ผลลัพธ์',
              desc: 'Separate good wins, good losses, bad wins and bad losses so luck does not hide a broken process.',
              td: 'แยกชนะตามแผน แพ้ตามแผน ชนะนอกแผน และแพ้นอกแผน เพื่อไม่ให้โชคบดบังกระบวนการที่ผิด',
              link: '/demo#analytics',
              label: t('DECIDE', 'ตัดสินใจ'),
            },
            {
              icon: Upload,
              en: 'Capture a trade before focus fades.',
              th: 'จดเทรดให้ทัน ก่อนเหตุผลจะเลือนหาย',
              desc: 'Use the mobile quick flow, save the essentials first and add the deeper review when the trade is done.',
              td: 'ใช้ขั้นตอนสั้นบนมือถือ เก็บข้อมูลสำคัญก่อน แล้วค่อยเติมการทบทวนเชิงลึกหลังจบเทรด',
              link: '/demo#journal',
              label: t('CAPTURE', 'บันทึก'),
            },
            {
              icon: Images,
              en: 'Find where rules leak R.',
              th: 'เห็นชัดว่าการหลุดกฎเสีย R ตรงไหน',
              desc: 'Compare in-plan and outside-plan results, then open the exact trades behind the difference.',
              td: 'เปรียบเทียบผลลัพธ์ในแผนกับนอกแผน และเปิดดูรายการเทรดจริงที่ทำให้ผลต่างเกิดขึ้น',
              link: '/demo#analytics',
              label: t('DIAGNOSE', 'วิเคราะห์'),
            },
            {
              icon: ChartNoAxesCombined,
              en: 'Turn the week into one next focus.',
              th: 'เปลี่ยนทั้งสัปดาห์ให้เหลือหนึ่งเรื่องที่ควรโฟกัส',
              desc: 'Use the weekly review to keep what worked, isolate the recurring mistake and choose the next rule to practice.',
              td: 'ใช้สรุปรายสัปดาห์เพื่อรักษาสิ่งที่ทำได้ดี แยกข้อผิดพลาดซ้ำ และเลือกกฎเดียวไปฝึกต่อ',
              link: '/demo#analytics',
              label: t('IMPROVE', 'พัฒนา'),
            },
          ].map((x, i) => (
            <article className="feature-card" data-reveal key={x.en}>
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
      <section className="manifesto decision-manifesto" data-reveal>
        <div className="eyebrow">
          {t('YOUR EDGE IS IN YOUR PROCESS', 'ความได้เปรียบ เริ่มที่กระบวนการ')}
        </div>
        <h2>
          {t('Results show what happened.', 'ผลลัพธ์บอกว่าเกิดอะไรขึ้น')}
          <br />
          <span>{t('Decisions explain why.', 'การตัดสินใจบอกว่าทำไม')}</span>
        </h2>
        <p>
          {t(
            'Tradovia connects the plan, the trade and the review so the next change comes from evidence.',
            'Tradovia เชื่อมแผน การเทรด และการทบทวน เพื่อให้สิ่งที่ปรับครั้งต่อไปมาจากหลักฐานจริง',
          )}
        </p>
        <Link prefetch={false} className="button ink" href="/demo">
          {t('Take it for a spin', 'ลองด้วยตัวคุณเอง')}
          <ArrowUpRight size={18} />
        </Link>
      </section>
      <LaunchPricing th={th} />
      <LandingFAQ th={th} />
      <footer>
        <Link prefetch={false} className="brand" href="/">
          tradovia
        </Link>
        <p>{t('Trade with intention.', 'เทรดอย่างมีเป้าหมาย')}</p>
        <span>© {new Date().getFullYear()} Tradovia</span>
        <Link prefetch={false} href="/privacy">
          {t('Privacy', 'ความเป็นส่วนตัว')}
        </Link>
        <Link prefetch={false} href="/terms">
          {t('Terms', 'ข้อกำหนด')}
        </Link>
        <Link prefetch={false} href="/demo">
          {t('Explore demo', 'ลองเดโม')} ↗
        </Link>
      </footer>
    </div>
  );
}
