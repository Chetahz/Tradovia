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
      <div className="eyebrow" data-reveal>
        {t('A ROUTINE YOU CAN RETURN TO', 'กระบวนการที่กลับมาใช้ได้ทุกวัน')}
      </div>
      <h2 className="reveal-delay-1" data-reveal>
        {t('From intention to insight.', 'จากแผน สู่ความเข้าใจ')}
      </h2>
      <p className="section-intro reveal-delay-2" data-reveal>
        {t(
          'Four connected steps. One place to keep your process.',
          'สี่ขั้นตอนที่เชื่อมถึงกัน ในพื้นที่เดียว',
        )}
      </p>
      <div className="guide-grid">
        {steps.map(({ Icon, title, description, link, action }, i) => (
          <article key={link} data-reveal>
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
        'No. Record trades manually on Free, or use Pro to import closed positions from an MT5 XLSX or HTML report. Tradovia does not ask for your broker password.',
        'ไม่จำเป็น Free บันทึกเทรดด้วยตนเองได้ ส่วน Pro นำเข้า Positions ที่ปิดแล้วจากรายงาน MT5 แบบ XLSX หรือ HTML ได้ โดย Tradovia ไม่ขอรหัสผ่านโบรกเกอร์',
      ),
    ],
    [
      t(
        'What is the difference between Free and Pro?',
        'Free กับ Pro ต่างกันอย่างไร?',
      ),
      t(
        'Free includes one portfolio, 50 manual trades and core tools. Pro unlocks complete history, multiple portfolios, report import and deeper analysis. MT5 Auto Sync will belong to a future third plan.',
        'Free ใช้ได้ 1 พอร์ต บันทึกเอง 50 รายการ ปฏิทินย้อนหลัง 30 วัน และเครื่องมือพื้นฐาน ส่วน Pro ปลดล็อกหลายพอร์ต ประวัติทั้งหมด การนำเข้ารายงาน และการวิเคราะห์เชิงลึก โดย MT5 Auto Sync จะอยู่ในแพ็กเกจระดับ 3 ในอนาคต',
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
      t('Where is my preview data stored?', 'ข้อมูลเก็บที่ไหน และใช้ข้ามเครื่องได้ไหม?'),
      t(
        'Your signed-in workspace saves data to your account on the server, so you can access it from another device by signing in to the same account. The demo is separate and is not your personal workspace. Sign-up, email verification and password recovery use Auth0.',
        'เวิร์กสเปซหลังเข้าสู่ระบบบันทึกข้อมูลของบัญชีคุณบนเซิร์ฟเวอร์ ใช้ข้ามเครื่องได้โดยเข้าสู่บัญชีเดิม ส่วนเดโมแยกจากเวิร์กสเปซส่วนตัว การสมัคร ยืนยันอีเมล และกู้รหัสผ่านใช้ระบบ Auth0 จริง',
      ),
    ],
    [
      t('Can I import or export my trades?', 'นำเข้าและส่งออกข้อมูลได้ไหม?'),
      t(
        'Both plans can export the journal as CSV or JSON. Pro also imports closed positions from MT5 XLSX or HTML reports and the Tradovia CSV template.',
        'ทั้ง Free และ Pro ส่งออก Journal เป็น CSV หรือ JSON ได้ ส่วน Pro เพิ่มการนำเข้า Positions ที่ปิดแล้วจากรายงาน MT5 แบบ XLSX หรือ HTML และแม่แบบ CSV ของ Tradovia',
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
        'The founding Pro prices are ฿129/month or ฿1,290/year. Yearly billing is one payment for the full year, saving about 16.7% versus twelve monthly payments. Launch billing is in THB; more currencies can be added later. The current preview uses Stripe Sandbox and does not collect real payments.',
        'ราคาผู้ใช้กลุ่มแรกของ Pro คือ ฿129/เดือน หรือ ฿1,290/ปี รายปีชำระยอดทั้งปีครั้งเดียว ประหยัดประมาณ 16.7% เมื่อเทียบกับรายเดือน 12 ครั้ง ช่วงเปิดตัวจะชำระเป็นบาท และจะเพิ่มสกุลเงินอื่นได้ภายหลัง พรีวิวปัจจุบันใช้ Stripe Sandbox และไม่มีการเรียกเก็บเงินจริง',
      ),
    ],
  ];
  return (
    <section className="land-section landing-faq" id="faq">
      <div className="faq-intro" data-reveal>
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
          <details key={i} data-reveal>
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
