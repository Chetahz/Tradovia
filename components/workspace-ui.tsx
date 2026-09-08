'use client';
import { BookOpen } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { statistics, net, money, type Trade } from '@/lib/domain';
export type Translate = (en: string, th: string) => string;
export function Pick({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v !== null) onChange(v);
      }}
      items={options}
    >
      <SelectTrigger className="pick" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
export function Metric({
  label,
  value,
  note,
  positive,
}: {
  label: string;
  value: string;
  note: string;
  positive?: boolean;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong
        className={
          positive === true ? 'positive' : positive === false ? 'negative' : ''
        }
      >
        {value}
      </strong>
      <small>{note}</small>
    </div>
  );
}
export function Equity({
  trades,
  capital,
  t,
}: {
  trades: Trade[];
  capital: number;
  t: Translate;
}) {
  const s = statistics(trades, capital);
  return (
    <div className="panel equity-panel">
      <div className="section-heading">
        <div>
          <span className="overline">{t('PERFORMANCE', 'ผลการเทรด')}</span>
          <h2>{t('Your equity, over time', 'มูลค่าพอร์ตตามเวลา')}</h2>
        </div>
        <span className={s.pnl >= 0 ? 'positive' : 'negative'}>
          {money(s.pnl)}
        </span>
      </div>
      <div className="equity-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={s.curve}
            margin={{ top: 20, right: 15, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="workspaceEquity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b9b72" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#3b9b72" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              minTickGap={55}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(n) => `$${(n / 1000).toFixed(1)}k`}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              width={58}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
              }}
              formatter={(v) => [money(Number(v)), t('Equity', 'มูลค่าพอร์ต')]}
            />
            <Area
              isAnimationActive={false}
              type="linear"
              dataKey="value"
              stroke="#3b9b72"
              strokeWidth={2}
              fill="url(#workspaceEquity)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-foot">
        {t(
          'Closed trades · Net of fees · Ordered by trade date',
          'เฉพาะไม้ที่ปิดแล้ว · หักค่าธรรมเนียม · เรียงตามวันเทรด',
        )}
      </div>
    </div>
  );
}
export function TradeTable({
  trades,
  onView,
  t,
}: {
  trades: Trade[];
  onView: (t: Trade) => void;
  t: Translate;
}) {
  return trades.length ? (
    <>
      <div className="desktop-journal">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                t('Instrument', 'สินทรัพย์'),
                t('Date', 'วันที่'),
                t('Technique', 'เทคนิค'),
                t('Risk', 'ความเสี่ยง'),
                'R',
                t('Net P&L', 'กำไรสุทธิ'),
              ].map((x) => (
                <TableHead key={x}>{x}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((tr) => (
              <TableRow key={tr.id}>
                <TableCell>
                  <button className="trade-link" onClick={() => onView(tr)}>
                    <span className="instrument-icon">
                      {tr.symbol.slice(0, 2)}
                    </span>
                    <span>
                      <b>{tr.symbol}</b>
                      <small
                        className={tr.side === 'LONG' ? 'positive' : 'negative'}
                      >
                        {tr.side}
                      </small>
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  <span>{tr.date}</span>
                  <small className="block muted-copy">{tr.time}</small>
                </TableCell>
                <TableCell>{tr.setup || '—'}</TableCell>
                <TableCell>{money(tr.risk)}</TableCell>
                <TableCell>
                  {tr.status === 'OPEN'
                    ? '—'
                    : tr.risk
                      ? (net(tr) / tr.risk).toFixed(2)
                      : '—'}
                </TableCell>
                <TableCell>
                  <b className={net(tr) >= 0 ? 'positive' : 'negative'}>
                    {tr.status === 'OPEN'
                      ? t('Open', 'ยังไม่ปิด')
                      : money(net(tr))}
                  </b>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mobile-journal">
        {trades.map((tr) => (
          <button
            key={tr.id}
            className="mobile-trade-card"
            onClick={() => onView(tr)}
          >
            <span className="mobile-trade-top">
              <span className="instrument-icon">{tr.symbol.slice(0, 2)}</span>
              <b>{tr.symbol}</b>
              <span className={net(tr) >= 0 ? 'positive' : 'negative'}>
                {tr.status === 'OPEN' ? t('Open', 'ยังไม่ปิด') : money(net(tr))}
              </span>
            </span>
            <span className="mobile-trade-meta">
              {tr.side} · {tr.date} · {tr.time}
            </span>
            <span className="mobile-trade-bottom">
              <span>{tr.setup || t('No technique tag', 'ยังไม่ระบุเทคนิค')}</span>
              <b>
                {tr.status === 'CLOSED' && tr.risk
                  ? (net(tr) / tr.risk).toFixed(2) + 'R'
                  : '—'}
              </b>
            </span>
          </button>
        ))}
      </div>
    </>
  ) : (
    <div className="empty-state">
      <BookOpen size={30} />
      <h3>
        {t('Your story starts with one trade.', 'เริ่มเรื่องราวของคุณด้วยไม้แรก')}
      </h3>
      <p>
        {t(
          'Add a trade to see your journal, calendar and analytics come together.',
          'บันทึกการเทรดเพื่อเริ่มดูปฏิทินและผลวิเคราะห์',
        )}
      </p>
    </div>
  );
}
export function Breakdown({
  trades,
  field,
  t,
  onReview,
}: {
  trades: Trade[];
  field: 'setup' | 'symbol';
  t: Translate;
  onReview?: (
    label: string,
    trades: Trade[],
    field: 'setup' | 'symbol',
  ) => void;
}) {
  const groups = [
    ...new Set(trades.map((x) => x[field] || t('Untagged', 'ไม่ระบุ'))),
  ];
  return (
    <div className="panel">
      <h2>
        {field === 'setup'
          ? t('By technique', 'แยกตามเทคนิค')
          : t('By instrument', 'แยกตามสินทรัพย์')}
      </h2>
      {groups.map((key) => {
        const rows = trades.filter(
          (x) =>
            (x[field] || t('Untagged', 'ไม่ระบุ')) === key &&
            x.status === 'CLOSED',
        );
        const s = statistics(rows, 0);
        return (
          <div className="breakdown-row" key={key}>
            <div>
              <b>{key}</b>
              <small>
                {s.count} {t('trades', 'ไม้')} · {s.winRate.toFixed(0)}%{' '}
                {t('win rate', 'อัตราชนะ')}
              </small>
            </div>
            <b className={s.pnl >= 0 ? 'positive' : 'negative'}>
              {money(s.pnl)}
            </b>
            {onReview && (
              <button
                className="text-button review-source"
                onClick={() => onReview(key, rows, field)}
                aria-label={t(`View trades: ${key}`, `ดูรายการเทรด: ${key}`)}
              >
                {t('View trades', 'ดูรายการ')} ↗
              </button>
            )}
          </div>
        );
      })}
      {!groups.length && (
        <p>
          {t(
            'Add closed trades to see a breakdown.',
            'บันทึกไม้ที่ปิดแล้วเพื่อดูผลแยกตามหมวด',
          )}
        </p>
      )}
    </div>
  );
}
