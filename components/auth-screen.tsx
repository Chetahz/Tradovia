'use client';
import { useState } from 'react';
/* Native navigation avoids the Vinext client-router failure on this gateway. */
/* oxlint-disable nextjs/no-html-link-for-pages */
import { ArrowUpRight, ArrowLeft, ShieldCheck, BookOpen, ChartNoAxesCombined, Check } from 'lucide-react';

export default function AuthScreen({ signInUrl, error }: { signInUrl: string; error?: 'verify-email' | 'login-failed' }) {
  const [th, setTh] = useState(true);
  const t = (en: string, thai: string) => th ? thai : en;
  return <main className="auth-gateway" lang={th ? 'th' : 'en'}>
    <section className="auth-story" aria-label={t('Your trading journey', 'เส้นทางการเทรดของคุณ')}>
      <a className="brand" href="/"><span className="brand-mark" aria-hidden="true" />tradovia</a>
      <div className="auth-story-copy">
        <span className="auth-kicker">YOUR TRADES. YOUR GROWTH.</span>
        <h1>{t('Every trade tells you', 'ทุกการเทรด')}<br /><em>{t('something.', 'มีสิ่งให้เรียนรู้')}</em></h1>
        <p>{t('Make space to reflect, build your discipline, and see your progress with more clarity.', 'พื้นที่สำหรับทบทวน สร้างวินัย และมองเห็นพัฒนาการของคุณอย่างชัดเจน')}</p>
        <div className="auth-story-points">
          <span><BookOpen size={19} />{t('Keep your trading story', 'เก็บเรื่องราวทุกการเทรด')}</span>
          <span><ChartNoAxesCombined size={19} />{t('Learn from your own data', 'เรียนรู้จากข้อมูลของตัวเอง')}</span>
          <span><Check size={19} />{t('Build a consistent process', 'พัฒนากระบวนการอย่างสม่ำเสมอ')}</span>
        </div>
      </div>
      <span className="auth-story-footer">SAME MARKET. A CLEARER YOU.</span>
    </section>
    <section className="auth-entry">
      <nav className="auth-entry-nav" aria-label={t('Page controls', 'เมนูหน้าเข้าสู่ระบบ')}>
        <a href="/"><ArrowLeft size={16} />{t('Back to home', 'กลับหน้าแรก')}</a>
        <button className="text-button" onClick={() => setTh(!th)} aria-label={t('Switch to Thai', 'เปลี่ยนเป็นภาษาอังกฤษ')}>{th ? 'EN' : 'TH'}</button>
      </nav>
      <div className="auth-entry-card">
        <span className="auth-entry-icon"><ShieldCheck size={25} /></span>
        <span className="auth-kicker">YOUR PERSONAL WORKSPACE</span>
        <h2>{t('Welcome to Tradovia', 'ยินดีต้อนรับสู่ Tradovia')}</h2>
        <p className="auth-entry-intro">{t('Your plans, journal and progress. Together in one place.', 'แผนการเทรด บันทึก และพัฒนาการของคุณ เชื่อมต่อกันในพื้นที่เดียว')}</p>
        {error && <p className="auth-entry-error" role="alert">{error === 'verify-email'
          ? t('Verify your email, then sign in again.', 'โปรดยืนยันอีเมล แล้วเข้าสู่ระบบอีกครั้ง')
          : t('We could not complete sign-in. Please try again.', 'เข้าสู่ระบบไม่สำเร็จ โปรดลองอีกครั้ง')}</p>}
        <a href={signInUrl} className="button ink auth-primary">{t('Sign in to your workspace', 'เข้าสู่เวิร์กสเปซ')}<ArrowUpRight size={19} /></a>
        {/* Auth endpoints require a full server navigation. */}
        {/* oxlint-disable-next-line nextjs/no-html-link-for-pages */}
        <a href="/auth/signup" className="button ghost auth-secondary">{t('Create your account', 'สร้างบัญชีของคุณ')}</a>
        <p className="auth-secure-note"><ShieldCheck size={15} />{t('Continue securely with email or Google.', 'เข้าใช้งานอย่างปลอดภัยด้วยอีเมลหรือ Google')}</p>
        <div className="auth-entry-divider" />
        <a href="/demo" className="auth-demo-link">{t('Explore the demo first', 'ลองสำรวจเดโมก่อน')}<ArrowUpRight size={16} /></a>
        <details className="auth-help"><summary>{t('Need help signing in?', 'ต้องการความช่วยเหลือในการเข้าสู่ระบบ?')}</summary><p>{t('Forgot your password? Choose Sign in, then Reset password. For a new email account, verify your email before continuing.', 'หากลืมรหัสผ่าน ให้กดเข้าสู่เวิร์กสเปซ แล้วเลือก Reset password หากสมัครด้วยอีเมลใหม่ โปรดยืนยันอีเมลก่อนเริ่มใช้งาน')}</p></details>
      </div>
      <p className="auth-entry-footer">{t('A little more perspective. Every day.', 'มองเห็นชัดขึ้นอีกนิด ในทุกวัน')}</p>
    </section>
  </main>;
}
