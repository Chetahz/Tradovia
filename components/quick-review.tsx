'use client';
import { useState } from 'react';
import { money, net, type Trade, type Playbook } from '@/lib/domain';
import type { Translate } from './workspace-ui';

export default function QuickReview({
  trades,
  plans,
  t,
  save,
  onView,
}: {
  trades: Trade[];
  plans: Playbook[];
  t: Translate;
  save: (trade: Trade) => Promise<boolean>;
  onView: (trade: Trade) => void;
}) {
  const [open, setOpen] = useState(false),
    [pendingOnly, setPendingOnly] = useState(true),
    [selected, setSelected] = useState(''),
    [busy, setBusy] = useState(false);
  const closed = trades
    .filter((tr) => tr.status === 'CLOSED')
    .sort((a, b) =>
      (b.date + b.time + b.id).localeCompare(a.date + a.time + a.id),
    );
  const pending = closed.filter((tr) => !tr.playbook || !tr.adherence);
  const queue = pendingOnly ? pending : closed;
  const current = queue.find((tr) => tr.id === selected) || queue[0];
  const next = () => {
    const index = queue.findIndex((tr) => tr.id === current?.id);
    setSelected(queue[(index + 1) % queue.length]?.id || '');
  };
  return (
    <section className="panel" style={{ marginBottom: 20 }}>
      <div className="section-heading">
        <div>
          <h2>{t('Quick review', 'ทบทวนด่วน')}</h2>
          <p className="journal-hint">
            {closed.length - pending.length}/{closed.length}{' '}
            {t(
              'closed trades reviewed in this portfolio',
              'เทรดที่ปิดแล้วในพอร์ตนี้ทบทวนแล้ว',
            )}{' '}
            · {pending.length} {t('remaining', 'รายการที่เหลือ')}
          </p>
        </div>
        <button
          disabled={busy}
          className="button ghost compact"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open
            ? t('Close review', 'ปิดการทบทวน')
            : t('Start reviewing', 'เริ่มทบทวน')}
        </button>
      </div>
      {open && (
        <>
          <label className="daily-check">
            <input
              disabled={busy}
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => {
                setPendingOnly(e.target.checked);
                setSelected('');
              }}
            />
            {t('Only unreviewed trades', 'เฉพาะเทรดที่ยังไม่ทบทวน')}
          </label>
          {current ? (
            <>
              <label className="daily-field">
                {t('Choose a trade', 'เลือกรายการ')}
                <select
                  disabled={busy}
                  value={current.id}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {queue.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.date} {tr.time} · {tr.symbol} · {money(net(tr))}
                    </option>
                  ))}
                </select>
              </label>
              <ReviewEntry
                key={`${current.id}:${current.playbook?.version || 0}:${current.adherence || ''}`}
                trade={current}
                plans={plans}
                t={t}
                busy={busy}
                onView={() => onView(current)}
                onSkip={next}
                save={async (value) => {
                  setBusy(true);
                  try {
                    const ok = await save(value);
                    if (ok) next();
                    return ok;
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </>
          ) : (
            <div className="guide-empty">
              <h3>
                {closed.length
                  ? t('All caught up', 'ทบทวนครบแล้ว')
                  : t('No closed trades yet', 'ยังไม่มีเทรดที่ปิดแล้ว')}
              </h3>
              <p className="journal-hint">
                {closed.length
                  ? t(
                      'Your reviews are available in Deep Analysis. No need to trade more to keep progress.',
                      'ดูผลการทบทวนต่อได้ใน Deep Analysis ไม่จำเป็นต้องเทรดเพิ่มเพื่อรักษาความคืบหน้า',
                    )
                  : t(
                      'Close a trade in your journal to start reviewing it here.',
                      'เมื่อมีเทรดที่ปิดแล้ว จะเริ่มทบทวนได้จากที่นี่',
                    )}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
function ReviewEntry({
  trade,
  plans,
  t,
  busy,
  save,
  onSkip,
  onView,
}: {
  trade: Trade;
  plans: Playbook[];
  t: Translate;
  busy: boolean;
  save: (trade: Trade) => Promise<boolean>;
  onSkip: () => void;
  onView: () => void;
}) {
  const [plan, setPlan] = useState<Playbook | undefined>(trade.playbook),
    [adherence, setAdherence] = useState<Trade['adherence']>(
      trade.adherence || '',
    ),
    [error, setError] = useState('');
  return (
    <div className="daily-card">
      <div className="section-heading">
        <h3>
          {trade.symbol} · {trade.side === 'LONG' ? 'Buy' : 'Sell'} ·{' '}
          {money(net(trade))}
        </h3>
        <button
          disabled={busy}
          className="button ghost compact"
          onClick={onView}
        >
          {t('View full details', 'ดูรายละเอียดเต็ม')}
        </button>
      </div>
      <p>
        {trade.date} · {trade.time} ·{' '}
        {t('Net result after fees', 'ผลสุทธิหลังหักค่าธรรมเนียม')}
      </p>
      <label className="daily-field">
        Playbook
        <select
          disabled={busy}
          value={plan?.id || ''}
          onChange={(e) => {
            setPlan(plans.find((p) => p.id === e.target.value));
            setAdherence('');
            setError('');
          }}
        >
          <option value="">{t('Choose a plan', 'เลือกแผน')}</option>
          {plan && (
            <option value={plan.id}>
              {plan.name} · v{plan.version}{' '}
              {t('(selected version)', '(เวอร์ชันที่เลือก)')}
            </option>
          )}
          {plans
            .filter((p) => !p.archived && p.id !== plan?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · v{p.version}
              </option>
            ))}
        </select>
      </label>
      {!plans.some((p) => !p.archived) && !plan && (
        <p>
          {t(
            'Create a Playbook first using the Playbook menu. You can skip this trade for now.',
            'สร้างแผนจากเมนูแผนการเทรดก่อน คุณข้ามรายการนี้ไว้ก่อนได้',
          )}
        </p>
      )}
      {plan && (
        <details>
          <summary>{t('Read the selected plan', 'อ่านแผนที่เลือก')}</summary>
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {[plan.entry, plan.exit, plan.risk, plan.checklist]
              .filter(Boolean)
              .join('\n\n')}
          </p>
        </details>
      )}
      <h3>{t('Did you follow the plan?', 'ทำตามแผนหรือไม่?')}</h3>
      <div className="daily-options">
        {(['yes', 'partial', 'no'] as const).map((value, i) => (
          <button
            disabled={busy || !plan}
            key={value}
            aria-pressed={adherence === value}
            onClick={() => setAdherence(value)}
          >
            {
              [
                t('Followed', 'ตามแผน'),
                t('Partly', 'บางส่วน'),
                t('Outside plan', 'นอกแผน'),
              ][i]
            }
          </button>
        ))}
      </div>
      <p className="journal-hint">
        {t(
          'Only plan and review fields change. Execution, notes and images stay as recorded. Skipping does not mark a trade reviewed.',
          'บันทึกเฉพาะแผนและผลทบทวน ข้อมูลซื้อขาย บันทึก และภาพยังคงเดิม การข้ามไม่นับว่าทบทวนแล้ว',
        )}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="actions" style={{ flexWrap: 'wrap' }}>
        <button
          disabled={busy || !plan || !adherence}
          className="button ink"
          onClick={async () => {
            setError('');
            try {
              if (!(await save({ ...trade, playbook: plan, adherence })))
                setError(
                  t(
                    'Could not save. Your choices are still here; please retry.',
                    'บันทึกไม่สำเร็จ ตัวเลือกยังอยู่ กรุณาลองอีกครั้ง',
                  ),
                );
            } catch {
              setError(
                t('Could not save. Please retry.', 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'),
              );
            }
          }}
        >
          {busy ? t('Saving…', 'กำลังบันทึก…') : t('Save & next', 'บันทึกและถัดไป')}
        </button>
        <button disabled={busy} className="button ghost" onClick={onSkip}>
          {t('Skip for now', 'ข้ามไว้ก่อน')}
        </button>
      </div>
    </div>
  );
}
