'use client';
import { useState } from 'react';
import { Check, ChevronRight, Moon, Target, X } from 'lucide-react';
import type { DailyCheckin as DailyCheckinData } from '@/lib/daily-checkin';
import type { Playbook } from '@/lib/domain';
import type { Translate } from './workspace-ui';

const focusLabels = {
  setup: ['Wait for my setup', 'รอจังหวะตามแผน'],
  risk: ['Respect my risk', 'รักษาความเสี่ยง'],
  review: ['Review before entry', 'ทบทวนก่อนเข้า'],
} as const;
const reasonLabels = {
  'no-setup': ['No clear setup', 'ยังไม่มีจังหวะที่ชัด'],
  'risk-limit': ['Risk limit reached', 'ถึงขีดจำกัดความเสี่ยง'],
  news: ['News or volatility', 'ข่าวหรือความผันผวน'],
  rest: ['Taking a break', 'ตั้งใจพัก'],
} as const;

export default function DailyCheckin({
  today,
  checkin,
  playbooks,
  hasTradesToday,
  busy,
  t,
  save,
}: {
  today: string;
  checkin?: DailyCheckinData;
  playbooks: Playbook[];
  hasTradesToday: boolean;
  busy: boolean;
  t: Translate;
  save: (value: unknown) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<'plan' | 'rest'>('plan');
  const [focus, setFocus] =
    useState<NonNullable<DailyCheckinData['focus']>>('setup');
  const [reason, setReason] =
    useState<NonNullable<DailyCheckinData['reason']>>('no-setup');
  const [playbookId, setPlaybookId] = useState('');
  const [maxLoss, setMaxLoss] = useState('');
  const [note, setNote] = useState('');
  const label = (pair: readonly [string, string]) => t(pair[0], pair[1]);
  const current =
    checkin?.date === today && !(checkin.kind === 'rest' && hasTradesToday)
      ? checkin
      : undefined;
  const invalidLoss =
    kind === 'plan' &&
    maxLoss !== '' &&
    (!Number.isFinite(Number(maxLoss)) ||
      Number(maxLoss) <= 0 ||
      Number(maxLoss) > 1e7);
  const open = (nextKind: 'plan' | 'rest') => {
    setKind(nextKind);
    setFocus(current?.focus || 'setup');
    setReason(current?.reason || 'no-setup');
    setPlaybookId(current?.playbookId || '');
    setMaxLoss(current?.maxLoss ? String(current.maxLoss) : '');
    setNote(current?.note || '');
    setEditing(true);
  };
  const submit = async () => {
    const value =
      kind === 'plan'
        ? {
            kind,
            focus,
            playbookId,
            maxLoss: maxLoss ? Number(maxLoss) : undefined,
            note,
          }
        : { kind, reason, note };
    if (await save(value)) setEditing(false);
  };
  const planName = playbooks.find(
    (plan) => plan.id === current?.playbookId,
  )?.name;
  return (
    <section
      className="daily-checkin"
      aria-label={t('Daily decision', 'การตัดสินใจวันนี้')}
    >
      <div className="daily-checkin-heading">
        <span className="daily-checkin-icon">
          {current?.kind === 'rest' ? <Moon size={19} /> : <Target size={19} />}
        </span>
        <div>
          <span className="overline">{t('BEFORE THE MARKET', 'ก่อนเริ่มวัน')}</span>
          <h3>
            {editing
              ? t('Choose your direction', 'เลือกแนวทางของวันนี้')
              : current
                ? current.kind === 'rest'
                  ? t('A deliberate day off', 'วันนี้เลือกพักอย่างตั้งใจ')
                  : t('Your focus today', 'สิ่งที่โฟกัสวันนี้')
                : t('What matters today?', 'วันนี้จะยึดอะไรเป็นหลัก?')}
          </h3>
        </div>
        {current && !editing && (
          <button
            className="daily-checkin-edit"
            onClick={() => open(current.kind)}
            aria-label={t('Edit today’s decision', 'แก้ไขการตัดสินใจวันนี้')}
          >
            {t('Edit', 'แก้ไข')}
          </button>
        )}
      </div>
      {!editing && current && (
        <div className="daily-checkin-summary">
          <p>
            {current.kind === 'rest'
              ? label(reasonLabels[current.reason || 'rest'])
              : label(focusLabels[current.focus || 'setup'])}
          </p>
          {current.kind === 'plan' && (planName || current.maxLoss) && (
            <small>
              {[
                planName,
                current.maxLoss
                  ? `${t('Daily loss limit', 'ขาดทุนสูงสุดวันนี้')} $${current.maxLoss.toLocaleString()}`
                  : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </small>
          )}
          {current.note && <small>{current.note}</small>}
          <span className="daily-checkin-confirm">
            <Check size={14} />
            {t('Saved for today', 'บันทึกไว้สำหรับวันนี้แล้ว')}
          </span>
        </div>
      )}
      {!editing && !current && (
        <>
          <p className="daily-checkin-intro">
            {t(
              'A small intention before trading makes the next decision easier.',
              'ตั้งหลักสั้น ๆ ก่อนเทรด ช่วยให้การตัดสินใจครั้งต่อไปง่ายขึ้น',
            )}
          </p>
          <div className="daily-checkin-actions">
            <button
              className="daily-checkin-primary"
              onClick={() => open('plan')}
            >
              <Target size={17} />
              {t('Set today’s focus', 'ตั้งโฟกัสวันนี้')}
              <ChevronRight size={17} />
            </button>
            {!hasTradesToday && (
              <button onClick={() => open('rest')}>
                <Moon size={17} />
                {t('No trade today', 'วันนี้ไม่เทรด')}
              </button>
            )}
          </div>
        </>
      )}
      {editing && (
        <div className="daily-checkin-form">
          <fieldset
            className="daily-checkin-switch"
            aria-label={t('Decision type', 'ประเภทการตัดสินใจ')}
          >
            <button
              className={kind === 'plan' ? 'selected' : ''}
              onClick={() => setKind('plan')}
              aria-pressed={kind === 'plan'}
            >
              {t('Trading plan', 'วางแผนเทรด')}
            </button>
            {!hasTradesToday && (
              <button
                className={kind === 'rest' ? 'selected' : ''}
                onClick={() => setKind('rest')}
                aria-pressed={kind === 'rest'}
              >
                {t('No-trade day', 'วันไม่เทรด')}
              </button>
            )}
          </fieldset>
          <span className="daily-checkin-label">
            {kind === 'plan'
              ? t('Choose one focus', 'เลือกสิ่งสำคัญหนึ่งข้อ')
              : t('Why pause today?', 'วันนี้พักเพราะอะไร?')}
          </span>
          <div className="daily-checkin-choices">
            {kind === 'plan'
              ? (Object.keys(focusLabels) as (keyof typeof focusLabels)[]).map(
                  (key) => (
                    <button
                      key={key}
                      className={focus === key ? 'selected' : ''}
                      onClick={() => setFocus(key)}
                      aria-pressed={focus === key}
                    >
                      {label(focusLabels[key])}
                    </button>
                  ),
                )
              : (
                  Object.keys(reasonLabels) as (keyof typeof reasonLabels)[]
                ).map((key) => (
                  <button
                    key={key}
                    className={reason === key ? 'selected' : ''}
                    onClick={() => setReason(key)}
                    aria-pressed={reason === key}
                  >
                    {label(reasonLabels[key])}
                  </button>
                ))}
          </div>
          {kind === 'plan' && (
            <div className="daily-checkin-fields">
              {playbooks.length > 0 && (
                <label>
                  {t('Playbook (optional)', 'แผนการเทรด (ไม่บังคับ)')}
                  <select
                    value={playbookId}
                    onChange={(event) => setPlaybookId(event.target.value)}
                  >
                    <option value="">
                      {t('No specific playbook', 'ไม่ระบุแผน')}
                    </option>
                    {playbooks
                      .filter((plan) => !plan.archived)
                      .map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label>
                {t(
                  'Daily loss limit in USD (optional)',
                  'ขาดทุนสูงสุดวันนี้ USD (ไม่บังคับ)',
                )}
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="10000000"
                  step="0.01"
                  value={maxLoss}
                  onChange={(event) => setMaxLoss(event.target.value)}
                  placeholder="100"
                  aria-invalid={invalidLoss}
                />
                {invalidLoss && (
                  <small className="daily-checkin-error">
                    {t(
                      'Enter an amount above $0 and below $10,000,000',
                      'ใส่จำนวนมากกว่า $0 และไม่เกิน $10,000,000',
                    )}
                  </small>
                )}
              </label>
            </div>
          )}
          <label className="daily-checkin-note">
            {t('A note to yourself (optional)', 'โน้ตถึงตัวเอง (ไม่บังคับ)')}
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={240}
              placeholder={t(
                'What will you remember?',
                'อยากเตือนตัวเองเรื่องอะไร?',
              )}
            />
          </label>
          <div className="daily-checkin-form-actions">
            <button onClick={() => setEditing(false)} disabled={busy}>
              <X size={17} />
              {t('Cancel', 'ยกเลิก')}
            </button>
            <button
              className="daily-checkin-primary"
              onClick={() => void submit()}
              disabled={busy || invalidLoss}
            >
              {busy
                ? t('Saving…', 'กำลังบันทึก…')
                : t('Save for today', 'บันทึกวันนี้')}
              <Check size={17} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
