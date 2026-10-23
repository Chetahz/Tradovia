'use client';
import Link from 'next/link';
import WorkspaceExit from './workspace-exit';
import ProfileAvatar from './profile-avatar';
import LessonRecall from './lesson-recall';
import ChartImages from './chart-images';
import TradeGallery from './trade-gallery';
import WeeklyReview from './weekly-review';
import AccountReport from './account-report';
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
  Settings,
  Menu,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Sun,
  Moon,
  Search,
  Download,
  Upload,
  Trash2,
  Pencil,
  Check,
  LogOut,
  Compass,
  Info,
  Bell,
  PanelsTopLeft,
  Ellipsis,
  ImagePlus,
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
  isTradeReviewed,
  type Trade,
  type WorkspaceData,
  type Goal,
} from '@/lib/domain';
import {
  Pick,
  Field,
  Metric,
  Equity,
  OutcomeDonut,
  TradeTable,
  Breakdown,
  type Translate,
} from './workspace-ui';
import { TradeForm, SimpleForm } from './trade-forms';
import { TradingCalendar, RiskCalculator } from './trading-tools';
import Market from './market';
import QuickReview from './quick-review';
import { ReviewSummary } from './review-fields';
import CsvImport from './csv-import';
import DeepAnalysis from './deep-analysis';
import Playbooks from './playbooks';
import WorkspaceGuide from './workspace-guide';
import { AccountViews } from './account-views';
import MobileToday from './mobile-today';
import DailyCheckin from './daily-checkin';
import WidgetStudio from './widget-studio';
import TradoviaEdge from './tradovia-edge';
import MonthlyReport from './monthly-report';
import DecisionCoach from './decision-coach';
import FirstRunOnboarding from './first-run-onboarding';
import WorkspaceTour from './workspace-tour';
import PlanGate from './plan-gate';
import { FREE_LIMITS, hasProAccess } from '@/lib/plan-access';
import {
  clearTradeDraft,
  readTradeDraft,
  saveTradeDraft,
  tradeDraftKey,
  type TradeDraft,
} from '@/lib/trade-draft';
import {
  readTradeDefaults,
  saveTradeDefaults,
  tradeDefaultsKey,
} from '@/lib/trade-preferences';
import {
  companionClock,
  companionGreeting,
  companionPrompt,
} from '@/lib/daily-companion';
import { reviewReminderDue } from '@/lib/review-reminder';
const pages = [
  ['overview', 'Overview', 'ภาพรวม', LayoutDashboard],
  ['journal', 'Trade Journal', 'บันทึกการเทรด', BookOpen],
  ['playbook', 'Playbook', 'แผนการเทรด', BookOpen],
  ['calendar', 'Trading Calendar', 'ปฏิทินการเทรด', CalendarDays],
  ['analytics', 'Analytics', 'วิเคราะห์ผล', ChartNoAxesCombined],
  ['risk', 'Risk Center', 'บริหารความเสี่ยง', ShieldCheck],
  ['goals', 'Goals & Rules', 'เป้าหมายและกฎ', Target],
  ['market', 'Market', 'ตลาด', Globe2],
  ['portfolio', 'Portfolio', 'พอร์ต', Wallet],
  ['widgets', 'Widgets', 'วิดเจ็ต', PanelsTopLeft],
  ['settings', 'Settings', 'ตั้งค่า', Settings],
] as const;

function DecisionQuality({ trade, t }: { trade: Trade; t: Translate }) {
  const result = net(trade);
  if (
    trade.status !== 'CLOSED' ||
    result === 0 ||
    (trade.adherence !== 'yes' && trade.adherence !== 'no')
  )
    return null;
  const followed = trade.adherence === 'yes';
  const won = result > 0;
  const label = followed
    ? won
      ? t('Good Win', 'ชนะและตามแผน')
      : t('Good Loss', 'แพ้แต่ตัดสินใจถูก')
    : won
      ? t('Bad Win', 'ชนะแต่หลุดแผน')
      : t('Bad Loss', 'แพ้และหลุดแผน');
  const note = followed
    ? t(
        'The process was sound. Review the execution without judging it only by the outcome.',
        'กระบวนการตัดสินใจถูกต้อง ให้ทบทวนการลงมือทำโดยไม่ตัดสินจากผลลัพธ์อย่างเดียว',
      )
    : t(
        'The result came from an outside-plan decision. Do not let the outcome reward a broken rule.',
        'ผลลัพธ์นี้มาจากการตัดสินใจนอกแผน อย่าให้ผลของไม้เดียวกลบรอยรั่วของกฎ',
      );
  return (
    <section className={`trade-decision-quality ${followed ? 'good' : 'risk'}`}>
      <span>{t('DECISION QUALITY', 'คุณภาพการตัดสินใจ')}</span>
      <strong>{label}</strong>
      <p>{note}</p>
    </section>
  );
}

export default function Workspace({
  mode,
  admin = false,
}: {
  mode: 'demo' | 'real';
  admin?: boolean;
}) {
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
    [resumeDraft, setResumeDraft] = useState<TradeDraft | null>(null),
    [draftStep, setDraftStep] = useState(0),
    [detail, setDetail] = useState<Trade | null>(null),
    [justSaved, setJustSaved] = useState(false),
    [review, setReview] = useState<{
      label: string;
      field?: 'setup' | 'symbol';
      value?: string;
      ids?: string[];
    } | null>(null),
    [confirm, setConfirm] = useState<string | null>(null),
    [tour, setTour] = useState(-1),
    [goal, setGoal] = useState<Goal | null>(null),
    [formKind, setFormKind] = useState(''),
    [mobileMoreOpen, setMobileMoreOpen] = useState(false),
    [reminderOpen, setReminderOpen] = useState(false),
    [firstRunOpen, setFirstRunOpen] = useState(false),
    [mobileLayout, setMobileLayout] = useState<boolean | null>(null);
  const t: Translate = (en, thai) => (th ? thai : en);
  const endpoint = `/api/workspace?mode=${mode}`;
  const draftKey = data ? tradeDraftKey(mode, data.accounts) : null;
  const defaultsKey = data ? tradeDefaultsKey(mode, data.accounts) : null;
  const onDraftChange = useCallback(
    (trade: Trade, step: number) => {
      if (draftKey) saveTradeDraft(localStorage, draftKey, trade, step);
    },
    [draftKey],
  );
  const [analysisTab, setAnalysisTab] = useState('summary');
  const [journalView, setJournalView] = useState('table');
  const [reviewRequested, setReviewRequested] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [dismissedReminderKey, setDismissedReminderKey] = useState('');
  useEffect(() => {
    queueMicrotask(() => {
      setNow(new Date());
      setDismissedReminderKey(
        localStorage.getItem('tradovia.companion.dismissed.v1') ?? '',
      );
    });
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const sync = () => setMobileLayout(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
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
    if (!preferencesReady || mode !== 'real' || !data) return;
    queueMicrotask(() => {
      try {
        if (
          data.portfolios.length === 0 &&
          !sessionStorage.getItem('tradovia.first-run.skipped.v1')
        )
          setFirstRunOpen(true);
      } catch {
        if (data.portfolios.length === 0) setFirstRunOpen(true);
      }
    });
  }, [data, mode, preferencesReady]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const mobileModalOpen = Boolean(
    edit ||
    detail ||
    review ||
    confirm ||
    importOpen ||
    resumeDraft ||
    formKind ||
    mobileMoreOpen ||
    reminderOpen ||
    firstRunOpen ||
    tour >= 0,
  );
  useEffect(() => {
    if (!mobileModalOpen || !window.matchMedia('(max-width: 767px)').matches) {
      return;
    }
    const scrollY = window.scrollY;
    const previous = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyOverscroll: document.body.style.overscrollBehavior,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
    };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.documentElement.style.overflow = previous.htmlOverflow;
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.overscrollBehavior = previous.bodyOverscroll;
      document.body.style.position = previous.bodyPosition;
      document.body.style.top = previous.bodyTop;
      document.body.style.width = previous.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [mobileModalOpen]);
  const navigate = (p: string) => {
    setPage(p);
    if (location.hash !== `#${p}`) history.pushState(null, '', `#${p}`);
  };
  const openTour = () => {
    let nextStep = 0;
    try {
      const saved =
        localStorage.getItem(`tradovia.onboarding.v5.${mode}`) ?? '';
      const match = saved.match(/^(?:paused|active):(\d+)$/);
      if (match) nextStep = Math.min(Number(match[1]), 8);
    } catch {
      /* Start from the beginning when storage is unavailable. */
    }
    setTour(nextStep);
    navigate(
      [
        'overview',
        'overview',
        'journal',
        'journal',
        'playbook',
        'risk',
        'calendar',
        'analytics',
        'settings',
      ][nextStep],
    );
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
  const proAccess = mode === 'demo' || Boolean(data && hasProAccess(data.subscription));
  const trades = useMemo(
    () =>
      data?.trades.filter((tr) =>
        selectedAccounts.some((a) => a.id === tr.accountId),
      ) ?? [],
    [data, selectedAccounts],
  );
  const localClock = now
    ? companionClock(now, data?.profile.timezone || 'Asia/Bangkok')
    : null;
  const prompt = companionPrompt(trades, localClock?.date ?? '');
  const greeting = localClock
    ? companionGreeting(localClock.hour)
    : { en: 'Welcome back', th: 'ยินดีต้อนรับกลับ' };
  const firstName =
    mode === 'real' && !data?.profile.name.includes('@')
      ? data?.profile.name.trim().split(/\s+/)[0]
      : '';
  const greetingText = `${t(greeting.en, greeting.th)}${firstName ? ` ${firstName}` : ''}`;
  const reminderKey = `${mode}:${data?.accounts.map((account) => account.id).join(',')}:${localClock?.date}:${prompt.title.en}`;
  const reminderUnread = Boolean(
    localClock &&
      dismissedReminderKey !== reminderKey &&
      reviewReminderDue(
        `${String(localClock.hour).padStart(2, '0')}:${String(localClock.minute).padStart(2, '0')}`,
        data?.profile.reviewReminder,
      ),
  );
  const capital = selectedAccounts.reduce((n, a) => n + a.balance, 0),
    s = statistics(trades, capital);
  const reviewRows = trades.filter(
    (tr) =>
      tr.status === 'CLOSED' &&
      (!review?.ids || review.ids.includes(tr.id)) &&
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
      ids: rows.map((row) => row.id),
    });
  const addTrade = () => {
    if (!data?.accounts.length) {
      navigate('portfolio');
      setFormKind('portfolio');
      return;
    }
    if (draftKey) {
      const saved = readTradeDraft(localStorage, draftKey, data.accounts);
      if (saved && !data.trades.some((trade) => trade.id === saved.trade.id)) {
        setResumeDraft(saved);
        return;
      }
      if (saved) clearTradeDraft(localStorage, draftKey);
    }
    startNewTrade();
  };
  const startNewTrade = (workspace = data) => {
    if (!workspace?.accounts.length) return;
    const scopedAccounts = workspace.accounts.filter(
      (account) => portfolio === 'all' || account.portfolioId === portfolio,
    );
    const availableAccounts = scopedAccounts.length
      ? scopedAccounts
      : workspace.accounts;
    const workspaceDefaultsKey = tradeDefaultsKey(mode, workspace.accounts);
    const defaults = workspaceDefaultsKey
      ? readTradeDefaults(
          localStorage,
          workspaceDefaultsKey,
          workspace.accounts,
        )
      : null;
    const preferredAccountId = availableAccounts.some(
      (account) => account.id === defaults?.accountId,
    )
      ? defaults!.accountId
      : availableAccounts[0].id;
    const startedAt = new Date();
    setDraftStep(0);
    setEdit({
      id: crypto.randomUUID(),
      accountId: preferredAccountId,
      symbol: defaults?.symbol ?? 'XAUUSD',
      side: 'LONG',
      status: window.matchMedia('(max-width: 767px)').matches
        ? 'OPEN'
        : 'CLOSED',
      date: dateKey(startedAt),
      time: startedAt.toTimeString().slice(0, 5),
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
  const openPromptAction = () => {
    localStorage.setItem('tradovia.companion.dismissed.v1', reminderKey);
    setDismissedReminderKey(reminderKey);
    setReminderOpen(false);
    if (prompt.kind === 'review') {
      setReviewRequested((request) => request + 1);
      navigate('journal');
    } else if (prompt.kind === 'capture') {
      addTrade();
    } else {
      navigate(prompt.kind === 'open' ? 'journal' : 'playbook');
    }
  };
  const dismissReminder = () => {
    localStorage.setItem('tradovia.companion.dismissed.v1', reminderKey);
    setDismissedReminderKey(reminderKey);
    setReminderOpen(false);
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
  const journalTrades = sorted.filter(
    (tr) =>
      (status === 'all' || tr.status === status) &&
      `${tr.symbol} ${tr.setup} ${tr.notes}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (!data)
    return (
      <main
        className={`loading-page${error ? ' is-error' : ''}`}
        aria-live="polite"
        aria-busy={!error}
      >
        <Link prefetch={false} className="brand" href="/">
          tradovia
        </Link>
        {!error && (
          <div className="workspace-loading-visual" aria-hidden="true">
            <span className="workspace-loading-mark" />
            <span className="workspace-loading-line" />
            <span className="workspace-loading-line short" />
          </div>
        )}
        <h1>
          {error
            ? t('Unable to open workspace', 'ไม่สามารถเปิดเวิร์กสเปซได้')
            : preferencesReady
              ? t('Opening your workspace…', 'กำลังเปิดเวิร์กสเปซ…')
              : 'Tradovia'}
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
              <small>{t('Trading workspace', 'เวิร์กสเปซสำหรับการเทรด')}</small>
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
                    data-tour={
                      id === 'journal'
                        ? 'journal-nav'
                        : id === 'calendar'
                          ? 'calendar-nav'
                          : id === 'analytics'
                            ? 'analytics-nav'
                            : undefined
                    }
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
          {admin && (
            <Link className="sidebar-admin-link" href="/admin" prefetch={false}>
              <ShieldCheck size={17} />
              <span>
                {t('Admin operations', 'ศูนย์ดูแลระบบ')}
                <small>{t('Customers and system health', 'ลูกค้าและสุขภาพระบบ')}</small>
              </span>
              <ArrowRight size={15} />
            </Link>
          )}
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
              <button onClick={openTour}>
                {t('Start the guided tour', 'เริ่มทัวร์แบบใช้งานจริง')}
                <ArrowRight size={15} />
              </button>
            </div>
          )}
          <WorkspaceExit
            demo={mode === 'demo'}
            draftKey={draftKey}
            className="sidebar-profile"
          >
            <ProfileAvatar profile={data.profile} mode={mode} />
            <span>
              {data.profile.name}
              <small>
                {mode === 'demo'
                  ? t('Demo account', 'บัญชีเดโม')
                  : data.subscription.status === 'owner'
                    ? t('Owner account', 'บัญชีเจ้าของระบบ')
                    : `${t('Plan', 'แพ็กเกจ')} ${data.subscription.plan.toUpperCase()}`}
              </small>
            </span>
            <LogOut size={16} />
          </WorkspaceExit>
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
          <div
            className="mobile-app-context"
            data-tour={page === 'overview' ? 'today' : `${page}-page`}
          >
            <strong>
              {page === 'overview'
                ? t('Today', 'วันนี้')
                : title
                  ? t(title[1], title[2])
                  : t('Workspace', 'เวิร์กสเปซ')}
            </strong>
            <span>
              {portfolio === 'all'
                ? t('All portfolios', 'ทุกพอร์ต')
                : data.portfolios.find((item) => item.id === portfolio)?.name ||
                  t('Portfolio', 'พอร์ต')}
            </span>
          </div>
          <div className="actions">
            <span className="saved-state">
              <span className="status-dot" />
              {busy
                ? t('Saving…', 'กำลังบันทึก…')
                : t('All changes saved', 'บันทึกแล้ว')}
            </span>
            <button
              type="button"
              className="companion-trigger"
              onClick={() => setReminderOpen(true)}
              aria-label={t('Daily reminder', 'การแจ้งเตือนวันนี้')}
            >
              <Bell size={18} />
              {reminderUnread && <span className="companion-unread" />}
            </button>
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
            <ProfileAvatar profile={data.profile} mode={mode} small />
          </div>
          <button
            type="button"
            className="companion-trigger mobile-companion-trigger"
            onClick={() => setReminderOpen(true)}
            aria-label={t('Daily reminder', 'การแจ้งเตือนวันนี้')}
          >
            <Bell size={19} />
            {reminderUnread && <span className="companion-unread" />}
          </button>
          <button
            type="button"
            className="mobile-more-trigger"
            onClick={() => setMobileMoreOpen(true)}
            aria-label={t('Open more destinations', 'เปิดเมนูเพิ่มเติม')}
            aria-expanded={mobileMoreOpen}
          >
            <Menu size={19} />
            <span>{t('Menu', 'เมนู')}</span>
          </button>
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
          <div
            className="page-heading"
            data-tour={page === 'overview' ? 'today' : `${page}-page`}
          >
            <div>
              <span className="overline">
                {t('YOUR TRADING, IN FOCUS', 'โฟกัสทุกส่วนของการเทรด')}
              </span>
              <h1>
                {page === 'overview'
                  ? greetingText
                  : title
                    ? t(title[1], title[2])
                    : ''}
              </h1>
              <p>
                {page === 'overview'
                  ? t(prompt.body.en, prompt.body.th)
                  : t(
                      'One connected workspace. Built around your process.',
                      'เวิร์กสเปซเดียว ที่เข้าใจวิธีเทรดของคุณ',
                    )}
              </p>
            </div>
            <button className="button ink add-trade" onClick={addTrade} data-tour="add-trade">
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
            hasPlaybook={(data.playbooks || []).length > 0}
            hasTrades={data.trades.length > 0}
            t={t}
            navigate={navigate}
            addTrade={addTrade}
          />
          {page === 'analytics' && (
            <aside className="context-note">
              <Info size={17} />
              <p>
                <strong>{t('Reading the numbers', 'อ่านตัวเลขให้ง่ายขึ้น')}</strong>
                {t(
                  'Profit Factor compares gross profit with gross loss. Expectancy is the average net result per closed trade. Drawdown measures the fall from an equity peak.',
                  'Profit Factor เปรียบเทียบกำไรรวมกับขาดทุนรวม Expectancy คือผลสุทธิเฉลี่ยต่อไม้ และ Drawdown คือการลดลงจากจุดสูงสุดของพอร์ต',
                )}
              </p>
            </aside>
          )}
          {page === 'risk' && (
            <aside className="context-note">
              <Info size={17} />
              <p>
                <strong>
                  {t('Before using the lot size', 'ก่อนใช้ขนาด Lot')}
                </strong>
                {t(
                  'Open Symbol Specification in MT5 and confirm Contract size, Tick value and Volume step. These can differ by symbol, account type and broker.',
                  'เปิด Symbol Specification ใน MT5 แล้วตรวจ Contract size, Tick value และ Volume step เพราะอาจต่างกันตามสินทรัพย์ ประเภทบัญชี และโบรกเกอร์',
                )}
              </p>
            </aside>
          )}
          {page === 'overview' && (
            <>
              {mobileLayout === true && (
                <MobileToday
                  data={data}
                  trades={trades}
                  portfolio={portfolio}
                  setPortfolio={setPortfolio}
                  t={t}
                  addTrade={addTrade}
                  navigate={navigate}
                  onReview={() => {
                    setReviewRequested((request) => request + 1);
                    navigate('journal');
                  }}
                  onView={setDetail}
                  now={now}
                  greeting={greetingText}
                  prompt={prompt}
                  busy={busy}
                  saveCheckin={(value) => mutate('saveDailyCheckin', value)}
                />
              )}
              {mobileLayout === true && (
                <DecisionCoach
                  trades={trades}
                  today={localClock?.date || ''}
                  checkin={data.dailyCheckins?.find(
                    (item) => item.date === localClock?.date,
                  )}
                  t={t}
                  busy={busy}
                  save={(trade) => mutate('saveTrade', trade)}
                  onFullReview={() => {
                    setReviewRequested((request) => request + 1);
                    navigate('journal');
                  }}
                  onView={setDetail}
                />
              )}
              {mobileLayout === true && (
                <TradoviaEdge
                  trades={trades}
                  t={t}
                  compact
                  onImport={() => {
                    navigate('journal');
                    setImportOpen(true);
                  }}
                  onOpen={() => {
                    setAnalysisTab('edge');
                    navigate('analytics');
                  }}
                />
              )}
              {mobileLayout === false && (
                <div className="desktop-overview">
                  <DecisionCoach
                    trades={trades}
                    today={localClock?.date || ''}
                    checkin={data.dailyCheckins?.find(
                      (item) => item.date === localClock?.date,
                    )}
                    t={t}
                    busy={busy}
                    save={(trade) => mutate('saveTrade', trade)}
                    onFullReview={() => {
                      setReviewRequested((request) => request + 1);
                      navigate('journal');
                    }}
                    onView={setDetail}
                  />
                  <DailyCheckin
                    today={localClock?.date || ''}
                    checkin={data.dailyCheckins?.find(
                      (item) => item.date === localClock?.date,
                    )}
                    playbooks={data.playbooks || []}
                    hasTradesToday={data.trades.some(
                      (trade) => trade.date === localClock?.date,
                    )}
                    busy={busy}
                    t={t}
                    save={(value) => mutate('saveDailyCheckin', value)}
                  />
                  <TradoviaEdge
                    trades={trades}
                    t={t}
                    compact
                    onImport={() => {
                      navigate('journal');
                      setImportOpen(true);
                    }}
                    onOpen={() => {
                      setAnalysisTab('edge');
                      navigate('analytics');
                    }}
                  />
                  <LessonRecall trades={trades} t={t} onView={setDetail} />
                  <div className="metrics-grid">
                    <Metric
                      label={t('Net P&L', 'กำไร / ขาดทุนสุทธิ')}
                      value={money(s.pnl)}
                      note={t(
                        `${s.count} closed trades`,
                        `${s.count} ไม้ที่ปิดแล้ว`,
                      )}
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
                      <h2>
                        {t('Keep your process close.', 'ให้กระบวนการนำทาง')}
                      </h2>
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
                </div>
              )}
            </>
          )}
          {page === 'playbook' && (
            <Playbooks
              plans={data.playbooks || []}
              trades={trades}
              t={t}
              save={(p) => mutate('savePlaybook', p)}
              onView={setDetail}
              pro={proAccess}
            />
          )}
          {page === 'journal' && (
            <button
              type="button"
              className="mobile-journal-import-link"
              onClick={() => setImportOpen(true)}
              data-tour="import-trades"
            >
              <span className="mobile-journal-import-icon">
                <Upload size={19} />
              </span>
              <span>
                <b>{t('Import MT5 report / CSV', 'นำเข้ารายงาน MT5 / CSV')}</b>
                <small>
                  {t(
                    'Bring closed trades from your broker report into this journal.',
                    'นำรายการที่ปิดแล้วจากรายงานโบรกเกอร์เข้าบันทึกนี้',
                  )}
                </small>
              </span>
              <ArrowRight size={17} />
            </button>
          )}
          {page === 'journal' && (
            <QuickReview
              key={portfolio}
              trades={trades}
              plans={data.playbooks || []}
              t={t}
              mode={mode}
              openRequest={reviewRequested}
              save={(tr) => mutate('saveTrade', tr)}
              onView={setDetail}
              onOpenInsights={() => {
                setAnalysisTab('deep');
                navigate('analytics');
              }}
            />
          )}
          {page === 'journal' && (
            <div className="panel">
              <button
                type="button"
                className="mobile-journal-review-link"
                onClick={() => setReviewRequested((request) => request + 1)}
              >
                <span>
                  <b>{t('Review your decisions', 'ทบทวนการตัดสินใจ')}</b>
                  <small>
                    {
                      trades.filter(
                        (tr) => tr.status === 'CLOSED' && !isTradeReviewed(tr),
                      ).length
                    }{' '}
                    {t('trades ready for review', 'เทรดที่รอทบทวน')}
                  </small>
                </span>
                <ArrowRight size={17} />
              </button>
              <fieldset
                className="daily-options gallery-view-switch"
                aria-label={t('Journal view', 'มุมมองบันทึกการเทรด')}
              >
                <button
                  aria-pressed={journalView === 'table'}
                  onClick={() => setJournalView('table')}
                >
                  {t('Table', 'ตาราง')}
                </button>
                <button
                  aria-pressed={journalView === 'gallery'}
                  onClick={() => proAccess ? setJournalView('gallery') : navigate('settings')}
                >
                  {t('Chart gallery', 'แกลเลอรีกราฟ')} {!proAccess && <span className="plan-badge">PRO</span>}
                </button>
              </fieldset>
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
                <div className="journal-import" data-tour="import-trades">
                  {proAccess ? (
                  <CsvImport
                    open={importOpen}
                    onOpenChange={setImportOpen}
                    onOpenEdge={() => {
                      setAnalysisTab('edge');
                      navigate('analytics');
                    }}
                    onReviewImported={() => {
                      setReviewRequested((request) => request + 1);
                      navigate('journal');
                    }}
                    accounts={selectedAccounts}
                    trades={data.trades}
                    t={t}
                    save={async (trades) => {
                      const ok = await mutate('saveTrades', trades);
                      if (ok) setReviewRequested((request) => request + 1);
                      return ok;
                    }}
                  />
                  ) : (
                    <button className="button ghost compact" type="button" onClick={() => navigate('settings')}>
                      <Upload size={16} /> {t('Import report', 'นำเข้ารายงาน')} <span className="plan-badge">PRO</span>
                    </button>
                  )}
                </div>
                <button
                  className="button ghost compact journal-export"
                  onClick={() => exportData(true)}
                >
                  <Download size={16} />
                  {t('Export', 'ส่งออก')}
                </button>
              </div>
              {journalView === 'gallery' && proAccess ? (
                <TradeGallery
                  key={`${portfolio}:${search}:${status}`}
                  trades={journalTrades}
                  mode={mode}
                  t={t}
                  onView={setDetail}
                />
              ) : (
                <TradeTable trades={journalTrades} onView={setDetail} t={t} />
              )}
              <p className="table-foot">
                {t(
                  `${trades.length} trades in the selected portfolio · Net P&L includes fees`,
                  `${trades.length} รายการในพอร์ตที่เลือก · กำไรสุทธิหักค่าธรรมเนียมแล้ว`,
                )}
                {!proAccess && (
                  <span className="free-usage">
                    Free · {data.trades.length}/{FREE_LIMITS.trades}
                  </span>
                )}
              </p>
            </div>
          )}
          {page === 'calendar' && (
            <TradingCalendar
              trades={proAccess ? trades : trades.filter((trade) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - (FREE_LIMITS.calendarDays - 1));
                return trade.date >= dateKey(cutoff);
              })}
              checkins={data.dailyCheckins}
              t={t}
              onView={setDetail}
            />
          )}
          {page === 'analytics' && (
            <div className="daily-options analytics-tabs">
              <button
                aria-pressed={analysisTab === 'edge'}
                onClick={() => setAnalysisTab('edge')}
              >
                Tradovia Edge {!proAccess && <span className="plan-badge">PRO</span>}
              </button>
              <button
                aria-pressed={analysisTab === 'summary'}
                onClick={() => setAnalysisTab('summary')}
              >
                {t('Overview', 'ภาพรวม')}
              </button>
              <button
                aria-pressed={analysisTab === 'deep'}
                onClick={() => setAnalysisTab('deep')}
              >
                Deep Analysis / Insights {!proAccess && <span className="plan-badge">PRO</span>}
              </button>
              <button
                aria-pressed={analysisTab === 'weekly'}
                onClick={() => setAnalysisTab('weekly')}
              >
                {t('Weekly review', 'สรุปรายสัปดาห์')} {!proAccess && <span className="plan-badge">PRO</span>}
              </button>
              <button
                aria-pressed={analysisTab === 'monthly'}
                onClick={() => setAnalysisTab('monthly')}
              >
                {t('Monthly report', 'สรุปรายเดือน')} {!proAccess && <span className="plan-badge">PRO</span>}
              </button>
              <button
                aria-pressed={analysisTab === 'report'}
                onClick={() => setAnalysisTab('report')}
              >
                {t('Account report', 'รายงานบัญชี')} {!proAccess && <span className="plan-badge">PRO</span>}
              </button>
            </div>
          )}
          {page === 'analytics' && analysisTab !== 'summary' && !proAccess && (
            <PlanGate
              t={t}
              title={t('Turn history into your edge', 'เปลี่ยนประวัติให้เป็นความได้เปรียบ')}
              description={t('Pro unlocks Deep Analysis, Tradovia Edge, weekly and monthly reviews, and complete account reports.', 'Pro ปลดล็อก Deep Analysis, Tradovia Edge, สรุปรายสัปดาห์และเดือน และรายงานบัญชีแบบเต็ม')}
            />
          )}
          {page === 'analytics' && analysisTab === 'report' && proAccess && (
            <AccountReport trades={trades} capital={capital} t={t} />
          )}
          {page === 'analytics' && analysisTab === 'weekly' && proAccess && (
            <WeeklyReview trades={trades} t={t} onView={setDetail} />
          )}
          {page === 'analytics' && analysisTab === 'monthly' && proAccess && (
            <MonthlyReport
              trades={trades}
              capital={capital}
              t={t}
              thai={th}
              onView={setDetail}
            />
          )}
          {page === 'analytics' && analysisTab === 'deep' && proAccess && (
            <DeepAnalysis trades={trades} t={t} onView={setDetail} />
          )}
          {page === 'analytics' && analysisTab === 'edge' && proAccess && (
            <TradoviaEdge trades={trades} t={t} />
          )}
          {page === 'analytics' && analysisTab === 'summary' && (
            <div className="analytics-summary">
              <section
                className="mobile-analytics-lead"
                aria-label={t('Performance summary', 'สรุปผลการเทรด')}
              >
                <small>{t('NET RESULT', 'ผลลัพธ์สุทธิ')}</small>
                <strong
                  className={
                    s.pnl > 0 ? 'positive' : s.pnl < 0 ? 'negative' : ''
                  }
                >
                  {money(s.pnl)}
                </strong>
                <span>
                  {s.count} {t('closed trades', 'เทรดที่ปิดแล้ว')} ·{' '}
                  {t('Open trades excluded', 'ไม่รวมเทรดที่ยังเปิด')}
                </span>
                <div>
                  <span>
                    <small>{t('WIN RATE', 'อัตราชนะ')}</small>
                    <b>{s.winRate.toFixed(1)}%</b>
                  </span>
                  <span>
                    <small>{t('AVERAGE R', 'ค่า R เฉลี่ย')}</small>
                    <b>{s.averageR.toFixed(2)}R</b>
                  </span>
                  <span>
                    <small>{t('EXPECTANCY', 'เฉลี่ยต่อไม้')}</small>
                    <b>{money(s.expectancy)}</b>
                  </span>
                </div>
              </section>
              <details className="mobile-analytics-help">
                <summary>
                  {t('How these numbers work', 'ตัวเลขเหล่านี้คิดอย่างไร')}
                </summary>
                <p>
                  {t(
                    'Win rate is winning trades divided by closed trades. Average R uses trades with recorded planned risk. Expectancy is average net result per closed trade.',
                    'อัตราชนะเทียบกับเทรดที่ปิดแล้ว ค่า R เฉลี่ยใช้เฉพาะไม้ที่บันทึกความเสี่ยง และผลตอบแทนคาดหวังคือผลสุทธิเฉลี่ยต่อไม้ที่ปิดแล้ว',
                  )}
                </p>
              </details>
              <div className="metrics-grid analytics-metrics">
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
              <div className="analytics-story-grid">
                <Equity trades={trades} capital={capital} t={t} />
                <OutcomeDonut
                  trades={trades}
                  t={t}
                  onReview={(label, rows) => openReview(label, rows)}
                />
              </div>
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
            </div>
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
                          aria-label={t(
                            `Edit ${period} goal`,
                            `แก้ไขเป้าหมาย${['สัปดาห์', 'เดือน', 'ปี'][i]}`,
                          )}
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
          {page === 'widgets' && (
            <WidgetStudio
              data={data}
              trades={trades}
              now={now}
              t={t}
              navigate={navigate}
              addTrade={addTrade}
              pro={proAccess}
            />
          )}
          {['portfolio', 'settings'].includes(page) && (
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
              reload={reload}
              exportData={exportData}
              reset={() => setConfirm('reset')}
              saveReviewReminder={(value) =>
                mutate('saveReviewReminder', value)
              }
            />
          )}
        </div>
        <nav
          className="mobile-bottom"
          aria-label={t('Primary navigation', 'เมนูหลัก')}
          data-active={page}
        >
          <span className="mobile-nav-slider" aria-hidden="true" />
          {[pages[0], pages[1]].map(([id, en, thai, Icon]) => (
            <button
              key={id}
              className={page === id ? 'active' : ''}
              onClick={() => navigate(id)}
              data-tour={id === 'journal' ? 'journal-nav' : undefined}
              aria-current={page === id ? 'page' : undefined}
              aria-label={
                id === 'journal' ? t('Trade list', 'รายการเทรด') : t(en, thai)
              }
            >
              <Icon size={22} />
              <span className="mobile-nav-label">
                {id === 'overview'
                  ? t('Today', 'วันนี้')
                  : id === 'journal'
                    ? t('Trades', 'รายการ')
                    : id === 'calendar'
                      ? t('Calendar', 'ปฏิทิน')
                      : t('Insights', 'วิเคราะห์')}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="mobile-add-tab"
            onClick={addTrade}
            data-tour="add-trade"
            aria-label={t('Add trade', 'บันทึกการเทรด')}
          >
            <span className="mobile-add-symbol">
              <Plus size={24} />
            </span>
            <span className="mobile-add-label">{t('Add', 'บันทึก')}</span>
          </button>
          {[pages[3], pages[4]].map(([id, en, thai, Icon]) => (
            <button
              key={id}
              className={page === id ? 'active' : ''}
              onClick={() => navigate(id)}
              data-tour={id === 'calendar' ? 'calendar-nav' : 'analytics-nav'}
              aria-label={t(en, thai)}
              aria-current={page === id ? 'page' : undefined}
            >
              <Icon size={22} />
              <span className="mobile-nav-label">
                {id === 'calendar'
                  ? t('Calendar', 'ปฏิทิน')
                  : t('Insights', 'วิเคราะห์')}
              </span>
            </button>
          ))}
        </nav>
      </main>
      <Dialog open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
        <DialogContent
          className="mobile-more-sheet"
          style={{ translate: 'none' }}
        >
          <DialogTitle>{t('Your workspace', 'พื้นที่ของคุณ')}</DialogTitle>
          <DialogDescription>
            {t(
              'Everything else, whenever you need it.',
              'เครื่องมือทั้งหมด เมื่อต้องการใช้งาน',
            )}
          </DialogDescription>
          <div className="mobile-more-grid">
            <button
              type="button"
              onClick={() => {
                setMobileMoreOpen(false);
                openTour();
              }}
            >
              <Compass size={20} />
              <span>{t('Guided tour', 'ทัวร์สอนใช้งาน')}</span>
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => setTh(!th)}>
              <span>
                {t('Language', 'ภาษา')} · {th ? 'English' : 'ไทย'}
              </span>
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={20} /> : <Moon size={20} />}
              <span>
                {dark ? t('Light mode', 'โหมดสว่าง') : t('Dark mode', 'โหมดมืด')}
              </span>
              <ArrowRight size={16} />
            </button>
            {pages
              .filter(
                ([id]) =>
                  !['overview', 'journal', 'calendar', 'analytics'].includes(
                    id,
                  ),
              )
              .map(([id, en, thai, Icon]) => (
                <button
                  key={id}
                  onClick={() => {
                    setMobileMoreOpen(false);
                    navigate(id);
                  }}
                >
                  <Icon size={20} />
                  <span>{t(en, thai)}</span>
                  <ArrowRight size={16} />
                </button>
              ))}
            <button
              onClick={() => {
                setMobileMoreOpen(false);
                navigate('journal');
                setImportOpen(true);
              }}
            >
              <Upload size={20} />
              <span>{t('Import trades', 'นำเข้าการเทรด')}</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => {
                setMobileMoreOpen(false);
                exportData(true);
              }}
            >
              <Download size={20} />
              <span>{t('Export trades', 'ส่งออกการเทรด')}</span>
              <ArrowRight size={16} />
            </button>
            {admin && (
              <button
                onClick={() => {
                  window.location.assign('/admin');
                }}
              >
                <ShieldCheck size={20} />
                <span>{t('Admin operations', 'ศูนย์ดูแลระบบ')}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
          <WorkspaceExit
            demo={mode === 'demo'}
            draftKey={draftKey}
            className="mobile-more-exit"
          >
            <LogOut size={18} /> {t('Leave workspace', 'ออกจากเวิร์กสเปซ')}
          </WorkspaceExit>
        </DialogContent>
      </Dialog>
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent
          className="companion-dialog"
          style={mobileLayout ? { translate: 'none' } : undefined}
        >
          <span className="companion-dialog-eyebrow">
            {t('A note for today', 'ข้อความสำหรับวันนี้')}
          </span>
          <DialogTitle>{t(prompt.title.en, prompt.title.th)}</DialogTitle>
          <DialogDescription>
            {t(prompt.body.en, prompt.body.th)}
          </DialogDescription>
          <div className="companion-dialog-actions">
            <button
              type="button"
              className="button ink"
              onClick={openPromptAction}
            >
              {t(prompt.action.en, prompt.action.th)} <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={dismissReminder}
            >
              {t('Not today', 'วันนี้ไว้ก่อน')}
            </button>
          </div>
          <p className="companion-dialog-note">
            {t(
              'One useful suggestion based on your journal. No pressure to trade.',
              'หนึ่งคำแนะนำจากบันทึกของคุณ ไม่จำเป็นต้องเทรดทุกวัน',
            )}
          </p>
        </DialogContent>
      </Dialog>
      {toast && (
        <output className="save-toast">
          <Check size={16} />
          {toast}
        </output>
      )}
      <AlertDialog
        open={!!resumeDraft}
        onOpenChange={(open) => {
          if (!open) setResumeDraft(null);
        }}
      >
        <AlertDialogContent className="trade-draft-choice">
          <AlertDialogTitle>
            {t('Continue your trade?', 'ทำรายการที่ค้างไว้ต่อไหม?')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'Your unfinished entry is saved on this device. Chart images are not included.',
              'รายการที่ยังไม่เสร็จเก็บไว้ในเครื่องนี้ ภาพกราฟไม่ได้รวมในแบบร่าง',
            )}
          </AlertDialogDescription>
          {resumeDraft && (
            <p className="trade-draft-summary">
              {resumeDraft.trade.symbol} · {resumeDraft.trade.date}
            </p>
          )}
          <div className="trade-draft-actions">
            <button
              type="button"
              className="button ink"
              onClick={() => {
                if (!resumeDraft) return;
                setDraftStep(resumeDraft.step);
                setEdit(resumeDraft.trade);
                setResumeDraft(null);
              }}
            >
              {t('Continue draft', 'ทำต่อจากเดิม')}
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                if (draftKey) clearTradeDraft(localStorage, draftKey);
                setResumeDraft(null);
                startNewTrade();
              }}
            >
              {t('Start a new trade', 'เริ่มรายการใหม่')}
            </button>
            <AlertDialogCancel>{t('Not now', 'ไว้ก่อน')}</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!edit}
        onOpenChange={(open) => {
          if (!open) setEdit(null);
        }}
      >
        <DialogContent className="trade-dialog">
          <div className="trade-dialog-heading">
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
                'Capture the trade now. Add deeper context when you are ready.',
                'บันทึกไม้ให้เสร็จก่อน แล้วค่อยกลับมาทบทวนเพิ่มเติมได้',
              )}
            </DialogDescription>
          </div>
          {edit && (
            <TradeForm
              key={edit.id}
              trade={edit}
              accounts={data.accounts}
              trades={data.trades}
              playbooks={data.playbooks || []}
              mode={mode}
              initialStep={
                data.trades.some((trade) => trade.id === edit.id)
                  ? 0
                  : draftStep
              }
              onDraftChange={
                data.trades.some((trade) => trade.id === edit.id)
                  ? undefined
                  : onDraftChange
              }
              t={t}
              busy={busy}
              serverError={error}
              onSave={async (tr) => {
                const creating = !data.trades.some(
                  (trade) => trade.id === tr.id,
                );
                if (await mutate('saveTrade', tr)) {
                  if (creating && draftKey)
                    clearTradeDraft(localStorage, draftKey);
                  if (defaultsKey)
                    saveTradeDefaults(localStorage, defaultsKey, {
                      accountId: tr.accountId,
                      symbol: tr.symbol,
                    });
                  setEdit(null);
                  navigate('journal');
                  setJustSaved(true);
                  setDetail(tr);
                }
              }}
              onImport={() => {
                setEdit(null);
                navigate('journal');
                setImportOpen(true);
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
          if (!open) {
            setDetail(null);
            setJustSaved(false);
          }
        }}
      >
        <DialogContent className="trade-dialog trade-detail-dialog">
          <div className="trade-detail-header">
            <div>
              <DialogTitle>
                {detail?.symbol} · {detail?.side}
              </DialogTitle>
              <DialogDescription>
                {detail?.date} · {detail?.time}
                {detail?.setup ? ` · ${detail.setup}` : ''}
              </DialogDescription>
            </div>
            {detail && (
              <span
                className={`trade-status-pill ${detail.status.toLowerCase()}`}
              >
                {detail.status === 'OPEN'
                  ? t('Open', 'ยังไม่ปิด')
                  : t('Closed', 'ปิดแล้ว')}
              </span>
            )}
          </div>
          {detail && (
            <>
              {justSaved && (
                <output className="trade-saved-confirmation" aria-live="polite">
                  <Check size={18} />
                  <span>
                    <b>{t('Trade saved', 'บันทึกการเทรดแล้ว')}</b>
                    {t(
                      'Your journal, calendar and analytics are updated. You can finish here or add context later.',
                      'รายการ ปฏิทิน และผลวิเคราะห์อัปเดตแล้ว ออกจากหน้านี้ได้เลย หรือค่อยเพิ่มรายละเอียดภายหลัง',
                    )}
                  </span>
                </output>
              )}
              <section className="trade-result-hero">
                <div className="detail-pnl">
                  <span>{t('Net result', 'ผลลัพธ์สุทธิ')}</span>
                  <strong
                    className={net(detail) >= 0 ? 'positive' : 'negative'}
                  >
                    {detail.status === 'OPEN'
                      ? t('Position open', 'ยังไม่ปิดสถานะ')
                      : money(net(detail))}
                  </strong>
                </div>
                <div className="trade-result-r">
                  <span>{t('Realized R', 'R ที่เกิดขึ้นจริง')}</span>
                  <strong>
                    {detail.status === 'CLOSED' && detail.risk > 0
                      ? `${(net(detail) / detail.risk).toFixed(2)}R`
                      : '—'}
                  </strong>
                  <small>
                    {t('Net result ÷ planned risk', 'ผลสุทธิ ÷ ความเสี่ยงตามแผน')}
                  </small>
                </div>
              </section>
              <DecisionQuality trade={detail} t={t} />
              <section className="trade-detail-section">
                <h3 className="journal-section-title">
                  {t(
                    'Execution & planned risk',
                    'ข้อมูลเข้าเทรดและความเสี่ยงตามแผน',
                  )}
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
              </section>
              <section className="trade-detail-section">
                <h3 className="journal-section-title">
                  {t('Plan & reflection', 'แผนและบันทึกทบทวน')}
                </h3>
                <p className="trade-notes">
                  {detail.playbook && (
                    <span
                      style={{
                        display: 'block',
                        whiteSpace: 'pre-wrap',
                        marginBottom: 16,
                      }}
                    >
                      <strong>
                        {detail.playbook.name} · v{detail.playbook.version}
                      </strong>
                      <br />
                      {detail.playbook.entry}
                      <br />
                      {detail.playbook.exit}
                      <br />
                      {detail.playbook.risk}
                      <br />
                      {detail.playbook.checklist}
                      <br />
                      {detail.adherence === 'yes'
                        ? t('Followed plan', 'ตามแผน')
                        : detail.adherence === 'partial'
                          ? t('Partly followed', 'ตามแผนบางส่วน')
                          : detail.adherence === 'no'
                            ? t('Outside plan', 'นอกแผน')
                            : t('Not reviewed', 'ยังไม่ทบทวน')}
                    </span>
                  )}
                  {detail.notes || t('No notes yet.', 'ยังไม่มีบันทึก')}
                </p>
                <ReviewSummary trade={detail} t={t} />
              </section>
              <section className="trade-detail-section trade-chart-section">
                <h3 className="journal-section-title">
                  {t('Chart evidence', 'ภาพกราฟประกอบ')}
                </h3>
                {!detail.imageIds.length ? (
                  <div className="trade-chart-empty">
                    <span className="trade-chart-empty-icon">
                      <ImagePlus size={20} />
                    </span>
                    <span>
                      <b>{t('No chart yet', 'ยังไม่มีภาพกราฟ')}</b>
                      <small>
                        {t(
                          'Add one when you are ready to review the market context.',
                          'เพิ่มภายหลังเมื่อพร้อมทบทวนบริบทตลาดของไม้นี้',
                        )}
                      </small>
                    </span>
                    <button
                      type="button"
                      className="button ghost compact"
                      onClick={() => {
                        setEdit(detail);
                        setDetail(null);
                        setJustSaved(false);
                      }}
                    >
                      <Plus size={15} /> {t('Add chart', 'เพิ่มภาพ')}
                    </button>
                  </div>
                ) : (
                  <ChartImages trade={detail} mode={mode} t={t} />
                )}
              </section>
              <div
                className={`actions trade-detail-actions${justSaved ? ' saved' : ''}`}
              >
                {justSaved ? (
                  <>
                    <button
                      className="button ink"
                      onClick={() => {
                        setDetail(null);
                        setJustSaved(false);
                        navigate('journal');
                      }}
                    >
                      <Check size={17} />
                      {t('Done', 'เสร็จแล้ว')}
                    </button>
                    <button
                      className="button ghost"
                      onClick={() => {
                        setEdit(detail);
                        setDetail(null);
                        setJustSaved(false);
                      }}
                    >
                      <Pencil size={16} />
                      {t('Add details', 'เพิ่มรายละเอียด')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="button ink"
                      onClick={() => {
                        setEdit(detail);
                        setDetail(null);
                        setJustSaved(false);
                      }}
                    >
                      <Pencil size={16} />
                      {t('Edit trade', 'แก้ไขรายการ')}
                    </button>
                    <details className="trade-detail-more">
                      <summary>
                        <Ellipsis size={18} />
                        {t('More', 'เพิ่มเติม')}
                      </summary>
                      <div>
                        <button
                          type="button"
                          className="negative"
                          onClick={() => {
                            setConfirm(detail.id);
                            setDetail(null);
                            setJustSaved(false);
                          }}
                        >
                          <Trash2 size={16} />
                          {t('Delete trade', 'ลบรายการ')}
                        </button>
                      </div>
                    </details>
                  </>
                )}
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
                } as Record<string, string>
              )[formKind] ?? '',
              (
                {
                  portfolio: 'สร้างพอร์ต',
                  account: 'เพิ่มบัญชี',
                  profile: 'แก้ไขโปรไฟล์',
                  rule: 'เพิ่มกฎการเทรด',
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
      <FirstRunOnboarding
        open={firstRunOpen}
        endpoint={endpoint}
        data={data}
        t={t}
        onSkip={() => {
          try {
            sessionStorage.setItem('tradovia.first-run.skipped.v1', '1');
          } catch {
            /* Session-only dismissal. */
          }
          setFirstRunOpen(false);
        }}
        onFinish={(choice, nextData) => {
          setData(nextData);
          setFirstRunOpen(false);
          if (choice === 'import') setImportOpen(true);
          else if (choice === 'trade') startNewTrade(nextData);
          else navigate('overview');
        }}
      />
      <WorkspaceTour
        step={tour}
        mode={mode}
        t={t}
        setStep={setTour}
        navigate={navigate}
        addTrade={() => startNewTrade()}
        openImport={() => setImportOpen(true)}
      />
    </SidebarProvider>
  );
}
