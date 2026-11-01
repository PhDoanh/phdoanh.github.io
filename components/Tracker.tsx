'use client';
import { useEffect } from 'react';

type GC = { count?: (o: { path: string; title?: string; event?: boolean }) => void };
function send(path: string) {
  const w = window as unknown as { goatcounter?: GC; __events?: string[] };
  (w.__events ||= []).push(path);
  w.goatcounter?.count?.({ path, title: path, event: true });
}

export default function Tracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[data-track]');
      if (a) send(`click-${a.getAttribute('data-track')}`);
    };
    document.addEventListener('click', onClick);
    const end = document.getElementById('contact');
    let io: IntersectionObserver | undefined;
    if (end) {
      io = new IntersectionObserver((es) => {
        if (es.some((x) => x.isIntersecting)) { send('reached-last-station'); io?.disconnect(); }
      }, { threshold: 0.5 });
      io.observe(end);
    }
    return () => { document.removeEventListener('click', onClick); io?.disconnect(); };
  }, []);
  return null;
}
