import type { ComponentProps } from 'react';
export default function Link({
  prefetch: _prefetch,
  children,
  ...props
}: ComponentProps<'a'> & { prefetch?: boolean }) {
  return <a {...props}>{children}</a>;
}
