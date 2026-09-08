'use client';
import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, ArrowUpRight } from 'lucide-react';
import { Pick, type Translate } from './workspace-ui';
const catalog = [
  ['OANDA:XAUUSD', 'XAUUSD'],
  ['OANDA:EURUSD', 'EURUSD'],
  ['OANDA:GBPUSD', 'GBPUSD'],
  ['OANDA:USDJPY', 'USDJPY'],
  ['FOREXCOM:NSXUSD', 'NAS100'],
  ['BITSTAMP:BTCUSD', 'BTCUSD'],
  ['NASDAQ:AAPL', 'AAPL'],
];
function Widget({
  kind,
  config,
  height,
}: {
  kind: string;
  config: Record<string, unknown>;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null),
    [failed, setFailed] = useState(false);
  const settings = JSON.stringify(config);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.replaceChildren();
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.height = '100%';
    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    inner.style.height = '100%';
    wrapper.appendChild(inner);
    const script = document.createElement('script');
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${kind}.js`;
    script.async = true;
    script.text = JSON.stringify({
      ...JSON.parse(settings),
      width: '100%',
      height,
    });
    script.onerror = () => setFailed(true);
    wrapper.appendChild(script);
    c.appendChild(wrapper);
    return () => c.replaceChildren();
  }, [kind, settings, height]);
  return (
    <div className="market-widget">
      <div ref={ref} style={{ height }} />
      {failed && (
        <p role="alert">
          TradingView could not load. Check your connection or open TradingView
          directly.
        </p>
      )}
      <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">
        Market data by TradingView <ArrowUpRight size={12} />
      </a>
    </div>
  );
}
export default function Market({
  t,
  dark,
  th,
  watchlist,
  onWatchlistChange,
}: {
  t: Translate;
  dark: boolean;
  th: boolean;
  watchlist?: string[];
  onWatchlistChange: (watch: string[]) => Promise<unknown>;
}) {
  const [tab, setTab] = useState('chart'),
    [symbol, setSymbol] = useState('OANDA:XAUUSD'),
    [candidate, setCandidate] = useState('BITSTAMP:BTCUSD');
  const watch = watchlist ?? catalog.slice(0, 5).map((x) => x[0]);
  const base = {
    colorTheme: dark ? 'dark' : 'light',
    locale: th ? 'th_TH' : 'en',
    isTransparent: true,
  };
  return (
    <>
      <Widget
        kind="ticker-tape"
        height={60}
        config={{
          ...base,
          symbols: watch.map((proName) => ({ proName })),
          showSymbolLogo: true,
          displayMode: 'adaptive',
        }}
      />
      <div className="market-toolbar">
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList>
            {[
              ['chart', 'Chart', 'กราฟ'],
              ['calendar', 'Economic calendar', 'ปฏิทินเศรษฐกิจ'],
              ['news', 'Market news', 'ข่าวตลาด'],
            ].map((v) => (
              <TabsTrigger key={v[0]} value={v[0]}>
                {t(v[1], v[2])}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <span>
          {t(
            'Data may be delayed by the exchange.',
            'ข้อมูลอาจล่าช้าตามเงื่อนไขตลาด',
          )}
        </span>
      </div>
      {tab === 'chart' ? (
        <div className="market-layout">
          <div className="panel chart-widget">
            <Widget
              kind="advanced-chart"
              height={620}
              config={{
                ...base,
                theme: dark ? 'dark' : 'light',
                symbol,
                interval: '60',
                timezone: 'Asia/Bangkok',
                allow_symbol_change: true,
                withdateranges: true,
                hide_side_toolbar: false,
                calendar: true,
              }}
            />
          </div>
          <aside>
            <div className="panel">
              <h2>{t('Watchlist', 'รายการเฝ้าดู')}</h2>
              {watch.map((key) => (
                <div className="watch-row" key={key}>
                  <button
                    className={key === symbol ? 'positive' : ''}
                    onClick={() => setSymbol(key)}
                  >
                    {catalog.find((x) => x[0] === key)?.[1] ?? key}
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t(`Remove ${key}`, `ลบ ${key}`)}
                    onClick={() =>
                      void onWatchlistChange(watch.filter((x) => x !== key))
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="actions mt-4">
                <Pick
                  label={t('Add instrument', 'เพิ่มสินทรัพย์')}
                  value={candidate}
                  onChange={setCandidate}
                  options={catalog.map(([value, label]) => ({ value, label }))}
                />
                <button
                  aria-label={t('Add to watchlist', 'เพิ่มในรายการเฝ้าดู')}
                  className="icon-button"
                  onClick={() => {
                    if (!watch.includes(candidate))
                      void onWatchlistChange([...watch, candidate]);
                  }}
                >
                  <Plus size={19} />
                </button>
              </div>
            </div>
            <div className="panel">
              <h2>{t('Technical summary', 'ภาพรวมทางเทคนิค')}</h2>
              <Widget
                kind="technical-analysis"
                height={340}
                config={{
                  ...base,
                  symbol,
                  interval: '1h',
                  showIntervalTabs: true,
                  displayMode: 'single',
                }}
              />
            </div>
          </aside>
        </div>
      ) : tab === 'calendar' ? (
        <div className="panel">
          <Widget
            kind="events"
            height={650}
            config={{
              ...base,
              importanceFilter: '0,1',
              currencyFilter: 'USD,EUR,GBP,JPY',
            }}
          />
        </div>
      ) : (
        <div className="panel">
          <Widget
            kind="timeline"
            height={650}
            config={{
              ...base,
              feedMode: 'all_symbols',
              displayMode: 'regular',
            }}
          />
        </div>
      )}
      <p className="table-foot">
        {t(
          'Market widgets are supplied by TradingView. Tradovia does not generate prices or trade signals.',
          'ข้อมูลตลาดมาจาก TradingView ระบบ Tradovia ไม่สร้างราคาหรือสัญญาณเทรดขึ้นเอง',
        )}
      </p>
    </>
  );
}
