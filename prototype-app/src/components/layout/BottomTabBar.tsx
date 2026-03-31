'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  SparklesIcon,
  TrophyIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  SparklesIcon as SparklesIconSolid,
  TrophyIcon as TrophyIconSolid,
  GiftIcon as GiftIconSolid,
} from '@heroicons/react/24/solid';

const TAB_ITEMS = [
  { key: 'home', label: '홈', href: '/home', Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  { key: 'quest', label: '퀘스트', href: '/quest', Icon: SparklesIcon, ActiveIcon: SparklesIconSolid },
  { key: 'ranking', label: '랭킹', href: '/ranking', Icon: TrophyIcon, ActiveIcon: TrophyIconSolid },
  { key: 'rewards', label: '보상', href: '/rewards', Icon: GiftIcon, ActiveIcon: GiftIconSolid },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-violet-100 z-50 safe-bottom"
      style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex h-14">
        {TAB_ITEMS.map(({ key, label, href, Icon, ActiveIcon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const TabIcon = isActive ? ActiveIcon : Icon;
          return (
            <Link
              key={key}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
            >
              <TabIcon
                className={`w-6 h-6 transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400'}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400'}`}
              >
                {label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-violet-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
