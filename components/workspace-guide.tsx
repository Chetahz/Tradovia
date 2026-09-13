'use client';
import { useEffect, useState } from 'react';
import type { Translate } from './workspace-ui';

const guidedPages = ['overview', 'journal', 'playbook', 'risk', 'analytics'];

export default function WorkspaceGuide({
  page,
  mode,
  hasPortfolio,
  hasPlaybook,
  hasTrades,
  t,
  navigate,
  addTrade,
}: {
  page: string;
  mode: string;
  hasPortfolio: boolean;
  hasPlaybook: boolean;
  hasTrades: boolean;
  t: Translate;
  navigate: (page: string) => void;
  addTrade: () => void;
}) {
  const key = `tradovia.guide.v2.${mode}.${page}`;
  const visitedKey = `tradovia.guide.v2.${mode}.visited`;
  const [hidden, setHidden] = useState(true);
  const [ready, setReady] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setHidden(localStorage.getItem(key) === 'hidden');
        const nextVisited = new Set(
          (localStorage.getItem(visitedKey) || '').split(',').filter(Boolean),
        );
        nextVisited.add(page);
        const value = [...nextVisited];
        localStorage.setItem(visitedKey, value.join(','));
        setVisited(value);
      } catch {
        setHidden(false);
        setVisited([page]);
      }
      setReady(true);
    });
  }, [key, page, visitedKey]);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(key, 'hidden');
    } catch {
      /* Keep controls usable without storage. */
    }
  };
  const reopen = () => {
    setHidden(false);
    try {
      localStorage.removeItem(key);
    } catch {
      /* Session-only preference. */
    }
  };

  if (!ready || !guidedPages.includes(page)) return null;
  if (hidden)
    return (
      <div className="guide-reopen">
        <button className="button ghost compact" onClick={reopen}>
          {t('Show getting-started guide', 'ดูคำแนะนำการเริ่มใช้งาน')}
        </button>
      </div>
    );

  const pageSteps: Record<string, string[][]> = {
    journal: [
      [
        t('1. Record the decision', '1. บันทึกเหตุผลของการตัดสินใจ'),
        t(
          'Choose the account and Playbook, then add execution details. Notes and chart images can be added later.',
          'เลือกบัญชีและ Playbook แล้วกรอกข้อมูลเข้าเทรด ส่วนบันทึกและภาพกราฟเพิ่มภายหลังได้',
        ),
      ],
      [
        t('2. Keep the result accurate', '2. บันทึกผลให้ตรง'),
        t(
          'For closed trades, separate gross P&L from fees. Tradovia uses the net result throughout the workspace.',
          'เมื่อปิดเทรด ให้แยกกำไรขาดทุนก่อนหักค่าธรรมเนียมออกจากค่าธรรมเนียม Tradovia จะใช้ผลสุทธิทั้งระบบ',
        ),
      ],
      [
        t('3. Add the lesson', '3. เก็บบทเรียน'),
        t(
          'Review the plan, emotion and mistake while the trade is still fresh. The same answers feed your insights.',
          'ทบทวนแผน อารมณ์ และข้อผิดพลาดขณะที่ยังจำได้ ข้อมูลชุดเดียวกันจะถูกนำไปสร้าง Insights',
        ),
      ],
    ],
    playbook: [
      [
        t('1. Define one repeatable setup', '1. สร้าง Setup ที่ทำซ้ำได้'),
        t(
          'Name the pattern clearly so you can recognize and compare it later.',
          'ตั้งชื่อรูปแบบให้ชัด เพื่อให้จำและนำผลมาเปรียบเทียบภายหลังได้',
        ),
      ],
      [
        t(
          '2. Write entry, exit and risk rules',
          '2. เขียนกฎเข้า ออก และความเสี่ยง',
        ),
        t(
          'Use observable conditions instead of relying on memory or feeling.',
          'ใช้เงื่อนไขที่ตรวจสอบได้ แทนการจำหรืออาศัยความรู้สึก',
        ),
      ],
      [
        t('3. Turn it into a checklist', '3. เปลี่ยนเป็น Checklist'),
        t(
          'Attach the Playbook when recording a trade. Tradovia can then show which process works best.',
          'ผูก Playbook ตอนบันทึกเทรด เพื่อให้ Tradovia บอกได้ว่ากระบวนการใดให้ผลดีที่สุด',
        ),
      ],
    ],
    risk: [
      [
        t('1. Confirm the instrument specification', '1. ตรวจสเปกของสินทรัพย์'),
        t(
          'Match contract size, tick value and lot step with the specification shown by your broker.',
          'เทียบขนาดสัญญา มูลค่าต่อจุด และขั้นของ Lot กับ Specification ที่โบรกเกอร์แสดง',
        ),
      ],
      [
        t('2. Set the loss you accept', '2. กำหนดขาดทุนที่ยอมรับได้'),
        t(
          'Enter balance, risk percentage, entry and stop-loss using the same units.',
          'กรอกยอดเงิน เปอร์เซ็นต์ความเสี่ยง ราคาเข้า และ Stop loss ด้วยหน่วยที่ตรงกัน',
        ),
      ],
      [
        t('3. Check before execution', '3. ตรวจอีกครั้งก่อนส่งคำสั่ง'),
        t(
          'Lot is position size, not cash at risk. Slippage and execution can change the actual loss.',
          'Lot คือขนาดสถานะ ไม่ใช่เงินที่เสี่ยง Slippage และราคาที่เปิดจริงอาจทำให้ผลขาดทุนเปลี่ยนได้',
        ),
      ],
    ],
    analytics: [
      [
        t('1. Start with the question', '1. เริ่มจากคำถาม'),
        t(
          'Choose the portfolio and period you want to understand before reading the numbers.',
          'เลือกพอร์ตและช่วงเวลาที่ต้องการทำความเข้าใจก่อนอ่านตัวเลข',
        ),
      ],
      [
        t('2. Compare process and outcome', '2. เทียบกระบวนการกับผลลัพธ์'),
        t(
          'Use Overview for results, Deep Analysis for patterns, Weekly Review for reflection and Account Report for detail.',
          'ใช้ภาพรวมดูผลลัพธ์ Deep Analysis ดูรูปแบบ สรุปรายสัปดาห์เพื่อทบทวน และรายงานบัญชีเพื่อดูรายละเอียด',
        ),
      ],
      [
        t('3. Open the source trades', '3. เปิดดูรายการต้นทาง'),
        t(
          'Treat every insight as a lead. Open the trades behind it before changing your plan.',
          'มอง Insight เป็นเบาะแส แล้วเปิดดูรายการเทรดต้นทางก่อนเปลี่ยนแผน',
        ),
      ],
    ],
  };

  const overviewTasks = [
    {
      label: t('Set up a portfolio', 'ตั้งค่าพอร์ต'),
      done: hasPortfolio,
      action: () => navigate('portfolio'),
    },
    {
      label: t('Create your Playbook', 'สร้าง Playbook'),
      done: hasPlaybook,
      action: () => navigate('playbook'),
    },
    {
      label: t('Plan your risk', 'วางแผนความเสี่ยง'),
      done: visited.includes('risk'),
      action: () => navigate('risk'),
    },
    {
      label: t('Record and review', 'บันทึกและทบทวน'),
      done: hasTrades && visited.includes('analytics'),
      action: () => (hasTrades ? navigate('analytics') : addTrade()),
    },
  ];
  const completed = overviewTasks.filter((task) => task.done).length;
  const steps = pageSteps[page] || [];

  return (
    <section
      className="workspace-guide panel"
      aria-label={t('Getting started', 'เริ่มใช้งาน')}
    >
      <div className="section-heading">
        <div>
          <span className="overline">{t('GETTING STARTED', 'เริ่มต้นใช้งาน')}</span>
          <h2>
            {page === 'overview'
              ? t('Build your trading loop', 'สร้างวงจรการเทรดของคุณ')
              : t('A quick guide to this page', 'รู้จักหน้านี้ในสามขั้นตอน')}
          </h2>
          <p>
            {page === 'overview'
              ? t(
                  'Set the plan, control the risk, record the trade and use the result to improve.',
                  'วางแผน คุมความเสี่ยง บันทึกเทรด แล้วใช้ผลลัพธ์เพื่อพัฒนารอบถัดไป',
                )
              : t(
                  'Use these steps as a starting point. You can reopen this guide anytime.',
                  'ใช้ขั้นตอนเหล่านี้เป็นจุดเริ่มต้น และเปิดดูคำแนะนำอีกครั้งได้เสมอ',
                )}
          </p>
        </div>
        <button className="button ghost compact" onClick={dismiss}>
          {t('Skip / close', 'ข้าม / ปิด')}
        </button>
      </div>
      {page === 'overview' ? (
        <>
          <div className="guide-progress-row">
            <span>
              {completed}/4 {t('completed', 'ขั้นตอนเสร็จแล้ว')}
            </span>
            <div className="guide-progress" aria-hidden="true">
              <i style={{ width: `${(completed / 4) * 100}%` }} />
            </div>
          </div>
          <div className="workspace-guide-grid guide-flow-grid">
            {overviewTasks.map((task, i) => (
              <button
                key={task.label}
                className={`guide-task${task.done ? ' complete' : ''}`}
                onClick={task.action}
              >
                <span>{task.done ? '✓' : `0${i + 1}`}</span>
                <strong>{task.label}</strong>
                <small>
                  {task.done
                    ? t('Done · open again', 'เสร็จแล้ว · เปิดดูอีกครั้ง')
                    : t('Start →', 'เริ่มขั้นตอนนี้ →')}
                </small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="workspace-guide-grid">
          {steps.map(([title, description]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      )}
      {page === 'journal' && !hasTrades && (
        <div className="guide-empty">
          <p>
            {t(
              'Your journal is ready. Add one trade to begin building your history.',
              'บันทึกของคุณพร้อมแล้ว เพิ่มเทรดแรกเพื่อเริ่มเก็บประวัติ',
            )}
          </p>
          <button className="button ink compact" onClick={addTrade}>
            {t('Add first trade', 'เพิ่มเทรดแรก')}
          </button>
        </div>
      )}
    </section>
  );
}
