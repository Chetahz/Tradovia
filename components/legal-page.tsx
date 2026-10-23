'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export type LegalSection = {
  enTitle: string;
  thTitle: string;
  en: string[];
  th: string[];
};

export default function LegalPage({
  titleEn,
  titleTh,
  introEn,
  introTh,
  sections,
}: {
  titleEn: string;
  titleTh: string;
  introEn: string;
  introTh: string;
  sections: LegalSection[];
}) {
  const [th, setTh] = useState(true);
  useEffect(() => {
    document.documentElement.lang = th ? 'th' : 'en';
  }, [th]);
  return (
    <main className="legal-page" lang={th ? 'th' : 'en'}>
      <header>
        <Link prefetch={false} className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" /> tradovia
        </Link>
        <button className="text-button" onClick={() => setTh((value) => !value)}>
          {th ? 'EN' : 'TH'}
        </button>
      </header>
      <article>
        <span className="overline">TRADOVIA · LEGAL</span>
        <h1>{th ? titleTh : titleEn}</h1>
        <p className="legal-updated">
          {th ? 'ปรับปรุงล่าสุด 15 ตุลาคม 2026' : 'Last updated October 15, 2026'}
        </p>
        <p className="legal-intro">{th ? introTh : introEn}</p>
        {sections.map((section) => (
          <section key={section.enTitle}>
            <h2>{th ? section.thTitle : section.enTitle}</h2>
            {(th ? section.th : section.en).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
        <aside>
          {th
            ? 'เอกสารนี้เป็นฉบับเตรียมเปิดให้บริการ ช่องทางติดต่อทางการและข้อมูลผู้ประกอบการจะเพิ่มก่อนเปิดรับชำระเงิน'
            : 'This is a pre-launch document. The official support contact and operator details will be added before paid subscriptions open.'}
        </aside>
      </article>
      <footer>
        <Link prefetch={false} href="/privacy">{th ? 'ความเป็นส่วนตัว' : 'Privacy'}</Link>
        <Link prefetch={false} href="/terms">{th ? 'ข้อกำหนด' : 'Terms'}</Link>
        <Link prefetch={false} href="/">{th ? 'กลับหน้าแรก' : 'Back home'}</Link>
      </footer>
    </main>
  );
}
