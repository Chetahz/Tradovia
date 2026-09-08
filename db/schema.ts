import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
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
});
