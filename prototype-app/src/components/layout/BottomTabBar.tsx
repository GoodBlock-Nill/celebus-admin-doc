'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  Squares2X2Icon,
  StarIcon,
  PuzzlePieceIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  StarIcon as StarIconSolid,
  PuzzlePieceIcon as PuzzlePieceIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

const TAB_ITEMS = [
  { key: 'home', label: '홈', href: '/home', Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  { key: 'collection', label: '컬렉션', href: '/collection', Icon: Squares2X2Icon, ActiveIcon: Squares2X2IconSolid },
  { key: 'celebus', label: 'CELEBUS', href: '/celebus', Icon: StarIcon, ActiveIcon: StarIconSolid },
  { key: 'game', label: '게임존', href: '/game', Icon: PuzzlePieceIcon, ActiveIcon: PuzzlePieceIconSolid },
  { key: 'my', label: 'MY', href: '/my', Icon: UserIcon, ActiveIcon: UserIconSolid },
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
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            >
              <TabIcon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400'}`}
              />
              <span
                className={`text-[9px] font-medium transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400'}`}
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
