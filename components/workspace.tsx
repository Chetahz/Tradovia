'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ShieldCheck,
  Target,
  Globe2,
  Wallet,
  Plug,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Sun,
  Moon,
  Search,
  Download,
  Trash2,
  Pencil,
  Check,
  LogOut,
  Compass,
  X,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  statistics,
  net,
  money,
  dateKey,
  inPeriod,
  type Trade,
  type WorkspaceData,
  type Goal,
} from '@/lib/domain';
import {
  Pick,
  Field,
  Metric,
  Equity,
  TradeTable,
  Breakdown,
  type Translate,
} from './workspace-ui';
import { TradeForm, SimpleForm } from './trade-forms';
import { TradingCalendar, RiskCalculator } from './trading-tools';
import Market from './market';
import WorkspaceGuide from './workspace-guide';
import { AccountViews } from './account-views';
const pages = [
  ['overview', 'Overview', 'ภาพรวม', LayoutDashboard],
  ['journal', 'Trade Journal', 'บันทึกการเทรด', BookOpen],
  ['calendar', 'Trading Calendar', 'ปฏิทินการเทรด', CalendarDays],
  ['analytics', 'Analytics', 'วิเคราะห์ผล', ChartNoAxesCombined],
  ['risk', 'Risk Center', 'บริหารความเสี่ยง', ShieldCheck],
  ['goals', 'Goals & Rules', 'เป้าหมายและกฎ', Target],
  ['market', 'Market', 'ตลาด', Globe2],
  ['portfolio', 'Portfolio', 'พอร์ต', Wallet],
  ['connections', 'Broker Connections', 'เชื่อมต่อโบรกเกอร์', Plug],
  ['settings', 'Settings', 'ตั้งค่า', Settings],
] as const;
export default function Workspace({ mode }: { mode: 'demo' | 'real' }) {
  const [data, setData] = useState<WorkspaceData | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState('overview'),
    [th, setTh] = useState(false),
    [dark, setDark] = useState(false),
    [portfolio, setPortfolio] = useState('all'),
    [toast, setToast] = useState(''),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState('all'),
    [edit, setEdit] = useState<Trade | null>(null),
    [detail, setDetail] = useState<Trade | null>(null),
    [review, setReview] = useState<{
      label: string;
      field?: 'setup' | 'symbol';
      value?: string;
    } | null>(null),
    [confirm, setConfirm] = useState<string | null>(null),
    [tour, setTour] = useState(-1),
    [goal, setGoal] = useState<Goal | null>(null),
    [formKind, setFormKind] = useState('');
  const t: Translate = (en, thai) => (th ? thai : en);
  const endpoint = `/api/workspace?mode=${mode}`;
  const [preferencesReady, setPreferencesReady] = useState(false);
  const reload = useCallback(async () => {
    setError('');
    try {
      const r = await fetch(endpoint);
      const d = (await r.json()) as WorkspaceData & { error?: string };
      if (!r.ok) throw new Error(d.error);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load');
    }
  }, [endpoint]);
  useEffect(() => {
    queueMicrotask(() => {
      void reload();
      setTh(localStorage.getItem('tradovia.language') === 'th');
      setDark(localStorage.getItem('tradovia.theme') === 'dark');
      setPreferencesReady(true);
      const hash = location.hash.slice(1);
      if (pages.some((p) => p[0] === hash)) setPage(hash);
    });
  }, [reload]);
  useEffect(() => {
    const syncPage = () => {
      const hash = location.hash.slice(1);
      setPage(pages.some((p) => p[0] === hash) ? hash : 'overview');
    };
    window.addEventListener('hashchange', syncPage);
    window.addEventListener('popstate', syncPage);
    return () => {
      window.removeEventListener('hashchange', syncPage);
      window.removeEventListener('popstate', syncPage);
    };
  }, []);
  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tradovia.theme', dark ? 'dark' : 'light');
    return () => document.documentElement.classList.remove('dark');
  }, [dark, preferencesReady]);
  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.lang = th ? 'th' : 'en';
    localStorage.setItem('tradovia.language', th ? 'th' : 'en');
  }, [th, preferencesReady]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const navigate = (p: string) => {
    setPage(p);
    if (location.hash !== `#${p}`) history.pushState(null, '', `#${p}`);
  };
  const mutate = async (action: string, value: unknown) => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      const d = (await r.json()) as WorkspaceData & { error?: string };
      if (!r.ok) throw new Error(d.error);
      setData(d);
      setToast(t('Saved to your workspace', 'บันทึกแล้ว'));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const selectedAccounts = useMemo(
    () =>
      data?.accounts.filter(
        (a) => portfolio === 'all' || a.portfolioId === portfolio,
      ) ?? [],
    [data, portfolio],
  );
  const trades = useMemo(
    () =>
      data?.trades.filter((tr) =>
        selectedAccounts.some((a) => a.id === tr.accountId),
      ) ?? [],
    [data, selectedAccounts],
  );
  const capital = selectedAccounts.reduce((n, a) => n + a.balance, 0),
    s = statistics(trades, capital);
  const reviewRows = trades.filter(
    (tr) =>
      tr.status === 'CLOSED' &&
      (!review?.field || tr[review.field] === review.value),
  );
  const openReview = (
    label: string,
    rows: Trade[],
    field?: 'setup' | 'symbol',
  ) =>
    setReview({
      label,
      field,
      value: field ? (rows[0]?.[field] ?? '') : undefined,
    });
  const addTrade = () => {
    if (!data?.accounts.length) {
      navigate('portfolio');
      setFormKind('portfolio');
      return;
    }
    setEdit({
      id: crypto.randomUUID(),
      accountId: selectedAccounts[0]?.id ?? data.accounts[0].id,
      symbol: 'XAUUSD',
      side: 'LONG',
      status: 'CLOSED',
      date: dateKey(new Date()),
      time: new Date().toTimeString().slice(0, 5),
      entry: 0,
      sl: 0,
      tp: 0,
      lot: 0,
      risk: 0,
      gross: 0,
      fees: 0,
      setup: '',
      notes: '',
      imageIds: [],
    });
  };
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (v: unknown, o: unknown) => Promise<void> | void;
        };
      }
    ).modelContext;
    if (!context) return;
    const controller = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'navigate_tradovia_workspace',
            description: 'Navigate to a Tradovia workspace view.',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'string', enum: pages.map((p) => p[0]) },
              },
              required: ['page'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: unknown) => {
              const p = (input as { page?: string })?.page;
              if (!pages.some((x) => x[0] === p))
                throw new Error('Invalid page');
              setPage(p!);
              history.replaceState(null, '', `#${p}`);
              return { page: p };
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Optional browser capability. */
    }
    return () => controller.abort();
  }, []);
  const exportData = (csv = false) => {
    if (!data) return;
    const escape = (v: unknown) =>
      `"${(typeof v === 'string' || typeof v === 'number' ? String(v) : '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const headers = [
      'id',
      'symbol',
      'side',
      'date',
      'time',
      'entry',
      'sl',
      'tp',
      'lot',
      'risk',
      'gross',
      'fees',
      'setup',
      'notes',
    ];
    const content = csv
      ? [
          headers.join(','),
          ...trades.map((tr) =>
            headers.map((k) => escape(tr[k as keyof Trade])).join(','),
          ),
        ].join('\r\n')
      : JSON.stringify(data, null, 2);
    const url = URL.createObjectURL(
      new Blob([content], {
        type: csv ? 'text/csv;charset=utf-8' : 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradovia-${mode}-${dateKey(new Date())}.${csv ? 'csv' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const title = pages.find((p) => p[0] === page);
  const sorted = [...trades].sort((a, b) =>
    (b.date + b.time).localeCompare(a.date + a.time),
  );
  if (!data)
    return (
      <main className="loading-page">
        <Link prefetch={false} className="brand" href="/">
          tradovia
        </Link>
        <h1>
          {error
            ? t('Unable to open workspace', 'ไม่สามารถเปิดเวิร์กสเปซได้')
            : t('Opening your workspace…', 'กำลังเปิดเวิร์กสเปซ…')}
        </h1>
        {error && (
          <>
            <p role="alert">{error}</p>
            <button className="button ink" onClick={() => void reload()}>
              {t('Try again', 'ลองอีกครั้ง')}
            </button>
            <Link prefetch={false} className="button ghost" href="/auth">
              {t('Sign in', 'เข้าสู่ระบบ')}
            </Link>
          </>
        )}
      </main>
    );
  return (
    <SidebarProvider className="workspace-shell">
      <Sidebar className="app-sidebar">
        <SidebarHeader>
          <Link prefetch={false} className="brand" href="/">
            <span className="brand-mark" aria-hidden="true" />
            tradovia
          </Link>
          <div className="portfolio-switch">
            <Wallet size={17} />
            <span>
              {mode === 'demo'
                ? t('Demo Workspace', 'เวิร์กสเปซเดโม')
                : data.profile.name}
              <small>{t('Trading operating system', 'ระบบจัดการการเทรด')}</small>
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t('WORKSPACE', 'เวิร์กสเปซ')}</SidebarGroupLabel>
            <SidebarMenu>
              {pages.map(([id, en, thai, Icon], i) => (
                <SidebarMenuItem
                  key={id}
                  className={i === 7 ? 'nav-separator' : ''}
                >
                  <SidebarMenuButton
                    isActive={page === id}
                    onClick={() => navigate(id)}
                  >
                    <Icon size={18} />
                    <span>{t(en, thai)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {mode === 'demo' && (
            <div className="demo-sidebar-card">
              <Compass size={21} />
              <b>{t('Make yourself at home.', 'ลองใช้งานได้เต็มที่')}</b>
              <p>
                {t(
                  'A complete workspace to explore, with sample trades.',
                  'สำรวจเวิร์กสเปซพร้อมข้อมูลตัวอย่าง',
                )}
              </p>
              <button onClick={() => setTour(0)}>
                {t('Take a quick tour', 'เริ่มทัวร์สั้น ๆ')}
                <ArrowRight size={15} />
              </button>
            </div>
          )}
          <Link
            prefetch={false}
            className="sidebar-profile"
            href={mode === 'demo' ? '/' : '/signout-with-chatgpt?return_to=/'}
          >
            <span className="avatar">{data.profile.name.slice(0, 1)}</span>
            <span>
              {data.profile.name}
              <small>
                {mode === 'demo'
                  ? t('Demo account', 'บัญชีเดโม')
                  : t('Manual plan', 'แพ็กเกจ Manual')}
              </small>
            </span>
            <LogOut size={16} />
          </Link>
        </SidebarFooter>
      </Sidebar>
      <main className="workspace-main">
        <header className="workspace-topbar">
          <div className="crumb">
            <SidebarTrigger />
            <span>
              {t('Workspace', 'เวิร์กสเปซ')}
              <span className="crumb-slash">/</span>
              <b>{title ? t(title[1], title[2]) : ''}</b>
            </span>
          </div>
          <div className="actions">
            <span className="saved-state">
              <span className="status-dot" />
              {busy
                ? t('Saving…', 'กำลังบันทึก…')
                : t('All changes saved', 'บันทึกแล้ว')}
            </span>
            <button className="text-button" onClick={() => setTh(!th)}>
              {th ? 'EN' : 'TH'}
            </button>
            <button
              className="icon-button"
              aria-label={t('Toggle theme', 'เปลี่ยนธีม')}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="avatar small">
              {data.profile.name.slice(0, 1)}
            </span>
          </div>
        </header>
        {mode === 'demo' && (
          <div className="demo-banner">
            <span>
              <Compass size={15} />
              {t(
                'You’re in the demo. Explore freely — your real workspace stays separate.',
                'คุณกำลังใช้เดโม ลองได้เต็มที่ ข้อมูลจริงแยกออกจากกันเสมอ',
              )}
            </span>
            <Link prefetch={false} href="/auth">
              {t('Create your workspace', 'สร้างเวิร์กสเปซของคุณ')}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
        <div className="workspace-content">
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError('')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <span className="overline">
                {t('YOUR TRADING, IN FOCUS', 'โฟกัสทุกส่วนของการเทรด')}
              </span>
              <h1>
                {page === 'overview'
                  ? t(
                      'A little perspective. A better process.',
                      'เห็นภาพชัดขึ้น เทรดอย่างเป็นระบบ',
                    )
                  : title
                    ? t(title[1], title[2])
                    : ''}
              </h1>
              <p>
                {page === 'overview'
                  ? t(
                      'Step back, see your progress, and make your next move count.',
                      'ทบทวนความก้าวหน้า แล้ววางแผนไม้ถัดไปอย่างมีเป้าหมาย',
                    )
                  : t(
                      'One connected workspace. Built around your process.',
                      'เวิร์กสเปซเดียว ที่เข้าใจวิธีเทรดของคุณ',
                    )}
              </p>
            </div>
            <button className="button ink add-trade" onClick={addTrade}>
              <Plus size={17} />
              {t('Add trade', 'บันทึกการเทรด')}
            </button>
          </div>
          <div className="workspace-filter">
            <Pick
              label={t('Portfolio filter', 'เลือกพอร์ต')}
              value={portfolio}
              onChange={setPortfolio}
              options={[
                { value: 'all', label: t('All portfolios', 'ทุกพอร์ต') },
                ...data.portfolios.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <span>
              {t('Account currency: USD', 'สกุลเงินบัญชี: USD')} ·{' '}
              {data.profile.timezone}
            </span>
          </div>
          <WorkspaceGuide
            key={`${mode}.${page}`}
            page={page}
            mode={mode}
            hasPortfolio={data.portfolios.length > 0}
            hasTrades={data.trades.length > 0}
            t={t}
            navigate={navigate}
            addTrade={addTrade}
          />
          {page === 'overview' && (
            <>
              <div className="metrics-grid">
                <Metric
                  label={t('Net P&L', 'กำไร / ขาดทุนสุทธิ')}
                  value={money(s.pnl)}
                  note={t(`${s.count} closed trades`, `${s.count} ไม้ที่ปิดแล้ว`)}
                  positive={s.pnl >= 0}
                />
                <Metric
                  label={t('Win rate', 'อัตราชนะ')}
                  value={`${s.winRate.toFixed(1)}%`}
                  note={t(`${s.wins} winning trades`, `${s.wins} ไม้ที่ชนะ`)}
                />
                <Metric
                  label={t('Profit factor', 'Profit factor')}
                  value={
                    s.profitFactor === Infinity
                      ? '∞'
                      : s.profitFactor.toFixed(2)
                  }
                  note={t('Net winners ÷ net losers', 'กำไรรวม ÷ ขาดทุนรวม')}
                />
                <Metric
                  label={t('Max drawdown', 'การลดลงสูงสุด')}
                  value={`${s.drawdown.toFixed(2)}%`}
                  note={t('From the equity peak', 'วัดจากจุดสูงสุดของพอร์ต')}
                />
              </div>
              <div className="overview-grid">
                <Equity trades={trades} capital={capital} t={t} />
                <div className="panel focus-panel">
                  <span className="overline">
                    {t('THE NEXT RIGHT THING', 'ก้าวถัดไปที่สำคัญ')}
                  </span>
                  <h2>{t('Keep your process close.', 'ให้กระบวนการนำทาง')}</h2>
                  <div className="focus-icon">
                    <ShieldCheck size={40} strokeWidth={1.2} />
                  </div>
                  <p>
                    {t(
                      'A strong process starts before the entry. Check your risk, then write your plan.',
                      'กระบวนการที่ดีเริ่มก่อนเข้าเทรด ตรวจสอบความเสี่ยง แล้วบันทึกแผน',
                    )}
                  </p>
                  <button
                    onClick={() => navigate('risk')}
                    className="button ghost"
                  >
                    {t('Plan your next position', 'วางแผนไม้ถัดไป')}
                    <ArrowUpRight size={16} />
                  </button>
                  <div className="focus-bottom">
                    <span>{t('Open positions', 'ไม้ที่ยังไม่ปิด')}</span>
                    <b>{s.open}</b>
                  </div>
                </div>
              </div>
              <div className="panel">
                <div className="section-heading">
                  <div>
                    <span className="overline">
                      {t('THE LATEST CHAPTER', 'การเทรดล่าสุด')}
                    </span>
                    <h2>{t('Recent trades', 'รายการล่าสุด')}</h2>
                  </div>
                  <button
                    className="text-button inline-flex gap-2"
                    onClick={() => navigate('journal')}
                  >
                    {t('View journal', 'ดูบันทึกทั้งหมด')}
                    <ArrowUpRight size={16} />
                  </button>
                </div>
                <TradeTable
                  trades={sorted.slice(0, 5)}
                  onView={setDetail}
                  t={t}
                />
              </div>
            </>
          )}
          {page === 'journal' && (
            <div className="panel">
              <div className="journal-toolbar">
                <label className="search-input">
                  <Search size={17} />
                  <input
                    aria-label={t('Search trades', 'ค้นหาการเทรด')}
                    placeholder={t(
                      'Search symbol, technique, notes…',
                      'ค้นหาสินทรัพย์ เทคนิค หรือบันทึก…',
                    )}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <Pick
                  label="Trade status"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'all', label: t('All trades', 'ทุกสถานะ') },
                    { value: 'CLOSED', label: t('Closed', 'ปิดแล้ว') },
                    { value: 'OPEN', label: t('Open', 'ยังไม่ปิด') },
                  ]}
                />
                <button
                  className="button ghost compact"
                  onClick={() => exportData(true)}
                >
                  <Download size={16} />
                  {t('Export', 'ส่งออก')}
                </button>
              </div>
              <TradeTable
                trades={sorted.filter(
                  (tr) =>
                    (status === 'all' || tr.status === status) &&
                    `${tr.symbol} ${tr.setup} ${tr.notes}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )}
                onView={setDetail}
                t={t}
              />
              <p className="table-foot">
                {t(
                  `${trades.length} trades in the selected portfolio · Net P&L includes fees`,
                  `${trades.length} รายการในพอร์ตที่เลือก · กำไรสุทธิหักค่าธรรมเนียมแล้ว`,
                )}
              </p>
            </div>
          )}
          {page === 'calendar' && (
            <TradingCalendar trades={trades} t={t} onView={setDetail} />
          )}
          {page === 'analytics' && (
            <>
              <div className="metrics-grid">
                <Metric
                  label={t('Expectancy', 'ผลตอบแทนคาดหวังต่อไม้')}
                  value={money(s.expectancy)}
                  note={t(
                    'Average net result per closed trade',
                    'ผลสุทธิเฉลี่ยต่อไม้ที่ปิดแล้ว',
                  )}
                  positive={s.expectancy >= 0}
                />
                <Metric
                  label={t('Average R', 'ค่า R เฉลี่ย')}
                  value={`${s.averageR.toFixed(2)}R`}
                  note={t(
                    'Only trades with recorded risk',
                    'เฉพาะไม้ที่บันทึกความเสี่ยง',
                  )}
                />
                <Metric
                  label={t('Equity', 'มูลค่าพอร์ต')}
                  value={money(s.equity)}
                  note={t(
                    `Starting capital ${money(capital)}`,
                    `เงินทุนเริ่มต้น ${money(capital)}`,
                  )}
                />
                <Metric
                  label={t('Closed trades', 'ไม้ที่ปิดแล้ว')}
                  value={String(s.count)}
                  note={t(
                    'Open trades excluded from performance',
                    'ไม่รวมไม้ที่ยังไม่ปิด',
                  )}
                />
              </div>
              <Equity trades={trades} capital={capital} t={t} />
              <div className="two-col">
                <Breakdown
                  trades={trades.filter((tr) => tr.status === 'CLOSED')}
                  field="setup"
                  t={t}
                  onReview={openReview}
                />
                <Breakdown
                  trades={trades.filter((tr) => tr.status === 'CLOSED')}
                  field="symbol"
                  t={t}
                  onReview={openReview}
                />
              </div>
              <button
                className="button ghost"
                onClick={() =>
                  openReview(
                    t('All closed trades', 'ไม้ที่ปิดแล้วทั้งหมด'),
                    trades.filter((tr) => tr.status === 'CLOSED'),
                  )
                }
              >
                {t(
                  'See trades behind these statistics',
                  'ดูรายการเทรดที่ใช้คำนวณสถิตินี้',
                )}{' '}
                <ArrowUpRight size={16} />
              </button>
            </>
          )}
          {page === 'risk' && (
            <RiskCalculator capital={s.equity || 10000} t={t} />
          )}
          {page === 'goals' && (
            <>
              <div className="goal-grid">
                {(['week', 'month', 'year'] as const).map((period, i) => {
                  const g = data.goals.find((g) => g.period === period),
                    target = g?.target ?? [500, 1500, 15000][i],
                    progress = trades
                      .filter(
                        (tr) =>
                          tr.status === 'CLOSED' && inPeriod(tr.date, period),
                      )
                      .reduce(
                        (n, tr) => n + (g?.type === 'trades' ? 1 : net(tr)),
                        0,
                      );
                  return (
                    <div className="panel goal-card" key={period}>
                      <div className="section-heading">
                        <span className="overline">
                          {t(
                            ['THIS WEEK', 'THIS MONTH', 'THIS YEAR'][i],
                            ['สัปดาห์นี้', 'เดือนนี้', 'ปีนี้'][i],
                          )}
                        </span>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${period} goal`}
                          onClick={() =>
                            setGoal(
                              g ?? {
                                id: `goal-${period}`,
                                period,
                                target,
                                type: 'pnl',
                              },
                            )
                          }
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                      <Target size={30} strokeWidth={1.3} />
                      <h2>
                        {g?.type === 'trades'
                          ? progress
                          : money(progress).replace('$', '$\u00a0')}
                      </h2>
                      <p>
                        {t('of', 'จากเป้าหมาย')}{' '}
                        {g?.type === 'trades'
                          ? target
                          : money(target).replace('$', '$\u00a0')}
                      </p>
                      <Progress
                        value={Math.max(
                          0,
                          Math.min(100, (progress / target) * 100),
                        )}
                      />
                      <small>
                        {Math.max(0, (progress / target) * 100).toFixed(0)}%{' '}
                        {t('of your target', 'ของเป้าหมาย')}
                      </small>
                    </div>
                  );
                })}
              </div>
              <div className="panel">
                <div className="section-heading">
                  <h2>{t('Your trading rules', 'กฎการเทรดของคุณ')}</h2>
                  <button
                    className="button ghost compact"
                    onClick={() => setFormKind('rule')}
                  >
                    <Plus size={16} />
                    {t('Add rule', 'เพิ่มกฎ')}
                  </button>
                </div>
                {data.rules.map((rule) => (
                  <div className="rule-row" key={rule.id}>
                    <span>{rule.text}</span>
                    <Switch
                      aria-label={rule.text}
                      checked={rule.enabled}
                      onCheckedChange={(enabled) =>
                        void mutate('saveRule', { ...rule, enabled })
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          {page === 'market' && (
            <Market
              t={t}
              dark={dark}
              th={th}
              watchlist={data.profile.watchlist}
              onWatchlistChange={(watch) => mutate('saveWatchlist', watch)}
            />
          )}
          {['portfolio', 'connections', 'settings'].includes(page) && (
            <AccountViews
              page={page}
              data={data}
              mode={mode}
              t={t}
              dark={dark}
              setDark={setDark}
              th={th}
              setTh={setTh}
              setFormKind={setFormKind}
              mutate={mutate}
              exportData={exportData}
              reset={() => setConfirm('reset')}
            />
          )}
        </div>
        <nav className="mobile-bottom">
          {[pages[0], pages[1], pages[2], pages[4]].map(
            ([id, en, thai, Icon]) => (
              <button
                key={id}
                className={page === id ? 'active' : ''}
                onClick={() => navigate(id)}
              >
                <Icon size={19} />
                {t(en.split(' ')[0], thai)}
              </button>
            ),
          )}
          <button onClick={addTrade} className="mobile-add">
            <Plus size={20} />
            {t('Add', 'บันทึก')}
          </button>
        </nav>
      </main>
      {toast && (
        <output className="save-toast">
          <Check size={16} />
          {toast}
        </output>
      )}
      <Dialog
        open={!!edit}
        onOpenChange={(open) => {
          if (!open) setEdit(null);
        }}
      >
        <DialogContent className="trade-dialog">
          <DialogTitle>
            {t(
              data.trades.some((x) => x.id === edit?.id)
                ? 'Edit trade'
                : 'Add a trade',
              data.trades.some((x) => x.id === edit?.id)
                ? 'แก้ไขการเทรด'
                : 'บันทึกการเทรด',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'The details behind your decision. Every update flows into your analytics.',
              'บันทึกรายละเอียด ทุกการแก้ไขจะอัปเดตผลวิเคราะห์ด้วย',
            )}
          </DialogDescription>
          {edit && (
            <TradeForm
              key={edit.id}
              trade={edit}
              accounts={data.accounts}
              mode={mode}
              t={t}
              busy={busy}
              serverError={error}
              onSave={async (tr) => {
                if (await mutate('saveTrade', tr)) setEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!review && !detail && !edit}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
      >
        <DialogContent className="review-dialog">
          <DialogTitle>{review?.label}</DialogTitle>
          <DialogDescription>
            {t(
              'Source trades · selected portfolio · all recorded dates · closed trades only',
              'รายการต้นทาง · ตามพอร์ตที่เลือก · ทุกวันที่บันทึก · เฉพาะไม้ที่ปิดแล้ว',
            )}
          </DialogDescription>
          <div className="review-total">
            <strong>
              {money(reviewRows.reduce((sum, tr) => sum + net(tr), 0))}
            </strong>
            <span>
              {reviewRows.length}{' '}
              {t('trades · net of fees', 'ไม้ · หักค่าธรรมเนียมแล้ว')}
            </span>
          </div>
          <TradeTable trades={reviewRows} onView={setDetail} t={t} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="trade-dialog">
          <DialogTitle>
            {detail?.symbol} · {detail?.side}
          </DialogTitle>
          <DialogDescription>
            {detail?.date} · {detail?.time} · {detail?.setup}
          </DialogDescription>
          {detail && (
            <>
              <div className="detail-pnl">
                <span>{t('Net result', 'ผลลัพธ์สุทธิ')}</span>
                <strong className={net(detail) >= 0 ? 'positive' : 'negative'}>
                  {detail.status === 'OPEN'
                    ? t('Position open', 'ยังไม่ปิดสถานะ')
                    : money(net(detail))}
                </strong>
              </div>
              <div className="review-result-note">
                {t('Realized R', 'R ที่เกิดขึ้นจริง')}:{' '}
                <b>
                  {detail.status === 'CLOSED' && detail.risk > 0
                    ? `${(net(detail) / detail.risk).toFixed(2)}R`
                    : '—'}
                </b>
                <span>
                  {t(
                    'Net P&L ÷ planned risk. Open trades have no realized result.',
                    'กำไรสุทธิ ÷ ความเสี่ยงตามแผน ไม้ที่ยังเปิดจะไม่แสดงผลที่เกิดขึ้นจริง',
                  )}
                </span>
              </div>
              <h3 className="journal-section-title">
                {t('Execution & planned risk', 'ข้อมูลเข้าเทรดและความเสี่ยงตามแผน')}
              </h3>
              <div className="detail-grid">
                {[
                  [t('Entry', 'ราคาเข้า'), detail.entry],
                  [t('Stop loss', 'จุดตัดขาดทุน'), detail.sl],
                  [t('Target', 'เป้าหมาย'), detail.tp],
                  [t('Size', 'ขนาด'), detail.lot],
                  [t('Risk', 'ความเสี่ยง'), money(detail.risk)],
                  [t('Fees', 'ค่าธรรมเนียม'), money(detail.fees)],
                ].map((x) => (
                  <div key={x[0]}>
                    <small>{x[0]}</small>
                    <b>{x[1]}</b>
                  </div>
                ))}
              </div>
              <h3 className="journal-section-title">
                {t('Plan & reflection', 'แผนและบันทึกทบทวน')}
              </h3>
              <p className="trade-notes">
                {detail.notes || t('No notes yet.', 'ยังไม่มีบันทึก')}
              </p>
              <h3 className="journal-section-title">
                {t('Chart evidence', 'ภาพกราฟประกอบ')}
              </h3>
              {!detail.imageIds.length && (
                <p className="journal-hint">
                  {t(
                    'Add screenshots when editing this trade to keep the market context.',
                    'เพิ่มภาพกราฟในหน้าแก้ไข เพื่อเก็บบริบทตลาดของไม้นี้',
                  )}
                </p>
              )}
              <div className="trade-images">
                {detail.imageIds.map((id) => (
                  <details key={id} className="journal-image">
                    <summary>
                      <Image
                        unoptimized
                        width={130}
                        height={95}
                        src={`/api/images/${id}?mode=${mode}`}
                        alt={t('Trade screenshot', 'ภาพกราฟการเทรด')}
                      />
                      <span>{t('Expand image', 'ขยายภาพ')}</span>
                    </summary>
                    <Image
                      unoptimized
                      width={900}
                      height={600}
                      src={`/api/images/${id}?mode=${mode}`}
                      alt={t('Expanded trade screenshot', 'ภาพกราฟขยาย')}
                      className="journal-image-expanded"
                    />
                  </details>
                ))}
              </div>
              <div className="actions">
                <button
                  className="button ink"
                  onClick={() => {
                    setEdit(detail);
                    setDetail(null);
                  }}
                >
                  <Pencil size={16} />
                  {t('Edit trade', 'แก้ไข')}
                </button>
                <button
                  className="button ghost negative"
                  onClick={() => {
                    setConfirm(detail.id);
                    setDetail(null);
                  }}
                >
                  <Trash2 size={16} />
                  {t('Delete', 'ลบ')}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {confirm === 'reset'
              ? t('Reset this demo?', 'เริ่มเดโมใหม่?')
              : t('Delete this trade?', 'ลบการเทรดนี้?')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'This action cannot be undone. Your statistics will be recalculated.',
              'ไม่สามารถเรียกคืนรายการนี้ได้ ผลวิเคราะห์จะคำนวณใหม่',
            )}
          </AlertDialogDescription>
          <div className="actions">
            <AlertDialogCancel>{t('Cancel', 'ยกเลิก')}</AlertDialogCancel>
            <button
              className="button ink compact"
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate(
                    confirm === 'reset' ? 'resetDemo' : 'deleteTrade',
                    confirm,
                  )
                )
                  setConfirm(null);
              }}
            >
              {t('Confirm', 'ยืนยัน')}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!goal}
        onOpenChange={(open) => {
          if (!open) setGoal(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{t('Set your goal', 'ตั้งเป้าหมาย')}</DialogTitle>
          <DialogDescription>
            {t(
              'A target for your process, not a reason to force a trade.',
              'เป้าหมายช่วยสร้างวินัย ไม่ใช่เหตุผลให้ฝืนเทรด',
            )}
          </DialogDescription>
          {goal && (
            <form
              className="simple-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await mutate('saveGoal', goal)) setGoal(null);
              }}
            >
              <Pick
                value={goal.type}
                label="Goal type"
                onChange={(v) => setGoal({ ...goal, type: v as Goal['type'] })}
                options={[
                  { value: 'pnl', label: t('Net P&L (USD)', 'กำไรสุทธิ (USD)') },
                  {
                    value: 'trades',
                    label: t('Closed trades', 'จำนวนไม้ที่ปิดแล้ว'),
                  },
                ]}
              />
              <Field
                label={t('Target', 'เป้าหมาย')}
                type="number"
                required
                min="1"
                max="1000000000"
                value={goal.target}
                onChange={(e) =>
                  setGoal({ ...goal, target: Number(e.target.value) })
                }
              />
              <button className="button ink" disabled={busy}>
                {t('Save goal', 'บันทึกเป้าหมาย')}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!formKind}
        onOpenChange={(open) => {
          if (!open) setFormKind('');
        }}
      >
        <DialogContent>
          <DialogTitle>
            {t(
              (
                {
                  portfolio: 'Create portfolio',
                  account: 'Add manual account',
                  profile: 'Edit profile',
                  rule: 'Add trading rule',
                  connection: 'Prepare broker connection',
                } as Record<string, string>
              )[formKind] ?? '',
              (
                {
                  portfolio: 'สร้างพอร์ต',
                  account: 'เพิ่มบัญชี',
                  profile: 'แก้ไขโปรไฟล์',
                  rule: 'เพิ่มกฎการเทรด',
                  connection: 'เตรียมเชื่อมต่อโบรกเกอร์',
                } as Record<string, string>
              )[formKind] ?? '',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Keep your trading workspace organized.',
              'จัดระเบียบเวิร์กสเปซให้เหมาะกับคุณ',
            )}
          </DialogDescription>
          {error && (
            <p role="alert" className="negative">
              {error}
            </p>
          )}
          <SimpleForm
            key={formKind}
            kind={formKind}
            data={data}
            busy={busy}
            t={t}
            save={async (action, value) => {
              if (await mutate(action, value)) setFormKind('');
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={tour >= 0}
        onOpenChange={(open) => {
          if (!open) setTour(-1);
        }}
      >
        <DialogContent className="tour-dialog">
          <span className="overline">TRADOVIA · {tour + 1} / 4</span>
          <DialogTitle>
            {t(
              [
                'Welcome to your trading OS.',
                'Every trade connects.',
                'Protect your next position.',
                'Make the process yours.',
              ][tour] ?? '',
              [
                'ยินดีต้อนรับสู่ระบบเทรดของคุณ',
                'ทุกการเทรดเชื่อมถึงกัน',
                'ดูแลความเสี่ยงของไม้ถัดไป',
                'สร้างระบบในแบบของคุณ',
              ][tour] ?? '',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              [
                'This is an isolated demo with realistic sample trades. Edit freely. Your real workspace begins empty.',
                'Add or edit a journal entry. Your dashboard, calendar and analytics update from the same data.',
                'The risk calculator rounds position sizes down. Check your broker’s contract specifications before using the result.',
                'Set weekly, monthly and yearly goals, add rules, and explore light mode, dark mode and Thai.',
              ][tour] ?? '',
              [
                'นี่คือเดโมที่แยกจากข้อมูลจริง ลองแก้ไขได้เต็มที่ เวิร์กสเปซจริงจะเริ่มต้นด้วยข้อมูลว่าง',
                'เพิ่มหรือแก้ไขบันทึก แล้วดูผลอัปเดตในภาพรวม ปฏิทิน และหน้าวิเคราะห์',
                'เครื่องคำนวณปัดขนาดสัญญาลง ตรวจสอบสเปกสัญญาของโบรกเกอร์ก่อนนำไปใช้',
                'ตั้งเป้าหมาย เพิ่มกฎ และลองเปลี่ยนธีมกับภาษาได้ตามใจ',
              ][tour] ?? '',
            )}
          </DialogDescription>
          <button
            className="button ink"
            onClick={() => {
              if (tour === 3) {
                setTour(-1);
                navigate('goals');
              } else {
                setTour(tour + 1);
                navigate(['journal', 'risk', 'goals'][tour]);
              }
            }}
          >
            {t(
              tour === 3 ? 'Start exploring' : 'Continue',
              tour === 3 ? 'เริ่มสำรวจ' : 'ถัดไป',
            )}
            <ArrowRight size={16} />
          </button>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
