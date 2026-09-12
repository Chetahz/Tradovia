'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ReviewFields, emptyReview } from './review-fields';
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
export function TradeForm({
  trade,
  accounts,
  playbooks = [],
  mode,
  t,
  busy,
  onSave,
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
}) {
  const [v, setV] = useState(trade),
    [error, setError] = useState(''),
    [uploading, setUploading] = useState(false),
    [expanded, setExpanded] = useState(false);
  const set = (k: keyof Trade, value: unknown) => setV({ ...v, [k]: value });
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
          setError(e instanceof Error ? e.message : 'Invalid trade');
        }
      }}
    >
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
        <Field
          label={t('Symbol', 'สินทรัพย์')}
          required
          maxLength={24}
          value={v.symbol}
          onChange={(e) => set('symbol', e.target.value.toUpperCase())}
        />
        <label className="form-field">
          <span>{t('Direction', 'ทิศทาง')}</span>
          <Pick
            label="Direction"
            value={v.side}
            onChange={(x) => set('side', x)}
            options={[
              { value: 'LONG', label: 'Long / Buy' },
              { value: 'SHORT', label: 'Short / Sell' },
            ]}
          />
        </label>
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
        {(
          [
            ['entry', 'Entry price', 'ราคาเข้า'],
            ['lot', 'Size / lot', 'ขนาด / Lot'],
            ['risk', 'Planned risk (USD)', 'ความเสี่ยงตามแผน (USD)'],
            ['gross', 'Realized gross P&L (USD)', 'กำไรก่อนค่าธรรมเนียม (USD)'],
            ['fees', 'Fees (USD)', 'ค่าธรรมเนียม (USD)'],
          ] as const
        ).map(([k, en, th]) => (
          <Field
            key={k}
            label={t(en, th)}
            type="number"
            step="any"
            required
            min={k === 'gross' ? undefined : 0}
            value={(k === 'entry' || k === 'lot') && v[k] === 0 ? '' : v[k]}
            onChange={(e) => set(k, Number(e.target.value))}
          />
        ))}
        <label className="form-field">
          <span>{t('Status', 'สถานะ')}</span>
          <Pick
            label="Trade status"
            value={v.status}
            onChange={(x) => set('status', x)}
            options={[
              { value: 'CLOSED', label: t('Closed', 'ปิดแล้ว') },
              { value: 'OPEN', label: t('Open', 'ยังไม่ปิด') },
            ]}
          />
        </label>
        <Field
          label={t('Technique tags', 'เทคนิคที่ใช้')}
          className="full"
          value={v.setup}
          maxLength={160}
          placeholder="FVG + MSS, London"
          onChange={(e) => set('setup', e.target.value)}
        />
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
        <div className="form-grid">
          {(
            [
              ['sl', 'Stop loss', 'จุดตัดขาดทุน'],
              ['tp', 'Take profit', 'จุดทำกำไร'],
            ] as const
          ).map(([key, en, thai]) => (
            <Field
              key={key}
              label={t(en, thai)}
              type="number"
              min="0"
              step="any"
              value={v[key]}
              onChange={(e) => set(key, Number(e.target.value))}
            />
          ))}
          <label className="form-field full">
            <span>{t('Notes & reflection', 'บันทึกและทบทวน')}</span>
            <textarea
              value={v.notes}
              maxLength={10000}
              rows={4}
              onChange={(e) => set('notes', e.target.value)}
              placeholder={t(
                'What did you see? Did you follow your plan?',
                'เห็นอะไรในตลาด? ทำตามแผนได้หรือไม่?',
              )}
            />
          </label>
        </div>
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
        <div className="upload-section">
          <label className="button ghost compact">
            <ImagePlus size={17} />
            {uploading
              ? t('Uploading…', 'กำลังอัปโหลด…')
              : t('Add trade image', 'เพิ่มภาพกราฟ')}
            <input
              aria-label="Upload trade image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading || v.imageIds.length >= 5}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setError('');
                try {
                  const fd = new FormData();
                  fd.set('image', file);
                  const r = await fetch(`/api/images?mode=${mode}`, {
                    method: 'POST',
                    body: fd,
                  });
                  const res = (await r.json()) as {
                    id: string;
                    error?: string;
                  };
                  if (!r.ok) throw new Error(res.error);
                  setV((current) => ({
                    ...current,
                    imageIds: [...current.imageIds, res.id],
                  }));
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Upload failed');
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
          <small>
            {t(
              'PNG, JPG, WebP · 5 MB each · up to 5 images',
              'PNG, JPG, WebP · ภาพละไม่เกิน 5 MB · สูงสุด 5 ภาพ',
            )}
          </small>
          <div className="trade-images">
            {v.imageIds.map((id) => (
              <div key={id}>
                <Image
                  unoptimized
                  width={130}
                  height={95}
                  src={`/api/images/${id}?mode=${mode}`}
                  alt="Trade attachment"
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remove image"
                  onClick={() =>
                    set(
                      'imageIds',
                      v.imageIds.filter((x) => x !== id),
                    )
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
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
