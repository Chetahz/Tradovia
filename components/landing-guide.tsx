import Link from 'next/link';
import {
  ArrowUpRight,
  ShieldCheck,
  ChartNoAxesCombined,
  ListChecks,
  Upload,
} from 'lucide-react';

export function LandingGuide({ th }: { th: boolean }) {
  const t = (en: string, thai: string) => (th ? thai : en);
  const steps = [
    {
      Icon: ListChecks,
      title: t('Build your Playbook.', 'สร้าง Playbook ของคุณ'),
      description: t(
        'Turn your setup and rules into a checklist you can follow and measure.',
        'เปลี่ยน Setup และกฎของคุณให้เป็นเช็กลิสต์ที่ทำตามและวัดผลได้',
      ),
      link: '/demo#playbook',
      action: t('Explore Playbook', 'ดู Playbook'),
    },
    {
      Icon: ShieldCheck,
      title: t('Plan the risk.', 'วางแผนความเสี่ยง'),
      description: t(
        'Check position size and risk before entry so every trade starts with a clear boundary.',
        'ตรวจขนาดสัญญาและความเสี่ยงก่อนเข้า เพื่อให้ทุกไม้เริ่มด้วยขอบเขตที่ชัดเจน',
      ),
      link: '/demo#risk',
      action: t('Try the calculator', 'ลองคำนวณความเสี่ยง'),
    },
    {
      Icon: Upload,
      title: t('Record or import.', 'บันทึกหรือนำเข้า'),
      description: t(
        'Add the trade yourself or preview an MT5 report before bringing its closed positions into your journal.',
        'เพิ่มเทรดด้วยตัวเอง หรือตรวจรายงาน MT5 ก่อนนำรายการที่ปิดแล้วเข้าสู่ Journal',
      ),
      link: '/demo#journal',
      action: t('Explore the journal', 'เปิดบันทึกการเทรด'),
    },
    {
      Icon: ChartNoAxesCombined,
      title: t('Review and improve.', 'ทบทวนแล้วพัฒนา'),
      description: t(
        'Compare your process with the outcome, then open the exact trades behind every pattern.',
        'เทียบกระบวนการกับผลลัพธ์ แล้วเปิดดูเทรดจริงเบื้องหลังรูปแบบที่พบ',
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
          'Four connected steps. One place to keep your process.',
          'สี่ขั้นตอนที่เชื่อมถึงกัน ในพื้นที่เดียว',
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
        'No. Record trades manually or import closed positions from an MT5 XLSX or HTML report. Automatic broker sync is not available in this preview; supported connections and account limits will be confirmed later.',
        'ไม่จำเป็น คุณบันทึกเทรดด้วยตนเอง หรือนำเข้า Positions ที่ปิดแล้วจากรายงาน MT5 แบบ XLSX หรือ HTML ได้ พรีวิวนี้ยังไม่มีการซิงก์โบรกเกอร์อัตโนมัติ โดยจะยืนยันบริการที่รองรับและจำนวนบัญชีภายหลัง',
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
        'Yes. The journal, Playbook, calendar, analytics and risk tools adapt to mobile screens. You can also add the website to your home screen; no App Store installation is required.',
        'ได้ ทั้ง Journal, Playbook, ปฏิทิน การวิเคราะห์ และเครื่องมือความเสี่ยงปรับตามหน้าจอมือถือ และเพิ่มเว็บไซต์ไว้บนหน้าจอหลักได้โดยไม่ต้องติดตั้งผ่าน App Store',
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
        'Yes. Preview and import closed positions from MT5 account-history reports in XLSX or HTML format, or use the Tradovia CSV template. Duplicate rows are checked before confirmation, and journal entries can be exported as CSV. Automatic broker sync is planned for a later phase.',
        'ได้ คุณตรวจและนำเข้า Positions ที่ปิดแล้วจากรายงานประวัติบัญชี MT5 แบบ XLSX หรือ HTML รวมถึงแม่แบบ CSV ของ Tradovia ระบบจะตรวจรายการซ้ำก่อนยืนยัน และส่งออก Journal เป็น CSV ได้ ส่วนการซิงก์โบรกเกอร์อัตโนมัติจะพัฒนาในระยะถัดไป',
      ),
    ],
    [
      t('What can I learn from Analytics?', 'Analytics ช่วยให้เรียนรู้อะไรได้บ้าง?'),
      t(
        'Start with equity, expectancy and win/loss outcomes, then compare Playbooks, sessions, instruments, risk and execution behavior in Deep Analysis. Every breakdown links back to its source trades so you can verify the context behind the number.',
        'เริ่มจากมูลค่าพอร์ต Expectancy และสัดส่วนชนะ–แพ้ แล้วเปรียบเทียบ Playbook ช่วงเวลา สินทรัพย์ ความเสี่ยง และพฤติกรรมการเทรดใน Deep Analysis โดยทุกผลวิเคราะห์เปิดกลับไปดูรายการเทรดต้นทางได้',
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
