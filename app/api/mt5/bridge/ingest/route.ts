import { env } from 'cloudflare:workers';
import { database } from '@/db';
import type { Connection, Trade } from '@/lib/domain';
import { prepareMt5PilotImport } from '@/lib/mt5-pilot-import';
import { bridgeBearer, hashMt5BridgeToken } from '@/lib/mt5-bridge-token';
import { readBoundedBody } from '@/lib/request-body';
import { apiFailure, ApiError } from '@/lib/server-auth';

type CredentialRow = {
  connection_id: string;
  owner_id: string;
  login: string;
  server: string;
  account_id: string;
  payload: string;
};
const headers = { 'Cache-Control': 'no-store' };

/** Trusted connector only. The pilot is disabled unless explicitly enabled. */
export async function POST(request: Request) {
  try {
    if ((env as unknown as { MT5_BRIDGE_PILOT_ENABLED?: string }).MT5_BRIDGE_PILOT_ENABLED !== 'true')
      throw new ApiError(404, 'MT5 bridge pilot is unavailable');
    const token = bridgeBearer(request.headers.get('authorization'));
    if (!token) throw new ApiError(401, 'MT5 bridge authentication required');
    const db = database();
    const row = await db.prepare(
      'SELECT mc.connection_id,mc.owner_id,mc.login,mc.server,bc.account_id,bc.payload FROM mt5_credentials mc JOIN broker_connections bc ON bc.id=mc.connection_id AND bc.owner_id=mc.owner_id WHERE mc.token_hash=?',
    ).bind(await hashMt5BridgeToken(token)).first<CredentialRow>();
    if (!row) throw new ApiError(401, 'MT5 bridge authentication required');
    const connection = JSON.parse(row.payload) as Connection;
    if (connection.provider !== 'mt5-bridge' || connection.status === 'disconnected' ||
        row.connection_id !== `${row.owner_id}|${connection.id}` ||
        row.account_id !== `${row.owner_id}|${connection.accountId}`)
      throw new ApiError(403, 'MT5 bridge connection is inactive');

    const body = JSON.parse(new TextDecoder().decode(await readBoundedBody(request, 256_000)));
    if (body.login !== row.login || body.server !== row.server ||
        !Array.isArray(body.positions) || body.positions.length > 100)
      throw new ApiError(400, 'MT5 bridge account or batch is invalid');
    const results = await db.prepare('SELECT payload FROM trades WHERE owner_id=? AND account_id=?')
      .bind(row.owner_id, row.account_id).all<{ payload: string }>();
    const existing = results.results.map(item => JSON.parse(item.payload) as Trade);
    const prepared = prepareMt5PilotImport(body.positions, connection.accountId, connection.id, existing);
    if (prepared.invalid) throw new ApiError(400, 'MT5 bridge batch contains invalid positions');
    if (existing.length + prepared.accepted.length > 5000) throw new ApiError(409, 'Journal trade limit reached');

    const now = new Date().toISOString();
    const updated: Connection = { ...connection, status: 'connected', error: null, lastSync: now, checkedAt: now };
    await db.batch([
      ...prepared.accepted.map(trade => db.prepare(
        'INSERT INTO trades(id,owner_id,account_id,trade_date,payload) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING',
      ).bind(`${row.owner_id}|${trade.id}`, row.owner_id, row.account_id, trade.date, JSON.stringify(trade))),
      db.prepare('UPDATE broker_connections SET payload=? WHERE id=? AND owner_id=?')
        .bind(JSON.stringify(updated), row.connection_id, row.owner_id),
    ]);
    return Response.json({ imported: prepared.accepted.length, duplicate: prepared.duplicate, lastSync: now }, { headers });
  } catch (error) { return apiFailure(error); }
}
