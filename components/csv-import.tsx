'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  MonitorUp,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';
import {
  csvTemplate,
  previewCsv,
  tradeFingerprint,
  type CsvRow,
} from '@/lib/trade-csv';
import {
  brokerFieldOrder,
  brokerMappingReady,
  parseBrokerCsv,
  prepareBrokerSheet,
  previewBrokerRows,
  type BrokerField,
  type BrokerMapping,
  type BrokerSheet,
} from '@/lib/broker-import';
import { money, net, type Account, type Trade } from '@/lib/domain';
import { summarizeImport, type ImportInsight } from '@/lib/import-insight';
import {
  inspectMt5Html,
  inspectMt5Xlsx,
  parseXlsxRows,
} from '@/lib/mt5-report';
import type { Translate } from './workspace-ui';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

type ImportSource = 'mt5' | 'broker' | 'csv' | 'paste';

function brokerMappingKey(headers: string[]) {
  let hash = 2166136261;
  for (const character of headers.join('|').toLowerCase()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `tradovia:broker-map:${(hash >>> 0).toString(36)}`;
}

function savedBrokerMapping(sheet: BrokerSheet) {
  try {
    const saved = JSON.parse(
      localStorage.getItem(brokerMappingKey(sheet.headers)) || '{}',
    ) as BrokerMapping;
    const valid = Object.fromEntries(
      Object.entries(saved).filter(
        ([, value]) =>
          Number.isInteger(value) && Number(value) < sheet.headers.length,
      ),
    ) as BrokerMapping;
    return Object.keys(valid).length ? valid : sheet.mapping;
  } catch {
    return sheet.mapping;
  }
}

export default function CsvImport({
  accounts,
  trades,
  t,
  save,
  open,
  onOpenChange,
  onOpenEdge,
  onReviewImported,
}: {
  accounts: Account[];
  trades: Trade[];
  t: Translate;
  save: (trades: Trade[]) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEdge?: () => void;
  onReviewImported?: () => void;
}) {
  const [account, setAccount] = useState(accounts[0]?.id || '');
  const [source, setSource] = useState<ImportSource>('mt5');
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState('');
  const [paste, setPaste] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [importInsight, setImportInsight] = useState<ImportInsight | null>(
    null,
  );
  const [reportSource, setReportSource] = useState('');
  const [dragging, setDragging] = useState(false);
  const [brokerSheet, setBrokerSheet] = useState<BrokerSheet | null>(null);
  const [brokerMapping, setBrokerMapping] = useState<BrokerMapping>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const accountId = accounts.some((item) => item.id === account)
    ? account
    : accounts[0]?.id || '';
  const checked = useMemo(() => {
    const seen = new Set(trades.map(tradeFingerprint));
    return rows.map((row) => {
      const trade = row.trade ? { ...row.trade, accountId } : undefined;
      const key = trade ? tradeFingerprint(trade) : '';
      const duplicate = !!trade && seen.has(key);
      if (trade && !excluded.has(row.row)) seen.add(key);
      return { ...row, trade, duplicate };
    });
  }, [rows, trades, accountId, excluded]);
  const selected = checked.filter(
    (row) =>
      row.trade && !row.error && !row.duplicate && !excluded.has(row.row),
  );
  const invalidCount = checked.filter((row) => row.error).length;
  const duplicateCount = checked.filter((row) => row.duplicate).length;
  const step = importedCount ? 3 : rows.length ? 2 : 1;

  const resetPreview = () => {
    setRows([]);
    setError('');
    setMessage('');
    setExcluded(new Set());
    setImportedCount(0);
    setImportInsight(null);
    setFilename('');
    setReportSource('');
    setDragging(false);
    setBrokerSheet(null);
    setBrokerMapping({});
  };
  const chooseSource = (next: ImportSource) => {
    setSource(next);
    resetPreview();
  };
  const preview = (text: string, name: string) => {
    resetPreview();
    setFilename(name);
    try {
      setRows(previewCsv(text, accountId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read CSV');
    }
  };
  const readFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      resetPreview();
      setError(t('Maximum file size is 5 MB.', 'ไฟล์ต้องมีขนาดไม่เกิน 5 MB'));
      return;
    }
    setBusy(true);
    resetPreview();
    setFilename(file.name);
    try {
      const extension = file.name.toLowerCase().split('.').pop();
      if (source === 'broker') {
        if (extension !== 'xlsx' && extension !== 'csv')
          throw Error(t('Use .xlsx or .csv', 'ใช้ไฟล์ .xlsx หรือ .csv'));
        const table =
          extension === 'xlsx'
            ? parseXlsxRows(await file.arrayBuffer())
            : parseBrokerCsv(await file.text());
        const sheet = prepareBrokerSheet(table);
        setBrokerSheet(sheet);
        setBrokerMapping(savedBrokerMapping(sheet));
        setReportSource(t('Universal broker file', 'ไฟล์จากโบรกเกอร์ทั่วไป'));
      } else if (extension === 'xlsx') {
        const result = inspectMt5Xlsx(await file.arrayBuffer(), accountId);
        setRows(result.rows);
        setReportSource(result.source);
      } else if (extension === 'html' || extension === 'htm') {
        const result = inspectMt5Html(await file.text(), accountId);
        setRows(result.rows);
        setReportSource(result.source);
      } else if (extension === 'csv') {
        setRows(previewCsv(await file.text(), accountId));
        setReportSource('Tradovia CSV');
      } else {
        throw Error(
          t('Use .xlsx, .html or .csv', 'ใช้ไฟล์ .xlsx, .html หรือ .csv'),
        );
      }
    } catch (cause) {
      setRows([]);
      setError(
        cause instanceof Error
          ? cause.message
          : t('Unable to read file', 'อ่านไฟล์ไม่ได้'),
      );
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + csvTemplate], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tradovia-import-template.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const submit = async () => {
    if (lock.current || !accountId || !selected.length) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const importedTrades = selected.map((row) => row.trade!);
      const count = importedTrades.length;
      const insight = summarizeImport(importedTrades, [
        ...trades,
        ...importedTrades,
      ]);
      if (!(await save(importedTrades))) {
        throw Error(
          t(
            'Import failed. No rows were added.',
            'นำเข้าไม่สำเร็จ ยังไม่มีรายการถูกเพิ่ม',
          ),
        );
      }
      setExcluded(new Set(selected.map((row) => row.row)));
      setImportedCount(count);
      setImportInsight(insight);
      setMessage(
        t(
          `${count} trades are now ready for review and Edge analysis.`,
          `${count} รายการพร้อมสำหรับการทบทวนและวิเคราะห์ Edge แล้ว`,
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Import failed');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const fieldLabels: Record<BrokerField, string> = {
    symbol: t('Symbol', 'สินทรัพย์'),
    side: t('Buy / Sell', 'Buy / Sell'),
    openedAt: t('Open date & time (combined)', 'วันและเวลาเปิด (ช่องเดียว)'),
    date: t('Open date (separate)', 'วันที่เปิด (แยกช่อง)'),
    time: t('Open time (optional)', 'เวลาเปิด (ไม่บังคับ)'),
    entry: t('Entry price', 'ราคาเข้า'),
    lot: t('Lot / volume', 'Lot / ขนาด'),
    profit: t('Profit / P&L', 'กำไร / P&L'),
    commission: t('Commission (optional)', 'ค่าคอมมิชชัน (ไม่บังคับ)'),
    swap: t('Swap (optional)', 'Swap (ไม่บังคับ)'),
    ticket: t('Ticket / order ID (optional)', 'Ticket / Order ID (ไม่บังคับ)'),
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) {
          onOpenChange(next);
          if (!next) resetPreview();
        }
      }}
    >
      <DialogTrigger className="button ghost compact">
        <Upload size={16} />
        {t('Import Center', 'ศูนย์นำเข้าข้อมูล')}
      </DialogTrigger>
      <DialogContent className="trade-dialog csv-import import-center">
        <header className="import-center-heading">
          <span className="overline">TRADOVIA · IMPORT CENTER</span>
          <DialogTitle>
            {t('Bring your trading history in', 'นำประวัติการเทรดเข้ามา')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Upload, check, and confirm. Your existing journal is never overwritten.',
              'อัปโหลด ตรวจสอบ แล้วค่อยยืนยัน ข้อมูลเดิมในบันทึกจะไม่ถูกเขียนทับ',
            )}
          </DialogDescription>
          <ol
            className="import-progress"
            aria-label={t('Import progress', 'ขั้นตอนนำเข้า')}
          >
            {[
              t('Choose', 'เลือกไฟล์'),
              t('Check', 'ตรวจข้อมูล'),
              t('Done', 'สำเร็จ'),
            ].map((label, index) => (
              <li key={label} className={step >= index + 1 ? 'active' : ''}>
                <span>
                  {step > index + 1 ? <Check size={13} /> : index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </header>

        {importedCount > 0 ? (
          <section className="import-success" aria-live="polite">
            <span className="import-success-icon">
              <CheckCircle2 size={30} />
            </span>
            <span className="overline">
              {t('IMPORT COMPLETE', 'นำเข้าสำเร็จ')}
            </span>
            <h3>
              {t(
                `${importedCount} trades added`,
                `เพิ่มแล้ว ${importedCount} รายการ`,
              )}
            </h3>
            <p>{message}</p>
            {importInsight && (
              <div className="import-insight">
                <header>
                  <span>
                    <Sparkles size={17} />
                    {t('YOUR FIRST SIGNAL', 'สัญญาณแรกจากข้อมูลของคุณ')}
                  </span>
                  {importInsight.firstDate && (
                    <small>
                      {importInsight.firstDate}
                      {importInsight.lastDate !== importInsight.firstDate
                        ? ` → ${importInsight.lastDate}`
                        : ''}
                    </small>
                  )}
                </header>
                <div className="import-insight-stats">
                  <article>
                    <span>{t('Net result', 'ผลลัพธ์สุทธิ')}</span>
                    <strong
                      className={
                        importInsight.pnl > 0
                          ? 'positive'
                          : importInsight.pnl < 0
                            ? 'negative'
                            : ''
                      }
                    >
                      {money(importInsight.pnl)}
                    </strong>
                  </article>
                  <article>
                    <span>{t('Win rate', 'อัตราชนะ')}</span>
                    <strong>{importInsight.winRate}%</strong>
                    <small>
                      {importInsight.wins}W · {importInsight.losses}L
                    </small>
                  </article>
                  <article>
                    <span>{t('Risk recorded', 'มีข้อมูลความเสี่ยง')}</span>
                    <strong>{importInsight.riskCoverage}%</strong>
                    <small>
                      {importInsight.closed} {t('closed', 'ไม้ที่ปิดแล้ว')}
                    </small>
                  </article>
                </div>
                <div className="import-insight-signal">
                  <span className="import-insight-symbol">
                    {importInsight.edge.strongest ? (
                      <TrendingUp size={20} />
                    ) : (
                      <Target size={20} />
                    )}
                  </span>
                  <div>
                    <small>
                      {importInsight.edge.strongest
                        ? t('EVIDENCE-BACKED PATTERN', 'รูปแบบที่มีข้อมูลรองรับ')
                        : t('STARTING SIGNAL', 'สัญญาณเริ่มต้น')}
                    </small>
                    <strong>
                      {importInsight.edge.strongest
                        ? t(
                            `${importInsight.edge.strongest.key} is currently your strongest comparable pattern`,
                            `${importInsight.edge.strongest.key} คือรูปแบบที่แข็งแรงที่สุดจากข้อมูลที่เปรียบเทียบได้ตอนนี้`,
                          )
                        : importInsight.leadingSymbol
                          ? t(
                              `${importInsight.leadingSymbol.symbol} appears most often in this import`,
                              `${importInsight.leadingSymbol.symbol} เป็นสินทรัพย์ที่พบมากที่สุดในชุดข้อมูลนี้`,
                            )
                          : t(
                              'Your history is ready for review',
                              'ประวัติของคุณพร้อมสำหรับการทบทวนแล้ว',
                            )}
                    </strong>
                    <p>
                      {importInsight.edge.strongest
                        ? t(
                            `${importInsight.edge.strongest.riskTrades} comparable trades · ${importInsight.edge.strongest.averageR.toFixed(2)}R average. Open the source trades before changing your plan.`,
                            `${importInsight.edge.strongest.riskTrades} รายการที่เปรียบเทียบได้ · เฉลี่ย ${importInsight.edge.strongest.averageR.toFixed(2)}R ควรเปิดดูไม้ต้นทางก่อนเปลี่ยนแผน`,
                          )
                        : importInsight.leadingSymbol
                          ? t(
                              `${importInsight.leadingSymbol.trades} trades · ${money(importInsight.leadingSymbol.pnl)} net. This is a starting point, not yet a conclusion.`,
                              `${importInsight.leadingSymbol.trades} รายการ · สุทธิ ${money(importInsight.leadingSymbol.pnl)} นี่เป็นจุดเริ่มต้น ยังไม่ใช่ข้อสรุป`,
                            )
                          : t(
                              'Add a few comparable closed trades before Tradovia names a pattern.',
                              'เพิ่มรายการปิดที่เปรียบเทียบกันได้อีกเล็กน้อย ก่อนที่ Tradovia จะระบุรูปแบบ',
                            )}
                    </p>
                  </div>
                </div>
                <div className="import-insight-next">
                  <CheckCircle2 size={18} />
                  <p>
                    <b>{t('Best next action', 'สิ่งที่ควรทำต่อ')}</b>
                    <span>
                      {importInsight.reviewNeeded > 0
                        ? t(
                            `Review ${importInsight.reviewNeeded} imported trades so Tradovia can separate luck from decision quality.`,
                            `ทบทวน ${importInsight.reviewNeeded} รายการที่นำเข้า เพื่อให้ Tradovia แยกโชคออกจากคุณภาพการตัดสินใจได้`,
                          )
                        : importInsight.riskCoverage < 80
                          ? t(
                              'Add planned risk to the next trades so results can be compared in R.',
                              'เพิ่มความเสี่ยงตามแผนในไม้ถัดไป เพื่อให้เปรียบเทียบผลลัพธ์เป็นค่า R ได้',
                            )
                          : t(
                              'Open Edge Map and verify the pattern against its source trades.',
                              'เปิด Edge Map แล้วตรวจรูปแบบกับรายการเทรดต้นทาง',
                            )}
                    </span>
                  </p>
                </div>
              </div>
            )}
            <div className="import-success-actions">
              {onReviewImported && (
                <button
                  className="button"
                  onClick={() => {
                    onOpenChange(false);
                    onReviewImported();
                  }}
                >
                  <CheckCircle2 size={17} />{' '}
                  {t('Review imported trades', 'ตรวจทบทวนรายการที่นำเข้า')}
                </button>
              )}
              {onOpenEdge && (
                <button
                  className="button ghost"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenEdge();
                  }}
                >
                  <BarChart3 size={17} />{' '}
                  {t('See my Edge Map', 'ดู Edge Map ของฉัน')}
                </button>
              )}
              <button className="button ghost" onClick={resetPreview}>
                {t('Import another file', 'นำเข้าไฟล์อื่น')}
              </button>
            </div>
          </section>
        ) : (
          <div className="import-center-body">
            {!rows.length && !brokerSheet && (
              <>
                <section className="import-source-section">
                  <div className="import-section-heading">
                    <div>
                      <span className="overline">
                        01 · {t('SOURCE', 'แหล่งข้อมูล')}
                      </span>
                      <h3>{t('What are you importing?', 'คุณกำลังนำเข้าอะไร')}</h3>
                    </div>
                    <span className="import-private">
                      <ShieldCheck size={15} />{' '}
                      {t('No broker password', 'ไม่ใช้รหัสโบรกเกอร์')}
                    </span>
                  </div>
                  <div className="import-source-grid">
                    <button
                      type="button"
                      className={source === 'mt5' ? 'active' : ''}
                      onClick={() => chooseSource('mt5')}
                    >
                      <MonitorUp size={22} />
                      <b>{t('MT5 / Exness report', 'รายงาน MT5 / Exness')}</b>
                      <small>
                        {t(
                          'HTML or XLSX · no broker password',
                          'HTML หรือ XLSX · ไม่ใช้รหัสโบรกเกอร์',
                        )}
                      </small>
                      <CheckCircle2 size={17} className="import-source-check" />
                    </button>
                    <button
                      type="button"
                      className={source === 'broker' ? 'active' : ''}
                      onClick={() => chooseSource('broker')}
                    >
                      <FileSpreadsheet size={22} />
                      <b>{t('Any broker file', 'ไฟล์จากโบรกเกอร์ทั่วไป')}</b>
                      <small>
                        {t(
                          'CSV or XLSX · map columns once',
                          'CSV หรือ XLSX · จับคู่คอลัมน์ครั้งเดียว',
                        )}
                      </small>
                      <CheckCircle2 size={17} className="import-source-check" />
                    </button>
                    <button
                      type="button"
                      className={source === 'csv' ? 'active' : ''}
                      onClick={() => chooseSource('csv')}
                    >
                      <FileSpreadsheet size={22} />
                      <b>{t('Tradovia CSV', 'CSV ของ Tradovia')}</b>
                      <small>
                        {t(
                          'Use our ready-to-fill template',
                          'ใช้แม่แบบพร้อมกรอกของเรา',
                        )}
                      </small>
                      <CheckCircle2 size={17} className="import-source-check" />
                    </button>
                    <button
                      type="button"
                      className={source === 'paste' ? 'active' : ''}
                      onClick={() => chooseSource('paste')}
                    >
                      <FileUp size={22} />
                      <b>{t('Paste CSV data', 'วางข้อมูล CSV')}</b>
                      <small>
                        {t(
                          'For an existing Tradovia-format file',
                          'สำหรับข้อมูลรูปแบบ Tradovia',
                        )}
                      </small>
                      <CheckCircle2 size={17} className="import-source-check" />
                    </button>
                  </div>
                </section>

                <section className="import-upload-section">
                  <div className="import-section-heading">
                    <div>
                      <span className="overline">
                        02 · {t('DESTINATION', 'ปลายทาง')}
                      </span>
                      <h3>{t('Choose the journal account', 'เลือกบัญชีบันทึก')}</h3>
                    </div>
                  </div>
                  <label className="form-field import-account-field">
                    <span>{t('Destination account', 'บัญชีปลายทาง')}</span>
                    <select
                      value={accountId}
                      onChange={(event) => setAccount(event.target.value)}
                    >
                      {!accounts.length && (
                        <option value="">
                          {t(
                            'Create a portfolio account first',
                            'สร้างบัญชีในหน้าพอร์ตก่อน',
                          )}
                        </option>
                      )}
                      {accounts.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {source === 'mt5' && (
                    <div className="import-howto">
                      <div>
                        <span>1</span>
                        <p>
                          <b>
                            {t('Export from MT5 desktop', 'ส่งออกจาก MT5 บนคอม')}
                          </b>
                          <small>
                            {t(
                              'Account History → Report → Open XML / HTML (including Exness MT5)',
                              'Account History → Report → Open XML / HTML (รวม Exness MT5)',
                            )}
                          </small>
                        </p>
                      </div>
                      <div>
                        <span>2</span>
                        <p>
                          <b>{t('Upload the saved file', 'อัปโหลดไฟล์ที่บันทึก')}</b>
                          <small>
                            {t(
                              'Tradovia reads closed positions, commission, and swap.',
                              'Tradovia อ่านรายการปิด ค่าคอมมิชชัน และ Swap',
                            )}
                          </small>
                        </p>
                      </div>
                    </div>
                  )}

                  {source === 'broker' && (
                    <div className="import-template-card">
                      <div>
                        <FileSpreadsheet size={20} />
                        <p>
                          <b>
                            {t(
                              'Use your broker export',
                              'ใช้ไฟล์ที่ส่งออกจากโบรกเกอร์',
                            )}
                          </b>
                          <small>
                            {t(
                              'Tradovia detects the header and lets you confirm every column before import.',
                              'Tradovia จะค้นหาหัวตารางและให้คุณยืนยันทุกคอลัมน์ก่อนนำเข้า',
                            )}
                          </small>
                        </p>
                      </div>
                    </div>
                  )}

                  {source === 'csv' && (
                    <div className="import-template-card">
                      <div>
                        <FileSpreadsheet size={20} />
                        <p>
                          <b>
                            {t(
                              'Start with the correct columns',
                              'เริ่มด้วยคอลัมน์ที่ถูกต้อง',
                            )}
                          </b>
                          <small>
                            {t(
                              'Fill the template, save as CSV, then upload it here.',
                              'กรอกแม่แบบ บันทึกเป็น CSV แล้วอัปโหลดที่นี่',
                            )}
                          </small>
                        </p>
                      </div>
                      <button
                        type="button"
                        className="button ghost compact"
                        onClick={download}
                      >
                        <Download size={15} />{' '}
                        {t('Get template', 'ดาวน์โหลดแม่แบบ')}
                      </button>
                    </div>
                  )}

                  {source === 'paste' ? (
                    <div className="import-paste">
                      <label className="form-field">
                        <span>
                          {t(
                            'Paste CSV rows including the header',
                            'วางข้อมูล CSV พร้อมชื่อคอลัมน์',
                          )}
                        </span>
                        <textarea
                          rows={7}
                          value={paste}
                          maxLength={2 * 1024 * 1024}
                          placeholder="symbol,side,status,date,time,entry,lot,gross,fees..."
                          onChange={(event) => setPaste(event.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="button import-main-action"
                        disabled={!accountId || !paste.trim()}
                        onClick={() =>
                          preview(paste, t('Pasted CSV', 'CSV ที่วาง'))
                        }
                      >
                        {t('Check these rows', 'ตรวจข้อมูลนี้')}{' '}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fileInput}
                        className="import-file-input"
                        type="file"
                        accept={
                          source === 'mt5'
                            ? '.xlsx,.html,.htm,text/html,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            : source === 'broker'
                              ? '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                              : '.csv,text/csv'
                        }
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (file) await readFile(file);
                        }}
                      />
                      <button
                        type="button"
                        className={`import-dropzone${dragging ? ' dragging' : ''}`}
                        disabled={busy || !accountId}
                        onClick={() => fileInput.current?.click()}
                        onDragEnter={(event) => {
                          event.preventDefault();
                          if (!busy && accountId) setDragging(true);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragging(false);
                          const file = event.dataTransfer.files?.[0];
                          if (file && !busy && accountId) void readFile(file);
                        }}
                      >
                        <span>
                          <FileUp size={25} />
                        </span>
                        <b>
                          {busy
                            ? t('Reading file…', 'กำลังอ่านไฟล์…')
                            : dragging
                              ? t('Drop the file here', 'วางไฟล์ตรงนี้ได้เลย')
                              : t(
                                  'Choose or drop a file',
                                  'เลือกหรือลากไฟล์มาวาง',
                                )}
                        </b>
                        <small>
                          {source === 'mt5'
                            ? 'XLSX · HTML · 5 MB max'
                            : source === 'broker'
                              ? 'XLSX · CSV · 5 MB max'
                              : 'CSV · 2 MB max'}
                        </small>
                      </button>
                    </>
                  )}
                  <p className="import-privacy-note">
                    <ShieldCheck size={15} />
                    {t(
                      'Only confirmed trades are added. Duplicates are skipped automatically.',
                      'เพิ่มเฉพาะรายการที่ยืนยัน และข้ามรายการซ้ำให้อัตโนมัติ',
                    )}
                  </p>
                </section>
              </>
            )}

            {brokerSheet && !rows.length && (
              <section className="import-mapping-section">
                <button
                  type="button"
                  className="import-back"
                  onClick={resetPreview}
                >
                  <ArrowLeft size={16} />{' '}
                  {t('Choose another file', 'เลือกไฟล์ใหม่')}
                </button>
                <div className="import-section-heading">
                  <div>
                    <span className="overline">
                      02 · {t('MAP COLUMNS', 'จับคู่คอลัมน์')}
                    </span>
                    <h3>
                      {t(
                        'Confirm what each column means',
                        'ยืนยันความหมายของแต่ละคอลัมน์',
                      )}
                    </h3>
                    <p className="import-mapping-intro">
                      {t(
                        `Found ${brokerSheet.rows.length} rows in ${filename}. We filled what we recognized.`,
                        `พบ ${brokerSheet.rows.length} แถวใน ${filename} ระบบจับคู่สิ่งที่รู้จักไว้ให้แล้ว`,
                      )}
                    </p>
                  </div>
                </div>
                <div className="import-mapping-grid">
                  {brokerFieldOrder.map((field) => (
                    <label className="form-field" key={field}>
                      <span>{fieldLabels[field]}</span>
                      <select
                        value={brokerMapping[field] ?? ''}
                        onChange={(event) =>
                          setBrokerMapping((previous) => ({
                            ...previous,
                            [field]:
                              event.target.value === ''
                                ? undefined
                                : Number(event.target.value),
                          }))
                        }
                      >
                        <option value="">{t('Not mapped', 'ไม่จับคู่')}</option>
                        {brokerSheet.headers.map((header, index) => (
                          <option key={`${header}-${index}`} value={index}>
                            {header} · {t('column', 'คอลัมน์')} {index + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="import-mapping-footer">
                  <p className="import-review-note">
                    <ShieldCheck size={15} />
                    {t(
                      'Required: symbol, buy/sell, open date, entry, lot, and P&L. This mapping is remembered on this device.',
                      'ต้องมีสินทรัพย์ Buy/Sell วันที่เปิด ราคาเข้า Lot และ P&L ระบบจะจำการจับคู่นี้ไว้บนอุปกรณ์นี้',
                    )}
                  </p>
                  <button
                    type="button"
                    className="button"
                    disabled={!brokerMappingReady(brokerMapping)}
                    onClick={() => {
                      try {
                        localStorage.setItem(
                          brokerMappingKey(brokerSheet.headers),
                          JSON.stringify(brokerMapping),
                        );
                        setRows(
                          previewBrokerRows(
                            brokerSheet,
                            brokerMapping,
                            accountId,
                          ),
                        );
                        setError('');
                      } catch (cause) {
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : t('Unable to map file', 'จับคู่ไฟล์ไม่สำเร็จ'),
                        );
                      }
                    }}
                  >
                    {t('Preview imported trades', 'ดูตัวอย่างรายการ')}{' '}
                    <ArrowRight size={17} />
                  </button>
                </div>
              </section>
            )}

            {error && (
              <p role="alert" className="notice negative import-alert">
                <AlertTriangle size={18} /> {error}
              </p>
            )}

            {!!rows.length && (
              <section className="import-review-section">
                <button
                  type="button"
                  className="import-back"
                  onClick={resetPreview}
                >
                  <ArrowLeft size={16} />{' '}
                  {t('Choose another file', 'เลือกไฟล์ใหม่')}
                </button>
                <div className="import-section-heading">
                  <div>
                    <span className="overline">
                      02 · {t('CHECK BEFORE IMPORT', 'ตรวจก่อนนำเข้า')}
                    </span>
                    <h3>{filename}</h3>
                    {reportSource && (
                      <span className="import-detected-source">
                        <CheckCircle2 size={13} /> {t('Detected', 'ตรวจพบ')}:{' '}
                        {reportSource}
                      </span>
                    )}
                  </div>
                </div>
                <div className="import-stat-grid">
                  <div className="ready">
                    <span>{t('Ready', 'พร้อมนำเข้า')}</span>
                    <b>{selected.length}</b>
                  </div>
                  <div>
                    <span>{t('Duplicates skipped', 'รายการซ้ำที่ข้าม')}</span>
                    <b>{duplicateCount}</b>
                  </div>
                  <div className={invalidCount ? 'warning' : ''}>
                    <span>{t('Needs attention', 'ต้องตรวจสอบ')}</span>
                    <b>{invalidCount}</b>
                  </div>
                  <div>
                    <span>{t('Selected net P&L', 'กำไรสุทธิที่เลือก')}</span>
                    <b>
                      {money(
                        selected.reduce(
                          (sum, row) =>
                            sum +
                            (row.trade!.status === 'CLOSED'
                              ? net(row.trade!)
                              : 0),
                          0,
                        ),
                      )}
                    </b>
                  </div>
                </div>
                <p className="import-review-note">
                  <ShieldCheck size={15} />
                  {t(
                    `${selected.length} selected trades will enter your Review Inbox after import. Duplicates are skipped and nothing is overwritten.`,
                    `${selected.length} รายการที่เลือกจะเข้า “รอตรวจทบทวน” หลังนำเข้า ระบบจะข้ามรายการซ้ำและไม่เขียนทับข้อมูลเดิม`,
                  )}
                </p>
                <div className="csv-preview-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('Add', 'เพิ่ม')}</th>
                        <th>{t('Trade', 'รายการ')}</th>
                        <th>Lot</th>
                        <th>{t('Net', 'สุทธิ')}</th>
                        <th>{t('Status', 'สถานะ')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checked.map((row) => (
                        <tr
                          key={row.row}
                          className={row.error || row.duplicate ? 'muted' : ''}
                        >
                          <td>
                            <input
                              type="checkbox"
                              aria-label={t(
                                `Import row ${row.row}`,
                                `นำเข้าแถว ${row.row}`,
                              )}
                              disabled={busy || !!row.error || row.duplicate}
                              checked={
                                !!row.trade &&
                                !row.duplicate &&
                                !excluded.has(row.row)
                              }
                              onChange={(event) =>
                                setExcluded((previous) => {
                                  const next = new Set(previous);
                                  if (event.target.checked)
                                    next.delete(row.row);
                                  else next.add(row.row);
                                  return next;
                                })
                              }
                            />
                          </td>
                          <td>
                            {row.trade ? (
                              <details>
                                <summary>
                                  <b>{row.trade.symbol}</b> · {row.trade.side} ·{' '}
                                  {row.trade.date}
                                </summary>
                                <p>
                                  {row.trade.time} · Entry {row.trade.entry} ·
                                  Gross {money(row.trade.gross)} · Fees{' '}
                                  {money(row.trade.fees)}
                                  {row.trade.importRef && (
                                    <>
                                      <br />
                                      {row.trade.importRef.format === 'MT5'
                                        ? 'MT5'
                                        : t(
                                            'Broker reference',
                                            'รหัสอ้างอิงโบรกเกอร์',
                                          )}{' '}
                                      #{row.trade.importRef.positionId} · Close{' '}
                                      {row.trade.importRef.closeDate}{' '}
                                      {row.trade.importRef.closeTime}
                                    </>
                                  )}
                                </p>
                              </details>
                            ) : (
                              `#${row.row}`
                            )}
                          </td>
                          <td>{row.trade?.lot ?? '—'}</td>
                          <td>{row.trade ? money(net(row.trade)) : '—'}</td>
                          <td>
                            <span
                              className={`import-row-status ${row.error ? 'error' : row.duplicate ? 'duplicate' : 'ready'}`}
                            >
                              {row.error ||
                                (row.duplicate
                                  ? t('Duplicate', 'ซ้ำ')
                                  : t('Ready', 'พร้อม'))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <footer className="import-confirm-bar">
                  <span>
                    <b>{selected.length}</b>{' '}
                    {t('trades selected', 'รายการที่เลือก')}
                  </span>
                  <button
                    type="button"
                    className="button"
                    disabled={busy || !accountId || !selected.length}
                    onClick={() => void submit()}
                  >
                    {busy
                      ? t('Importing…', 'กำลังนำเข้า…')
                      : t(
                          `Import ${selected.length} trades`,
                          `นำเข้า ${selected.length} รายการ`,
                        )}{' '}
                    {!busy && <ArrowRight size={17} />}
                  </button>
                </footer>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
