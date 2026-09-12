'use client';
import { useState } from 'react';
import { net, money, isTradeReviewed, type Trade } from '@/lib/domain';
import { TradeTable, type Translate } from './workspace-ui';

export default function DeepAnalysis({
  trades,
  t,
  onView,
}: {
  trades: Trade[];
  t: Translate;
  onView: (trade: Trade) => void;
}) {
  const [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [selection, setSelection] = useState<string | null>(null);
  const invalid = Boolean(from && to && from > to);
  const closed = invalid
    ? []
    : trades.filter(
        (tr) =>
          tr.status === 'CLOSED' &&
          (!from || tr.date >= from) &&
          (!to || tr.date <= to),
      );
  const dates = closed.map((tr) => tr.date).sort();
  const groups = new Map<string, { label: string; rows: Trade[] }>();
  for (const tr of closed) {
    const key = tr.playbook
      ? `plan:${tr.playbook.id}:${tr.playbook.version}`
      : 'unassigned';
    const group = groups.get(key) || {
      label: tr.playbook
        ? `${tr.playbook.name} · v${tr.playbook.version}`
        : t('No Playbook', 'ยังไม่ระบุ Playbook'),
      rows: [],
    };
    group.rows.push(tr);
    groups.set(key, group);
  }
  const adherence = [
    ['yes', t('Followed', 'ตามแผน')],
    ['partial', t('Partly', 'บางส่วน')],
    ['no', t('Outside plan', 'นอกแผน')],
    ['unknown', t('Unreviewed', 'ยังไม่ทบทวน')],
  ];
  const behavior = adherence.map(([key, label]) => ({
    key: `behavior:${key}`,
    label,
    rows: closed.filter((tr) =>
      key === 'unknown'
        ? !isTradeReviewed(tr)
        : isTradeReviewed(tr) && tr.adherence === key,
    ),
  }));
  const summarize = (rows: Trade[]) => {
    const validR = rows.filter((tr) => Number.isFinite(tr.risk) && tr.risk > 0);
    return {
      pnl: rows.reduce((sum, tr) => sum + net(tr), 0),
      wins: rows.filter((tr) => net(tr) > 0).length,
      r: validR.length
        ? validR.reduce((sum, tr) => sum + net(tr) / tr.risk, 0) / validR.length
        : null,
      rCount: validR.length,
    };
  };
  const compared = behavior.slice(0, 3).filter((g) => g.rows.length > 0);
  const followed = summarize(behavior[0].rows),
    outside = summarize(behavior[2].rows);
  const selected = selection?.startsWith('behavior:')
    ? behavior.find((g) => g.key === selection)
    : selection
      ? groups.get(selection)
      : undefined;
  const table = (rows: { key: string; label: string; rows: Trade[] }[]) => (
    <div style={{ overflowX: 'auto' }}>
      <table className="deep-table">
        <thead>
          <tr>
            {[
              t('Group', 'กลุ่ม'),
              t('Closed', 'ปิดแล้ว'),
              t('Net P&L', 'กำไรสุทธิ'),
              t('Win rate', 'อัตราชนะ'),
              t('Average R', 'R เฉลี่ย'),
              t('Trades with risk', 'ไม้ที่มีความเสี่ยง'),
            ].map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => {
            const s = summarize(g.rows);
            return (
              <tr key={g.key}>
                <td>
                  <button
                    className="button ghost compact"
                    disabled={!g.rows.length}
                    onClick={() => setSelection(g.key)}
                  >
                    {g.label} ↗
                  </button>
                </td>
                <td>{g.rows.length}</td>
                <td>{g.rows.length ? money(s.pnl) : '—'}</td>
                <td>
                  {g.rows.length
                    ? `${((s.wins / g.rows.length) * 100).toFixed(1)}%`
                    : '—'}
                </td>
                <td>{s.r === null ? '—' : `${s.r.toFixed(2)}R`}</td>
                <td>
                  {s.rCount}/{g.rows.length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  return (
    <section className="panel">
      <h2>Deep Analysis / Insights</h2>
      <p className="journal-hint">
        {t(
          'Closed trades in your selected portfolio. Plan versions stay separate so changed rules are not silently combined.',
          'ใช้เทรดที่ปิดแล้วในพอร์ตที่เลือก แยกเวอร์ชันแผนเพื่อไม่รวมกฎที่เปลี่ยนไปโดยไม่แจ้ง',
        )}
      </p>
      <div className="actions" style={{ flexWrap: 'wrap', margin: '20px 0' }}>
        <label>
          {t('From', 'ตั้งแต่')}{' '}
          <input
            aria-label={t('From date', 'วันที่เริ่มต้น')}
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setSelection(null);
            }}
          />
        </label>
        <label>
          {t('To', 'ถึง')}{' '}
          <input
            aria-label={t('To date', 'วันที่สิ้นสุด')}
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setSelection(null);
            }}
          />
        </label>
        <button
          className="button ghost compact"
          onClick={() => {
            setFrom('');
            setTo('');
            setSelection(null);
          }}
        >
          {t('All dates', 'ทุกวันที่')}
        </button>
      </div>
      {invalid && (
        <p role="alert">
          {t(
            'End date must not precede start date.',
            'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น',
          )}
        </p>
      )}
      <p className="journal-hint">
        {closed.length} {t('closed trades', 'เทรดที่ปิดแล้ว')} ·{' '}
        {dates.length
          ? `${dates[0]} — ${dates[dates.length - 1]}`
          : t('No data in this period', 'ยังไม่มีข้อมูลในช่วงนี้')}
      </p>
      <div className="daily-card">
        <h3>{t('What the data shows', 'สิ่งที่เห็นจากข้อมูล')}</h3>
        {!closed.length ? (
          <p>
            {t(
              'Record or select closed trades to begin. No example results are substituted here.',
              'บันทึกเทรดที่ปิดแล้วหรือเลือกช่วงที่มีข้อมูลเพื่อเริ่มวิเคราะห์ หน้านี้ไม่ใส่ผลตัวอย่างแทนข้อมูลที่ขาด',
            )}
          </p>
        ) : (
          <>
            <p>
              {t(
                `${closed.length - behavior[3].rows.length} of ${closed.length} trades have a plan and review. ${behavior[3].rows.length} remain unclassified.`,
                `มีแผนและการทบทวน ${closed.length - behavior[3].rows.length} จาก ${closed.length} รายการ อีก ${behavior[3].rows.length} รายการยังไม่จัดกลุ่มพฤติกรรม`,
              )}
            </p>
            {followed.r !== null && outside.r !== null ? (
              <p>
                {t(
                  `Followed-plan trades average ${followed.r.toFixed(2)}R (${followed.rCount} trades with risk); outside-plan trades average ${outside.r.toFixed(2)}R (${outside.rCount} trades with risk).`,
                  `เทรดตามแผนมี R เฉลี่ย ${followed.r.toFixed(2)}R (${followed.rCount} ไม้ที่ระบุความเสี่ยง) เทียบกับนอกแผน ${outside.r.toFixed(2)}R (${outside.rCount} ไม้ที่ระบุความเสี่ยง)`,
                )}
              </p>
            ) : (
              <p>
                {t(
                  'Comparing average R needs trades with recorded positive risk in both followed-plan and outside-plan groups.',
                  'การเปรียบเทียบ R ต้องมีเทรดที่ระบุความเสี่ยงมากกว่าศูนย์ ทั้งกลุ่มตามแผนและนอกแผน',
                )}
              </p>
            )}
            <p>
              {compared.some((g) => g.rows.length < 20) || compared.length < 2
                ? t(
                    'Limited comparison data. The 20-trade marker is a review reminder, not a statistical confidence threshold.',
                    'ข้อมูลเปรียบเทียบยังจำกัด เกณฑ์เตือน 20 ไม้เป็นตัวช่วยทบทวน ไม่ใช่เกณฑ์ยืนยันความน่าเชื่อถือทางสถิติ',
                  )
                : t(
                    'These are historical descriptions, not proof of an edge.',
                    'ตัวเลขนี้อธิบายประวัติ ไม่ใช่การยืนยันความได้เปรียบ',
                  )}{' '}
              {t(
                'Differences may reflect instruments, market conditions or risk. They do not establish cause or predict future results.',
                'ความต่างอาจมาจากสินทรัพย์ สภาวะตลาด หรือความเสี่ยง ไม่ได้ยืนยันสาเหตุหรือทำนายผลอนาคต',
              )}
            </p>
          </>
        )}
      </div>
      <h3 className="journal-section-title">
        {t('By Playbook version', 'เปรียบเทียบตามเวอร์ชัน Playbook')}
      </h3>
      {table([...groups].map(([key, g]) => ({ key, ...g })))}
      <h3 className="journal-section-title">
        {t('Plan adherence', 'การทำตามแผน')}
      </h3>
      {table(behavior)}
      <p className="journal-hint">
        {t(
          'Win rate uses every closed trade; breakeven trades are not wins. Average R uses net P&L ÷ recorded planned risk and excludes missing or zero risk.',
          'อัตราชนะใช้ทุกเทรดที่ปิดแล้ว เทรดเท่าทุนไม่นับเป็นชนะ R เฉลี่ยใช้กำไรสุทธิ ÷ ความเสี่ยงที่บันทึก และไม่รวมไม้ที่ไม่มีความเสี่ยงหรือเป็นศูนย์',
        )}
      </p>
      {selected && (
        <div className="daily-reflection">
          <div className="section-heading">
            <h3>
              {selected.label} · {selected.rows.length}
            </h3>
            <button
              className="button ghost compact"
              onClick={() => setSelection(null)}
            >
              {t('Close list', 'ปิดรายการ')}
            </button>
          </div>
          <TradeTable trades={selected.rows} t={t} onView={onView} />
        </div>
      )}
    </section>
  );
}
