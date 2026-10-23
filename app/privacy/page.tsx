import LegalPage, { type LegalSection } from '@/components/legal-page';

const sections: LegalSection[] = [
  {
    enTitle: 'Information Tradovia processes',
    thTitle: 'ข้อมูลที่ Tradovia ประมวลผล',
    en: [
      'Tradovia processes account identity, profile preferences, portfolios, journal entries, playbooks, review answers, imported trade history and images you choose to upload.',
      'We also process limited technical and operational records needed to secure sessions, diagnose failures and prevent abuse.',
    ],
    th: [
      'Tradovia ประมวลผลข้อมูลบัญชี การตั้งค่า โปรไฟล์ พอร์ต บันทึกการเทรด Playbook คำตอบการทบทวน ประวัติเทรดที่คุณนำเข้า และรูปภาพที่คุณเลือกอัปโหลด',
      'ระบบประมวลผลข้อมูลทางเทคนิคเท่าที่จำเป็นสำหรับรักษาความปลอดภัยของเซสชัน ตรวจสอบข้อผิดพลาด และป้องกันการใช้งานที่ไม่เหมาะสม',
    ],
  },
  {
    enTitle: 'How the information is used',
    thTitle: 'วัตถุประสงค์การใช้งาน',
    en: [
      'Your data powers your journal, calculations, calendar, reviews and analytics. Tradovia does not sell personal information or use private journal content for advertising.',
      'Analytics describe your own historical records. They are not investment advice, trade signals or predictions.',
    ],
    th: [
      'ข้อมูลของคุณใช้เพื่อแสดงบันทึก การคำนวณ ปฏิทิน การทบทวน และการวิเคราะห์ Tradovia ไม่ขายข้อมูลส่วนบุคคลหรือใช้เนื้อหาในบันทึกส่วนตัวเพื่อการโฆษณา',
      'ผลวิเคราะห์อธิบายข้อมูลในอดีตของคุณ ไม่ใช่คำแนะนำการลงทุน สัญญาณซื้อขาย หรือการคาดการณ์',
    ],
  },
  {
    enTitle: 'Storage and service providers',
    thTitle: 'การจัดเก็บและผู้ให้บริการ',
    en: [
      'Application data and private images are stored with Cloudflare. Authentication is provided by Auth0. If paid plans open, payment details will be handled by the payment provider and Tradovia will retain only identifiers and billing status needed to manage the subscription.',
      'Providers process data only to deliver their contracted service and are subject to their own security and privacy terms.',
    ],
    th: [
      'ข้อมูลแอปและรูปภาพส่วนตัวจัดเก็บผ่าน Cloudflare ส่วนการยืนยันตัวตนให้บริการโดย Auth0 เมื่อเปิดแพ็กเกจชำระเงิน ข้อมูลการชำระเงินจะจัดการโดยผู้ให้บริการชำระเงิน และ Tradovia จะเก็บเฉพาะรหัสอ้างอิงกับสถานะบิลที่จำเป็น',
      'ผู้ให้บริการประมวลผลข้อมูลเพื่อให้บริการตามหน้าที่ของตน และอยู่ภายใต้มาตรการความปลอดภัยกับนโยบายของผู้ให้บริการนั้น',
    ],
  },
  {
    enTitle: 'Control, export and deletion',
    thTitle: 'การควบคุม ส่งออก และลบข้อมูล',
    en: [
      'You can export workspace data and trade CSV files from Settings. You can also permanently delete Tradovia profile data, journals, plans, settings and uploaded images from Account & Security.',
      'Some minimal transaction or security records may be retained when required by law, fraud prevention or dispute resolution. These records are restricted and are not used to rebuild your journal.',
    ],
    th: [
      'คุณส่งออกข้อมูลเวิร์กสเปซและไฟล์ CSV ได้จากหน้าตั้งค่า และลบข้อมูลโปรไฟล์ บันทึก แผน การตั้งค่า และรูปภาพอย่างถาวรได้จากส่วนบัญชีและความปลอดภัย',
      'ข้อมูลธุรกรรมหรือข้อมูลความปลอดภัยบางส่วนอาจต้องเก็บไว้ตามกฎหมาย เพื่อป้องกันการทุจริต หรือระงับข้อพิพาท โดยจะถูกจำกัดการเข้าถึงและไม่นำไปสร้างบันทึกของคุณกลับมา',
    ],
  },
  {
    enTitle: 'Security and children',
    thTitle: 'ความปลอดภัยและผู้เยาว์',
    en: [
      'Tradovia uses encrypted, HTTP-only sessions, account-scoped database access and private image storage. No online service can guarantee absolute security.',
      'Tradovia is intended for adults who are legally able to use trading-related tools. It is not directed to children.',
    ],
    th: [
      'Tradovia ใช้เซสชันแบบเข้ารหัสและ HTTP-only แยกการเข้าถึงข้อมูลตามบัญชี และจัดเก็บรูปภาพแบบส่วนตัว อย่างไรก็ตาม ไม่มีบริการออนไลน์ใดรับประกันความปลอดภัยได้ทั้งหมด',
      'Tradovia มีไว้สำหรับผู้ใหญ่ที่สามารถใช้เครื่องมือเกี่ยวกับการเทรดได้ตามกฎหมาย และไม่ได้จัดทำขึ้นสำหรับเด็ก',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      titleEn="Privacy Policy"
      titleTh="นโยบายความเป็นส่วนตัว"
      introEn="This policy explains what Tradovia processes and the choices available to you."
      introTh="นโยบายนี้อธิบายข้อมูลที่ Tradovia ประมวลผลและสิทธิในการควบคุมข้อมูลของคุณ"
      sections={sections}
    />
  );
}
