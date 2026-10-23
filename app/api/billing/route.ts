import { env } from 'cloudflare:workers';
import { database } from '@/db';
import { owner, checkOrigin, ApiError, apiFailure } from '@/lib/server-auth';
import { initialize } from '@/lib/repository';
import { requireStripe, stripeRequest, type StripeConfig } from '@/lib/stripe';
export async function GET(request: Request) {
  try {
    const who = await owner(request);
    let ready = false;
    try {
      requireStripe(env as unknown as StripeConfig);
      ready = who.mode === 'real' && who.role !== 'owner';
    } catch {
      /* Not configured. */
    }
    const billing =
      who.mode === 'real'
        ? await database()
            .prepare('SELECT customer_id FROM subscriptions WHERE owner_id=?')
            .bind(who.id)
            .first<{ customer_id: string | null }>()
        : null;
    return Response.json(
      { ready, canManage: ready && Boolean(billing?.customer_id) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const who = await owner(request);
    if (who.mode === 'demo')
      throw new ApiError(403, 'Billing is unavailable in the demo');
    if (who.role === 'owner')
      throw new ApiError(
        403,
        'Owner access is included. No subscription purchase is needed.',
      );
    let config: ReturnType<typeof requireStripe>;
    try {
      config = requireStripe(env as unknown as StripeConfig);
    } catch {
      throw new ApiError(
        503,
        'Stripe is not configured. No payment was created.',
      );
    }
    await initialize(who.id, who.mode);
    const body = (await request.json()) as {
      action?: string;
      plan?: string;
      interval?: string;
    };
    const row = await database()
      .prepare(
        'SELECT customer_id,subscription_id,payload FROM subscriptions WHERE owner_id=?',
      )
      .bind(who.id)
      .first<{
        customer_id: string | null;
        subscription_id: string | null;
        payload: string;
      }>();
    if (body.action === 'portal') {
      if (!row?.customer_id)
        throw new ApiError(409, 'No billing account exists');
      const r = await stripeRequest<{ url: string }>(
        config,
        'billing_portal/sessions',
        new URLSearchParams({
          customer: row.customer_id,
          return_url: config.APP_ORIGIN + '/workspace#settings',
        }),
      );
      return Response.json({ url: r.url });
    }
    if (
      body.action !== 'checkout' ||
      body.plan !== 'pro' ||
      !['month', 'year'].includes(body.interval ?? '')
    )
      throw new ApiError(400, 'Invalid billing request');
    if (
      row?.subscription_id &&
      ['active', 'trialing', 'past_due'].includes(
        JSON.parse(row.payload).status,
      )
    )
      throw new ApiError(
        409,
        'Use the billing portal to change your existing subscription',
      );
    const price =
      body.interval === 'year'
        ? config.proAnnualPriceId
        : config.proMonthlyPriceId;
    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': price,
      'line_items[0][quantity]': '1',
      success_url: config.APP_ORIGIN + '/workspace#settings',
      cancel_url: config.APP_ORIGIN + '/workspace#settings',
      client_reference_id: who.id,
      'subscription_data[metadata][owner_id]': who.id,
      'subscription_data[metadata][plan]': 'pro',
      'subscription_data[metadata][interval]': body.interval!,
    });
    if (row?.customer_id) params.set('customer', row.customer_id);
    const r = await stripeRequest<{ url: string }>(
      config,
      'checkout/sessions',
      params,
      `${who.id}:pro:${body.interval}:${Math.floor(Date.now() / 600000)}`,
    );
    return Response.json({ url: r.url });
  } catch (e) {
    return apiFailure(e);
  }
}
