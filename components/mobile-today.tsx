'use client';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  dateKey,
  inPeriod,
  money,
  net,
  statistics,
  type Trade,
  type WorkspaceData,
} from '@/lib/domain';
import { companionClock, type CompanionPrompt } from '@/lib/daily-companion';
import type { Translate } from './workspace-ui';
import LessonRecall from './lesson-recall';
import DailyCheckin from './daily-checkin';

export default function MobileToday({
  data,
  trades,
  portfolio,
  setPortfolio,
  t,
  addTrade,
  navigate,
  onReview,
  onView,
  now,
  greeting,
  prompt,
  busy,
  saveCheckin,
}: {
  data: WorkspaceData;
  trades: Trade[];
  portfolio: string;
  setPortfolio: (id: string) => void;
  t: Translate;
  addTrade: () => void;
  navigate: (page: string) => void;
  onReview: () => void;
  onView: (trade: Trade) => void;
  now: Date | null;
  greeting: string;
  prompt: CompanionPrompt;
  busy: boolean;
  saveCheckin: (value: unknown) => Promise<boolean>;
}) {
  const today = now
    ? companionClock(now, data.profile.timezone).date
    : dateKey(new Date());
  const periodAnchor = new Date(`${today}T12:00:00`);
  const todayTrades = trades.filter((trade) => trade.date === today);
  const checkin = data.dailyCheckins?.find((item) => item.date === today);
  const resting = checkin?.kind === 'rest' && !data.trades.some((trade) => trade.date === today);
  const todayClosed = todayTrades.filter((trade) => trade.status === 'CLOSED');
  const todayPnl = todayClosed.reduce((sum, trade) => sum + net(trade), 0);
  const week = trades.filter((trade) => inPeriod(trade.date, 'week', periodAnchor));
  const month = trades.filter((trade) => inPeriod(trade.date, 'month', periodAnchor));
  const weekStats = statistics(week, 0);
  const monthStats = statistics(month, 0);
  const recent = [...trades].sort((a, b) =>
    (b.date + b.time + b.id).localeCompare(a.date + a.time + a.id),
  )[0];
  const planned = trades.filter(
    (trade) => trade.status === 'CLOSED' && trade.adherence === 'yes',
  ).length;
  const evaluated = trades.filter(
    (trade) =>
      trade.status === 'CLOSED' &&
      (trade.adherence === 'yes' ||
        trade.adherence === 'no' ||
        trade.adherence === 'partial'),
  ).length;
  return (
    <section
      className="mobile-today"
      aria-label={t('Today dashboard', 'ภาพรวมวันนี้')}
    >
      <div className="mobile-today-greeting">
        <span>
          {(now ?? new Date()).toLocaleDateString(t('en-US', 'th-TH'), {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            timeZone: data.profile.timezone,
          })}
        </span>
        <h2>{greeting}</h2>
        <p>{t(prompt.body.en, prompt.body.th)}</p>
      </div>
      <label className="mobile-account-select">
        <span>{t('Portfolio', 'พอร์ต')}</span>
        <select
          value={portfolio}
          onChange={(event) => setPortfolio(event.target.value)}
        >
          <option value="all">{t('All portfolios', 'ทุกพอร์ต')}</option>
          {data.portfolios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <DailyCheckin today={today} checkin={checkin} playbooks={data.playbooks || []} hasTradesToday={data.trades.some((trade) => trade.date === today)} busy={busy} t={t} save={saveCheckin} />
      <div
        className={`mobile-today-main${todayTrades.length ? '' : ' is-empty'}`}
        data-tour="today"
      >
        <span>
          {todayTrades.length
            ? todayClosed.length
              ? t("Today's recorded result", 'ผลลัพธ์ของเทรดวันนี้')
              : t('TRADES IN PROGRESS', 'เทรดที่ยังเปิดวันนี้')
            : resting ? t('TODAY’S DECISION', 'การตัดสินใจวันนี้') : t('YOUR NEXT ENTRY', 'บันทึกวันนี้')}
        </span>
        {todayTrades.length ? (
          <>
            <strong
              className={
                todayClosed.length
                  ? todayPnl > 0
                    ? 'positive'
                    : todayPnl < 0
                      ? 'negative'
                      : ''
                  : 'mobile-open-count'
              }
            >
              {todayClosed.length
                ? money(todayPnl)
                : `${todayTrades.length} ${t('open', 'ไม้')}`}
            </strong>
            <p>
              {todayClosed.length
                ? `${todayTrades.length} ${t('trades today', 'รายการวันนี้')} · ${todayClosed.length} ${t('closed', 'ปิดแล้ว')}`
                : t(
                    'Your trades are recorded. Results appear after closing.',
                    'บันทึกไว้แล้ว ผลลัพธ์จะแสดงเมื่อปิดเทรด',
                  )}
            </p>
          </>
        ) : (
          <>
            <strong>
              {resting ? t('Rest is part of the plan', 'การพักก็เป็นส่วนหนึ่งของแผน') : t('Capture your first trade today', 'บันทึกเทรดแรกของวันนี้')}
            </strong>
            <p>
              {resting ? t('You chose to stay out today. A clear decision is worth recording too.', 'วันนี้คุณเลือกไม่เข้าเทรด การตัดสินใจที่ชัดเจนก็ควรบันทึกไว้') : t(
                'Start with the essentials. Add your reasoning and chart when you are ready.',
                'เริ่มจากข้อมูลสำคัญ แล้วค่อยเติมเหตุผลหรือภาพกราฟเมื่อพร้อม',
              )}
            </p>
          </>
        )}
        <button
          onClick={todayTrades.length || resting ? () => navigate('calendar') : addTrade}
        >
          {todayTrades.length || resting ? <CalendarDays size={17} /> : <Plus size={17} />}
          {todayTrades.length || resting
            ? t('View your trading days', 'ดูปฏิทินการเทรด')
            : t('Add a trade', 'บันทึกการเทรด')}
          <ArrowRight size={16} />
        </button>
      </div>
      <LessonRecall trades={trades} t={t} onView={onView} />
      <div className="mobile-today-periods">
        <div>
          <small>{t('THIS WEEK', 'สัปดาห์นี้')}</small>
          <b
            className={
              weekStats.pnl > 0
                ? 'positive'
                : weekStats.pnl < 0
                  ? 'negative'
                  : ''
            }
          >
            {money(weekStats.pnl)}
          </b>
          <span>
            {weekStats.count} {t('closed trades', 'ไม้ที่ปิดแล้ว')}
          </span>
        </div>
        <div>
          <small>{t('THIS MONTH', 'เดือนนี้')}</small>
          <b
            className={
              monthStats.pnl > 0
                ? 'positive'
                : monthStats.pnl < 0
                  ? 'negative'
                  : ''
            }
          >
            {money(monthStats.pnl)}
          </b>
          <span>
            {monthStats.count} {t('closed trades', 'ไม้ที่ปิดแล้ว')}
          </span>
        </div>
      </div>
      {(!resting || prompt.kind !== 'capture') && <div className="mobile-today-section">
        <div className="mobile-today-heading">
          <h3>{t(prompt.title.en, prompt.title.th)}</h3>
          <Sparkles size={18} />
        </div>
        <button
          onClick={() => {
            if (prompt.kind === 'review') onReview();
            else if (prompt.kind === 'capture') addTrade();
            else navigate(prompt.kind === 'open' ? 'journal' : 'playbook');
          }}
        >
          {t(prompt.action.en, prompt.action.th)}
          <ArrowRight size={16} />
        </button>
      </div>}
      <div className="mobile-today-section">
        <div className="mobile-today-heading">
          <h3>{t('Latest trade', 'เทรดล่าสุด')}</h3>
          <button onClick={() => navigate('journal')}>
            {t('All trades', 'ทั้งหมด')} <ArrowRight size={15} />
          </button>
        </div>
        {recent ? (
          <button
            className="mobile-recent-trade"
            onClick={() => onView(recent)}
          >
            <span>
              <b>{recent.symbol}</b>
              <small>
                {recent.side === 'LONG' ? 'BUY' : 'SELL'} · {recent.lot} lot ·{' '}
                {recent.date}
              </small>
            </span>
            <strong
              className={
                net(recent) > 0 ? 'positive' : net(recent) < 0 ? 'negative' : ''
              }
            >
              {recent.status === 'CLOSED'
                ? money(net(recent))
                : t('Open', 'ยังเปิด')}
            </strong>
            <ArrowRight size={17} />
          </button>
        ) : (
          <p>
            {t('Your first trade will appear here.', 'เทรดแรกของคุณจะปรากฏที่นี่')}
          </p>
        )}
      </div>
      <div className="mobile-today-insight">
        <CheckCircle2 size={19} />
        <span>
          <b>{t('One performance insight', 'หนึ่งข้อสังเกตจากการเทรด')}</b>
          <small>
            {evaluated
              ? t(
                  `${planned} of ${evaluated} trades with a plan rating followed it.`,
                  `ทำตามแผน ${planned} จาก ${evaluated} ไม้ที่ประเมินการตัดสินใจ`,
                )
              : t(
                  'Review trades to see how consistently you follow your plan.',
                  'ทบทวนเทรดเพื่อดูว่าคุณทำตามแผนสม่ำเสมอแค่ไหน',
                )}
          </small>
          {evaluated > 0 && (
            <progress
              className="mobile-insight-track"
              aria-label={t('Trades that followed the plan', 'เทรดที่ทำตามแผน')}
              value={planned}
              max={evaluated}
            />
          )}
        </span>
      </div>
    </section>
  );
}
