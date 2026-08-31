'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { HomeIcon, ReceiptIcon, SirenIcon, TicketIcon } from './icons';

interface TabItem {
  href: string;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}

const TABS: TabItem[] = [
  { href: '/app', label: '홈', Icon: HomeIcon },
  { href: '/app/orders', label: '주문내역', Icon: ReceiptIcon },
  { href: '/app/tickets', label: '내 티켓', Icon: TicketIcon },
  { href: '/app/report', label: '신고', Icon: SirenIcon },
];

/** 회원 앱 하단 고정 탭바 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[420px] -translate-x-1/2 border-t border-[#E5E8EB] bg-white">
      <ul className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 pb-1 pt-2 text-[11px] font-semibold ${
                  isActive ? 'text-[#D6336C]' : 'text-[#8B95A1]'
                }`}
              >
                <Icon className="h-[22px] w-[22px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
