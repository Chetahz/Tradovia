'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  Focus,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { money, type Trade } from '@/lib/domain';
import {
  analyzeMonthlyReport,
  availableTradeMonths,
  previousMonth,
} from '@/lib/monthly-report';
import type { Translate } from './workspace-ui';
import { TradeTable } from './workspace-ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';

const moveMonth = (month: string, offset: number) => {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(year, value - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (month: string, thai: boolean) =>
  new Date(`${month}-01T12:00:00`).toLocaleDateString(thai ? 'th-TH' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) =>
    context.fillText(value, x, y + index * lineHeight),
  );
}

export default function MonthlyReport({
  trades,
  capital,
  t,
  thai,
  onView,
}: {
  trades: Trade[];
  capital: number;
  t: Translate;
  thai: boolean;
  onView: (trade: Trade) => void;
}) {
  const months = useMemo(() => availableTradeMonths(trades), [trades]);
  const [selected, setSelected] = useState(months[0] ?? new Date().toISOString().slice(0, 7));
  const [imageUrl, setImageUrl] = useState('');
  const report = useMemo(
    () => analyzeMonthlyReport(trades, selected, capital),
    [trades, selected, capital],
  );
  const title = monthLabel(selected, thai);
  const priorLabel = monthLabel(previousMonth(selected), thai);
  const pnlChange = report.previous.count ? report.pnl - report.previous.pnl : null;
  const focus = {
    record: t('Build the first month of evidence', 'เริ่มสร้างข้อมูลเดือนแรก'),
    review: t('Finish the reviews that are still missing', 'ทบทวนรายการที่ยังไม่ครบ'),
    risk: t('Record planned risk on every trade', 'บันทึกความเสี่ยงตามแผนทุกครั้ง'),
    discipline: t('Pause and confirm the plan before entry', 'หยุดเช็กแผนก่อนเข้าเทรด'),
    weakness: report.weakest
      ? t(`Review ${report.weakest.name} before repeating it`, `ทบทวน ${report.weakest.name} ก่อนใช้ซ้ำ`)
      : t('Review the weakest repeated condition', 'ทบทวนเงื่อนไขที่อ่อนที่สุด'),
    repeat: report.strongest
      ? t(`Repeat the process behind ${report.strongest.name}`, `ทำกระบวนการของ ${report.strongest.name} ให้สม่ำเสมอ`)
      : t('Keep the recording process consistent', 'บันทึกกระบวนการให้สม่ำเสมอ'),
  }[report.focus];

  const saveImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    const context = canvas.getContext('2d');
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 1200, 1500);
    gradient.addColorStop(0, '#071715');
    gradient.addColorStop(0.58, '#0b1114');
    gradient.addColorStop(1, '#11171b');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 1500);
    context.fillStyle = 'rgba(0, 232, 209, .10)';
    context.beginPath();
    context.arc(1100, 80, 410, 0, Math.PI * 2);
    context.fill();
    context.font = '700 30px "IBM Plex Sans Thai", sans-serif';
    context.fillStyle = '#00e8d1';
    context.fillText('T  TRADOVIA', 80, 100);
    context.font = '500 22px "IBM Plex Sans Thai", sans-serif';
    context.fillStyle = '#8fa09e';
    context.fillText(t('MONTHLY PERFORMANCE REPORT', 'รายงานผลการเทรดประจำเดือน'), 80, 170);
    context.font = '700 58px "IBM Plex Sans Thai", sans-serif';
    context.fillStyle = '#f5fbfa';
    context.fillText(title, 80, 245);
    context.font = '700 92px "IBM Plex Sans Thai", sans-serif';
    context.fillStyle = report.pnl >= 0 ? '#7ce0b4' : '#ff949e';
    context.fillText(money(report.pnl), 80, 370);
    context.font = '500 24px "IBM Plex Sans Thai", sans-serif';
    context.fillStyle = '#8fa09e';
    context.fillText(`${report.count} ${t('closed trades', 'รายการที่ปิดแล้ว')}`, 84, 415);

    const metrics = [
      [t('WIN RATE', 'อัตราชนะ'), `${report.winRate.toFixed(1)}%`],
      [t('AVERAGE R', 'R เฉลี่ย'), report.averageR === null ? '—' : `${report.averageR.toFixed(2)}R`],
      [t('MAX DRAWDOWN', 'DRAWDOWN สูงสุด'), `${report.drawdown.toFixed(2)}%`],
    ];
    metrics.forEach(([label, value], index) => {
      const x = 80 + index * 350;
      context.fillStyle = '#182124';
      context.roundRect(x, 485, 320, 160, 24);
      context.fill();
      context.font = '600 18px "IBM Plex Sans Thai", sans-serif';
      context.fillStyle = '#80908e';
      context.fillText(label, x + 26, 530);
      context.font = '700 42px "IBM Plex Sans Thai", sans-serif';
      context.fillStyle = '#f5fbfa';
      context.fillText(value, x + 26, 595);
    });

    const cards = [
      [t('WHAT WORKED', 'สิ่งที่ทำได้ดี'), report.strongest?.name ?? t('More evidence needed', 'ยังต้องมีข้อมูลเพิ่ม'), report.strongest ? `${report.strongest.averageR.toFixed(2)}R · ${report.strongest.riskTrades} ${t('trades', 'รายการ')}` : t('At least 2 comparable trades', 'ต้องมีอย่างน้อย 2 รายการที่เปรียบเทียบได้')],
      [t('WATCH CLOSELY', 'จุดที่ต้องระวัง'), report.repeatedMiss?.text ?? report.weakest?.name ?? t('No repeated issue yet', 'ยังไม่พบปัญหาที่เกิดซ้ำ'), report.repeatedMiss ? `${report.repeatedMiss.count} ${t('misses in reviewed trades', 'ครั้งจากรายการที่ทบทวน')}` : report.weakest ? `${report.weakest.averageR.toFixed(2)}R ${t('average', 'เฉลี่ย')}` : t('Keep reviewing each trade', 'ทบทวนทุกเทรดต่อไป')],
      [t('NEXT MONTH FOCUS', 'โฟกัสเดือนถัดไป'), focus, t('One clear action from your own journal', 'หนึ่งการลงมือทำจากข้อมูลของคุณเอง')],
    ];
    cards.forEach(([label, heading, note], index) => {
      const y = 720 + index * 205;
      context.fillStyle = index === 2 ? 'rgba(0, 232, 209, .10)' : '#121a1d';
      context.roundRect(80, y, 1020, 170, 24);
      context.fill();
      context.font = '600 18px "IBM Plex Sans Thai", sans-serif';
      context.fillStyle = '#00e8d1';
      context.fillText(label, 110, y + 42);
      context.font = '700 30px "IBM Plex Sans Thai", sans-serif';
      context.fillStyle = '#f5fbfa';
      wrapText(context, heading, 110, y + 86, 940, 38, 2);
      context.font = '500 18px "IBM Plex Sans Thai", sans-serif';
      context.fillStyle = '#8fa09e';
      context.fillText(note, 110, y + 145);
    });
    context.font = '500 18px "IBM Plex Sans Thai", sans-serif';
    context.fillStyle = '#647270';
    context.fillText(t('Based only on trades recorded in Tradovia.', 'สรุปจากรายการที่บันทึกใน Tradovia เท่านั้น'), 80, 1430);
    context.textAlign = 'right';
    context.fillText('tradovia', 1100, 1430);

    setImageUrl(canvas.toDataURL('image/png'));
  };

  const shift = (offset: number) => setSelected(moveMonth(selected, offset));

  return (
    <>
    <section className="monthly-report">
      <header className="monthly-report-head">
        <div>
          <span className="overline">TRADOVIA · MONTHLY REVIEW</span>
          <h2>{t('See the month. Keep the lesson.', 'เห็นทั้งเดือน เก็บบทเรียนที่สำคัญ')}</h2>
          <p>{t('A decision-focused report built from your recorded trades.', 'รายงานที่มองทั้งผลลัพธ์และคุณภาพการตัดสินใจจากข้อมูลของคุณ')}</p>
        </div>
        <div className="monthly-report-actions">
          <div className="month-switcher">
            <button aria-label={t('Previous month', 'เดือนก่อน')} onClick={() => shift(-1)}><ChevronLeft size={18} /></button>
            <label>
              <CalendarRange size={16} />
              <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                {(months.includes(selected) ? months : [selected, ...months]).map((month) => <option value={month} key={month}>{monthLabel(month, thai)}</option>)}
              </select>
            </label>
            <button aria-label={t('Next month', 'เดือนถัดไป')} onClick={() => shift(1)}><ChevronRight size={18} /></button>
          </div>
          <button className="button ghost compact" disabled={!report.count} onClick={saveImage}><Download size={16} /> {t('Save image', 'บันทึกเป็นภาพ')}</button>
        </div>
      </header>

      {!report.count ? (
        <div className="monthly-empty panel">
          <CalendarRange size={34} />
          <h3>{t('No closed trades in this month', 'เดือนนี้ยังไม่มีรายการที่ปิดแล้ว')}</h3>
          <p>{t('Choose another month or import your history to create the report.', 'เลือกเดือนอื่นหรือนำเข้าประวัติเพื่อสร้างรายงาน')}</p>
          {!!months.length && <button className="button ghost compact" onClick={() => setSelected(months[0])}>{t('Open latest active month', 'เปิดเดือนล่าสุดที่มีข้อมูล')}</button>}
        </div>
      ) : (
        <>
          <section className="monthly-hero panel">
            <div className="monthly-hero-result">
              <span>{title}</span>
              <strong className={report.pnl >= 0 ? 'positive' : 'negative'}>{money(report.pnl)}</strong>
              <small>{report.count} {t('closed trades · after fees', 'รายการที่ปิดแล้ว · หลังหักค่าธรรมเนียม')}</small>
              <div className="monthly-compare">
                {pnlChange === null ? (
                  <span>{t('No trades in the previous month for comparison', `ไม่มีข้อมูลเดือน${priorLabel}สำหรับเปรียบเทียบ`)}</span>
                ) : (
                  <span className={pnlChange >= 0 ? 'positive' : 'negative'}>
                    {pnlChange >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                    {money(Math.abs(pnlChange))} {t('versus', 'เทียบกับ')} {priorLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="monthly-metrics">
              <div><span>{t('Win rate', 'อัตราชนะ')}</span><b>{report.winRate.toFixed(1)}%</b></div>
              <div><span>{t('Average R', 'R เฉลี่ย')}</span><b>{report.averageR === null ? '—' : `${report.averageR.toFixed(2)}R`}</b></div>
              <div><span>{t('Max drawdown', 'Drawdown สูงสุด')}</span><b>{report.drawdown.toFixed(2)}%</b></div>
              <div><span>{t('Reviewed', 'ทบทวนแล้ว')}</span><b>{Math.round(report.reviewCoverage)}%</b></div>
            </div>
          </section>

          <div className="monthly-insight-grid">
            <article className="panel monthly-insight worked">
              <Sparkles size={21} />
              <span className="overline">{t('WHAT WORKED', 'สิ่งที่ทำได้ดี')}</span>
              <h3>{report.strongest?.name ?? t('More evidence needed', 'ยังต้องมีข้อมูลเพิ่ม')}</h3>
              <p>{report.strongest
                ? t(`${report.strongest.averageR.toFixed(2)}R average across ${report.strongest.riskTrades} comparable trades. Keep the process stable before changing its rules.`, `เฉลี่ย ${report.strongest.averageR.toFixed(2)}R จาก ${report.strongest.riskTrades} รายการที่เปรียบเทียบได้ รักษากระบวนการเดิมก่อนเปลี่ยนกฎ`)
                : t('Tradovia waits for at least 2 trades with recorded risk in the same setup.', 'Tradovia จะรออย่างน้อย 2 รายการใน Setup เดียวกันที่บันทึกความเสี่ยงก่อนสรุป')}</p>
            </article>
            <article className="panel monthly-insight watch">
              <ShieldCheck size={21} />
              <span className="overline">{t('WATCH CLOSELY', 'จุดที่ต้องระวัง')}</span>
              <h3>{report.repeatedMiss?.text ?? report.weakest?.name ?? t('No repeated leak yet', 'ยังไม่พบจุดรั่วที่เกิดซ้ำ')}</h3>
              <p>{report.repeatedMiss
                ? t(`Missed in ${report.repeatedMiss.count} reviewed trades. Put this check before execution.`, `พบว่าพลาด ${report.repeatedMiss.count} ครั้งจากรายการที่ทบทวน ให้นำข้อนี้ไปเช็กก่อนเข้าเทรด`)
                : report.weakest
                  ? t(`${report.weakest.averageR.toFixed(2)}R average. Open the source trades before changing the Playbook.`, `เฉลี่ย ${report.weakest.averageR.toFixed(2)}R ควรเปิดดูรายการต้นทางก่อนเปลี่ยน Playbook`)
                  : t('Keep reviewing trades. One result is not enough to label a weakness.', 'ทบทวนต่อไป ผลเพียงครั้งเดียวยังไม่พอจะเรียกว่าเป็นจุดอ่อน')}</p>
            </article>
            <article className="panel monthly-insight focus">
              <Focus size={21} />
              <span className="overline">{t('NEXT MONTH FOCUS', 'โฟกัสเดือนถัดไป')}</span>
              <h3>{focus}</h3>
              <p>{t('One clear action chosen from the quality and coverage of your own journal.', 'หนึ่งการลงมือทำที่เลือกจากคุณภาพและความครบถ้วนของบันทึกคุณเอง')}</p>
            </article>
          </div>

          <section className="panel monthly-process">
            <div className="monthly-process-heading">
              <div><span className="overline">{t('PROCESS HEALTH', 'สุขภาพกระบวนการ')}</span><h3>{t('Can this month explain itself?', 'ข้อมูลเดือนนี้อธิบายผลลัพธ์ได้แค่ไหน')}</h3></div>
              <Target size={24} />
            </div>
            <div className="monthly-process-grid">
              <div><span><b>{report.reviewed}/{report.count}</b>{t('Reviewed', 'ทบทวนแล้ว')}</span><i><em style={{ width: `${report.reviewCoverage}%` }} /></i></div>
              <div><span><b>{report.riskRecorded}/{report.count}</b>{t('Risk recorded', 'บันทึกความเสี่ยง')}</span><i><em style={{ width: `${report.riskCoverage}%` }} /></i></div>
              <div><span><b>{report.adherenceRate === null ? '—' : `${Math.round(report.adherenceRate)}%`}</b>{t('Followed plan', 'ทำตามแผน')}</span><i><em style={{ width: `${report.adherenceRate ?? 0}%` }} /></i></div>
            </div>
            <div className="monthly-discipline">
              <span><small>{t('Followed plan', 'ตามแผน')} · {report.followed}</small><b>{report.followedAverageR === null ? '—' : `${report.followedAverageR.toFixed(2)}R`}</b></span>
              <span><small>{t('Outside plan', 'นอกแผน')} · {report.outside}</small><b>{report.outsideAverageR === null ? '—' : `${report.outsideAverageR.toFixed(2)}R`}</b></span>
              <p>{t('These averages appear only from trades with recorded planned risk.', 'ค่าเฉลี่ยคำนวณเฉพาะรายการที่บันทึกความเสี่ยงตามแผน')}</p>
            </div>
          </section>

          <section className="panel monthly-source">
            <div><span className="overline">{t('SOURCE TRADES', 'รายการต้นทาง')}</span><h3>{t('Open the evidence behind the report', 'เปิดดูข้อมูลเบื้องหลังรายงาน')}</h3><p>{t('Every conclusion links back to the trades recorded this month.', 'ทุกข้อสรุปย้อนกลับไปตรวจรายการที่บันทึกในเดือนนี้ได้')}</p></div>
            <TradeTable trades={[...report.rows].reverse()} t={t} onView={onView} />
          </section>
        </>
      )}
    </section>
    <Dialog open={Boolean(imageUrl)} onOpenChange={(open) => !open && setImageUrl('')}>
      <DialogContent className="monthly-image-dialog">
        <DialogTitle>{t('Your monthly report image', 'ภาพสรุปรายเดือนของคุณ')}</DialogTitle>
        <DialogDescription>
          {t(
            'Download the PNG, or press and hold the image on iPhone to save or share it.',
            'ดาวน์โหลด PNG หรือกดค้างที่ภาพบน iPhone เพื่อบันทึกหรือแชร์',
          )}
        </DialogDescription>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={t(`Tradovia monthly report for ${title}`, `รายงาน Tradovia เดือน${title}`)}
            width={1200}
            height={1500}
            unoptimized
          />
        )}
        <a
          className="button monthly-image-download"
          href={imageUrl}
          download={`tradovia-monthly-report-${selected}.png`}
        >
          <Download size={17} /> {t('Download PNG', 'ดาวน์โหลด PNG')}
        </a>
      </DialogContent>
    </Dialog>
    </>
  );
}
