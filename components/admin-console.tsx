'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, ChevronRight, CircleDollarSign, Clock3, Search, ShieldCheck, UserRound } from 'lucide-react';
import type { AdminDashboardData, AdminEventRow, AdminUserRow } from '@/lib/admin';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const dateTime = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });
const dateOnly = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' });
const planLabel = (plan: string) => plan === 'pro' ? 'Pro' : plan === 'elite' ? 'Elite' : 'Free';
const compactId = (id: string | null) => {
  if (!id) return 'ระบบ';
  const value = id.replace(/^auth0:/, '');
  return value.length > 16 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value;
};
const fileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const money = (cents: number, currency: string) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: currency || 'THB', maximumFractionDigits: 2 }).format(cents / 100);

export function AdminConsole({ data }: { data: AdminDashboardData }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('all');
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [issueSearch, setIssueSearch] = useState('');
  const [issueStatus, setIssueStatus] = useState('active');
  const [issueCategory, setIssueCategory] = useState('all');
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState('');

  const customers = useMemo(() => data.users.filter((user) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || `${user.displayName} ${user.email} ${user.id}`.toLowerCase().includes(q);
    const matchesPlan = plan === 'all' || (plan === 'free' ? !['pro', 'elite'].includes(user.plan) : user.plan === plan);
    return matchesSearch && matchesPlan;
  }), [data.users, search, plan]);

  const issues = useMemo(() => data.events.filter((event) => {
    const q = issueSearch.trim().toLowerCase();
    const matchesSearch = !q || `${event.message} ${event.category} ${event.ownerId ?? ''}`.toLowerCase().includes(q);
    const matchesStatus = issueStatus === 'all' || (issueStatus === 'active' ? ['open', 'failed'].includes(event.status) : event.status === issueStatus);
    return matchesSearch && matchesStatus && (issueCategory === 'all' || event.category === issueCategory);
  }), [data.events, issueSearch, issueStatus, issueCategory]);

  const customerEvents = selected ? data.events.filter((event) => event.ownerId === selected.id).slice(0, 8) : [];
  const customerNotes = selected ? data.notes.filter((item) => item.ownerId === selected.id) : [];

  async function post(url: string, body: unknown, key: string) {
    setBusy(key); setFeedback('');
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'บันทึกไม่สำเร็จ');
      setFeedback('บันทึกเรียบร้อย');
      setNote(''); setResolution('');
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally { setBusy(''); }
  }

  function customerRow(user: AdminUserRow) {
    const active = Boolean(user.sessionExpiresAt && user.sessionExpiresAt > data.generatedAt);
    return (
      <tr key={user.id} onClick={() => setSelected(user)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(user); }}>
        <td><b>{user.displayName || 'Trader'}</b><small>{user.email || compactId(user.id)}</small></td>
        <td><span className={`admin-plan ${user.plan}`}>{planLabel(user.plan)}</span><small>{user.subscriptionStatus === 'inactive' ? 'ยังไม่สมัครสมาชิก' : user.subscriptionStatus}</small></td>
        <td>{dateOnly.format(user.createdAt)}</td><td>{user.portfolios}</td><td>{user.trades}</td><td>{user.imports}</td>
        <td><span className={`admin-status ${active ? 'ok' : 'muted'}`}>{active ? 'ใช้งานได้' : 'หมดอายุ'}</span></td>
        <td><ChevronRight size={17} /></td>
      </tr>
    );
  }

  return <>
    <section className="admin-panel">
      <div className="admin-panel-heading admin-heading-stack-mobile">
        <div><span className="admin-eyebrow">CUSTOMERS</span><h2>ลูกค้าและการใช้งาน</h2></div>
        <span>{customers.length} จาก {data.users.length} บัญชี</span>
      </div>
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={17} /><span className="sr-only">ค้นหาลูกค้า</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อ อีเมล หรือรหัสลูกค้า" /></label>
        <select value={plan} onChange={(event) => setPlan(event.target.value)} aria-label="กรองแพ็กเกจ"><option value="all">ทุกแพ็กเกจ</option><option value="free">Free</option><option value="pro">Pro</option><option value="elite">Elite</option></select>
      </div>
      <div className="admin-table-wrap admin-customer-table">
        <table className="admin-table"><thead><tr><th>ลูกค้า</th><th>แพ็กเกจ</th><th>สมัครเมื่อ</th><th>พอร์ต</th><th>เทรด</th><th>นำเข้า</th><th>เซสชัน</th><th aria-label="เปิดรายละเอียด" /></tr></thead>
          <tbody>{customers.length ? customers.map(customerRow) : <tr><td colSpan={8} className="admin-empty">ไม่พบลูกค้าที่ตรงกับตัวกรอง</td></tr>}</tbody>
        </table>
      </div>
      <div className="admin-customer-cards">
        {customers.map((user) => {
          const active = Boolean(user.sessionExpiresAt && user.sessionExpiresAt > data.generatedAt);
          return <button type="button" className="admin-customer-card" key={user.id} onClick={() => setSelected(user)}>
            <span className="admin-avatar"><UserRound size={18} /></span><span className="admin-customer-main"><b>{user.displayName || 'Trader'}</b><small>{user.email || compactId(user.id)}</small><em>{user.trades} เทรด · {user.imports} นำเข้า</em></span>
            <span className="admin-customer-state"><span className={`admin-plan ${user.plan}`}>{planLabel(user.plan)}</span><small className={active ? 'is-active' : ''}>{active ? 'ออนไลน์' : 'ออฟไลน์'}</small></span><ChevronRight size={17} />
          </button>;
        })}
      </div>
    </section>

    <section className="admin-ops-grid">
      <article className="admin-panel">
        <div className="admin-panel-heading admin-heading-stack-mobile"><div><span className="admin-eyebrow">ISSUE CENTER</span><h2>เหตุการณ์ที่ต้องดูแล</h2></div><span>{issues.length} รายการ</span></div>
        <div className="admin-toolbar admin-issue-toolbar">
          <label className="admin-search"><Search size={17} /><span className="sr-only">ค้นหาปัญหา</span><input value={issueSearch} onChange={(event) => setIssueSearch(event.target.value)} placeholder="ค้นหาเหตุการณ์" /></label>
          <select value={issueStatus} onChange={(event) => setIssueStatus(event.target.value)} aria-label="กรองสถานะ"><option value="active">ต้องจัดการ</option><option value="resolved">แก้แล้ว</option><option value="success">สำเร็จ</option><option value="all">ทั้งหมด</option></select>
          <select value={issueCategory} onChange={(event) => setIssueCategory(event.target.value)} aria-label="กรองประเภท"><option value="all">ทุกประเภท</option><option value="import">Import</option><option value="billing">Billing</option><option value="auth">Auth</option><option value="api">API</option><option value="system">System</option></select>
        </div>
        <div className="admin-events">
          {issues.length ? issues.map((event) => <Issue key={event.id} event={event} busy={busy} resolution={resolution} onResolution={setResolution} onUpdate={(status) => post('/api/admin/events', { id: event.id, status, note: resolution }, event.id)} />)
            : <div className="admin-empty-state"><Check size={25} /><b>ไม่มีรายการในตัวกรองนี้</b><p>เหตุการณ์ใหม่จาก Import, API และ Billing จะแสดงที่นี่</p></div>}
        </div>
      </article>

      <aside className="admin-side-stack">
        <article className="admin-panel admin-billing-panel">
          <div className="admin-panel-heading"><div><span className="admin-eyebrow">BILLING READINESS</span><h2>การชำระเงิน</h2></div><CircleDollarSign size={20} /></div>
          <strong>{money(data.billing.totalCollectedCents, data.billing.currency)}</strong><p>ยอดที่บันทึกจาก {data.billing.paymentCount} รายการ</p>
          <div className="admin-mini-list"><span><b>สมาชิกชำระเงิน</b><em>{data.metrics.paidSubscriptions}</em></span><span><b>ข้อมูลไม่ตรงกัน</b><em className={data.billing.mismatchCount ? 'needs-attention' : ''}>{data.billing.mismatchCount}</em></span><span><b>Webhook ล่าสุด</b><em>{data.billing.lastWebhookAt ? dateOnly.format(data.billing.lastWebhookAt) : 'ยังไม่มี'}</em></span></div>
        </article>
        <article className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-eyebrow">AUDIT LOG</span><h2>การทำงานของผู้ดูแล</h2></div><ShieldCheck size={20} /></div>
          <div className="admin-audit-list">{data.audit.length ? data.audit.slice(0, 8).map((item) => <div key={item.id}><span><b>{item.action}</b><small>{item.targetType} · {compactId(item.targetId)}</small></span><time>{dateTime.format(item.createdAt)}</time></div>) : <p className="admin-muted-copy">กิจกรรมของผู้ดูแลจะถูกบันทึกเมื่อเริ่มจัดการปัญหาหรือเพิ่มโน้ต</p>}</div>
        </article>
      </aside>
    </section>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) { setSelected(null); setFeedback(''); } }}>
      <DialogContent className="admin-customer-dialog">
        {selected && <>
          <DialogHeader><span className="admin-eyebrow">CUSTOMER OPERATIONS</span><DialogTitle>{selected.displayName || 'Trader'}</DialogTitle><DialogDescription>{selected.email || compactId(selected.id)}</DialogDescription></DialogHeader>
          <div className="admin-detail-scroll">
            <section className="admin-detail-hero"><div><span className="admin-avatar large"><UserRound size={22} /></span><div><b>{planLabel(selected.plan)}</b><small>{selected.subscriptionStatus === 'inactive' ? 'ยังไม่สมัครสมาชิก' : selected.subscriptionStatus}</small></div></div><span className={`admin-status ${selected.sessionExpiresAt && selected.sessionExpiresAt > data.generatedAt ? 'ok' : 'muted'}`}>{selected.sessionExpiresAt && selected.sessionExpiresAt > data.generatedAt ? 'เซสชันใช้งานได้' : 'ไม่มีเซสชันที่ใช้งานได้'}</span></section>
            <section className="admin-detail-grid"><div><small>สมัครเมื่อ</small><b>{dateOnly.format(selected.createdAt)}</b></div><div><small>รหัสลูกค้า</small><b>{compactId(selected.id)}</b></div><div><small>พอร์ต</small><b>{selected.portfolios}</b></div><div><small>รายการเทรด</small><b>{selected.trades}</b></div><div><small>นำเข้า</small><b>{selected.imports}</b></div><div><small>รูปภาพ</small><b>{selected.images} · {fileSize(selected.imageBytes)}</b></div></section>
            <section className="admin-detail-section"><h3>สมาชิกและการชำระเงิน</h3><div className="admin-detail-list"><span><small>ยอดชำระสะสม</small><b>{money(selected.paidCents, selected.paymentCurrency)}</b></span><span><small>Stripe customer</small><b>{selected.hasStripeCustomer ? 'เชื่อมแล้ว' : 'ยังไม่มี'}</b></span><span><small>ต่ออายุ</small><b>{selected.renewal ? dateOnly.format(new Date(selected.renewal)) : '—'}</b></span><span><small>ยกเลิกเมื่อจบรอบ</small><b>{selected.cancelAtPeriodEnd ? 'ใช่' : 'ไม่'}</b></span></div></section>
            <section className="admin-detail-section"><h3>เหตุการณ์ล่าสุด</h3>{customerEvents.length ? <div className="admin-compact-events">{customerEvents.map((event) => <div key={event.id}><span className={`admin-event-dot ${event.severity}`} /><span><b>{event.message}</b><small>{event.category} · {dateTime.format(event.createdAt)}</small></span></div>)}</div> : <p className="admin-muted-copy">ไม่พบเหตุการณ์เชิงระบบของลูกค้ารายนี้</p>}</section>
            <section className="admin-detail-section"><h3>โน้ตฝ่ายดูแล ({customerNotes.length})</h3>{customerNotes.map((item) => <div className="admin-support-note" key={item.id}><p>{item.note}</p><small>{dateTime.format(item.createdAt)} · {compactId(item.actorId)}</small></div>)}<label className="admin-note-field"><span>เพิ่มโน้ตภายใน</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="บันทึกเฉพาะข้อมูลที่จำเป็นต่อการช่วยลูกค้า" /></label><button type="button" className="admin-primary-action" disabled={note.trim().length < 2 || Boolean(busy)} onClick={() => post('/api/admin/notes', { ownerId: selected.id, note }, `note-${selected.id}`)}>{busy === `note-${selected.id}` ? 'กำลังบันทึก…' : 'บันทึกโน้ต'}</button>{feedback && <output className="admin-feedback">{feedback}</output>}</section>
            <aside className="admin-dialog-privacy"><ShieldCheck size={18} /><p>หน้านี้แสดงเฉพาะข้อมูลบัญชี การใช้งาน และสถานะระบบ ไม่แสดง Journal เหตุผลเข้าเทรด หรือภาพกราฟของลูกค้า</p></aside>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}

function Issue({ event, busy, resolution, onResolution, onUpdate }: { event: AdminEventRow; busy: string; resolution: string; onResolution: (value: string) => void; onUpdate: (status: 'open' | 'resolved') => void }) {
  const active = ['open', 'failed'].includes(event.status);
  return <article className="admin-event admin-event-expanded">
    <span className={`admin-event-dot ${event.severity}`} />
    <div className="admin-event-copy"><b>{event.message}</b><small>{event.category.toUpperCase()} · {compactId(event.ownerId)} · {dateTime.format(event.createdAt)}</small>{event.resolutionNote && <p>บันทึกการแก้ไข: {event.resolutionNote}</p>}</div>
    <span className={`admin-status ${active ? 'warning' : event.status === 'resolved' || event.status === 'success' ? 'ok' : 'muted'}`}>{event.status}</span>
    <div className="admin-event-actions">
      {active && <input aria-label="บันทึกการแก้ไข" value={resolution} onChange={(e) => onResolution(e.target.value)} placeholder="สรุปวิธีแก้ (ไม่บังคับ)" />}
      <button type="button" disabled={busy === event.id} onClick={() => onUpdate(active ? 'resolved' : 'open')}>{busy === event.id ? <Clock3 size={15} /> : active ? <Check size={15} /> : <AlertCircle size={15} />}{active ? 'แก้แล้ว' : 'เปิดอีกครั้ง'}</button>
    </div>
  </article>;
}
