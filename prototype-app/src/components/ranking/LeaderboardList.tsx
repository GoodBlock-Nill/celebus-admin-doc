'use client';

import { cn, formatNumber } from '@/lib/utils';

interface RankUser {
  rank: number;
  nickname: string;
  earnedPt: number;
  isMe?: boolean;
}

interface LeaderboardListProps {
  topUsers: RankUser[];
  myRank?: number | null;
  myEarnedPt?: number;
  isLoggedIn: boolean;
}

export default function LeaderboardList({
  topUsers,
  myRank,
  myEarnedPt,
  isLoggedIn: _isLoggedIn,
}: LeaderboardListProps) {
  const myEntry = topUsers.find((u) => u.isMe);
  const isInTop100 = myEntry && topUsers.indexOf(myEntry) < 100;

  return (
    <div className="px-4 mt-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">TOP 100</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* 시즌 초반 — 참여자 20명 미만 배너 */}
      {topUsers.length < 20 && (
        <div className="mb-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-violet-700 font-medium">이번 시즌이 막 시작됐어요! 지금 활동하면 TOP 10 진입 기회 💪</p>
        </div>
      )}

      {/* 신규 유저 Empty 안내 */}
      {!myRank && (
        <div className="text-center py-4 mb-3">
          <p className="text-xs text-gray-400">활동을 시작하면 랭킹에 참여할 수 있어요!</p>
        </div>
      )}

      <div className="space-y-1">
        {topUsers.slice(0, 100).map((user) => {
          // Fix #8: 1위 🥇, 2위 🥈, 3위 🥉
          const rankIcon = user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : null;
          return (
            <div
              key={`${user.rank}-${user.nickname}`}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-xl',
                user.isMe ? 'bg-violet-50 border border-violet-200' : 'bg-white'
              )}
            >
              <span className="w-8 text-xs font-semibold text-gray-500">{user.rank}</span>
              <span className="w-6 text-center">{rankIcon || (user.isMe ? '⭐' : '')}</span>
              <span className={cn('flex-1 text-sm', user.isMe ? 'font-bold text-violet-700' : 'text-gray-800')}>
                {user.nickname} {user.isMe && '★'}
              </span>
              <span className="text-xs text-gray-500">{formatNumber(user.earnedPt)}pt</span>
            </div>
          );
        })}
      </div>

      {/* TOP 100 밖 내 순위 */}
      {!isInTop100 && myRank && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">── 내 순위 ──</span>
          </div>
          <div className="flex items-center px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-200">
            <span className="w-8 text-xs font-semibold text-gray-500">{myRank}</span>
            <span className="w-6 text-center">⭐</span>
            <span className="flex-1 text-sm font-bold text-violet-700">나 ★</span>
            <span className="text-xs text-gray-500">{formatNumber(myEarnedPt ?? 0)}pt</span>
          </div>
        </div>
      )}
    </div>
  );
}
