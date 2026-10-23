import LegalPage, { type LegalSection } from '@/components/legal-page';

const sections: LegalSection[] = [
  {
    enTitle: 'The service',
    thTitle: 'ขอบเขตบริการ',
    en: [
      'Tradovia is a journaling, planning and historical analytics tool. It does not execute trades, hold customer funds, act as a broker or provide personalized investment advice.',
      'Market information, imported records and calculated statistics may be delayed, incomplete or affected by the data you provide. Verify important figures with your broker.',
    ],
    th: [
      'Tradovia เป็นเครื่องมือจดบันทึก วางแผน และวิเคราะห์ข้อมูลย้อนหลัง ไม่ได้ส่งคำสั่งซื้อขาย รับฝากเงิน ทำหน้าที่เป็นโบรกเกอร์ หรือให้คำแนะนำการลงทุนเฉพาะบุคคล',
      'ข้อมูลตลาด ข้อมูลนำเข้า และสถิติที่คำนวณอาจล่าช้า ไม่ครบถ้วน หรือขึ้นอยู่กับข้อมูลที่คุณระบุ โปรดตรวจสอบตัวเลขสำคัญกับโบรกเกอร์ของคุณ',
    ],
  },
  {
    enTitle: 'Your account and acceptable use',
    thTitle: 'บัญชีและการใช้งานที่เหมาะสม',
    en: [
      'Keep your login secure and provide accurate information. You are responsible for activity performed through your account.',
      'Do not misuse the service, probe other accounts, upload unlawful content, interfere with security controls or use Tradovia to facilitate fraud or market abuse.',
    ],
    th: [
      'โปรดรักษาข้อมูลเข้าสู่ระบบและให้ข้อมูลที่ถูกต้อง คุณรับผิดชอบกิจกรรมที่เกิดขึ้นผ่านบัญชีของคุณ',
      'ห้ามใช้บริการในทางที่ผิด พยายามเข้าถึงบัญชีอื่น อัปโหลดเนื้อหาที่ผิดกฎหมาย รบกวนระบบความปลอดภัย หรือใช้ Tradovia เพื่อสนับสนุนการฉ้อโกงและการบิดเบือนตลาด',
    ],
  },
  {
    enTitle: 'Plans, billing and cancellation',
    thTitle: 'แพ็กเกจ การชำระเงิน และการยกเลิก',
    en: [
      'Free and paid capabilities will be shown before checkout. Prices, renewal period, taxes and cancellation terms presented at checkout form part of these terms.',
      'No payment is collected in the current preview. Paid subscriptions will open only after billing controls and official support contact are enabled.',
    ],
    th: [
      'ระบบจะแสดงสิทธิของแพ็กเกจฟรีและแบบชำระเงินก่อนยืนยันซื้อ ราคา รอบต่ออายุ ภาษี และเงื่อนไขยกเลิกที่แสดงตอนชำระเงินถือเป็นส่วนหนึ่งของข้อกำหนดนี้',
      'พรีวิวปัจจุบันยังไม่มีการเรียกเก็บเงิน แพ็กเกจชำระเงินจะเปิดเมื่อระบบจัดการบิลและช่องทางช่วยเหลือทางการพร้อมแล้ว',
    ],
  },
  {
    enTitle: 'Availability and changes',
    thTitle: 'ความพร้อมใช้งานและการเปลี่ยนแปลง',
    en: [
      'We work to keep Tradovia reliable, but maintenance, providers, networks and software failures can interrupt access. Export important records regularly.',
      'Features and these terms may change as the product develops. Material changes will be communicated in the product before they take effect where practical.',
    ],
    th: [
      'เราพยายามให้ Tradovia ใช้งานได้อย่างต่อเนื่อง แต่การบำรุงรักษา ผู้ให้บริการ เครือข่าย และซอฟต์แวร์อาจทำให้เข้าใช้งานไม่ได้ชั่วคราว โปรดส่งออกข้อมูลสำคัญเป็นประจำ',
      'ฟีเจอร์และข้อกำหนดอาจเปลี่ยนแปลงตามการพัฒนาผลิตภัณฑ์ การเปลี่ยนแปลงสำคัญจะแจ้งในผลิตภัณฑ์ก่อนมีผลเมื่อสามารถทำได้',
    ],
  },
  {
    enTitle: 'Risk and responsibility',
    thTitle: 'ความเสี่ยงและความรับผิดชอบ',
    en: [
      'Trading involves substantial risk. You remain solely responsible for trading decisions, risk limits, broker settings and compliance with laws that apply to you.',
      'To the extent permitted by applicable law, Tradovia is provided without a guarantee of trading outcomes and is not liable for market losses resulting from decisions made using the service.',
    ],
    th: [
      'การเทรดมีความเสี่ยงสูง คุณเป็นผู้รับผิดชอบการตัดสินใจ ขอบเขตความเสี่ยง การตั้งค่าโบรกเกอร์ และการปฏิบัติตามกฎหมายที่เกี่ยวข้องกับคุณ',
      'ภายใต้ขอบเขตที่กฎหมายอนุญาต Tradovia ไม่รับประกันผลการเทรดและไม่รับผิดชอบต่อผลขาดทุนจากตลาดที่เกิดจากการตัดสินใจโดยใช้บริการ',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      titleEn="Terms of Service"
      titleTh="ข้อกำหนดการให้บริการ"
      introEn="These terms govern access to the Tradovia preview and future account workspace."
      introTh="ข้อกำหนดนี้ใช้กับการเข้าใช้พรีวิวและเวิร์กสเปซบัญชี Tradovia"
      sections={sections}
    />
  );
}
