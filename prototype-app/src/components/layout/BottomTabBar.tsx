'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useArtistStore } from '@/stores/useArtistStore';
import {
  HomeIcon,
  SparklesIcon,
  StarIcon,
  PuzzlePieceIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  SparklesIcon as SparklesIconSolid,
  StarIcon as StarIconSolid,
  PuzzlePieceIcon as PuzzlePieceIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

export default function BottomTabBar() {
  const pathname = usePathname();
  const artistName = useArtistStore((s) => s.activeArtist.name);

  const tabs = [
    { key: 'home', label: '홈', href: '/home', Icon: HomeIcon, ActiveIcon: HomeIconSolid },
    { key: 'artist', label: artistName, href: '/artist', Icon: SparklesIcon, ActiveIcon: SparklesIconSolid },
    { key: 'celebus', label: 'CELEBUS', href: '/celebus', Icon: StarIcon, ActiveIcon: StarIconSolid },
    { key: 'game', label: '게임존', href: '/game', Icon: PuzzlePieceIcon, ActiveIcon: PuzzlePieceIconSolid },
    { key: 'my', label: 'MY', href: '/my', Icon: UserIcon, ActiveIcon: UserIconSolid },
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 safe-bottom"
      style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex h-14">
        {tabs.map(({ key, label, href, Icon, ActiveIcon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const TabIcon = isActive ? ActiveIcon : Icon;
          return (
            <Link
              key={key}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
            >
              <TabIcon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400'}`}
              />
              <span
                className={`text-[9px] font-medium transition-colors truncate max-w-[60px] ${isActive ? 'text-violet-600' : 'text-gray-400'}`}
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
