'use client';
import { useState } from 'react';
import { Images, ArrowUpRight } from 'lucide-react';
import { money, net, type Trade } from '@/lib/domain';
import { Pick, type Translate } from './workspace-ui';
import ChartImages from './chart-images';

export default function TradeGallery({
  trades,
  mode,
  t,
  onView,
}: {
  trades: Trade[];
  mode: string;
  t: Translate;
  onView: (trade: Trade) => void;
}) {
  const [result, setResult] = useState('all');
  const [limit, setLimit] = useState(12);
  const withImages = trades.filter((trade) => trade.imageIds.length > 0);
  const filtered = withImages.filter(
    (trade) =>
      result === 'all' ||
      (trade.status === 'CLOSED' &&
        (result === 'win'
          ? net(trade) > 0
          : result === 'loss'
            ? net(trade) < 0
            : net(trade) === 0)),
  );
  return (
    <section aria-label={t('Chart gallery', 'แกลเลอรีกราฟ')}>
      <div className="gallery-heading">
        <div>
          <h3>{t('Your trades, in pictures', 'ทบทวนการเทรดผ่านภาพกราฟ')}</h3>
          <p>
            {t(
              `${filtered.length} trades with images · Click a chart to expand`,
              `${filtered.length} รายการที่มีภาพ · กดภาพเพื่อดูเต็มจอ`,
            )}
          </p>
        </div>
        <Pick
          label={t('Trade result', 'ผลการเทรด')}
          value={result}
          onChange={(value) => {
            setResult(value);
            setLimit(12);
          }}
          options={[
            { value: 'all', label: t('All results', 'ทุกผลลัพธ์') },
            { value: 'win', label: t('Profit', 'กำไร') },
            { value: 'loss', label: t('Loss', 'ขาดทุน') },
            { value: 'flat', label: t('Break-even', 'เท่าทุน') },
          ]}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="gallery-empty">
          <Images size={32} />
          <h3>{t('No charts in this view yet', 'ยังไม่มีภาพกราฟในมุมมองนี้')}</h3>
          <p>
            {t(
              'Attach charts when editing or reviewing a trade. If you already have images, try changing the filters.',
              'แนบภาพได้ตอนแก้ไขหรือทบทวนการเทรด หากมีภาพแล้ว ลองเปลี่ยนตัวกรองด้านบน',
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="trade-gallery-grid">
            {filtered.slice(0, limit).map((trade) => (
              <article className="trade-gallery-card" key={trade.id}>
                <div className="gallery-card-heading">
                  <div>
                    <strong>{trade.symbol}</strong>
                    <span>
                      {trade.side} · {trade.date} {trade.time}
                    </span>
                  </div>
                  <span
                    className={
                      trade.status === 'OPEN'
                        ? ''
                        : net(trade) >= 0
                          ? 'positive'
                          : 'negative'
                    }
                  >
                    {trade.status === 'OPEN'
                      ? t('Open', 'ยังไม่ปิด')
                      : money(net(trade))}
                  </span>
                </div>
                <ChartImages trade={trade} mode={mode} t={t} />
                <div className="gallery-card-footer">
                  <span>{trade.setup || t('No setup', 'ยังไม่ระบุเทคนิค')}</span>
                  <button
                    className="button ghost compact"
                    onClick={() => onView(trade)}
                  >
                    {t('Trade details', 'รายละเอียดเทรด')}
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length > limit && (
            <button
              className="button ghost gallery-more"
              onClick={() => setLimit(limit + 12)}
            >
              {t('Show more trades', 'แสดงรายการเพิ่ม')}
            </button>
          )}
        </>
      )}
    </section>
  );
}
