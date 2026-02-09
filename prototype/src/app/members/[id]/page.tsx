'use client';

import { use, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GameZoneTab from './GameZoneTab';
import { getMemberById } from '@/mock/members';

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('gamezone');
  const member = getMemberById(id);

  if (!member) {
    return <div className="text-center py-20 text-gray-500">회원을 찾을 수 없습니다.</div>;
  }

  const tabs = [
    { key: 'basic', label: '기본정보' },
    { key: 'history', label: '참여내역' },
    { key: 'gamezone', label: '게임존' },
    { key: 'bive', label: 'BIVE' },
    { key: 'project', label: '프로젝트' },
    { key: 'fans', label: 'Fans' },
    { key: 'ticket', label: '티켓' },
    { key: 'wallet', label: '지갑' },
    { key: 'activity', label: '활동내역' },
  ];

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '회원', href: '/members' },
          { label: '회원 상세' },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-gray-900">{member.nickname}</h1>
        <p className="text-sm text-gray-500 mt-1">{member.nickname}님의 상세 정보를 관리합니다.</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'gamezone' && <GameZoneTab member={member} />}

      {activeTab !== 'gamezone' && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">준비중입니다.</p>
        </div>
      )}
    </div>
  );
}
