import { database, imageBucket } from '@/db';
import { owner, checkOrigin, apiFailure, ApiError } from '@/lib/server-auth';
import { initialize, readWorkspace } from '@/lib/repository';
import { validateTrade } from '@/lib/domain';
import { readBoundedBody } from '@/lib/request-body';
import { companionClock } from '@/lib/daily-companion';
import { validateReviewReminder } from '@/lib/review-reminder';
import { validateDailyCheckin } from '@/lib/daily-checkin';
import {
  removeAllOwnerImages,
  removeUnreferencedTradeImages,
} from '@/lib/image-lifecycle';
import { recordOpsEvent } from '@/lib/admin';
import { hasProAccess, planLimits, PRO_LIMITS } from '@/lib/plan-access';
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
  let eventOwnerId: string | null = null;
  let eventMode: 'demo' | 'real' | null = null;
  let eventAction = 'unknown';
  try {
    checkOrigin(request);
    const who = await owner(request);
    eventOwnerId = who.id;
    eventMode = who.mode;
    await initialize(who.id, who.mode);
    const text = new TextDecoder().decode(
      await readBoundedBody(request, 2000000),
    );
    const body = JSON.parse(text);
    eventAction = typeof body.action === 'string' ? body.action : 'unknown';
    const db = database();
    const d = await readWorkspace(who.id);
    const paid = who.mode === 'demo' || hasProAccess(d.subscription);
    const limits = who.mode === 'demo' ? PRO_LIMITS : planLimits(d.subscription);
    const prefix = who.id + '|';
    const v = body.value;
    if (body.action === 'saveDailyCheckin') {
      const today = companionClock(new Date(), d.profile.timezone).date;
      const checkin = validateDailyCheckin(
        v,
        today,
        (d.playbooks || [])
          .filter((plan) => !plan.archived)
          .map((plan) => plan.id),
        d.trades.some((trade) => trade.date === today),
      );
      await db
        .prepare(
          'INSERT INTO daily_checkins(id,owner_id,checkin_date,payload) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload WHERE daily_checkins.owner_id=excluded.owner_id',
        )
        .bind(prefix + today, who.id, today, JSON.stringify(checkin))
        .run();
    } else if (body.action === 'savePlaybook') {
      if (
        !v ||
        typeof v.name !== 'string' ||
        !v.name.trim() ||
        v.name.length > 120 ||
        typeof v.entry !== 'string' ||
        !v.entry.trim() ||
        v.entry.length > 4000
      )
        throw new ApiError(400, 'Invalid playbook');
      const existing = d.playbooks?.find((p) => p.id === v.id);
      if (!existing && (d.playbooks?.length || 0) >= limits.playbooks)
        throw new ApiError(409, 'Playbook limit reached');
      const plan = {
        id: existing?.id || crypto.randomUUID(),
        name: v.name.trim(),
        entry: v.entry.trim(),
        technique: String(v.technique || '').slice(0, 120),
        exit: String(v.exit || '').slice(0, 4000),
        risk: String(v.risk || '').slice(0, 4000),
        checklist: String(v.checklist || '').slice(0, 4000),
        archived: Boolean(v.archived),
        version: (existing?.version || 0) + 1,
      };
      await db
        .prepare(
          'INSERT INTO playbooks(id,owner_id,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload WHERE playbooks.owner_id=excluded.owner_id',
        )
        .bind(prefix + plan.id, who.id, JSON.stringify(plan))
        .run();
    } else if (body.action === 'saveTrade') {
      const existingTrade = d.trades.find((trade) => trade.id === v?.id);
      if (!existingTrade && d.trades.length >= limits.trades)
        throw new ApiError(
          403,
          paid
            ? 'Trade limit reached'
            : 'Free includes 50 trades. Upgrade to Pro to keep building your journal.',
        );
      const previousImageIds =
        existingTrade?.imageIds || [];
      if (v?.playbook) {
        const existing = d.trades.find((t) => t.id === v.id)?.playbook;
        const snapshot =
          existing?.id === v.playbook.id &&
          existing?.version === v.playbook.version
            ? existing
            : d.playbooks?.find((p) => p.id === v.playbook.id && !p.archived);
        if (!snapshot) throw new ApiError(400, 'Playbook is unavailable');
        v.playbook = snapshot;
      }
      const t = validateTrade(v);
      if (!d.accounts.some((a) => a.id === t.accountId))
        throw new ApiError(403, 'Account not found');
      if (
        t.importRef &&
        d.trades.some(
          (x) =>
            x.id !== t.id &&
            x.accountId === t.accountId &&
            x.importRef?.positionId === t.importRef?.positionId,
        )
      )
        throw new ApiError(409, 'This MT5 position is already in your journal');
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
      await removeUnreferencedTradeImages(
        db,
        imageBucket(),
        who.id,
        previousImageIds.filter((id) => !t.imageIds.includes(id)),
      );
      await db
        .prepare(
          'DELETE FROM daily_checkins WHERE id=? AND owner_id=? AND json_extract(payload, ?)=?',
        )
        .bind(prefix + t.date, who.id, '$.kind', 'rest')
        .run();
    } else if (body.action === 'saveTrades') {
      if (!paid)
        throw new ApiError(
          403,
          'Report and CSV import require Pro. Manual journaling remains available.',
        );
      if (!Array.isArray(v) || !v.length || v.length > 500)
        throw new ApiError(400, 'Import must contain 1–500 trades');
      const imported = v.map(validateTrade);
      const existingImports = new Set(
        d.trades
          .filter((t) => t.importRef)
          .map(
            (t) =>
              `${t.accountId}|${t.importRef!.format}|${t.importRef!.positionId}`,
          ),
      );
      for (const trade of imported) {
        if (!trade.importRef) continue;
        const key = `${trade.accountId}|${trade.importRef.format}|${trade.importRef.positionId}`;
        if (existingImports.has(key))
          throw new ApiError(
            409,
            'This imported trade is already in your journal',
          );
        existingImports.add(key);
      }
      if (d.trades.length + imported.length > limits.trades)
        throw new ApiError(409, 'Trade limit reached');
      if (
        imported.some(
          (trade) =>
            trade.imageIds.length ||
            !d.accounts.some((account) => account.id === trade.accountId),
        )
      )
        throw new ApiError(403, 'Invalid imported trade account or images');
      await db.batch(
        imported.map((trade) =>
          db
            .prepare(
              'INSERT INTO trades(id,owner_id,account_id,trade_date,payload) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET account_id=excluded.account_id,trade_date=excluded.trade_date,payload=excluded.payload WHERE trades.owner_id=excluded.owner_id',
            )
            .bind(
              prefix + trade.id,
              who.id,
              prefix + trade.accountId,
              trade.date,
              JSON.stringify(trade),
            ),
        ),
      );
      for (const date of new Set(imported.map((trade) => trade.date))) {
        await db
          .prepare(
            'DELETE FROM daily_checkins WHERE id=? AND owner_id=? AND json_extract(payload, ?)=?',
          )
          .bind(prefix + date, who.id, '$.kind', 'rest')
          .run();
      }
      if (who.mode === 'real') {
        await recordOpsEvent({
          ownerId: who.id,
          category: 'import',
          severity: 'info',
          status: 'success',
          message: `Imported ${imported.length} trades successfully`,
          metadata: {
            count: imported.length,
            formats: [...new Set(imported.map((trade) => trade.importRef?.format).filter(Boolean))].join(','),
          },
        }).catch(() => undefined);
      }
    } else if (body.action === 'deleteTrade') {
      if (typeof v !== 'string') throw new Error('Invalid trade');
      const imageIds = d.trades.find((trade) => trade.id === v)?.imageIds || [];
      await db
        .prepare('DELETE FROM trades WHERE id=? AND owner_id=?')
        .bind(prefix + v, who.id)
        .run();
      await removeUnreferencedTradeImages(
        db,
        imageBucket(),
        who.id,
        imageIds,
      );
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
        !paid &&
        d.portfolios.length >= limits.portfolios
      )
        throw new ApiError(
          403,
          'Free includes one portfolio. Upgrade to Pro for additional portfolios.',
        );
      if (d.portfolios.length >= limits.portfolios)
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
      if (d.accounts.length >= limits.accounts)
        throw new ApiError(
          403,
          paid
            ? 'Account limit reached'
            : 'Free includes one journal account. Upgrade to Pro for multiple accounts.',
        );
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
    } else if (body.action === 'saveReviewReminder') {
      const reviewReminder = validateReviewReminder(v);
      await db
        .prepare('UPDATE profiles SET payload=? WHERE owner_id=?')
        .bind(JSON.stringify({ ...d.profile, reviewReminder }), who.id)
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
      if (v?.provider === 'metaapi' || v?.provider === 'mt5-bridge')
        throw new ApiError(410, 'Use the secure MT5 cloud connection flow');
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
      if (c.provider === 'metaapi')
        throw new ApiError(
          409,
          'Disconnect MT5 from the cloud connection screen',
        );
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
      await removeAllOwnerImages(
        db,
        imageBucket(),
        who.id,
        d.profile.avatarVersion,
      );
      await db.prepare('DELETE FROM users WHERE id=?').bind(who.id).run();
      await initialize(who.id, who.mode);
    } else throw new ApiError(400, 'Unknown action');
    return Response.json(await readWorkspace(who.id), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    if (eventMode === 'real') {
      const status = e instanceof ApiError ? e.status : 500;
      await recordOpsEvent({
        ownerId: eventOwnerId,
        category: eventAction === 'saveTrades' ? 'import' : 'api',
        severity: status >= 500 ? 'error' : 'warning',
        status: 'failed',
        message:
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Workspace request failed',
        metadata: { action: eventAction, status },
      }).catch(() => undefined);
    }
    return apiFailure(e);
  }
}
