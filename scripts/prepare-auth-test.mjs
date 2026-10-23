// Local-only integration fixtures. Never used by the application or deployed.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
await mkdir('.wrangler', { recursive: true });
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
config.main = resolve('dist/server/index.js');
// Keep mutable SQLite fixtures outside the watched module tree.
config.base_dir = resolve('dist/server');
config.build = { watch_dir: resolve('dist/server') };
config.compatibility_date = '2026-05-22';
config.assets.directory = resolve('dist/client');
config.vars = { ...config.vars, APP_ORIGIN: 'http://localhost:3000', AUTH_CLIENT_SECRET: 'local-test-only',
  AUTH_SESSION_SECRET: randomBytes(32).toString('hex'), AUTH_OWNER_SUBJECT: 'auth0|test-owner' };
await writeFile('.wrangler/auth-runtime.json', JSON.stringify(config));
const now = Date.now();
await writeFile('.wrangler/auth-fixtures.sql', ['a', 'b', 'owner'].map((id) =>
  `INSERT OR REPLACE INTO auth_sessions VALUES('test-${id}','auth0|test-${id}','${id}@example.invalid','Test ${id}',${now + 3600000});`).join('\n'));
execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'tradovia-db', '--local',
  '--persist-to', '.wrangler/auth-test', '--file', '.wrangler/auth-fixtures.sql'],
  { stdio: 'pipe', env: { ...process.env, WRANGLER_LOG_PATH: '.wrangler/logs' } });
console.log('Local test configuration and three synthetic identities ready. No real Auth0 credentials used.');
