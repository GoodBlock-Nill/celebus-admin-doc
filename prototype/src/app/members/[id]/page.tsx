'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCircleIcon,
  ChartBarIcon,
  PuzzlePieceIcon,
  CubeIcon,
  FolderIcon,
  UsersIcon,
  TicketIcon,
  WalletIcon,
  ClockIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { getMemberById, LOGIN_LABEL, STATUS_LABEL } from '@/mock/members';
import BasicInfoTab from './tabs/BasicInfoTab';
import ParticipationTab from './tabs/ParticipationTab';
import GameZoneTab from './tabs/GameZoneTab';
import BiveTab from './tabs/BiveTab';
import ComingSoonTab from './tabs/ComingSoonTab';

const TABS = [
  { key: 'basic', label: '기본정보', icon: UserCircleIcon },
  { key: 'activity', label: '참여내역', icon: ChartBarIcon },
  { key: 'gamezone', label: '게임존', icon: PuzzlePieceIcon },
  { key: 'bive', label: 'BIVE', icon: CubeIcon },
  { key: 'project', label: '프로젝트', icon: FolderIcon },
  { key: 'fans', label: 'Fans', icon: UsersIcon },
  { key: 'ticket', label: '티켓', icon: TicketIcon },
  { key: 'wallet', label: '지갑', icon: WalletIcon },
  { key: 'log', label: '활동내역', icon: ClockIcon },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const sp = use(searchParams);
  const member = getMemberById(id);
  const initialTab = (sp.tab as TabKey) || 'basic';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  if (!member) {
    return <div className="text-center py-20 text-gray-500">회원을 찾을 수 없습니다.</div>;
  }

  const handleTab = (key: TabKey) => {
    setActiveTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', key);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div>
      <PageHeader
        title="회원상세"
        breadcrumbItems={[
          { label: '회원', href: '/members' },
          { label: '회원 상세' },
        ]}
      />

      <p className="text-sm text-gray-600 mb-6">
        <span className="font-semibold text-gray-900">{member.nickname || '(이름 없음)'}</span>
        님의 상세 정보를 관리합니다.
      </p>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'basic' && <BasicInfoTab member={member} />}
      {activeTab === 'activity' && <ParticipationTab member={member} />}
      {activeTab === 'gamezone' && <GameZoneTab member={member} />}
      {activeTab === 'bive' && <BiveTab member={member} />}
      {activeTab === 'project' && <ComingSoonTab area="프로젝트" />}
      {activeTab === 'fans' && <ComingSoonTab area="Fans" />}
      {activeTab === 'ticket' && <ComingSoonTab area="티켓" />}
      {activeTab === 'wallet' && <ComingSoonTab area="지갑" />}
      {activeTab === 'log' && <ComingSoonTab area="활동내역" />}
    </div>
  );
}
