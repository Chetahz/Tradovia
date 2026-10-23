import { database } from '@/db';
import { env } from 'cloudflare:workers';
import { effectiveSubscription } from '@/lib/entitlements';
import { demoData, emptyData, type WorkspaceData } from '@/lib/domain';
export async function initialize(id: string, mode: 'demo' | 'real') {
  const db = database();
  if (await db.prepare('SELECT id FROM users WHERE id=?').bind(id).first())
    return;
  const d = mode === 'demo' ? demoData() : emptyData();
  const prefix = id + '|';
  const queries = [
    db
      .prepare('INSERT OR IGNORE INTO users(id,mode,created_at) VALUES(?,?,?)')
      .bind(id, mode, Date.now()),
    db
      .prepare('INSERT OR IGNORE INTO profiles(owner_id,payload) VALUES(?,?)')
      .bind(id, JSON.stringify(d.profile)),
    db
      .prepare(
        'INSERT OR IGNORE INTO subscriptions(owner_id,payload) VALUES(?,?)',
      )
      .bind(id, JSON.stringify(d.subscription)),
  ];
  for (const p of d.portfolios)
    queries.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO portfolios(id,owner_id,payload) VALUES(?,?,?)',
        )
        .bind(prefix + p.id, id, JSON.stringify(p)),
    );
  for (const a of d.accounts)
    queries.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO trading_accounts(id,owner_id,portfolio_id,payload) VALUES(?,?,?,?)',
        )
        .bind(prefix + a.id, id, prefix + a.portfolioId, JSON.stringify(a)),
    );
  for (const t of d.trades)
    queries.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO trades(id,owner_id,account_id,trade_date,payload) VALUES(?,?,?,?,?)',
        )
        .bind(
          prefix + t.id,
          id,
          prefix + t.accountId,
          t.date,
          JSON.stringify(t),
      ),
    );
  for (const playbook of d.playbooks || [])
    queries.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO playbooks(id,owner_id,payload) VALUES(?,?,?)',
        )
        .bind(prefix + playbook.id, id, JSON.stringify(playbook)),
    );
  for (const checkin of d.dailyCheckins || [])
    queries.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO daily_checkins(id,owner_id,checkin_date,payload) VALUES(?,?,?,?)',
        )
        .bind(
          prefix + checkin.date,
          id,
          checkin.date,
          JSON.stringify(checkin),
        ),
    );
  for (const [table, items] of [
    ['goals', d.goals],
    ['rules', d.rules],
  ] as const)
    for (const item of items)
      queries.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO ${table}(id,owner_id,payload) VALUES(?,?,?)`,
          )
          .bind(prefix + item.id, id, JSON.stringify(item)),
      );
  await db.batch(queries);
}
export async function readWorkspace(id: string): Promise<WorkspaceData> {
  const db = database();
  const d = emptyData();
  const tables = [
    ['playbooks', 'playbooks'],
    ['dailyCheckins', 'daily_checkins'],
    ['portfolios', 'portfolios'],
    ['accounts', 'trading_accounts'],
    ['trades', 'trades'],
    ['goals', 'goals'],
    ['rules', 'rules'],
    ['connections', 'broker_connections'],
    ['profile', 'profiles'],
    ['subscription', 'subscriptions'],
  ] as const;
  const results = await db.batch<{ payload: string }>(
    tables.map(([, table]) =>
      db.prepare(`SELECT payload FROM ${table} WHERE owner_id=?`).bind(id),
    ),
  );
  tables.forEach(([key], i) => {
    const rows = results[i].results.map((x) => JSON.parse(x.payload));
    if (key === 'profile' || key === 'subscription') {
      if (rows[0]) Object.assign(d, { [key]: rows[0] });
    } else Object.assign(d, { [key]: rows });
  });
  const ownerSubject = (env as unknown as { AUTH_OWNER_SUBJECT?: string }).AUTH_OWNER_SUBJECT;
  d.subscription = effectiveSubscription(d.subscription, Boolean(ownerSubject) && id === `auth0:${ownerSubject}`);
  return d;
}
