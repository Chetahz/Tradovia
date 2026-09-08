import { imageBucket, database } from '@/db';
import { owner, apiFailure, ApiError } from '@/lib/server-auth';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const who = await owner(request);
    const { id } = await params;
    const row = await database()
      .prepare(
        'SELECT object_key,mime FROM trade_images WHERE id=? AND owner_id=?',
      )
      .bind(id, who.id)
      .first<{ object_key: string; mime: string }>();
    if (!row) throw new ApiError(404, 'Image not found');
    const obj = await imageBucket().get(row.object_key);
    if (!obj) throw new ApiError(404, 'Image not found');
    return new Response(obj.body, {
      headers: {
        'Content-Type': row.mime,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch (e) {
    return apiFailure(e);
  }
}
