'use client';

import type { Game } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import Badge from './Badge';

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
  const totalVotes = game.yesCount + game.noCount;
  const yesPercent = totalVotes > 0 ? Math.round((game.yesCount / totalVotes) * 100) : 50;
  const noPercent = 100 - yesPercent;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
          {game.title.ko}
        </h3>
        <Badge variant="gameStatus" value={game.status} />
      </div>

      <div className="flex items-center gap-1 mb-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="h-full bg-red-400 transition-all"
            style={{ width: `${noPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>
            <span className="text-blue-600 font-medium">YES {yesPercent}%</span>
          </span>
          <span>
            <span className="text-red-500 font-medium">NO {noPercent}%</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>참여 {formatNumber(game.participantCount)}명</span>
          <span className="text-amber-600 font-medium">{formatNumber(game.totalPrizeGP)} GP</span>
        </div>
      </div>
    </button>
  );
}
