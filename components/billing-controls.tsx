'use client';
import { useEffect, useState } from 'react';
import type { WorkspaceData } from '@/lib/domain';
import type { Translate } from './workspace-ui';
export default function BillingControls({
  mode,
  subscription,
  t,
}: {
  mode: string;
  subscription: WorkspaceData['subscription'];
  t: Translate;
}) {
  const [ready, setReady] = useState(false),
    [canManage, setCanManage] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void fetch(`/api/billing?mode=${mode}`)
      .then((r) => r.json())
      .then((value) => {
        if (active) {
          const status = value as { ready?: boolean; canManage?: boolean };
          setReady(Boolean(status.ready));
          setCanManage(Boolean(status.canManage));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [mode]);
  const open = async (
    action: 'checkout' | 'portal',
    interval?: 'month' | 'year',
  ) => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/billing?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, plan: 'pro', interval }),
      });
      const result = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !result.url)
        throw new Error(result.error ?? 'Billing unavailable');
      const url = new URL(result.url);
      if (
        !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname) ||
        url.protocol !== 'https:'
      )
        throw new Error('Invalid billing destination');
      location.assign(url.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Billing unavailable');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="billing-controls">
      {subscription.plan === 'manual' && (
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
        <button
          className="button ghost compact"
          disabled={!canManage || busy}
          onClick={() => void open('portal')}
        >
          {t('Manage billing', 'จัดการแพ็กเกจ')}
        </button>
      </div>
      {!ready && mode === 'real' && subscription.status !== 'owner' && (
        <p className="muted-copy mt-4">
          {t(
            'Billing is not enabled in this preview. No payment details are collected.',
            'พรีวิวนี้ยังไม่เปิดชำระเงิน และไม่เก็บข้อมูลบัตร',
          )}
        </p>
      )}
      {subscription.cancelAtPeriodEnd && subscription.renewal && (
        <p className="billing-notice">
          {t(
            `Your plan remains active until ${subscription.renewal}.`,
            `แพ็กเกจยังใช้งานได้ถึง ${subscription.renewal}`,
          )}
        </p>
      )}
      {error && (
        <p role="alert" className="negative">
          {error}
        </p>
      )}
    </div>
  );
}
