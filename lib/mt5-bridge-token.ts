/** One connection-scoped bearer token for the self-hosted MT5 pilot. */
const tokenPattern = /^tdv_mt5_[A-Za-z0-9_-]{43}$/;

export function createMt5BridgeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'tdv_mt5_' + btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function hashMt5BridgeToken(token: string): Promise<string> {
  if (!tokenPattern.test(token)) throw new Error('Invalid MT5 bridge token');
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function bridgeBearer(header: string | null): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  return tokenPattern.test(token) ? token : null;
}
