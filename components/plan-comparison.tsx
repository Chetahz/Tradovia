import { Check, Minus } from 'lucide-react';
import type { Translate } from './workspace-ui';

type PlanValue = string | boolean;
type ComparisonRow = {
  en: string;
  th: string;
  free: PlanValue;
  pro: PlanValue;
  freeTh?: string;
  proTh?: string;
};

const rows: ComparisonRow[] = [
  { en: 'Portfolio', th: 'พอร์ต', free: '1', pro: '20' },
  { en: 'Journal accounts', th: 'บัญชีบันทึก', free: '1', pro: 'Multiple', proTh: 'หลายบัญชี' },
  { en: 'Saved trades', th: 'รายการเทรด', free: '50', pro: 'Up to 5,000*', proTh: 'สูงสุด 5,000*' },
  { en: 'Playbooks', th: 'Playbook', free: '2', pro: 'Up to 100', proTh: 'สูงสุด 100' },
  { en: 'Chart images', th: 'ภาพประกอบ', free: '10', pro: 'Up to 100', proTh: 'สูงสุด 100' },
  { en: 'Trading calendar', th: 'ปฏิทิน', free: '30 days', freeTh: '30 วัน', pro: 'Full history', proTh: 'ย้อนหลังทั้งหมด' },
  { en: 'Core statistics', th: 'สถิติพื้นฐาน', free: true, pro: true },
  { en: 'Deep Analysis & Edge', th: 'Deep Analysis และ Edge', free: false, pro: true },
  { en: 'Weekly & monthly reports', th: 'รายงานสัปดาห์และเดือน', free: false, pro: true },
  { en: 'CSV / broker report import', th: 'นำเข้า CSV / รายงานโบรกเกอร์', free: false, pro: true },
  { en: 'Advanced widgets', th: 'วิดเจ็ตขั้นสูง', free: false, pro: true },
  { en: 'JSON & CSV export', th: 'ส่งออก JSON และ CSV', free: true, pro: true },
];

function Cell({ value, t }: { value: string | boolean; t: Translate }) {
  if (value === true)
    return <span className="plan-yes"><Check size={16} />{t('Included', 'มี')}</span>;
  if (value === false)
    return <span className="plan-no"><Minus size={16} />{t('Not included', 'ไม่มี')}</span>;
  return <b>{value}</b>;
}

export default function PlanComparison({ t, compact = false }: { t: Translate; compact?: boolean }) {
  const thai = t('en', 'th') === 'th';
  return (
    <section className={`plan-comparison${compact ? ' compact' : ''}`} aria-labelledby={compact ? undefined : 'plan-comparison-title'}>
      {!compact && (
        <div className="plan-comparison-heading">
          <span className="overline">FREE OR PRO</span>
          <h3 id="plan-comparison-title">{t('Choose how far you want to see.', 'เลือกตามระดับที่คุณอยากเห็นข้อมูล')}</h3>
          <p>{t('Free builds the habit. Pro turns your history into decisions.', 'Free ช่วยสร้างนิสัย ส่วน Pro เปลี่ยนประวัติของคุณให้เป็นข้อมูลตัดสินใจ')}</p>
        </div>
      )}
      <section className="plan-comparison-scroll" aria-label={t('Plan comparison', 'ตารางเปรียบเทียบแพ็กเกจ')}>
        <table>
          <thead><tr><th>{t('Capability', 'ความสามารถ')}</th><th>Free</th><th>Pro · ฿129</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const freeLabel = thai && row.freeTh ? row.freeTh : row.free;
              const proLabel = thai && row.proTh ? row.proTh : row.pro;
              return <tr key={row.en}><th>{t(row.en, row.th)}</th><td><Cell value={freeLabel} t={t} /></td><td><Cell value={proLabel} t={t} /></td></tr>;
            })}
          </tbody>
        </table>
      </section>
      <small>{t('*Pro limits protect service quality. MT5 Auto Sync will belong to a future third plan.', '*เพดาน Pro ช่วยรักษาคุณภาพบริการ และ MT5 Auto Sync จะอยู่ในแพ็กเกจระดับ 3 ในอนาคต')}</small>
    </section>
  );
}
