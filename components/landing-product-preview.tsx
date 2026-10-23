'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  BookOpen,
  Images,
  ListChecks,
  Check,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

// Tabs composition adapted from Origin UI on 21st.dev (MIT); see LANDING-ALIGNMENT.md.
const views = [
  { id: 'overview', icon: ChartNoAxesCombined, en: 'Overview', th: 'ภาพรวม' },
  { id: 'journal', icon: BookOpen, en: 'Journal', th: 'บันทึกเทรด' },
  { id: 'calendar', icon: CalendarDays, en: 'Calendar', th: 'ปฏิทิน' },
  { id: 'gallery', icon: Images, en: 'Gallery', th: 'แกลลอรี่' },
  {
    id: 'analytics',
    icon: ListChecks,
    en: 'Decision Quality',
    th: 'คุณภาพการตัดสินใจ',
  },
];
const trades = [
  {
    symbol: 'XAUUSD',
    side: 'Buy',
    setup: 'London pullback',
    result: 2.4,
    day: 18,
  },
  {
    symbol: 'EURUSD',
    side: 'Sell',
    setup: 'Structure retest',
    result: -1,
    day: 18,
  },
  {
    symbol: 'GBPUSD',
    side: 'Buy',
    setup: 'London pullback',
    result: 1.8,
    day: 17,
  },
  {
    symbol: 'XAUUSD',
    side: 'Buy',
    setup: 'London pullback',
    result: -1,
    day: 16,
  },
  {
    symbol: 'EURUSD',
    side: 'Sell',
    setup: 'Structure retest',
    result: 2,
    day: 15,
  },
  {
    symbol: 'XAUUSD',
    side: 'Buy',
    setup: 'London pullback',
    result: 1.6,
    day: 14,
  },
];
const total = trades.reduce((sum, trade) => sum + trade.result, 0);
const r = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}R`;
function Curve() {
  return (
    <svg
      viewBox="0 0 640 200"
      aria-label="Illustrative cumulative results in R"
    >
      <title>Illustrative cumulative results in R</title>
      {[40, 90, 140, 190].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="640"
          y2={y}
          stroke="currentColor"
          opacity=".1"
        />
      ))}
      <path
        d="M0 180L106 141L212 92L318 116L424 72L530 97L640 38V200H0Z"
        fill="var(--brand-primary)"
        opacity=".09"
      />
      <path
        d="M0 180L106 141L212 92L318 116L424 72L530 97L640 38"
        fill="none"
        stroke="var(--chart-equity)"
        strokeWidth="3"
      />
      <circle cx="640" cy="38" r="5" fill="var(--chart-equity)" />
    </svg>
  );
}
function Chart({ after = false }: { after?: boolean }) {
  const values = [
    128, 120, 133, 142, 130, 116, 121, 104, 110, 93, 101, 81, 74, 88, 70, 63,
    76, 55, 48, 62, 45, 36, 49, 29,
  ];
  return (
    <svg
      viewBox="0 0 480 200"
      aria-label={
        after
          ? 'Illustrative chart after trade'
          : 'Illustrative chart before trade'
      }
    >
      <title>
        {after
          ? 'Illustrative chart after trade'
          : 'Illustrative chart before trade'}
      </title>
      <rect width="480" height="200" fill="#14171b" />
      {[40, 80, 120, 160].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="480"
          y2={y}
          stroke="#ffffff"
          opacity=".07"
        />
      ))}
      {values.slice(0, after ? 24 : 15).map((y, i) => (
        <g
          key={i}
          stroke={i % 3 === 2 ? '#ed8796' : '#80d4b2'}
          fill={i % 3 === 2 ? '#ed8796' : '#80d4b2'}
        >
          <line x1={20 + i * 19} x2={20 + i * 19} y1={y - 13} y2={y + 24} />
          <rect x={15 + i * 19} y={y} width="10" height="12" rx="1" />
        </g>
      ))}
      <line
        x1="0"
        y1="100"
        x2="480"
        y2="100"
        stroke="#00EFD3"
        strokeDasharray="5 5"
      />
      <text x="12" y="94" fill="#00EFD3" fontSize="11">
        ENTRY · XAUUSD
      </text>
      <line
        x1="0"
        y1="157"
        x2="480"
        y2="157"
        stroke="#ed8796"
        strokeDasharray="4 6"
      />
      <text x="12" y="180" fill="#a5abb3" fontSize="10">
        ILLUSTRATIVE CHART · 1H
      </text>
    </svg>
  );
}
function TradeRows({ items = trades }: { items?: typeof trades }) {
  return (
    <div className="show-trades">
      {items.map((trade, i) => (
        <div className="show-trade" key={`${trade.symbol}-${i}`}>
          <span className="show-asset">{trade.symbol.slice(0, 2)}</span>
          <span>
            <b>{trade.symbol}</b>
            <small>
              {trade.side} · {trade.setup}
            </small>
          </span>
          <strong className={trade.result > 0 ? 'positive' : 'negative'}>
            {r(trade.result)}
          </strong>
        </div>
      ))}
    </div>
  );
}
export default function LandingProductPreview({ th }: { th: boolean }) {
  const t = (en: string, thai: string) => (th ? thai : en);
  const [day, setDay] = useState(18);
  const selected = trades.filter((trade) => trade.day === day);
  return (
    <section
      id="workspace"
      className="showcase"
      aria-label={t('Interactive product preview', 'ตัวอย่างผลิตภัณฑ์แบบโต้ตอบ')}
    >
      <div className="showcase-chrome">
        <span>
          <i />
          <i />
          <i />
        </span>
        <span>tradovia / workspace</span>
        <small>{t('ILLUSTRATIVE DATA', 'ข้อมูลตัวอย่าง')}</small>
      </div>
      <Tabs defaultValue="calendar" className="showcase-tabs">
        <div className="showcase-toolbar">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true" />
            tradovia
          </span>
          <span className="showcase-hint">
            {t('A closer look at your trading.', 'มองการเทรดของคุณให้ชัดขึ้น')}
          </span>
          <Link href="/demo" prefetch={false}>
            {t('Open demo', 'เปิดเดโม')} <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="showcase-tabs-scroll">
          <TabsList
            className="showcase-tablist"
            aria-label={t('Explore workspace pages', 'สำรวจหน้าเวิร์กสเปซ')}
          >
            {views.map((item) => (
              <TabsTrigger
                className="showcase-tab"
                key={item.id}
                value={item.id}
              >
                <item.icon size={17} />
                {t(item.en, item.th)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="showcase-panel">
          <div className="showcase-heading">
            <div>
              <small>YOUR TRADES. YOUR GROWTH.</small>
              <h2>{t('Your week, in perspective.', 'เห็นภาพทั้งสัปดาห์ของคุณ')}</h2>
            </div>
            <span>14–18 SEP 2026</span>
          </div>
          <div className="show-metrics">
            {[
              [t('Net result', 'ผลลัพธ์รวม'), r(total)],
              [t('Win rate', 'อัตราชนะ'), '66.7%'],
              [t('Trades reviewed', 'เทรดตัวอย่าง'), '6'],
              [t('Profit factor', 'Profit factor'), '3.90'],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="show-overview-grid">
            <article className="show-card show-curve">
              <div className="show-card-head">
                <h3>{t('Cumulative results', 'ผลลัพธ์สะสม')}</h3>
                <span>R-MULTIPLE</span>
              </div>
              <Curve />
              <div className="show-axis">
                <span>14 Sep</span>
                <span>16 Sep</span>
                <span>18 Sep</span>
              </div>
            </article>
            <article className="show-card">
              <small className="show-kicker">NEXT SESSION</small>
              <h3>{t('One clear focus.', 'โฟกัสทีละเรื่อง')}</h3>
              <p>
                {t(
                  'Wait for confirmation before entering. Bring this intention into your next session.',
                  'รอการยืนยันก่อนเข้าเทรด นำสิ่งที่ตั้งใจนี้ไปใช้ในรอบถัดไป',
                )}
              </p>
              <div className="show-check">
                <Check size={17} />
                {t('Review → Plan → Trade', 'ทบทวน → วางแผน → เทรด')}
              </div>
              <Link href="/demo#analytics" prefetch={false}>
                {t('Explore your review', 'ดูการทบทวน')}{' '}
                <ArrowUpRight size={16} />
              </Link>
            </article>
          </div>
        </TabsContent>
        <TabsContent value="journal" className="showcase-panel">
          <div className="showcase-heading">
            <div>
              <small>THE STORY BEHIND EACH TRADE</small>
              <h2>
                {t(
                  'Keep the reason. Not just the result.',
                  'เก็บเหตุผล พร้อมกับผลลัพธ์',
                )}
              </h2>
            </div>
            <Link href="/demo#journal" prefetch={false}>
              {t('Try the journal', 'ลองบันทึกเทรด')} ↗
            </Link>
          </div>
          <TradeRows />
          <p className="show-note">
            {t(
              'Attach charts, connect a playbook and revisit your decisions in the journal.',
              'แนบกราฟ เชื่อมแผนการเทรด และย้อนทบทวนการตัดสินใจในบันทึกของคุณ',
            )}
          </p>
        </TabsContent>
        <TabsContent value="calendar" className="showcase-panel">
          <div className="showcase-heading">
            <div>
              <small>EVERY DAY TELLS A STORY</small>
              <h2>{t('Your trading rhythm.', 'จังหวะการเทรดของคุณ')}</h2>
            </div>
            <span>{t('September 2026', 'กันยายน 2026')}</span>
          </div>
          <div className="show-calendar-layout">
            <div className="show-calendar">
              {(th
                ? ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
                : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
              ).map((d, i) => (
                <small key={i}>{d}</small>
              ))}
              <span />
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                const items = trades.filter((x) => x.day === d);
                const result = items.reduce((sum, x) => sum + x.result, 0);
                return (
                  <button
                    key={d}
                    className={`${items.length ? (result > 0 ? 'day-profit' : 'day-loss') : ''} ${day === d ? 'day-selected' : ''}`}
                    onClick={() => setDay(d)}
                    aria-pressed={day === d}
                    aria-label={`${d} ${t('September', 'กันยายน')}, ${items.length} ${t('trades', 'เทรด')}${items.length ? `, ${r(result)}` : ''}`}
                  >
                    <span>{d}</span>
                    {items.length > 0 && <b>{r(result)}</b>}
                  </button>
                );
              })}
            </div>
            <article className="show-card show-day" aria-live="polite">
              <small>{day} / 09 / 2026</small>
              <h3>
                {selected.length
                  ? t('A day to revisit.', 'วันที่น่าทบทวน')
                  : t('Space to reset.', 'เว้นจังหวะให้ตัวเอง')}
              </h3>
              {selected.length ? (
                <TradeRows items={selected} />
              ) : (
                <p>
                  {t(
                    'No example trades on this day. Choose a highlighted day to explore.',
                    'ไม่มีเทรดตัวอย่างในวันนี้ ลองเลือกวันที่มีสีเพื่อดูรายละเอียด',
                  )}
                </p>
              )}
              <Link href="/demo#calendar" prefetch={false}>
                {t('Explore calendar', 'เปิดปฏิทินในเดโม')} ↗
              </Link>
            </article>
          </div>
        </TabsContent>
        <TabsContent value="gallery" className="showcase-panel">
          <div className="showcase-heading">
            <div>
              <small>REMEMBER WHAT YOU SAW</small>
              <h2>
                {t(
                  'Before. After. A little wiser.',
                  'ก่อนเข้า หลังจบ เรียนรู้เพิ่มอีกนิด',
                )}
              </h2>
            </div>
            <span>XAUUSD · London pullback</span>
          </div>
          <div className="show-gallery">
            {[false, true].map((after) => (
              <Dialog key={String(after)}>
                <DialogTrigger className="show-chart-button">
                  <span>
                    {after
                      ? t('After the trade', 'หลังจบเทรด')
                      : t('Before entry', 'ก่อนเข้าเทรด')}
                    <Maximize2 size={17} />
                  </span>
                  <Chart after={after} />
                  <small>
                    {t('Tap to expand example', 'แตะเพื่อขยายภาพตัวอย่าง')}
                  </small>
                </DialogTrigger>
                <DialogContent className="show-chart-dialog">
                  <DialogTitle>
                    {after
                      ? t('After the trade', 'หลังจบเทรด')
                      : t('Before entry', 'ก่อนเข้าเทรด')}{' '}
                    · XAUUSD
                  </DialogTitle>
                  <DialogDescription>
                    {t(
                      'Illustrative chart. Explore the demo journal for the full gallery.',
                      'กราฟจำลองสำหรับแสดงตัวอย่าง ลองแกลลอรี่เต็มได้ในหน้าเดโม',
                    )}
                  </DialogDescription>
                  <Chart after={after} />
                </DialogContent>
              </Dialog>
            ))}
          </div>
          <p className="show-note">
            {t(
              'See the context you cannot capture in a number.',
              'เห็นบริบทที่ตัวเลขเพียงอย่างเดียวบอกไม่ได้',
            )}
          </p>
        </TabsContent>
        <TabsContent value="analytics" className="showcase-panel">
          <div className="showcase-heading">
            <div>
              <small>BEYOND WIN OR LOSS</small>
              <h2>
                {t('Did you follow your own plan?', 'คุณทำตามแผนของตัวเองไหม')}
              </h2>
            </div>
            <span>
              {t('Separate example · 16 trades', 'ตัวอย่างแยก · 16 เทรด')}
            </span>
          </div>
          <div className="show-quality">
            {[
              [t('Good win', 'ชนะตามแผน'), '7', '+8.1R'],
              [t('Good loss', 'แพ้ตามแผน'), '4', '−3.2R'],
              [t('Bad win', 'ชนะนอกแผน'), '2', '+1.4R'],
              [t('Bad loss', 'แพ้นอกแผน'), '3', '−4.8R'],
            ].map(([label, count, result], i) => (
              <article className={i < 2 ? 'planned' : 'unplanned'} key={label}>
                <small>{label}</small>
                <strong>{count}</strong>
                <span
                  className={result.startsWith('+') ? 'positive' : 'negative'}
                >
                  {result}
                </span>
              </article>
            ))}
          </div>
          <div className="show-insight">
            <ListChecks size={26} />
            <div>
              <h3>
                {t(
                  'A loss can still be a good decision.',
                  'ไม้ที่แพ้ ก็อาจเป็นการตัดสินใจที่ดี',
                )}
              </h3>
              <p>
                {t(
                  '11 of 16 example trades followed the plan. Review the other five to understand what changed.',
                  '11 จาก 16 เทรดตัวอย่างทำตามแผน ย้อนดูอีก 5 เทรดเพื่อเข้าใจว่าอะไรเปลี่ยนไป',
                )}
              </p>
            </div>
            <Link href="/demo#analytics" prefetch={false}>
              {t('Explore', 'สำรวจ')} ↗
            </Link>
          </div>
        </TabsContent>
      </Tabs>
      <div className="showcase-bottom">
        <span>
          <span className="status-dot" />{' '}
          {t('Plan. Capture. Review. Repeat.', 'วางแผน บันทึก ทบทวน ทำต่อเนื่อง')}
        </span>
        <small>
          {t(
            'Interactive examples · not investment results',
            'ตัวอย่างแบบโต้ตอบ · ไม่ใช่ผลการลงทุนจริง',
          )}
        </small>
      </div>
    </section>
  );
}
export function MobileCapturePreview({ th }: { th: boolean }) {
  const t = (en: string, thai: string) => (th ? thai : en);
  const [step, setStep] = useState(0);
  const [asset, setAsset] = useState('XAUUSD');
  const steps = [
    {
      title: t('Start with the essentials.', 'เริ่มจากสิ่งสำคัญก่อน'),
      body: t(
        'Choose your asset. Keep the details for when you have the headspace.',
        'เลือกสินทรัพย์ เก็บข้อมูลสำคัญ แล้วค่อยเติมรายละเอียดเมื่อพร้อม',
      ),
    },
    {
      title: t('Make room for the numbers.', 'กรอกตัวเลขได้ชัดเจน'),
      body: t(
        'Entry, size and risk belong together. A focused step gives each field room.',
        'ราคาเข้า ขนาด และความเสี่ยง อยู่ด้วยกันในขั้นตอนที่โฟกัสได้ง่าย',
      ),
    },
    {
      title: t('Remember your reason.', 'เก็บเหตุผลของการตัดสินใจ'),
      body: t(
        'Connect the trade to your plan, then return to your day.',
        'เชื่อมเทรดกับแผนของคุณ แล้วกลับไปใช้วันของคุณต่อ',
      ),
    },
  ];
  return (
    <section className="capture-section">
      <div className="capture-copy">
        <small className="eyebrow">LESS TYPING. MORE LIVING.</small>
        <h2>
          {t('A journal you want', 'บันทึกที่อยาก')}
          <br />
          <span>{t('to come back to.', 'กลับมาจดทุกวัน')}</span>
        </h2>
        <p>
          {t(
            'Trading takes enough energy. Your journal should help you reflect, one small step at a time.',
            'การเทรดใช้พลังมากพอแล้ว บันทึกของคุณควรช่วยให้ทบทวนได้ง่าย ทีละขั้นเล็ก ๆ',
          )}
        </p>
        <div className="capture-steps">
          {steps.map((item, i) => (
            <button
              key={item.title}
              onClick={() => setStep(i)}
              aria-pressed={step === i}
            >
              <b>0{i + 1}</b>
              <span>
                <strong>{item.title}</strong>
                <small>{item.body}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <Link className="button ink" prefetch={false} href="/demo#journal">
          {t('Try the full journal', 'ลองบันทึกในเดโม')}{' '}
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="capture-phone">
        <div className="phone-island" />
        <div className="phone-top">
          <span className="brand-mark" />
          <small>tradovia</small>
          <span>0{step + 1} / 03</span>
        </div>
        <h3>{t('Capture a trade', 'บันทึกการเทรด')}</h3>
        <div className="phone-progress">
          {steps.map((_, i) => (
            <i key={i} className={i <= step ? 'active' : ''} />
          ))}
        </div>
        <div className="phone-content" aria-live="polite">
          {step === 0 ? (
            <>
              <small>{t('ASSET', 'สินทรัพย์')}</small>
              <h4>{t('What did you trade?', 'วันนี้เทรดอะไร')}</h4>
              <div className="phone-assets">
                {['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'].map((a) => (
                  <button
                    key={a}
                    aria-pressed={asset === a}
                    onClick={() => setAsset(a)}
                    className={asset === a ? 'selected' : ''}
                  >
                    {a}
                    {asset === a && <Check size={16} />}
                  </button>
                ))}
              </div>
              <div className="phone-value">
                <small>{t('Direction', 'ทิศทาง')}</small>
                <b>Buy / Long</b>
              </div>
            </>
          ) : step === 1 ? (
            <>
              <small>{asset} · BUY</small>
              <h4>{t('Keep it clear.', 'ตัวเลขที่ต้องใช้')}</h4>
              {[
                ['Entry', '2,431.50'],
                ['Lot', '0.01'],
                ['Stop loss', '2,418.50'],
              ].map(([label, value]) => (
                <div className="phone-value" key={label}>
                  <small>{label}</small>
                  <b>{value}</b>
                </div>
              ))}
              <p>
                {t(
                  'Example values — try editing in the demo.',
                  'ค่าตัวอย่าง — ทดลองกรอกได้ในเดโม',
                )}
              </p>
            </>
          ) : (
            <>
              <small>{t('YOUR PLAN', 'แผนของคุณ')}</small>
              <h4>London pullback</h4>
              {[
                t('Trend is clear', 'เทรนด์ชัดเจน'),
                t('Price at a key zone', 'ราคาอยู่ในโซนสำคัญ'),
                t('Confirmation before entry', 'รอการยืนยันก่อนเข้า'),
              ].map((label) => (
                <div className="phone-rule" key={label}>
                  <Check size={18} />
                  {label}
                </div>
              ))}
              <p>
                {t(
                  'A little context now. A clearer review later.',
                  'เก็บบริบทไว้อีกนิด เพื่อทบทวนได้ชัดขึ้น',
                )}
              </p>
            </>
          )}
        </div>
        <button className="phone-next" onClick={() => setStep((step + 1) % 3)}>
          {step === 2
            ? t('Replay example', 'ดูตัวอย่างอีกครั้ง')
            : t('Continue', 'ถัดไป')}
          <ChevronRight size={17} />
        </button>
        <small className="phone-caption">
          {t(
            'Interactive walkthrough · no data saved',
            'ตัวอย่างขั้นตอน · ไม่มีการบันทึกข้อมูล',
          )}
        </small>
      </div>
    </section>
  );
}
