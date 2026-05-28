'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ARTIST } from '@/lib/data';

const tabs = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/artist', label: ARTIST.name, icon: null },
  { href: '/celebus', label: 'CELEBUS', icon: null, center: true },
  { href: '/game', label: 'Game', icon: Gamepad2 },
  { href: '/my', label: 'My', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 flex h-16 items-center justify-around border-t border-border-card bg-card-dark/95 px-2 backdrop-blur">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + '/');
        if (t.center) {
          return (
            <Link key={t.href} href={t.href} className="-mt-6 flex flex-col items-center">
              <span className="grid size-12 place-items-center rounded-full gra-primary shadow-lg shadow-primary/40">
                <span className="text-[11px] font-bold text-white">V01D</span>
              </span>
            </Link>
          );
        }
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className="flex w-14 flex-col items-center gap-0.5">
            {Icon ? (
              <Icon className={cn('size-5', active ? 'text-primary' : 'text-text-disabled')} />
            ) : (
              <span className={cn('grid size-5 place-items-center rounded-full text-[9px] font-bold', active ? 'bg-primary text-white' : 'bg-muted text-text-disabled')}>
                {t.label.slice(0, 2)}
              </span>
            )}
            <span className={cn('text-[10px]', active ? 'text-primary' : 'text-text-disabled')}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
