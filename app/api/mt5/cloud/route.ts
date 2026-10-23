import { env } from 'cloudflare:workers';
import { database } from '@/db';
import type { Connection } from '@/lib/domain';
import { createMetaApiDraft, deleteMetaApiAccount, MetaApiError, metaApiConfigurationLink, readMetaApiAccount, validMt5Server } from '@/lib/metaapi';
import { readBoundedBody } from '@/lib/request-body';
import { initialize, readWorkspace } from '@/lib/repository';
import { owner, checkOrigin, apiFailure, ApiError } from '@/lib/server-auth';

function token() { return (env as unknown as { METAAPI_TOKEN?: string }).METAAPI_TOKEN?.trim() || ''; }
function enabled() { return Boolean(token()) && (env as unknown as { MT5_CLOUD_ENABLED?: string }).MT5_CLOUD_ENABLED === 'true'; }
const headers = { 'Cache-Control': 'no-store' };

async function context(request: Request) {
  const who = await owner(request);
  if (who.mode !== 'real') throw new ApiError(403, 'Sign in to connect MT5');
  await initialize(who.id, who.mode);
  const data = await readWorkspace(who.id);
  if (!['pro', 'elite'].includes(data.subscription.plan)) throw new ApiError(403, 'MT5 sync requires Pro or Elite');
  return { who, data, db: database() };
}

export async function GET(request: Request) {
  try {
    const { data } = await context(request);
    return Response.json({ configured: enabled(), connections: data.connections.filter(c => c.provider === 'metaapi') }, { headers });
  } catch (error) { return apiFailure(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { who, data, db } = await context(request);
    const apiToken = token();
    if (!enabled()) throw new ApiError(503, 'Cloud MT5 sync is not ready yet');
    const body = JSON.parse(new TextDecoder().decode(await readBoundedBody(request, 2048)));
    const prefix = `${who.id}|`;
    if (body.action === 'create') {
      const account = data.accounts.find(a => a.id === body.accountId);
      if (!account) throw new ApiError(404, 'Journal account not found');
      if (!validMt5Server(body.server)) throw new ApiError(400, 'Enter the exact MT5 server name');
      if (data.connections.some(c => c.accountId === account.id && c.provider === 'metaapi' && c.status !== 'disconnected'))
        throw new ApiError(409, 'This journal account already has an MT5 connection');
      const id = crypto.randomUUID();
      const connection: Connection = { id, accountId: account.id, provider: 'metaapi', status: 'not_configured',
        server: body.server.trim(), lastSync: null, error: null, metaapiTransactionId: crypto.randomUUID().replaceAll('-', ''), provisioning: true };
      await db.prepare('INSERT INTO broker_connections(id,owner_id,account_id,payload) VALUES(?,?,?,?)')
        .bind(prefix + id, who.id, prefix + account.id, JSON.stringify(connection)).run();
      return provision(db, who.id, connection, apiToken, account.name);
    }
    const c = data.connections.find(item => item.id === body.connectionId && item.provider === 'metaapi' && item.status !== 'disconnected');
    if (!c) throw new ApiError(404, 'MT5 connection not found');
    if (body.action === 'resume') {
      if (!c.provisioning || !c.metaapiTransactionId || !c.server) throw new ApiError(409, 'MT5 setup is not pending');
      const account = data.accounts.find(a => a.id === c.accountId);
      if (!account) throw new ApiError(404, 'Journal account not found');
      return provision(db, who.id, c, apiToken, account.name);
    }
    if (body.action === 'configure') {
      if (!c.metaapiId) throw new ApiError(409, 'MetaApi account is not ready');
      return Response.json({ connection: c, configurationLink: await metaApiConfigurationLink(apiToken, c.metaapiId) }, { headers });
    }
    if (body.action === 'status') {
      if (!c.metaapiId) throw new ApiError(409, 'MetaApi account is not ready');
      const remote = await readMetaApiAccount(apiToken, c.metaapiId);
      if ((c.login && remote.login && c.login !== remote.login) ||
          (c.login && c.server && remote.server && c.server !== remote.server))
        throw new ApiError(409, 'MT5 account number changed. Disconnect and create a new connection.');
      const connected = Boolean(remote.login && remote.connectionStatus === 'CONNECTED');
      const updated: Connection = { ...c, login: remote.login || null, server: remote.server || c.server,
        status: connected ? 'connected' : remote.login ? 'error' : 'not_configured',
        error: remote.login && !connected ? 'MetaApi is still connecting to this broker. Check again shortly.' : null };
      await save(db, who.id, updated);
      return Response.json({ connection: updated }, { headers });
    }
    if (body.action === 'disconnect') {
      // Delete the cloud terminal first, so disconnect does not leave a billable provider account.
      if (c.metaapiId) await deleteMetaApiAccount(apiToken, c.metaapiId);
      const updated: Connection = { ...c, status: 'disconnected', error: null, metaapiId: null, metaapiTransactionId: null, provisioning: false };
      await save(db, who.id, updated);
      return Response.json({ connection: updated }, { headers });
    }
    throw new ApiError(400, 'Unknown MT5 action');
  } catch (error) {
    if (error instanceof MetaApiError) return apiFailure(new ApiError(error.status >= 500 ? 502 : 400, error.message));
    return apiFailure(error);
  }
}

async function save(db: D1Database, ownerId: string, c: Connection) {
  await db.prepare('UPDATE broker_connections SET payload=? WHERE id=? AND owner_id=?')
    .bind(JSON.stringify(c), `${ownerId}|${c.id}`, ownerId).run();
}

async function provision(db: D1Database, ownerId: string, c: Connection, apiToken: string, accountName: string) {
  try {
    const result = await createMetaApiDraft(apiToken, `Tradovia ${accountName}`.slice(0, 80), c.server!, c.metaapiTransactionId!);
    if (result.status === 202) return Response.json({ connection: c, pending: true }, { status: 202, headers });
    if (!result.data.id || !/^[0-9a-f-]{36}$/i.test(result.data.id)) throw new ApiError(502, 'MetaApi did not return an account ID');
    const updated: Connection = { ...c, metaapiId: result.data.id, provisioning: false, error: null };
    await save(db, ownerId, updated);
    const configurationLink = await metaApiConfigurationLink(apiToken, result.data.id);
    return Response.json({ connection: updated, configurationLink }, { headers });
  } catch (error) {
    if (error instanceof MetaApiError && error.status >= 400 && error.status < 500) {
      await save(db, ownerId, { ...c, status: 'error', error: error.message, provisioning: false });
    }
    throw error;
  }
}
