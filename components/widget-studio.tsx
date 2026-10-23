'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Eye, EyeOff,
  Globe2, Plus, Sparkles, TrendingUp, Activity,
} from 'lucide-react';
import { money, type Trade, type WorkspaceData } from '@/lib/domain';
import { buildWidgetSnapshot } from '@/lib/widget-snapshot';
import type { Translate } from './workspace-ui';
import PlanGate from './plan-gate';

function resultClass(value: number): string {
  return value > 0 ? 'is-profit' : value < 0 ? 'is-loss' : '';
}

function WidgetMark() {
  return <span className="widget-mark" aria-hidden="true"><Image src="/brand/tradovia-mark-black.png" width={18} height={18} alt="" /></span>;
}

export default function WidgetStudio({ data, trades, now, t, navigate, addTrade, pro }: {
  data: WorkspaceData;
  trades: Trade[];
  now: Date | null;
  t: Translate;
  navigate: (page: string) => void;
  addTrade: () => void;
  pro: boolean;
}) {
  const [showValues, setShowValues] = useState(true);
  const snapshot = useMemo(
    () => buildWidgetSnapshot(trades, data.profile.timezone, now ?? new Date()),
    [trades, data.profile.timezone, now],
  );
  const amount = (value: number) => showValues ? money(value) : '••••••';
  const hasWatchlist = Boolean(data.profile.watchlist?.length);
  const watch = (hasWatchlist ? data.profile.watchlist! : ['XAUUSD', 'EURUSD', 'GBPUSD']).slice(0, 3);
  const formatDay = (date: string) => {
    const day = new Date(`${date}T12:00:00Z`);
    if (t('en', 'th') === 'th') return ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][day.getUTCDay()];
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(day);
  };

  return (
    <section className="widget-studio" aria-label={t('Widget Studio', 'สตูดิโอวิดเจ็ต')}>
      <div className="widget-studio-intro">
        <div>
          <span className="overline">TRADOVIA · WIDGET STUDIO</span>
          <h2>{t('Your trading, at a glance.', 'ข้อมูลเทรดที่อยากเห็น แค่เหลือบมอง')}</h2>
          <p>{t(
            'Explore home-screen concepts built from your own journal. These previews work here today; installing iOS and Android widgets comes with the native app.',
            'ลองดูวิดเจ็ตจากข้อมูลบันทึกของคุณ ตอนนี้ใช้ดูและกดต่อในเว็บได้ ส่วนการติดตั้งบนหน้าจอ iOS และ Android จะมาพร้อมแอปในอนาคต',
          )}</p>
        </div>
        <button type="button" className="widget-privacy" onClick={() => setShowValues(value => !value)}
          aria-pressed={!showValues}>
          {showValues ? <EyeOff size={18} /> : <Eye size={18} />}
          {showValues ? t('Hide amounts', 'ซ่อนตัวเลข') : t('Show amounts', 'แสดงตัวเลข')}
        </button>
      </div>

      <div className="widget-gallery">
        <button type="button" className="widget-tile widget-small widget-today" onClick={() => navigate('overview')}>
          <span className="widget-tile-top"><WidgetMark /><span>{t('TODAY', 'วันนี้')}</span><ArrowUpRight size={17} /></span>
          <span className={`widget-big-number ${resultClass(snapshot.todayPnl)}`}>
            {snapshot.todayCount ? amount(snapshot.todayPnl)
              : snapshot.todayOpenCount ? `${snapshot.todayOpenCount} ${t('open', 'เปิดอยู่')}` : '—'}
          </span>
          <span className="widget-tile-footer">{snapshot.todayCount
            ? `${snapshot.todayCount} ${t('closed trades', 'ไม้ที่ปิดแล้ว')}${snapshot.todayOpenCount ? ` · ${snapshot.todayOpenCount} ${t('open', 'เปิดอยู่')}` : ''}`
            : snapshot.todayOpenCount ? t('Result appears after closing', 'ผลลัพธ์จะแสดงเมื่อปิดเทรด')
              : t('A fresh trading day', 'เริ่มวันเทรดใหม่')}</span>
        </button>

        <button type="button" className="widget-tile widget-small widget-capture" onClick={addTrade}>
          <span className="widget-tile-top"><WidgetMark /><span>{t('CAPTURE', 'บันทึก')}</span><Plus size={18} /></span>
          <span className="widget-capture-icon"><Plus size={30} strokeWidth={1.8} /></span>
          <strong>{t('One trade at a time', 'ทีละไม้ ก็เติบโตได้')}</strong>
          <span className="widget-tile-footer">{t('Tap to log a trade', 'แตะเพื่อบันทึกเทรด')}</span>
        </button>

        {pro ? <>
        <button type="button" className="widget-tile widget-medium widget-week" onClick={() => navigate('analytics')}>
          <span className="widget-tile-top"><WidgetMark /><span>{t('WEEK IN FOCUS', 'สัปดาห์นี้')}</span><TrendingUp size={18} /></span>
          <div className="widget-medium-row">
            <span><strong className={resultClass(snapshot.weekPnl)}>{amount(snapshot.weekPnl)}</strong>
              <small>{snapshot.weekCount} {t('closed trades', 'ไม้ที่ปิดแล้ว')}</small></span>
            <span className="widget-sparkline" aria-hidden="true">
              {snapshot.days.map(day => <i key={day.date}
                className={day.pnl > 0 ? 'gain' : day.pnl < 0 ? 'drop' : 'flat'}
                style={{ height: `${Math.max(10, Math.min(50, 12 + Math.abs(day.pnl) * 0.35))}px` }} />)}
            </span>
          </div>
          <span className="widget-tile-footer">{t('See the pattern, not just the result', 'ดูรูปแบบ ไม่ใช่แค่ผลลัพธ์')} <ArrowRight size={15} /></span>
        </button>

        <button type="button" className="widget-tile widget-medium widget-review" onClick={() => navigate('journal')}>
          <span className="widget-tile-top"><WidgetMark /><span>{t('REFLECTION', 'ทบทวน')}</span><BookOpen size={18} /></span>
          <div className="widget-medium-row">
            <span><strong>{snapshot.reviewCount}</strong>
              <small>{t('trades to reflect on', 'ไม้รอทบทวน')}</small></span>
            <span className="widget-review-orb"><Sparkles size={25} /></span>
          </div>
          <span className="widget-tile-footer">{snapshot.reviewCount
            ? t('Keep one lesson from each trade', 'เก็บบทเรียนจากทุกไม้')
            : t('Your review queue is clear', 'ทบทวนครบแล้ว')} <ArrowRight size={15} /></span>
        </button>

        <button type="button" className="widget-tile widget-large widget-calendar" onClick={() => navigate('calendar')}>
          <span className="widget-tile-top"><WidgetMark /><span>{t('TRADING RHYTHM', 'จังหวะการเทรด')}</span><CalendarDays size={18} /></span>
          <strong>{t('The last seven days', '7 วันที่ผ่านมา')}</strong>
          <div className="widget-weekdays">
            {snapshot.days.map(day => <span key={day.date}>
              <small>{formatDay(day.date)}</small>
              <i className={day.count ? day.pnl > 0 ? 'gain' : day.pnl < 0 ? 'drop' : 'even' : ''} />
              <b>{day.date.slice(-2)}</b>
            </span>)}
          </div>
          <span className="widget-tile-footer">{t('Open your calendar', 'เปิดปฏิทินของคุณ')} <ArrowRight size={15} /></span>
        </button>

        <button type="button" className="widget-tile widget-medium widget-recent" onClick={() => navigate('journal')}>
          <span className="widget-tile-top"><WidgetMark /><span>{t('LATEST ENTRY', 'บันทึกล่าสุด')}</span><ArrowUpRight size={18} /></span>
          <div className="widget-medium-row">
            <span><strong>{snapshot.recent?.symbol ?? '—'}</strong>
              <small>{snapshot.recent
                ? `${snapshot.recent.side === 'LONG' ? t('Buy', 'ซื้อ') : t('Sell', 'ขาย')} · ${snapshot.recent.date}`
                : t('Your first entry is one tap away', 'เริ่มบันทึกไม้แรกได้ทันที')}</small></span>
            <BookOpen size={29} strokeWidth={1.5} />
          </div>
          <span className="widget-tile-footer">{t('Open trade journal', 'เปิดบันทึกการเทรด')} <ArrowRight size={15} /></span>
        </button>

        <button type="button" className="widget-tile widget-medium widget-habit" onClick={() => navigate('calendar')}>
          <span className="widget-tile-top"><WidgetMark /><span>{t('YOUR RHYTHM', 'ความสม่ำเสมอ')}</span><Activity size={18} /></span>
          <div className="widget-medium-row">
            <span><strong>{snapshot.days.filter(day => day.count > 0).length}<em> / 7</em></strong>
              <small>{t('days with closed trades', 'วันที่มีเทรดปิดแล้ว')}</small></span>
            <span className="widget-habit-dots" aria-hidden="true">{snapshot.days.map(day =>
              <i key={day.date} className={day.count ? 'active' : ''} />)}</span>
          </div>
          <span className="widget-tile-footer">{t('Consistency grows one day at a time', 'ความสม่ำเสมอเริ่มจากวันละก้าว')} <ArrowRight size={15} /></span>
        </button>

        <button type="button" className="widget-tile widget-large widget-market" onClick={() => navigate('market')}>
          <span className="widget-tile-top"><WidgetMark /><span>{hasWatchlist ? t('YOUR WATCHLIST', 'ตลาดที่ติดตาม') : t('MARKET SHORTCUTS', 'ทางลัดตลาด')}</span><Globe2 size={18} /></span>
          <div className="widget-watch-symbols">{watch.map(symbol => <span key={symbol}>{symbol}</span>)}</div>
          <p>{t(
            'Open Market for TradingView quotes. Home-screen prices will require a licensed mobile data feed.',
            'เปิดหน้าตลาดเพื่อดูราคาจาก TradingView ส่วนราคาบนวิดเจ็ตหน้าจอมือถือจะต้องใช้แหล่งข้อมูลที่ได้รับสิทธิ์',
          )}</p>
          <span className="widget-tile-footer">{t('Open Market', 'เปิดหน้าตลาด')} <ArrowRight size={15} /></span>
        </button>
        </> : (
          <PlanGate
            compact
            t={t}
            title={t('Unlock the complete widget studio', 'ปลดล็อกวิดเจ็ตทั้งหมด')}
            description={t('Free includes Today and Quick Capture. Pro adds weekly patterns, review, calendar, consistency and market shortcuts.', 'Free ใช้ได้ทั้งวันนี้และบันทึกด่วน ส่วน Pro เพิ่มสัปดาห์ ทบทวน ปฏิทิน ความสม่ำเสมอ และทางลัดตลาด')}
          />
        )}
      </div>
      <p className="widget-studio-footnote">{t(
        'Preview uses the currently selected portfolio. Amounts are private to your session; no sample market prices are shown.',
        'ตัวอย่างใช้ข้อมูลพอร์ตที่เลือกอยู่ ตัวเลขเป็นข้อมูลส่วนตัวในเซสชันของคุณ และไม่มีการแสดงราคาตลาดสมมติ',
      )}</p>
    </section>
  );
}
