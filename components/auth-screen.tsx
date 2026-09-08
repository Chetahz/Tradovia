'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Sun, Moon, ArrowUpRight } from 'lucide-react';
export default function AuthScreen({ signInUrl }: { signInUrl: string }) {
  const [th, setTh] = useState(false),
    [dark, setDark] = useState(false),
    [reset, setReset] = useState(false);
  const t = (en: string, thai: string) => (th ? thai : en);
  return (
    <main className={`auth-page ${dark ? 'dark' : ''}`} lang={th ? 'th' : 'en'}>
      <div className="actions">
        <Link className="brand" href="/">
          <span className="brand-mark">t</span>tradovia
        </Link>
        <button className="text-button" onClick={() => setTh(!th)}>
          {th ? 'EN' : 'TH'}
        </button>
        <button
          className="icon-button"
          onClick={() => setDark(!dark)}
          aria-label={t('Toggle theme', 'เปลี่ยนธีม')}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <section className="panel">
        <span className="eyebrow">
          {t('YOUR NEXT CHAPTER', 'ก้าวต่อไปของคุณ')}
        </span>
        <h1>{t('Make room for better trading.', 'เริ่มต้นการเทรดที่เป็นระบบ')}</h1>
        <p>
          {t(
            'Your manual journal, risk tools and portfolio in one connected workspace.',
            'บันทึกการเทรด เครื่องมือความเสี่ยง และพอร์ต เชื่อมต่อกันในพื้นที่เดียว',
          )}
        </p>
        <a href={signInUrl} target="_top" className="button ink">
          {t('Continue with ChatGPT', 'เข้าใช้งานผ่าน ChatGPT')}
          <ArrowUpRight size={17} />
        </a>
        <Link href="/demo" className="button ghost">
          {t('Explore the interactive demo', 'ลองใช้งานเดโม')} →
        </Link>
        <div className="auth-note">
          <b>
            {t(
              'Email, password & Google sign-in',
              'เข้าสู่ระบบด้วยอีเมล รหัสผ่าน หรือ Google',
            )}
          </b>
          <p>
            {t(
              'These sign-in methods will be available when the public identity provider is configured. This private preview uses secure ChatGPT sign-in.',
              'จะเปิดให้ใช้เมื่อเชื่อมต่อผู้ให้บริการบัญชีสำหรับเปิดตัวสาธารณะแล้ว พรีวิวส่วนตัวนี้ใช้การเข้าสู่ระบบผ่าน ChatGPT อย่างปลอดภัย',
            )}
          </p>
          <button className="text-button mt-4" onClick={() => setReset(!reset)}>
            {t('Password reset', 'การรีเซ็ตรหัสผ่าน')}
          </button>
          {reset && (
            <output>
              {t(
                'For this preview, manage your password through your ChatGPT account. Tradovia email recovery will activate with the public identity provider.',
                'สำหรับพรีวิวนี้ โปรดจัดการรหัสผ่านผ่านบัญชี ChatGPT การกู้คืนด้วยอีเมลของ Tradovia จะเปิดพร้อมระบบบัญชีสาธารณะ',
              )}
            </output>
          )}
        </div>
      </section>
      <Link href="/">← {t('Back to Tradovia', 'กลับหน้า Tradovia')}</Link>
    </main>
  );
}
