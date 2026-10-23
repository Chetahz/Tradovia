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
    const input = await request.json() as { id?: unknown; status?: unknown; note?: unknown };
    const id = typeof input.id === 'string' ? input.id : '';
    const status = input.status === 'resolved' ? 'resolved' : input.status === 'open' ? 'open' : '';
    const note = typeof input.note === 'string' ? input.note.replace(/\s+/g, ' ').trim().slice(0, 500) : '';
    if (!/^[a-f0-9-]{36}$/i.test(id) || !status) throw new ApiError(400, 'Invalid issue update');
    const db = database();
    const existing = await db.prepare('SELECT id,status FROM ops_events WHERE id=?').bind(id).first<{ id: string; status: string }>();
    if (!existing) throw new ApiError(404, 'Issue not found');
    const now = Date.now();
    await db.prepare('UPDATE ops_events SET status=?,resolved_at=?,resolution_note=?,updated_at=? WHERE id=?')
      .bind(status, status === 'resolved' ? now : null, note || null, now, id).run();
    await recordAdminAudit({ actorId: session.subject, action: `issue.${status}`, targetType: 'ops_event', targetId: id, metadata: { previousStatus: existing.status, noteAdded: Boolean(note) } });
    return Response.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}
