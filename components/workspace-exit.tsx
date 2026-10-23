import type { ReactNode } from 'react';
import Link from 'next/link';
import { clearTradeDraft } from '@/lib/trade-draft';

/** Logout must submit to the server, never use the client-side page router. */
export default function WorkspaceExit({
  demo,
  className,
  children,
  draftKey,
}: {
  demo: boolean;
  className: string;
  children: ReactNode;
  draftKey?: string | null;
}) {
  if (demo)
    return (
      <Link prefetch={false} href="/" className={className}>
        {children}
      </Link>
    );
  return (
    <form
      method="post"
      action="/auth/logout"
      className="workspace-exit-form"
      onSubmit={() => {
        if (draftKey) clearTradeDraft(localStorage, draftKey);
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
