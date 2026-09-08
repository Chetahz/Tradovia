import { database } from '@/db';
import { owner, checkOrigin, apiFailure, ApiError } from '@/lib/server-auth';
import { initialize, readWorkspace } from '@/lib/repository';
import { validateTrade } from '@/lib/domain';
import { readBoundedBody } from '@/lib/request-body';
export async function GET(request: Request) {
  try {
    const who = await owner(request);
    await initialize(who.id, who.mode);
    return Response.json(await readWorkspace(who.id), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return apiFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const who = await owner(request);
    await initialize(who.id, who.mode);
    const text = new TextDecoder().decode(
      await readBoundedBody(request, 30000),
    );
    const body = JSON.parse(text);
    const db = database();
    const d = await readWorkspace(who.id);
    const prefix = who.id + '|';
    const v = body.value;
    if (body.action === 'saveTrade') {
      const t = validateTrade(v);
      if (!d.accounts.some((a) => a.id === t.accountId))
        throw new ApiError(403, 'Account not found');
      if (d.trades.length >= 5000 && !d.trades.some((x) => x.id === t.id))
        throw new ApiError(409, 'Trade limit reached');
      for (const image of t.imageIds) {
        if (
          !(await db
            .prepare('SELECT id FROM trade_images WHERE id=? AND owner_id=?')
            .bind(image, who.id)
            .first())
        )
          throw new ApiError(403, 'Image not found');
      }
      await db
        .prepare(
          'INSERT INTO trades(id,owner_id,account_id,trade_date,payload) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET account_id=excluded.account_id,trade_date=excluded.trade_date,payload=excluded.payload WHERE trades.owner_id=excluded.owner_id',
        )
        .bind(
          prefix + t.id,
          who.id,
          prefix + t.accountId,
          t.date,
          JSON.stringify(t),
        )
        .run();
    } else if (body.action === 'deleteTrade') {
      if (typeof v !== 'string') throw new Error('Invalid trade');
      await db
        .prepare('DELETE FROM trades WHERE id=? AND owner_id=?')
        .bind(prefix + v, who.id)
        .run();
    } else if (body.action === 'saveGoal') {
      if (
        !v ||
        !['week', 'month', 'year'].includes(v.period) ||
        !['pnl', 'trades'].includes(v.type) ||
        !Number.isFinite(v.target) ||
        v.target <= 0 ||
        v.target > 1e9
      )
        throw new Error('Invalid goal');
      const goal = {
        id: `goal-${v.period}-${v.type}`,
        period: v.period,
        type: v.type,
        target: v.target,
      };
      await db
        .prepare(
          'INSERT INTO goals(id,owner_id,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload WHERE goals.owner_id=excluded.owner_id',
        )
        .bind(prefix + goal.id, who.id, JSON.stringify(goal))
        .run();
      if (v.id && v.id !== goal.id)
        await db
          .prepare('DELETE FROM goals WHERE id=? AND owner_id=?')
          .bind(prefix + v.id, who.id)
          .run();
    } else if (body.action === 'saveRule') {
      if (
        !v ||
        typeof v.text !== 'string' ||
        !v.text.trim() ||
        v.text.length > 300 ||
        typeof v.enabled !== 'boolean'
      )
        throw new Error('Invalid rule');
      const rule = {
        id:
          typeof v.id === 'string' && /^[-a-zA-Z0-9]{1,80}$/.test(v.id)
            ? v.id
            : crypto.randomUUID(),
        text: v.text.trim(),
        enabled: v.enabled,
      };
      await db
        .prepare(
          'INSERT INTO rules(id,owner_id,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload WHERE rules.owner_id=excluded.owner_id',
        )
        .bind(prefix + rule.id, who.id, JSON.stringify(rule))
        .run();
    } else if (body.action === 'createPortfolio') {
      if (
        !v ||
        typeof v.name !== 'string' ||
        !v.name.trim() ||
        v.name.length > 80 ||
        !Number.isFinite(v.balance) ||
        v.balance < 0 ||
        v.balance > 1e9
      )
        throw new Error('Invalid portfolio');
      if (
        who.mode === 'real' &&
        d.subscription.plan === 'manual' &&
        d.portfolios.length >= 1
      )
        throw new ApiError(
          403,
          'The Manual plan includes one portfolio. Additional portfolios require Pro at launch.',
        );
      if (d.portfolios.length >= 20)
        throw new ApiError(409, 'Portfolio limit reached');
      const p = {
        id: crypto.randomUUID(),
        name: v.name.trim(),
        balance: v.balance,
        currency: 'USD',
      };
      const a = {
        id: crypto.randomUUID(),
        portfolioId: p.id,
        name: 'Manual account',
        type: 'manual',
        balance: v.balance,
      };
      await db.batch([
        db
          .prepare('INSERT INTO portfolios(id,owner_id,payload) VALUES(?,?,?)')
          .bind(prefix + p.id, who.id, JSON.stringify(p)),
        db
          .prepare(
            'INSERT INTO trading_accounts(id,owner_id,portfolio_id,payload) VALUES(?,?,?,?)',
          )
          .bind(prefix + a.id, who.id, prefix + p.id, JSON.stringify(a)),
      ]);
    } else if (body.action === 'createAccount') {
      if (
        !v ||
        !d.portfolios.some((p) => p.id === v.portfolioId) ||
        typeof v.name !== 'string' ||
        !v.name.trim() ||
        v.name.length > 80 ||
        !Number.isFinite(v.balance) ||
        v.balance < 0 ||
        v.balance > 1e9
      )
        throw new Error('Invalid account');
      const a = {
        id: crypto.randomUUID(),
        portfolioId: v.portfolioId,
        name: v.name.trim(),
        balance: v.balance,
        type: 'manual',
      };
      await db
        .prepare(
          'INSERT INTO trading_accounts(id,owner_id,portfolio_id,payload) VALUES(?,?,?,?)',
        )
        .bind(prefix + a.id, who.id, prefix + a.portfolioId, JSON.stringify(a))
        .run();
    } else if (body.action === 'saveProfile') {
      if (
        !v ||
        typeof v.name !== 'string' ||
        !v.name.trim() ||
        v.name.length > 80 ||
        typeof v.timezone !== 'string'
      )
        throw new Error('Invalid profile');
      try {
        Intl.DateTimeFormat('en', { timeZone: v.timezone });
      } catch {
        throw new Error('Invalid timezone');
      }
      await db
        .prepare('UPDATE profiles SET payload=? WHERE owner_id=?')
        .bind(
          JSON.stringify({
            ...d.profile,
            name: v.name.trim(),
            timezone: v.timezone,
          }),
          who.id,
        )
        .run();
    } else if (body.action === 'saveWatchlist') {
      const symbols = [
        'OANDA:XAUUSD',
        'OANDA:EURUSD',
        'OANDA:GBPUSD',
        'OANDA:USDJPY',
        'FOREXCOM:NSXUSD',
        'BITSTAMP:BTCUSD',
        'NASDAQ:AAPL',
      ];
      if (
        !Array.isArray(v) ||
        v.length > symbols.length ||
        v.some((s) => !symbols.includes(s)) ||
        new Set(v).size !== v.length
      )
        throw new Error('Invalid watchlist');
      await db
        .prepare('UPDATE profiles SET payload=? WHERE owner_id=?')
        .bind(JSON.stringify({ ...d.profile, watchlist: v }), who.id)
        .run();
    } else if (body.action === 'prepareConnection') {
      if (
        !v ||
        !d.accounts.some((a) => a.id === v.accountId) ||
        !['metaapi', 'mt5-bridge', 'ctrader'].includes(v.provider)
      )
        throw new Error('Invalid connection');
      if (
        d.connections.some(
          (c) => c.accountId === v.accountId && c.provider === v.provider,
        )
      )
        throw new ApiError(409, 'This connection already exists');
      const c = {
        id: crypto.randomUUID(),
        accountId: v.accountId,
        provider: v.provider,
        status: 'not_configured',
        lastSync: null,
        error: null,
      };
      await db
        .prepare(
          'INSERT INTO broker_connections(id,owner_id,account_id,payload) VALUES(?,?,?,?)',
        )
        .bind(prefix + c.id, who.id, prefix + c.accountId, JSON.stringify(c))
        .run();
    } else if (body.action === 'disconnect') {
      const c = d.connections.find((c) => c.id === v);
      if (!c) throw new ApiError(404, 'Connection not found');
      await db
        .prepare(
          'UPDATE broker_connections SET payload=? WHERE id=? AND owner_id=?',
        )
        .bind(
          JSON.stringify({ ...c, status: 'disconnected' }),
          prefix + c.id,
          who.id,
        )
        .run();
    } else if (body.action === 'reconnect' || body.action === 'sync')
      throw new ApiError(
        503,
        'Broker provider is not configured. Manual journaling remains available.',
      );
    else if (body.action === 'resetDemo') {
      if (who.mode !== 'demo') throw new ApiError(403, 'Demo reset only');
      await db.prepare('DELETE FROM users WHERE id=?').bind(who.id).run();
      await initialize(who.id, who.mode);
    } else throw new ApiError(400, 'Unknown action');
    return Response.json(await readWorkspace(who.id), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return apiFailure(e);
  }
}
