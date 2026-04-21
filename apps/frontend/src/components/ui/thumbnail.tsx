'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface ThumbnailProps {
  src?: string | null;
  alt: string;
  fallback: ReactNode;
  className?: string;
}

export default function Thumbnail({ src, alt, fallback, className }: ThumbnailProps) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
