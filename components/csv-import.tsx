'use client';
import { useMemo, useRef, useState } from 'react';
import {
  csvTemplate,
  previewCsv,
  tradeFingerprint,
  type CsvRow,
} from '@/lib/trade-csv';
import { money, net, type Account, type Trade } from '@/lib/domain';
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
}: {
  accounts: Account[];
  trades: Trade[];
  t: Translate;
  save: (trade: Trade) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false),
    [account, setAccount] = useState(accounts[0]?.id || '');
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
    let count = 0;
    try {
      for (const row of selected) {
        if (!(await save(row.trade!)))
          throw Error(
            t(
              'Import stopped. Saved rows remain; retry the remaining rows.',
              'หยุดนำเข้าแล้ว รายการที่บันทึกสำเร็จยังอยู่ ลองนำเข้ารายการที่เหลือได้',
            ),
          );
        count++;
        setExcluded((previous) => new Set([...previous, row.row]));
        setMessage(
          t(
            `Saved ${count} of ${selected.length}`,
            `บันทึกแล้ว ${count} จาก ${selected.length} รายการ`,
          ),
        );
      }
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
        if (!busy) setOpen(next);
      }}
    >
      <DialogTrigger className="button ghost compact">
        <Upload size={16} />
        {t('Import CSV', 'นำเข้า CSV')}
      </DialogTrigger>
      <DialogContent className="trade-dialog csv-import">
        <DialogTitle>{t('Import trades', 'นำเข้าการเทรด')}</DialogTitle>
        <DialogDescription>
          {t(
            'Choose an account, preview your CSV, then confirm the trades to import.',
            'เลือกบัญชี ตรวจไฟล์ CSV แล้วค่อยยืนยันรายการที่ต้องการนำเข้า',
          )}
        </DialogDescription>
        <div className="mt-6">
          <p className="journal-hint">
            {t(
              'This version accepts the Tradovia CSV template, not raw MT5 reports. Up to 500 trades / 2 MB. Amounts are USD; dates and times are used as written without timezone conversion.',
              'เวอร์ชันนี้รับแม่แบบ CSV ของ Tradovia ยังไม่รับรายงาน MT5 โดยตรง สูงสุด 500 รายการ / 2 MB จำนวนเงินเป็น USD วันที่และเวลาใช้ตามไฟล์โดยไม่แปลงเขตเวลา',
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
                <span>{t('CSV file (UTF-8)', 'ไฟล์ CSV (UTF-8)')}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      reset();
                      setError(t('Maximum 2 MB', 'ขนาดสูงสุด 2 MB'));
                      return;
                    }
                    setBusy(true);
                    try {
                      preview(await file.text(), file.name);
                    } catch {
                      reset();
                      setError(t('Unable to read file', 'อ่านไฟล์ไม่ได้'));
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
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
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
                  'Duplicates match account, symbol, direction, status, date/time, entry, size and result. No existing trades are overwritten. Review each row for its full details.',
                  'ตรวจซ้ำจากบัญชี สินทรัพย์ ทิศทาง สถานะ วันเวลา ราคาเข้า ขนาด และผลลัพธ์ ไม่เขียนทับรายการเดิม เปิดรายละเอียดแต่ละแถวเพื่อตรวจได้',
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
