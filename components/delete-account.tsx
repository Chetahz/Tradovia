'use client';
import { useState } from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { validAccountDeletionConfirmation } from '@/lib/account-deletion';
import type { Translate } from './workspace-ui';

export default function DeleteAccount({ t }: { t: Translate }) {
  const [confirmation, setConfirmation] = useState('');
  const ready = validAccountDeletionConfirmation(confirmation);
  return (
    <details className="account-danger-zone">
      <summary>
        <span>
          <ShieldAlert size={18} />
          <b>{t('Delete account data', 'ลบข้อมูลบัญชี')}</b>
        </span>
        <small>{t('Permanent action', 'ไม่สามารถย้อนกลับได้')}</small>
      </summary>
      <div className="account-danger-content">
        <p>
          {t(
            'This permanently removes your Tradovia profile, portfolios, journal, playbooks, settings and uploaded images. Export anything you need first.',
            'ระบบจะลบโปรไฟล์ พอร์ต บันทึกการเทรด Playbook การตั้งค่า และรูปภาพที่อัปโหลดอย่างถาวร โปรดส่งออกข้อมูลที่ต้องการเก็บก่อน',
          )}
        </p>
        <form
          method="post"
          action="/api/account/delete"
          onSubmit={(event) => {
            if (!ready) {
              event.preventDefault();
              return;
            }
            if (
              !window.confirm(
                t(
                  'Delete all Tradovia account data permanently?',
                  'ยืนยันลบข้อมูลบัญชี Tradovia ทั้งหมดอย่างถาวรหรือไม่?',
                ),
              )
            )
              event.preventDefault();
          }}
        >
          <label>
            <span>
              {t(
                'Type DELETE to confirm',
                'พิมพ์ DELETE หรือ ลบบัญชี เพื่อยืนยัน',
              )}
            </span>
            <input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <button className="button negative" type="submit" disabled={!ready}>
            <Trash2 size={16} />
            {t('Delete my account data', 'ลบข้อมูลบัญชีของฉัน')}
          </button>
        </form>
      </div>
    </details>
  );
}
