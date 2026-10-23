import type { Connection, Trade } from '../lib/domain.ts';
import { effectiveSubscription } from '../lib/entitlements.ts';
import { positionFromMetaApiDeals, closedPositionIds, type MetaApiDeal } from '../lib/metaapi-import.ts';
import { mt5Trade } from '../lib/mt5-sync.ts';

type Env = { DB: D1Database; METAAPI_TOKEN?: string; AUTH_OWNER_SUBJECT?: string };
const provisioning = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const client = 'https://mt-client-api-v1.new-york.agiliumtrade.ai';
const earliest = '2000-01-01T00:00:00.000Z';

async function provider<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { 'auth-token': token, Accept: 'application/json' }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`MetaApi HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function addYear(value: string) {
  const d = new Date(value);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString();
}

async function dealsForRange(token: string, providerId: string, from: string, to: string) {
  const all: MetaApiDeal[] = [];
  for (let offset = 0; offset <= 10_000; offset += 1000) {
    const path = `/users/current/accounts/${providerId}/history-deals/time/${encodeURIComponent(from)}/${encodeURIComponent(to)}?offset=${offset}&limit=1000`;
    const page = await provider<MetaApiDeal[]>(client + path, token);
    if (!Array.isArray(page)) throw new Error('Invalid MetaApi deal page');
    all.push(...page);
    if (page.length < 1000) return all;
  }
  throw new Error('Too many MT5 deals in a backfill window');
}

async function fullPosition(token: string, providerId: string, positionId: string) {
  return provider<MetaApiDeal[]>(`${client}/users/current/accounts/${providerId}/history-deals/position/${positionId}`, token);
}

async function updateConnection(db: D1Database, ownerId: string, c: Connection) {
  await db.prepare('UPDATE broker_connections SET payload=? WHERE id=? AND owner_id=?')
    .bind(JSON.stringify(c), `${ownerId}|${c.id}`, ownerId).run();
}

async function syncOne(db: D1Database, token: string, ownerId: string, original: Connection, ownerSubject?: string) {
  const checkedAt = new Date().toISOString();
  let c: Connection = { ...original, checkedAt };
  try {
    const subscriptionRow = await db.prepare('SELECT payload FROM subscriptions WHERE owner_id=?')
      .bind(ownerId).first<{ payload: string }>();
    const subscription = subscriptionRow?.payload ? JSON.parse(subscriptionRow.payload) as Parameters<typeof effectiveSubscription>[0] : null;
    const entitled = subscription && effectiveSubscription(subscription, Boolean(ownerSubject) && ownerId === `auth0:${ownerSubject}`);
    if (!entitled || !['pro', 'elite'].includes(entitled.plan)) {
      c.status = 'error'; c.error = 'MT5 sync is paused because the paid plan is inactive.'; return;
    }
    const remote = await provider<{ login?: string; server?: string; connectionStatus?: string; state?: string; region?: string }>(
      `${provisioning}/users/current/accounts/${c.metaapiId}`, token);
    c.login = remote.login || null;
    c.server = remote.server || c.server;
    if ((original.login && remote.login && original.login !== remote.login) ||
        (original.login && original.server && remote.server && original.server !== remote.server)) {
      c.status = 'error'; c.error = 'MT5 account number changed. Disconnect and create a new connection.'; return;
    }
    if (!remote.login) { c.status = 'not_configured'; c.error = null; return; }
    if (remote.connectionStatus !== 'CONNECTED') {
      c.status = 'error'; c.error = 'MetaApi is waiting for the broker connection. Check the investor password and exact server.'; return;
    }
    if (remote.region !== 'vint-hill') {
      c.status = 'error'; c.error = 'This MetaApi region needs API endpoint configuration.'; return;
    }
    c.status = 'connected'; c.error = null;
    const now = new Date().toISOString();
    let cursor = c.syncCursor || earliest;
    // Backfill two one-year windows per run. Once caught up, recheck the last 48h for late broker updates.
    if (Date.parse(cursor) > Date.now() - 30 * 60_000)
      cursor = new Date(Date.now() - 30 * 60_000).toISOString();
    for (let window = 0; window < 2 && cursor < now; window++) {
      const end = addYear(cursor) < now ? addYear(cursor) : now;
      const deals = await dealsForRange(token, c.metaapiId!, cursor, end);
      const rows = await db.prepare('SELECT payload FROM trades WHERE owner_id=? AND account_id=?')
        .bind(ownerId, `${ownerId}|${c.accountId}`).all<{ payload: string }>();
      const existingTrades = rows.results.map(r => JSON.parse(r.payload) as Trade);
      const existing = new Set(existingTrades.filter(t => t.importRef?.format === 'MT5').map(t => t.importRef!.positionId));
      const byPosition = new Map<string, MetaApiDeal[]>();
      for (const deal of deals) {
        if (!deal.positionId || !/^\d{1,20}$/.test(deal.positionId)) continue;
        byPosition.set(deal.positionId, [...(byPosition.get(deal.positionId) || []), deal]);
      }
      const inserts: D1PreparedStatement[] = [];
      for (const positionId of closedPositionIds(deals)) {
        if (existing.has(positionId)) continue;
        let position = positionFromMetaApiDeals(byPosition.get(positionId) || []);
        if (!position) position = positionFromMetaApiDeals(await fullPosition(token, c.metaapiId!, positionId));
        if (!position) continue; // Open partial position or unsupported reversal.
        if (existingTrades.length + inserts.length >= 5000) throw new Error('Journal trade limit reached');
        const id = `mt5_${c.id.replaceAll('-', '')}_${positionId}`;
        const trade = mt5Trade(position, c.accountId, id);
        inserts.push(db.prepare('INSERT INTO trades(id,owner_id,account_id,trade_date,payload) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
          .bind(`${ownerId}|${id}`, ownerId, `${ownerId}|${c.accountId}`, trade.date, JSON.stringify(trade)));
        existing.add(positionId);
      }
      for (let i = 0; i < inserts.length; i += 50) await db.batch(inserts.slice(i, i + 50));
      cursor = end;
      c = { ...c, syncCursor: cursor, lastSync: new Date().toISOString(), error: null };
      await updateConnection(db, ownerId, c);
    }
  } catch (error) {
    c.status = 'error';
    c.error = error instanceof Error && error.message === 'Journal trade limit reached'
      ? error.message : 'MT5 cloud sync failed. It will retry automatically.';
  } finally { await updateConnection(db, ownerId, c); }
}

const worker = {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (!env.METAAPI_TOKEN) return;
    const rows = await env.DB.prepare("SELECT owner_id,payload FROM broker_connections WHERE json_extract(payload,'$.provider')='metaapi' AND json_extract(payload,'$.metaapiId') IS NOT NULL AND json_extract(payload,'$.status')!='disconnected' ORDER BY COALESCE(json_extract(payload,'$.checkedAt'),'') ASC LIMIT 20")
      .all<{ owner_id: string; payload: string }>();
    ctx.waitUntil((async () => {
      for (const row of rows.results) await syncOne(env.DB, env.METAAPI_TOKEN!, row.owner_id, JSON.parse(row.payload) as Connection, env.AUTH_OWNER_SUBJECT);
    })());
  },
};

export default worker;
