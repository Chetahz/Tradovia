'use client';
import { useState } from 'react';
import Link from 'next/link';
import WorkspaceExit from './workspace-exit';
import ProfileAvatar from './profile-avatar';
import BillingControls from './billing-controls';
import PlanComparison from './plan-comparison';
import DeleteAccount from './delete-account';
import SupportCenter from './support-center';
import {
  Wallet,
  Plus,
  Pencil,
  Download,
  ArrowUpRight,
  LogOut,
  BellRing,
  MoonStar,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Pick, type Translate } from './workspace-ui';
import { statistics, money, type WorkspaceData } from '@/lib/domain';
import {
  defaultReviewReminder,
  type ReviewReminder,
} from '@/lib/review-reminder';
import { FREE_LIMITS, hasProAccess } from '@/lib/plan-access';

const subscriptionStatus = (
  value: WorkspaceData['subscription'],
  t: Translate,
) => {
  if (value.status === 'owner') return t('Owner access', 'สิทธิ์เจ้าของระบบ');
  if (value.status === 'trialing') return t('Trial active', 'กำลังทดลองใช้');
  if (value.status === 'active')
    return value.cancelAtPeriodEnd
      ? t('Cancels at period end', 'ยกเลิกเมื่อสิ้นสุดรอบ')
      : t('Active', 'ใช้งานอยู่');
  if (['past_due', 'unpaid', 'incomplete'].includes(value.status))
    return t('Payment needs attention', 'ต้องตรวจสอบการชำระเงิน');
  if (value.status === 'expired') return t('Expired', 'หมดอายุ');
  if (value.status === 'canceled') return t('Cancelled', 'ยกเลิกแล้ว');
  return t('Free', 'ฟรี');
};

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
  reload,
  exportData,
  reset,
  saveReviewReminder,
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
  reload: () => Promise<void>;
  exportData: (csv?: boolean) => void;
  reset: () => void;
  saveReviewReminder: (value: ReviewReminder) => Promise<boolean>;
}) {
  const proAccess = mode === 'demo' || hasProAccess(data.subscription);
  const ownerAccess = data.subscription.status === 'owner';
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [reminder, setReminder] = useState<ReviewReminder>(
    data.profile.reviewReminder ?? defaultReviewReminder,
  );
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const renewalTime = Date.parse(data.subscription.renewal ?? '');
  const renewal = Number.isFinite(renewalTime)
    ? new Intl.DateTimeFormat(th ? 'th-TH' : 'en-US', {
        dateStyle: 'medium',
      }).format(renewalTime)
    : null;
  const updateAvatar = async (file?: File) => {
    if (
      file &&
      (file.size > 2000000 ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    ) {
      setAvatarError(
        t(
          'Choose a PNG, JPEG or WebP image under 2 MB.',
          'เลือกรูป PNG, JPEG หรือ WebP ขนาดไม่เกิน 2 MB',
        ),
      );
      return;
    }
    setAvatarBusy(true);
    setAvatarError('');
    try {
      const form = new FormData();
      if (file) form.set('image', file);
      const response = await fetch(`/api/profile/avatar?mode=${mode}`, {
        method: file ? 'POST' : 'DELETE',
        ...(file ? { body: form } : {}),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || 'Unable to update profile image');
      }
      await reload();
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : 'Unable to update profile image',
      );
    } finally {
      setAvatarBusy(false);
    }
  };
  if (page === 'portfolio')
    return (
      <>
        <div className="section-heading mb-5">
          <h2>{t('Your capital, organized.', 'จัดการเงินทุนอย่างเป็นระบบ')}</h2>
          <button
            className="button ghost compact"
            onClick={() => {
              if (!proAccess && data.portfolios.length > 0)
                window.location.hash = 'settings';
              else setFormKind('portfolio');
            }}
          >
            <Plus size={16} />
            {t('New portfolio', 'สร้างพอร์ต')}{' '}
            {!proAccess && data.portfolios.length > 0 && (
              <span className="plan-badge">PRO</span>
            )}
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
                  USD · {t('MANUAL + REPORT IMPORT', 'บันทึกเอง + นำเข้ารายงาน')}
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
          onClick={() => {
            if (!proAccess && data.accounts.length > 0)
              window.location.hash = 'settings';
            else setFormKind('account');
          }}
          disabled={!data.portfolios.length}
        >
          <Plus size={16} />
          {t('Add manual account', 'เพิ่มบัญชีบันทึกเอง')}{' '}
          {!proAccess && data.accounts.length > 0 && (
            <span className="plan-badge">PRO</span>
          )}
        </button>
      </>
    );
  return (
    <div className="two-col">
      <div className="panel">
        <h2>{t('Your profile', 'โปรไฟล์ของคุณ')}</h2>
        <div className="settings-profile-row">
          <ProfileAvatar profile={data.profile} mode={mode} large />
          <div>
            <strong>{data.profile.name}</strong>
            <small>
              {t(
                'The name Tradovia uses to greet you',
                'ชื่อที่ Tradovia ใช้ทักทายคุณ',
              )}
            </small>
          </div>
        </div>
        <div className="settings-profile-actions">
          <button
            className="button ghost compact"
            type="button"
            onClick={() => setFormKind('profile')}
          >
            <Pencil size={15} /> {t('Edit name & timezone', 'แก้ไขชื่อและเขตเวลา')}
          </button>
          <label
            className="button ghost compact"
            htmlFor="profile-avatar-upload"
          >
            {avatarBusy
              ? t('Updating…', 'กำลังอัปเดต…')
              : t('Choose photo', 'เลือกรูปโปรไฟล์')}
          </label>
          <input
            id="profile-avatar-upload"
            className="profile-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={avatarBusy}
            aria-label={t('Choose profile photo', 'เลือกรูปโปรไฟล์')}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (file) void updateAvatar(file);
            }}
          />
          {data.profile.avatarVersion && (
            <button
              className="text-button"
              type="button"
              disabled={avatarBusy}
              onClick={() => void updateAvatar()}
            >
              {t('Remove photo', 'ลบรูป')}
            </button>
          )}
        </div>
        {avatarError && (
          <p className="negative" role="alert">
            {avatarError}
          </p>
        )}
        <p className="muted-copy mt-4">
          {t(
            'A photo is optional. Only your signed-in account can load it.',
            'ไม่ต้องใส่รูปก็ได้ เฉพาะบัญชีที่เข้าสู่ระบบเท่านั้นที่โหลดรูปนี้ได้',
          )}
        </p>
      </div>
      <SupportCenter mode={mode} t={t} />
      <div className="panel">
        <h2>{t('App preferences', 'การใช้งานแอป')}</h2>
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
        <div className="rule-row">
          <span>{t('Timezone', 'เขตเวลา')}</span>
          <b>{data.profile.timezone}</b>
        </div>
      </div>
      <div className="panel review-reminder-settings">
        <div className="review-reminder-heading">
          <span className="settings-feature-icon">
            <BellRing size={19} />
          </span>
          <div>
            <h2>{t('Daily review reminder', 'เตือนทบทวนประจำวัน')}</h2>
            <p className="muted-copy">
              {t(
                'A quiet in-app nudge to finish one review. It never asks you to trade.',
                'เตือนเบา ๆ ภายในแอปให้ทบทวนหนึ่งรายการ โดยไม่กระตุ้นให้คุณเข้าเทรด',
              )}
            </p>
          </div>
          <Switch
            checked={reminder.enabled}
            onCheckedChange={(enabled) => {
              setReminder((current) => ({ ...current, enabled }));
              setReminderMessage('');
            }}
            aria-label={t('Daily review reminder', 'เตือนทบทวนประจำวัน')}
          />
        </div>
        <div className="review-reminder-grid">
          <label>
            <span>{t('Remind me at', 'เตือนเวลา')}</span>
            <input
              type="time"
              value={reminder.time}
              disabled={!reminder.enabled || reminderBusy}
              onChange={(event) =>
                setReminder((current) => ({
                  ...current,
                  time: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>
              <MoonStar size={15} /> {t('Quiet from', 'พักการเตือนตั้งแต่')}
            </span>
            <input
              type="time"
              value={reminder.quietStart}
              disabled={!reminder.enabled || reminderBusy}
              onChange={(event) =>
                setReminder((current) => ({
                  ...current,
                  quietStart: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>{t('Quiet until', 'ถึงเวลา')}</span>
            <input
              type="time"
              value={reminder.quietEnd}
              disabled={!reminder.enabled || reminderBusy}
              onChange={(event) =>
                setReminder((current) => ({
                  ...current,
                  quietEnd: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="review-reminder-footer">
          <small>
            {t(
              `Uses ${data.profile.timezone}. The reminder appears when Tradovia is open.`,
              `ใช้เขตเวลา ${data.profile.timezone} และจะแสดงเมื่อเปิด Tradovia`,
            )}
          </small>
          <button
            type="button"
            className="button ink compact"
            disabled={reminderBusy}
            onClick={async () => {
              setReminderBusy(true);
              setReminderMessage('');
              const saved = await saveReviewReminder(reminder);
              setReminderMessage(
                saved
                  ? t('Reminder saved', 'บันทึกเวลาเตือนแล้ว')
                  : t('Could not save. Try again.', 'บันทึกไม่สำเร็จ ลองอีกครั้ง'),
              );
              setReminderBusy(false);
            }}
          >
            {reminderBusy
              ? t('Saving…', 'กำลังบันทึก…')
              : t('Save reminder', 'บันทึกการเตือน')}
          </button>
        </div>
        {reminderMessage && (
          <output className="review-reminder-message">{reminderMessage}</output>
        )}
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
          {data.subscription.plan === 'manual'
            ? 'FREE'
            : data.subscription.plan.toUpperCase()}{' '}
          · {subscriptionStatus(data.subscription, t)}
        </h2>
        <p className="muted-copy">
          {ownerAccess
            ? t(
                'Owner access includes every Pro capability without a subscription charge.',
                'สิทธิ์เจ้าของระบบเปิดความสามารถ Pro ทั้งหมดโดยไม่ต้องชำระค่าสมาชิก',
              )
            : proAccess
              ? t(
                  'Your workspace has every Pro capability.',
                  'เวิร์กสเปซของคุณเปิดความสามารถ Pro ครบแล้ว',
                )
              : data.subscription.plan !== 'manual'
                ? t(
                    'Pro is inactive. Free remains available and your existing data is preserved.',
                    'สิทธิ์ Pro ยังไม่ทำงาน คุณยังใช้ Free ได้และข้อมูลเดิมอยู่ครบ',
                  )
                : t(
                    'Your Free workspace remains available without a paid subscription.',
                    'ใช้เวิร์กสเปซ Free ได้โดยไม่ต้องสมัครแพ็กเกจแบบชำระเงิน',
                  )}
        </p>
        {!proAccess && (
          <div
            className="plan-usage"
            aria-label={t('Free plan usage', 'การใช้งานแพ็กเกจ Free')}
          >
            {[
              [
                t('Trades', 'รายการเทรด'),
                data.trades.length,
                FREE_LIMITS.trades,
              ],
              [
                t('Playbooks', 'Playbook'),
                data.playbooks?.length || 0,
                FREE_LIMITS.playbooks,
              ],
              [
                t('Portfolios', 'พอร์ต'),
                data.portfolios.length,
                FREE_LIMITS.portfolios,
              ],
            ].map(([label, used, limit]) => {
              const value = Math.min(100, (Number(used) / Number(limit)) * 100);
              return (
                <div key={String(label)}>
                  <span>
                    <b>{label}</b>
                    <small>
                      {used} / {limit}
                    </small>
                  </span>
                  <i aria-hidden="true">
                    <em style={{ width: `${value}%` }} />
                  </i>
                </div>
              );
            })}
          </div>
        )}
        <div className="rule-row">
          <span>{t('Renewal', 'ต่ออายุ')}</span>
          <b>{renewal ?? t('No renewal scheduled', 'ไม่มีรอบต่ออายุ')}</b>
        </div>
        <p className="muted-copy">
          {ownerAccess
            ? t(
                'This account is excluded from customer billing.',
                'บัญชีนี้แยกออกจากระบบเรียกเก็บเงินของลูกค้า',
              )
            : t(
                'Choose a plan below. After subscribing, manage invoices, plan changes and cancellation from the secure Stripe portal.',
                'เลือกแพ็กเกจด้านล่าง หลังสมัครแล้วคุณจัดการใบเสร็จ เปลี่ยนแพ็กเกจ และยกเลิกได้ผ่านพอร์ทัล Stripe ที่ปลอดภัย',
              )}
        </p>
        {!ownerAccess && (
          <>
            <Link
              prefetch={false}
              className="button ghost compact mt-4"
              href="/#pricing"
            >
              {t('View launch plans', 'ดูแพ็กเกจเปิดตัว')}
              <ArrowUpRight size={16} />
            </Link>
            <BillingControls
              mode={mode}
              subscription={data.subscription}
              t={t}
              th={th}
              reload={reload}
            />
          </>
        )}
        <PlanComparison t={t} compact />
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
                'Signed in securely. Your journal belongs to your personal account.',
                'เข้าสู่ระบบอย่างปลอดภัย บันทึกการเทรดเป็นข้อมูลของบัญชีคุณ',
              )}
        </p>
        <WorkspaceExit
          demo={mode === 'demo'}
          className="button ghost compact mt-5"
        >
          <LogOut size={16} />
          {t('Leave workspace', 'ออกจากเวิร์กสเปซ')}
        </WorkspaceExit>
        <div className="account-legal-links">
          <Link prefetch={false} href="/privacy">
            {t('Privacy policy', 'นโยบายความเป็นส่วนตัว')}
          </Link>
          <Link prefetch={false} href="/terms">
            {t('Terms of service', 'ข้อกำหนดการให้บริการ')}
          </Link>
        </div>
        {mode === 'real' && <DeleteAccount t={t} />}
      </div>
    </div>
  );
}
