'use client';
import { useEffect, useRef, useState } from 'react';
import {
  money,
  net,
  isTradeReviewed,
  type Trade,
  type Playbook,
} from '@/lib/domain';
import { ReviewFields, ReviewEvidence, emptyReview } from './review-fields';
import type { Translate } from './workspace-ui';

export default function QuickReview({
  trades,
  plans,
  t,
  save,
  onView,
  onOpenInsights,
  mode,
  openRequest = 0,
}: {
  trades: Trade[];
  plans: Playbook[];
  t: Translate;
  save: (trade: Trade) => Promise<boolean>;
  onView: (trade: Trade) => void;
  onOpenInsights: () => void;
  mode: string;
  openRequest?: number;
}) {
  const section = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(Boolean(openRequest)),
    [pendingOnly, setPendingOnly] = useState(true),
    [selected, setSelected] = useState(''),
    [busy, setBusy] = useState(false),
    [drafts, setDrafts] = useState<Record<string, Trade>>({}),
    [saved, setSaved] = useState('');
  useEffect(() => {
    if (!openRequest) return;
    queueMicrotask(() => setOpen(true));
    const frame = requestAnimationFrame(() =>
      section.current?.scrollIntoView({ block: 'start' }),
    );
    return () => cancelAnimationFrame(frame);
  }, [openRequest]);
  const closed = trades
    .filter((tr) => tr.status === 'CLOSED')
    .sort((a, b) =>
      (b.date + b.time + b.id).localeCompare(a.date + a.time + a.id),
    );
  const pending = closed.filter((tr) => !isTradeReviewed(tr));
  const queue = pendingOnly ? pending : closed;
  const current = queue.find((tr) => tr.id === selected) || queue[0];
  const next = () => {
    const index = queue.findIndex((tr) => tr.id === current?.id);
    setSelected(queue[(index + 1) % queue.length]?.id || '');
  };
  return (
    <section
      id="quick-review"
      ref={section}
      className="panel quick-review-panel"
      style={{ marginBottom: 20 }}
    >
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
      {saved && (
        <output className="review-saved">
          <span>{saved}</span>
          <button className="text-button" onClick={onOpenInsights}>
            {t('View insights', 'ดู Insights')}
          </button>
        </output>
      )}
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
                trade={drafts[current.id] || current}
                plans={plans}
                mode={mode}
                onDraft={(value) =>
                  setDrafts((prev) => ({ ...prev, [value.id]: value }))
                }
                onUploading={setBusy}
                t={t}
                busy={busy}
                onView={() => onView(current)}
                onSkip={next}
                save={async (value) => {
                  setBusy(true);
                  try {
                    const ok = await save(value);
                    if (ok) {
                      setDrafts((prev) => {
                        const remaining = { ...prev };
                        delete remaining[value.id];
                        return remaining;
                      });
                      setSaved(
                        t(
                          'Review saved. Ready for the next trade.',
                          'บันทึกการทบทวนแล้ว พร้อมดูรายการถัดไป',
                        ),
                      );
                      next();
                    }
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
                      'Your reflections are saved. Take a break or revisit a trade whenever you like.',
                      'บันทึกบทเรียนไว้แล้ว พักได้เลย หรือกลับมาดูรายการเดิมเมื่อพร้อม',
                    )
                  : t(
                      'Close a trade in your journal to start reviewing it here.',
                      'เมื่อมีเทรดที่ปิดแล้ว จะเริ่มทบทวนได้จากที่นี่',
                    )}
              </p>
              {closed.length > 0 && (
                <button
                  className="button ghost compact"
                  onClick={onOpenInsights}
                >
                  {t('See what your reviews reveal', 'ดูสิ่งที่การทบทวนบอกเรา')}
                </button>
              )}
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
  mode,
  onDraft,
  onUploading,
}: {
  trade: Trade;
  plans: Playbook[];
  t: Translate;
  busy: boolean;
  save: (trade: Trade) => Promise<boolean>;
  onSkip: () => void;
  onView: () => void;
  mode: string;
  onDraft: (trade: Trade) => void;
  onUploading: (busy: boolean) => void;
}) {
  const [error, setError] = useState('');
  const plan = trade.playbook,
    adherence = trade.adherence || '';
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
        {t('1. Which plan did you use?', '1. เทรดนี้ใช้แผนไหน?')}
        <select
          disabled={busy}
          value={plan?.id || (adherence === 'no' ? '__none' : '')}
          onChange={(e) => {
            const value: Trade = {
              ...trade,
              playbook: plans.find((p) => p.id === e.target.value),
              adherence: e.target.value === '__none' ? 'no' : '',
            };
            onDraft({
              ...value,
              review: {
                ...emptyReview(value),
                emotion: trade.review?.emotion || '',
                lesson: trade.review?.lesson || '',
              },
            });
            setError('');
          }}
        >
          <option value="">{t('Choose a plan', 'เลือกแผน')}</option>
          <option value="__none">
            {t('I traded without a plan', 'เทรดนี้ไม่ได้ใช้แผน')}
          </option>
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
            'Create a plan in Playbook, or record that you traded without a plan.',
            'สร้างแผนจากเมนูแผนการเทรด หรือระบุว่าเทรดนี้ไม่ได้ใช้แผน',
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
      <ReviewFields trade={trade} t={t} disabled={busy} onChange={onDraft} />
      <h3>
        {t('2. Overall, did you follow the plan?', '2. โดยรวมทำตามแผนหรือไม่?')}
      </h3>
      <div className="daily-options">
        {(['yes', 'partial', 'no'] as const).map((value, i) => (
          <button
            disabled={busy || !plan}
            key={value}
            aria-pressed={adherence === value}
            onClick={() => onDraft({ ...trade, adherence: value })}
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
      {!plan && adherence === 'no' && (
        <p className="journal-hint">
          {t(
            'Recorded as a trade without a plan. You can still reflect and learn from it.',
            'บันทึกว่าเทรดโดยไม่มีแผน คุณยังทบทวนและเรียนรู้จากเทรดนี้ได้',
          )}
        </p>
      )}
      <ReviewEvidence
        trade={trade}
        mode={mode}
        t={t}
        disabled={busy}
        onChange={onDraft}
        onUploading={onUploading}
      />
      <p className="journal-hint">
        {t(
          'Execution is already recorded. Skipping does not mark a trade reviewed. Unsaved answers stay while you remain on this journal page.',
          'ข้อมูลซื้อขายบันทึกไว้แล้ว การข้ามไม่นับว่าทบทวนแล้ว คำตอบที่ยังไม่บันทึกจะอยู่ระหว่างที่คุณอยู่ในหน้าบันทึกนี้',
        )}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="actions" style={{ flexWrap: 'wrap' }}>
        <button
          disabled={busy || !adherence}
          className="button ink"
          onClick={async () => {
            setError('');
            try {
              if (
                !(await save({
                  ...trade,
                  playbook: plan,
                  adherence,
                  review: {
                    ...(trade.review || emptyReview(trade)),
                    completedAt: new Date().toISOString(),
                  },
                }))
              )
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
