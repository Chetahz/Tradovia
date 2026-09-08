import { env } from 'cloudflare:workers';
import { database } from '@/db';
import { readBoundedBody } from '@/lib/request-body';
import {
  verifyStripeSignature,
  requireStripe,
  stripeRequest,
  type StripeConfig,
} from '@/lib/stripe';
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
    )
      return Response.json(
        { error: 'Unknown subscription owner' },
        { status: 409 },
      );
    const price = sub.items.data[0]?.price.id;
    const paid = ['active', 'trialing'].includes(sub.status);
    const plan =
      paid && price === config.STRIPE_PRO_PRICE_ID
        ? 'pro'
        : paid && price === config.STRIPE_ELITE_PRICE_ID
          ? 'elite'
          : 'manual';
    const renewal =
      sub.current_period_end ?? sub.items.data[0]?.current_period_end;
    const payload = JSON.stringify({
      plan,
      status: sub.status,
      renewal: renewal ? new Date(renewal * 1000).toISOString() : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
    const writes = [
      db
        .prepare(
          'INSERT INTO subscriptions(owner_id,customer_id,subscription_id,payload) VALUES(?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET customer_id=excluded.customer_id,subscription_id=excluded.subscription_id,payload=excluded.payload',
        )
        .bind(ownerId, sub.customer, sub.id, payload),
      db
        .prepare(
          'INSERT OR IGNORE INTO webhook_events(id,created_at) VALUES(?,?)',
        )
        .bind(event.id, Date.now()),
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
      );
    }
    await db.batch(writes);
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: 'Webhook processing failed; retry required' },
      { status: 500 },
    );
  }
}
