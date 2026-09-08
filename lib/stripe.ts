export type StripeConfig = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRO_PRICE_ID?: string;
  STRIPE_ELITE_PRICE_ID?: string;
  APP_ORIGIN?: string;
};
export function requireStripe(c: StripeConfig) {
  if (
    !c.STRIPE_SECRET_KEY ||
    !c.STRIPE_WEBHOOK_SECRET ||
    !c.APP_ORIGIN ||
    !c.STRIPE_PRO_PRICE_ID ||
    !c.STRIPE_ELITE_PRICE_ID
  )
    throw new Error('Stripe is not configured');
  const url = new URL(c.APP_ORIGIN);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost')
    throw new Error('Invalid application origin');
  return c as Required<StripeConfig>;
}
export async function stripeRequest<T>(
  config: Required<StripeConfig>,
  path: string,
  params?: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${config.STRIPE_SECRET_KEY}`,
      'Stripe-Version': '2025-02-24.acacia',
      ...(params
        ? { 'Content-Type': 'application/x-www-form-urlencoded' }
        : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: params?.toString(),
  });
  if (!r.ok) throw new Error('Payment provider request failed');
  return (await r.json()) as T;
}
export async function verifyStripeSignature(
  raw: string,
  header: string | null,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  if (!header) throw new Error('Missing Stripe signature');
  const parts = header.split(',').map((x) => x.split('='));
  const timestamp = parts.find((x) => x[0] === 't')?.[1];
  if (
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > 300
  )
    throw new Error('Expired Stripe signature');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  for (const [, hex] of parts.filter((x) => x[0] === 'v1')) {
    if (!/^[a-f0-9]{64}$/i.test(hex ?? '')) continue;
    const sig = Uint8Array.from(hex.match(/../g)!, (x) => parseInt(x, 16));
    if (
      await crypto.subtle.verify(
        'HMAC',
        key,
        sig,
        new TextEncoder().encode(`${timestamp}.${raw}`),
      )
    )
      return;
  }
  throw new Error('Invalid Stripe signature');
}
