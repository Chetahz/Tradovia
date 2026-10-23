import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { projectRoot, runWrangler, sha256 } from './ops-common.mjs';

const requested = process.argv[2];
if (!requested) throw new Error('Usage: npm run ops:restore-drill -- backups/<timestamp>');
const source = path.resolve(projectRoot, requested);
const backupRoot = path.resolve(projectRoot, 'backups') + path.sep;
if (!source.startsWith(backupRoot) || !existsSync(path.join(source, 'COMPLETE')))
  throw new Error('Choose a completed snapshot inside backups/');
const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
if (manifest.format !== 2) throw new Error('Snapshot format 2 is required for a restore drill');
const schemaFile = path.join(source, manifest.database.schema.file);
const dataFile = path.join(source, manifest.database.data.file);
if ((await sha256(schemaFile)) !== manifest.database.schema.sha256)
  throw new Error('Schema checksum does not match the manifest');
if ((await sha256(dataFile)) !== manifest.database.data.sha256)
  throw new Error('Data checksum does not match the manifest');
for (const item of manifest.r2) {
  if ((await sha256(path.join(source, item.file))) !== item.sha256)
    throw new Error(`R2 checksum does not match for ${item.file}`);
}

const drillRoot = path.resolve(projectRoot, '.wrangler', `restore-drill-${Date.now()}`);
const allowedRoot = path.resolve(projectRoot, '.wrangler') + path.sep;
if (!drillRoot.startsWith(allowedRoot)) throw new Error('Unsafe restore drill path');
await mkdir(drillRoot, { recursive: true });
try {
  const schemaRestore = path.join(drillRoot, 'schema-restore.sql');
  const dataRestore = path.join(drillRoot, 'data-restore.sql');
  await writeFile(schemaRestore, await readFile(schemaFile, 'utf8'));
  await writeFile(dataRestore, await readFile(dataFile, 'utf8'));
  runWrangler(['d1', 'execute', 'tradovia-db', '--local', '--persist-to', drillRoot, '--file', schemaRestore, '--yes'], { capture: true });
  runWrangler(['d1', 'execute', 'tradovia-db', '--local', '--persist-to', drillRoot, '--file', dataRestore, '--yes'], { capture: true });
  const localFiles = await readdir(drillRoot, { recursive: true });
  const sqliteRelative = localFiles.find((file) => file.endsWith('.sqlite'));
  if (!sqliteRelative) throw new Error('Restored SQLite file was not found');
  const restored = new DatabaseSync(path.join(drillRoot, sqliteRelative), { readOnly: true });
  const integrity = restored.prepare('PRAGMA integrity_check').get();
  const counts = restored.prepare(`SELECT (SELECT COUNT(*) FROM users) AS users,(SELECT COUNT(*) FROM trades) AS trades,(SELECT COUNT(*) FROM trade_images) AS images`).get();
  restored.close();
  if (integrity.integrity_check !== 'ok')
    throw new Error('Restored database did not pass PRAGMA integrity_check');
  console.log('Restore drill passed:', { integrity: integrity.integrity_check, ...counts });
  console.log(`Verified R2 files: ${manifest.r2.length}`);
} finally {
  await rm(drillRoot, { recursive: true, force: true });
}
