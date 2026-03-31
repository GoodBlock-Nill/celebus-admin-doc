import type { LeaderboardEntry } from '@/lib/fq-types';
import FQBadge from '@/components/fan-quest/ui/FQBadge';

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
}

const medalEmoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardItem({ entry }: LeaderboardItemProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 ${
        entry.isMe ? 'bg-violet-50 border-l-2 border-violet-600' : ''
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        {medalEmoji[entry.rank] ? (
          <span className="text-lg">{medalEmoji[entry.rank]}</span>
        ) : (
          <span className="text-sm font-bold text-gray-500">{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-violet-100 overflow-hidden flex-shrink-0">
        <img src={entry.profileImage} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Name + badge */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${entry.isMe ? 'text-violet-700' : 'text-gray-900'}`}>
          {entry.nickname}
        </p>
        <FQBadge tier={entry.tier} size="sm" showEmoji={false} />
      </div>

      {/* Points */}
      <span className="text-sm font-bold text-violet-700 flex-shrink-0">
        {entry.totalPoints.toLocaleString()}
      </span>
    </div>
  );
}
