'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { getMemberHistory, getSourceTypeLabel, type HistoryType, type HistorySourceType } from '@/mock/duk';

const TYPE_BADGE: Record<HistoryType, { bg: string; text: string }> = {
  EARN: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  USE: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

const SOURCE_COLOR: Record<HistorySourceType, string> = {
  FAN_QUEST_REWARD: 'bg-amber-100 text-amber-700',
  DAILY_MISSION: 'bg-sky-100 text-sky-700',
  BIVE_ACTIVITY: 'bg-indigo-100 text-indigo-700',
  PM_PARTICIPATION: 'bg-violet-100 text-violet-700',
  TRIVIA_PARTICIPATION: 'bg-blue-100 text-blue-700',
  RANKING_REWARD: 'bg-orange-100 text-orange-700',
  SUPPORT_PARTICIPATION: 'bg-rose-100 text-rose-700',
  STORY_QUEST_REWARD: 'bg-pink-100 text-pink-700',
};

export default function DukHistoryPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = use(params);
  const memberIdNum = parseInt(memberId, 10);
  const history = getMemberHistory(memberIdNum);
  const router = useRouter();

  if (history.length === 0) {
    return <div className="p-8 text-sm text-gray-500">해당 회원의 덕력 변동 내역이 없습니다.</div>;
  }

  const member = history[0];
  const totalEarn = history.filter((h) => h.historyType === 'EARN').reduce((s, h) => s + h.delta, 0);
  const totalUse = history.filter((h) => h.historyType === 'USE').reduce((s, h) => s + h.delta, 0);
  const currentBalance = history[0].balanceAfter;

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '덕력', href: '/duk/rankings' },
          { label: '랭킹', href: '/duk/rankings' },
          { label: `${member.nickname} 덕력 이력` },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900">{member.nickname} 의 덕력 변동 내역</h1>
            <p className="text-sm text-gray-500 mt-1">
              member#{member.memberId} ·
              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 ml-2">
                {member.artistGroup}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">현재 잔고</div>
          <div className="text-2xl font-bold text-indigo-700">{currentBalance.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">DUK</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">총 적립 (EARN)</div>
          <div className="text-2xl font-bold text-emerald-600">+{totalEarn.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">총 사용 (USE)</div>
          <div className="text-2xl font-bold text-rose-600">{totalUse.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">변동 건수</div>
          <div className="text-2xl font-bold text-gray-900">{history.length}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900">변동 이력 ({history.length}건)</h4>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 w-20">유형</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 w-32">출처</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">참조</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-28">변동</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-32">잔액</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 w-40">일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((h) => {
              const t = TYPE_BADGE[h.historyType];
              return (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${t.bg} ${t.text}`}>{h.historyType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${SOURCE_COLOR[h.sourceType]}`}>
                      {getSourceTypeLabel(h.sourceType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{h.sourceRefName}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${h.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {h.delta >= 0 ? '+' : ''}{h.delta.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {h.balanceAfter.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{h.createdAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
