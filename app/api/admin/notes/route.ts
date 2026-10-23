import { database } from '@/db';
import { recordAdminAudit } from '@/lib/admin';
import { currentSession } from '@/lib/auth-session';
import { ApiError, apiFailure, checkOrigin } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const session = await currentSession();
    if (!session) throw new ApiError(401, 'Sign in required');
    if (session.role !== 'owner') throw new ApiError(403, 'Owner access required');
    const input = await request.json() as { ownerId?: unknown; note?: unknown };
    const ownerId = typeof input.ownerId === 'string' ? input.ownerId : '';
    const note = typeof input.note === 'string' ? input.note.replace(/\s+/g, ' ').trim().slice(0, 1000) : '';
    if (!ownerId.startsWith('auth0:') || note.length < 2) throw new ApiError(400, 'Invalid support note');
    const db = database();
    if (!await db.prepare("SELECT id FROM users WHERE id=? AND mode='real'").bind(ownerId).first()) throw new ApiError(404, 'Customer not found');
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO customer_support_notes(id,owner_id,actor_id,note,created_at) VALUES(?,?,?,?,?)')
      .bind(id, ownerId, session.subject, note, Date.now()).run();
    await recordAdminAudit({ actorId: session.subject, action: 'customer.note.created', targetType: 'customer', targetId: ownerId, metadata: { noteId: id } });
    return Response.json({ ok: true, id });
  } catch (error) {
    return apiFailure(error);
  }
}
