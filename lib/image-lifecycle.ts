import type { Trade } from '@/lib/domain';

type StoredPayload = { payload: string };
type StoredImage = { id: string; object_key: string };

function imageIdsFromPayload(payload: string): string[] {
  try {
    const value = JSON.parse(payload) as Partial<Trade>;
    return Array.isArray(value.imageIds)
      ? value.imageIds.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function removeUnreferencedTradeImages(
  db: D1Database,
  bucket: R2Bucket,
  ownerId: string,
  candidates: Iterable<string>,
): Promise<number> {
  const unique = [...new Set(candidates)].filter(Boolean);
  if (!unique.length) return 0;

  const trades = await db
    .prepare('SELECT payload FROM trades WHERE owner_id=?')
    .bind(ownerId)
    .all<StoredPayload>();
  const referenced = new Set(
    trades.results.flatMap((row) => imageIdsFromPayload(row.payload)),
  );
  const released = unique.filter((id) => !referenced.has(id));
  if (!released.length) return 0;

  const rows = (
    await db
      .prepare('SELECT id,object_key FROM trade_images WHERE owner_id=?')
      .bind(ownerId)
      .all<StoredImage>()
  ).results.filter((row) => released.includes(row.id));
  if (!rows.length) return 0;

  await db.batch(
    rows.map((row) =>
      db
        .prepare('DELETE FROM trade_images WHERE id=? AND owner_id=?')
        .bind(row.id, ownerId),
    ),
  );
  await bucket.delete(rows.map((row) => row.object_key)).catch(() => {});
  return rows.length;
}

export async function removeAllOwnerImages(
  db: D1Database,
  bucket: R2Bucket,
  ownerId: string,
  avatarVersion?: string,
): Promise<void> {
  const rows = await db
    .prepare('SELECT object_key FROM trade_images WHERE owner_id=?')
    .bind(ownerId)
    .all<{ object_key: string }>();
  const keys = rows.results.map((row) => row.object_key);
  if (avatarVersion)
    keys.push(`${ownerId}/profile/avatar/${avatarVersion}`);
  if (keys.length) await bucket.delete([...new Set(keys)]).catch(() => {});
}
