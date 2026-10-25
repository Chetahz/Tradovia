import { cookies } from 'next/headers';
import { env } from 'cloudflare:workers';
import { database, imageBucket } from '@/db';
import { validAccountDeletionConfirmation } from '@/lib/account-deletion';
import {
  deleteAuth0Identity,
  type Auth0ManagementSettings,
} from '@/lib/auth0-management';
import { cookieNames } from '@/lib/auth-core';
import { configuredAuth, currentSession } from '@/lib/auth-session';
import { removeAllOwnerImages } from '@/lib/image-lifecycle';

function redirect(url: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: url, 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  let config;
  try {
    config = configuredAuth();
  } catch {
    return new Response('Account deletion is unavailable', { status: 503 });
  }
  if (
    request.headers.get('origin') !== config.origin ||
    new URL(request.url).origin !== config.origin
  )
    return new Response('Origin not allowed', { status: 403 });

  const session = await currentSession();
  if (!session) return redirect(config.origin + '/auth');
  const form = await request.formData();
  if (!validAccountDeletionConfirmation(form.get('confirmation')))
    return new Response('Type DELETE to confirm account deletion', {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    });

  const db = database();
  const ownerId = `auth0:${session.subject}`;
  const profile = await db
    .prepare('SELECT payload FROM profiles WHERE owner_id=?')
    .bind(ownerId)
    .first<{ payload: string }>();
  let avatarVersion = '';
  try {
    const parsed = profile?.payload
      ? (JSON.parse(profile.payload) as { avatarVersion?: unknown })
      : null;
    if (typeof parsed?.avatarVersion === 'string')
      avatarVersion = parsed.avatarVersion;
  } catch {
    // A malformed profile must not prevent the user from deleting their data.
  }

  await removeAllOwnerImages(
    db,
    imageBucket(),
    ownerId,
    avatarVersion || undefined,
  );
  await db.batch([
    db.prepare('DELETE FROM notifications WHERE owner_id=?').bind(ownerId),
    db.prepare('DELETE FROM support_messages WHERE owner_id=?').bind(ownerId),
    db.prepare('DELETE FROM support_tickets WHERE owner_id=?').bind(ownerId),
    db
      .prepare('DELETE FROM customer_support_notes WHERE owner_id=?')
      .bind(ownerId),
    db
      .prepare('DELETE FROM admin_audit_events WHERE target_id=?')
      .bind(ownerId),
    db.prepare('DELETE FROM ops_events WHERE owner_id=?').bind(ownerId),
  ]);

  try {
    await deleteAuth0Identity(
      env as unknown as Auth0ManagementSettings,
      session.subject,
    );
  } catch {
    return new Response(
      'Your Tradovia data was deleted, but identity deletion could not finish. Please retry.',
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  // Keep the user row and session alive until the external identity has been
  // removed. If Auth0 is temporarily unavailable, the customer can retry from
  // Settings instead of being stranded with an undeletable identity.
  await db.batch([
    db.prepare('DELETE FROM users WHERE id=?').bind(ownerId),
    db
      .prepare('DELETE FROM auth_sessions WHERE subject=?')
      .bind(session.subject),
  ]);

  const jar = await cookies();
  for (const name of Object.values(cookieNames(config.secure)))
    jar.set(name, '', {
      httpOnly: true,
      secure: config.secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

  const logout = new URL('/v2/logout', config.issuer);
  logout.search = new URLSearchParams({
    client_id: config.clientId,
    returnTo: config.origin + '/?account=deleted',
  }).toString();
  return redirect(logout.href);
}
