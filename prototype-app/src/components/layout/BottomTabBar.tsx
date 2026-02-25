'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  TrophyIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const TAB_ITEMS = [
  { key: 'home', label: '홈', href: '/home', Icon: HomeIcon },
  { key: 'ranking', label: '랭킹', href: '/ranking', Icon: TrophyIcon },
  { key: 'exchange', label: '교환소', href: '/exchange', Icon: ArrowsRightLeftIcon },
  { key: 'history', label: '내역', href: '/history', Icon: ClockIcon },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 z-50 safe-bottom"
      style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex h-14">
        {TAB_ITEMS.map(({ key, label, href, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={key}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
