import { cookies } from 'next/headers';
import { database } from '@/db';
import { configuredAuth, currentSession } from '@/lib/auth-session';
import { cookieNames } from '@/lib/auth-core';

export function GET() {
  return new Response('<!doctype html><html lang="th"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tradovia · Sign out</title><body><main><h1>ออกจากระบบ / Sign out</h1><form method="post"><button type="submit">ยืนยันออกจากระบบ / Confirm sign out</button></form><p><a href="/workspace">กลับ / Back</a></p></main></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" } });
}
export async function POST(request: Request) {
  const config = configuredAuth();
  if (request.headers.get('origin') !== config.origin || new URL(request.url).origin !== config.origin)
    return new Response('Origin not allowed', { status: 403 });
  const session = await currentSession();
  if (session) await database().prepare('DELETE FROM auth_sessions WHERE id=?').bind(session.sessionId).run();
  const jar = await cookies();
  for (const name of Object.values(cookieNames(config.secure)))
    jar.set(name, '', { httpOnly: true, secure: config.secure, sameSite: 'lax', path: '/', maxAge: 0 });
  const url = new URL('/v2/logout', config.issuer);
  url.search = new URLSearchParams({ client_id: config.clientId, returnTo: config.origin + '/auth' }).toString();
  return new Response(null, { status: 303, headers: { Location: url.href, 'Cache-Control': 'no-store' } });
}
