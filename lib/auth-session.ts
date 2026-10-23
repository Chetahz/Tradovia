import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { database } from '@/db';
import { authConfig, cookieNames, unseal, isOwner, type AuthSettings } from './auth-core';

export function configuredAuth() {
  return authConfig(env as unknown as AuthSettings);
}
export async function currentSession() {
  let config;
  try { config = configuredAuth(); } catch { return null; }
  const token = (await cookies()).get(cookieNames(config.secure).session)?.value;
  if (!token) return null;
  let payload;
  try { payload = await unseal(token, config.secret, 'session'); } catch { return null; }
  if (typeof payload.sid !== 'string' || typeof payload.sub !== 'string') return null;
  const session = await database().prepare(
    'SELECT subject, email, display_name FROM auth_sessions WHERE id=? AND subject=? AND expires_at>?',
  ).bind(payload.sid, payload.sub, Date.now()).first<{ subject: string; email: string; display_name: string }>();
  if (!session) return null;
  return { ...session, sessionId: payload.sid, role: isOwner(session.subject, config.ownerSubject) ? 'owner' as const : 'member' as const };
}
