'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Upload,
  Plus,
  UserRound,
  Wallet,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { WorkspaceData } from '@/lib/domain';
import type { Translate } from './workspace-ui';

type StartChoice = 'import' | 'trade' | 'explore';

function detectedTimeZone(fallback: string) {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

export default function FirstRunOnboarding({
  open,
  endpoint,
  data,
  t,
  onFinish,
  onSkip,
}: {
  open: boolean;
  endpoint: string;
  data: WorkspaceData;
  t: Translate;
  onFinish: (choice: StartChoice, next: WorkspaceData) => void;
  onSkip: () => void;
}) {
  const browserZone = useMemo(
    () => detectedTimeZone(data.profile.timezone),
    [data.profile.timezone],
  );
  const [step, setStep] = useState(0);
  const [name, setName] = useState(
    data.profile.name === 'Trader' ? '' : data.profile.name,
  );
  const [timezone, setTimezone] = useState(browserZone);
  const [portfolioName, setPortfolioName] = useState('Main portfolio');
  const [balance, setBalance] = useState('10000');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [nextData, setNextData] = useState(data);

  const post = async (action: string, value: unknown) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, value }),
    });
    const result = (await response.json()) as WorkspaceData & {
      error?: string;
    };
    if (!response.ok) throw new Error(result.error || 'Unable to save');
    return result;
  };

  const saveBasics = async () => {
    const capital = Number(balance);
    if (
      !name.trim() ||
      !portfolioName.trim() ||
      !Number.isFinite(capital) ||
      capital < 0
    ) {
      setError(
        t(
          'Enter your name, portfolio and a valid starting balance.',
          'กรอกชื่อ พอร์ต และเงินทุนเริ่มต้นให้ถูกต้อง',
        ),
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      await post('saveProfile', { name: name.trim(), timezone });
      const result = await post('createPortfolio', {
        name: portfolioName.trim(),
        balance: capital,
      });
      setNextData(result);
      setStep(1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t('Unable to finish setup.', 'ตั้งค่าไม่สำเร็จ'),
      );
    } finally {
      setBusy(false);
    }
  };

  const choices: Array<{
    id: StartChoice;
    icon: typeof Upload;
    title: string;
    description: string;
    recommended?: boolean;
  }> = [
    {
      id: 'import',
      icon: Upload,
      title: t('Import trading history', 'นำเข้าประวัติการเทรด'),
      description: t(
        'Upload a broker report or CSV and see useful patterns sooner.',
        'อัปโหลดรายงานจากโบรกเกอร์หรือ CSV เพื่อเห็นรูปแบบได้เร็วขึ้น',
      ),
      recommended: true,
    },
    {
      id: 'trade',
      icon: Plus,
      title: t('Record the first trade', 'บันทึกเทรดแรก'),
      description: t(
        'Start with the essentials. Notes and charts can be added later.',
        'เริ่มจากข้อมูลสำคัญ แล้วค่อยเพิ่มบันทึกและภาพกราฟภายหลัง',
      ),
    },
    {
      id: 'explore',
      icon: Compass,
      title: t('Explore the workspace', 'สำรวจเวิร์กสเปซ'),
      description: t(
        'Open the overview and get familiar with your new workspace.',
        'เปิดหน้าภาพรวมและทำความรู้จักพื้นที่ของคุณก่อน',
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onSkip()}>
      <DialogContent className="first-run-dialog">
        <div className="first-run-progress" aria-label={`${step + 1} / 2`}>
          <i className="complete" />
          <i className={step === 1 ? 'complete' : ''} />
        </div>
        {step === 0 ? (
          <>
            <span className="first-run-eyebrow">TRADOVIA · QUICK START</span>
            <DialogTitle>{t('Make it yours', 'ตั้งค่าพื้นที่ของคุณ')}</DialogTitle>
            <DialogDescription>
              {t(
                'Just the essentials. You can change everything later in Settings.',
                'ตั้งค่าเฉพาะส่วนสำคัญ ทุกอย่างเปลี่ยนภายหลังได้ในหน้าตั้งค่า',
              )}
            </DialogDescription>
            <form
              className="first-run-form"
              onSubmit={(event) => {
                event.preventDefault();
                void saveBasics();
              }}
            >
              <label>
                <span>
                  <UserRound size={17} />
                  {t(
                    'What should Tradovia call you?',
                    'ให้ Tradovia เรียกคุณว่าอะไร?',
                  )}
                </span>
                <input
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={name}
                  placeholder={t('Your name or nickname', 'ชื่อหรือชื่อเล่น')}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                <span>
                  <Wallet size={17} />
                  {t('First portfolio', 'พอร์ตแรก')}
                </span>
                <input
                  required
                  maxLength={80}
                  value={portfolioName}
                  onChange={(event) => setPortfolioName(event.target.value)}
                />
              </label>
              <div className="first-run-field-row">
                <label>
                  <span>{t('Starting balance (USD)', 'เงินทุนเริ่มต้น (USD)')}</span>
                  <input
                    required
                    inputMode="decimal"
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    value={balance}
                    onChange={(event) => setBalance(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t('Timezone', 'เขตเวลา')}</span>
                  <input
                    required
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                  />
                </label>
              </div>
              {error && (
                <p className="first-run-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="button ink first-run-primary"
                disabled={busy}
              >
                {busy
                  ? t('Preparing…', 'กำลังเตรียม…')
                  : t('Continue', 'ดำเนินการต่อ')}
                {!busy && <ArrowRight size={17} />}
              </button>
              <button
                type="button"
                className="text-button first-run-skip"
                onClick={onSkip}
              >
                {t('I’ll set this up later', 'ไว้ตั้งค่าภายหลัง')}
              </button>
            </form>
          </>
        ) : (
          <>
            <span className="first-run-eyebrow">TRADOVIA · READY</span>
            <DialogTitle>
              {t(`Welcome, ${name.trim()}`, `ยินดีต้อนรับ ${name.trim()}`)}
            </DialogTitle>
            <DialogDescription>
              {t('How would you like to begin?', 'คุณต้องการเริ่มจากส่วนไหน?')}
            </DialogDescription>
            <div className="first-run-choices">
              {choices.map(
                ({ id, icon: Icon, title, description, recommended }) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => onFinish(id, nextData)}
                  >
                    <span className="first-run-choice-icon">
                      <Icon size={21} />
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                    {recommended && <em>{t('Recommended', 'แนะนำ')}</em>}
                    <ArrowRight size={17} />
                  </button>
                ),
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
