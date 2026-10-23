/** Server-only MetaApi provisioning client. Broker credentials never pass through Tradovia. */
export const METAAPI_PROVISIONING = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

export class MetaApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message); this.status = status; this.code = code;
  }
}

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<{ status: number; data: T }> {
  if (!token) throw new MetaApiError(503, 'MetaApi is not configured');
  const headers = new Headers(init.headers);
  headers.set('auth-token', token);
  headers.set('Accept', 'application/json');
  const response = await fetch(`${METAAPI_PROVISIONING}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({})) as T & { message?: string; details?: string | { code?: string } };
  if (!response.ok && response.status !== 202) {
    const code = typeof data.details === 'string' ? data.details : data.details?.code;
    // Do not reflect provider messages verbatim: they may contain account identifiers.
    throw new MetaApiError(response.status, response.status === 401 || response.status === 403
      ? 'MetaApi authorization failed' : code === 'E_SRV_NOT_FOUND'
        ? 'MT5 server not found by MetaApi. Check the exact server name shown in MT5.'
        : code === 'E_AUTH' ? 'MT5 login failed. Check the account, investor password and server.'
          : 'MetaApi could not connect this MT5 account', code);
  }
  return { status: response.status, data };
}

export function validMt5Server(server: unknown): server is string {
  return typeof server === 'string' && server.trim().length > 2 && server.trim().length <= 120 && !server.includes('://') &&
    /^[\p{L}\p{N} ._():+/-]+$/u.test(server);
}

export async function createMetaApiDraft(token: string, name: string, server: string, transactionId: string) {
  return call<{ id?: string; state?: string }>(token, '/users/current/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'transaction-id': transactionId },
    body: JSON.stringify({ name, server, platform: 'mt5', magic: 0, manualTrades: true, type: 'cloud-g2', region: 'vint-hill' }),
  });
}

export async function metaApiConfigurationLink(token: string, providerId: string) {
  const { data } = await call<{ configurationLink?: string }>(token,
    `/users/current/accounts/${encodeURIComponent(providerId)}/configuration-link?ttlInDays=1`, { method: 'PUT' });
  if (!data.configurationLink || new URL(data.configurationLink).origin !== 'https://app.metaapi.cloud')
    throw new MetaApiError(502, 'MetaApi returned an invalid configuration link');
  return data.configurationLink;
}

export async function readMetaApiAccount(token: string, providerId: string) {
  const { data } = await call<{ login?: string; server?: string; state?: string; connectionStatus?: string; region?: string }>(token,
    `/users/current/accounts/${encodeURIComponent(providerId)}`);
  return data;
}

export async function deleteMetaApiAccount(token: string, providerId: string) {
  await call(token, `/users/current/accounts/${encodeURIComponent(providerId)}`, { method: 'DELETE' });
}
