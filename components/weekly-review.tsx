'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { isTradeReviewed, money, net, type Trade } from '@/lib/domain';
import type { Translate } from './workspace-ui';
import { TradeTable } from './workspace-ui';

const day = (value: string) => new Date(`${value}T12:00:00`);
const key = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const move = (value: Date, days: number) => {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
};
const weekOf = (value: string) => {
  const selected = day(value);
  const monday = move(selected, -((selected.getDay() + 6) % 7));
  return { from: key(monday), to: key(move(monday, 6)) };
};

export default function WeeklyReview({
  trades,
  t,
  onView,
}: {
  trades: Trade[];
  t: Translate;
  onView: (trade: Trade) => void;
}) {
  const latest = [...trades].sort((a, b) => b.date.localeCompare(a.date))[0]
    ?.date;
  const [anchor, setAnchor] = useState(latest || key(new Date()));
  const range = weekOf(anchor);
  const rows = useMemo(
    () =>
      trades
        .filter(
          (trade) =>
            trade.status === 'CLOSED' &&
            trade.date >= range.from &&
            trade.date <= range.to,
        )
        .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [trades, range.from, range.to],
  );
  const pnl = rows.reduce((sum, trade) => sum + net(trade), 0);
  const wins = rows.filter((trade) => net(trade) > 0).length;
  const reviewed = rows.filter(isTradeReviewed);
  const followed = reviewed.filter((trade) => trade.adherence === 'yes');
  const riskRows = rows.filter((trade) => trade.risk > 0);
  const averageR = riskRows.length
    ? riskRows.reduce((sum, trade) => sum + net(trade) / trade.risk, 0) /
      riskRows.length
    : null;
  const missed = new Map<string, number>();
  for (const trade of reviewed)
    for (const item of trade.review?.checklist || [])
      if (item.answer === 'no')
        missed.set(item.text, (missed.get(item.text) || 0) + 1);
  const mainMiss = [...missed].sort((a, b) => b[1] - a[1])[0];
  const setups = new Map<string, { count: number; pnl: number }>();
  for (const trade of rows) {
    const name = trade.setup || t('No setup', 'ยังไม่ระบุเทคนิค');
    const current = setups.get(name) || { count: 0, pnl: 0 };
    setups.set(name, {
      count: current.count + 1,
      pnl: current.pnl + net(trade),
    });
  }
  const bestSetup = [...setups].sort((a, b) => b[1].pnl - a[1].pnl)[0];
  const shift = (days: number) => setAnchor(key(move(day(anchor), days)));

  return (
    <section className="weekly-review panel">
      <div className="weekly-review-head">
        <div>
          <span className="overline">
            {t('WEEKLY REVIEW', 'ทบทวนประจำสัปดาห์')}
          </span>
          <h2>
            {t(
              'Turn the week into a clearer next step',
              'เปลี่ยนหนึ่งสัปดาห์ให้เป็นก้าวต่อไปที่ชัดเจน',
            )}
          </h2>
          <p>
            {range.from} — {range.to}
          </p>
        </div>
        <div className="week-picker">
          <button
            className="button ghost compact"
            aria-label={t('Previous week', 'สัปดาห์ก่อน')}
            onClick={() => shift(-7)}
          >
            <ChevronLeft size={18} />
          </button>
          <input
            aria-label={t('Choose a week', 'เลือกสัปดาห์')}
            type="date"
            value={anchor}
            onChange={(event) => setAnchor(event.target.value)}
          />
          <button
            className="button ghost compact"
            aria-label={t('Next week', 'สัปดาห์ถัดไป')}
            onClick={() => shift(7)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {!rows.length ? (
        <div className="weekly-review-empty">
          <Target size={32} />
          <h3>{t('No closed trades this week', 'สัปดาห์นี้ยังไม่มีเทรดที่ปิดแล้ว')}</h3>
          <p>
            {t(
              'Choose another week or record a closed trade to begin the review.',
              'เลือกสัปดาห์อื่น หรือบันทึกเทรดที่ปิดแล้วเพื่อเริ่มทบทวน',
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="weekly-score-grid">
            <div>
              <span>{t('Net P&L', 'กำไรสุทธิ')}</span>
              <strong className={pnl >= 0 ? 'positive' : 'negative'}>
                {money(pnl)}
              </strong>
              <small>
                {rows.length} {t('closed trades', 'เทรดที่ปิดแล้ว')}
              </small>
            </div>
            <div>
              <span>{t('Win rate', 'อัตราชนะ')}</span>
              <strong>{((wins / rows.length) * 100).toFixed(1)}%</strong>
              <small>
                {wins}/{rows.length} {t('profitable trades', 'เทรดที่กำไร')}
              </small>
            </div>
            <div>
              <span>{t('Average R', 'R เฉลี่ย')}</span>
              <strong>
                {averageR === null ? '—' : `${averageR.toFixed(2)}R`}
              </strong>
              <small>
                {riskRows.length}/{rows.length}{' '}
                {t('with recorded risk', 'ไม้ที่ระบุความเสี่ยง')}
              </small>
            </div>
            <div>
              <span>{t('Review completion', 'ทบทวนครบ')}</span>
              <strong>
                {((reviewed.length / rows.length) * 100).toFixed(0)}%
              </strong>
              <small>
                {reviewed.length}/{rows.length} {t('reviewed', 'รายการ')}
              </small>
            </div>
          </div>

          <div className="weekly-insight-grid">
            <article>
              <span className="weekly-insight-label">
                {t('WHAT WORKED', 'สิ่งที่ทำได้ดี')}
              </span>
              <h3>
                {bestSetup && bestSetup[1].pnl > 0
                  ? bestSetup[0]
                  : t('No setup finished positive', 'ยังไม่มีเทคนิคที่จบเป็นบวก')}
              </h3>
              <p>
                {bestSetup && bestSetup[1].pnl > 0
                  ? t(
                      `${bestSetup[1].count} trades contributed ${money(bestSetup[1].pnl)} this week. Treat this as a review clue, not proof of an edge.`,
                      `${bestSetup[1].count} เทรดสร้างผลรวม ${money(bestSetup[1].pnl)} ในสัปดาห์นี้ ใช้เป็นเบาะแสในการทบทวน ไม่ใช่ข้อยืนยันว่าเป็นความได้เปรียบ`,
                    )
                  : t(
                      'Review execution and market context before changing the Playbook from one week of results.',
                      'ทบทวนการทำตามแผนและสภาวะตลาดก่อนเปลี่ยน Playbook จากผลเพียงหนึ่งสัปดาห์',
                    )}
              </p>
            </article>
            <article>
              <span className="weekly-insight-label">
                {t('DISCIPLINE', 'วินัย')}
              </span>
              <h3>
                {reviewed.length
                  ? `${followed.length}/${reviewed.length} ${t('followed plan', 'เทรดตามแผน')}`
                  : t('Review needed', 'ควรเริ่มทบทวน')}
              </h3>
              <p>
                {reviewed.length
                  ? t(
                      'Based only on trades with a completed review.',
                      'คำนวณจากเทรดที่ทบทวนเสร็จแล้วเท่านั้น',
                    )
                  : t(
                      'Complete each trade review so Tradovia can separate results from execution quality.',
                      'ทบทวนแต่ละเทรดให้ครบ เพื่อแยกผลลัพธ์ออกจากคุณภาพการทำตามแผน',
                    )}
              </p>
            </article>
            <article className="weekly-focus-card">
              <span className="weekly-insight-label">
                {t('NEXT WEEK FOCUS', 'โฟกัสสัปดาห์หน้า')}
              </span>
              <h3>
                {mainMiss
                  ? mainMiss[0]
                  : reviewed.length < rows.length
                    ? t('Finish pending reviews', 'ทบทวนรายการที่ยังค้าง')
                    : t(
                        'Keep the process consistent',
                        'รักษากระบวนการให้สม่ำเสมอ',
                      )}
              </h3>
              <p>
                {mainMiss
                  ? t(
                      `Missed in ${mainMiss[1]} reviewed trades. Put this check before execution next week.`,
                      `พบว่าไม่ผ่านใน ${mainMiss[1]} เทรดที่ทบทวนแล้ว ลองวางข้อนี้ไว้ก่อนตัดสินใจเข้าเทรดในสัปดาห์หน้า`,
                    )
                  : reviewed.length < rows.length
                    ? t(
                        `${rows.length - reviewed.length} trades still need a review before drawing a stronger conclusion.`,
                        `ยังมี ${rows.length - reviewed.length} เทรดที่ควรทบทวนก่อนสรุปให้ชัดขึ้น`,
                      )
                    : t(
                        'The recorded process has no repeated missed checklist item this week.',
                        'สัปดาห์นี้ยังไม่พบข้อในเช็กลิสต์ที่พลาดซ้ำจากข้อมูลที่บันทึก',
                      )}
              </p>
            </article>
          </div>

          <div className="weekly-source">
            <div>
              <h3>{t('Trades behind this review', 'รายการเทรดที่ใช้สรุป')}</h3>
              <p>
                {t(
                  'Open any row to revisit the plan, reflection and chart evidence.',
                  'กดแต่ละรายการเพื่อย้อนดูแผน บันทึกทบทวน และภาพกราฟ',
                )}
              </p>
            </div>
            <TradeTable trades={rows} t={t} onView={onView} />
          </div>
        </>
      )}
    </section>
  );
}
