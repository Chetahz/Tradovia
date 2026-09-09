'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';

export default function LaunchPricing({ th }: { th: boolean }) {
  const [annual, setAnnual] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<
    'THB' | 'USD' | null
  >(null);
  useEffect(() => {
    const saved = localStorage.getItem('tradovia.pricing.currency');
    if (saved === 'THB' || saved === 'USD') setSelectedCurrency(saved);
  }, []);
  const currency = selectedCurrency ?? (th ? 'THB' : 'USD');
  const price =
    currency === 'THB'
      ? { month: '฿199', year: '฿1,990', equivalent: '฿165.83', free: '฿0' }
      : { month: '$5.99', year: '$59.90', equivalent: '$4.99', free: '$0' };
  const t = (en: string, thai: string) => (th ? thai : en);
  return (
    <section className="land-section" id="pricing">
      <div className="eyebrow">{t('ROOM TO GROW', 'เติบโตไปด้วยกัน')}</div>
      <h2>{t('Find your rhythm.', 'เลือกจังหวะที่ใช่สำหรับคุณ')}</h2>
      <p className="section-intro">
        {t(
          'Start free. Make your process a daily habit.',
          'เริ่มใช้ฟรี แล้วสร้างระบบให้เป็นส่วนหนึ่งของทุกวัน',
        )}
      </p>
      <div
        className="billing-switch"
        role="group"
        aria-label={t('Billing period', 'รอบการชำระเงิน')}
      >
        <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
          {t('Monthly', 'รายเดือน')}
        </button>
        <button aria-pressed={annual} onClick={() => setAnnual(true)}>
          {t('Yearly', 'รายปี')} <span>{t('Save 16.7%', 'ประหยัด 16.7%')}</span>
        </button>
      </div>
      <div className="currency-controls">
        <label htmlFor="pricing-currency">{t('Currency', 'สกุลเงิน')}</label>
        <select
          id="pricing-currency"
          value={currency}
          onChange={(e) => {
            const value = e.target.value as 'THB' | 'USD';
            setSelectedCurrency(value);
            localStorage.setItem('tradovia.pricing.currency', value);
          }}
        >
          <option value="THB">THB · ฿</option>
          <option value="USD">USD · $</option>
        </select>
        <span>
          {t(
            'Fixed prices, not a live exchange rate',
            'ราคาที่กำหนดไว้ ไม่ใช่อัตราแลกเปลี่ยนสด',
          )}
        </span>
      </div>
      <div className="pricing-grid launch-pricing">
        <article className="price-card">
          <b>Free</b>
          <h3>
            {price.free}
            <small> / {t('forever', 'ตลอดไป')}</small>
          </h3>
          <p>
            {t(
              'A place to start your trading routine.',
              'พื้นที่เริ่มต้นสร้างระบบการเทรด',
            )}
          </p>
          <Link className="button ghost" href="/auth?view=signup">
            {t('Start free', 'เริ่มใช้ฟรี')}
            <ArrowUpRight size={16} />
          </Link>
          <ul>
            {[
              t('One portfolio', '1 พอร์ต'),
              t('Manual trade journal', 'บันทึกการเทรดด้วยตนเอง'),
              t('Calendar & core statistics', 'ปฏิทินและสถิติพื้นฐาน'),
              t('Position sizing tools', 'เครื่องมือคำนวณขนาดการเทรด'),
            ].map((x) => (
              <li key={x}>
                <Check size={15} />
                {x}
              </li>
            ))}
          </ul>
        </article>
        <article className="price-card featured">
          <div className="price-heading">
            <b>Pro</b>
            <span>{t('Launch plan', 'แพ็กเกจเปิดตัว')}</span>
          </div>
          <h3>
            {annual ? price.year : price.month}
            <small> / {annual ? t('year', 'ปี') : t('month', 'เดือน')}</small>
          </h3>
          <p>
            {annual
              ? t(
                  `${price.equivalent}/month equivalent · ${price.year} billed yearly`,
                  `เฉลี่ย ${price.equivalent}/เดือน · เรียกเก็บ ${price.year} ต่อปี`,
                )
              : t(
                  `${price.month} billed monthly`,
                  `เรียกเก็บ ${price.month} ทุกเดือน`,
                )}
          </p>
          <Link className="button ink" href="/auth?view=signup">
            {t('Try the free preview', 'ทดลองพรีวิวฟรี')}
            <ArrowUpRight size={16} />
          </Link>
          <ul>
            {[
              t('Everything in Free', 'ทุกฟีเจอร์ของ Free'),
              t('Multiple portfolios', 'จัดการหลายพอร์ต'),
              t(
                'Deeper reviews & strategy insights',
                'ทบทวนและวิเคราะห์กลยุทธ์เชิงลึก',
              ),
              t('Cloud storage at launch', 'เก็บข้อมูลบนคลาวด์เมื่อเปิดบริการ'),
            ].map((x) => (
              <li key={x}>
                <Check size={15} />
                {x}
              </li>
            ))}
          </ul>
        </article>
      </div>
      <p className="pricing-note">
        {t(
          `Proposed launch pricing in ${currency}. Preview access is free; no payment is collected. Pro features and usage limits will be confirmed before subscriptions open. AI and broker sync are not included in this preview.`,
          `ราคาเสนอสำหรับเปิดตัวในสกุล ${currency} พรีวิวใช้ฟรี ไม่มีการเรียกเก็บเงิน ฟีเจอร์และขีดจำกัดของ Pro จะยืนยันก่อนเปิดสมัครแบบชำระเงิน พรีวิวนี้ยังไม่รวม AI และการซิงก์โบรกเกอร์`,
        )}
      </p>
    </section>
  );
}
