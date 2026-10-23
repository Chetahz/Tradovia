import { env } from 'cloudflare:workers';
import { database, imageBucket } from '@/db';
import { authConfig, type AuthSettings } from '@/lib/auth-core';
import { requireStripe, type StripeConfig } from '@/lib/stripe';

export type OpsCategory = 'api' | 'auth' | 'billing' | 'import' | 'system';
export type OpsSeverity = 'info' | 'warning' | 'error';
export type OpsStatus = 'success' | 'failed' | 'open' | 'resolved';

type OpsEventInput = {
  ownerId?: string | null;
  category: OpsCategory;
  severity: OpsSeverity;
  status: OpsStatus;
  message: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function recordOpsEvent(input: OpsEventInput) {
  const safeMessage = input.message.replace(/\s+/g, ' ').trim().slice(0, 240);
  const metadata = JSON.stringify(input.metadata ?? {}).slice(0, 2000);
  const now = Date.now();
  await database().prepare(
    'INSERT INTO ops_events(id,owner_id,category,severity,status,message,metadata,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',
  ).bind(
    crypto.randomUUID(), input.ownerId ?? null, input.category, input.severity,
    input.status, safeMessage, metadata, now, now,
  ).run();
}

export async function recordAdminAudit(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await database().prepare(
    'INSERT INTO admin_audit_events(id,actor_id,action,target_type,target_id,metadata,created_at) VALUES(?,?,?,?,?,?,?)',
  ).bind(
    crypto.randomUUID(), input.actorId, input.action.slice(0, 80), input.targetType.slice(0, 60),
    input.targetId ?? null, JSON.stringify(input.metadata ?? {}).slice(0, 1600), Date.now(),
  ).run();
}

export type AdminUserRow = {
  id: string; email: string; displayName: string; createdAt: number; sessionExpiresAt: number | null;
  portfolios: number; trades: number; imports: number; images: number; imageBytes: number; supportNotes: number;
  plan: string; subscriptionStatus: string; renewal: string | null; cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean; paidCents: number; paymentCurrency: string;
};
export type AdminEventRow = {
  id: string; ownerId: string | null; category: string; severity: string; status: string; message: string;
  metadata: string; createdAt: number; resolvedAt: number | null; resolutionNote: string;
};
export type AdminSupportNote = { id: string; ownerId: string; actorId: string; note: string; createdAt: number };
export type AdminAuditRow = { id: string; actorId: string; action: string; targetType: string; targetId: string | null; createdAt: number };
export type HealthState = 'operational' | 'configured' | 'attention' | 'not_configured';
export type HealthCheck = { key: string; label: string; state: HealthState; detail: string };

export type AdminDashboardData = {
  generatedAt: number;
  metrics: { customers: number; validSessions: number; trades: number; importedTrades: number; images: number; imageBytes: number; paidSubscriptions: number; openIssues: number };
  billing: { totalCollectedCents: number; currency: string; paymentCount: number; mismatchCount: number; lastWebhookAt: number | null };
  health: HealthCheck[];
  users: AdminUserRow[];
  events: AdminEventRow[];
  notes: AdminSupportNote[];
  audit: AdminAuditRow[];
};

const numeric = (value: unknown) => Number(value ?? 0) || 0;
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : fallback;

function configurationHealth() {
  const values = env as unknown as AuthSettings & StripeConfig;
  let auth: HealthCheck;
  let stripe: HealthCheck;
  try {
    authConfig(values);
    auth = { key: 'auth0', label: 'Auth0', state: 'configured', detail: 'ตั้งค่าครบ · ตรวจการใช้งานจริงจากเซสชัน' };
  } catch {
    auth = { key: 'auth0', label: 'Auth0', state: 'not_configured', detail: 'การตั้งค่ายังไม่ครบ' };
  }
  try {
    requireStripe(values);
    stripe = { key: 'stripe', label: 'Stripe Billing', state: 'configured', detail: 'Secret และราคาครบ · ยังไม่ใช่การ ping Stripe' };
  } catch {
    stripe = { key: 'stripe', label: 'Stripe Billing', state: 'not_configured', detail: 'ยังไม่เปิดรับเงินจริง' };
  }
  return { auth, stripe };
}

export async function readAdminDashboard(): Promise<AdminDashboardData> {
  const db = database();
  const now = Date.now();
  const configured = configurationHealth();
  let r2: HealthCheck;
  try {
    await imageBucket().list({ limit: 1 });
    r2 = { key: 'r2', label: 'Cloudflare R2', state: 'operational', detail: 'อ่านรายการไฟล์จาก bucket สำเร็จ' };
  } catch {
    r2 = { key: 'r2', label: 'Cloudflare R2', state: 'attention', detail: 'ตรวจ bucket ไม่สำเร็จ' };
  }

  const metrics = await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE mode='real') AS customers,
      (SELECT COUNT(DISTINCT subject) FROM auth_sessions WHERE expires_at>?) AS valid_sessions,
      (SELECT COUNT(*) FROM trades t JOIN users u ON u.id=t.owner_id WHERE u.mode='real') AS trades,
      (SELECT COUNT(*) FROM trades t JOIN users u ON u.id=t.owner_id WHERE u.mode='real' AND json_extract(t.payload,'$.importRef') IS NOT NULL) AS imported_trades,
      (SELECT COUNT(*) FROM trade_images i JOIN users u ON u.id=i.owner_id WHERE u.mode='real') AS images,
      (SELECT COALESCE(SUM(i.size),0) FROM trade_images i JOIN users u ON u.id=i.owner_id WHERE u.mode='real') AS image_bytes,
      (SELECT COUNT(*) FROM subscriptions s JOIN users u ON u.id=s.owner_id WHERE u.mode='real' AND json_extract(s.payload,'$.status') IN ('active','trialing')) AS paid_subscriptions,
      (SELECT COUNT(*) FROM ops_events WHERE status IN ('failed','open')) AS open_issues
  `).bind(now).first<Record<string, unknown>>();

  const users = await db.prepare(`
    SELECT u.id, u.created_at,
      COALESCE(MAX(s.email),'') AS email, COALESCE(MAX(s.display_name),'Trader') AS display_name,
      MAX(s.expires_at) AS session_expires_at,
      (SELECT COUNT(*) FROM portfolios p WHERE p.owner_id=u.id) AS portfolios,
      (SELECT COUNT(*) FROM trades t WHERE t.owner_id=u.id) AS trades,
      (SELECT COUNT(*) FROM trades t WHERE t.owner_id=u.id AND json_extract(t.payload,'$.importRef') IS NOT NULL) AS imports,
      (SELECT COUNT(*) FROM trade_images i WHERE i.owner_id=u.id) AS images,
      (SELECT COALESCE(SUM(i.size),0) FROM trade_images i WHERE i.owner_id=u.id) AS image_bytes,
      (SELECT COUNT(*) FROM customer_support_notes n WHERE n.owner_id=u.id) AS support_notes,
      COALESCE((SELECT json_extract(x.payload,'$.plan') FROM subscriptions x WHERE x.owner_id=u.id),'manual') AS plan,
      COALESCE((SELECT json_extract(x.payload,'$.status') FROM subscriptions x WHERE x.owner_id=u.id),'inactive') AS subscription_status,
      (SELECT json_extract(x.payload,'$.renewal') FROM subscriptions x WHERE x.owner_id=u.id) AS renewal,
      COALESCE((SELECT json_extract(x.payload,'$.cancelAtPeriodEnd') FROM subscriptions x WHERE x.owner_id=u.id),0) AS cancel_at_period_end,
      CASE WHEN (SELECT x.customer_id FROM subscriptions x WHERE x.owner_id=u.id) IS NULL THEN 0 ELSE 1 END AS has_stripe_customer,
      (SELECT COALESCE(SUM(p.amount_cents),0) FROM payments p WHERE p.owner_id=u.id) AS paid_cents,
      COALESCE((SELECT p.currency FROM payments p WHERE p.owner_id=u.id ORDER BY rowid DESC LIMIT 1),'THB') AS payment_currency
    FROM users u LEFT JOIN auth_sessions s ON ('auth0:' || s.subject)=u.id
    WHERE u.mode='real' GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200
  `).all<Record<string, unknown>>();

  const events = await db.prepare(`
    SELECT id,owner_id,category,severity,status,message,metadata,created_at,resolved_at,resolution_note
    FROM ops_events ORDER BY created_at DESC LIMIT 160
  `).all<Record<string, unknown>>();
  const notes = await db.prepare(`
    SELECT id,owner_id,actor_id,note,created_at FROM customer_support_notes ORDER BY created_at DESC LIMIT 200
  `).all<Record<string, unknown>>();
  const audit = await db.prepare(`
    SELECT id,actor_id,action,target_type,target_id,created_at FROM admin_audit_events ORDER BY created_at DESC LIMIT 80
  `).all<Record<string, unknown>>();
  const billing = await db.prepare(`
    SELECT
      (SELECT COALESCE(SUM(amount_cents),0) FROM payments) AS total_collected_cents,
      (SELECT COALESCE(currency,'THB') FROM payments ORDER BY rowid DESC LIMIT 1) AS currency,
      (SELECT COUNT(*) FROM payments) AS payment_count,
      (SELECT COUNT(*) FROM subscriptions WHERE
        (json_extract(payload,'$.status') IN ('active','trialing') AND subscription_id IS NULL)
        OR (json_extract(payload,'$.plan') IN ('pro','elite') AND json_extract(payload,'$.status') NOT IN ('active','trialing'))
      ) AS mismatch_count,
      (SELECT MAX(created_at) FROM webhook_events) AS last_webhook_at
  `).first<Record<string, unknown>>();

  return {
    generatedAt: now,
    metrics: {
      customers: numeric(metrics?.customers), validSessions: numeric(metrics?.valid_sessions), trades: numeric(metrics?.trades),
      importedTrades: numeric(metrics?.imported_trades), images: numeric(metrics?.images), imageBytes: numeric(metrics?.image_bytes),
      paidSubscriptions: numeric(metrics?.paid_subscriptions), openIssues: numeric(metrics?.open_issues),
    },
    billing: {
      totalCollectedCents: numeric(billing?.total_collected_cents), currency: text(billing?.currency, 'THB').toUpperCase(),
      paymentCount: numeric(billing?.payment_count), mismatchCount: numeric(billing?.mismatch_count),
      lastWebhookAt: billing?.last_webhook_at == null ? null : numeric(billing.last_webhook_at),
    },
    health: [
      { key: 'd1', label: 'Cloudflare D1', state: 'operational', detail: 'อ่านฐานข้อมูลและสรุปผลสำเร็จ' },
      r2, configured.auth, configured.stripe,
      { key: 'mfa', label: 'Admin MFA', state: 'attention', detail: 'ควรบังคับ MFA ที่ Auth0 ก่อนเพิ่มผู้ดูแลคนอื่น' },
    ],
    users: users.results.map((row) => ({
      id: text(row.id), email: text(row.email), displayName: text(row.display_name, 'Trader'), createdAt: numeric(row.created_at),
      sessionExpiresAt: row.session_expires_at == null ? null : numeric(row.session_expires_at), portfolios: numeric(row.portfolios),
      trades: numeric(row.trades), imports: numeric(row.imports), images: numeric(row.images), imageBytes: numeric(row.image_bytes),
      supportNotes: numeric(row.support_notes), plan: text(row.plan, 'manual'), subscriptionStatus: text(row.subscription_status, 'inactive'),
      renewal: row.renewal == null ? null : text(row.renewal), cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
      hasStripeCustomer: Boolean(row.has_stripe_customer), paidCents: numeric(row.paid_cents), paymentCurrency: text(row.payment_currency, 'THB').toUpperCase(),
    })),
    events: events.results.map((row) => ({
      id: text(row.id), ownerId: row.owner_id == null ? null : text(row.owner_id), category: text(row.category), severity: text(row.severity),
      status: text(row.status), message: text(row.message), metadata: text(row.metadata, '{}'), createdAt: numeric(row.created_at),
      resolvedAt: row.resolved_at == null ? null : numeric(row.resolved_at), resolutionNote: text(row.resolution_note),
    })),
    notes: notes.results.map((row) => ({ id: text(row.id), ownerId: text(row.owner_id), actorId: text(row.actor_id), note: text(row.note), createdAt: numeric(row.created_at) })),
    audit: audit.results.map((row) => ({ id: text(row.id), actorId: text(row.actor_id), action: text(row.action), targetType: text(row.target_type), targetId: row.target_id == null ? null : text(row.target_id), createdAt: numeric(row.created_at) })),
  };
}
