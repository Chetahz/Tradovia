'use client';

import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  Compass,
  Import,
  ListChecks,
  Plus,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type { Translate } from './workspace-ui';

type TargetRect = { top: number; left: number; width: number; height: number };
type TourStep = {
  page: string;
  target: string;
  label: string;
  title: string;
  description: string;
  action: string;
  Icon: typeof Compass;
};

const visibleTarget = (name: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)).find(
    (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
    },
  );

export default function WorkspaceTour({
  step,
  mode,
  t,
  setStep,
  navigate,
  addTrade,
}: {
  step: number;
  mode: 'demo' | 'real';
  t: Translate;
  setStep: (step: number) => void;
  navigate: (page: string) => void;
  addTrade: () => void;
  openImport: () => void;
}) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const steps = useMemo<TourStep[]>(
    () => [
      {
        page: 'overview', target: 'today', Icon: Compass,
        label: t('Your starting point', 'จุดเริ่มต้นของคุณ'),
        title: t('Start each day here', 'เริ่มต้นแต่ละวันที่ตรงนี้'),
        description: t(
          'Today shows the one thing worth focusing on before you trade. You do not need to read every report.',
          'หน้า “วันนี้” จะสรุปสิ่งที่ควรโฟกัสก่อนเทรด คุณไม่จำเป็นต้องเปิดอ่านทุกรายงาน',
        ),
        action: t('See Today', 'ดูหน้า “วันนี้”'),
      },
      {
        page: 'overview', target: 'add-trade', Icon: Plus,
        label: t('Your main action', 'สิ่งที่ใช้บ่อยที่สุด'),
        title: t('Record a trade from here', 'บันทึกการเทรดได้จากตรงนี้'),
        description: t(
          'Tap this button whenever you want to save a trade. The form keeps the first record short, then lets you add detail later.',
          'แตะปุ่มนี้เมื่อต้องการบันทึกไม้ แบบฟอร์มจะเก็บข้อมูลสำคัญก่อน แล้วค่อยกลับมาเติมรายละเอียดภายหลังได้',
        ),
        action: t('Try recording a trade', 'ลองบันทึกหนึ่งไม้'),
      },
      {
        page: 'journal', target: 'journal-nav', Icon: BookOpen,
        label: t('Your trade history', 'ประวัติการเทรด'),
        title: t('Every saved trade lives here', 'รายการที่บันทึกไว้จะอยู่ตรงนี้'),
        description: t(
          'Open a trade to review its numbers, reason, chart and result—or return to finish details after it closes.',
          'เปิดแต่ละไม้เพื่อดูตัวเลข เหตุผล ภาพกราฟ และผลลัพธ์ หรือกลับมาเติมรายละเอียดหลังปิดไม้',
        ),
        action: t('Open trade history', 'เปิดรายการเทรด'),
      },
      {
        page: 'journal', target: 'import-trades', Icon: Import,
        label: t('Bring your history with you', 'นำประวัติเดิมเข้ามา'),
        title: t('Import broker reports here', 'นำเข้ารายงานโบรกเกอร์ตรงนี้'),
        description: t(
          'Upload an MT5 report or CSV instead of typing closed trades one by one. Tradovia will prepare them for review.',
          'อัปโหลดรายงาน MT5 หรือ CSV แทนการกรอกไม้ที่ปิดแล้วทีละรายการ แล้ว Tradovia จะจัดข้อมูลให้พร้อมทบทวน',
        ),
        action: t('See import tools', 'ดูเครื่องมือนำเข้า'),
      },
      {
        page: 'playbook', target: 'playbook-page', Icon: ListChecks,
        label: t('Make your setup repeatable', 'ทำแผนให้ใช้ซ้ำได้'),
        title: t('Build your rules in Playbook', 'สร้างกฎของคุณใน Playbook'),
        description: t(
          'Turn each setup into a short checklist, then attach it to trades so you can compare plan and execution.',
          'เปลี่ยนแต่ละ Setup เป็นเช็กลิสต์สั้น ๆ แล้วผูกกับรายการเทรดเพื่อเทียบแผนกับสิ่งที่ทำจริง',
        ),
        action: t('Open Playbook', 'เปิด Playbook'),
      },
      {
        page: 'risk', target: 'risk-page', Icon: ShieldCheck,
        label: t('Protect the account first', 'คุมความเสี่ยงก่อน'),
        title: t('Plan position size before entry', 'วางขนาดการเทรดก่อนเข้าไม้'),
        description: t(
          'Use balance, stop distance and accepted risk to check position size before you send an order.',
          'ใช้ยอดเงิน ระยะ Stop และความเสี่ยงที่ยอมรับได้ เพื่อตรวจขนาดสถานะก่อนส่งคำสั่ง',
        ),
        action: t('Open Risk Center', 'เปิดศูนย์ความเสี่ยง'),
      },
      {
        page: 'calendar', target: 'calendar-nav', Icon: CalendarDays,
        label: t('See your consistency', 'เห็นความสม่ำเสมอ'),
        title: t('Review trading days on the calendar', 'ทบทวนแต่ละวันผ่านปฏิทิน'),
        description: t(
          'Tap any day to see the trades behind its result. This makes winning and losing streaks easier to understand.',
          'แตะวันที่เพื่อดูรายการเทรดต้นทาง ทำให้เข้าใจช่วงที่ชนะ แพ้ หรือหยุดเทรดได้ง่ายขึ้น',
        ),
        action: t('Explore the calendar', 'ลองดูปฏิทิน'),
      },
      {
        page: 'analytics', target: 'analytics-nav', Icon: BarChart3,
        label: t('Turn records into insight', 'เปลี่ยนบันทึกเป็นบทเรียน'),
        title: t('Find what is actually working', 'ดูว่าอะไรได้ผลจริง'),
        description: t(
          'Compare setups, symbols and decision quality, then open the source trades before changing your rules.',
          'เปรียบเทียบ Setup สินทรัพย์ และคุณภาพการตัดสินใจ แล้วเปิดดูไม้ต้นทางก่อนปรับกฎของคุณ',
        ),
        action: t('Open Analytics', 'เปิดหน้าวิเคราะห์'),
      },
      {
        page: 'settings', target: 'settings-page', Icon: Settings,
        label: t('Make Tradovia yours', 'ตั้งค่าให้เป็นของคุณ'),
        title: t('Manage your workspace here', 'จัดการพื้นที่ของคุณตรงนี้'),
        description: t(
          'Update your profile, portfolios, language, appearance, reminders and plan from Settings whenever you need them.',
          'แก้โปรไฟล์ พอร์ต ภาษา รูปแบบการแสดงผล การเตือน และแพ็กเกจได้จากหน้าตั้งค่าเมื่อคุณต้องการ',
        ),
        action: t('Open Settings', 'เปิดหน้าตั้งค่า'),
      },
    ],
    [t],
  );

  const current = steps[step] ?? steps[0];
  const isLast = step === steps.length - 1;

  const remember = (value: string) => {
    try {
      localStorage.setItem(`tradovia.onboarding.v5.${mode}`, value);
    } catch {
      /* Keep the tour usable without storage. */
    }
  };
  const close = (value = 'skipped') => {
    remember(value);
    setStep(-1);
  };

  useEffect(() => {
    if (step >= 0) navigate(current.page);
  }, [current.page, navigate, step]);

  useLayoutEffect(() => {
    if (step < 0) return;
    let timer = 0;
    const update = () => {
      const element = visibleTarget(current.target);
      if (!element) return setTargetRect(null);
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: Math.max(8, rect.top - 8),
        left: Math.max(8, rect.left - 8),
        width: Math.min(window.innerWidth - 16, rect.width + 16),
        height: rect.height + 16,
      });
    };
    const reveal = () => {
      visibleTarget(current.target)?.scrollIntoView({ block: 'center', inline: 'center' });
      timer = window.setTimeout(update, 120);
    };
    const frame = window.requestAnimationFrame(reveal);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [current.target, step]);

  if (typeof document === 'undefined' || step < 0) return null;

  const cardWidth = Math.min(380, window.innerWidth - 24);
  const cardAbove = targetRect ? targetRect.top > window.innerHeight * 0.54 : false;
  const cardStyle = targetRect
    ? {
        left: Math.max(12, Math.min(window.innerWidth - cardWidth - 12, targetRect.left + targetRect.width / 2 - cardWidth / 2)),
        ...(cardAbove
          ? { bottom: Math.max(12, window.innerHeight - targetRect.top + 18) }
          : { top: Math.min(window.innerHeight - 280, targetRect.top + targetRect.height + 18) }),
      }
    : { left: 12, top: 92 };

  const goTo = (nextStep: number) => {
    remember(`active:${nextStep}`);
    setStep(nextStep);
  };
  const practice = () => {
    remember(`paused:${step}`);
    setStep(-1);
    if (current.target === 'add-trade') addTrade();
    else navigate(current.page);
  };

  return createPortal(
    <dialog open className="tour-spotlight-layer" aria-modal="true" aria-label={current.title}>
      <button type="button" className="tour-spotlight-scrim" aria-label={t('Exit tour', 'ออกจากทัวร์')} onClick={() => close()} />
      {targetRect ? <span className="tour-spotlight-target" aria-hidden="true" style={targetRect} /> : null}
      <section className="tour-spotlight-card" style={cardStyle}>
        <div className="tour-spotlight-meta">
          <span>{step + 1} / {steps.length}</span>
          <div aria-hidden="true">
            {steps.map((item, index) => <i key={item.target} className={index <= step ? 'active' : ''} />)}
          </div>
        </div>
        <div className="tour-spotlight-heading">
          <span aria-hidden="true"><current.Icon size={20} /></span>
          <div><small>{current.label}</small><h2>{current.title}</h2></div>
        </div>
        <p>{current.description}</p>
        <button type="button" className="tour-spotlight-practice" onClick={practice}>
          {current.action}<ArrowRight size={16} />
        </button>
        <div className="tour-spotlight-actions">
          <button type="button" className="text-button" onClick={() => close()}>{t('Skip tour', 'ข้ามทัวร์')}</button>
          <div>
            {step > 0 ? <button type="button" className="button ghost" onClick={() => goTo(step - 1)}><ChevronLeft size={16} />{t('Back', 'ย้อนกลับ')}</button> : null}
            <button type="button" className="button ink" onClick={() => {
              if (isLast) { close('complete'); navigate('overview'); }
              else goTo(step + 1);
            }}>
              {isLast ? t('Finish', 'เสร็จสิ้น') : t('Next', 'ถัดไป')}
              {isLast ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </section>
    </dialog>,
    document.body,
  );
}
