import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { d1Rows, projectRoot, runWrangler, sha256 } from './ops-common.mjs';

const stamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
const destination = path.resolve(projectRoot, process.argv[2] || path.join('backups', stamp));
const backupRoot = path.resolve(projectRoot, 'backups') + path.sep;
if (!destination.startsWith(backupRoot)) throw new Error('Backup destination must stay inside backups/');
await mkdir(path.join(destination, 'r2'), { recursive: true });
await writeFile(path.join(destination, 'INCOMPLETE'), 'Backup is not complete.\n');

const schemaFile = path.join(destination, 'schema.sql');
const dataFile = path.join(destination, 'data.sql');
runWrangler(['d1', 'export', 'tradovia-db', '--remote', '--output', schemaFile, '--no-data', '--skip-confirmation']);
runWrangler(['d1', 'export', 'tradovia-db', '--remote', '--output', dataFile, '--no-schema', '--skip-confirmation']);

const objects = d1Rows('SELECT object_key FROM trade_images ORDER BY object_key').map((row) => row.object_key);
const profiles = d1Rows('SELECT owner_id,payload FROM profiles ORDER BY owner_id');
for (const row of profiles) {
  const profile = JSON.parse(row.payload);
  if (profile.avatarVersion)
    objects.push(`${row.owner_id}/profile/avatar/${profile.avatarVersion}`);
}

const files = [];
for (const key of new Set(objects)) {
  const filename = createHash('sha256').update(key).digest('hex') + '.bin';
  const file = path.join(destination, 'r2', filename);
  runWrangler(['r2', 'object', 'get', `tradovia-images/${key}`, '--remote', '--file', file]);
  files.push({ key, file: `r2/${filename}`, sha256: await sha256(file) });
}

const manifest = {
  format: 2,
  createdAt: new Date().toISOString(),
  database: {
    schema: { file: 'schema.sql', sha256: await sha256(schemaFile) },
    data: { file: 'data.sql', sha256: await sha256(dataFile) },
  },
  r2: files,
};
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(path.join(destination, 'COMPLETE'), 'Database export and every referenced R2 object were downloaded and hashed.\n');
await import('node:fs/promises').then(({ rm }) => rm(path.join(destination, 'INCOMPLETE')));
console.log(`Backup complete: ${path.relative(projectRoot, destination)}`);
console.log(`R2 objects: ${files.length}`);
