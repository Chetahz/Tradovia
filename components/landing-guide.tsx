import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  ShieldCheck,
  ChartNoAxesCombined,
} from 'lucide-react';

export function LandingGuide({ th }: { th: boolean }) {
  const t = (en: string, thai: string) => (th ? thai : en);
  const steps = [
    {
      Icon: ShieldCheck,
      title: t('Plan your risk.', 'วางแผนความเสี่ยง'),
      description: t(
        'Choose your risk budget and check your position size before the entry.',
        'กำหนดงบความเสี่ยงและตรวจขนาดการเทรดก่อนเข้าไม้',
      ),
      link: '/demo#risk',
      action: t('Try the calculator', 'ลองคำนวณความเสี่ยง'),
    },
    {
      Icon: BookOpen,
      title: t('Capture the trade.', 'บันทึกสิ่งที่เกิดขึ้น'),
      description: t(
        'Keep execution, fees, chart images and the reason behind your decision together.',
        'เก็บข้อมูลเข้าเทรด ค่าธรรมเนียม ภาพกราฟ และเหตุผลตัดสินใจไว้ด้วยกัน',
      ),
      link: '/demo#journal',
      action: t('Explore the journal', 'เปิดบันทึกการเทรด'),
    },
    {
      Icon: ChartNoAxesCombined,
      title: t('Learn from your history.', 'ทบทวนจากข้อมูลของคุณ'),
      description: t(
        'Open the trades behind each breakdown. See the context behind the numbers.',
        'กดจากสถิติไปดูรายการเทรดต้นทาง เพื่อเข้าใจบริบทเบื้องหลังตัวเลข',
      ),
      link: '/demo#analytics',
      action: t('See the analysis', 'ดูผลวิเคราะห์'),
    },
  ];
  return (
    <section className="land-section landing-guide" id="how-it-works">
      <div className="eyebrow">
        {t('A ROUTINE YOU CAN RETURN TO', 'กระบวนการที่กลับมาใช้ได้ทุกวัน')}
      </div>
      <h2>{t('From intention to insight.', 'จากแผน สู่ความเข้าใจ')}</h2>
      <p className="section-intro">
        {t(
          'Three connected steps. One place to keep your process.',
          'สามขั้นตอนที่เชื่อมถึงกัน ในพื้นที่เดียว',
        )}
      </p>
      <div className="guide-grid">
        {steps.map(({ Icon, title, description, link, action }, i) => (
          <article key={link}>
            <div className="guide-step">
              <span>0{i + 1}</span>
              <Icon size={24} strokeWidth={1.5} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            <Link href={link}>
              {action}
              <ArrowUpRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LandingFAQ({ th }: { th: boolean }) {
  const t = (en: string, thai: string) => (th ? thai : en);
  const items = [
    [
      t('Do I need to connect a broker?', 'ต้องเชื่อมโบรกเกอร์ก่อนหรือไม่?'),
      t(
        'No. You can record trades manually and explore risk tools and analytics. Automatic broker sync is not available in this preview; supported connections and account limits will be confirmed later.',
        'ไม่จำเป็น คุณบันทึกเทรดด้วยตนเองและลองใช้เครื่องมือความเสี่ยงกับการวิเคราะห์ได้ พรีวิวนี้ยังไม่มีการซิงก์โบรกเกอร์อัตโนมัติ โดยจะยืนยันบริการที่รองรับและจำนวนบัญชีภายหลัง',
      ),
    ],
    [
      t(
        'What is the difference between Free and Pro?',
        'Free กับ Pro ต่างกันอย่างไร?',
      ),
      t(
        'Free is designed for one portfolio, manual journaling and core tools. Pro is planned for multiple portfolios, deeper reviews and cloud storage. The preview is free to explore; final limits will be shown before paid subscriptions open.',
        'Free วางไว้สำหรับหนึ่งพอร์ต การบันทึกด้วยตนเอง และเครื่องมือพื้นฐาน ส่วน Pro วางไว้สำหรับหลายพอร์ต การทบทวนเชิงลึก และพื้นที่เก็บข้อมูลบนคลาวด์ ตอนนี้พรีวิวใช้ฟรี โดยจะระบุขีดจำกัดให้ชัดเจนก่อนเปิดรับชำระเงิน',
      ),
    ],
    [
      t('Can I use Tradovia on my phone?', 'ใช้ Tradovia บนมือถือได้ไหม?'),
      t(
        'Yes. Open the website in your phone’s browser to explore the journal, calendar and risk tools. No app installation is required.',
        'ได้ เปิดเว็บไซต์ผ่านเบราว์เซอร์บนมือถือเพื่อลองใช้บันทึกการเทรด ปฏิทิน และเครื่องมือความเสี่ยง โดยไม่ต้องติดตั้งแอป',
      ),
    ],
    [
      t(
        'Where is my preview data stored?',
        'ข้อมูลพรีวิวเก็บที่ไหน และใช้ข้ามเครื่องได้ไหม?',
      ),
      t(
        'Preview data is stored in this browser on this device. It does not sync across devices and can be lost if browser data is cleared. Sample demo trades and your onboarding workspace are separate. Account creation, email verification and password recovery are simulated.',
        'ข้อมูลพรีวิวเก็บในเบราว์เซอร์ของอุปกรณ์นี้ ยังไม่ซิงก์ข้ามเครื่องและอาจหายเมื่อล้างข้อมูลเบราว์เซอร์ พอร์ตที่สร้างผ่านขั้นตอนเริ่มใช้จะแยกจากข้อมูลเดโมตัวอย่าง ส่วนการสมัคร ยืนยันอีเมล และกู้รหัสผ่านเป็นการจำลอง',
      ),
    ],
    [
      t('Can I import or export my trades?', 'นำเข้าและส่งออกข้อมูลได้ไหม?'),
      t(
        'You can export journal entries as CSV. Trade entry is currently manual; importing broker files and automatic sync will be added in a later phase.',
        'คุณส่งออกรายการใน Journal เป็น CSV ได้ ปัจจุบันเพิ่มเทรดด้วยตนเอง ส่วนการนำเข้าไฟล์จากโบรกเกอร์และการซิงก์อัตโนมัติจะพัฒนาในลำดับถัดไป',
      ),
    ],
    [
      t(
        'How do monthly and yearly plans work?',
        'รายเดือน รายปี และสกุลเงินต่างกันอย่างไร?',
      ),
      t(
        'The proposed Pro prices are ฿199/month or ฿1,990/year, and $5.99/month or $59.90/year. Yearly billing is one payment for the full year, saving about 16.7% versus twelve monthly payments. Choose THB or USD independently of language. No payments are collected in the preview; renewal and cancellation terms will be confirmed before launch.',
        'ราคาเสนอของ Pro คือ ฿199/เดือน หรือ ฿1,990/ปี และ $5.99/เดือน หรือ $59.90/ปี รายปีชำระยอดทั้งปีครั้งเดียว ประหยัดประมาณ 16.7% เมื่อเทียบกับรายเดือน 12 ครั้ง คุณเลือก THB หรือ USD แยกจากภาษาได้ พรีวิวยังไม่เรียกเก็บเงิน โดยจะยืนยันเงื่อนไขต่ออายุและยกเลิกก่อนเปิดบริการ',
      ),
    ],
  ];
  return (
    <section className="land-section landing-faq" id="faq">
      <div className="faq-intro">
        <div className="eyebrow">{t('BEFORE YOU BEGIN', 'ก่อนเริ่มใช้งาน')}</div>
        <h2>{t('A little more clarity.', 'คำตอบก่อนเริ่มต้น')}</h2>
        <p className="section-intro">
          {t('What to expect from Tradovia today.', 'รู้จักสิ่งที่คุณลองใช้ได้ในวันนี้')}
        </p>
        <Link className="button ghost" href="/demo">
          {t('Explore the free demo', 'ลองเดโมฟรี')}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="faq-list">
        {items.map(([question, answer], i) => (
          <details key={i}>
            <summary>
              {question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
