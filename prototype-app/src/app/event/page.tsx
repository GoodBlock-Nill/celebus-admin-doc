'use client';

import { useState } from 'react';
import { useFQStore } from '@/stores/useFQStore';
import FQHeader from '@/components/layout/FQHeader';
import TicketBalance from '@/components/fan-quest/ui/TicketBalance';
import { formatDateTime } from '@/lib/utils';
import type { EventType, EventQuestStatus, EventRaffleStatus } from '@/lib/fq-types';

const QUEST_STATUS_CONFIG: Record<
  EventQuestStatus,
  { label: string; color: string; bg: string }
> = {
  COMPLETED: { label: '지급완료', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  PENDING: { label: '검토중', color: 'text-amber-600', bg: 'bg-amber-50' },
  REJECTED: { label: '반려', color: 'text-red-600', bg: 'bg-red-50' },
};

const RAFFLE_STATUS_CONFIG: Record<
  EventRaffleStatus,
  { label: string; color: string; bg: string }
> = {
  ACTIVE: { label: '진행중', color: 'text-violet-600', bg: 'bg-violet-50' },
  CLOSED: { label: '집계중', color: 'text-amber-600', bg: 'bg-amber-50' },
  WON: { label: '당첨', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  LOST: { label: '미당첨', color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function EventPage() {
  const { eventHistory } = useFQStore();
  const [activeTab, setActiveTab] = useState<EventType>('QUEST');

  const filtered = eventHistory
    .filter((e) => e.type === activeTab)
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <FQHeader title="Event" rightAction={<TicketBalance size="sm" />} />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {(['QUEST', 'RAFFLE'] as EventType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-violet-600 border-violet-600'
                : 'text-gray-400 border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-3xl">📭</span>
            <p className="text-sm text-gray-400 mt-3">내역이 없습니다</p>
          </div>
        ) : (
          filtered.map((item) => {
            const statusConfig =
              item.type === 'QUEST' && item.questStatus
                ? QUEST_STATUS_CONFIG[item.questStatus]
                : item.type === 'RAFFLE' && item.raffleStatus
                  ? RAFFLE_STATUS_CONFIG[item.raffleStatus]
                  : null;

            return (
              <div key={item.id} className="p-3 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-violet-500 font-semibold">
                    [{item.artistName}] {item.type}
                  </span>
                  {statusConfig && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusConfig.color} ${statusConfig.bg}`}
                    >
                      {statusConfig.label}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-1">{item.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400">{formatDateTime(item.datetime)}</span>
                  <div className="flex items-center gap-2">
                    {item.rewardTickets != null && item.rewardTickets > 0 && (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        🎫 +{item.rewardTickets}
                      </span>
                    )}
                    {item.ticketsUsed != null && item.ticketsUsed > 0 && (
                      <span className="text-[10px] text-pink-500 font-semibold">
                        🎫 -{item.ticketsUsed}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
