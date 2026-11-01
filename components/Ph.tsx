import type { ReactNode } from 'react';
export const isPh = (s: string) => s.includes('PLACEHOLDER');
export function Link({ href, track, children }: { href: string; track: string; children: ReactNode }) {
  if (isPh(href)) return <span className="ph" data-link-placeholder>{children} <small>{href}</small></span>;
  const ext = /^https?:/.test(href);
  return (
    <a href={href} data-track={track} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}
