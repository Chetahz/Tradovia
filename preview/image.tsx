/* oxlint-disable next/no-img-element -- Static preview adapter renders local image blobs. */
import { useEffect, useState, type ComponentProps } from 'react';
import { readImage } from './storage';
export default function Image({
  src,
  alt,
  unoptimized: _unoptimized,
  ...props
}: Omit<ComponentProps<'img'>, 'src'> & {
  src?: string;
  unoptimized?: boolean;
}) {
  const [resolved, setResolved] = useState<string>();
  useEffect(() => {
    if (!src?.startsWith('/api/images/')) return;
    let active = true,
      url = '';
    void readImage(src.split('/').at(-1)!.split('?')[0]).then((blob) => {
      if (!active || !blob) return;
      url = URL.createObjectURL(blob);
      setResolved(url);
    });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);
  // This is the static preview's image adapter, including IndexedDB blob URLs.
  // oxlint-disable-next-line next/no-img-element
  return (
    <img
      {...props}
      alt={alt ?? ''}
      src={src?.startsWith('/api/images/') ? resolved : src}
    />
  );
}
