'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
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
export default function Playbooks({
  plans,
  trades,
  t,
  save,
  onView,
}: {
  plans: Playbook[];
  trades: Trade[];
  t: Translate;
  save: (p: Playbook) => Promise<boolean>;
  onView: (tr: Trade) => void;
}) {
  const [edit, setEdit] = useState<Playbook | null>(null),
    [selected, setSelected] = useState(''),
    [archived, setArchived] = useState(false),
    [busy, setBusy] = useState(false);
  const submit = async (p: Playbook) => {
    setBusy(true);
    try {
      if (await save(p)) setEdit(null);
    } finally {
      setBusy(false);
    }
  };
  const rows = trades.filter((tr) => tr.playbook?.id === selected);
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
        <button className="button ink compact" onClick={() => setEdit(blank())}>
          {t('Create plan', 'สร้างแผน')}
        </button>
      </div>
      <label className="daily-check">
        <input
          type="checkbox"
          checked={archived}
          onChange={(e) => setArchived(e.target.checked)}
        />
        {t('Show archived plans', 'แสดงแผนที่เก็บไว้')}
      </label>
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
            <button
              type="button"
              className="icon-button playbook-editor-close"
              aria-label={t('Close editor', 'ปิดหน้าสร้างแผน')}
              onClick={() => setEdit(null)}
            >
              <X size={20} />
            </button>
          </div>
          {(
            ['name', 'technique', 'entry', 'exit', 'risk', 'checklist'] as const
          ).map((field, i) => (
            <label className="daily-field" key={field}>
              {
                [
                  t('Plan name *', 'ชื่อแผน *'),
                  t('Technique / category', 'เทคนิค / หมวด'),
                  t('Entry conditions *', 'เงื่อนไขเข้าเทรด *'),
                  t('Exit / invalidation', 'เงื่อนไขออก / แผนใช้ไม่ได้'),
                  t('Risk rules', 'กฎความเสี่ยง'),
                  t('Checklist (one item per line)', 'Checklist (ข้อละบรรทัด)'),
                ][i]
              }
              {i < 2 ? (
                <input
                  required={field === 'name'}
                  maxLength={120}
                  value={edit[field]}
                  onChange={(e) => setEdit({ ...edit, [field]: e.target.value })}
                />
              ) : (
                <textarea
                  required={field === 'entry'}
                  maxLength={4000}
                  value={edit[field]}
                  onChange={(e) => setEdit({ ...edit, [field]: e.target.value })}
                />
              )}
            </label>
          ))}
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
      <div className="workspace-guide-grid playbook-grid">
        {plans
          .filter((p) => archived || !p.archived)
          .map((p) => (
            <article className="daily-card playbook-card" key={p.id}>
              <small>
                {p.technique || t('Your strategy', 'กลยุทธ์ของคุณ')} · v{p.version}
                {p.archived ? ' · Archived' : ''}
              </small>
              <h3>{p.name}</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{p.entry}</p>
              <div className="actions" style={{ flexWrap: 'wrap' }}>
                <button
                  className="button ghost compact"
                  onClick={() => setSelected(p.id)}
                >
                  {t('View trades', 'ดูเทรด')}
                </button>
                <button
                  className="button ghost compact"
                  onClick={() => setEdit({ ...p })}
                >
                  {t('Edit', 'แก้ไข')}
                </button>
                <button
                  className="button ghost compact"
                  onClick={() =>
                    setEdit({
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
          ))}
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
