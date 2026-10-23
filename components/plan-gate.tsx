import { LockKeyhole, Sparkles } from 'lucide-react';
import type { Translate } from './workspace-ui';

export default function PlanGate({
  title,
  description,
  t,
  compact = false,
}: {
  title: string;
  description: string;
  t: Translate;
  compact?: boolean;
}) {
  return (
    <section className={`plan-gate${compact ? ' compact' : ''}`} aria-label={title}>
      <span className="plan-gate-icon" aria-hidden="true">
        <LockKeyhole size={20} />
      </span>
      <div>
        <span className="overline">PRO</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className="button ink compact"
        onClick={() => {
          window.location.hash = 'settings';
        }}
      >
        <Sparkles size={16} />
        {t('See Pro', 'ดูแพ็กเกจ Pro')}
      </button>
    </section>
  );
}
