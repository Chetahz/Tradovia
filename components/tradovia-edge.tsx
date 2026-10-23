'use client';

import {
  ArrowRight,
  ChartNoAxesCombined,
  CircleAlert,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { money, type Trade } from '@/lib/domain';
import {
  analyzeTradoviaEdge,
  EDGE_MIN_SAMPLE,
  type EdgeDimension,
  type EdgeGroup,
} from '@/lib/tradovia-edge';
import type { Translate } from './workspace-ui';

const dimensionLabel = (dimension: EdgeDimension, t: Translate) =>
  ({
    setup: t('Setup', 'รูปแบบ'),
    symbol: t('Instrument', 'สินทรัพย์'),
    session: t('Session', 'ช่วงเวลา'),
    emotion: t('State of mind', 'สภาวะอารมณ์'),
  })[dimension];

const groupLabel = (group: EdgeGroup, t: Translate) => {
  if (group.dimension === 'session') {
    return (
      {
        asia: t('Asia session', 'เอเชียเซสชัน'),
        london: t('London session', 'ลอนดอนเซสชัน'),
        'new-york': t('New York session', 'นิวยอร์กเซสชัน'),
        late: t('Late session', 'ช่วงดึก'),
        unknown: t('Unknown time', 'ไม่ทราบเวลา'),
      }[group.key] ?? group.key
    );
  }
  if (group.dimension === 'emotion') {
    return (
      {
        calm: t('Calm', 'สงบ'),
        confident: t('Confident', 'มั่นใจ'),
        anxious: t('Anxious', 'กังวล'),
        fomo: t('FOMO', 'กลัวตกรถ'),
        frustrated: t('Frustrated', 'หงุดหงิด'),
      }[group.key] ?? group.key
    );
  }
  return group.key;
};

export default function TradoviaEdge({
  trades,
  t,
  compact = false,
  onOpen,
  onImport,
}: {
  trades: Trade[];
  t: Translate;
  compact?: boolean;
  onOpen?: () => void;
  onImport?: () => void;
}) {
  const edge = analyzeTradoviaEdge(trades);
  const strongest = edge.strongest;
  const weakest = edge.weakest;
  const focus = {
    record: t(
      'Record your first closed trades. Tradovia will wait for enough evidence before describing a pattern.',
      'เริ่มบันทึกเทรดที่ปิดแล้ว Tradovia จะรอข้อมูลให้เพียงพอก่อนอธิบายรูปแบบ',
    ),
    review: t(
      'Finish the trades waiting for review so outcomes can be compared with your decisions.',
      'ทบทวนรายการที่ค้างอยู่ เพื่อให้ระบบเปรียบเทียบผลลัพธ์กับการตัดสินใจได้',
    ),
    risk: t(
      'Record planned risk consistently. This makes performance comparable in R instead of account currency.',
      'บันทึกความเสี่ยงตามแผนให้สม่ำเสมอ เพื่อเปรียบเทียบผลงานเป็น R แทนจำนวนเงิน',
    ),
    playbook: t(
      'Attach a Playbook to each repeatable setup so Tradovia can separate process from outcome.',
      'ผูก Playbook กับ Setup ที่ทำซ้ำได้ เพื่อให้ Tradovia แยกกระบวนการออกจากผลลัพธ์',
    ),
    discipline: t(
      'Your clearest opportunity is process consistency: pause and confirm the plan before entry.',
      'โอกาสที่ชัดที่สุดตอนนี้คือความสม่ำเสมอของกระบวนการ หยุดเช็กแผนก่อนเข้าเทรด',
    ),
    weakness: weakest
      ? t(
          `Review ${groupLabel(weakest, t)} before repeating it. Its recorded average is ${weakest.averageR.toFixed(2)}R across ${weakest.riskTrades} risk-tagged trades.`,
          `ทบทวน ${groupLabel(weakest, t)} ก่อนใช้ซ้ำ ค่าเฉลี่ยที่บันทึกไว้คือ ${weakest.averageR.toFixed(2)}R จาก ${weakest.riskTrades} รายการที่มีข้อมูลความเสี่ยง`,
        )
      : '',
    repeat: strongest
      ? t(
          `Keep the process behind ${groupLabel(strongest, t)} consistent and collect more evidence before changing its rules.`,
          `รักษากระบวนการของ ${groupLabel(strongest, t)} ให้สม่ำเสมอ และเก็บข้อมูลเพิ่มก่อนเปลี่ยนกฎ`,
        )
      : t(
          'Keep recording the same core fields. A useful pattern needs repeated, comparable trades.',
          'บันทึกข้อมูลหลักให้เหมือนกันต่อเนื่อง รูปแบบที่ใช้ประโยชน์ได้ต้องมาจากรายการที่เปรียบเทียบกันได้',
        ),
  }[edge.focus];

  if (compact) {
    return (
      <section className="panel edge-today" aria-label="Tradovia Edge">
        <div className="edge-today-score" aria-label={t('Process score', 'คะแนนกระบวนการ')}>
          <span>{t('PROCESS', 'กระบวนการ')}</span>
          <b>{edge.processScore}</b>
          <small>/100</small>
        </div>
        <div className="edge-today-copy">
          <span className="overline">TRADOVIA EDGE</span>
          <h2>
            {strongest
              ? t(
                  `${groupLabel(strongest, t)} is your strongest recorded pattern`,
                  `${groupLabel(strongest, t)} คือรูปแบบที่เด่นที่สุดจากข้อมูลที่บันทึก`,
                )
              : t('Your personal edge is taking shape', 'ความได้เปรียบส่วนตัวกำลังก่อตัว')}
          </h2>
          <p>{focus}</p>
          <small>
            {strongest
              ? t(
                  `${strongest.averageR.toFixed(2)}R average · ${strongest.riskTrades} comparable trades`,
                  `เฉลี่ย ${strongest.averageR.toFixed(2)}R · ${strongest.riskTrades} รายการที่เปรียบเทียบได้`,
                )
              : t(
                  `A pattern appears after at least ${EDGE_MIN_SAMPLE} trades with recorded risk.`,
                  `ระบบจะแสดงรูปแบบเมื่อมีอย่างน้อย ${EDGE_MIN_SAMPLE} รายการที่บันทึกความเสี่ยง`,
                )}
          </small>
        </div>
        {(onOpen || onImport) && (
          <div className="edge-today-actions">
            {onImport && (
              <button className="button ghost compact" onClick={onImport}>
                {t('Import history', 'นำเข้าประวัติ')}
              </button>
            )}
            {onOpen && (
              <button className="button ghost compact" onClick={onOpen}>
                {t('Open Edge Map', 'เปิด Edge Map')} <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  const coverage = [
    [t('Reviewed', 'ทบทวนแล้ว'), edge.reviewCoverage],
    [t('Risk recorded', 'บันทึกความเสี่ยง'), edge.riskCoverage],
    [t('Playbook linked', 'ผูก Playbook'), edge.playbookCoverage],
    [t('Followed plan', 'ทำตามแผน'), edge.adherenceRate],
  ] as const;
  const visibleGroups = edge.groups.slice(0, 10);

  return (
    <section className="edge-map" aria-labelledby="edge-map-title">
      <div className="panel edge-hero">
        <div className="edge-hero-copy">
          <span className="overline">TRADOVIA EDGE</span>
          <h2 id="edge-map-title">
            {t('The conditions behind your decisions', 'เงื่อนไขเบื้องหลังการตัดสินใจของคุณ')}
          </h2>
          <p>
            {t(
              'Tradovia compares normalized R across repeated setups, instruments, sessions and emotions. It describes your journal history; it does not predict the next trade.',
              'Tradovia เปรียบเทียบค่า R ของรูปแบบ สินทรัพย์ ช่วงเวลา และอารมณ์ที่เกิดซ้ำ ข้อมูลนี้อธิบายประวัติของคุณ ไม่ได้ทำนายเทรดถัดไป',
            )}
          </p>
        </div>
        <div className="edge-score">
          <span>{t('PROCESS SCORE', 'คะแนนกระบวนการ')}</span>
          <strong>{edge.processScore}</strong>
          <small>/100</small>
        </div>
      </div>

      <div className="edge-focus-grid">
        <article className="panel edge-focus-card">
          <Target size={22} aria-hidden="true" />
          <span className="overline">{t('NEXT FOCUS', 'สิ่งที่ควรโฟกัส')}</span>
          <h3>{focus}</h3>
        </article>
        <article className="panel edge-evidence-card">
          <ChartNoAxesCombined size={22} aria-hidden="true" />
          <span className="overline">{t('EVIDENCE', 'ข้อมูลประกอบ')}</span>
          <h3>{edge.closed} {t('closed trades', 'รายการที่ปิดแล้ว')}</h3>
          <p>
            {edge.riskRecorded} {t('with comparable risk', 'รายการมีข้อมูลความเสี่ยงที่เปรียบเทียบได้')} ·{' '}
            {edge.reviewed} {t('reviewed', 'รายการทบทวนแล้ว')}
          </p>
        </article>
      </div>

      <section className="panel edge-process-panel">
        <div className="section-heading">
          <div>
            <span className="overline">{t('PROCESS HEALTH', 'สุขภาพกระบวนการ')}</span>
            <h2>{t('Can the journal explain your results?', 'ข้อมูลในบันทึกอธิบายผลลัพธ์ได้แค่ไหน?')}</h2>
          </div>
          <ShieldCheck size={28} aria-hidden="true" />
        </div>
        <div className="edge-coverage-grid">
          {coverage.map(([label, value]) => (
            <div key={label} className="edge-coverage-item">
              <span><b>{Math.round(value)}%</b>{label}</span>
              <div aria-hidden="true"><i style={{ width: `${Math.min(100, value)}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel edge-pattern-panel">
        <div className="section-heading">
          <div>
            <span className="overline">EDGE MAP</span>
            <h2>{t('Repeated conditions ranked by average R', 'จัดอันดับเงื่อนไขที่เกิดซ้ำด้วยค่า R เฉลี่ย')}</h2>
          </div>
          <small>{t(`Minimum ${EDGE_MIN_SAMPLE} risk-tagged trades`, `อย่างน้อย ${EDGE_MIN_SAMPLE} รายการที่มีข้อมูลความเสี่ยง`)}</small>
        </div>
        {visibleGroups.length ? (
          <div className="edge-pattern-list">
            {visibleGroups.map((group) => (
              <article className="edge-pattern-row" key={`${group.dimension}:${group.key}`}>
                <span className="edge-dimension">{dimensionLabel(group.dimension, t)}</span>
                <div>
                  <b>{groupLabel(group, t)}</b>
                  <small>{group.riskTrades} {t('comparable trades', 'รายการที่เปรียบเทียบได้')} · {money(group.pnl)} {t('net', 'สุทธิ')}</small>
                </div>
                <span className={group.averageR >= 0 ? 'positive' : 'negative'}>{group.averageR.toFixed(2)}R</span>
                <small>{Math.round((group.wins / group.trades) * 100)}% {t('wins', 'ชนะ')}</small>
              </article>
            ))}
          </div>
        ) : (
          <div className="edge-empty">
            <CircleAlert size={22} aria-hidden="true" />
            <div>
              <b>{t('More comparable trades are needed', 'ต้องมีรายการที่เปรียบเทียบได้เพิ่ม')}</b>
              <p>{t(
                `Record planned risk on at least ${EDGE_MIN_SAMPLE} closed trades in the same condition. Tradovia will not manufacture a pattern from too little data.`,
                `บันทึกความเสี่ยงตามแผนอย่างน้อย ${EDGE_MIN_SAMPLE} รายการในเงื่อนไขเดียวกัน Tradovia จะไม่สร้างข้อสรุปจากข้อมูลที่น้อยเกินไป`,
              )}</p>
            </div>
          </div>
        )}
      </section>

      <section className="panel edge-discipline-panel">
        <div>
          <span className="overline">{t('PLAN DISCIPLINE', 'วินัยตามแผน')}</span>
          <h2>{t('Followed plan versus outside plan', 'ตามแผนเทียบกับนอกแผน')}</h2>
          <p>{t(
            'The comparison appears only when each side has enough trades with recorded planned risk.',
            'ระบบจะแสดงผลเปรียบเทียบเมื่อทั้งสองกลุ่มมีรายการที่บันทึกความเสี่ยงเพียงพอ',
          )}</p>
        </div>
        <div className="edge-discipline-values">
          <span><small>{t('Followed plan', 'ตามแผน')} · {edge.followedSample}</small><b>{edge.followedAverageR === null ? '—' : `${edge.followedAverageR.toFixed(2)}R`}</b></span>
          <span><small>{t('Outside plan', 'นอกแผน')} · {edge.outsideSample}</small><b>{edge.outsideAverageR === null ? '—' : `${edge.outsideAverageR.toFixed(2)}R`}</b></span>
        </div>
      </section>
    </section>
  );
}
