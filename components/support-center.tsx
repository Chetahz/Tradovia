'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Headphones,
  MessageCircle,
  Plus,
  Send,
} from 'lucide-react';
import type { Translate } from './workspace-ui';
import {
  SUPPORT_CATEGORIES,
  type SupportMessage,
  type SupportTicket,
} from '@/lib/support';

const dateTime = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok',
});
const labels: Record<string, [string, string]> = {
  account: ['Account', 'บัญชี'],
  billing: ['Billing', 'การชำระเงิน'],
  import: ['Import', 'การนำเข้าข้อมูล'],
  bug: ['Problem', 'ปัญหาการใช้งาน'],
  suggestion: ['Suggestion', 'ข้อเสนอแนะ'],
  other: ['Other', 'เรื่องอื่น ๆ'],
};

export default function SupportCenter({
  mode,
  t,
}: {
  mode: string;
  t: Translate;
}) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selected, setSelected] = useState('');
  const [creating, setCreating] = useState(false);
  const [category, setCategory] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const active = tickets.find((ticket) => ticket.id === selected);
  const thread = useMemo(
    () => messages.filter((item) => item.ticketId === selected),
    [messages, selected],
  );
  const load = useCallback(async () => {
    if (mode === 'demo') return;
    const response = await fetch(`/api/support?mode=${mode}`);
    if (!response.ok) return;
    const value = (await response.json()) as {
      tickets: SupportTicket[];
      messages: SupportMessage[];
    };
    setTickets(value.tickets);
    setMessages(value.messages);
  }, [mode]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  const submit = async (body: unknown) => {
    setBusy(true);
    setFeedback('');
    try {
      const response = await fetch(`/api/support?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const value = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) throw new Error(value.error || 'Unable to send');
      setMessage('');
      setSubject('');
      setCreating(false);
      await load();
      if (value.id) setSelected(value.id);
      setFeedback(
        t(
          'Message sent. We will reply here.',
          'ส่งข้อความแล้ว ทีมงานจะตอบกลับที่หน้านี้',
        ),
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : t('Unable to send', 'ส่งไม่สำเร็จ'),
      );
    } finally {
      setBusy(false);
    }
  };
  if (mode === 'demo')
    return (
      <div className="panel support-center">
        <div className="support-heading">
          <span className="settings-feature-icon">
            <Headphones size={19} />
          </span>
          <div>
            <h2>{t('Help & support', 'ช่วยเหลือและติดต่อทีมงาน')}</h2>
            <p className="muted-copy">
              {t(
                'Sign in to create a request and follow replies in one place.',
                'เข้าสู่ระบบเพื่อแจ้งปัญหาและติดตามคำตอบได้ในที่เดียว',
              )}
            </p>
          </div>
        </div>
        <Link className="button ink compact" href="/auth">
          {t('Sign in to contact us', 'เข้าสู่ระบบเพื่อติดต่อ')}
        </Link>
      </div>
    );
  return (
    <div className="panel support-center">
      <div className="support-heading">
        <span className="settings-feature-icon">
          <Headphones size={19} />
        </span>
        <div>
          <h2>{t('Help & support', 'ช่วยเหลือและติดต่อทีมงาน')}</h2>
          <p className="muted-copy">
            {t(
              'Your private conversation with the Tradovia team.',
              'ช่องทางส่วนตัวสำหรับคุยกับทีม Tradovia และติดตามสถานะ',
            )}
          </p>
        </div>
        <button
          type="button"
          className="button ink compact"
          onClick={() => {
            setCreating(true);
            setSelected('');
          }}
        >
          <Plus size={15} />
          {t('New request', 'แจ้งเรื่องใหม่')}
        </button>
      </div>
      {!creating && !active && (
        <div className="support-ticket-list">
          {tickets.map((ticket) => (
            <button
              type="button"
              key={ticket.id}
              onClick={() => setSelected(ticket.id)}
            >
              <span>
                <b>{ticket.subject}</b>
                <small>
                  {t(...labels[ticket.category])} ·{' '}
                  {dateTime.format(ticket.updatedAt)}
                </small>
              </span>
              <em className={`support-status ${ticket.status}`}>
                {ticket.status === 'open'
                  ? t('With our team', 'รอทีมงาน')
                  : ticket.status === 'waiting_customer'
                    ? t('Your reply', 'รอคุณตอบ')
                    : t('Resolved', 'แก้ไขแล้ว')}
              </em>
              <ChevronRight size={17} />
            </button>
          ))}
          {!tickets.length && (
            <div className="support-empty">
              <MessageCircle size={24} />
              <b>{t('No requests yet', 'ยังไม่มีรายการติดต่อ')}</b>
              <span>
                {t(
                  'If something gets in your way, tell us here.',
                  'หากพบปัญหา แจ้งทีมงานได้จากตรงนี้',
                )}
              </span>
            </div>
          )}
        </div>
      )}
      {creating && (
        <form
          className="support-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ action: 'create', category, subject, message });
          }}
        >
          <label>
            <span>{t('Topic', 'ประเภท')}</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {SUPPORT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {t(...labels[item])}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('Subject', 'หัวข้อ')}</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              placeholder={t('Briefly describe the issue', 'สรุปปัญหาสั้น ๆ')}
            />
          </label>
          <label>
            <span>{t('What happened?', 'เกิดอะไรขึ้น')}</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              placeholder={t(
                'Tell us what you tried and what you expected.',
                'บอกขั้นตอนที่ทำ สิ่งที่พบ และสิ่งที่คาดหวัง',
              )}
            />
          </label>
          <div className="support-actions">
            <button
              type="button"
              className="button ghost compact"
              onClick={() => setCreating(false)}
            >
              {t('Cancel', 'ยกเลิก')}
            </button>
            <button
              className="button ink compact"
              disabled={
                busy || subject.trim().length < 4 || message.trim().length < 10
              }
            >
              <Send size={15} />
              {busy ? t('Sending…', 'กำลังส่ง…') : t('Send request', 'ส่งให้ทีมงาน')}
            </button>
          </div>
        </form>
      )}
      {active && (
        <div className="support-thread">
          <button
            type="button"
            className="text-button"
            onClick={() => setSelected('')}
          >
            ← {t('All requests', 'กลับไปทุกรายการ')}
          </button>
          <div className="support-thread-head">
            <div>
              <span className="overline">{t(...labels[active.category])}</span>
              <h3>{active.subject}</h3>
            </div>
            <em className={`support-status ${active.status}`}>
              {active.status === 'open'
                ? t('With our team', 'รอทีมงาน')
                : active.status === 'waiting_customer'
                  ? t('Your reply', 'รอคุณตอบ')
                  : t('Resolved', 'แก้ไขแล้ว')}
            </em>
          </div>
          <div className="support-messages">
            {thread.map((item) => (
              <article className={item.authorType} key={item.id}>
                <b>
                  {item.authorType === 'admin' ? 'Tradovia' : t('You', 'คุณ')}
                </b>
                <p>{item.body}</p>
                <small>{dateTime.format(item.createdAt)}</small>
              </article>
            ))}
          </div>
          <form
            className="support-reply"
            onSubmit={(event) => {
              event.preventDefault();
              void submit({ action: 'reply', ticketId: active.id, message });
            }}
          >
            <label>
              <span>
                {active.status === 'resolved'
                  ? t('Reply to reopen', 'ตอบกลับเพื่อเปิดเรื่องอีกครั้ง')
                  : t('Reply', 'ตอบกลับ')}
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
              />
            </label>
            <button
              className="button ink compact"
              disabled={busy || message.trim().length < 2}
            >
              <Send size={15} />
              {t('Send', 'ส่งข้อความ')}
            </button>
          </form>
        </div>
      )}
      {feedback && <output className="support-feedback">{feedback}</output>}
    </div>
  );
}
