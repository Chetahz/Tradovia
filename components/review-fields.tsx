'use client';
import Image from 'next/image';
import { useState } from 'react';
import { planChecklist, type Trade } from '@/lib/domain';
import type { Translate } from './workspace-ui';

export const emptyReview = (trade: Trade): NonNullable<Trade['review']> => ({
  checklist: planChecklist(trade.playbook),
  emotion: '',
  lesson: '',
});

export function ReviewFields({
  trade,
  t,
  disabled = false,
  onChange,
}: {
  trade: Trade;
  t: Translate;
  disabled?: boolean;
  onChange: (trade: Trade) => void;
}) {
  const review = trade.review || emptyReview(trade);
  const update = (patch: Partial<NonNullable<Trade['review']>>) =>
    onChange({
      ...trade,
      review: { ...review, ...patch, completedAt: undefined },
    });
  const answered = review.checklist.filter((item) => item.answer).length;
  return (
    <div className="review-fields">
      {review.checklist.length > 0 && (
        <fieldset disabled={disabled} className="review-checklist">
          <legend>
            {t('Your plan, one rule at a time', 'ทบทวนกฎของแผนทีละข้อ')}
          </legend>
          <p className="journal-hint">
            {answered}/{review.checklist.length}{' '}
            {t(
              'answered · Leave blank if you cannot recall; blank is not a broken rule.',
              'ข้อตอบแล้ว · ถ้าจำไม่ได้ให้เว้นไว้ ช่องว่างไม่นับว่าผิดกฎ',
            )}
          </p>
          {review.checklist.map((item, index) => (
            <label key={index} className="review-rule">
              <span>{item.text}</span>
              <select
                aria-label={item.text}
                value={item.answer}
                onChange={(e) =>
                  update({
                    checklist: review.checklist.map((row, i) =>
                      i === index
                        ? {
                            ...row,
                            answer: e.target.value as typeof row.answer,
                          }
                        : row,
                    ),
                  })
                }
              >
                <option value="">{t('Not recorded', 'ยังไม่ระบุ')}</option>
                <option value="yes">{t('Followed', 'ทำตาม')}</option>
                <option value="no">{t('Not followed', 'ไม่ได้ทำตาม')}</option>
                <option value="na">{t('Not applicable', 'ไม่เกี่ยวข้อง')}</option>
              </select>
            </label>
          ))}
        </fieldset>
      )}
      <div className="review-reflection">
        <label className="daily-field">
          {t('How did you feel? (optional)', 'ตอนเทรดรู้สึกอย่างไร? (ไม่บังคับ)')}
          <select
            disabled={disabled}
            value={review.emotion}
            onChange={(e) =>
              update({ emotion: e.target.value as typeof review.emotion })
            }
          >
            <option value="">{t('Not recorded', 'ยังไม่ระบุ')}</option>
            {(
              ['calm', 'confident', 'anxious', 'fomo', 'frustrated'] as const
            ).map((value, i) => (
              <option key={value} value={value}>
                {
                  [
                    t('Calm', 'สงบ'),
                    t('Confident', 'มั่นใจ'),
                    t('Anxious', 'กังวล'),
                    t('FOMO', 'กลัวตกรถ'),
                    t('Frustrated', 'หงุดหงิด'),
                  ][i]
                }
              </option>
            ))}
          </select>
        </label>
        <label className="daily-field">
          {t(
            'One thing to repeat or improve (optional)',
            'สิ่งที่อยากทำซ้ำหรือปรับครั้งหน้า (ไม่บังคับ)',
          )}
          <textarea
            disabled={disabled}
            rows={2}
            maxLength={2000}
            value={review.lesson}
            placeholder={t(
              'A short sentence is enough.',
              'สั้น ๆ หนึ่งประโยคก็พอครับ',
            )}
            onChange={(e) => update({ lesson: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

export function ReviewEvidence({
  trade,
  mode,
  t,
  disabled,
  onChange,
  onUploading,
}: {
  trade: Trade;
  mode: string;
  t: Translate;
  disabled: boolean;
  onChange: (trade: Trade) => void;
  onUploading: (busy: boolean) => void;
}) {
  const [error, setError] = useState('');
  return (
    <details className="review-evidence">
      <summary>
        {t('Before & after charts (optional)', 'ภาพก่อนเข้าและหลังจบ (ไม่บังคับ)')} ·{' '}
        {trade.imageIds.length}/5
      </summary>
      <p className="journal-hint">
        {t(
          'PNG, JPG, WebP · up to 5 MB each. Existing images can be labelled below.',
          'PNG, JPG, WebP · ภาพละไม่เกิน 5 MB เลือกประเภทให้ภาพเดิมได้ด้านล่าง',
        )}
      </p>
      <div className="actions">
        {(['before', 'after'] as const).map((stage) => (
          <label className="button ghost compact" key={stage}>
            {stage === 'before'
              ? t('Add before chart', 'เพิ่มภาพก่อนเข้า')
              : t('Add after chart', 'เพิ่มภาพหลังจบ')}
            <input
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp"
              disabled={disabled || trade.imageIds.length >= 5}
              aria-label={
                stage === 'before'
                  ? t('Add before chart', 'เพิ่มภาพก่อนเข้า')
                  : t('Add after chart', 'เพิ่มภาพหลังจบ')
              }
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setError('');
                if (
                  !['image/png', 'image/jpeg', 'image/webp'].includes(
                    file.type,
                  ) ||
                  file.size > 5000000
                ) {
                  setError(
                    t(
                      'Choose PNG, JPG or WebP up to 5 MB.',
                      'เลือก PNG, JPG หรือ WebP ไม่เกิน 5 MB',
                    ),
                  );
                  return;
                }
                onUploading(true);
                try {
                  const body = new FormData();
                  body.set('image', file);
                  const response = await fetch(`/api/images?mode=${mode}`, {
                    method: 'POST',
                    body,
                  });
                  const result = (await response.json()) as {
                    id: string;
                    error?: string;
                  };
                  if (!response.ok)
                    throw new Error(result.error || 'Upload failed');
                  onChange({
                    ...trade,
                    imageIds: [...trade.imageIds, result.id],
                    imageStages: { ...trade.imageStages, [result.id]: stage },
                  });
                } catch {
                  setError(
                    t(
                      'Image could not be uploaded. Please try again.',
                      'อัปโหลดภาพไม่สำเร็จ กรุณาลองอีกครั้ง',
                    ),
                  );
                } finally {
                  onUploading(false);
                }
              }}
            />
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="negative">
          {error}
        </p>
      )}
      <div className="review-evidence-grid">
        {trade.imageIds.map((id) => (
          <div className="review-evidence-item" key={id}>
            <Image
              unoptimized
              width={320}
              height={190}
              src={`/api/images/${id}?mode=${mode}`}
              alt={t('Trade chart', 'ภาพกราฟการเทรด')}
            />
            <label className="daily-field">
              {t('Chart timing', 'ช่วงเวลาของภาพ')}
              <select
                disabled={disabled}
                value={trade.imageStages?.[id] || 'other'}
                onChange={(e) =>
                  onChange({
                    ...trade,
                    imageStages: {
                      ...trade.imageStages,
                      [id]: e.target.value as 'before' | 'after' | 'other',
                    },
                  })
                }
              >
                <option value="other">
                  {t('Unlabelled / other', 'ยังไม่ระบุ / อื่น ๆ')}
                </option>
                <option value="before">
                  {t('Before entry', 'ก่อนเข้าเทรด')}
                </option>
                <option value="after">{t('After exit', 'หลังจบเทรด')}</option>
              </select>
            </label>
            <button
              disabled={disabled}
              type="button"
              className="text-button"
              onClick={() =>
                onChange({
                  ...trade,
                  imageIds: trade.imageIds.filter((image) => image !== id),
                })
              }
            >
              {t('Remove from this trade', 'นำออกจากเทรดนี้')}
            </button>
          </div>
        ))}
      </div>
    </details>
  );
}

export function ReviewSummary({ trade, t }: { trade: Trade; t: Translate }) {
  if (!trade.review) return null;
  const review = trade.review;
  const emotion = {
    calm: t('Calm', 'สงบ'),
    confident: t('Confident', 'มั่นใจ'),
    anxious: t('Anxious', 'กังวล'),
    fomo: t('FOMO', 'กลัวตกรถ'),
    frustrated: t('Frustrated', 'หงุดหงิด'),
  };
  return (
    <div className="review-summary">
      {!trade.playbook && review.completedAt && (
        <p>
          {t('Reviewed · Traded without a plan', 'ทบทวนแล้ว · เทรดโดยไม่มีแผน')}
        </p>
      )}
      {review.checklist.length > 0 && (
        <ul>
          {review.checklist.map((item, i) => (
            <li key={i}>
              <span>{item.text}</span>
              <strong>
                {item.answer === 'yes'
                  ? t('Followed', 'ทำตาม')
                  : item.answer === 'no'
                    ? t('Not followed', 'ไม่ได้ทำตาม')
                    : item.answer === 'na'
                      ? t('Not applicable', 'ไม่เกี่ยวข้อง')
                      : t('Not recorded', 'ยังไม่ระบุ')}
              </strong>
            </li>
          ))}
        </ul>
      )}
      {review.emotion && (
        <p>
          {t('Feeling', 'อารมณ์')}: {emotion[review.emotion]}
        </p>
      )}
      {review.lesson && (
        <p style={{ whiteSpace: 'pre-wrap' }}>
          <strong>{t('Next time', 'ครั้งหน้า')}</strong>
          <br />
          {review.lesson}
        </p>
      )}
    </div>
  );
}
