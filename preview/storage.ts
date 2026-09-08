import {
  demoData,
  emptyData,
  validateTrade,
  type WorkspaceData,
} from '../lib/domain';
const DB_NAME = 'tradovia-vercel-preview-v1';
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('workspace');
      r.result.createObjectStore('images');
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function read<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly'),
      r = tx.objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    tx.oncomplete = () => db.close();
  });
}
async function write(store: string, key: string, value: unknown) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export const readImage = (id: string) => read<Blob>('images', id);
export async function createPreviewWorkspace(
  name: string,
  portfolioName: string,
  balance: number,
  timezone: string,
) {
  if (await read('workspace', 'personal')) return;
  const data = emptyData();
  const portfolioId = crypto.randomUUID();
  data.profile = { name, timezone };
  data.portfolios = [
    { id: portfolioId, name: portfolioName, balance, currency: 'USD' },
  ];
  data.accounts = [
    {
      id: crypto.randomUUID(),
      portfolioId,
      name: 'Manual account',
      balance,
      type: 'manual',
    },
  ];
  await write('workspace', 'personal', data);
}
export const hasPreviewWorkspace = async () =>
  !!(await read('workspace', 'personal'));
function upsert<T extends { id: string }>(rows: T[], value: T) {
  const index = rows.findIndex((x) => x.id === value.id);
  if (index < 0) rows.push(value);
  else rows[index] = value;
}
const json = (data: unknown, status = 200) => Response.json(data, { status });
// Only the separately built browser preview installs this transport.
// Original server APIs and production persistence remain untouched.
export function installPreviewTransport() {
  const original = window.fetch.bind(window);
  let queue = Promise.resolve();
  window.fetch = async (input, init) => {
    const request = new Request(
      new URL(
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
        location.origin,
      ),
      init,
    );
    const url = new URL(request.url);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/'))
      return original(input, init);
    const result = queue.then(async () => {
      try {
        const personal =
          location.pathname === '/workspace' &&
          sessionStorage.getItem('tradovia.preview.session') === 'active';
        const key = personal ? 'personal' : 'current';
        if (url.searchParams.get('mode') !== 'demo' && !personal)
          return json({ error: 'Preview supports demo data only' }, 403);
        if (url.pathname === '/api/billing')
          return request.method === 'GET'
            ? json({ ready: false })
            : json({ error: 'Billing is disabled in this preview' }, 403);
        if (url.pathname === '/api/images' && request.method === 'POST') {
          const file = (await request.formData()).get('image');
          if (
            !(file instanceof File) ||
            !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
            file.size > 5 * 1024 * 1024
          )
            throw Error('Use PNG, JPEG or WebP up to 5 MB');
          const id = crypto.randomUUID();
          await write('images', id, file);
          return json({ id });
        }
        if (url.pathname !== '/api/workspace')
          return json({ error: 'Not available in preview' }, 404);
        let d = await read<WorkspaceData>('workspace', key);
        if (!d) {
          if (personal)
            return json({ error: 'Complete workspace setup first' }, 409);
          d = demoData();
          await write('workspace', key, d);
        }
        if (request.method === 'GET') return json(d);
        if (request.method !== 'POST')
          return json({ error: 'Method not allowed' }, 405);
        const { action, value: v } = (await request.json()) as {
          action: string;
          // oxlint-disable-next-line typescript/no-explicit-any -- Preview transport validates action payloads below.
          value: any;
        };
        switch (action) {
          case 'saveTrade': {
            const trade = validateTrade(v);
            if (!d.accounts.some((a) => a.id === trade.accountId))
              throw Error('Account not found');
            upsert(d.trades, trade);
            break;
          }
          case 'deleteTrade':
            d.trades = d.trades.filter((t) => t.id !== v);
            break;
          case 'saveGoal': {
            if (
              !['week', 'month', 'year'].includes(v.period) ||
              !['pnl', 'trades'].includes(v.type) ||
              !Number.isFinite(v.target) ||
              v.target <= 0
            )
              throw Error('Invalid goal');
            const goal = { ...v, id: `goal-${v.period}-${v.type}` };
            if (v.id !== goal.id)
              d.goals = d.goals.filter((g) => g.id !== v.id);
            upsert(d.goals, goal);
            break;
          }
          case 'saveRule':
            if (
              typeof v.text !== 'string' ||
              !v.text.trim() ||
              v.text.length > 300
            )
              throw Error('Invalid rule');
            upsert(d.rules, {
              id: v.id || crypto.randomUUID(),
              text: v.text,
              enabled: !!v.enabled,
            });
            break;
          case 'createPortfolio': {
            if (!v.name?.trim() || !Number.isFinite(v.balance) || v.balance < 0)
              throw Error('Invalid portfolio');
            const id = crypto.randomUUID();
            d.portfolios.push({
              id,
              name: v.name,
              balance: v.balance,
              currency: 'USD',
            });
            d.accounts.push({
              id: crypto.randomUUID(),
              portfolioId: id,
              name: 'Manual account',
              type: 'manual',
              balance: v.balance,
            });
            break;
          }
          case 'createAccount':
            if (
              !d.portfolios.some((p) => p.id === v.portfolioId) ||
              !v.name?.trim() ||
              !Number.isFinite(v.balance) ||
              v.balance < 0
            )
              throw Error('Invalid account');
            d.accounts.push({ ...v, id: crypto.randomUUID(), type: 'manual' });
            break;
          case 'saveProfile':
            if (!v.name?.trim()) throw Error('Invalid profile');
            Intl.DateTimeFormat('en', { timeZone: v.timezone });
            d.profile = { ...d.profile, name: v.name, timezone: v.timezone };
            break;
          case 'saveWatchlist':
            if (
              !Array.isArray(v) ||
              v.length > 7 ||
              v.some((s) => typeof s !== 'string')
            )
              throw Error('Invalid watchlist');
            d.profile.watchlist = [...new Set<string>(v)];
            break;
          case 'prepareConnection':
            if (!d.accounts.some((a) => a.id === v.accountId))
              throw Error('Account not found');
            if (
              d.connections.some(
                (c) => c.provider === v.provider && c.accountId === v.accountId,
              )
            )
              throw Error('Connection already exists');
            d.connections.push({
              ...v,
              id: crypto.randomUUID(),
              status: 'not_configured',
              lastSync: null,
              error: null,
            });
            break;
          case 'disconnect': {
            const c = d.connections.find((c) => c.id === v);
            if (c) c.status = 'disconnected';
            break;
          }
          case 'sync':
          case 'reconnect':
            return json(
              {
                error:
                  'Broker provider is not configured. Manual journaling remains available.',
              },
              503,
            );
          case 'resetDemo': {
            if (personal)
              return json({ error: 'Only the sample demo can be reset' }, 403);
            d = demoData();
            const db = await openDB();
            await new Promise<void>((resolve, reject) => {
              const tx = db.transaction('images', 'readwrite');
              tx.objectStore('images').clear();
              tx.oncomplete = () => {
                db.close();
                resolve();
              };
              tx.onerror = () => reject(tx.error);
            });
            break;
          }
          default:
            return json({ error: 'Unknown preview action' }, 400);
        }
        await write('workspace', key, d);
        return json(d);
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'Browser storage unavailable',
          },
          400,
        );
      }
    });
    queue = result.then(
      () => {},
      () => {},
    );
    return result;
  };
}
