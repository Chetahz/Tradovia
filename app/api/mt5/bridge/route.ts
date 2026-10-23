import { env } from 'cloudflare:workers';
import { database } from '@/db';
import type { Connection } from '@/lib/domain';
import { createMt5BridgeToken, hashMt5BridgeToken } from '@/lib/mt5-bridge-token';
import { validMt5Server } from '@/lib/metaapi';
import { readBoundedBody } from '@/lib/request-body';
import { initialize, readWorkspace } from '@/lib/repository';
import { owner, checkOrigin, apiFailure, ApiError } from '@/lib/server-auth';

const headers = { 'Cache-Control': 'no-store' };
type PilotEnv = { MT5_BRIDGE_PILOT_ENABLED?: string; AUTH_OWNER_SUBJECT?: string };

async function pilotOwner(request: Request) {
  const who = await owner(request);
  const config = env as unknown as PilotEnv;
  if (config.MT5_BRIDGE_PILOT_ENABLED !== 'true' || !config.AUTH_OWNER_SUBJECT ||
      who.mode !== 'real' || who.id !== `auth0:${config.AUTH_OWNER_SUBJECT}`)
    throw new ApiError(404, 'MT5 bridge pilot is unavailable');
  await initialize(who.id, who.mode);
  return { who, data: await readWorkspace(who.id) };
}

export async function GET(request: Request) {
  try {
    const { data } = await pilotOwner(request);
    return Response.json({ connections: data.connections.filter(c => c.provider === 'mt5-bridge') }, { headers });
  } catch (error) { return apiFailure(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { who, data } = await pilotOwner(request);
    const body = JSON.parse(new TextDecoder().decode(await readBoundedBody(request, 2048)));
    const db = database();
    const prefix = `${who.id}|`;
    if (body.action === 'create') {
      const account = data.accounts.find(a => a.id === body.accountId && a.type === 'mt5');
      if (!account) throw new ApiError(404, 'MT5 journal account not found');
      if (typeof body.login !== 'string' || !/^\d{4,20}$/.test(body.login) || !validMt5Server(body.server))
        throw new ApiError(400, 'Enter the exact MT5 login and server');
      if (data.connections.some(c => c.accountId === account.id && c.status !== 'disconnected'))
        throw new ApiError(409, 'This journal account already has an active connection');
      const token = createMt5BridgeToken();
      const hash = await hashMt5BridgeToken(token);
      const id = crypto.randomUUID();
      const connection: Connection = {
        id, accountId: account.id, provider: 'mt5-bridge', status: 'not_configured',
        login: body.login, server: body.server.trim(), lastSync: null, error: null,
      };
      await db.batch([
        db.prepare('INSERT INTO broker_connections(id,owner_id,account_id,payload) VALUES(?,?,?,?)')
          .bind(prefix + id, who.id, prefix + account.id, JSON.stringify(connection)),
        db.prepare('INSERT INTO mt5_credentials(connection_id,owner_id,token_hash,login,server,created_at) VALUES(?,?,?,?,?,?)')
          .bind(prefix + id, who.id, hash, body.login, connection.server, Date.now()),
      ]);
      // Never persist or log the raw token. It is returned once to the pilot operator.
      return Response.json({ connection, bridgeToken: token }, { status: 201, headers });
    }
    if (body.action === 'disconnect') {
      const c = data.connections.find(item => item.id === body.connectionId && item.provider === 'mt5-bridge' && item.status !== 'disconnected');
      if (!c) throw new ApiError(404, 'MT5 bridge connection not found');
      const updated: Connection = { ...c, status: 'disconnected', error: null };
      await db.batch([
        db.prepare('DELETE FROM mt5_credentials WHERE connection_id=? AND owner_id=?').bind(prefix + c.id, who.id),
        db.prepare('UPDATE broker_connections SET payload=? WHERE id=? AND owner_id=?')
          .bind(JSON.stringify(updated), prefix + c.id, who.id),
      ]);
      return Response.json({ connection: updated }, { headers });
    }
    throw new ApiError(400, 'Unknown MT5 bridge action');
  } catch (error) { return apiFailure(error); }
}
