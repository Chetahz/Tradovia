'use client';
import { useEffect, useState } from 'react';
import type { Translate } from './workspace-ui';
export default function BillingControls({
  mode,
  t,
}: {
  mode: string;
  t: Translate;
}) {
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void fetch(`/api/billing?mode=${mode}`)
      .then((r) => r.json())
      .then((value) => {
        if (active) setReady((value as { ready: boolean }).ready);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [mode]);
  const open = async (action: string, plan?: string) => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/billing?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, plan }),
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
      <div className="actions">
        <button
          className="button ghost compact"
          disabled={!ready || busy}
          onClick={() => void open('checkout', 'pro')}
        >
          {t('Upgrade to Pro', 'อัปเกรดเป็น Pro')}
        </button>
        <button
          className="button ghost compact"
          disabled={!ready || busy}
          onClick={() => void open('checkout', 'elite')}
        >
          {t('Upgrade to Elite', 'อัปเกรดเป็น Elite')}
        </button>
        <button
          className="button ghost compact"
          disabled={!ready || busy}
          onClick={() => void open('portal')}
        >
          {t('Manage billing', 'จัดการแพ็กเกจ')}
        </button>
      </div>
      {!ready && (
        <p className="muted-copy mt-4">
          {t(
            'Billing is not enabled in this preview. No payment details are collected.',
            'พรีวิวนี้ยังไม่เปิดชำระเงิน และไม่เก็บข้อมูลบัตร',
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
