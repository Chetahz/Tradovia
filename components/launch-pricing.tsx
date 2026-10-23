'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import PlanComparison from './plan-comparison';

export default function LaunchPricing({ th }: { th: boolean }) {
  const [annual, setAnnual] = useState(false);
  const price = {
    month: '฿129',
    year: '฿1,290',
    equivalent: '฿107.50',
    free: '฿0',
  };
  const t = (en: string, thai: string) => (th ? thai : en);
  return (
    <section className="land-section" id="pricing">
      <div className="eyebrow" data-reveal>
        {t('ROOM TO GROW', 'เติบโตไปด้วยกัน')}
      </div>
      <h2 className="reveal-delay-1" data-reveal>
        {t('Find your rhythm.', 'เลือกจังหวะที่ใช่สำหรับคุณ')}
      </h2>
      <p className="section-intro reveal-delay-2" data-reveal>
        {t(
          'Start free. Make your process a daily habit.',
          'เริ่มใช้ฟรี แล้วสร้างระบบให้เป็นส่วนหนึ่งของทุกวัน',
        )}
      </p>
      <fieldset className="billing-switch" data-reveal>
        <legend className="sr-only">
          {t('Billing period', 'รอบการชำระเงิน')}
        </legend>
        <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
          {t('Monthly', 'รายเดือน')}
        </button>
        <button aria-pressed={annual} onClick={() => setAnnual(true)}>
          {t('Yearly', 'รายปี')} <span>{t('Save 16.7%', 'ประหยัด 16.7%')}</span>
        </button>
      </fieldset>
      <div className="currency-controls reveal-delay-1" data-reveal>
        <strong>{t('Launch currency', 'สกุลเงินเปิดตัว')}</strong>
        <b>THB · ฿</b>
        <span>
          {t(
            'Thailand launch pricing. More currencies can be added later.',
            'ราคาเปิดตัวสำหรับไทย สกุลเงินอื่นจะเพิ่มภายหลัง',
          )}
        </span>
      </div>
      <div className="pricing-grid launch-pricing">
        <article className="price-card" data-reveal>
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
          <Link className="button ghost" href="/demo">
            {t('Explore the free preview', 'ทดลองพรีวิวฟรี')}
            <ArrowUpRight size={16} />
          </Link>
          <ul>
            {[
              t('One portfolio', '1 พอร์ต'),
              t('50 manual trades & 2 Playbooks', 'บันทึกเอง 50 ไม้ และ 2 Playbook'),
              t('30-day calendar & core statistics', 'ปฏิทิน 30 วันและสถิติพื้นฐาน'),
              t('Position sizing tools', 'เครื่องมือคำนวณขนาดการเทรด'),
              t('Export your data anytime', 'ส่งออกข้อมูลของคุณได้เสมอ'),
            ].map((x) => (
              <li key={x}>
                <Check size={15} />
                {x}
              </li>
            ))}
          </ul>
        </article>
        <article className="price-card featured" data-reveal>
          <div className="price-heading">
            <b>Pro</b>
            <span>{t('Founding price', 'ราคาผู้ใช้กลุ่มแรก')}</span>
          </div>
          <h3>
            {annual ? price.year : price.month}
            <small> / {annual ? t('year', 'ปี') : t('month', 'เดือน')}</small>
          </h3>
          <p>
            {annual
                ? t(
                  `${price.equivalent}/month equivalent · proposed ${price.year}/year`,
                  `เฉลี่ย ${price.equivalent}/เดือน · ราคาเสนอ ${price.year} ต่อปี`,
                )
              : t(
                  `Proposed price: ${price.month}/month`,
                  `ราคาเสนอ ${price.month} ต่อเดือน`,
                )}
          </p>
          <Link className="button ink" href="/demo">
            {t('Explore the live demo', 'ลองใช้งานเดโม')}
            <ArrowUpRight size={16} />
          </Link>
          <ul>
            {[
              t('Everything in Free', 'ทุกฟีเจอร์ของ Free'),
              t('Up to 20 portfolios & complete journal history', 'สูงสุด 20 พอร์ตและดูประวัติบันทึกทั้งหมด'),
              t('MT5 report & CSV import', 'นำเข้ารายงาน MT5 และ CSV'),
              t(
                'Deeper reviews & strategy insights',
                'ทบทวนและวิเคราะห์กลยุทธ์เชิงลึก',
              ),
              t(
                'Full reports, Trade Gallery & advanced widgets',
                'รายงานเต็ม Trade Gallery และวิดเจ็ตขั้นสูง',
              ),
            ].map((x) => (
              <li key={x}>
                <Check size={15} />
                {x}
              </li>
            ))}
          </ul>
        </article>
      </div>
      <PlanComparison t={t} />
      <p className="pricing-note">
        {t(
          'Founding prices are shown in THB. Preview access remains free; Stripe Sandbox is used while billing is tested, so no real payment is collected.',
          'ราคาผู้ใช้กลุ่มแรกแสดงเป็นบาท พรีวิวยังใช้ได้ฟรี และระหว่างทดสอบระบบใช้ Stripe Sandbox จึงไม่เรียกเก็บเงินจริง',
        )}
      </p>
    </section>
  );
}
