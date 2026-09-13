'use client';

import { useMemo, useState } from 'react';
import { Download, FileChartColumnIncreasing } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money, net, statistics, type Trade } from '@/lib/domain';
import type { Translate } from './workspace-ui';

type Preset = 'today' | '7d' | '30d' | 'month' | 'ytd' | 'all' | 'custom';

const key = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

const move = (value: Date, days: number) => {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
};

const csvCell = (value: string | number) =>
  `"${String(value ?? '')
    .replace(/^[=+@-]/, "'$&")
    .replaceAll('"', '""')}"`;

export default function AccountReport({
  trades,
  capital,
  t,
}: {
  trades: Trade[];
  capital: number;
  t: Translate;
}) {
  const closed = useMemo(
    () =>
      trades
        .filter((trade) => trade.status === 'CLOSED')
        .sort((a, b) =>
          (a.date + a.time + a.id).localeCompare(b.date + b.time + b.id),
        ),
    [trades],
  );
  const latest = closed.at(-1)?.date || key(new Date());
  const earliest = closed[0]?.date || latest;
  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState(earliest);
  const [customTo, setCustomTo] = useState(latest);

  const anchor = new Date(`${latest}T12:00:00`);
  const bounds = (() => {
    if (preset === 'all') return { from: earliest, to: latest };
    if (preset === 'custom') return { from: customFrom, to: customTo };
    if (preset === 'today') return { from: latest, to: latest };
    if (preset === '7d') return { from: key(move(anchor, -6)), to: latest };
    if (preset === '30d') return { from: key(move(anchor, -29)), to: latest };
    if (preset === 'month') {
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      return { from: key(start), to: latest };
    }
    return {
      from: `${anchor.getFullYear()}-01-01`,
      to: latest,
    };
  })();
  const invalid = bounds.from > bounds.to;
  const rows = invalid
    ? []
    : closed.filter(
        (trade) => trade.date >= bounds.from && trade.date <= bounds.to,
      );
  const s = statistics(rows, capital);
  const winners = rows.filter((trade) => net(trade) > 0);
  const losers = rows.filter((trade) => net(trade) < 0);
  const grossProfit = winners.reduce((sum, trade) => sum + net(trade), 0);
  const grossLoss = losers.reduce((sum, trade) => sum + net(trade), 0);
  const fees = rows.reduce((sum, trade) => sum + trade.fees, 0);
  const lots = rows.reduce((sum, trade) => sum + trade.lot, 0);
  const largestWin = winners.length
    ? Math.max(...winners.map((trade) => net(trade)))
    : 0;
  const largestLoss = losers.length
    ? Math.min(...losers.map((trade) => net(trade)))
    : 0;
  const curve = rows.reduce<{ label: string; value: number }[]>(
    (points, trade) => {
      const previous = points.at(-1)?.value || 0;
      points.push({
        label: trade.date,
        value: Math.round((previous + net(trade)) * 100) / 100,
      });
      return points;
    },
    [{ label: t('Start', 'เริ่มต้น'), value: 0 }],
  );

  const downloadCsv = () => {
    const headers = [
      'date',
      'time',
      'symbol',
      'side',
      'setup',
      'entry',
      'lot',
      'risk',
      'gross',
      'fees',
      'net',
    ];
    const content = [
      headers.join(','),
      ...rows.map((trade) =>
        [
          trade.date,
          trade.time,
          trade.symbol,
          trade.side,
          trade.setup,
          trade.entry,
          trade.lot,
          trade.risk,
          trade.gross,
          trade.fees,
          net(trade),
        ]
          .map(csvCell)
          .join(','),
      ),
    ].join('\r\n');
    const url = URL.createObjectURL(
      new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `tradovia-account-report-${bounds.from}-${bounds.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const presets: { value: Preset; en: string; th: string }[] = [
    { value: 'today', en: 'Today', th: 'วันนี้' },
    { value: '7d', en: '7D', th: '7 วัน' },
    { value: '30d', en: '30D', th: '30 วัน' },
    { value: 'month', en: 'This month', th: 'เดือนนี้' },
    { value: 'ytd', en: 'YTD', th: 'ปีนี้' },
    { value: 'all', en: 'All', th: 'ทั้งหมด' },
  ];

  return (
    <section className="account-report">
      <div className="report-heading">
        <div>
          <span className="overline">
            {t('EXPORT · ACCOUNT REPORT', 'ส่งออก · รายงานบัญชี')}
          </span>
          <h2>{t('Account report', 'รายงานผลการเทรด')}</h2>
          <p>
            {t(
              'A clear performance record built from the same closed trades used across your workspace.',
              'สรุปผลจากรายการที่ปิดแล้วชุดเดียวกับ Journal และ Analytics เพื่อให้ทุกตัวเลขตรงกัน',
            )}
          </p>
        </div>
        <button
          className="button primary report-download"
          disabled={!rows.length || invalid}
          onClick={downloadCsv}
        >
          <Download size={17} />
          {t('Download CSV', 'ดาวน์โหลด CSV')}
        </button>
      </div>

      <div className="report-filter-bar">
        <div
          className="report-presets"
          aria-label={t('Report period', 'ช่วงเวลารายงาน')}
        >
          {presets.map((item) => (
            <button
              key={item.value}
              aria-pressed={preset === item.value}
              onClick={() => setPreset(item.value)}
            >
              {t(item.en, item.th)}
            </button>
          ))}
        </div>
        <div className="report-dates">
          <label>
            <span>{t('From', 'ตั้งแต่')}</span>
            <input
              type="date"
              value={preset === 'custom' ? customFrom : bounds.from}
              onChange={(event) => {
                setCustomFrom(event.target.value);
                setPreset('custom');
              }}
            />
          </label>
          <label>
            <span>{t('To', 'ถึง')}</span>
            <input
              type="date"
              value={preset === 'custom' ? customTo : bounds.to}
              onChange={(event) => {
                setCustomTo(event.target.value);
                setPreset('custom');
              }}
            />
          </label>
        </div>
      </div>

      {invalid ? (
        <div className="report-empty" role="alert">
          {t(
            'The end date must be after the start date.',
            'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น',
          )}
        </div>
      ) : !rows.length ? (
        <div className="report-empty">
          <FileChartColumnIncreasing size={34} />
          <h3>
            {t('No closed trades in this period', 'ไม่มีรายการที่ปิดแล้วในช่วงนี้')}
          </h3>
          <p>
            {t(
              'Choose another period to create the report.',
              'เลือกช่วงเวลาอื่นเพื่อสร้างรายงาน',
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="report-hero panel">
            <div>
              <span>
                {bounds.from} — {bounds.to}
              </span>
              <strong className={s.pnl >= 0 ? 'positive' : 'negative'}>
                {money(s.pnl)}
              </strong>
              <small>
                {t('Net P&L', 'กำไร/ขาดทุนสุทธิ')} · {rows.length}{' '}
                {t('closed trades', 'รายการ')}
              </small>
            </div>
            <dl>
              <div>
                <dt>{t('Win rate', 'อัตราชนะ')}</dt>
                <dd>{s.winRate.toFixed(1)}%</dd>
              </div>
              <div>
                <dt>{t('Profit factor', 'Profit factor')}</dt>
                <dd>
                  {Number.isFinite(s.profitFactor)
                    ? s.profitFactor.toFixed(2)
                    : '∞'}
                </dd>
              </div>
              <div>
                <dt>{t('Expectancy', 'ผลตอบแทนคาดหวัง')}</dt>
                <dd>{money(s.expectancy)}</dd>
              </div>
              <div>
                <dt>{t('Max drawdown', 'Drawdown สูงสุด')}</dt>
                <dd>{s.drawdown.toFixed(2)}%</dd>
              </div>
            </dl>
          </div>

          <div className="report-stat-grid">
            <article className="panel">
              <span className="report-card-label">
                {t('ALL TRADES', 'รายการทั้งหมด')}
              </span>
              <dl>
                <div>
                  <dt>{t('Gross P&L', 'กำไร/ขาดทุนก่อนหักค่าใช้จ่าย')}</dt>
                  <dd>{money(s.pnl + fees)}</dd>
                </div>
                <div>
                  <dt>{t('Closed trades', 'รายการที่ปิดแล้ว')}</dt>
                  <dd>{rows.length}</dd>
                </div>
                <div>
                  <dt>{t('Total volume', 'ขนาดรวม')}</dt>
                  <dd>{lots.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>{t('Fees', 'ค่าธรรมเนียม')}</dt>
                  <dd>{money(fees)}</dd>
                </div>
                <div>
                  <dt>{t('Net P&L', 'กำไรสุทธิ')}</dt>
                  <dd className={s.pnl >= 0 ? 'positive' : 'negative'}>
                    {money(s.pnl)}
                  </dd>
                </div>
              </dl>
            </article>
            <article className="panel report-positive-card">
              <span className="report-card-label">
                {t('PROFIT TRADES', 'รายการกำไร')}
              </span>
              <dl>
                <div>
                  <dt>{t('Total profit', 'กำไรรวม')}</dt>
                  <dd className="positive">{money(grossProfit)}</dd>
                </div>
                <div>
                  <dt>{t('Winning trades', 'จำนวนครั้งที่กำไร')}</dt>
                  <dd>{winners.length}</dd>
                </div>
                <div>
                  <dt>{t('Average win', 'กำไรเฉลี่ย')}</dt>
                  <dd>
                    {money(winners.length ? grossProfit / winners.length : 0)}
                  </dd>
                </div>
                <div>
                  <dt>{t('Largest win', 'กำไรสูงสุด')}</dt>
                  <dd className="positive">{money(largestWin)}</dd>
                </div>
              </dl>
            </article>
            <article className="panel report-negative-card">
              <span className="report-card-label">
                {t('LOSING TRADES', 'รายการขาดทุน')}
              </span>
              <dl>
                <div>
                  <dt>{t('Total loss', 'ขาดทุนรวม')}</dt>
                  <dd className="negative">{money(grossLoss)}</dd>
                </div>
                <div>
                  <dt>{t('Losing trades', 'จำนวนครั้งที่ขาดทุน')}</dt>
                  <dd>{losers.length}</dd>
                </div>
                <div>
                  <dt>{t('Average loss', 'ขาดทุนเฉลี่ย')}</dt>
                  <dd>
                    {money(losers.length ? grossLoss / losers.length : 0)}
                  </dd>
                </div>
                <div>
                  <dt>{t('Largest loss', 'ขาดทุนสูงสุด')}</dt>
                  <dd className="negative">{money(largestLoss)}</dd>
                </div>
              </dl>
            </article>
          </div>

          <div className="panel report-chart-panel">
            <div className="section-heading">
              <div>
                <span className="overline">
                  {t('CUMULATIVE RESULT', 'ผลลัพธ์สะสม')}
                </span>
                <h2>{t('P&L history', 'ประวัติกำไร/ขาดทุน')}</h2>
              </div>
              <strong className={s.pnl >= 0 ? 'positive' : 'negative'}>
                {money(s.pnl)}
              </strong>
            </div>
            <div className="report-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={curve}
                  margin={{ top: 16, right: 12, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="reportPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#3b9b72"
                        stopOpacity={0.24}
                      />
                      <stop offset="100%" stopColor="#3b9b72" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    minTickGap={55}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    width={62}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString()}`
                    }
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                    }}
                    formatter={(value) => [
                      money(Number(value)),
                      t('Cumulative P&L', 'กำไร/ขาดทุนสะสม'),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b9b72"
                    strokeWidth={2.25}
                    fill="url(#reportPnl)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="report-note">
              {t(
                'Closed trades only · Net of recorded fees · Historical results do not predict future performance.',
                'เฉพาะรายการที่ปิดแล้ว · หักค่าธรรมเนียมที่บันทึก · ผลในอดีตไม่ใช่การคาดการณ์ผลในอนาคต',
              )}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
