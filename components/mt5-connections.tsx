'use client';
import { useEffect, useState } from 'react';
import type { Connection, WorkspaceData } from '@/lib/domain';
import type { Translate } from './workspace-ui';

export default function Mt5Connections({ data, mode, t }: { data: WorkspaceData; mode: string; t: Translate }) {
  const [connections, setConnections] = useState(data.connections.filter(c => c.provider === 'metaapi'));
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? '');
  const [server, setServer] = useState('');
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingLink, setPendingLink] = useState('');
  const eligible = mode === 'real' && ['pro', 'elite'].includes(data.subscription.plan);

  useEffect(() => {
    if (!eligible) return;
    void fetch('/api/mt5/cloud', { cache: 'no-store' }).then(r => r.json() as Promise<{ configured?: boolean; connections?: Connection[] }>).then(value => {
      setConfigured(Boolean(value.configured));
      if (value.connections) setConnections(value.connections);
    }).catch(() => setError(document.documentElement.lang === 'th'
      ? 'ตรวจสถานะซิงก์ cloud ไม่สำเร็จ'
      : 'Could not check cloud sync availability.'));
  }, [eligible]);

  async function change(action: 'create' | 'resume' | 'configure' | 'status' | 'disconnect', connectionId?: string) {
    setBusy(true); setError(''); setPendingLink('');
    try {
      const response = await fetch('/api/mt5/cloud', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, accountId, server: server.trim(), connectionId }),
      });
      const result = await response.json() as { connection?: Connection; configurationLink?: string; error?: string };
      if (!response.ok && response.status !== 202) throw new Error(result.error || 'MT5 connection failed');
      if (!result.connection) throw new Error('MT5 connection failed');
      setConnections(current => [...current.filter(c => c.id !== result.connection!.id), result.connection!]);
      if (result.configurationLink) setPendingLink(result.configurationLink);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'MT5 connection failed'); }
    finally { setBusy(false); }
  }

  return <div className="mt5-connections">
    <div className="panel connection-intro">
      <span className="overline">MT5 · CLOUD SYNC</span>
      <h2>{t('Connect MT5 to your journal', 'เชื่อม MT5 เข้ากับบันทึกของคุณ')}</h2>
      <p>{t('Connect your MT5 account once and let Tradovia import closed trades automatically. No Windows computer or Expert Advisor needs to stay running.', 'เชื่อมบัญชี MT5 ครั้งเดียว แล้วให้รายการที่ปิดแล้วเข้าบันทึกอัตโนมัติ โดยไม่ต้องเปิดคอม Windows หรือ Expert Advisor ค้างไว้')}</p>
    </div>
    <div className="notice">{t('Use your investor (read-only) password. Your login and password are entered on MetaApi’s secure page, not stored by Tradovia. Connection depends on broker server compatibility and may take time.', 'ใช้รหัส Investor (อ่านอย่างเดียว) เท่านั้น คุณจะกรอกเลขบัญชีและรหัสบนหน้าปลอดภัยของ MetaApi โดย Tradovia ไม่เก็บรหัส การเชื่อมขึ้นกับเซิร์ฟเวอร์โบรกเกอร์และอาจใช้เวลาสักครู่')}</div>
    {!eligible && <div className="notice">{mode === 'demo' ? t('Sign in to connect a real MT5 account. Demo data cannot sync.', 'เข้าสู่ระบบก่อนเชื่อม MT5 จริง ข้อมูลเดโม่ไม่สามารถซิงก์ได้') : t('MT5 sync is planned for Pro and Elite.', 'ซิงก์ MT5 สำหรับแพ็กเกจ Pro และ Elite')}</div>}
    {eligible && !configured && <div className="panel"><h3>{t('Cloud connection is not open yet', 'ยังไม่เปิดการเชื่อมต่อ Cloud')}</h3><p>{t('We are preparing MetaApi access. Please continue using manual entries or MT5 report import for now.', 'กำลังเตรียมบัญชี MetaApi ระหว่างนี้ใช้บันทึกเองหรือนำเข้ารายงาน MT5 ได้')}</p></div>}
    {eligible && configured && <div className="panel">
      <h3>{t('Connect a trading account', 'เชื่อมบัญชีเทรด')}</h3>
      <label htmlFor="mt5-journal-account">{t('Journal account', 'บัญชีในบันทึก')}</label>
      <select id="mt5-journal-account" value={accountId} onChange={e => setAccountId(e.target.value)}>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <label htmlFor="mt5-server">{t('Exact MT5 broker server', 'ชื่อเซิร์ฟเวอร์ MT5 ตามที่แสดงในแอป')}</label>
      <input id="mt5-server" autoComplete="off" value={server} onChange={e => setServer(e.target.value)} placeholder="BrokerName-MT5" maxLength={120} />
      <p className="muted-copy">{t('Find it in MT5 account details. A broker name alone is not enough.', 'ดูได้จากรายละเอียดบัญชีใน MT5 ต้องเป็นชื่อเซิร์ฟเวอร์ ไม่ใช่เพียงชื่อโบรกเกอร์')}</p>
      <div className="actions"><button className="button ink" type="button" disabled={busy || !accountId || server.trim().length < 3 || connections.some(c => c.accountId === accountId && c.status !== 'disconnected')} onClick={() => void change('create')}>{t('Continue to secure MT5 sign-in', 'ดำเนินการต่อเพื่อเชื่อม MT5')}</button></div>
    </div>}
    {error && <p role="alert" className="negative">{error}</p>}
    {pendingLink && <div className="panel"><p>{t('The secure MetaApi page is ready. Enter your MT5 account number and investor password there.', 'หน้าปลอดภัยของ MetaApi พร้อมแล้ว กรอกเลขบัญชีและรหัส Investor ของ MT5 ที่หน้านั้น')}</p><a className="button ink" href={pendingLink} target="_blank" rel="noopener noreferrer">{t('Open secure MT5 sign-in', 'เปิดหน้าเชื่อมบัญชี MT5')}</a></div>}
    {connections.filter(c => c.status !== 'disconnected').map(c => <div className="panel connection-card" key={c.id}>
      <div className="section-heading"><h3>{data.accounts.find(a => a.id === c.accountId)?.name || t('Account', 'บัญชี')}</h3><span className="pill">{c.status === 'connected' ? t('Connected', 'เชื่อมแล้ว') : c.provisioning ? t('Preparing', 'กำลังเตรียม') : c.status === 'error' ? t('Needs attention', 'ต้องตรวจสอบ') : t('Awaiting sign-in', 'รอลงชื่อเข้าใช้')}</span></div>
      <p>{c.login ? `${c.login} · ${c.server}` : c.server}</p>
      {c.error && <output className="negative">{c.error}</output>}
      <p className="muted-copy">{t('Last sync', 'ซิงก์ล่าสุด')}: {c.lastSync ? new Date(c.lastSync).toLocaleString() : t('Not yet', 'ยังไม่เคย')}</p>
      <div className="actions">
        {c.provisioning && <button className="button ghost compact" disabled={busy} type="button" onClick={() => void change('resume', c.id)}>{t('Continue setup', 'ทำการตั้งค่าต่อ')}</button>}
        {c.metaapiId && <><button className="button ghost compact" disabled={busy} type="button" onClick={() => void change('configure', c.id)}>{t('Enter / update investor password', 'กรอก / เปลี่ยนรหัส Investor')}</button><button className="button ghost compact" disabled={busy} type="button" onClick={() => void change('status', c.id)}>{t('Check status', 'ตรวจสถานะ')}</button></>}
        <button className="text-button" disabled={busy} type="button" onClick={() => void change('disconnect', c.id)}>{t('Disconnect', 'ยกเลิกการเชื่อม')}</button>
      </div>
    </div>)}
    <p className="muted-copy">{t('Broker server coverage cannot be guaranteed. If MetaApi cannot find or authenticate your server, manual/report import remains available.', 'ไม่สามารถรับประกันเซิร์ฟเวอร์ MT5 ทุกโบรกเกอร์ได้ หาก MetaApi หาเซิร์ฟเวอร์หรือเข้าสู่ระบบไม่สำเร็จ ยังใช้การบันทึกเอง/นำเข้ารายงานได้')}</p>
  </div>;
}
