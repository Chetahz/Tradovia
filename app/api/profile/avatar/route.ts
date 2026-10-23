import { database, imageBucket } from '@/db';
import { owner, checkOrigin, apiFailure, ApiError } from '@/lib/server-auth';
import { initialize } from '@/lib/repository';
import { readBoundedBody } from '@/lib/request-body';
import type { WorkspaceData } from '@/lib/domain';

type Profile = WorkspaceData['profile'];
const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];

async function profileFor(id: string): Promise<Profile> {
  const row = await database().prepare('SELECT payload FROM profiles WHERE owner_id=?')
    .bind(id).first<{ payload: string }>();
  if (!row) throw new ApiError(404, 'Profile not found');
  return JSON.parse(row.payload) as Profile;
}

function imageKey(ownerId: string, version: string): string {
  return `${ownerId}/profile/avatar/${version}`;
}

function validImage(bytes: Uint8Array, type: string): boolean {
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  return (type === 'image/png' && png) || (type === 'image/jpeg' && jpg) ||
    (type === 'image/webp' && webp);
}

export async function GET(request: Request) {
  try {
    const who = await owner(request);
    const profile = await profileFor(who.id);
    if (!profile.avatarVersion || !/^[a-f0-9-]{36}$/.test(profile.avatarVersion))
      throw new ApiError(404, 'Profile image not found');
    const object = await imageBucket().get(imageKey(who.id, profile.avatarVersion));
    if (!object) throw new ApiError(404, 'Profile image not found');
    return new Response(object.body, { headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'",
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) { return apiFailure(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const who = await owner(request);
    await initialize(who.id, who.mode);
    const raw = await readBoundedBody(request, 2200000);
    const form = await new Response(raw, {
      headers: { 'Content-Type': request.headers.get('content-type') ?? '' },
    }).formData();
    const file = form.get('image');
    if (!(file instanceof File) || file.size > 2000000 || !imageTypes.includes(file.type))
      throw new ApiError(400, 'Use a PNG, JPEG or WebP image under 2 MB');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validImage(bytes, file.type))
      throw new ApiError(400, 'Image content does not match its type');
    const profile = await profileFor(who.id);
    const previous = profile.avatarVersion;
    const version = crypto.randomUUID();
    const key = imageKey(who.id, version);
    await imageBucket().put(key, bytes, { httpMetadata: { contentType: file.type } });
    try {
      await database().prepare('UPDATE profiles SET payload=? WHERE owner_id=?')
        .bind(JSON.stringify({ ...profile, avatarVersion: version }), who.id).run();
    } catch (error) {
      await imageBucket().delete(key);
      throw error;
    }
    if (previous) await imageBucket().delete(imageKey(who.id, previous)).catch(() => {});
    return Response.json({ avatarVersion: version }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiFailure(error); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const who = await owner(request);
    const profile = await profileFor(who.id);
    const previous = profile.avatarVersion;
    if (previous) {
      const { avatarVersion: _avatarVersion, ...withoutAvatar } = profile;
      await database().prepare('UPDATE profiles SET payload=? WHERE owner_id=?')
        .bind(JSON.stringify(withoutAvatar), who.id).run();
      await imageBucket().delete(imageKey(who.id, previous)).catch(() => {});
    }
    return Response.json({ avatarVersion: null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiFailure(error); }
}
