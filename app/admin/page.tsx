import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  HardDrive,
  LockKeyhole,
  RefreshCw,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AdminConsole } from '@/components/admin-console';
import { currentSession } from '@/lib/auth-session';
import { readAdminDashboard, type HealthCheck } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const dateTime = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok',
});
const fileSize = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 ** 2
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const healthIcon = (check: HealthCheck) =>
  check.key === 'd1'
    ? Database
    : check.key === 'r2'
      ? HardDrive
      : check.key === 'mfa'
        ? LockKeyhole
        : Settings2;
const healthCopy = (state: HealthCheck['state']) =>
  state === 'operational'
    ? 'ใช้งานได้'
    : state === 'configured'
      ? 'ตั้งค่าแล้ว'
      : state === 'attention'
        ? 'ควรตรวจสอบ'
        : 'ยังไม่ตั้งค่า';

export default async function AdminPage() {
  const session = await currentSession();
  if (!session) redirect('/auth?returnTo=/admin');
  if (session.role !== 'owner') redirect('/workspace');

  const data = await readAdminDashboard();
  const { metrics } = data;
  const percent = (value: number, total: number) =>
    total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const readiness = Math.round(
    data.health.reduce(
      (sum, item) =>
        sum +
        (item.state === 'operational'
          ? 100
          : item.state === 'configured'
            ? 88
            : item.state === 'attention'
              ? 55
              : 20),
      0,
    ) / Math.max(data.health.length, 1),
  );
  const operatingSignals = [
    {
      label: 'ผู้ใช้ที่ยังมีเซสชัน',
      value: metrics.validSessions,
      total: metrics.customers,
      detail: `${percent(metrics.validSessions, metrics.customers)}% ของลูกค้าจริง`,
    },
    {
      label: 'สมาชิกที่ชำระเงิน',
      value: metrics.paidSubscriptions,
      total: metrics.customers,
      detail: `${percent(metrics.paidSubscriptions, metrics.customers)}% ของลูกค้าจริง`,
    },
    {
      label: 'เทรดจากการนำเข้า',
      value: metrics.importedTrades,
      total: metrics.trades,
      detail: `${percent(metrics.importedTrades, metrics.trades)}% ของรายการทั้งหมด`,
    },
  ];
  const metricCards = [
    {
      label: 'ลูกค้าจริง',
      value: metrics.customers,
      note: 'ไม่รวมบัญชีเดโม',
      icon: Users,
    },
    {
      label: 'เซสชันใช้งานได้',
      value: metrics.validSessions,
      note: 'เข้าสู่ระบบและยังไม่หมดอายุ',
      icon: Activity,
    },
    {
      label: 'รายการเทรด',
      value: metrics.trades,
      note: `${metrics.importedTrades} รายการจากการนำเข้า`,
      icon: Database,
    },
    {
      label: 'ต้องจัดการ',
      value: metrics.openIssues + metrics.openTickets,
      note: `${metrics.openTickets} คำขอลูกค้า · ${metrics.openIssues} เหตุการณ์ระบบ`,
      icon: AlertTriangle,
    },
  ];

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link href="/" className="brand admin-brand" prefetch={false}>
          <span className="brand-mark" aria-hidden="true" />
          tradovia
        </Link>
        <div className="admin-topbar-actions">
          <span className="admin-owner-badge">
            <ShieldCheck size={15} /> สำหรับผู้ดูแล
          </span>
          <Link
            className="admin-link-button"
            href="/workspace"
            prefetch={false}
          >
            <ArrowLeft size={17} />
            <span>กลับเวิร์กสเปซ</span>
          </Link>
        </div>
      </header>
      <div className="admin-page">
        <section className="admin-hero">
          <div>
            <span className="admin-eyebrow">ภาพรวมการดำเนินงาน</span>
            <h1>
              ทุกอย่างที่ต้องดูแล
              <br />
              อยู่ตรงนี้แล้ว
            </h1>
            <p>
              ติดตามสุขภาพระบบ ลูกค้า รายรับ และเรื่องที่ต้องตอบจากหน้าจอเดียว
              โดยไม่เปิดดูบันทึกส่วนตัวของผู้ใช้
            </p>
          </div>
          <div className="admin-refresh-block">
            <span>อัปเดตล่าสุด</span>
            <b>{dateTime.format(data.generatedAt)}</b>
            <Link href="/admin" className="admin-refresh" prefetch={false}>
              <RefreshCw size={16} /> รีเฟรชข้อมูล
            </Link>
          </div>
        </section>
        <section className="admin-command-grid" aria-label="สัญญาณสำคัญของระบบ">
          <article className="admin-panel admin-pulse-card">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-eyebrow">สัญญาณสำคัญ</span>
                <h2>ภาพรวมการใช้งาน</h2>
              </div>
              <span className="admin-soft-badge">
                <TrendingUp size={14} /> ข้อมูลจริงล่าสุด
              </span>
            </div>
            <div className="admin-signal-list">
              {operatingSignals.map((signal) => {
                const width = percent(signal.value, signal.total);
                return (
                  <div key={signal.label} className="admin-signal-row">
                    <div>
                      <b>{signal.label}</b>
                      <small>{signal.detail}</small>
                    </div>
                    <strong>{signal.value.toLocaleString('th-TH')}</strong>
                    <span className="admin-signal-track" aria-hidden="true">
                      <i style={{ width: `${width}%` }} />
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
          <aside className="admin-readiness-card">
            <span className="admin-eyebrow">ความพร้อมวันนี้</span>
            <div className="admin-readiness-top">
              <strong>{readiness}%</strong>
              <Sparkles size={22} />
            </div>
            <p>
              {data.health.some(
                (item) =>
                  item.state === 'attention' || item.state === 'not_configured',
              )
                ? 'ระบบหลักพร้อมใช้งาน เหลืองานความปลอดภัยบางจุดที่ควรเก็บให้ครบ'
                : 'บริการหลักทั้งหมดพร้อมสำหรับการดูแลลูกค้า'}
            </p>
            <div className="admin-readiness-track">
              <span style={{ width: `${readiness}%` }} />
            </div>
            <small>เป้าหมายก่อนเปิดให้ผู้ดูแลเพิ่ม: 100%</small>
          </aside>
        </section>
        <section className="admin-metrics" aria-label="ภาพรวมระบบ">
          {metricCards.map(({ label, value, note, icon: Icon }) => (
            <article className="admin-metric" key={label}>
              <span className="admin-metric-icon">
                <Icon size={19} />
              </span>
              <small>{label}</small>
              <strong>{value.toLocaleString('th-TH')}</strong>
              <p>{note}</p>
            </article>
          ))}
        </section>
        <section className="admin-status-grid">
          <article className="admin-panel admin-system-card">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-eyebrow">สุขภาพระบบ</span>
                <h2>สถานะบริการหลัก</h2>
              </div>
              <span
                className={`admin-status ${data.health.some((item) => item.state === 'attention' || item.state === 'not_configured') ? 'warning' : 'ok'}`}
              >
                {data.health.some(
                  (item) =>
                    item.state === 'attention' ||
                    item.state === 'not_configured',
                ) ? (
                  <ShieldAlert size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}{' '}
                ตรวจแล้ว
              </span>
            </div>
            <div className="admin-health-list">
              {data.health.map((check) => {
                const Icon = healthIcon(check);
                return (
                  <div key={check.key}>
                    <span className="admin-health-icon">
                      <Icon size={17} />
                    </span>
                    <span>
                      <b>{check.label}</b>
                      <small>{check.detail}</small>
                    </span>
                    <em className={`health-${check.state}`}>
                      {healthCopy(check.state)}
                    </em>
                  </div>
                );
              })}
            </div>
          </article>
          <aside className="admin-privacy-note">
            <ShieldCheck size={22} />
            <div>
              <b>ช่วยลูกค้าโดยเคารพความเป็นส่วนตัว</b>
              <p>
                หลังบ้านแสดงข้อมูลบัญชี ปริมาณการใช้งาน การชำระเงิน และข้อผิดพลาดเชิงระบบ
                ไม่มีโน้ต เหตุผลเข้าเทรด หรือภาพกราฟของลูกค้า
              </p>
              <span>
                {metrics.images} ไฟล์ · {fileSize(metrics.imageBytes)} ใน R2
              </span>
            </div>
          </aside>
        </section>
        <AdminConsole data={data} />
      </div>
    </main>
  );
}
