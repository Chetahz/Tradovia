'use client';
import { useEffect, useState } from 'react';
import type { Translate } from './workspace-ui';

export default function WorkspaceGuide({
  page,
  mode,
  hasPortfolio,
  hasTrades,
  t,
  navigate,
  addTrade,
}: {
  page: string;
  mode: string;
  hasPortfolio: boolean;
  hasTrades: boolean;
  t: Translate;
  navigate: (page: string) => void;
  addTrade: () => void;
}) {
  const key = `tradovia.guide.v1.${mode}.${page}`;
  const [hidden, setHidden] = useState(true);
  const [ready, setReady] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(key) === 'hidden');
      setReviewed(
        localStorage.getItem(`tradovia.guide.v1.${mode}.reviewed`) === 'yes',
      );
    } catch {
      setHidden(false);
    }
    setReady(true);
  }, [key, mode]);
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
  if (!ready || !['overview', 'journal', 'risk'].includes(page)) return null;
  if (hidden)
    return (
      <div className="guide-reopen">
        <button className="button ghost compact" onClick={reopen}>
          {t('Show getting-started guide', 'ดูคำแนะนำการเริ่มใช้งาน')}
        </button>
      </div>
    );
  const steps =
    page === 'risk'
      ? [
          [
            t('1. Choose the instrument', '1. เลือกสินทรัพย์'),
            t(
              'Check contract size, tick value and lot step against your broker’s specification.',
              'ตรวจขนาดสัญญา มูลค่าต่อจุด และขั้นของ Lot ให้ตรงกับข้อกำหนดโบรกเกอร์',
            ),
          ],
          [
            t('2. Set your risk', '2. กำหนดความเสี่ยง'),
            t(
              'Enter account balance, risk percentage, entry and stop-loss prices. Check all units before calculating.',
              'กรอกยอดเงิน เปอร์เซ็นต์ความเสี่ยง ราคาเข้า และ Stop loss โดยตรวจหน่วยให้ตรงกันก่อนคำนวณ',
            ),
          ],
          [
            t('3. Read the position size', '3. อ่านขนาดการเทรด'),
            t(
              'Lot is the position size, not the amount of money at risk. Review the estimated loss and costs; execution and slippage can change the actual loss.',
              'Lot คือขนาดการเทรด ไม่ใช่จำนวนเงินที่เสี่ยง ตรวจประมาณการขาดทุนและต้นทุนด้วย ผลขาดทุนจริงอาจเปลี่ยนจากราคาเปิดปิดและ Slippage',
            ),
          ],
        ]
      : [
          [
            t('1. Record an entry', '1. เพิ่มรายการเทรด'),
            t(
              'Use Add trade. Choose the account and fill the required execution fields; notes and chart images are optional.',
              'กดบันทึกการเทรด เลือกบัญชีและกรอกข้อมูลซื้อขายที่จำเป็น ส่วนบันทึกและภาพกราฟเพิ่มภายหลังได้',
            ),
          ],
          [
            t('2. Keep the status accurate', '2. เลือกสถานะให้ตรง'),
            t(
              'Mark unfinished trades Open. For closed trades, record gross P&L and fees separately so net P&L is calculated correctly.',
              'เทรดที่ยังไม่จบเลือกสถานะยังไม่ปิด เมื่อปิดแล้วกรอกกำไรขาดทุนก่อนหักค่าธรรมเนียม และค่าธรรมเนียมแยกกัน',
            ),
          ],
          [
            t('3. Review and refine', '3. เปิดดูและทบทวน'),
            t(
              'Select a trade to see its details or edit it. Search and filters help you find entries; Export downloads a CSV copy.',
              'กดรายการเพื่อดูรายละเอียดหรือแก้ไข ใช้การค้นหาและตัวกรองช่วยหารายการ และกดส่งออกเพื่อเก็บสำเนา CSV',
            ),
          ],
        ];
  const done = [hasPortfolio, hasTrades, hasTrades && reviewed];
  return (
    <section
      className="workspace-guide panel"
      aria-label={t('Getting started', 'เริ่มใช้งาน')}
    >
      <div className="section-heading">
        <div>
          <h2>
            {page === 'overview'
              ? t('Your first three steps', 'เริ่มต้นในสามขั้นตอน')
              : t('A quick guide to this page', 'รู้จักหน้านี้ในสามขั้นตอน')}
          </h2>
          <p>
            {mode === 'demo'
              ? t(
                  'Explore with sample data. Demo progress is separate from your own workspace.',
                  'ลองจากข้อมูลตัวอย่าง ความคืบหน้าเดโมแยกจากเวิร์กสเปซของคุณ',
                )
              : t(
                  'Go at your own pace. You can reopen this guide anytime.',
                  'ค่อย ๆ เริ่มได้ตามสะดวก เปิดดูคำแนะนำอีกครั้งได้เสมอ',
                )}
          </p>
        </div>
        <button className="button ghost compact" onClick={dismiss}>
          {t('Skip / close', 'ข้าม / ปิด')}
        </button>
      </div>
      {page === 'overview' ? (
        <>
          <p>
            {done.filter(Boolean).length}/3 {t('completed', 'ขั้นตอนเสร็จแล้ว')}
          </p>
          <div className="workspace-guide-grid">
            {[
              t('Create a portfolio', 'สร้างพอร์ต'),
              t('Record your first trade', 'บันทึกเทรดแรก'),
              t('Review your overview', 'ดูผลในภาพรวม'),
            ].map((label, i) => (
              <button
                key={i}
                className="guide-task"
                onClick={() => {
                  if (i === 0) navigate('portfolio');
                  if (i === 1) addTrade();
                  if (i === 2) {
                    setReviewed(true);
                    try {
                      localStorage.setItem(
                        `tradovia.guide.v1.${mode}.reviewed`,
                        'yes',
                      );
                    } catch {
                      /* Session only. */
                    }
                    dismiss();
                  }
                }}
                disabled={i === 2 && !hasTrades}
              >
                <span>{done[i] ? '✓' : `0${i + 1}`}</span>
                <strong>{label}</strong>
                <small>
                  {done[i]
                    ? t('Done · open again', 'เสร็จแล้ว · เปิดดูอีกครั้ง')
                    : i === 2 && !hasTrades
                      ? t(
                          'Available after your first trade',
                          'เริ่มได้เมื่อมีเทรดแรก',
                        )
                      : t('Start →', 'เริ่มขั้นตอนนี้ →')}
                </small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="workspace-guide-grid">
          {steps.map(([title, text]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
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
