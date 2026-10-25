import { database } from '@/db';
import { apiFailure, ApiError, checkOrigin, owner } from '@/lib/server-auth';
import { validateNewTicket, validateTicketReply } from '@/lib/support';

export async function GET(request: Request) {
  try {
    const who = await owner(request);
    if (who.mode === 'demo')
      return Response.json({ tickets: [], messages: [] });
    const db = database();
    const [tickets, messages] = await Promise.all([
      db
        .prepare(
          'SELECT id,category,subject,status,created_at,updated_at,closed_at FROM support_tickets WHERE owner_id=? ORDER BY updated_at DESC LIMIT 30',
        )
        .bind(who.id)
        .all(),
      db
        .prepare(
          'SELECT id,ticket_id,author_type,body,created_at FROM support_messages WHERE owner_id=? ORDER BY created_at ASC LIMIT 400',
        )
        .bind(who.id)
        .all(),
    ]);
    return Response.json({
      tickets: tickets.results.map((value) => {
        const r = value as Record<string, unknown>;
        return {
          id: r.id,
          category: r.category,
          subject: r.subject,
          status: r.status,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          closedAt: r.closed_at,
        };
      }),
      messages: messages.results.map((value) => {
        const r = value as Record<string, unknown>;
        return {
          id: r.id,
          ticketId: r.ticket_id,
          authorType: r.author_type,
          body: r.body,
          createdAt: r.created_at,
        };
      }),
    });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const who = await owner(request);
    if (who.mode === 'demo')
      throw new ApiError(403, 'Sign in to contact support');
    const input = (await request.json()) as Record<string, unknown>;
    const db = database();
    const now = Date.now();
    if (input.action === 'create') {
      const value = validateNewTicket(input);
      const recent = await db
        .prepare(
          'SELECT COUNT(*) AS count FROM support_tickets WHERE owner_id=? AND created_at>?',
        )
        .bind(who.id, now - 3_600_000)
        .first<{ count: number }>();
      if (Number(recent?.count ?? 0) >= 5)
        throw new ApiError(429, 'Please wait before creating another request');
      const ticketId = crypto.randomUUID();
      await db.batch([
        db
          .prepare(
            'INSERT INTO support_tickets(id,owner_id,category,subject,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            ticketId,
            who.id,
            value.category,
            value.subject,
            'open',
            now,
            now,
          ),
        db
          .prepare(
            'INSERT INTO support_messages(id,ticket_id,owner_id,author_type,author_id,body,created_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            ticketId,
            who.id,
            'member',
            who.id,
            value.message,
            now,
          ),
      ]);
      return Response.json({ ok: true, id: ticketId });
    }
    if (input.action === 'reply') {
      const value = validateTicketReply(input);
      const ticket = await db
        .prepare(
          'SELECT id,status FROM support_tickets WHERE id=? AND owner_id=?',
        )
        .bind(value.ticketId, who.id)
        .first<{ id: string; status: string }>();
      if (!ticket) throw new ApiError(404, 'Request not found');
      const recent = await db
        .prepare(
          'SELECT COUNT(*) AS count FROM support_messages WHERE owner_id=? AND created_at>?',
        )
        .bind(who.id, now - 3_600_000)
        .first<{ count: number }>();
      if (Number(recent?.count ?? 0) >= 20)
        throw new ApiError(429, 'Please wait before sending another message');
      await db.batch([
        db
          .prepare(
            'INSERT INTO support_messages(id,ticket_id,owner_id,author_type,author_id,body,created_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            value.ticketId,
            who.id,
            'member',
            who.id,
            value.message,
            now,
          ),
        db
          .prepare(
            "UPDATE support_tickets SET status='open',updated_at=?,closed_at=NULL WHERE id=? AND owner_id=?",
          )
          .bind(now, value.ticketId, who.id),
      ]);
      return Response.json({ ok: true });
    }
    throw new ApiError(400, 'Invalid support action');
  } catch (error) {
    return apiFailure(error);
  }
}
