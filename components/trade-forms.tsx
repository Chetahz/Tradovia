'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  BookOpen,
  ChevronDown,
  Plus,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { ReviewEvidence, ReviewFields, emptyReview } from './review-fields';
import { Field, Pick, type Translate } from '@/components/workspace-ui';
import {
  validateTrade,
  net,
  money,
  type Trade,
  type Playbook,
  type Account,
  type WorkspaceData,
} from '@/lib/domain';
import { relevantReviewedLesson } from '@/lib/daily-companion';

const tradeError = (message: string, t: Translate) => {
  const translations: Record<string, string> = {
    'Invalid symbol': 'กรอกชื่อสินทรัพย์ด้วยตัวอักษรหรือตัวเลข เช่น XAUUSD',
    'Invalid date or time': 'ตรวจวันที่และเวลาให้ถูกต้อง',
    'Entry and size must be positive': 'ราคาเข้าและขนาด Lot ต้องมากกว่า 0',
    'Stop loss must be on the loss side of entry':
      'Stop loss ต้องอยู่ด้านขาดทุนของราคาเข้า',
    'Target must be on the profit side of entry':
      'Take profit ต้องอยู่ด้านกำไรของราคาเข้า',
    'Invalid direction or status': 'ตรวจทิศทางและสถานะการเทรด',
  };
  return t(message, translations[message] || 'ตรวจข้อมูลที่กรอกแล้วลองอีกครั้ง');
};

const primarySymbols = [
  ['XAUUSD', 'Gold'],
  ['EURUSD', 'Euro'],
  ['GBPUSD', 'Pound'],
  ['USDJPY', 'Yen'],
  ['US30', 'Dow'],
  ['NAS100', 'Nasdaq'],
  ['BTCUSD', 'Bitcoin'],
] as const;

function DecimalField({
  label,
  value,
  onValueChange,
  required,
  allowNegative = false,
  blankZero = false,
  presets = [],
  className = '',
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  required?: boolean;
  allowNegative?: boolean;
  blankZero?: boolean;
  presets?: number[];
  className?: string;
}) {
  const [draft, setDraft] = useState(
    value === 0 && blankZero ? '' : String(value),
  );
  const pattern = allowNegative ? /^-?\d*(?:\.\d*)?$/ : /^\d*(?:\.\d*)?$/;
  return (
    <label className={`form-field ${className}`.trim()}>
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        required={required}
        value={draft}
        onChange={(event) => {
          const next = event.target.value.replace(',', '.');
          if (!pattern.test(next)) return;
          setDraft(next);
          if (next === '' || next === '-' || next === '.' || next === '-.') {
            onValueChange(0);
            return;
          }
          const parsed = Number(next);
          if (Number.isFinite(parsed)) onValueChange(parsed);
        }}
        onBlur={() => {
          if (
            draft === '' ||
            draft === '-' ||
            draft === '.' ||
            draft === '-.'
          ) {
            setDraft(blankZero ? '' : '0');
            onValueChange(0);
            return;
          }
          const parsed = Number(draft);
          if (Number.isFinite(parsed)) setDraft(String(parsed));
        }}
      />
      {presets.length > 0 && (
        <div className="number-presets" aria-label={`${label} presets`}>
          {presets.map((preset) => (
            <button
              type="button"
              key={preset}
              aria-pressed={value === preset}
              onClick={() => {
                setDraft(String(preset));
                onValueChange(preset);
              }}
            >
              {preset.toFixed(2)}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function SymbolPicker({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  t: Translate;
}) {
  const builtIn = primarySymbols.some(([symbol]) => symbol === value);
  const [customOpen, setCustomOpen] = useState(!builtIn);
  const [customDraft, setCustomDraft] = useState(builtIn ? '' : value);
  const customSymbol = builtIn ? '' : value.trim().toUpperCase();
  const symbols: readonly (readonly [string, string])[] = customSymbol
    ? [...primarySymbols, [customSymbol, t('Custom', 'เพิ่มเอง')]]
    : primarySymbols;
  const saveCustom = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;
    onChange(normalized);
    setCustomDraft(normalized);
    setCustomOpen(false);
  };
  return (
    <fieldset className="symbol-picker full">
      <div className="symbol-picker-heading">
        <legend>{t('Symbol', 'สินทรัพย์')}</legend>
        <button
          type="button"
          className="symbol-custom-toggle"
          onClick={() => {
            setCustomDraft(builtIn ? '' : value);
            setCustomOpen((open) => !open);
          }}
          aria-expanded={customOpen}
        >
          <Plus size={14} /> {t('Add your own', 'เพิ่มสินทรัพย์')}
        </button>
      </div>
      <div
        className="symbol-rail"
        aria-label={t('Popular symbols', 'สินทรัพย์หลัก')}
      >
        {symbols.map(([symbol, name]) => (
          <button
            key={symbol}
            type="button"
            aria-pressed={value === symbol}
            onClick={() => {
              onChange(symbol);
              setCustomOpen(false);
            }}
          >
            <b>{symbol}</b>
            <small>{name}</small>
          </button>
        ))}
      </div>
      {(customOpen || !symbols.some(([symbol]) => symbol === value)) && (
        <label className="form-field symbol-custom-field">
          <span>
            {t('Broker symbol or another asset', 'ชื่อสินทรัพย์อื่นจากโบรกเกอร์')}
          </span>
          <input
            required
            maxLength={24}
            value={customDraft}
            autoCapitalize="characters"
            placeholder={t(
              'Example: ETHUSD or XAUUSDm',
              'เช่น ETHUSD หรือ XAUUSDm',
            )}
            onChange={(event) => {
              const next = event.target.value.toUpperCase();
              setCustomDraft(next);
              onChange(next);
            }}
            onBlur={(event) => saveCustom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                saveCustom(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }}
          />
        </label>
      )}
    </fieldset>
  );
}

export function TradeForm({
  trade,
  accounts,
  trades = [],
  playbooks = [],
  mode,
  t,
  busy,
  onSave,
  onImport,
  serverError,
  initialStep = 0,
  onDraftChange,
}: {
  trade: Trade;
  accounts: Account[];
  trades?: Trade[];
  playbooks?: Playbook[];
  mode: string;
  t: Translate;
  busy: boolean;
  serverError?: string;
  onSave: (t: Trade) => Promise<void>;
  onImport?: () => void;
  initialStep?: number;
  onDraftChange?: (trade: Trade, step: number) => void;
}) {
  const [v, setV] = useState(trade),
    [error, setError] = useState(''),
    [uploading, setUploading] = useState(false),
    [expanded, setExpanded] = useState(false),
    [lessonExpanded, setLessonExpanded] = useState(false),
    [mobileStep, setMobileStep] = useState(initialStep);
  const latestDraft = useRef({ v, mobileStep });
  const formRef = useRef<HTMLFormElement>(null);
  useLayoutEffect(() => {
    latestDraft.current = { v, mobileStep };
  }, [v, mobileStep]);
  useEffect(() => {
    if (v !== trade || mobileStep !== initialStep)
      onDraftChange?.(v, mobileStep);
  }, [v, mobileStep, trade, initialStep, onDraftChange]);
  useEffect(() => {
    if (!onDraftChange) return;
    const flushDraft = () => {
      const latest = latestDraft.current;
      if (latest.v !== trade || latest.mobileStep !== initialStep)
        onDraftChange(latest.v, latest.mobileStep);
    };
    window.addEventListener('pagehide', flushDraft);
    return () => window.removeEventListener('pagehide', flushDraft);
  }, [trade, initialStep, onDraftChange]);
  useEffect(() => {
    const form = formRef.current;
    const dialog = form?.closest<HTMLElement>('.trade-dialog');
    if (!form || !dialog) return;

    let frame = 0;
    const keepFocusedFieldVisible = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!window.matchMedia('(max-width: 767px)').matches) return;
        const viewport = window.visualViewport;
        const keyboardOpen = !!viewport && viewport.height < window.innerHeight - 100;
        if (keyboardOpen) {
          dialog.style.setProperty('--trade-visible-height', `${viewport.height}px`);
          dialog.style.setProperty('--trade-visible-top', `${viewport.offsetTop}px`);
        } else {
          dialog.style.removeProperty('--trade-visible-height');
          dialog.style.removeProperty('--trade-visible-top');
        }

        const focused = document.activeElement;
        if (!(focused instanceof HTMLElement) || !form.contains(focused)) return;
        if (!focused.matches('input, textarea, select')) return;
        const actions = form.querySelector<HTMLElement>('.mobile-capture-actions');
        const visibleBottom = Math.min(
          actions?.getBoundingClientRect().top ?? dialog.getBoundingClientRect().bottom,
          viewport ? viewport.offsetTop + viewport.height : window.innerHeight,
        );
        const overlap = focused.getBoundingClientRect().bottom + 16 - visibleBottom;
        if (overlap > 0) (form.querySelector('.trade-form-scroll') ?? dialog).scrollBy({ top: overlap, behavior: 'smooth' });
      });
    };

    form.addEventListener('focusin', keepFocusedFieldVisible);
    window.visualViewport?.addEventListener('resize', keepFocusedFieldVisible);
    window.visualViewport?.addEventListener('scroll', keepFocusedFieldVisible);
    return () => {
      cancelAnimationFrame(frame);
      form.removeEventListener('focusin', keepFocusedFieldVisible);
      window.visualViewport?.removeEventListener('resize', keepFocusedFieldVisible);
      window.visualViewport?.removeEventListener('scroll', keepFocusedFieldVisible);
      dialog.style.removeProperty('--trade-visible-height');
      dialog.style.removeProperty('--trade-visible-top');
    };
  }, []);
  const set = (k: keyof Trade, value: unknown) => setV({ ...v, [k]: value });
  const plannedR = useMemo(() => {
    const loss = v.side === 'LONG' ? v.entry - v.sl : v.sl - v.entry;
    const reward = v.side === 'LONG' ? v.tp - v.entry : v.entry - v.tp;
    return loss > 0 && reward > 0 ? reward / loss : 0;
  }, [v.entry, v.side, v.sl, v.tp]);
  const relatedLesson = useMemo(
    () => trades.some((existing) => existing.id === trade.id)
      ? undefined
      : relevantReviewedLesson(trades, v),
    [trades, trade.id, v],
  );
  const decisionResult = useMemo(() => {
    if (!v.adherence || v.adherence === 'partial' || v.status !== 'CLOSED') {
      return null;
    }
    const result = net(v);
    if (v.gross === 0 && v.fees === 0) return null;
    const profitable = result > 0;
    if (v.adherence === 'yes') {
      return profitable
        ? t('Good Win', 'ชนะและทำตามแผน')
        : t('Good Loss', 'แพ้แต่ตัดสินใจถูก');
    }
    return profitable
      ? t('Bad Win', 'ชนะแต่ตัดสินใจผิด')
      : t('Bad Loss', 'แพ้และหลุดแผน');
  }, [t, v]);
  return (
    <form
      ref={formRef}
      className="trade-form"
      data-mobile-step={mobileStep}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setError('');
        try {
          validateTrade(v);
          await onSave(v);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Invalid trade';
          if (
            message === 'Invalid symbol' ||
            message === 'Invalid date or time'
          ) {
            setMobileStep(0);
          } else if (
            message === 'Entry and size must be positive' ||
            message === 'Stop loss must be on the loss side of entry' ||
            message === 'Target must be on the profit side of entry'
          ) {
            setMobileStep(1);
          }
          setError(tradeError(message, t));
        }
      }}
    >
      <div className="trade-form-scroll">
      <div
        className="trade-entry-mode"
        role="tablist"
        aria-label={t('Entry method', 'วิธีบันทึก')}
      >
        <button type="button" role="tab" aria-selected="true">
          {t('Manual', 'กรอกเอง')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          onClick={onImport}
        >
          <Upload size={15} /> {t('Import', 'นำเข้า')}
        </button>
      </div>
      <p className="journal-hint">
        {t(
          'Start with the execution and result. Add your plan, reflection and screenshots below.',
          'เริ่มจากข้อมูลเข้าเทรดและผลลัพธ์ แล้วเพิ่มแผน บันทึกทบทวน และภาพกราฟด้านล่าง',
        )}
      </p>
      <div
        className="mobile-capture-progress"
        aria-label={t('Recording progress', 'ขั้นตอนการบันทึก')}
      >
        {[
          t('Trade', 'รายการ'),
          t('Numbers', 'ตัวเลข'),
          t('Decision', 'เหตุผล'),
        ].map((label, index) => (
          <button
            type="button"
            key={label}
            aria-current={mobileStep === index ? 'step' : undefined}
            onClick={() => setMobileStep(index)}
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <div className="form-grid">
        <label className="form-field full desktop-playbook-field" data-mobile-section="context">
          <span>{t('Playbook', 'แผนการเทรด')}</span>
          <select
            value={v.playbook?.id || ''}
            onChange={(e) => {
              const p = playbooks.find((p) => p.id === e.target.value);
              const changed: Trade = {
                ...v,
                playbook: p ? { ...p } : undefined,
                setup: p ? p.technique || p.name : v.setup,
                adherence: '',
              };
              setV({
                ...changed,
                review: {
                  ...emptyReview(changed),
                  emotion: v.review?.emotion || '',
                  lesson: v.review?.lesson || '',
                },
              });
            }}
          >
            <option value="">{t('No plan selected', 'ยังไม่ระบุแผน')}</option>
            {v.playbook && (
              <option value={v.playbook.id}>
                {v.playbook.name} · v{v.playbook.version}{' '}
                {t('(saved version)', '(ฉบับที่เลือก)')}
              </option>
            )}
            {playbooks
              .filter((p) => !p.archived && p.id !== v.playbook?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · v{p.version}
                </option>
              ))}
          </select>
        </label>
        {v.playbook && (
          <div className="form-field full" data-mobile-section="context">
            <details>
              <summary>
                {t('View selected plan', 'ดูแผนที่เลือก')} · v{v.playbook.version}
              </summary>
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {[
                  v.playbook.entry,
                  v.playbook.exit,
                  v.playbook.risk,
                  v.playbook.checklist,
                ]
                  .filter(Boolean)
                  .join('\n\n')}
              </p>
            </details>
          </div>
        )}
        <label className="form-field full" data-mobile-section="basics">
          <span>{t('Trading account', 'บัญชีเทรด')}</span>
          <Pick
            label="Trading account"
            value={v.accountId}
            onChange={(x) => set('accountId', x)}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          />
        </label>
        <div className="full" data-mobile-section="basics">
          <SymbolPicker
            value={v.symbol}
            onChange={(symbol) => set('symbol', symbol)}
            t={t}
          />
        </div>
        <fieldset
          className="trade-segment-field mobile-full-field direction-field"
          data-mobile-section="basics"
        >
          <legend>{t('Direction', 'ทิศทาง')}</legend>
          <div className="trade-segments">
            <button
              type="button"
              className="long-choice"
              aria-pressed={v.side === 'LONG'}
              onClick={() => set('side', 'LONG')}
            >
              <ArrowUpRight size={16} />
              Long / Buy
            </button>
            <button
              type="button"
              className="short-choice"
              aria-pressed={v.side === 'SHORT'}
              onClick={() => set('side', 'SHORT')}
            >
              <ArrowDownRight size={16} />
              Short / Sell
            </button>
          </div>
        </fieldset>
        <fieldset
          className="trade-segment-field mobile-full-field status-field"
          data-mobile-section="basics"
        >
          <legend>{t('Status', 'สถานะ')}</legend>
          <div className="trade-segments">
            <button
              type="button"
              className="open-choice"
              aria-pressed={v.status === 'OPEN'}
              onClick={() => set('status', 'OPEN')}
            >
              <Clock3 size={15} />
              {t('Open', 'ยังไม่ปิด')}
            </button>
            <button
              type="button"
              className="closed-choice"
              aria-pressed={v.status === 'CLOSED'}
              onClick={() => set('status', 'CLOSED')}
            >
              <CheckCircle2 size={15} />
              {t('Closed', 'ปิดแล้ว')}
            </button>
          </div>
          <small className="field-help">
            {v.status === 'OPEN'
              ? t(
                  'Record the outcome after the position closes.',
                  'เมื่อปิดสถานะแล้วค่อยกลับมาบันทึกผลลัพธ์',
                )
              : t(
                  'Use the realized result shown by your broker.',
                  'ใช้ผลลัพธ์ที่เกิดขึ้นจริงจากรายงานโบรกเกอร์',
                )}
          </small>
        </fieldset>
        <div className="mobile-date-field" data-mobile-section="basics">
          <Field
            label={t('Date', 'วันที่')}
            required
            type="date"
            value={v.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>
        <div className="mobile-time-field" data-mobile-section="basics">
          <Field
            label={t('Time', 'เวลา')}
            required
            type="time"
            value={v.time}
            onChange={(e) => set('time', e.target.value)}
          />
        </div>
        {relatedLesson && (
          <aside
            className="trade-memory full"
            data-mobile-section="basics"
            data-expanded={lessonExpanded}
          >
            <div className="trade-memory-label">
              <BookOpen size={17} aria-hidden="true" />
              <strong>{t('Remember this before your next trade', 'ก่อนเข้าไม้ใหม่ ลองนึกถึงข้อนี้')}</strong>
              <button
                className="trade-memory-toggle"
                type="button"
                aria-label={lessonExpanded ? t('Show less', 'ย่อบทเรียน') : t('Read full lesson', 'อ่านบทเรียนทั้งหมด')}
                aria-expanded={lessonExpanded}
                onClick={() => setLessonExpanded((open) => !open)}
              >
                <ChevronDown size={18} aria-hidden="true" />
              </button>
            </div>
            <p>{relatedLesson.trade.review!.lesson}</p>
            <small>
              {relatedLesson.reason === 'playbook'
                ? t('From this playbook', 'จากแผนการเทรดเดียวกัน')
                : relatedLesson.reason === 'setup'
                  ? t('From this setup', 'จากรูปแบบการเทรดเดียวกัน')
                  : t('From this symbol', 'จากสินทรัพย์เดียวกัน')}
              {' · '}{relatedLesson.trade.symbol} · {relatedLesson.trade.date}
            </small>
          </aside>
        )}
        <div className="desktop-risk-heading full" aria-hidden="true">
          <span>{t('Risk plan', 'แผนความเสี่ยง')}</span>
          <small>{t('Use the numbers you planned before entering.', 'ใช้ตัวเลขที่วางไว้ก่อนเข้าเทรด')}</small>
        </div>
        <div data-mobile-section="numbers">
          <DecimalField
            label={t('Entry price', 'ราคาเข้า')}
            value={v.entry}
            onValueChange={(value) => set('entry', value)}
            required
            blankZero
          />
        </div>
        <div data-mobile-section="numbers">
          <DecimalField
            label={t('Size / lot', 'ขนาด / Lot')}
            value={v.lot}
            onValueChange={(value) => set('lot', value)}
            required
            blankZero
            presets={[0.01, 0.05, 0.1]}
          />
        </div>
        <div data-mobile-section="numbers">
          <DecimalField
            label={t('Stop loss', 'จุดตัดขาดทุน')}
            value={v.sl}
            onValueChange={(value) => set('sl', value)}
            blankZero
          />
        </div>
        <div data-mobile-section="numbers">
          <DecimalField
            label={t('Take profit', 'จุดทำกำไร')}
            value={v.tp}
            onValueChange={(value) => set('tp', value)}
            blankZero
          />
        </div>
        <div data-mobile-section="numbers">
          <DecimalField
            label={t('Planned risk (USD)', 'ความเสี่ยงตามแผน (USD)')}
            value={v.risk}
            onValueChange={(value) => set('risk', value)}
            required
            blankZero
          />
        </div>
        <div
          className="form-field calculated-field"
          data-mobile-section="numbers"
        >
          <span>{t('Planned reward / risk', 'อัตราผลตอบแทนต่อความเสี่ยง')}</span>
          <output aria-live="polite">
            {plannedR > 0 ? `1 : ${plannedR.toFixed(2)}` : '—'}
          </output>
        </div>
        {v.status === 'CLOSED' &&
          (
            [
              ['gross', 'Realized gross P&L (USD)', 'กำไรก่อนค่าธรรมเนียม (USD)'],
              ['fees', 'Fees (USD)', 'ค่าธรรมเนียม (USD)'],
            ] as const
          ).map(([k, en, th]) => (
            <DecimalField
              key={k}
              className="mobile-number-field"
              label={t(en, th)}
              required
              value={v[k]}
              allowNegative={k === 'gross'}
              onValueChange={(value) => set(k, value)}
            />
          ))}
        <fieldset className="decision-check full" data-mobile-section="context">
          <legend>
            <ShieldCheck size={16} />
            {t('Decision check', 'ตรวจคุณภาพการตัดสินใจ')}
          </legend>
          <p>
            {t(
              'Did you follow the plan you intended before entering?',
              'ตอนเข้าเทรด คุณทำตามแผนที่ตั้งใจไว้หรือไม่?',
            )}
          </p>
          <div className="decision-options">
            {[
              ['yes', t('Followed', 'ตามแผน')],
              ['partial', t('Partly', 'บางส่วน')],
              ['no', t('Outside plan', 'นอกแผน')],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={v.adherence === value}
                onClick={() => set('adherence', value)}
              >
                {label}
              </button>
            ))}
          </div>
          {decisionResult && (
            <output className={`decision-result ${v.adherence}`}>
              <b>{decisionResult}</b>
              <span>
                {v.adherence === 'yes'
                  ? t(
                      'Judge the process separately from the outcome.',
                      'แยกคุณภาพของกระบวนการออกจากผลลัพธ์',
                    )
                  : t(
                      'A profitable trade can still reinforce the wrong behavior.',
                      'แม้ได้กำไร การหลุดแผนก็สร้างนิสัยที่อันตรายได้',
                    )}
              </span>
            </output>
          )}
        </fieldset>
        <label className="form-field full" data-mobile-section="context">
          <span>{t('Technique / setup', 'เทคนิค / Setup')}</span>
          <input
            list="trade-technique-options"
            value={v.setup}
            maxLength={160}
            placeholder={t(
              'Choose a Playbook technique or type your own',
              'เลือกเทคนิคจาก Playbook หรือพิมพ์เพิ่มเอง',
            )}
            onChange={(event) => set('setup', event.target.value)}
          />
          <datalist id="trade-technique-options">
            {Array.from(
              new Set(
                playbooks
                  .flatMap((playbook) => [playbook.name, playbook.technique])
                  .filter(Boolean),
              ),
            ).map((technique) => (
              <option key={technique} value={technique}>
                {technique}
              </option>
            ))}
          </datalist>
        </label>
        <label
          className="form-field full trade-note-field"
          data-mobile-section="context"
        >
          <span>{t('Quick note (optional)', 'บันทึกเพิ่มเติม (ไม่บังคับ)')}</span>
          <textarea
            value={v.notes}
            maxLength={10000}
            rows={3}
            onChange={(event) => set('notes', event.target.value)}
            placeholder={t(
              'What did you see or decide?',
              'สิ่งที่เห็นหรือเหตุผลในการตัดสินใจ…',
            )}
          />
        </label>
      </div>
      <aside className="desktop-trade-insights" aria-label={t('Live trade summary', 'สรุปรายการแบบสด')}>
        <section className="desktop-live-summary">
          <span className="overline">{t('Live summary', 'สรุปแบบสด')}</span>
          <div className="desktop-summary-title">
            <div>
              <b>{v.symbol || '—'}</b>
              <small>{v.side === 'LONG' ? 'Long / Buy' : 'Short / Sell'}</small>
            </div>
            <span className={`desktop-status-pill ${v.status.toLowerCase()}`}>
              {v.status === 'CLOSED' ? t('Closed', 'ปิดแล้ว') : t('Open', 'ยังไม่ปิด')}
            </span>
          </div>
          <dl>
            <div>
              <dt>{t('Planned risk', 'ความเสี่ยงตามแผน')}</dt>
              <dd>{v.risk > 0 ? money(v.risk) : '—'}</dd>
            </div>
            <div>
              <dt>{t('Planned R:R', 'ผลตอบแทนต่อความเสี่ยง')}</dt>
              <dd>{plannedR > 0 ? `1 : ${plannedR.toFixed(2)}` : '—'}</dd>
            </div>
            <div>
              <dt>{t('Net P&L', 'กำไรสุทธิ')}</dt>
              <dd className={v.status === 'CLOSED' && net(v) < 0 ? 'negative' : 'positive'}>
                {v.status === 'CLOSED' ? money(net(v)) : '—'}
              </dd>
            </div>
            <div>
              <dt>{t('Realized R', 'R ที่เกิดขึ้นจริง')}</dt>
              <dd>{v.status === 'CLOSED' && v.risk > 0 ? `${(net(v) / v.risk).toFixed(2)}R` : '—'}</dd>
            </div>
          </dl>
        </section>
        {relatedLesson && (
          <section className="desktop-insight-card desktop-lesson-card">
            <div className="desktop-insight-heading">
              <BookOpen size={17} aria-hidden="true" />
              <b>{t('Before your next trade', 'ก่อนเข้าไม้ใหม่')}</b>
            </div>
            <p>{relatedLesson.trade.review!.lesson}</p>
            <small>
              {relatedLesson.reason === 'playbook'
                ? t('From this playbook', 'จากแผนการเทรดเดียวกัน')
                : relatedLesson.reason === 'setup'
                  ? t('From this setup', 'จากรูปแบบการเทรดเดียวกัน')
                  : t('From this symbol', 'จากสินทรัพย์เดียวกัน')}
              {' · '}{relatedLesson.trade.symbol} · {relatedLesson.trade.date}
            </small>
          </section>
        )}
        <section className="desktop-insight-card desktop-process-card">
          <div className="desktop-insight-heading">
            <ShieldCheck size={17} aria-hidden="true" />
            <b>{t('Process first', 'ให้ความสำคัญกับกระบวนการ')}</b>
          </div>
          <p>
            {v.playbook
              ? t('Your playbook is attached. Check the setup and risk before saving.', 'เลือกแผนแล้ว ตรวจรูปแบบและความเสี่ยงอีกครั้งก่อนบันทึก')
              : t('Choose a playbook when this trade follows a repeatable setup.', 'เลือกแผนการเทรดเมื่อรายการนี้มาจากรูปแบบที่ทำซ้ำได้')}
          </p>
        </section>
      </aside>
      <details
        className="journal-extra"
        data-mobile-section="context"
        open={expanded}
        onToggle={(e) => setExpanded(e.currentTarget.open)}
      >
        <summary>
          {t('Plan, reflection & screenshots', 'แผน บันทึกทบทวน และภาพกราฟ')}
          <span>{t('Optional details', 'รายละเอียดเพิ่มเติม')}</span>
        </summary>
        <button
          className="text-button journal-prompt"
          type="button"
          onClick={() =>
            set(
              'notes',
              `${v.notes}${v.notes ? '\n\n' : ''}${t('PLAN / ENTRY REASON:\n\nFOLLOWED MY PLAN? WHY?\n\nONE THING TO REPEAT OR IMPROVE:\n', 'แผน / เหตุผลเข้าเทรด:\n\nทำตามแผนหรือไม่ เพราะอะไร:\n\nสิ่งที่ควรทำซ้ำหรือปรับปรุง:\n')}`,
            )
          }
        >
          {t('Add reflection prompts', 'เพิ่มหัวข้อช่วยทบทวน')} +
        </button>
        <ReviewEvidence
          trade={v}
          mode={mode}
          t={t}
          disabled={busy || uploading}
          onChange={setV}
          onUploading={setUploading}
        />
      </details>
      <details className="review-evidence" data-mobile-section="context">
        <summary>
          {t(
            'Checklist & short reflection (optional)',
            'Checklist และบทเรียนสั้น ๆ (ไม่บังคับ)',
          )}
        </summary>
        <ReviewFields
          trade={v}
          t={t}
          disabled={busy || uploading}
          onChange={setV}
        />
      </details>
      {(error || serverError) && (
        <p role="alert" className="negative mobile-capture-error">
          {error || serverError}
        </p>
      )}
      </div>
      <div className="mobile-capture-actions">
        {mobileStep > 0 && (
          <button
            className="button ghost"
            type="button"
            onClick={() => setMobileStep((step) => Math.max(0, step - 1))}
          >
            <ArrowLeft size={17} /> {t('Back', 'ย้อนกลับ')}
          </button>
        )}
        {mobileStep < 2 ? (
          <button
            className="button ink"
            type="button"
            onClick={() => setMobileStep((step) => Math.min(2, step + 1))}
          >
            {mobileStep === 0
              ? t('Add numbers', 'ใส่ตัวเลข')
              : t('Add decision context', 'เพิ่มเหตุผล')}
            <ArrowRight size={17} />
          </button>
        ) : (
          <button className="button ink" disabled={busy || uploading}>
            {busy ? t('Saving…', 'กำลังบันทึก…') : t('Save trade', 'บันทึกการเทรด')}
          </button>
        )}
        {mobileStep === 1 && (
          <button className="mobile-quick-save" disabled={busy || uploading}>
            {t('Save now · add context later', 'บันทึกก่อน · ทบทวนทีหลัง')}
          </button>
        )}
      </div>
      <div className="trade-form-footer desktop-trade-footer">
        <span>
          {t('Net P&L', 'กำไรสุทธิ')}:{' '}
          <b className={net(v) >= 0 ? 'positive' : 'negative'}>
            {v.status === 'CLOSED' ? money(net(v)) : '—'}
          </b>
        </span>
        <span>
          {t('Realized R', 'R ที่เกิดขึ้นจริง')}:{' '}
          <b>
            {v.status === 'CLOSED' && v.risk > 0
              ? `${(net(v) / v.risk).toFixed(2)}R`
              : '—'}
          </b>
          <small className="journal-hint">
            {t('Net P&L ÷ planned risk', 'กำไรสุทธิ ÷ ความเสี่ยงตามแผน')}
          </small>
        </span>
        <button className="button ink" disabled={busy || uploading}>
          {busy ? t('Saving…', 'กำลังบันทึก…') : t('Save trade', 'บันทึกการเทรด')}
        </button>
      </div>
    </form>
  );
}
export function SimpleForm({
  kind,
  data,
  t,
  busy,
  save,
}: {
  kind: string;
  data: WorkspaceData;
  t: Translate;
  busy: boolean;
  save: (action: string, value: unknown) => Promise<void>;
}) {
  const [name, setName] = useState(kind === 'profile' ? data.profile.name : ''),
    [balance, setBalance] = useState(10000),
    [portfolioId, setPortfolioId] = useState(data.portfolios[0]?.id ?? ''),
    [accountId, setAccountId] = useState(data.accounts[0]?.id ?? ''),
    [provider, setProvider] = useState('metaapi'),
    [zone, setZone] = useState(data.profile.timezone);
  return (
    <form
      className="simple-form"
      onSubmit={(e) => {
        e.preventDefault();
        const action: Record<string, string> = {
          portfolio: 'createPortfolio',
          account: 'createAccount',
          profile: 'saveProfile',
          rule: 'saveRule',
          connection: 'prepareConnection',
        };
        void save(
          action[kind],
          kind === 'rule'
            ? { text: name, enabled: true }
            : kind === 'connection'
              ? { accountId, provider }
              : kind === 'profile'
                ? { name, timezone: zone }
                : { name, balance, portfolioId },
        );
      }}
    >
      {kind !== 'connection' && (
        <Field
          label={kind === 'rule' ? t('Rule', 'กฎ') : kind === 'profile'
            ? t('Name Tradovia calls you', 'ชื่อที่ให้ Tradovia เรียก') : t('Name', 'ชื่อ')}
          required
          value={name}
          maxLength={kind === 'rule' ? 300 : 80}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      {['portfolio', 'account'].includes(kind) && (
        <Field
          label={t('Starting capital (USD)', 'เงินทุนเริ่มต้น (USD)')}
          type="number"
          required
          min="0"
          max="1000000000"
          step=".01"
          value={balance}
          onChange={(e) => setBalance(Number(e.target.value))}
        />
      )}
      {kind === 'account' && (
        <Pick
          label="Portfolio"
          value={portfolioId}
          onChange={setPortfolioId}
          options={data.portfolios.map((p) => ({ value: p.id, label: p.name }))}
        />
      )}
      {kind === 'profile' && (
        <Field
          label={t('Timezone', 'เขตเวลา')}
          required
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        />
      )}
      {kind === 'connection' && (
        <>
          <Pick
            label="Account"
            value={accountId}
            onChange={setAccountId}
            options={data.accounts.map((a) => ({ value: a.id, label: a.name }))}
          />
          <Pick
            label="Provider"
            value={provider}
            onChange={setProvider}
            options={[
              { value: 'metaapi', label: 'MetaApi · MT5' },
              { value: 'mt5-bridge', label: 'MT5 bridge' },
              { value: 'ctrader', label: 'cTrader' },
            ]}
          />
          <p className="muted-copy">
            {t(
              'This creates a connection record. Synchronization stays unavailable until the provider is configured.',
              'สร้างรายการเตรียมเชื่อมต่อ ระบบซิงก์จะยังไม่ทำงานจนกว่าจะตั้งค่าผู้ให้บริการ',
            )}
          </p>
        </>
      )}
      <button className="button ink" disabled={busy}>
        {t('Save', 'บันทึก')}
      </button>
    </form>
  );
}
