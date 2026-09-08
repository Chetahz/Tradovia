import { imageBucket, database } from '@/db';
import { owner, checkOrigin, apiFailure, ApiError } from '@/lib/server-auth';
import { initialize } from '@/lib/repository';
import { readBoundedBody } from '@/lib/request-body';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const who = await owner(request);
    await initialize(who.id, who.mode);
    const raw = await readBoundedBody(request, 5500000);
    const form = await new Response(raw, {
      headers: { 'Content-Type': request.headers.get('content-type') ?? '' },
    }).formData();
    const file = form.get('image');
    if (
      !(file instanceof File) ||
      file.size > 5000000 ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    )
      throw new ApiError(400, 'Use a PNG, JPEG or WebP image under 5 MB');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png =
      bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
    if (
      !(
        (file.type === 'image/png' && png) ||
        (file.type === 'image/jpeg' && jpg) ||
        (file.type === 'image/webp' && webp)
      )
    )
      throw new ApiError(400, 'Image content does not match its type');
    const count = await database()
      .prepare('SELECT COUNT(*) as n FROM trade_images WHERE owner_id=?')
      .bind(who.id)
      .first<{ n: number }>();
    if ((count?.n ?? 0) >= 100) throw new ApiError(409, 'Image limit reached');
    const id = crypto.randomUUID(),
      key = who.id + '/' + id;
    await imageBucket().put(key, bytes, {
      httpMetadata: { contentType: file.type },
    });
    try {
      await database()
        .prepare(
          'INSERT INTO trade_images(id,owner_id,object_key,mime,size,created_at) VALUES(?,?,?,?,?,?)',
        )
        .bind(id, who.id, key, file.type, file.size, Date.now())
        .run();
    } catch (e) {
      await imageBucket().delete(key);
      throw e;
    }
    return Response.json({ id });
  } catch (e) {
    return apiFailure(e);
  }
}
