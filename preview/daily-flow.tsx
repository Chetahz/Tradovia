import { useState } from 'react';

const samples = [
  { id: 'D01', symbol: 'XAUUSD', time: '09:15', pnl: 96, risk: 100 },
  { id: 'D02', symbol: 'EURUSD', time: '10:30', pnl: -54, risk: 100 },
  { id: 'D03', symbol: 'XAUUSD', time: '14:10', pnl: 142, risk: 100 },
];
type Review = { adherence: string; mistake: string; note: string };
export default function DailyFlow() {
  const [th, setTh] = useState(true),
    [dark, setDark] = useState(false);
  const [step, setStep] = useState(0),
    [plan, setPlan] = useState(0);
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [selected, setSelected] = useState('D01'),
    [evidence, setEvidence] = useState(false);
  const [focus, setFocus] = useState('');
  const t = (en: string, thai: string) => (th ? thai : en);
  const plans = [
    {
      name: 'Breakout & Retest',
      description: t(
        'Wait for the return, then check your conditions.',
        'รอราคากลับมาทดสอบ แล้วตรวจเงื่อนไขก่อนตัดสินใจ',
      ),
      rules: [
        t('A clear level is marked', 'ระบุระดับราคาที่เฝ้าดูไว้แล้ว'),
        t(
          'Retest matches my written criteria',
          'การกลับมาทดสอบตรงตามเงื่อนไขที่เขียนไว้',
        ),
        t('Stop and risk budget are defined', 'กำหนดจุดตัดขาดทุนและงบความเสี่ยงแล้ว'),
      ],
    },
    {
      name: 'Liquidity Sweep',
      description: t(
        'A patient routine built around your own rules.',
        'รอจังหวะที่ตรงกับกฎของคุณอย่างมีวินัย',
      ),
      rules: [
        t('Reference high or low is marked', 'ระบุจุดสูงหรือต่ำที่ใช้อ้างอิงแล้ว'),
        t(
          'Confirmation matches my written criteria',
          'สัญญาณยืนยันตรงกับเงื่อนไขที่เขียนไว้',
        ),
        t(
          'Invalidation and risk budget are defined',
          'กำหนดจุดที่แผนใช้ไม่ได้และงบความเสี่ยงแล้ว',
        ),
      ],
    },
  ];
  const current = reviews[selected] || { adherence: '', mistake: '', note: '' };
  const update = (field: keyof Review, value: string) =>
    setReviews((prev) => ({
      ...prev,
      [selected]: {
        ...(prev[selected] || { adherence: '', mistake: '', note: '' }),
        [field]: value,
      },
    }));
  const reviewed = samples.filter((tr) => reviews[tr.id]?.adherence);
  const followed = reviewed.filter((tr) => reviews[tr.id]?.adherence === 'yes');
  const labels = [
    t('Prepare', 'เตรียมแผน'),
    t('Review', 'ทบทวนเทรด'),
    t('Reflect', 'สรุปวัน'),
  ];
  return (
    <main
      className={`daily-prototype ${dark ? 'dark' : ''}`}
      lang={th ? 'th' : 'en'}
    >
      <header className="daily-header">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          tradovia
        </a>
        <div className="actions">
          <button className="button ghost compact" onClick={() => setTh(!th)}>
            {th ? 'EN' : 'ไทย'}
          </button>
          <button
            className="button ghost compact"
            onClick={() => setDark(!dark)}
          >
            {t('Light / dark', 'สว่าง / มืด')}
          </button>
          <a href="/demo">{t('Workspace ↗', 'เวิร์กสเปซ ↗')}</a>
        </div>
      </header>
      <div className="daily-content">
        <p className="eyebrow">
          {t('THE PATH · ONE DAY AT A TIME', 'THE PATH · เติบโตทีละวัน')}
        </p>
        <h1>
          {t(
            'Less recording. More understanding.',
            'บันทึกให้น้อยลง เข้าใจตัวเองมากขึ้น',
          )}
        </h1>
        <p className="daily-muted">
          {t(
            'Interactive concept · sample plans and trades, not trading recommendations. Your choices last until this page reloads.',
            'ต้นแบบโต้ตอบ · แผนและเทรดเป็นตัวอย่าง ไม่ใช่คำแนะนำซื้อขาย ตัวเลือกในหน้านี้จะอยู่จนกว่าจะรีโหลด',
          )}
        </p>
        <nav
          className="daily-steps"
          aria-label={t('Daily routine', 'ขั้นตอนประจำวัน')}
        >
          {labels.map((label, i) => (
            <button
              key={i}
              aria-current={step === i ? 'step' : undefined}
              onClick={() => setStep(i)}
            >
              <span>0{i + 1}</span>
              {label}
            </button>
          ))}
        </nav>
        {step === 0 && (
          <section>
            <div className="daily-title">
              <div>
                <h2>{t('Start with intention.', 'เริ่มจากแผนที่ชัดเจน')}</h2>
                <p>
                  {t(
                    'Choose one playbook. Check only what you have confirmed.',
                    'เลือกหนึ่ง Playbook แล้วเช็กเฉพาะเงื่อนไขที่ตรวจแล้ว',
                  )}
                </p>
              </div>
              <span className="daily-badge">
                {t('Before trading', 'ก่อนเทรด')}
              </span>
            </div>
            <div className="daily-columns">
              <div className="daily-plans">
                {plans.map((p, i) => (
                  <button
                    className={`daily-card ${plan === i ? 'chosen' : ''}`}
                    aria-pressed={plan === i}
                    key={p.name}
                    onClick={() => {
                      setPlan(i);
                      setChecks([false, false, false]);
                    }}
                  >
                    <small>PLAYBOOK 0{i + 1}</small>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <span>
                      {t(
                        'Sample rules · editable in the future',
                        'กฎตัวอย่าง · การแก้ไขแผนจะพัฒนาภายหลัง',
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div className="daily-card">
                <h3>{t('A moment to check in', 'ใช้เวลาตรวจแผนสักนิด')}</h3>
                <p>{plans[plan].name}</p>
                {plans[plan].rules.map((rule, i) => (
                  <label className="daily-check" key={rule}>
                    <input
                      type="checkbox"
                      checked={checks[i]}
                      onChange={(e) =>
                        setChecks((prev) =>
                          prev.map((v, j) => (i === j ? e.target.checked : v)),
                        )
                      }
                    />
                    {rule}
                  </label>
                ))}
                <p className="daily-muted">
                  {checks.filter(Boolean).length}/3 ·{' '}
                  {t(
                    'A checklist is preparation, not an entry signal.',
                    'เช็กลิสต์ช่วยเตรียมตัว ไม่ใช่สัญญาณให้เข้าเทรด',
                  )}
                </p>
                <button className="button ink" onClick={() => setStep(1)}>
                  {t('Try reviewing sample trades →', 'ลองทบทวนเทรดตัวอย่าง →')}
                </button>
              </div>
            </div>
          </section>
        )}
        {step === 1 && (
          <section>
            <div className="daily-title">
              <div>
                <h2>
                  {t('A quick pause after the trade.', 'ทบทวนสั้น ๆ หลังจบเทรด')}
                </h2>
                <p>
                  {t(
                    'Execution is prefilled here to demonstrate future import or sync.',
                    'ต้นแบบใส่ข้อมูลซื้อขายไว้ให้ เพื่อจำลองประสบการณ์เมื่อนำเข้าหรือซิงก์ได้',
                  )}
                </p>
              </div>
              <span className="daily-badge">
                {reviewed.length}/3 {t('reviewed', 'ทบทวนแล้ว')}
              </span>
            </div>
            <div className="daily-columns">
              <div className="daily-plans">
                {samples.map((tr) => (
                  <button
                    key={tr.id}
                    className={`daily-card daily-trade ${selected === tr.id ? 'chosen' : ''}`}
                    aria-pressed={selected === tr.id}
                    onClick={() => setSelected(tr.id)}
                  >
                    <div>
                      <strong>{tr.symbol}</strong>
                      <small>
                        {tr.id} · {tr.time} · {t('Sample', 'ตัวอย่าง')}
                      </small>
                    </div>
                    <div>
                      <strong>
                        {tr.pnl > 0 ? '+' : '−'}${Math.abs(tr.pnl).toFixed(2)}
                      </strong>
                      <small>
                        {reviews[tr.id]?.adherence
                          ? t('Reviewed ✓', 'ทบทวนแล้ว ✓')
                          : t('Not reviewed', 'ยังไม่ได้ทบทวน')}
                      </small>
                    </div>
                  </button>
                ))}
                <p className="daily-muted">
                  {t(
                    'Net P&L includes sample fees. No broker is connected.',
                    'กำไรสุทธิหักค่าธรรมเนียมตัวอย่างแล้ว ยังไม่มีการเชื่อมโบรกเกอร์',
                  )}
                </p>
              </div>
              <div className="daily-card">
                <span className="daily-badge">
                  {plans[plan].name} ·{' '}
                  {t('Selected for this exercise', 'แผนที่เลือกในต้นแบบ')}
                </span>
                <h3>
                  {t(
                    'Did this trade follow your plan?',
                    'เทรดนี้เป็นไปตามแผนไหม?',
                  )}
                </h3>
                <div className="daily-options">
                  {[
                    ['yes', t('Followed', 'ตามแผน')],
                    ['partial', t('Partly', 'บางส่วน')],
                    ['no', t('Outside plan', 'นอกแผน')],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={current.adherence === value}
                      onClick={() => update('adherence', value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="daily-field">
                  {t(
                    'Anything to revisit? (optional)',
                    'มีอะไรอยากทบทวนเพิ่มไหม? (ไม่บังคับ)',
                  )}
                  <select
                    value={current.mistake}
                    onChange={(e) => update('mistake', e.target.value)}
                  >
                    <option value="">{t('Not specified', 'ยังไม่ได้ระบุ')}</option>
                    {['None', 'FOMO', 'Early entry', 'Revenge trade'].map(
                      (v, i) => (
                        <option key={v} value={v}>
                          {th
                            ? [
                                'ไม่มีข้อผิดพลาดที่ระบุ',
                                'กลัวตกรถ (FOMO)',
                                'เข้าเร็วเกินแผน',
                                'เทรดเอาคืน',
                              ][i]
                            : v}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <details>
                  <summary>
                    {t('Add a short note (optional)', 'เพิ่มบันทึกสั้น ๆ (ไม่บังคับ)')}
                  </summary>
                  <textarea
                    aria-label={t('Reflection note', 'บันทึกทบทวน')}
                    value={current.note}
                    onChange={(e) => update('note', e.target.value)}
                    placeholder={t(
                      'One thing to remember…',
                      'หนึ่งเรื่องที่อยากจำไว้…',
                    )}
                  />
                </details>
                <p className="daily-muted" aria-live="polite">
                  {current.adherence
                    ? t(
                        'Updated in this prototype. You can change your answer.',
                        'อัปเดตในต้นแบบแล้ว เปลี่ยนคำตอบได้เสมอ',
                      )
                    : t(
                        'Unanswered trades stay unclassified.',
                        'รายการที่ยังไม่ตอบจะไม่ถูกนับว่าตามแผนหรือนอกแผน',
                      )}
                </p>
                <button className="button ink" onClick={() => setStep(2)}>
                  {t('See today’s reflection →', 'ดูสรุปประจำวัน →')}
                </button>
              </div>
            </div>
          </section>
        )}
        {step === 2 && (
          <section>
            <div className="daily-title">
              <div>
                <h2>
                  {t('Understand the day. Then let it go.', 'เข้าใจวันนี้ แล้วพักได้')}
                </h2>
                <p>
                  {t(
                    'Reviewing your process matters more than keeping a trading streak.',
                    'ความใส่ใจในกระบวนการสำคัญกว่าการเทรดให้ครบทุกวัน',
                  )}
                </p>
              </div>
              <span className="daily-badge">{t('Sample day', 'วันตัวอย่าง')}</span>
            </div>
            <div className="daily-summary">
              <div className="daily-card">
                <small>{t('Sample net P&L', 'กำไรสุทธิตัวอย่าง')}</small>
                <h2>+$184.00</h2>
                <p>{t('3 closed trades · USD', '3 เทรดที่ปิดแล้ว · USD')}</p>
              </div>
              <div className="daily-card">
                <small>{t('Followed the plan', 'ทำตามแผน')}</small>
                <h2>
                  {reviewed.length
                    ? `${followed.length}/${reviewed.length}`
                    : '—'}
                </h2>
                <p>
                  {t(
                    `${3 - reviewed.length} trades still unreviewed`,
                    `ยังไม่ได้ทบทวน ${3 - reviewed.length} รายการ`,
                  )}
                </p>
              </div>
              <div className="daily-card">
                <small>{t('Evidence before conclusions', 'ดูข้อมูลก่อนสรุป')}</small>
                <h3>
                  {t('Too early to call a pattern', 'ยังเร็วเกินไปที่จะสรุปแนวโน้ม')}
                </h3>
                <p>
                  {t(
                    'Three sample trades cannot establish a reliable edge or explain causation.',
                    'เทรดตัวอย่างสามรายการยังใช้ยืนยันความได้เปรียบหรือสาเหตุของผลลัพธ์ไม่ได้',
                  )}
                </p>
              </div>
            </div>
            <div className="daily-card daily-reflection">
              <h3>{t('What your review tells us', 'สิ่งที่เห็นจากการทบทวน')}</h3>
              <p>
                {reviewed.length
                  ? t(
                      `You marked ${followed.length} of ${reviewed.length} reviewed trades as following your plan. This reflects your answers, not a judgement based on profit.`,
                      `คุณระบุว่าทำตามแผน ${followed.length} จาก ${reviewed.length} รายการที่ทบทวน ข้อนี้มาจากคำตอบของคุณ ไม่ได้ตัดสินจากกำไร`,
                    )
                  : t(
                      'Review one trade to start understanding your process.',
                      'เริ่มทบทวนหนึ่งรายการ เพื่อเห็นภาพกระบวนการของคุณ',
                    )}
              </p>
              <button
                className="button ghost compact"
                aria-expanded={evidence}
                onClick={() => setEvidence(!evidence)}
              >
                {t('View supporting trades', 'ดูรายการที่ใช้สรุป')}
              </button>
              {evidence && (
                <div className="daily-evidence">
                  {samples.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => {
                        setSelected(tr.id);
                        setStep(1);
                      }}
                    >
                      {tr.id} · {tr.symbol} · ${tr.pnl.toFixed(2)} ·{' '}
                      {reviews[tr.id]?.adherence === 'yes'
                        ? t('Followed', 'ตามแผน')
                        : reviews[tr.id]?.adherence === 'partial'
                          ? t('Partly', 'บางส่วน')
                          : reviews[tr.id]?.adherence === 'no'
                            ? t('Outside plan', 'นอกแผน')
                            : t('Unreviewed', 'ยังไม่ทบทวน')}{' '}
                      ↗
                    </button>
                  ))}
                </div>
              )}
              <label className="daily-field">
                {t(
                  'One thing to carry into tomorrow (optional)',
                  'หนึ่งเรื่องที่อยากนำไปปรับในวันถัดไป (ไม่บังคับ)',
                )}
                <input
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder={t(
                    'For example: wait for my checklist',
                    'เช่น รอเงื่อนไขให้ครบก่อนตัดสินใจ',
                  )}
                />
              </label>
              <p className="daily-muted">
                {t(
                  'A day without trading can still be a day of discipline. This prototype does not send reminders.',
                  'วันที่ไม่เทรดก็เป็นวันที่รักษาวินัยได้ ต้นแบบนี้ยังไม่มีการส่งแจ้งเตือน',
                )}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
