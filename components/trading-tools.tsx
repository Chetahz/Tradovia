'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Pick,
  Field,
  TradeTable,
  type Translate,
} from '@/components/workspace-ui';
import {
  dailyStats,
  dateKey,
  assets,
  sizePosition,
  money,
  type Trade,
  type RiskInput,
} from '@/lib/domain';
export function TradingCalendar({
  trades,
  t,
  onView,
}: {
  trades: Trade[];
  t: Translate;
  onView: (t: Trade) => void;
}) {
  const [anchor, setAnchor] = useState(new Date()),
    [view, setView] = useState('month'),
    [day, setDay] = useState('');
  const daily = dailyStats(trades);
  const y = anchor.getFullYear(),
    m = anchor.getMonth();
  const move = (n: number) => {
    const d = new Date(anchor);
    if (view === 'year') d.setFullYear(y + n);
    else if (view === 'month') {
      d.setDate(1);
      d.setMonth(m + n);
    } else d.setDate(d.getDate() + 7 * n);
    setAnchor(d);
  };
  const start = new Date(y, m, 1);
  if (view === 'week') {
    start.setDate(anchor.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  } else start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: view === 'week' ? 7 : 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const current = trades.filter(
    (x) =>
      x.status === 'CLOSED' &&
      (view === 'year'
        ? x.date.startsWith(`${y}-`)
        : view === 'month'
          ? x.date.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)
          : days.some((d) => dateKey(d) === x.date)),
  );
  const total = current.reduce((n, tr) => n + tr.gross - tr.fees, 0);
  return (
    <div className="panel calendar-panel">
      <div className="calendar-toolbar">
        <div className="actions">
          <button
            aria-label="Previous period"
            className="icon-button"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={19} />
          </button>
          <h2>
            {view === 'year'
              ? y
              : anchor.toLocaleDateString(t('en-US', 'th-TH'), {
                  month: 'long',
                  year: 'numeric',
                })}
          </h2>
          <button
            aria-label="Next period"
            className="icon-button"
            onClick={() => move(1)}
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <div className="actions">
          <button className="text-button" onClick={() => setAnchor(new Date())}>
            {t('Today', 'วันนี้')}
          </button>
          <Tabs value={view} onValueChange={(v) => setView(String(v))}>
            <TabsList>
              {[
                ['week', 'Week', 'สัปดาห์'],
                ['month', 'Month', 'เดือน'],
                ['year', 'Year', 'ปี'],
              ].map((v) => (
                <TabsTrigger value={v[0]} key={v[0]}>
                  {t(v[1], v[2])}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="calendar-summary">
        <span>
          {current.length} {t('closed trades', 'ไม้ที่ปิดแล้ว')}
        </span>
        <strong className={total >= 0 ? 'positive' : 'negative'}>
          {money(total)}
        </strong>
      </div>
      {view === 'year' ? (
        <div className="year-grid">
          {Array.from({ length: 12 }, (_, mm) => {
            const monthDays = Object.entries(daily).filter(([k]) =>
              k.startsWith(`${y}-${String(mm + 1).padStart(2, '0')}`),
            );
            const pnl = monthDays.reduce((n, [, v]) => n + v.pnl, 0);
            return (
              <button
                className="year-month"
                key={mm}
                onClick={() => {
                  setAnchor(new Date(y, mm, 1));
                  setView('month');
                }}
              >
                <b>
                  {new Date(y, mm, 1).toLocaleDateString(t('en-US', 'th-TH'), {
                    month: 'long',
                  })}
                </b>
                <div className="mini-days">
                  {Array.from(
                    { length: new Date(y, mm + 1, 0).getDate() },
                    (_, d) => {
                      const k = dateKey(new Date(y, mm, d + 1));
                      return (
                        <span
                          key={d}
                          className={
                            daily[k]
                              ? daily[k].pnl >= 0
                                ? 'win-day'
                                : 'loss-day'
                              : ''
                          }
                        >
                          {d + 1}
                        </span>
                      );
                    },
                  )}
                </div>
                <span className={pnl >= 0 ? 'positive' : 'negative'}>
                  {money(pnl)}
                </span>
                <small>
                  {monthDays.reduce((n, [, v]) => n + v.count, 0)}{' '}
                  {t('trades', 'ไม้')}
                </small>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="calendar-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((s, i) => (
              <span key={s}>
                {t(s, ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][i])}
              </span>
            ))}
          </div>
          <div
            className={`calendar-grid ${view === 'week' ? 'week-view' : ''}`}
          >
            {days.map((d) => {
              const key = dateKey(d),
                v = daily[key];
              return (
                <button
                  key={key}
                  className={`calendar-day ${d.getMonth() !== m && view === 'month' ? 'outside' : ''} ${v ? (v.pnl >= 0 ? 'win-day' : 'loss-day') : ''} ${key === dateKey(new Date()) ? 'today' : ''}`}
                  aria-label={`${key}, ${v?.count ?? 0} trades, ${money(v?.pnl ?? 0)}`}
                  onClick={() => setDay(key)}
                >
                  <span>{d.getDate()}</span>
                  {v && (
                    <>
                      <strong>{money(v.pnl)}</strong>
                      <small>
                        {v.count} {t('trades', 'ไม้')}
                      </small>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
      <p className="table-foot">
        {t(
          'Select a day to review its trades. Week begins Monday. Trade dates use your recorded journal date.',
          'เลือกวันเพื่อทบทวนการเทรด สัปดาห์เริ่มวันจันทร์ วันที่อ้างอิงจากที่บันทึกไว้',
        )}
      </p>
      <Dialog
        open={!!day}
        onOpenChange={(open) => {
          if (!open) setDay('');
        }}
      >
        <DialogContent className="trade-dialog">
          <DialogTitle>{day}</DialogTitle>
          <DialogDescription>
            {t('Trades recorded on this day', 'รายการที่บันทึกในวันนี้')}
          </DialogDescription>
          <TradeTable
            trades={trades.filter((tr) => tr.date === day)}
            t={t}
            onView={(tr) => {
              setDay('');
              onView(tr);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function RiskCalculator({
  capital,
  t,
}: {
  capital: number;
  t: Translate;
}) {
  const [asset, setAsset] = useState<keyof typeof assets>('XAUUSD');
  const [v, setV] = useState<RiskInput>({
    balance: capital,
    percent: 1,
    entry: 2500,
    stop: 2490,
    ...assets.XAUUSD,
    costPerUnit: 0,
    max: 100,
  });
  const set = (key: keyof RiskInput, n: number) => setV({ ...v, [key]: n });
  let result: ReturnType<typeof sizePosition> | null = null,
    error = '';
  try {
    result = sizePosition(v);
  } catch {
    error = t(
      'Enter valid values. Entry and stop must be different.',
      'ตรวจสอบตัวเลข ราคาเข้าและจุดตัดขาดทุนต้องต่างกัน',
    );
  }
  return (
    <div className="risk-layout">
      <div className="panel">
        <span className="overline">{t('BEFORE THE ENTRY', 'ก่อนเข้าเทรด')}</span>
        <h2>{t('Make the risk intentional.', 'กำหนดความเสี่ยงอย่างตั้งใจ')}</h2>
        <p className="muted-copy">
          {t(
            'Size the position around the capital you choose to risk.',
            'คำนวณขนาดสัญญาจากเงินที่คุณยอมเสี่ยง',
          )}
        </p>
        <div className="form-grid mt-6">
          <label className="form-field full">
            <span>{t('Instrument', 'สินทรัพย์')}</span>
            <Pick
              label="Instrument"
              value={asset}
              onChange={(a) => {
                const next = a as keyof typeof assets;
                setAsset(next);
                setV({
                  ...v,
                  ...assets[next],
                  entry:
                    next.includes('USD') &&
                    next !== 'XAUUSD' &&
                    next !== 'BTCUSD'
                      ? 1.08
                      : 100,
                  stop:
                    next.includes('USD') &&
                    next !== 'XAUUSD' &&
                    next !== 'BTCUSD'
                      ? 1.075
                      : 95,
                });
              }}
              options={Object.entries(assets).map(([key, a]) => ({
                value: key,
                label: a.label,
              }))}
            />
          </label>
          {(
            [
              ['balance', 'Account equity (USD)', 'มูลค่าบัญชี (USD)'],
              ['percent', 'Risk per trade (%)', 'ความเสี่ยงต่อไม้ (%)'],
              ['entry', 'Entry price', 'ราคาเข้า'],
              ['stop', 'Stop loss', 'จุดตัดขาดทุน'],
            ] as const
          ).map(([k, en, th]) => (
            <Field
              key={k}
              label={t(en, th)}
              type="number"
              step="any"
              value={v[k]}
              onChange={(e) => set(k, Number(e.target.value))}
            />
          ))}
          <div className="full form-divider">
            {t('CONTRACT SPECIFICATIONS', 'สเปกสัญญา')}
          </div>
          {(
            [
              ['tickSize', 'Tick size', 'ขนาด Tick'],
              [
                'tickValue',
                'Tick value / unit (USD)',
                'มูลค่า Tick ต่อหน่วย (USD)',
              ],
              ['step', 'Volume step', 'ขั้นขนาดสัญญา'],
              ['min', 'Minimum size', 'ขนาดขั้นต่ำ'],
              ['max', 'Maximum size', 'ขนาดสูงสุด'],
              ['costPerUnit', 'Costs per unit (USD)', 'ต้นทุนต่อหน่วย (USD)'],
            ] as const
          ).map(([k, en, th]) => (
            <Field
              key={k}
              label={t(en, th)}
              type="number"
              step="any"
              value={v[k]}
              onChange={(e) => set(k, Number(e.target.value))}
            />
          ))}
        </div>
      </div>
      <div className="panel risk-result">
        <ShieldCheck size={36} strokeWidth={1.2} />
        <span className="overline">
          {t('YOUR POSITION PLAN', 'แผนขนาดสัญญา')}
        </span>
        <h2>
          {result
            ? result.quantity.toLocaleString('en-US', {
                maximumFractionDigits: 8,
              })
            : '—'}
        </h2>
        <span>{assets[asset].unit}</span>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
        <div className="risk-lines">
          <div>
            <span>{t('Risk budget', 'งบความเสี่ยง')}</span>
            <b>{result ? money(result.budget) : '—'}</b>
          </div>
          <div>
            <span>{t('Estimated risk', 'ความเสี่ยงตามแผน')}</span>
            <b className="positive">
              {result ? money(result.estimatedRisk) : '—'}
            </b>
          </div>
          <div>
            <span>{t('Unused budget', 'งบที่เหลือ')}</span>
            <b>{result ? money(result.unused) : '—'}</b>
          </div>
        </div>
        {result?.quantity === 0 && (
          <div className="notice">
            {t(
              'Minimum size exceeds your budget. Do not place this position.',
              'ขนาดขั้นต่ำเกินงบความเสี่ยง ไม่ควรเปิดสถานะนี้',
            )}
          </div>
        )}
        <p>
          {t(
            'Size is rounded down so modeled risk stays within your budget. Defaults are examples: verify tick value, contract size and currency conversion with your broker.',
            'ปัดขนาดลงเพื่อให้ความเสี่ยงตามสูตรไม่เกินงบ ค่าเริ่มต้นเป็นตัวอย่าง โปรดตรวจสอบมูลค่า Tick ขนาดสัญญา และอัตราแลกเปลี่ยนกับโบรกเกอร์',
          )}
        </p>
        <small>
          {t(
            'Gaps, slippage and changing fees can make actual losses exceed planned risk.',
            'ราคาเปิดกระโดด สลิปเพจ และค่าธรรมเนียมที่เปลี่ยนไป อาจทำให้ขาดทุนจริงเกินแผน',
          )}
        </small>
      </div>
    </div>
  );
}
