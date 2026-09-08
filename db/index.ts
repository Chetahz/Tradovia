import { env } from 'cloudflare:workers';
export function database(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error('Database unavailable');
  return db;
}
export function imageBucket(): R2Bucket {
  const bucket = (env as unknown as { IMAGES?: R2Bucket }).IMAGES;
  if (!bucket) throw new Error('Image storage unavailable');
  return bucket;
}
