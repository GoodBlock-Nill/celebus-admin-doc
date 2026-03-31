'use client';

import { useState } from 'react';
import { useFQStore } from '@/stores/useFQStore';
import FQHeader from '@/components/layout/FQHeader';
import { TICKET_CHANGE_CONFIG } from '@/lib/fq-constants';
import { formatDateTime } from '@/lib/utils';

type TabFilter = 'ALL' | 'EARN' | 'SPEND';

export default function TicketHistoryPage() {
  const { ticketHistory, ticketBalance } = useFQStore();
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');

  const filtered = ticketHistory
    .filter((item) => {
      if (activeTab === 'EARN') return item.amount > 0;
      if (activeTab === 'SPEND') return item.amount < 0;
      return true;
    })
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'ALL', label: '전체' },
    { key: 'EARN', label: '적립' },
    { key: 'SPEND', label: '사용' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <FQHeader title="응모권" />

      {/* Balance card */}
      <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-violet-600 to-pink-500 rounded-2xl text-white">
        <p className="text-xs text-white/80">보유 응모권</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg">🎫</span>
          <span className="text-3xl font-black">{ticketBalance}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History list */}
      <div className="mt-4 mx-4 bg-white rounded-2xl border border-violet-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            응모권 이력이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item) => {
              const config = TICKET_CHANGE_CONFIG[item.type];
              const isEarn = item.amount > 0;
              return (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-semibold" style={{ color: config.color }}>
                      {item.sourceLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-gray-900 font-medium truncate flex-1 mr-2">
                      {item.title}
                    </p>
                    <span className={`text-sm font-bold flex-shrink-0 ${isEarn ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isEarn ? '+' : ''}{item.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-gray-400">{formatDateTime(item.datetime)}</span>
                    <span className="text-[10px] text-gray-400">잔여 {item.balanceAfter}장</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
