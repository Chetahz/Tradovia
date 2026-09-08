'use client';
import Link from 'next/link';
import BillingControls from './billing-controls';
import {
  Wallet,
  Plus,
  Plug,
  ShieldCheck,
  Pencil,
  Download,
  ArrowUpRight,
  LogOut,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Pick, type Translate } from './workspace-ui';
import { statistics, money, type WorkspaceData } from '@/lib/domain';
export function AccountViews({
  page,
  data,
  mode,
  t,
  dark,
  setDark,
  th,
  setTh,
  setFormKind,
  mutate,
  exportData,
  reset,
}: {
  page: string;
  data: WorkspaceData;
  mode: string;
  t: Translate;
  dark: boolean;
  setDark: (v: boolean) => void;
  th: boolean;
  setTh: (v: boolean) => void;
  setFormKind: (v: string) => void;
  mutate: (action: string, value: unknown) => Promise<boolean>;
  exportData: (csv?: boolean) => void;
  reset: () => void;
}) {
  if (page === 'portfolio')
    return (
      <>
        <div className="section-heading mb-5">
          <h2>{t('Your capital, organized.', 'จัดการเงินทุนอย่างเป็นระบบ')}</h2>
          <button
            className="button ghost compact"
            onClick={() => setFormKind('portfolio')}
          >
            <Plus size={16} />
            {t('New portfolio', 'สร้างพอร์ต')}
          </button>
        </div>
        <div className="two-col">
          {data.portfolios.map((p) => {
            const aa = data.accounts.filter((a) => a.portfolioId === p.id),
              ts = data.trades.filter((tr) =>
                aa.some((a) => a.id === tr.accountId),
              ),
              ps = statistics(
                ts,
                aa.reduce((n, a) => n + a.balance, 0),
              );
            return (
              <div className="panel" key={p.id}>
                <span className="overline">
                  USD · {t('MANUAL + FUTURE SYNC', 'บันทึกเอง + พร้อมรองรับซิงก์')}
                </span>
                <h2>{p.name}</h2>
                <div className="portfolio-equity">
                  {money(ps.equity)}
                  <span className={ps.pnl >= 0 ? 'positive' : 'negative'}>
                    {money(ps.pnl)}
                  </span>
                </div>
                {aa.map((a) => (
                  <div className="account-row" key={a.id}>
                    <span className="instrument-icon">
                      <Wallet size={18} />
                    </span>
                    <span>
                      <b>{a.name}</b>
                      <small>{t('Manual account', 'บัญชีบันทึกเอง')}</small>
                    </span>
                    <span>
                      {money(a.balance)}
                      <small>{t('Starting capital', 'เงินทุนเริ่มต้น')}</small>
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {!data.portfolios.length && (
          <div className="empty-state">
            <Wallet size={30} />
            <h2>{t('A fresh start.', 'เริ่มต้นพอร์ตใหม่')}</h2>
            <p>
              {t(
                'Create a portfolio to start your manual trading journal.',
                'สร้างพอร์ตเพื่อเริ่มบันทึกการเทรดด้วยตัวเอง',
              )}
            </p>
          </div>
        )}
        <button
          className="button ghost mt-5"
          onClick={() => setFormKind('account')}
          disabled={!data.portfolios.length}
        >
          <Plus size={16} />
          {t('Add manual account', 'เพิ่มบัญชีบันทึกเอง')}
        </button>
      </>
    );
  if (page === 'connections')
    return (
      <>
        <div className="panel connection-intro">
          <Plug size={34} strokeWidth={1.4} />
          <div>
            <h2>
              {t(
                'Your brokers. One clear picture.',
                'รวมบัญชีโบรกเกอร์ เห็นภาพเดียวกัน',
              )}
            </h2>
            <p>
              {t(
                'Manual journaling works today. Prepare your accounts for provider-backed synchronization.',
                'บันทึกเองได้ทันที เตรียมบัญชีสำหรับการซิงก์ผ่านผู้ให้บริการในอนาคต',
              )}
            </p>
          </div>
          <button
            className="button ink"
            disabled={!data.accounts.length}
            onClick={() => setFormKind('connection')}
          >
            <Plus size={16} />
            {t('Prepare connection', 'เตรียมการเชื่อมต่อ')}
          </button>
        </div>
        <div className="notice">
          <ShieldCheck size={19} />
          <span>
            {t(
              'Broker sync is not connected. No broker credentials are collected in this preview.',
              'ยังไม่ได้เชื่อมต่อระบบซิงก์ พรีวิวนี้ไม่เก็บรหัสผ่านโบรกเกอร์',
            )}
          </span>
        </div>
        {data.connections.map((c) => (
          <div className="panel connection-card" key={c.id}>
            <div className="section-heading">
              <h2>{c.provider}</h2>
              <span className="pill">
                {c.status === 'not_configured'
                  ? t('Provider not configured', 'ยังไม่ตั้งค่าผู้ให้บริการ')
                  : c.status === 'disconnected'
                    ? t('Disconnected', 'ยกเลิกการเชื่อมต่อแล้ว')
                    : c.status}
              </span>
            </div>
            <p>{data.accounts.find((a) => a.id === c.accountId)?.name}</p>
            <div className="connection-meta">
              <span>
                {t('Last sync', 'ซิงก์ล่าสุด')}:{' '}
                {c.lastSync ?? t('Never', 'ยังไม่เคย')}
              </span>
              <span>
                {t('Sync status', 'สถานะซิงก์')}: {t('Unavailable', 'ยังไม่พร้อม')}
              </span>
            </div>
            {c.error && <p role="alert">{c.error}</p>}
            <div className="actions">
              <button
                className="button ghost compact"
                onClick={() => void mutate('reconnect', c.id)}
              >
                {t('Reconnect', 'เชื่อมต่อใหม่')}
              </button>
              <button
                className="button ghost compact"
                onClick={() => void mutate('sync', c.id)}
              >
                {t('Sync now', 'ซิงก์ตอนนี้')}
              </button>
              <button
                className="text-button"
                disabled={c.status === 'disconnected'}
                onClick={() => void mutate('disconnect', c.id)}
              >
                {t('Disconnect', 'ยกเลิกการเชื่อมต่อ')}
              </button>
            </div>
          </div>
        ))}
        <div className="panel">
          <h2>
            {t('Built for more than one broker.', 'ออกแบบให้รองรับหลายโบรกเกอร์')}
          </h2>
          <p className="muted-copy">
            {t(
              'MT5 bridge, MetaApi and cTrader adapters share a normalized trade model. A provider must be configured and verified before any sync can run.',
              'MT5 bridge, MetaApi และ cTrader ใช้รูปแบบข้อมูลกลาง ต้องเชื่อมต่อและทดสอบผู้ให้บริการก่อนเริ่มซิงก์',
            )}
          </p>
        </div>
      </>
    );
  return (
    <div className="two-col">
      <div className="panel">
        <h2>{t('Make it yours', 'ปรับให้เป็นคุณ')}</h2>
        <div className="rule-row">
          <span>{t('Dark mode', 'ธีมมืด')}</span>
          <Switch
            checked={dark}
            onCheckedChange={setDark}
            aria-label="Dark mode"
          />
        </div>
        <div className="rule-row">
          <span>{t('Language', 'ภาษา')}</span>
          <Pick
            label="Language"
            value={th ? 'th' : 'en'}
            onChange={(v) => setTh(v === 'th')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'th', label: 'ภาษาไทย' },
            ]}
          />
        </div>
        <button
          className="button ghost compact"
          onClick={() => setFormKind('profile')}
        >
          <Pencil size={15} />
          {t('Edit profile', 'แก้ไขโปรไฟล์')}
        </button>
        <p className="muted-copy mt-4">
          {data.profile.name} · {data.profile.timezone}
        </p>
      </div>
      <div className="panel">
        <h2>{t('Your data, always yours', 'ข้อมูลของคุณ เป็นของคุณเสมอ')}</h2>
        <p className="muted-copy">
          {t(
            'Download your workspace or export trades for the selected portfolio.',
            'ดาวน์โหลดเวิร์กสเปซ หรือส่งออกรายการในพอร์ตที่เลือก',
          )}
        </p>
        <div className="actions mt-5">
          <button className="button ghost compact" onClick={() => exportData()}>
            <Download size={16} />
            JSON
          </button>
          <button
            className="button ghost compact"
            onClick={() => exportData(true)}
          >
            <Download size={16} />
            CSV
          </button>
        </div>
        {mode === 'demo' && (
          <button className="text-button negative mt-6" onClick={reset}>
            {t('Reset demo workspace', 'เริ่มเดโมใหม่')}
          </button>
        )}
      </div>
      <div className="panel">
        <span className="overline">
          {t('BILLING & SUBSCRIPTION', 'แพ็กเกจและการชำระเงิน')}
        </span>
        <h2>
          {data.subscription.plan.toUpperCase()} ·{' '}
          {data.subscription.plan === 'manual'
            ? t('Free', 'ฟรี')
            : data.subscription.status}
        </h2>
        <p className="muted-copy">
          {t(
            'Your manual workspace remains available without a paid subscription.',
            'ใช้เวิร์กสเปซแบบบันทึกเองได้ โดยไม่ต้องสมัครแพ็กเกจแบบชำระเงิน',
          )}
        </p>
        <div className="rule-row">
          <span>{t('Renewal', 'ต่ออายุ')}</span>
          <b>
            {data.subscription.renewal ??
              t('No renewal scheduled', 'ไม่มีรอบต่ออายุ')}
          </b>
        </div>
        <p className="muted-copy">
          {t(
            'Paid upgrades, billing portal and cancellation will activate when Stripe is configured.',
            'การอัปเกรด จัดการบิล และยกเลิกแพ็กเกจจะเปิดเมื่อเชื่อมต่อ Stripe แล้ว',
          )}
        </p>
        <Link
          prefetch={false}
          className="button ghost compact mt-4"
          href="/#pricing"
        >
          {t('View launch plans', 'ดูแพ็กเกจเปิดตัว')}
          <ArrowUpRight size={16} />
        </Link>
        <BillingControls mode={mode} t={t} />
      </div>
      <div className="panel">
        <h2>{t('Account & security', 'บัญชีและความปลอดภัย')}</h2>
        <p className="muted-copy">
          {mode === 'demo'
            ? t(
                'This demo is isolated using its own secure session.',
                'เดโมแยกจากข้อมูลจริงด้วยเซสชันเฉพาะ',
              )
            : t(
                'Signed in securely through ChatGPT. Email and Google identity adapters are prepared for public launch.',
                'เข้าสู่ระบบผ่าน ChatGPT อย่างปลอดภัย เตรียมรองรับอีเมลและ Google สำหรับเปิดตัวสาธารณะ',
              )}
        </p>
        <Link
          prefetch={false}
          className="button ghost compact mt-5"
          href={mode === 'demo' ? '/' : '/signout-with-chatgpt?return_to=/'}
        >
          <LogOut size={16} />
          {t('Leave workspace', 'ออกจากเวิร์กสเปซ')}
        </Link>
      </div>
    </div>
  );
}
