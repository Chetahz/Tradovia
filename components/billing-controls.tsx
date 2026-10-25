'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { WorkspaceData } from '@/lib/domain';
import { hasProAccess } from '@/lib/plan-access';
import type { Translate } from './workspace-ui';

const recoveryStatuses = new Set([
  'past_due',
  'unpaid',
  'incomplete',
  'incomplete_expired',
]);
const restartStatuses = new Set(['canceled', 'incomplete_expired']);

export default function BillingControls({
  mode,
  subscription,
  t,
  th,
  reload,
}: {
  mode: string;
  subscription: WorkspaceData['subscription'];
  t: Translate;
  th: boolean;
  reload: () => Promise<void>;
}) {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const proAccess = hasProAccess(subscription);
  const needsPayment = recoveryStatuses.has(subscription.status);
  const canStartCheckout =
    subscription.plan === 'manual' || restartStatuses.has(subscription.status);

  useEffect(() => {
    let active = true;
    void fetch(`/api/billing?mode=${mode}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((value) => {
        if (!active) return;
        const status = value as { ready?: boolean; canManage?: boolean };
        setReady(Boolean(status.ready));
        setCanManage(Boolean(status.canManage));
      })
      .catch(() => {
        if (active)
          setError(
            th ? 'ตรวจสถานะการชำระเงินไม่สำเร็จ' : 'Could not check billing.',
          );
      })
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, [mode, th]);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('billing');
    if (!result) return;
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.hash}`,
    );
    let active = true;
    let timer = 0;
    if (result === 'cancelled') {
      timer = window.setTimeout(
        () =>
          setNotice(
            th
              ? 'ยกเลิกการชำระเงินแล้ว ไม่มีการเรียกเก็บเงิน'
              : 'Checkout was cancelled. Nothing was charged.',
          ),
        0,
      );
      return () => window.clearTimeout(timer);
    }
    if (result !== 'success') return;
    timer = window.setTimeout(
      () =>
        setNotice(
          th
            ? 'ชำระเงินสำเร็จ กำลังยืนยันสิทธิ์ Pro…'
            : 'Payment completed. Confirming your Pro access…',
        ),
      0,
    );
    let attempts = 0;
    const refresh = async () => {
      attempts += 1;
      await reload();
      if (active && attempts < 3)
        timer = window.setTimeout(() => void refresh(), 1400);
    };
    void refresh();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [reload, th]);

  const open = async (
    action: 'checkout' | 'portal',
    interval?: 'month' | 'year',
  ) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/billing?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, plan: 'pro', interval }),
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(result.error ?? 'Billing unavailable');
      const url = new URL(result.url);
      if (
        !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname) ||
        url.protocol !== 'https:'
      )
        throw new Error('Invalid billing destination');
      location.assign(url.href);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t('Billing unavailable', 'ระบบชำระเงินยังไม่พร้อม'),
      );
      setBusy(false);
    }
  };

  return (
    <div className="billing-controls">
      {needsPayment && (
        <output className="billing-state billing-state-warning">
          <AlertTriangle size={18} />
          <span>
            <b>{t('Payment needs attention', 'การชำระเงินต้องตรวจสอบ')}</b>
            <small>
              {t(
                'Update your payment method in Stripe to restore Pro access.',
                'อัปเดตวิธีชำระเงินใน Stripe เพื่อเปิดสิทธิ์ Pro กลับมา',
              )}
            </small>
          </span>
        </output>
      )}
      {proAccess && subscription.status !== 'owner' && (
        <output className="billing-state billing-state-active">
          <CheckCircle2 size={18} />
          <span>
            <b>{t('Pro is active', 'กำลังใช้ Pro')}</b>
            <small>
              {subscription.cancelAtPeriodEnd
                ? t(
                    'Your access remains active until the end of this billing period.',
                    'สิทธิ์ยังใช้งานได้จนสิ้นสุดรอบบิลนี้',
                  )
                : t(
                    'Your workspace has all Pro capabilities.',
                    'เวิร์กสเปซเปิดความสามารถ Pro ครบแล้ว',
                  )}
            </small>
          </span>
        </output>
      )}
      {canStartCheckout && (
        <div className="billing-upgrade-grid">
          <button
            className="billing-choice"
            disabled={!ready || busy}
            onClick={() => void open('checkout', 'month')}
          >
            <span>{t('Pro monthly', 'Pro รายเดือน')}</span>
            <b>฿129</b>
            <small>
              {t('Flexible monthly billing', 'ยืดหยุ่น ยกเลิกได้ทุกเดือน')}
            </small>
          </button>
          <button
            className="billing-choice recommended"
            disabled={!ready || busy}
            onClick={() => void open('checkout', 'year')}
          >
            <span>{t('Pro yearly', 'Pro รายปี')}</span>
            <b>฿1,290</b>
            <small>
              {t('Save 16.7% · best value', 'ประหยัด 16.7% · คุ้มที่สุด')}
            </small>
          </button>
        </div>
      )}
      <div className="actions billing-actions">
        {canManage && (
          <button
            className="button ghost compact"
            disabled={busy}
            onClick={() => void open('portal')}
          >
            {t('Manage billing', 'จัดการแพ็กเกจและใบเสร็จ')}
          </button>
        )}
        {notice.includes('ยืนยัน') || notice.includes('Confirming') ? (
          <button
            className="button ghost compact"
            disabled={busy}
            onClick={() => void reload()}
          >
            <RefreshCw size={15} />
            {t('Refresh access', 'ตรวจสิทธิ์อีกครั้ง')}
          </button>
        ) : null}
      </div>
      {checked &&
        !ready &&
        mode === 'real' &&
        subscription.status !== 'owner' && (
          <p className="muted-copy mt-4">
            {t(
              'Billing is not enabled in this preview. No payment details are collected.',
              'พรีวิวนี้ยังไม่เปิดชำระเงินจริง และไม่เก็บข้อมูลบัตร',
            )}
          </p>
        )}
      {notice && (
        <output className="billing-result" aria-live="polite">
          {notice}
        </output>
      )}
      {error && (
        <p role="alert" className="negative billing-error">
          {error}
        </p>
      )}
    </div>
  );
}
