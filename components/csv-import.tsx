'use client';
import { useMemo, useRef, useState } from 'react';
import {
  csvTemplate,
  previewCsv,
  tradeFingerprint,
  type CsvRow,
} from '@/lib/trade-csv';
import { money, net, type Account, type Trade } from '@/lib/domain';
import { previewMt5Html, previewMt5Xlsx } from '@/lib/mt5-report';
import type { Translate } from './workspace-ui';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

export default function CsvImport({
  accounts,
  trades,
  t,
  save,
  open,
  onOpenChange,
}: {
  accounts: Account[];
  trades: Trade[];
  t: Translate;
  save: (trades: Trade[]) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [account, setAccount] = useState(accounts[0]?.id || '');
  const [rows, setRows] = useState<CsvRow[]>([]),
    [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false),
    [filename, setFilename] = useState('');
  const [paste, setPaste] = useState('');
  const lock = useRef(false);
  const accountId = accounts.some((a) => a.id === account)
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
    (r) => r.trade && !r.duplicate && !excluded.has(r.row),
  );
  const reset = () => {
    setRows([]);
    setError('');
    setMessage('');
    setExcluded(new Set());
  };
  const preview = (text: string, name: string) => {
    reset();
    setFilename(name);
    try {
      setRows(previewCsv(text, accountId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to read CSV');
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + csvTemplate], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tradovia-import-template.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const submit = async () => {
    if (lock.current || !accountId || !selected.length) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const count = selected.length;
      if (!(await save(selected.map((row) => row.trade!))))
        throw Error(
          t(
            'Import failed. No rows were added.',
            'นำเข้าไม่สำเร็จ ยังไม่มีรายการถูกเพิ่ม',
          ),
        );
      setExcluded(new Set(selected.map((row) => row.row)));
      setMessage(
        t(
          `Imported ${count} trades. Review their Playbooks in Quick review below.`,
          `นำเข้าแล้ว ${count} รายการ เลือก Playbook ต่อได้ในส่วนทบทวนด้านล่าง`,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogTrigger className="button ghost compact">
        <Upload size={16} />
        {t('Import trades', 'นำเข้ารายการ')}
      </DialogTrigger>
      <DialogContent className="trade-dialog csv-import">
        <DialogTitle>{t('Import trades', 'นำเข้าการเทรด')}</DialogTitle>
        <DialogDescription>
          {t(
            'Choose an account, preview your MT5 report or Tradovia CSV, then confirm the trades.',
            'เลือกบัญชี ตรวจรายงาน MT5 หรือ CSV ของ Tradovia แล้วค่อยยืนยันรายการ',
          )}
        </DialogDescription>
        <div className="mt-6">
          <p className="journal-hint">
            {t(
              'Accepts MT5 account history (.xlsx or .html) and the Tradovia CSV template. MT5 imports closed Positions only, including commission and swap. Up to 500 trades / 5 MB. Times are used as shown in the report.',
              'รองรับประวัติบัญชี MT5 (.xlsx หรือ .html) และแม่แบบ CSV ของ Tradovia โดยนำเข้าเฉพาะ Positions ที่ปิดแล้ว พร้อม Commission และ Swap สูงสุด 500 รายการ / 5 MB และใช้เวลาตามที่แสดงในรายงาน',
            )}
          </p>
          <fieldset
            disabled={busy}
            style={{ border: 0, padding: 0, minWidth: 0 }}
          >
            <div className="form-grid">
              <label className="form-field">
                <span>{t('Destination account', 'บัญชีปลายทาง')}</span>
                <select
                  value={accountId}
                  onChange={(e) => {
                    setAccount(e.target.value);
                    setMessage('');
                  }}
                >
                  {!accounts.length && (
                    <option value="">
                      {t(
                        'Create an account in Portfolio first',
                        'สร้างบัญชีในหน้าพอร์ตก่อน',
                      )}
                    </option>
                  )}
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>{t('MT5 report or CSV', 'รายงาน MT5 หรือ CSV')}</span>
                <input
                  type="file"
                  accept=".xlsx,.html,.htm,.csv,text/csv,text/html,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      reset();
                      setError(t('Maximum 5 MB', 'ขนาดสูงสุด 5 MB'));
                      return;
                    }
                    setBusy(true);
                    try {
                      reset();
                      setFilename(file.name);
                      const extension = file.name
                        .toLowerCase()
                        .split('.')
                        .pop();
                      if (extension === 'xlsx')
                        setRows(
                          previewMt5Xlsx(await file.arrayBuffer(), accountId),
                        );
                      else if (extension === 'html' || extension === 'htm')
                        setRows(previewMt5Html(await file.text(), accountId));
                      else if (extension === 'csv')
                        setRows(previewCsv(await file.text(), accountId));
                      else
                        throw Error(
                          t(
                            'Use .xlsx, .html or .csv',
                            'ใช้ไฟล์ .xlsx, .html หรือ .csv',
                          ),
                        );
                    } catch (error) {
                      reset();
                      setError(
                        error instanceof Error
                          ? error.message
                          : t('Unable to read file', 'อ่านไฟล์ไม่ได้'),
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
            </div>
            <div className="actions mt-6">
              <button className="button ghost compact" onClick={download}>
                {t('Download template', 'ดาวน์โหลดแม่แบบ')}
              </button>
            </div>
            <details className="mt-6">
              <summary>
                {t('Column guide / Paste CSV', 'คำอธิบายคอลัมน์ / วาง CSV')}
              </summary>
              <p className="journal-hint">
                {t(
                  'Required: symbol, side (LONG/SHORT or BUY/SELL), status (OPEN/CLOSED), date (YYYY-MM-DD), time (HH:MM), entry, lot, gross (before fees), fees (positive cost). Optional: risk, sl, tp (blank = 0), setup, notes. Use decimal points, no currency symbols or thousands separators. Blank risk is excluded from R analysis.',
                  'ต้องมี: symbol, side (LONG/SHORT หรือ BUY/SELL), status (OPEN/CLOSED), date (YYYY-MM-DD), time (HH:MM), entry, lot, gross (กำไรก่อนหักค่าธรรมเนียม), fees (ต้นทุนเป็นบวก) เพิ่มได้: risk, sl, tp (ว่าง = 0), setup, notes ใช้จุดทศนิยม ไม่ใส่สกุลเงินหรือจุลภาคคั่นหลักพัน หากไม่ระบุ risk จะไม่นับในการวิเคราะห์ R',
                )}
              </p>
              <label className="form-field">
                <span>{t('Paste CSV', 'วาง CSV')}</span>
                <textarea
                  rows={5}
                  value={paste}
                  maxLength={2 * 1024 * 1024}
                  onChange={(e) => setPaste(e.target.value)}
                />
              </label>
              <button
                className="button ghost compact mt-6"
                disabled={!paste.trim()}
                onClick={() => preview(paste, t('Pasted CSV', 'CSV ที่วาง'))}
              >
                {t('Preview rows', 'ตรวจรายการ')}
              </button>
            </details>
          </fieldset>
          {error && (
            <p role="alert" className="notice negative">
              {error}
            </p>
          )}
          {message && <output className="notice">{message}</output>}
          {!!rows.length && (
            <>
              <p className="journal-hint">
                {filename} · {selected.length} {t('selected', 'รายการที่เลือก')} ·{' '}
                {checked.filter((r) => r.error).length}{' '}
                {t('invalid', 'รายการผิด')} ·{' '}
                {checked.filter((r) => r.duplicate).length}{' '}
                {t('possible duplicates (skipped)', 'รายการที่อาจซ้ำ (ข้าม)')}
              </p>
              <p className="muted-copy">
                {t(
                  'MT5 duplicates match the destination account and Position ID. CSV duplicates match the trade details. Existing trades are never overwritten.',
                  'รายการ MT5 ตรวจซ้ำจากบัญชีปลายทางและ Position ID ส่วน CSV ตรวจจากรายละเอียดการเทรด โดยไม่เขียนทับรายการเดิม',
                )}
              </p>
              <div className="csv-preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Import', 'นำเข้า')}</th>
                      <th>{t('Row / Trade', 'แถว / รายการ')}</th>
                      <th>{t('Size', 'ขนาด')}</th>
                      <th>{t('Net USD', 'สุทธิ USD')}</th>
                      <th>{t('Check', 'ตรวจสอบ')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checked.map((r) => (
                      <tr key={r.row}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={t(
                              `Import row ${r.row}`,
                              `นำเข้าแถว ${r.row}`,
                            )}
                            disabled={busy || !!r.error || r.duplicate}
                            checked={
                              !!r.trade && !r.duplicate && !excluded.has(r.row)
                            }
                            onChange={(e) =>
                              setExcluded((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.delete(r.row);
                                else next.add(r.row);
                                return next;
                              })
                            }
                          />
                        </td>
                        <td>
                          {r.row} ·{' '}
                          {r.trade ? (
                            <details>
                              <summary>
                                {r.trade.symbol} · {r.trade.side} ·{' '}
                                {r.trade.date} {r.trade.time}
                              </summary>
                              <p>
                                {r.trade.status} · Entry {r.trade.entry} · SL{' '}
                                {r.trade.sl} · TP {r.trade.tp}
                                <br />
                                Gross {money(r.trade.gross)} · Fees{' '}
                                {money(r.trade.fees)} · Risk{' '}
                                {money(r.trade.risk)}
                                {r.trade.importRef && (
                                  <>
                                    <br />
                                    MT5 #{r.trade.importRef.positionId} · Close{' '}
                                    {r.trade.importRef.closeDate}{' '}
                                    {r.trade.importRef.closeTime} @{' '}
                                    {r.trade.importRef.closePrice} · Swap{' '}
                                    {money(r.trade.importRef.swap)}
                                  </>
                                )}
                                <br />
                                {r.trade.setup}
                                <br />
                                {r.trade.notes}
                              </p>
                            </details>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{r.trade?.lot ?? '—'}</td>
                        <td>{r.trade ? money(net(r.trade)) : '—'}</td>
                        <td>
                          {r.error ||
                            (r.duplicate
                              ? t('Possible duplicate — skipped', 'อาจซ้ำ — ข้าม')
                              : t('Ready', 'พร้อม'))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="actions mt-6">
                <strong>
                  {t('Selected closed net P&L', 'กำไรสุทธิรายการปิดที่เลือก')}:{' '}
                  {money(
                    selected.reduce(
                      (sum, r) =>
                        sum +
                        (r.trade!.status === 'CLOSED' ? net(r.trade!) : 0),
                      0,
                    ),
                  )}
                </strong>
                <button
                  className="button"
                  disabled={busy || !accountId || !selected.length}
                  onClick={() => void submit()}
                >
                  {busy
                    ? t('Importing…', 'กำลังนำเข้า…')
                    : t(
                        `Confirm import (${selected.length})`,
                        `ยืนยันนำเข้า (${selected.length})`,
                      )}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
