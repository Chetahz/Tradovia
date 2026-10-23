import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const wrangler = path.join(
  projectRoot,
  'node_modules',
  'wrangler',
  'bin',
  'wrangler.js',
);

export function runWrangler(args, { capture = false } = {}) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.status !== 0) {
    const detail = capture ? (result.stderr || result.stdout).trim() : '';
    throw new Error(`Wrangler failed (${args.slice(0, 3).join(' ')}): ${detail}`);
  }
  return capture ? result.stdout : '';
}

export function d1Rows(sql, remote = true) {
  const output = runWrangler(
    [
      'd1',
      'execute',
      'tradovia-db',
      remote ? '--remote' : '--local',
      '--json',
      '--command',
      sql,
    ],
    { capture: true },
  );
  const parsed = JSON.parse(output);
  return parsed.flatMap((statement) => statement.results || []);
}

export async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}
