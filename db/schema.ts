import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
export const authSessions = sqliteTable('auth_sessions', {
  id: text('id').primaryKey(),
  subject: text('subject').notNull(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (t) => [index('auth_sessions_expiry').on(t.expiresAt)]);
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  mode: text('mode').notNull(),
  createdAt: integer('created_at').notNull(),
});
export const profiles = sqliteTable('profiles', {
  ownerId: text('owner_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  payload: text('payload').notNull(),
});
const owned = () => ({
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  payload: text('payload').notNull(),
});
export const portfolios = sqliteTable('portfolios', owned(), (t) => [
  index('portfolio_owner').on(t.ownerId),
]);
export const playbooks = sqliteTable('playbooks', owned(), (t) => [index('playbook_owner').on(t.ownerId)]);
export const dailyCheckins = sqliteTable('daily_checkins', {
  ...owned(),
  date: text('checkin_date').notNull(),
}, (t) => [index('daily_checkin_owner_date').on(t.ownerId, t.date)]);
export const accounts = sqliteTable(
  'trading_accounts',
  {
    ...owned(),
    portfolioId: text('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
  },
  (t) => [index('account_owner').on(t.ownerId)],
);
export const trades = sqliteTable(
  'trades',
  {
    ...owned(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    date: text('trade_date').notNull(),
  },
  (t) => [index('trade_owner_date').on(t.ownerId, t.date)],
);
export const images = sqliteTable(
  'trade_images',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    objectKey: text('object_key').notNull(),
    mime: text('mime').notNull(),
    size: integer('size').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('image_owner').on(t.ownerId)],
);
export const goals = sqliteTable('goals', owned(), (t) => [
  index('goal_owner').on(t.ownerId),
]);
export const rules = sqliteTable('rules', owned(), (t) => [
  index('rule_owner').on(t.ownerId),
]);
export const brokerConnections = sqliteTable(
  'broker_connections',
  {
    ...owned(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
  },
  (t) => [index('connection_owner').on(t.ownerId)],
);
export const mt5Credentials = sqliteTable('mt5_credentials', {
  connectionId: text('connection_id').primaryKey().references(() => brokerConnections.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  login: text('login'),
  server: text('server'),
  createdAt: integer('created_at').notNull(),
}, (t) => [uniqueIndex('mt5_credentials_token').on(t.tokenHash), index('mt5_credentials_owner').on(t.ownerId)]);
export const subscriptions = sqliteTable('subscriptions', {
  ownerId: text('owner_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  customerId: text('customer_id'),
  subscriptionId: text('subscription_id'),
  payload: text('payload').notNull(),
});
export const payments = sqliteTable(
  'payments',
  {
    ...owned(),
    providerEventId: text('provider_event_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull(),
  },
  (t) => [
    uniqueIndex('payment_event_unique').on(t.providerEventId),
    index('payment_owner').on(t.ownerId),
  ],
);
export const webhookEvents = sqliteTable('webhook_events', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull(),
  eventType: text('event_type'),
  status: text('status'),
});
export const opsEvents = sqliteTable('ops_events', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id'),
  category: text('category').notNull(),
  severity: text('severity').notNull(),
  status: text('status').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata').notNull(),
  createdAt: integer('created_at').notNull(),
  resolvedAt: integer('resolved_at'),
  resolutionNote: text('resolution_note'),
  updatedAt: integer('updated_at'),
}, (t) => [
  index('ops_events_created').on(t.createdAt),
  index('ops_events_owner').on(t.ownerId, t.createdAt),
  index('ops_events_category_status').on(t.category, t.status, t.createdAt),
]);
export const customerSupportNotes = sqliteTable('customer_support_notes', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').notNull(),
  note: text('note').notNull(),
  createdAt: integer('created_at').notNull(),
}, (t) => [index('support_notes_owner_created').on(t.ownerId, t.createdAt)]);
export const adminAuditEvents = sqliteTable('admin_audit_events', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  metadata: text('metadata').notNull(),
  createdAt: integer('created_at').notNull(),
}, (t) => [
  index('admin_audit_created').on(t.createdAt),
  index('admin_audit_actor').on(t.actorId, t.createdAt),
]);
