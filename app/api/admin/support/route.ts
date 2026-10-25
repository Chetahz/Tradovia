import { database } from '@/db';
import { recordAdminAudit } from '@/lib/admin';
import { currentSession } from '@/lib/auth-session';
import { apiFailure, ApiError, checkOrigin } from '@/lib/server-auth';
import { validateAdminTicketUpdate } from '@/lib/support';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const session = await currentSession();
    if (!session) throw new ApiError(401, 'Sign in required');
    if (session.role !== 'owner')
      throw new ApiError(403, 'Owner access required');
    const value = validateAdminTicketUpdate(await request.json());
    const db = database();
    const ticket = await db
      .prepare(
        'SELECT id,owner_id,subject,status FROM support_tickets WHERE id=?',
      )
      .bind(value.ticketId)
      .first<{
        id: string;
        owner_id: string;
        subject: string;
        status: string;
      }>();
    if (!ticket) throw new ApiError(404, 'Request not found');
    const now = Date.now();
    if (value.action === 'reply') {
      await db.batch([
        db
          .prepare(
            'INSERT INTO support_messages(id,ticket_id,owner_id,author_type,author_id,body,created_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            ticket.id,
            ticket.owner_id,
            'admin',
            session.subject,
            value.message,
            now,
          ),
        db
          .prepare(
            "UPDATE support_tickets SET status='waiting_customer',updated_at=?,closed_at=NULL WHERE id=?",
          )
          .bind(now, ticket.id),
        db
          .prepare(
            'INSERT INTO notifications(id,owner_id,type,title,body,link,created_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            ticket.owner_id,
            'support_reply',
            'ทีม Tradovia ตอบกลับแล้ว',
            ticket.subject,
            '#settings',
            now,
          ),
      ]);
    } else {
      const resolved = value.action === 'resolve';
      await db.batch([
        db
          .prepare(
            'UPDATE support_tickets SET status=?,updated_at=?,closed_at=? WHERE id=?',
          )
          .bind(
            resolved ? 'resolved' : 'open',
            now,
            resolved ? now : null,
            ticket.id,
          ),
        db
          .prepare(
            'INSERT INTO notifications(id,owner_id,type,title,body,link,created_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            ticket.owner_id,
            resolved ? 'support_resolved' : 'support_reopened',
            resolved ? 'คำขอได้รับการแก้ไขแล้ว' : 'คำขอถูกเปิดอีกครั้ง',
            ticket.subject,
            '#settings',
            now,
          ),
      ]);
    }
    await recordAdminAudit({
      actorId: session.subject,
      action: `support.${value.action}`,
      targetType: 'support_ticket',
      targetId: ticket.id,
      metadata: { previousStatus: ticket.status },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}
