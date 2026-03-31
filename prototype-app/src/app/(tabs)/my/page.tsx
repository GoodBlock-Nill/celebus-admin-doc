'use client';

import Link from 'next/link';
import { useUserStore } from '@/stores/useUserStore';
import { useFQStore } from '@/stores/useFQStore';
import FQBadge from '@/components/fan-quest/ui/FQBadge';
import { formatNumber } from '@/lib/utils';

const MENU_ITEMS = [
  { emoji: '🎫', label: '응모권 이력', href: '/ticket-history' },
  { emoji: '📋', label: 'Event 내역', href: '/event' },
  { emoji: '🏆', label: '덕력 랭킹', href: '/ranking' },
  { emoji: '🎁', label: '보상함', href: '/rewards' },
  { emoji: '✨', label: 'V01D 퀘스트', href: '/quest' },
  { emoji: '💱', label: 'GP 교환소', href: '/exchange' },
  { emoji: '📋', label: 'GP 내역', href: '/history' },
];

export default function MyPage() {
  const user = useUserStore((s) => s.user);
  const { myStats, ticketBalance, nftCollection } = useFQStore();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Profile header */}
      <div className="bg-gradient-to-br from-[#0F0A1A] via-violet-900 to-violet-700 px-5 pt-10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-violet-400 overflow-hidden border-2 border-white/30">
            <img src={user.profileImage} alt={user.nickname} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{user.nickname}</h1>
            <div className="mt-1">
              <FQBadge tier={myStats.tier} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Balance cards */}
      <div className="px-4 -mt-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white rounded-xl border border-violet-100 text-center shadow-sm">
            <p className="text-[10px] text-gray-400">GP</p>
            <p className="text-sm font-black text-amber-600">{formatNumber(user.gpBalance)}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-violet-100 text-center shadow-sm">
            <p className="text-[10px] text-gray-400">응모권</p>
            <p className="text-sm font-black text-pink-600">{ticketBalance}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-violet-100 text-center shadow-sm">
            <p className="text-[10px] text-gray-400">NFT</p>
            <p className="text-sm font-black text-violet-600">{nftCollection.length}</p>
          </div>
        </div>
      </div>

      {/* Season stats */}
      <div className="mx-4 mt-4 p-4 bg-white rounded-xl border border-violet-100">
        <p className="text-xs font-semibold text-gray-500 mb-2">덕력 시즌 현황</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">순위</span>
          <span className="text-sm font-bold text-violet-700">
            {myStats.rank}위 / {myStats.totalParticipants}명
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-700">포인트</span>
          <span className="text-sm font-bold text-violet-700">
            {formatNumber(myStats.totalPoints)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-700">스트릭</span>
          <span className="text-sm font-bold text-orange-500">
            {myStats.currentStreak}일 🔥
          </span>
        </div>
      </div>

      {/* Menu list */}
      <div className="mx-4 mt-4 bg-white rounded-xl border border-violet-100 overflow-hidden">
        {MENU_ITEMS.map((item, i) => (
          <Link key={`${item.href}-${i}`} href={item.href}>
            <div
              className={`flex items-center justify-between px-4 py-3 active:bg-gray-50 ${
                i > 0 ? 'border-t border-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.emoji}</span>
                <span className="text-sm text-gray-900">{item.label}</span>
              </div>
              <span className="text-gray-300 text-lg leading-none">›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
