import { database } from '@/db';
import { apiFailure, ApiError, checkOrigin, owner } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const who = await owner(request);
    if (who.mode === 'demo')
      return Response.json({ notifications: [], unread: 0 });
    const db = database();
    const [items, count] = await Promise.all([
      db
        .prepare(
          'SELECT id,type,title,body,link,read_at,created_at FROM notifications WHERE owner_id=? ORDER BY created_at DESC LIMIT 60',
        )
        .bind(who.id)
        .all(),
      db
        .prepare(
          'SELECT COUNT(*) AS count FROM notifications WHERE owner_id=? AND read_at IS NULL',
        )
        .bind(who.id)
        .first<{ count: number }>(),
    ]);
    return Response.json({
      notifications: items.results.map((value) => {
        const r = value as Record<string, unknown>;
        return {
          id: r.id,
          type: r.type,
          title: r.title,
          body: r.body,
          link: r.link,
          readAt: r.read_at,
          createdAt: r.created_at,
        };
      }),
      unread: Number(count?.count ?? 0),
    });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const who = await owner(request);
    if (who.mode === 'demo') throw new ApiError(403, 'Sign in required');
    const input = (await request.json()) as { action?: unknown; id?: unknown };
    const now = Date.now();
    if (input.action === 'readAll')
      await database()
        .prepare(
          'UPDATE notifications SET read_at=? WHERE owner_id=? AND read_at IS NULL',
        )
        .bind(now, who.id)
        .run();
    else if (
      input.action === 'read' &&
      typeof input.id === 'string' &&
      /^[a-f0-9-]{36}$/i.test(input.id)
    )
      await database()
        .prepare('UPDATE notifications SET read_at=? WHERE id=? AND owner_id=?')
        .bind(now, input.id, who.id)
        .run();
    else throw new ApiError(400, 'Invalid notification action');
    return Response.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}
