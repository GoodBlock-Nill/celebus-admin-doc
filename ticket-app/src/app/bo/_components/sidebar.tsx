'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHydrated } from '@/lib/use-hydrated';
import { DemoPanel } from './demo-panel';
import { useQueueCounts } from './hooks';

type BadgeKey = 'depositPending' | 'reportPending';

interface NavItem {
  href: string;
  label: string;
  badgeKey?: BadgeKey;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/bo', label: '대시보드' },
  { href: '/bo/concerts', label: '공연·재고 관리' },
  { href: '/bo/deposits', label: '주문·입금 확인', badgeKey: 'depositPending' },
  { href: '/bo/refunds', label: '취소·환불' },
  { href: '/bo/checkin', label: '발권·체크인' },
  { href: '/bo/reports', label: '신고 처리', badgeKey: 'reportPending' },
  { href: '/bo/logs', label: '활동 로그' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/bo') return pathname === '/bo';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const counts = useQueueCounts();

  return (
    <aside className="sticky top-0 flex h-dvh w-[220px] shrink-0 flex-col border-r border-[#E3E5EA] bg-white">
      <div className="border-b border-[#E3E5EA] px-4 py-4">
        <Link href="/" className="block">
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#3056D3]">CELEBUS ADMIN</p>
          <p className="mt-0.5 text-[15px] font-bold text-[#1B1D22]">티켓</p>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const count = item.badgeKey ? counts[item.badgeKey] : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    active
                      ? 'bg-[#EDF1FD] font-bold text-[#3056D3]'
                      : 'font-medium text-[#4A4E5A] hover:bg-[#F2F3F6]'
                  }`}
                >
                  <span>{item.label}</span>
                  {hydrated && count > 0 ? (
                    <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#C2402A] px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <DemoPanel />
    </aside>
  );
}
