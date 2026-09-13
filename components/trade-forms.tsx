'use client';
import { useMemo, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
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
  className = '',
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  required?: boolean;
  allowNegative?: boolean;
  blankZero?: boolean;
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
  playbooks = [],
  mode,
  t,
  busy,
  onSave,
  onImport,
  serverError,
}: {
  trade: Trade;
  accounts: Account[];
  playbooks?: Playbook[];
  mode: string;
  t: Translate;
  busy: boolean;
  serverError?: string;
  onSave: (t: Trade) => Promise<void>;
  onImport?: () => void;
}) {
  const [v, setV] = useState(trade),
    [error, setError] = useState(''),
    [uploading, setUploading] = useState(false),
    [expanded, setExpanded] = useState(false);
  const set = (k: keyof Trade, value: unknown) => setV({ ...v, [k]: value });
  const plannedR = useMemo(() => {
    const loss = v.side === 'LONG' ? v.entry - v.sl : v.sl - v.entry;
    const reward = v.side === 'LONG' ? v.tp - v.entry : v.entry - v.tp;
    return loss > 0 && reward > 0 ? reward / loss : 0;
  }, [v.entry, v.side, v.sl, v.tp]);
  return (
    <form
      className="trade-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError('');
        try {
          validateTrade(v);
          await onSave(v);
        } catch (e) {
          setExpanded(true);
          setError(
            tradeError(e instanceof Error ? e.message : 'Invalid trade', t),
          );
        }
      }}
    >
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
      <div className="form-grid">
        <label className="form-field full">
          <span>Playbook</span>
          <select
            value={v.playbook?.id || ''}
            onChange={(e) => {
              const p = playbooks.find((p) => p.id === e.target.value);
              const changed: Trade = {
                ...v,
                playbook: p ? { ...p } : undefined,
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
          <div className="form-field full">
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
            <label>
              {t('Did you follow this plan?', 'ทำตามแผนนี้หรือไม่?')}
              <select
                value={v.adherence || ''}
                onChange={(e) => set('adherence', e.target.value)}
              >
                <option value="">{t('Not reviewed', 'ยังไม่ทบทวน')}</option>
                <option value="yes">{t('Followed', 'ตามแผน')}</option>
                <option value="partial">{t('Partly', 'บางส่วน')}</option>
                <option value="no">{t('Outside plan', 'นอกแผน')}</option>
              </select>
            </label>
          </div>
        )}
        <label className="form-field full">
          <span>{t('Trading account', 'บัญชีเทรด')}</span>
          <Pick
            label="Trading account"
            value={v.accountId}
            onChange={(x) => set('accountId', x)}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          />
        </label>
        <SymbolPicker
          value={v.symbol}
          onChange={(symbol) => set('symbol', symbol)}
          t={t}
        />
        <fieldset className="trade-segment-field">
          <legend>{t('Direction', 'ทิศทาง')}</legend>
          <div className="trade-segments">
            <button
              type="button"
              aria-pressed={v.side === 'LONG'}
              onClick={() => set('side', 'LONG')}
            >
              Long / Buy
            </button>
            <button
              type="button"
              aria-pressed={v.side === 'SHORT'}
              onClick={() => set('side', 'SHORT')}
            >
              Short / Sell
            </button>
          </div>
        </fieldset>
        <fieldset className="trade-segment-field">
          <legend>{t('Status', 'สถานะ')}</legend>
          <div className="trade-segments">
            <button
              type="button"
              aria-pressed={v.status === 'OPEN'}
              onClick={() => set('status', 'OPEN')}
            >
              {t('Open', 'ยังไม่ปิด')}
            </button>
            <button
              type="button"
              aria-pressed={v.status === 'CLOSED'}
              onClick={() => set('status', 'CLOSED')}
            >
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
        <Field
          label={t('Date', 'วันที่')}
          required
          type="date"
          value={v.date}
          onChange={(e) => set('date', e.target.value)}
        />
        <Field
          label={t('Time', 'เวลา')}
          required
          type="time"
          value={v.time}
          onChange={(e) => set('time', e.target.value)}
        />
        <DecimalField
          label={t('Entry price', 'ราคาเข้า')}
          value={v.entry}
          onValueChange={(value) => set('entry', value)}
          required
          blankZero
        />
        <DecimalField
          label={t('Size / lot', 'ขนาด / Lot')}
          value={v.lot}
          onValueChange={(value) => set('lot', value)}
          required
          blankZero
        />
        <DecimalField
          label={t('Stop loss', 'จุดตัดขาดทุน')}
          value={v.sl}
          onValueChange={(value) => set('sl', value)}
          blankZero
        />
        <DecimalField
          label={t('Take profit', 'จุดทำกำไร')}
          value={v.tp}
          onValueChange={(value) => set('tp', value)}
          blankZero
        />
        <DecimalField
          label={t('Planned risk (USD)', 'ความเสี่ยงตามแผน (USD)')}
          value={v.risk}
          onValueChange={(value) => set('risk', value)}
          required
          blankZero
        />
        <div className="form-field calculated-field">
          <span>{t('Planned reward / risk', 'Reward / Risk ตามแผน')}</span>
          <output>{plannedR > 0 ? `1 : ${plannedR.toFixed(2)}` : '—'}</output>
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
              label={t(en, th)}
              required
              value={v[k]}
              allowNegative={k === 'gross'}
              onValueChange={(value) => set(k, value)}
            />
          ))}
        <label className="form-field full">
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
        <label className="form-field full trade-note-field">
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
      <details
        className="journal-extra"
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
      <details className="review-evidence">
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
        <p role="alert" className="negative">
          {error || serverError}
        </p>
      )}
      <div className="trade-form-footer">
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
          label={kind === 'rule' ? t('Rule', 'กฎ') : t('Name', 'ชื่อ')}
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
