'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Squares2X2Icon,
  UsersIcon,
  FolderIcon,
  BuildingStorefrontIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  Square2StackIcon,
  LinkIcon,
  TrophyIcon,
  ShoppingBagIcon,
  KeyIcon,
  PuzzlePieceIcon,
  HomeIcon as GZHome,
  RectangleStackIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  SparklesIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowRightStartOnRectangleIcon,
  UserIcon,
  PresentationChartLineIcon,
  ListBulletIcon,
  BookOpenIcon,
  InboxStackIcon,
  ClipboardDocumentCheckIcon,
  StarIcon,
  BoltIcon,
  PhotoIcon,
  CalendarDaysIcon,
  GiftIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';

interface SubMenu {
  label: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: SubMenu[];
}

const MENU: MenuItem[] = [
  { label: '대시보드', href: '/dashboard', icon: Squares2X2Icon },
];

const ADMIN_MENU: MenuItem[] = [
  { label: '회원', href: '/members', icon: UsersIcon },
  { label: '프로젝트', href: '/projects', icon: FolderIcon },
  {
    label: '아티스트',
    icon: BuildingStorefrontIcon,
    children: [
      { label: '그룹 리스트', href: '/artists/groups', icon: UsersIcon },
      { label: '멤버 리스트', href: '/artists/members', icon: UserIcon },
    ],
  },
  {
    label: '앱',
    icon: DevicePhoneMobileIcon,
    children: [
      { label: '배너 관리', href: '/home/banners', icon: PhotoIcon },
      { label: '알림 관리', href: '/app/notifications', icon: BellAlertIcon },
    ],
  },
  {
    label: 'BIVE',
    icon: LockClosedIcon,
    children: [
      { label: '에디션 관리', href: '/bive/editions', icon: Square2StackIcon },
      { label: '민팅 관리', href: '/bive/minting', icon: LinkIcon },
      { label: '혜택 관리', href: '/bive/benefits', icon: TrophyIcon },
    ],
  },
  {
    label: '팬덤 레벨',
    icon: StarIcon,
    children: [
      { label: '곡선 설정', href: '/evt/curves', icon: ChartBarIcon },
      { label: '시즌 관리', href: '/evt/seasons', icon: CalendarDaysIcon },
      { label: '레벨 보상', href: '/evt/rewards', icon: GiftIcon },
    ],
  },
  {
    label: '덕력',
    icon: BoltIcon,
    children: [
      { label: '시즌 관리', href: '/duk/seasons', icon: CalendarDaysIcon },
      { label: '랭킹', href: '/duk/rankings', icon: TrophyIcon },
      { label: '한도 정책', href: '/duk/limits', icon: ChartBarIcon },
    ],
  },
  { label: 'Fans', href: '/fans', icon: ShoppingBagIcon },
  { label: '티켓', href: '/tickets', icon: KeyIcon },
  {
    label: '게임존',
    icon: PuzzlePieceIcon,
    children: [
      { label: '게임존 홈', href: '/gamezone/home', icon: GZHome },
      { label: '게임 관리', href: '/gamezone/games', icon: RectangleStackIcon },
      { label: '랭킹', href: '/gamezone/ranking', icon: ChartBarIcon },
      { label: 'GP 교환소', href: '/gamezone/exchange', icon: ArrowsRightLeftIcon },
      { label: 'GP 변동 내역', href: '/gamezone/gp-history', icon: ClockIcon },
    ],
  },
  {
    label: '에피소드',
    icon: BookOpenIcon,
    children: [
      { label: '그룹 리스트', href: '/sq/groups/list', icon: InboxStackIcon },
      { label: '팬퀘스트 대기내역', href: '/sq/pending', icon: ClipboardDocumentCheckIcon },
      { label: '팬퀘스트', href: '/sq/quests', icon: SparklesIcon },
    ],
  },
  {
    label: '래플',
    icon: SparklesIcon,
    children: [
      { label: '래플', href: '/raffle', icon: GiftIcon },
      { label: '응모권 현황', href: '/rft/current', icon: PresentationChartLineIcon },
      { label: '변동 내역', href: '/rft/history', icon: ListBulletIcon },
      { label: '응모권 관리', href: '/rft/policy', icon: Cog6ToothIcon },
    ],
  },
  { label: '재무', href: '/finance', icon: BanknotesIcon },
  {
    label: '관리자',
    icon: Cog6ToothIcon,
    children: [
      { label: '관리자 리스트', href: '/admins/list', icon: UsersIcon },
      { label: '권한관리', href: '/admins/permissions', icon: KeyIcon },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(['앱', '아티스트', 'BIVE', '팬덤 레벨', '덕력', '게임존', '에피소드', '래플', '관리자']),
  );

  const toggle = (label: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isGroupActive = (item: MenuItem) =>
    !!item.children?.some((c) => isActive(c.href));

  const renderMenu = (item: MenuItem) => {
    const Icon = item.icon;
    const hasChildren = !!item.children?.length;
    const open = expanded.has(item.label);
    const groupActive = isGroupActive(item);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggle(item.label)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
              groupActive ? 'text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {open ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {open && (
            <div className="mt-0.5 ml-2 pl-3 space-y-0.5 border-l border-gray-100">
              {item.children!.map((c) => {
                const CIcon = c.icon;
                const active = isActive(c.href);
                return (
                  <Link
                    key={c.label}
                    href={c.href}
                    className={`flex items-center gap-2 pl-3 pr-3 py-2 rounded-md text-[13px] transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {CIcon && <CIcon className="w-4 h-4 shrink-0" />}
                    <span>{c.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const active = isActive(item.href!);
    return (
      <Link
        key={item.label}
        href={item.href!}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
          active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[256px] bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="px-6 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="text-xl font-bold tracking-wider text-gray-900">
          CELEBUS
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {MENU.map(renderMenu)}

        <div className="mt-4 mb-2">
          <span className="px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            관리자 메뉴
          </span>
        </div>

        {ADMIN_MENU.map(renderMenu)}
      </nav>

      <div className="border-t border-gray-200 px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
            n
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              nill <span className="text-xs font-normal text-gray-500">(Super Admin)</span>
            </p>
            <p className="text-xs text-gray-500 truncate">nill@good-block.com</p>
          </div>
        </div>
        <button className="w-full mt-2 flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
