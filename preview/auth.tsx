import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Mail,
  Moon,
  Sun,
  Wallet,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { createPreviewWorkspace, hasPreviewWorkspace } from './storage';
import './auth.css';

type Screen =
  | 'signin'
  | 'signup'
  | 'forgot'
  | 'sent'
  | 'reset'
  | 'done'
  | 'verify'
  | 'setup';
export default function PreviewAuth() {
  const initial = new URLSearchParams(location.search).get('view');
  const [screen, setScreen] = useState<Screen>(
    initial === 'signup' ? 'signup' : 'signin',
  );
  const [th, setTh] = useState(
    () => localStorage.getItem('tradovia.language') === 'th',
  );
  const [dark, setDark] = useState(
    () => localStorage.getItem('tradovia.theme') === 'dark',
  );
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [portfolio, setPortfolio] = useState('');
  const [balance, setBalance] = useState('10000');
  const [timezone, setTimezone] = useState('Asia/Bangkok');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const t = (en: string, thai: string) => (th ? thai : en);
  useEffect(() => {
    localStorage.setItem('tradovia.language', th ? 'th' : 'en');
    localStorage.setItem('tradovia.theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.lang = th ? 'th' : 'en';
    return () => document.documentElement.classList.remove('dark');
  }, [th, dark]);
  function go(next: Screen) {
    setScreen(next);
    setError('');
    setPassword('');
    setRepeat('');
    setVisible(false);
  }
  async function enter() {
    sessionStorage.setItem('tradovia.preview.session', 'active');
    if (await hasPreviewWorkspace()) location.assign('/workspace');
    else go('setup');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (screen === 'signup') {
        if (!name.trim())
          throw Error(t('Please enter your name.', 'กรุณาระบุชื่อ'));
        go('verify');
      } else if (screen === 'signin') await enter();
      else if (screen === 'forgot') go('sent');
      else if (screen === 'reset') {
        if (password !== repeat)
          throw Error(t('Passwords do not match.', 'รหัสผ่านไม่ตรงกัน'));
        go('done');
      } else if (screen === 'setup') {
        if (step === 0 && !name.trim())
          throw Error(t('Please enter your name.', 'กรุณาระบุชื่อ'));
        if (
          step === 1 &&
          (!portfolio.trim() ||
            !Number.isFinite(Number(balance)) ||
            Number(balance) < 0)
        )
          throw Error(
            t(
              'Check your portfolio name and balance.',
              'กรุณาตรวจสอบชื่อพอร์ตและยอดเริ่มต้น',
            ),
          );
        if (step < 2) setStep(step + 1);
        else {
          await createPreviewWorkspace(
            name.trim(),
            portfolio.trim(),
            Number(balance),
            timezone,
          );
          sessionStorage.setItem('tradovia.preview.session', 'active');
          location.assign('/workspace');
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('Unable to save. Please try again.', 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'),
      );
    } finally {
      setBusy(false);
    }
  }
  const title = {
    signin: t('Welcome back.', 'ยินดีต้อนรับกลับมา'),
    signup: t('Your next chapter.', 'เริ่มต้นบทใหม่ของคุณ'),
    forgot: t('Let’s get you back in.', 'กลับเข้าเวิร์กสเปซของคุณ'),
    sent: t('Check your inbox.', 'ตรวจสอบอีเมลของคุณ'),
    reset: t('A fresh start.', 'ตั้งรหัสผ่านใหม่'),
    done: t('You’re ready to return.', 'พร้อมกลับเข้าใช้งาน'),
    verify: t('One small step.', 'อีกเพียงขั้นตอนเดียว'),
    setup: [
      t('Make it yours.', 'เริ่มจากตัวคุณ'),
      t('Give your trades a home.', 'สร้างพื้นที่ให้การเทรด'),
      t('Ready for your first trade.', 'พร้อมบันทึกเทรดแรก'),
    ][step],
  }[screen];
  return (
    <main
      className={`preview-auth ${dark ? 'dark' : ''}`}
      lang={th ? 'th' : 'en'}
    >
      <header className="auth-nav">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          tradovia
        </a>
        <div className="actions">
          <button className="text-button" onClick={() => setTh(!th)}>
            {th ? 'EN' : 'TH'}
          </button>
          <button
            className="icon-button"
            aria-label={t('Toggle theme', 'เปลี่ยนธีม')}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <div className="auth-layout">
        <aside className="auth-story">
          <span className="eyebrow">YOUR TRADING. CONNECTED.</span>
          <h1>
            {t('A little clarity.', 'มองชัดขึ้น')}
            <br />
            <span>{t('Every single day.', 'ในทุกวันของการเทรด')}</span>
          </h1>
          <p>
            {t(
              'A calm place to plan, record and understand your trading.',
              'พื้นที่สำหรับวางแผน บันทึก และเข้าใจการเทรดของคุณ',
            )}
          </p>
          <div className="auth-journey">
            {[
              [BookOpen, t('Capture your thinking', 'บันทึกแนวคิดของคุณ')],
              [ShieldCheck, t('Keep your process close', 'รักษาวินัยตามแผน')],
              [Wallet, t('See the bigger picture', 'มองเห็นภาพรวมของพอร์ต')],
            ].map(([Icon, label], i) => {
              const Symbol = Icon as typeof Wallet;
              return (
                <div key={i}>
                  <span>
                    <Symbol size={20} />
                  </span>
                  {label as string}
                  <Check size={15} />
                </div>
              );
            })}
          </div>
          <a href="/demo" className="auth-demo-link">
            {t('Take a look around first', 'ลองสำรวจเดโมก่อน')}{' '}
            <ArrowRight size={16} />
          </a>
        </aside>
        <section className="auth-form-card" aria-labelledby="auth-title">
          {screen === 'setup' ? (
            <div
              className="setup-steps"
              aria-label={t('Setup progress', 'ความคืบหน้า')}
            >
              {[
                t('You', 'ตัวคุณ'),
                t('Portfolio', 'พอร์ต'),
                t('Ready', 'พร้อมแล้ว'),
              ].map((label, i) => (
                <span
                  key={label}
                  aria-current={i === step ? 'step' : undefined}
                  className={i <= step ? 'active' : ''}
                >
                  <b>{i < step ? <Check size={13} /> : i + 1}</b>
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <span className="eyebrow">
              {t('YOUR WORKSPACE AWAITS', 'เวิร์กสเปซของคุณรออยู่')}
            </span>
          )}
          <h2 id="auth-title">{title}</h2>
          <p className="auth-lead">
            {screen === 'signin'
              ? t(
                  'Continue your trading routine.',
                  'กลับมาดูแลกระบวนการเทรดของคุณ',
                )
              : screen === 'signup'
                ? t(
                    'Start free. Build a process that’s yours.',
                    'เริ่มใช้ฟรี สร้างระบบในแบบของคุณ',
                  )
                : screen === 'setup'
                  ? t(
                      'A few details, then you’re on your way.',
                      'ตั้งค่าเล็กน้อย แล้วเริ่มใช้งานได้เลย',
                    )
                  : t(
                      'Follow the next step to continue.',
                      'ทำตามขั้นตอนต่อไปเพื่อดำเนินการต่อ',
                    )}
          </p>
          <p className="auth-preview-note">
            {t(
              'Interactive preview: use made-up details. Passwords are never saved or checked; no account or email is created.',
              'พรีวิวทดลอง: ใช้ข้อมูลสมมติได้ รหัสผ่านไม่ถูกบันทึกหรือตรวจสอบ ไม่มีการสร้างบัญชีหรือส่งอีเมลจริง',
            )}
          </p>
          <form onSubmit={submit}>
            {(screen === 'signup' || (screen === 'setup' && step === 0)) && (
              <label>
                {t('Your name', 'ชื่อที่ใช้แสดง')}
                <input
                  required
                  maxLength={60}
                  autoComplete="nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t(
                    'What should we call you?',
                    'ให้เราเรียกคุณว่าอะไรดี',
                  )}
                />
              </label>
            )}
            {['signin', 'signup', 'forgot'].includes(screen) && (
              <label>
                {t('Email address', 'อีเมล')}
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                />
              </label>
            )}
            {['signin', 'signup', 'reset'].includes(screen) && (
              <label>
                {screen === 'reset'
                  ? t('New password', 'รหัสผ่านใหม่')
                  : t('Password', 'รหัสผ่าน')}
                <div className="auth-password">
                  <input
                    type={visible ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('At least 8 characters', 'อย่างน้อย 8 ตัวอักษร')}
                  />
                  <button
                    type="button"
                    aria-label={
                      visible
                        ? t('Hide password', 'ซ่อนรหัสผ่าน')
                        : t('Show password', 'แสดงรหัสผ่าน')
                    }
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}
            {screen === 'reset' && (
              <label>
                {t('Confirm new password', 'ยืนยันรหัสผ่านใหม่')}
                <input
                  required
                  minLength={8}
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                />
              </label>
            )}
            {screen === 'signin' && (
              <button
                className="auth-inline right"
                type="button"
                onClick={() => go('forgot')}
              >
                {t('Forgot password?', 'ลืมรหัสผ่าน?')}
              </button>
            )}
            {screen === 'setup' && step === 0 && (
              <label>
                {t('Time zone', 'เขตเวลา')}
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
                  <option value="Asia/Singapore">Singapore (UTC+8)</option>
                  <option value="Europe/London">London</option>
                  <option value="America/New_York">New York</option>
                  <option value="UTC">UTC</option>
                </select>
                <small>
                  {t(
                    'Used to group trades into calendar days.',
                    'ใช้จัดกลุ่มวันในปฏิทินการเทรด',
                  )}
                </small>
              </label>
            )}
            {screen === 'setup' && step === 1 && (
              <>
                <label>
                  {t('Portfolio name', 'ชื่อพอร์ต')}
                  <input
                    required
                    maxLength={60}
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder={t('My trading portfolio', 'พอร์ตเทรดของฉัน')}
                  />
                </label>
                <div className="auth-fields">
                  <label>
                    {t('Starting balance', 'ยอดเงินเริ่มต้น')}
                    <input
                      required
                      type="number"
                      min="0"
                      max="1000000000000"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                    />
                  </label>
                  <label>
                    {t('Account currency', 'สกุลเงินบัญชี')}
                    <select
                      aria-label={t('Account currency', 'สกุลเงินบัญชี')}
                      defaultValue="USD"
                    >
                      <option value="USD">USD — US Dollar</option>
                      <option value="THB" disabled>
                        THB — {t('Coming later', 'เพิ่มภายหลัง')}
                      </option>
                    </select>
                  </label>
                </div>
                <small>
                  {t(
                    'This preview calculates trades in USD. Subscription prices are in THB.',
                    'พรีวิวนี้คำนวณการเทรดเป็น USD ราคาสมาชิกแสดงเป็นเงินบาท',
                  )}
                </small>
              </>
            )}
            {screen === 'setup' && step === 2 && (
              <>
                <div className="setup-summary">
                  <Wallet size={24} />
                  <strong>{portfolio}</strong>
                  <span>
                    {Number(balance).toLocaleString()} USD · {timezone}
                  </span>
                  <span>
                    {t(
                      'Free plan · Manual journal',
                      'แพ็กเกจ Free · บันทึกด้วยตนเอง',
                    )}
                  </span>
                </div>
                <p className="auth-lead">
                  {t(
                    'Your portfolio starts empty. Add your first trade whenever you’re ready. Your sample demo stays separate.',
                    'พอร์ตของคุณเริ่มต้นแบบไม่มีรายการ เพิ่มเทรดแรกได้เมื่อพร้อม โดยข้อมูลเดโมตัวอย่างยังอยู่แยกกัน',
                  )}
                </p>
              </>
            )}
            {['sent', 'verify'].includes(screen) && (
              <div className="auth-message">
                <Mail size={30} />
                <strong>{email}</strong>
                <p>
                  {t(
                    'In the live product, an email link would arrive here. For this preview, continue with the simulated link below.',
                    'ในระบบจริง คุณจะได้รับลิงก์ทางอีเมล สำหรับพรีวิว กดปุ่มด้านล่างเพื่อจำลองการเปิดลิงก์',
                  )}
                </p>
                <button
                  type="button"
                  className="button ink"
                  onClick={() => {
                    if (screen === 'sent') go('reset');
                    else {
                      setBusy(true);
                      void enter()
                        .catch(() =>
                          setError(
                            t(
                              'Storage unavailable. Please try again.',
                              'ไม่สามารถเปิดพื้นที่เก็บข้อมูลได้ กรุณาลองอีกครั้ง',
                            ),
                          ),
                        )
                        .finally(() => setBusy(false));
                    }
                  }}
                  disabled={busy}
                >
                  {screen === 'sent'
                    ? t('Preview reset link', 'จำลองลิงก์ตั้งรหัสผ่าน')
                    : t('Preview email verification', 'จำลองการยืนยันอีเมล')}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="auth-inline"
                  onClick={() => go(screen === 'sent' ? 'forgot' : 'signup')}
                >
                  {t('Use a different email', 'เปลี่ยนอีเมล')}
                </button>
              </div>
            )}
            {screen === 'done' && (
              <div className="auth-message">
                <Check size={32} />
                <p>
                  {t(
                    'Reset flow complete. No real password was changed.',
                    'ทดลองขั้นตอนตั้งรหัสผ่านสำเร็จ ไม่มีการเปลี่ยนรหัสผ่านจริง',
                  )}
                </p>
                <button
                  type="button"
                  className="button ink"
                  onClick={() => go('signin')}
                >
                  {t('Back to sign in', 'กลับไปเข้าสู่ระบบ')}
                </button>
              </div>
            )}
            {error && (
              <p role="alert" className="auth-error">
                {error}
              </p>
            )}
            {!['sent', 'verify', 'done'].includes(screen) && (
              <button
                className="button ink auth-submit"
                disabled={busy}
                type="submit"
              >
                {busy
                  ? t('Please wait…', 'กรุณารอสักครู่…')
                  : screen === 'signin'
                    ? t('Preview sign in', 'ทดลองเข้าสู่ระบบ')
                    : screen === 'signup'
                      ? t('Create free workspace', 'สร้างเวิร์กสเปซฟรี')
                      : screen === 'forgot'
                        ? t('Continue', 'ดำเนินการต่อ')
                        : screen === 'reset'
                          ? t('Preview password reset', 'ทดลองตั้งรหัสผ่าน')
                          : step === 2
                            ? t('Open my workspace', 'เปิดเวิร์กสเปซของฉัน')
                            : t('Continue', 'ถัดไป')}
                <ArrowRight size={16} />
              </button>
            )}
            {screen === 'setup' && step > 0 && (
              <button
                className="auth-inline"
                type="button"
                onClick={() => {
                  setStep(step - 1);
                  setError('');
                }}
              >
                <ArrowLeft size={14} />
                {t('Back', 'ย้อนกลับ')}
              </button>
            )}
          </form>
          {['signin', 'signup'].includes(screen) && (
            <p className="auth-switch">
              {screen === 'signin'
                ? t('New to Tradovia?', 'เพิ่งเริ่มใช้ Tradovia?')
                : t('Already have an account?', 'มีบัญชีแล้ว?')}{' '}
              <button
                className="auth-inline"
                onClick={() => go(screen === 'signin' ? 'signup' : 'signin')}
              >
                {screen === 'signin'
                  ? t('Sign up free', 'สมัครใช้ฟรี')
                  : t('Sign in', 'เข้าสู่ระบบ')}
              </button>
            </p>
          )}
          {screen === 'forgot' && (
            <button className="auth-inline" onClick={() => go('signin')}>
              <ArrowLeft size={14} />
              {t('Back to sign in', 'กลับไปเข้าสู่ระบบ')}
            </button>
          )}
        </section>
      </div>
      <footer className="auth-footer">
        {t('Trade with intention.', 'เทรดอย่างมีเป้าหมาย')}
        <a href="/">{t('Back to Tradovia', 'กลับหน้า Tradovia')} ↗</a>
      </footer>
    </main>
  );
}
