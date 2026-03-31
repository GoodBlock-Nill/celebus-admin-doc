'use client';

import type { Mission } from '@/lib/fq-types';
import { useFQStore } from '@/stores/useFQStore';

interface MissionItemProps {
  mission: Mission;
}

const typeEmoji: Record<string, string> = {
  QUEST: '📋',
  TRIVIA: '🧠',
  PM: '🎯',
  SNS_SHARE: '📱',
};

export default function MissionItem({ mission }: MissionItemProps) {
  const completeMission = useFQStore((s) => s.completeMission);

  const handleComplete = () => {
    if (mission.status === 'AVAILABLE' || mission.status === 'IN_PROGRESS') {
      completeMission(mission.chapterId, mission.id);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        mission.status === 'COMPLETED'
          ? 'bg-violet-50 border-violet-200'
          : mission.status === 'LOCKED'
          ? 'bg-gray-50 border-gray-200 opacity-50'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Type icon */}
      <span className="text-lg flex-shrink-0">{typeEmoji[mission.type] ?? '📋'}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${
            mission.status === 'COMPLETED'
              ? 'text-violet-700 line-through'
              : mission.status === 'LOCKED'
              ? 'text-gray-400'
              : 'text-gray-900'
          }`}
        >
          {mission.title}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{mission.description}</p>
        {mission.rewardTickets > 0 && (
          <span className="text-[10px] text-pink-500 font-semibold">🎫 +{mission.rewardTickets}</span>
        )}
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        {mission.status === 'COMPLETED' && (
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
        {(mission.status === 'AVAILABLE' || mission.status === 'IN_PROGRESS') && (
          <button
            onClick={handleComplete}
            className="px-3 py-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-full active:bg-violet-700"
          >
            완료
          </button>
        )}
        {mission.status === 'LOCKED' && <span className="text-gray-300 text-sm">🔒</span>}
      </div>
    </div>
  );
}
