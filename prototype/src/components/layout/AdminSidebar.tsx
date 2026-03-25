'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  StarIcon,
  DevicePhoneMobileIcon,
  CubeIcon,
  HeartIcon,
  TicketIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  home: HomeIcon,
  users: UsersIcon,
  folder: FolderIcon,
  star: StarIcon,
  device: DevicePhoneMobileIcon,
  cube: CubeIcon,
  heart: HeartIcon,
  ticket: TicketIcon,
  gamepad: PuzzlePieceIcon,
  sparkles: SparklesIcon,
  banknotes: BanknotesIcon,
  cog: Cog6ToothIcon,
};

interface MenuItem {
  label: string;
  href?: string;
  icon: string;
  active?: boolean;
  children?: { label: string; href: string }[];
}

const MENU_ITEMS: MenuItem[] = [
  { label: '대시보드', href: '/', icon: 'home' },
  {
    label: '회원', icon: 'users',
    children: [
      { label: '회원 리스트', href: '/members' },
    ],
  },
  { label: '프로젝트', href: '#', icon: 'folder' },
  {
    label: '아티스트', icon: 'star',
    children: [
      { label: '그룹 리스트', href: '#' },
      { label: '멤버 리스트', href: '#' },
    ],
  },
  { label: '앱', href: '#', icon: 'device' },
  {
    label: 'BIVE', icon: 'cube',
    children: [
      { label: '에디션 관리', href: '#' },
      { label: '민팅 관리', href: '#' },
      { label: '혜택 관리', href: '#' },
    ],
  },
  { label: 'Fans', href: '#', icon: 'heart' },
  { label: '티켓', href: '#', icon: 'ticket' },
  {
    label: '게임존', icon: 'gamepad', active: true,
    children: [
      { label: '게임존 홈', href: '/game-zone' },
      { label: '게임 관리', href: '/game-zone/games' },
      { label: '랭킹', href: '/game-zone/ranking' },
      { label: 'GP 교환소', href: '/game-zone/exchange' },
      { label: 'GP 변동 내역', href: '/game-zone/gp-history' },
    ],
  },
  {
    label: '팬퀘스트', icon: 'sparkles',
    children: [
      { label: 'Fan Quest 관리', href: '/fan-quest' },
    ],
  },
  { label: '재무', href: '#', icon: 'banknotes' },
  {
    label: '관리자', icon: 'cog',
    children: [
      { label: '관리자 목록', href: '#' },
      { label: '역할 관리', href: '#' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['게임존', '팬퀘스트'])
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === '/game-zone') return pathname === '/game-zone';
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href) && href !== '#';
  };

  const isGroupActive = (item: MenuItem) => {
    if (item.children) {
      return item.children.some((child) => isActive(child.href));
    }
    return item.href ? isActive(item.href) : false;
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="px-5 py-4 border-b border-gray-200">
        <Link href="/game-zone" className="text-xl font-bold text-gray-900">
          CELEBUS
        </Link>
      </div>

      <div className="px-3 py-2">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-2">
          관리자 메뉴
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {MENU_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedGroups.has(item.label);
          const groupActive = isGroupActive(item);

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    groupActive
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {groupActive && (
                    <span className="absolute left-0 w-0.5 h-5 bg-blue-600 rounded-r" />
                  )}
                  {Icon && <Icon className="w-5 h-5 shrink-0" />}
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href || '#'}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive(item.href || '')
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5 shrink-0" />}
                  <span>{item.label}</span>
                </Link>
              )}

              {hasChildren && isExpanded && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {item.children!.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className={`flex items-center gap-2 pl-5 pr-3 py-1.5 rounded-md text-[13px] transition-colors ${
                        isActive(child.href)
                          ? 'text-blue-600 bg-blue-50 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
            관
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">관리자</p>
            <p className="text-xs text-gray-500 truncate">admin@celebus.com</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
