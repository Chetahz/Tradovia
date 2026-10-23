'use client';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { latestReviewedLesson } from '@/lib/daily-companion';
import type { Trade } from '@/lib/domain';
import type { Translate } from './workspace-ui';

export default function LessonRecall({
  trades,
  t,
  onView,
}: {
  trades: Trade[];
  t: Translate;
  onView: (trade: Trade) => void;
}) {
  const trade = latestReviewedLesson(trades);
  if (!trade) return null;
  return (
    <section
      className="lesson-recall"
      aria-label={t('Your latest lesson', 'บทเรียนล่าสุดของคุณ')}
    >
      <div className="lesson-recall-label">
        <BookOpen size={18} aria-hidden="true" />
        {t('A NOTE FROM YOUR PAST SELF', 'ฝากไว้ให้ตัวเองในครั้งถัดไป')}
      </div>
      <blockquote>{trade.review!.lesson}</blockquote>
      <div className="lesson-recall-footer">
        <span>
          {trade.symbol} · {trade.date}
        </span>
        <button type="button" onClick={() => onView(trade)}>
          {t('Revisit trade', 'ย้อนดูเทรดนี้')}{' '}
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
