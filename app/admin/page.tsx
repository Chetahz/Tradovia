import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Database, HardDrive, LockKeyhole, RefreshCw, Settings2, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { AdminConsole } from '@/components/admin-console';
import { currentSession } from '@/lib/auth-session';
import { readAdminDashboard, type HealthCheck } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const dateTime = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });
const fileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const healthIcon = (check: HealthCheck) => check.key === 'd1' ? Database : check.key === 'r2' ? HardDrive : check.key === 'mfa' ? LockKeyhole : Settings2;
const healthCopy = (state: HealthCheck['state']) => state === 'operational' ? 'ใช้งานได้' : state === 'configured' ? 'ตั้งค่าแล้ว' : state === 'attention' ? 'ควรตรวจสอบ' : 'ยังไม่ตั้งค่า';

export default async function AdminPage() {
  const session = await currentSession();
  if (!session) redirect('/auth?returnTo=/admin');
  if (session.role !== 'owner') redirect('/workspace');

  const data = await readAdminDashboard();
  const { metrics } = data;
  const metricCards = [
    { label: 'ลูกค้าจริง', value: metrics.customers, note: 'ไม่รวมบัญชีเดโม', icon: Users },
    { label: 'เซสชันใช้งานได้', value: metrics.validSessions, note: 'เข้าสู่ระบบและยังไม่หมดอายุ', icon: Activity },
    { label: 'รายการเทรด', value: metrics.trades, note: `${metrics.importedTrades} รายการจากการนำเข้า`, icon: Database },
    { label: 'ต้องจัดการ', value: metrics.openIssues, note: 'เหตุการณ์สถานะ Open หรือ Failed', icon: AlertTriangle },
  ];

  return <main className="admin-shell">
    <header className="admin-topbar">
      <Link href="/" className="brand admin-brand" prefetch={false}><span className="brand-mark" aria-hidden="true" />tradovia</Link>
      <div className="admin-topbar-actions"><span className="admin-owner-badge"><ShieldCheck size={15} /> Owner only</span><Link className="admin-link-button" href="/workspace" prefetch={false}><ArrowLeft size={17} /><span>กลับเวิร์กสเปซ</span></Link></div>
    </header>
    <div className="admin-page">
      <section className="admin-hero">
        <div><span className="admin-eyebrow">TRADOVIA OPERATIONS</span><h1>ศูนย์ดูแลระบบ</h1><p>ดูสุขภาพผลิตภัณฑ์ ลูกค้า Billing และปัญหาที่ต้องจัดการจากจุดเดียว โดยไม่เปิดเนื้อหา Journal ส่วนตัว</p></div>
        <div className="admin-refresh-block"><span>อัปเดตล่าสุด</span><b>{dateTime.format(data.generatedAt)}</b><Link href="/admin" className="admin-refresh" prefetch={false}><RefreshCw size={16} /> รีเฟรชข้อมูล</Link></div>
      </section>
      <section className="admin-metrics" aria-label="ภาพรวมระบบ">
        {metricCards.map(({ label, value, note, icon: Icon }) => <article className="admin-metric" key={label}><span className="admin-metric-icon"><Icon size={19} /></span><small>{label}</small><strong>{value.toLocaleString('th-TH')}</strong><p>{note}</p></article>)}
      </section>
      <section className="admin-status-grid">
        <article className="admin-panel admin-system-card">
          <div className="admin-panel-heading"><div><span className="admin-eyebrow">SYSTEM HEALTH</span><h2>สถานะบริการหลัก</h2></div><span className={`admin-status ${data.health.some((item) => item.state === 'attention' || item.state === 'not_configured') ? 'warning' : 'ok'}`}>{data.health.some((item) => item.state === 'attention' || item.state === 'not_configured') ? <ShieldAlert size={15} /> : <CheckCircle2 size={15} />} ตรวจแล้ว</span></div>
          <div className="admin-health-list">{data.health.map((check) => { const Icon = healthIcon(check); return <div key={check.key}><span className="admin-health-icon"><Icon size={17} /></span><span><b>{check.label}</b><small>{check.detail}</small></span><em className={`health-${check.state}`}>{healthCopy(check.state)}</em></div>; })}</div>
        </article>
        <aside className="admin-privacy-note"><ShieldCheck size={22} /><div><b>ช่วยลูกค้าโดยเคารพความเป็นส่วนตัว</b><p>หลังบ้านแสดงข้อมูลบัญชี ปริมาณการใช้งาน การชำระเงิน และข้อผิดพลาดเชิงระบบ ไม่มีโน้ต เหตุผลเข้าเทรด หรือภาพกราฟของลูกค้า</p><span>{metrics.images} ไฟล์ · {fileSize(metrics.imageBytes)} ใน R2</span></div></aside>
      </section>
      <AdminConsole data={data} />
    </div>
  </main>;
}
