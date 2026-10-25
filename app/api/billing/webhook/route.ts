import { env } from 'cloudflare:workers';
import { database } from '@/db';
import { readBoundedBody } from '@/lib/request-body';
import {
  verifyStripeSignature,
  requireStripe,
  stripeRequest,
  type StripeConfig,
} from '@/lib/stripe';
import { recordOpsEvent } from '@/lib/admin';
type Subscription = {
  id: string;
  customer: string;
  status: string;
  metadata: { owner_id?: string; plan?: string };
  cancel_at_period_end: boolean;
  current_period_end?: number;
  items: { data: { price: { id: string }; current_period_end?: number }[] };
};
export async function POST(request: Request) {
  let config: ReturnType<typeof requireStripe>;
  try {
    config = requireStripe(env as unknown as StripeConfig);
  } catch {
    return Response.json(
      { error: 'Billing is not configured' },
      { status: 503 },
    );
  }
  let raw: string;
  try {
    raw = new TextDecoder().decode(await readBoundedBody(request, 1000000));
  } catch {
    return new Response(null, { status: 413 });
  }
  try {
    await verifyStripeSignature(
      raw,
      request.headers.get('stripe-signature'),
      config.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return Response.json(
      { error: 'Invalid webhook signature' },
      { status: 400 },
    );
  }
  try {
    const event = JSON.parse(raw) as {
      id: string;
      type: string;
      data: { object: { id: string; subscription?: string } };
    };
    if (!event.id) return new Response(null, { status: 400 });
    const db = database();
    if (
      await db
        .prepare('SELECT id FROM webhook_events WHERE id=?')
        .bind(event.id)
        .first()
    )
      return Response.json({ received: true });
    const supported = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'checkout.session.completed',
      'invoice.paid',
      'invoice.payment_failed',
    ];
    if (!supported.includes(event.type))
      return Response.json({ received: true });
    const subscriptionId = event.type.startsWith('customer.subscription.')
      ? event.data.object.id
      : event.data.object.subscription;
    if (!subscriptionId) return Response.json({ received: true });
    // Fetch current provider state instead of trusting event ordering or client redirects.
    const sub = await stripeRequest<Subscription>(
      config,
      `subscriptions/${encodeURIComponent(subscriptionId)}`,
    );
    const ownerId = sub.metadata.owner_id;
    if (
      !ownerId ||
      !(await db
        .prepare('SELECT id FROM users WHERE id=? AND mode=?')
        .bind(ownerId, 'real')
        .first())
    ) {
      await recordOpsEvent({
        category: 'billing',
        severity: 'warning',
        status: 'open',
        message: 'Stripe webhook อ้างถึงบัญชีที่ไม่พบใน Tradovia',
        metadata: { eventType: event.type },
      }).catch(() => undefined);
      return Response.json(
        { error: 'Unknown subscription owner' },
        { status: 409 },
      );
    }
    const price = sub.items.data[0]?.price.id;
    const paid = ['active', 'trialing'].includes(sub.status);
    const plan =
      paid &&
      [config.proMonthlyPriceId, config.proAnnualPriceId].includes(price)
        ? 'pro'
        : paid && config.elitePriceId && price === config.elitePriceId
          ? 'elite'
          : 'manual';
    const interval =
      price === config.proAnnualPriceId
        ? 'year'
        : price === config.proMonthlyPriceId
          ? 'month'
          : null;
    const renewal =
      sub.current_period_end ?? sub.items.data[0]?.current_period_end;
    const payload = JSON.stringify({
      plan,
      status: sub.status,
      renewal: renewal ? new Date(renewal * 1000).toISOString() : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      interval,
    });
    const writes = [
      db
        .prepare(
          'INSERT INTO subscriptions(owner_id,customer_id,subscription_id,payload) VALUES(?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET customer_id=excluded.customer_id,subscription_id=excluded.subscription_id,payload=excluded.payload',
        )
        .bind(ownerId, sub.customer, sub.id, payload),
      db
        .prepare(
          'INSERT OR IGNORE INTO webhook_events(id,created_at,event_type,status) VALUES(?,?,?,?)',
        )
        .bind(event.id, Date.now(), event.type, 'processed'),
    ];
    if (event.type === 'invoice.paid') {
      const invoice = await stripeRequest<{
        id: string;
        amount_paid: number;
        currency: string;
        status: string;
      }>(config, `invoices/${encodeURIComponent(event.data.object.id)}`);
      if (!Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid < 0)
        throw new Error('Invalid invoice amount');
      writes.push(
        db
          .prepare(
            'INSERT OR IGNORE INTO payments(id,owner_id,payload,provider_event_id,amount_cents,currency) VALUES(?,?,?,?,?,?)',
          )
          .bind(
            invoice.id,
            ownerId,
            JSON.stringify({ invoiceId: invoice.id, status: invoice.status }),
            event.id,
            invoice.amount_paid,
            invoice.currency,
          ),
        db
          .prepare(
            'INSERT INTO notifications(id,owner_id,type,title,body,link,created_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            ownerId,
            'billing_paid',
            'ชำระเงินเรียบร้อยแล้ว',
            'สิทธิ์ Pro และใบเสร็จของคุณได้รับการอัปเดตแล้ว',
            '#settings',
            Date.now(),
          ),
      );
    }
    if (event.type === 'invoice.payment_failed')
      writes.push(
        db
          .prepare(
            'INSERT INTO notifications(id,owner_id,type,title,body,link,created_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            ownerId,
            'billing_failed',
            'การชำระเงินไม่สำเร็จ',
            'ตรวจสอบวิธีชำระเงินเพื่อเปิดสิทธิ์ Pro ให้ต่อเนื่อง',
            '#settings',
            Date.now(),
          ),
      );
    if (event.type === 'customer.subscription.deleted')
      writes.push(
        db
          .prepare(
            'INSERT INTO notifications(id,owner_id,type,title,body,link,created_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            ownerId,
            'billing_cancelled',
            'แพ็กเกจ Pro สิ้นสุดแล้ว',
            'บัญชีเปลี่ยนกลับมาใช้สิทธิ์ Free และข้อมูลเดิมยังอยู่ครบ',
            '#settings',
            Date.now(),
          ),
      );
    await db.batch(writes);
    if (event.type === 'invoice.payment_failed') {
      await recordOpsEvent({
        ownerId,
        category: 'billing',
        severity: 'error',
        status: 'open',
        message: 'การชำระเงินไม่สำเร็จและต้องติดตาม',
        metadata: { eventType: event.type },
      }).catch(() => undefined);
    }
    return Response.json({ received: true });
  } catch (error) {
    await recordOpsEvent({
      category: 'billing',
      severity: 'error',
      status: 'failed',
      message: 'ประมวลผล Stripe webhook ไม่สำเร็จ',
      metadata: {
        reason:
          error instanceof Error ? error.message.slice(0, 120) : 'unknown',
      },
    }).catch(() => undefined);
    return Response.json(
      { error: 'Webhook processing failed; retry required' },
      { status: 500 },
    );
  }
}
