'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  decisionCoach,
  mostMissedRule,
  pendingReviewTrades,
} from '@/lib/decision-coach';
import {
  isTradeReviewed,
  money,
  net,
  planChecklist,
  type Trade,
} from '@/lib/domain';
import type { DailyCheckin } from '@/lib/daily-checkin';
import type { Translate } from './workspace-ui';

type QuickAdherence = 'yes' | 'partial' | 'no' | '';
type ReviewEmotion = NonNullable<Trade['review']>['emotion'];

const lessonOptions = [
  { en: 'Repeat this setup', th: 'ทำรูปแบบนี้ซ้ำ' },
  { en: 'Wait for confirmation', th: 'รอสัญญาณยืนยัน' },
  { en: 'Respect the stop', th: 'เคารพจุดตัดขาดทุน' },
  { en: 'Reduce the size', th: 'ลดขนาดการเทรด' },
  { en: 'Skip this next time', th: 'ครั้งหน้าข้ามรูปแบบนี้' },
] as const;

export default function DecisionCoach({
  trades,
  today,
  checkin,
  t,
  busy,
  save,
  onFullReview,
  onView,
}: {
  trades: Trade[];
  today: string;
  checkin?: DailyCheckin;
  t: Translate;
  busy: boolean;
  save: (trade: Trade) => Promise<boolean>;
  onFullReview: () => void;
  onView: (trade: Trade) => void;
}) {
  const queue = useMemo(() => pendingReviewTrades(trades), [trades]);
  const priority = useMemo(
    () => decisionCoach(trades, today, checkin),
    [trades, today, checkin],
  );
  const missed = useMemo(() => mostMissedRule(trades), [trades]);
  const [selectedId, setSelectedId] = useState('');
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [adherence, setAdherence] = useState<QuickAdherence>('');
  const [emotion, setEmotion] = useState<ReviewEmotion>('');
  const [lesson, setLesson] = useState('');
  const [customLesson, setCustomLesson] = useState('');
  const current = queue.find((trade) => trade.id === selectedId) || queue[0];
  const closed = trades.filter((trade) => trade.status === 'CLOSED');
  const reviewed = closed.filter(isTradeReviewed).length;
  const completion = closed.length
    ? Math.round((reviewed / closed.length) * 100)
    : 100;

  const resetReview = (selected = '') => {
    setSelectedId(selected);
    setStage(1);
    setAdherence('');
    setEmotion('');
    setLesson('');
    setCustomLesson('');
  };

  const quickSave = async () => {
    const finalLesson = customLesson.trim() || lesson;
    if (!current || !adherence || !finalLesson) return;
    setSavingId(current.id);
    setMessage('');
    try {
      const ok = await save({
        ...current,
        adherence,
        review: {
          checklist:
            current.review?.checklist || planChecklist(current.playbook),
          emotion,
          lesson: finalLesson,
          completedAt: new Date().toISOString(),
        },
      });
      if (ok) {
        resetReview();
        setMessage(
          t(
            'Lesson saved. Tradovia will bring it back when it matters.',
            'เก็บบทเรียนแล้ว Tradovia จะนำกลับมาเตือนเมื่อเกี่ยวข้อง',
          ),
        );
      } else
        setMessage(
          t('Could not save. Please retry.', 'บันทึกไม่สำเร็จ กรุณาลองใหม่'),
        );
    } catch {
      setMessage(t('Could not save. Please retry.', 'บันทึกไม่สำเร็จ กรุณาลองใหม่'));
    } finally {
      setSavingId('');
    }
  };

  const PriorityIcon =
    priority.kind === 'open'
      ? ShieldCheck
      : priority.kind === 'review'
        ? ListChecks
        : Sparkles;
  return (
    <section
      className="decision-coach"
      aria-label={t('Daily decision coach', 'โค้ชการตัดสินใจวันนี้')}
    >
      <div className="decision-coach-main">
        <div className="decision-coach-icon">
          <PriorityIcon size={22} />
        </div>
        <div>
          <span className="overline">
            {t('TODAY’S DECISION COACH', 'โค้ชการตัดสินใจวันนี้')}
          </span>
          <h2>{t(priority.title.en, priority.title.th)}</h2>
          <p>{t(priority.body.en, priority.body.th)}</p>
        </div>
        {priority.kind === 'review' && (
          <button className="button ink compact" onClick={onFullReview}>
            {t('Open full review', 'เปิดทบทวนเต็ม')} <ArrowRight size={16} />
          </button>
        )}
      </div>

      {missed && (
        <div className="decision-coach-signal">
          <CircleAlert size={17} />
          <span>
            <b>{t('Pattern to protect', 'กฎที่ต้องระวัง')}</b>
            {missed.text} · {missed.count} {t('misses', 'ครั้ง')}
          </span>
        </div>
      )}

      <div className="review-inbox-head">
        <div>
          <span className="overline">{t('REVIEW INBOX', 'กล่องทบทวน')}</span>
          <h3>
            {queue.length
              ? t(`${queue.length} waiting`, `เหลือ ${queue.length} รายการ`)
              : t('You are caught up', 'ทบทวนครบแล้ว')}
          </h3>
        </div>
        <div className="review-progress">
          <progress
            aria-label={t('Review completion', 'ความคืบหน้าการทบทวน')}
            value={completion}
            max={100}
          />
          <b>{completion}%</b>
        </div>
      </div>

      {message && (
        <output className="decision-coach-message">
          <Check size={15} /> {message}
        </output>
      )}
      {current ? (
        <div className="review-inbox-card">
          <div className="review-inbox-trade">
            <span className="asset-avatar">{current.symbol.slice(0, 2)}</span>
            <span>
              <b>
                {current.symbol} · {current.side === 'LONG' ? 'BUY' : 'SELL'}
              </b>
              <small>
                {current.date} · {current.time}
                {current.setup ? ` · ${current.setup}` : ''}
              </small>
            </span>
            <strong className={net(current) >= 0 ? 'positive' : 'negative'}>
              {money(net(current))}
            </strong>
            <button
              aria-label={t('View trade', 'ดูรายการเทรด')}
              onClick={() => onView(current)}
            >
              <Eye size={18} />
            </button>
          </div>
          <div className="review-inbox-question">
            <div className="quick-review-progress" aria-label={t('Quick review progress', 'ความคืบหน้าการทบทวนด่วน')}>
              {[1, 2, 3].map((value) => (
                <span key={value} className={stage >= value ? 'active' : ''}>
                  {value}
                </span>
              ))}
              <small>{t('About 30 seconds', 'ประมาณ 30 วินาที')}</small>
            </div>
            {stage === 1 && (
              <div className="quick-review-step">
                <b>
                  {current.playbook
                    ? t(
                        `Did you follow “${current.playbook.name}”?`,
                        `คุณทำตาม “${current.playbook.name}” หรือไม่?`,
                      )
                    : t(
                        'This trade had no written plan. Confirm to continue.',
                        'เทรดนี้ไม่มีแผนที่บันทึกไว้ ยืนยันเพื่อทบทวนต่อ',
                      )}
                </b>
                <div className="quick-review-choices">
                  {current.playbook ? (
                    ([
                      ['yes', t('Followed', 'ตามแผน')],
                      ['partial', t('Partly', 'บางส่วน')],
                      ['no', t('Outside', 'นอกแผน')],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        disabled={busy || Boolean(savingId)}
                        onClick={() => {
                          setAdherence(value);
                          setStage(2);
                        }}
                      >
                        {label}
                      </button>
                    ))
                  ) : (
                    <button
                      className="no-plan"
                      disabled={busy || Boolean(savingId)}
                      onClick={() => {
                        setAdherence('no');
                        setStage(2);
                      }}
                    >
                      {t('Confirm: no written plan', 'ยืนยันว่าไม่มีแผน')}
                    </button>
                  )}
                </div>
              </div>
            )}
            {stage === 2 && (
              <div className="quick-review-step">
                <b>{t('How did you feel during the decision?', 'ตอนตัดสินใจ คุณรู้สึกอย่างไร?')}</b>
                <div className="quick-review-choices emotion-choices">
                  {([
                    ['calm', t('Calm', 'สงบ')],
                    ['confident', t('Confident', 'มั่นใจ')],
                    ['anxious', t('Anxious', 'กังวล')],
                    ['fomo', 'FOMO'],
                    ['frustrated', t('Frustrated', 'หงุดหงิด')],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setEmotion(value);
                        setStage(3);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                  <button className="subtle" onClick={() => setStage(3)}>
                    {t('Skip', 'ข้าม')}
                  </button>
                </div>
              </div>
            )}
            {stage === 3 && (
              <div className="quick-review-step">
                <b>{t('What should your next self remember?', 'ครั้งหน้าคุณควรจำอะไรไว้?')}</b>
                <div className="quick-review-lesson-options">
                  {lessonOptions.map((option) => {
                    const label = t(option.en, option.th);
                    return (
                      <button
                        key={option.en}
                        aria-pressed={lesson === label && !customLesson}
                        onClick={() => {
                          setLesson(label);
                          setCustomLesson('');
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <label className="quick-review-custom">
                  <span>{t('Or write one short sentence', 'หรือเขียนสั้น ๆ หนึ่งประโยค')}</span>
                  <input
                    value={customLesson}
                    maxLength={200}
                    placeholder={t('My lesson…', 'บทเรียนของฉัน…')}
                    onChange={(event) => {
                      setCustomLesson(event.target.value);
                      if (event.target.value) setLesson('');
                    }}
                  />
                </label>
                <div className="quick-review-final-actions">
                  <button className="subtle" onClick={() => setStage(2)}>
                    {t('Back', 'ย้อนกลับ')}
                  </button>
                  <button
                    className="save-lesson"
                    disabled={busy || Boolean(savingId) || !(lesson || customLesson.trim())}
                    onClick={() => void quickSave()}
                  >
                    {savingId ? t('Saving…', 'กำลังบันทึก…') : t('Save lesson', 'เก็บบทเรียน')}
                    <Check size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
          {queue.length > 1 && (
            <div
              className="review-inbox-queue"
              aria-label={t('Other reviews', 'รายการทบทวนอื่น')}
            >
              {queue.slice(0, 4).map((trade) => (
                <button
                  key={trade.id}
                  className={trade.id === current.id ? 'selected' : ''}
                  onClick={() => resetReview(trade.id)}
                >
                  <b>{trade.symbol}</b>
                  <span>{trade.date.slice(5)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="review-inbox-empty">
          <Check size={20} />
          <span>
            <b>{t('Nothing waiting', 'ไม่มีรายการค้าง')}</b>
            <small>
              {t(
                'New closed trades will appear here automatically.',
                'เทรดที่ปิดใหม่จะเข้ามารอทบทวนตรงนี้อัตโนมัติ',
              )}
            </small>
          </span>
        </div>
      )}
    </section>
  );
}
