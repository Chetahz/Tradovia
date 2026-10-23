'use client';
import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import type { Playbook, Trade } from '@/lib/domain';
import { money, net } from '@/lib/domain';
import type { Translate } from './workspace-ui';
const blank = (): Playbook => ({
  id: '',
  name: '',
  technique: '',
  entry: '',
  exit: '',
  risk: '',
  checklist: '',
  archived: false,
  version: 0,
});
const starters = [
  {
    id: 'breakout',
    en: 'Breakout & retest',
    th: 'เบรกแล้วกลับมาทดสอบ',
    hintEn: 'Wait for a level break, then a retest.',
    hintTh: 'รอเบรกระดับสำคัญ แล้วกลับมาทดสอบ',
    entryEn: 'Enter only after price breaks my marked level and retests it with confirmation.',
    entryTh: 'เข้าเทรดเมื่อราคาเบรกระดับที่กำหนด กลับมาทดสอบ และมีสัญญาณยืนยันตามแผน',
    exitEn: 'Stand aside if price closes back inside the broken level. Take profit at the next liquidity area or planned target.',
    exitTh: 'ไม่เข้าเมื่อราคาปิดกลับเข้าใต้ระดับที่เบรก และออกที่สภาพคล่องถัดไปหรือเป้าหมายตามแผน',
    riskEn: 'Risk no more than 1% per trade. Stop goes beyond the retest structure.',
    riskTh: 'เสี่ยงไม่เกิน 1% ต่อรายการ และวาง Stop หลังโครงสร้างที่กลับมาทดสอบ',
    checklistEn: 'Marked level is clear\nBreak has a decisive close\nRetest gives confirmation\nNo major news nearby',
    checklistTh: 'กำหนดระดับสำคัญชัดเจน\nแท่งเบรกปิดชัดเจน\nการกลับมาทดสอบมีสัญญาณยืนยัน\nไม่มีข่าวสำคัญใกล้เวลาเข้า',
  },
  {
    id: 'fvg',
    en: 'FVG + structure shift',
    th: 'FVG + เปลี่ยนโครงสร้าง',
    hintEn: 'Wait for displacement, structure shift and an FVG return.',
    hintTh: 'รอแรงส่ง การเปลี่ยนโครงสร้าง และราคากลับเข้า FVG',
    entryEn: 'Enter after displacement shifts structure and price returns to the marked FVG with confirmation.',
    entryTh: 'เข้าเมื่อเกิดแรงส่งเปลี่ยนโครงสร้าง แล้วราคากลับเข้า FVG ที่กำหนดพร้อมสัญญาณยืนยัน',
    exitEn: 'The setup is invalid if price closes through the origin of displacement. Target opposing liquidity.',
    exitTh: 'แผนใช้ไม่ได้เมื่อราคาปิดทะลุต้นทางของแรงส่ง และตั้งเป้าที่สภาพคล่องฝั่งตรงข้าม',
    riskEn: 'Risk no more than 1% and require at least 1:2 planned reward to risk.',
    riskTh: 'เสี่ยงไม่เกิน 1% และต้องมีผลตอบแทนต่อความเสี่ยงตามแผนอย่างน้อย 1:2',
    checklistEn: 'Higher-timeframe direction is clear\nStructure shift is confirmed\nFVG is fresh\nTarget liquidity is identified',
    checklistTh: 'ทิศทางกรอบเวลาใหญ่ชัดเจน\nยืนยันการเปลี่ยนโครงสร้างแล้ว\nFVG ยังไม่ถูกใช้งาน\nกำหนดเป้าหมายสภาพคล่องแล้ว',
  },
  {
    id: 'liquidity',
    en: 'Liquidity sweep',
    th: 'กวาดสภาพคล่อง',
    hintEn: 'Wait for a sweep and a confirmed move away.',
    hintTh: 'รอการกวาดจุดสูง/ต่ำ แล้วเกิดแรงส่งกลับที่ยืนยันได้',
    entryEn: 'Enter only after price sweeps marked liquidity and confirms rejection with displacement.',
    entryTh: 'เข้าเมื่อราคากวาดสภาพคล่องที่กำหนด และยืนยันการปฏิเสธด้วยแรงส่งกลับ',
    exitEn: 'The setup is invalid if price accepts beyond the swept level. Target the next opposing liquidity.',
    exitTh: 'แผนใช้ไม่ได้เมื่อราคายอมรับเหนือ/ใต้ระดับที่กวาด และตั้งเป้าที่สภาพคล่องฝั่งตรงข้าม',
    riskEn: 'One attempt per session with no more than 1% risk.',
    riskTh: 'เข้าได้หนึ่งครั้งต่อ Session และเสี่ยงไม่เกิน 1%',
    checklistEn: 'Liquidity level is marked\nSweep occurs in my session\nDisplacement confirms rejection\nStop is beyond the sweep',
    checklistTh: 'กำหนดระดับสภาพคล่องแล้ว\nเกิดการกวาดใน Session ที่เทรด\nแรงส่งยืนยันการปฏิเสธ\nวาง Stop หลังจุดที่ถูกกวาด',
  },
  {
    id: 'pullback',
    en: 'Trend pullback',
    th: 'ย่อในแนวโน้ม',
    hintEn: 'Wait for a pullback within your trend.',
    hintTh: 'รอราคาย่อในทิศทางแนวโน้มที่เลือก',
    entryEn: 'Enter only when price pulls back to my marked area and confirms the trend is continuing.',
    entryTh: 'เข้าเทรดเมื่อราคาย่อถึงโซนที่กำหนด และมีสัญญาณยืนยันว่าแนวโน้มยังดำเนินต่อ',
    exitEn: 'Exit or stand aside when the trend structure breaks. Target the next structure level.',
    exitTh: 'ออกหรือไม่เข้าเมื่อโครงสร้างแนวโน้มถูกทำลาย และตั้งเป้าที่โครงสร้างถัดไป',
    riskEn: 'Risk no more than 1% and do not widen the stop after entry.',
    riskTh: 'เสี่ยงไม่เกิน 1% และห้ามขยาย Stop หลังเข้าเทรด',
    checklistEn: 'Trend direction is clear\nPullback reaches my area\nContinuation is confirmed\nStop location is structural',
    checklistTh: 'ทิศทางแนวโน้มชัดเจน\nราคาย่อถึงโซนที่กำหนด\nมีสัญญาณยืนยันการไปต่อ\nจุด Stop อ้างอิงโครงสร้าง',
  },
] as const;
export default function Playbooks({
  plans,
  trades,
  t,
  save,
  onView,
  pro,
}: {
  plans: Playbook[];
  trades: Trade[];
  t: Translate;
  save: (p: Playbook) => Promise<boolean>;
  onView: (tr: Trade) => void;
  pro: boolean;
}) {
  const [edit, setEdit] = useState<Playbook | null>(null),
    [selected, setSelected] = useState(''),
    [archived, setArchived] = useState(false),
    [busy, setBusy] = useState(false),
    [starter, setStarter] = useState(''),
    [advanced, setAdvanced] = useState(false);
  const begin = (p: Playbook) => {
    setEdit(p);
    setStarter('');
    setAdvanced(Boolean(p.id && (p.exit || p.risk || p.checklist)));
  };
  const chooseStarter = (id: string) => {
    setStarter(id);
    const item = starters.find((option) => option.id === id);
    if (!item || !edit) {
      setEdit(blank());
      return;
    }
    setEdit({
      ...edit,
      name: t(item.en, item.th),
      technique: t(item.en, item.th),
      entry: t(item.entryEn, item.entryTh),
      exit: t(item.exitEn, item.exitTh),
      risk: t(item.riskEn, item.riskTh),
      checklist: t(item.checklistEn, item.checklistTh),
    });
  };
  const submit = async (p: Playbook) => {
    setBusy(true);
    try {
      if (await save(p)) setEdit(null);
    } finally {
      setBusy(false);
    }
  };
  const rows = trades.filter((tr) => tr.playbook?.id === selected);
  const readiness = edit
    ? Math.round(
        ([edit.name, edit.entry, edit.exit, edit.risk, edit.checklist].filter(
          (value) => value.trim().length > 0,
        ).length /
          5) *
          100,
      )
    : 0;
  const riskPresets = [
    t('Risk no more than 0.5% per trade.', 'เสี่ยงไม่เกิน 0.5% ต่อรายการ'),
    t('Risk no more than 1% per trade.', 'เสี่ยงไม่เกิน 1% ต่อรายการ'),
    t('Stop after two losses in one day.', 'หยุดเทรดเมื่อแพ้ 2 รายการในวันเดียว'),
  ];
  const checklistPresets = [
    t('Higher-timeframe direction is clear', 'ทิศทางกรอบเวลาใหญ่ชัดเจน'),
    t('Entry confirmation is present', 'มีสัญญาณยืนยันก่อนเข้า'),
    t('Risk and stop are defined', 'กำหนดความเสี่ยงและ Stop แล้ว'),
    t('No major news nearby', 'ไม่มีข่าวสำคัญใกล้เวลาเข้า'),
  ];
  const toggleChecklist = (item: string) => {
    if (!edit) return;
    const current = edit.checklist
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    setEdit({
      ...edit,
      checklist: current.includes(item)
        ? current.filter((line) => line !== item).join('\n')
        : [...current, item].join('\n'),
    });
  };
  return (
    <section className="panel playbook-panel">
      <div className="section-heading">
        <div>
          <h2>Playbook</h2>
          <p className="journal-hint">
            {t(
              'Your plans, written in your own words. Trade records keep their original plan version.',
              'แผนในแบบของคุณ ประวัติเทรดจะเก็บแผนเวอร์ชันที่ใช้ไว้เสมอ',
            )}
          </p>
        </div>
        <button className="button ink compact" onClick={() => {
          if (!pro && plans.length >= 2) window.location.hash = 'settings';
          else begin(blank());
        }}>
          {t('Create plan', 'สร้างแผน')}{' '}
          {!pro && plans.length >= 2 && <span className="plan-badge">PRO</span>}
        </button>
      </div>
      {edit && (
        <form
          className="daily-card playbook-editor"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(edit);
          }}
        >
          <div className="playbook-editor-heading">
            <div>
              <span className="overline">
                {t('YOUR TRADING PROCESS', 'กระบวนการเทรดของคุณ')}
              </span>
              <h3>
                {edit.id ? t('Edit plan', 'แก้ไขแผน') : t('New plan', 'แผนใหม่')}
              </h3>
            </div>
            <div className="playbook-readiness" aria-label={t('Plan readiness', 'ความพร้อมของแผน')}>
              <span>{t('Ready', 'พร้อมใช้')}</span>
              <b>{readiness}%</b>
            </div>
            <button
              type="button"
              className="icon-button playbook-editor-close"
              aria-label={t('Close editor', 'ปิดหน้าสร้างแผน')}
              onClick={() => setEdit(null)}
            >
              <X size={20} />
            </button>
          </div>
          {!edit.id && (
            <div className="playbook-start">
              <h4>{t('Start with a setup', 'เลือกแนวทางตั้งต้น')}</h4>
              <p>{t('These are editable examples, not trading signals.', 'ตัวอย่างช่วยเริ่มต้น แก้ให้ตรงวิธีเทรดของคุณก่อนใช้จริง')}</p>
              <fieldset className="playbook-starters">
                <legend className="sr-only">{t('Plan starting point', 'แนวทางตั้งต้นของแผน')}</legend>
                {starters.map((item) => (
                  <button key={item.id} type="button" className="playbook-starter" aria-pressed={starter === item.id} onClick={() => chooseStarter(item.id)}>
                    <span className="playbook-starter-title">{t(item.en, item.th)} {starter === item.id && <Check size={16} aria-hidden="true" />}</span>
                    <span>{t(item.hintEn, item.hintTh)}</span>
                  </button>
                ))}
                <button type="button" className="playbook-starter" aria-pressed={starter === 'custom'} onClick={() => chooseStarter('custom')}>
                  <span className="playbook-starter-title">{t('My own setup', 'เขียนแบบของฉัน')} {starter === 'custom' && <Check size={16} aria-hidden="true" />}</span>
                  <span>{t('Start from a blank plan', 'เริ่มจากแผนเปล่า')}</span>
                </button>
              </fieldset>
            </div>
          )}
          <div className="playbook-core">
            <label className="daily-field">
              {t('Name this plan *', 'ตั้งชื่อแผน *')}
              <input required maxLength={120} value={edit.name} placeholder={t('e.g. My morning setup', 'เช่น แผนช่วงเช้าของฉัน')} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </label>
            <label className="daily-field">
              {t('When will you enter? *', 'จะเข้าเทรดเมื่อไร? *')}
              <textarea required maxLength={4000} value={edit.entry} placeholder={t('Write one clear condition you can check before entering', 'เขียนเงื่อนไขสั้น ๆ ที่เช็กได้ก่อนกดเข้าเทรด')} onChange={(e) => setEdit({ ...edit, entry: e.target.value })} />
              <span className="playbook-field-help">{t('You can refine this later. Trades keep the plan version used at the time.', 'ปรับรายละเอียดทีหลังได้ บันทึกเทรดจะเก็บแผนเวอร์ชันที่ใช้ไว้')}</span>
            </label>
          </div>
          <button type="button" className="playbook-advanced-toggle" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>
            <span>{t('More rules (optional)', 'เพิ่มกฎอื่น (ไม่บังคับ)')}</span><ChevronDown size={18} aria-hidden="true" />
          </button>
          {advanced && (
            <div className="playbook-advanced">
              {([
                ['technique', t('Technique / category', 'เทคนิค / หมวด'), t('e.g. Price action', 'เช่น Price action')],
                ['exit', t('When is this plan invalid?', 'เมื่อไรแผนนี้ใช้ไม่ได้?'), t('What would make you exit or stand aside?', 'อะไรทำให้ต้องออกหรือไม่เข้าเทรด?')],
                ['risk', t('Risk limit', 'ขอบเขตความเสี่ยง'), t('e.g. Maximum risk per trade', 'เช่น ความเสี่ยงสูงสุดต่อรายการ')],
                ['checklist', t('Quick checklist (one per line)', 'เช็กลิสต์สั้น ๆ (ข้อละบรรทัด)'), t('What must be true before entering?', 'ก่อนเข้าเทรดต้องตรวจอะไรบ้าง?')],
              ] as const).map(([field, label, placeholder]) => (
                <div className="daily-field" key={field}>
                  <span>{label}</span>
                  {field === 'risk' && (
                    <div className="playbook-quick-options" aria-label={t('Risk presets', 'ตัวเลือกความเสี่ยง')}>
                      {riskPresets.map((option) => (
                        <button type="button" key={option} aria-label={option} aria-pressed={edit.risk === option} onClick={() => setEdit({ ...edit, risk: option })}>
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  {field === 'checklist' && (
                    <div className="playbook-quick-options" aria-label={t('Suggested checklist', 'Checklist แนะนำ')}>
                      {checklistPresets.map((option) => (
                        <button type="button" key={option} aria-label={option} aria-pressed={edit.checklist.split('\n').map((line) => line.trim()).includes(option)} onClick={() => toggleChecklist(option)}>
                          <Check size={13} aria-hidden="true" /> {option}
                        </button>
                      ))}
                    </div>
                  )}
                  {field === 'technique' ? (
                    <input aria-label={label} maxLength={120} value={edit[field]} placeholder={placeholder} onChange={(e) => setEdit({ ...edit, [field]: e.target.value })} />
                  ) : (
                    <textarea aria-label={label} maxLength={4000} value={edit[field]} placeholder={placeholder} onChange={(e) => setEdit({ ...edit, [field]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="actions playbook-editor-actions">
            <button disabled={busy} className="button ink">
              {t('Save plan', 'บันทึกแผน')}
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => setEdit(null)}
            >
              {t('Cancel', 'ยกเลิก')}
            </button>
          </div>
        </form>
      )}
      {plans.some((p) => p.archived) && (
        <label className="daily-check">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          {t('Show archived plans', 'แสดงแผนที่เก็บไว้')}
        </label>
      )}
      <div className="workspace-guide-grid playbook-grid">
        {plans
          .filter((p) => archived || !p.archived)
          .map((p) => {
            const planRows = trades.filter((trade) => trade.playbook?.id === p.id);
            const closedRows = planRows.filter((trade) => trade.status === 'CLOSED');
            const reviewedRows = closedRows.filter((trade) => trade.adherence);
            const followed = reviewedRows.filter((trade) => trade.adherence === 'yes').length;
            const totalR = closedRows.reduce((sum, trade) => sum + (trade.risk > 0 ? net(trade) / trade.risk : 0), 0);
            return (
            <article className="daily-card playbook-card" key={p.id}>
              <small>
                {p.technique || t('Your strategy', 'กลยุทธ์ของคุณ')} · v{p.version}
                {p.archived ? ' · Archived' : ''}
              </small>
              <h3>{p.name}</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{p.entry}</p>
              <div className="playbook-card-metrics">
                <span><b>{closedRows.length}</b>{t(' trades', ' รายการ')}</span>
                <span><b>{closedRows.length ? `${(totalR / closedRows.length).toFixed(2)}R` : '—'}</b>{t(' average', ' เฉลี่ย')}</span>
                <span><b>{reviewedRows.length ? `${Math.round((followed / reviewedRows.length) * 100)}%` : '—'}</b>{t(' followed', ' ตามแผน')}</span>
              </div>
              <div className="actions" style={{ flexWrap: 'wrap' }}>
                <button
                  className="button ghost compact"
                  onClick={() => setSelected(p.id)}
                >
                  {t('View trades', 'ดูเทรด')}
                </button>
                <button
                  className="button ghost compact"
                  onClick={() => begin({ ...p })}
                >
                  {t('Edit', 'แก้ไข')}
                </button>
                <button
                  className="button ghost compact"
                  onClick={() =>
                    begin({
                      ...p,
                      id: '',
                      name: p.name + t(' copy', ' สำเนา'),
                      version: 0,
                      archived: false,
                    })
                  }
                >
                  {t('Duplicate', 'ทำสำเนา')}
                </button>
                <button
                  disabled={busy}
                  className="button ghost compact"
                  onClick={() => void submit({ ...p, archived: !p.archived })}
                >
                  {p.archived
                    ? t('Restore', 'นำกลับมาใช้')
                    : t('Archive', 'เก็บแผน')}
                </button>
              </div>
            </article>
          )})}
      </div>
      {!plans.some((p) => archived || !p.archived) && (
        <p className="journal-hint">
          {t(
            'Start with a name and entry conditions. You can add the remaining details later.',
            'เริ่มจากชื่อและเงื่อนไขเข้าเทรดก่อน รายละเอียดอื่นเพิ่มภายหลังได้',
          )}
        </p>
      )}
      {selected && (
        <div className="daily-reflection">
          <h3>
            {plans.find((p) => p.id === selected)?.name} · {rows.length}{' '}
            {t('trades', 'รายการ')}
          </h3>
          <p className="journal-hint">
            {t(
              'Includes all saved versions of this plan. Open a trade to see its original version.',
              'รวมทุกเวอร์ชันของแผนนี้ กดเทรดเพื่อดูแผนฉบับที่ใช้ตอนบันทึก',
            )}
          </p>
          {rows.map((tr) => (
            <button
              className="guide-task"
              key={tr.id}
              onClick={() => onView(tr)}
            >
              {tr.date} · {tr.symbol} · {money(net(tr))} · v
              {tr.playbook?.version} ·{' '}
              {tr.adherence === 'yes'
                ? t('Followed', 'ตามแผน')
                : tr.adherence === 'partial'
                  ? t('Partly', 'บางส่วน')
                  : tr.adherence === 'no'
                    ? t('Outside plan', 'นอกแผน')
                    : t('Unreviewed', 'ยังไม่ทบทวน')}
            </button>
          ))}
          {!rows.length && (
            <p>
              {t(
                'Select this playbook when recording a trade to see it here.',
                'เลือก Playbook นี้ตอนบันทึกเทรด เพื่อดูรายการที่นี่',
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
