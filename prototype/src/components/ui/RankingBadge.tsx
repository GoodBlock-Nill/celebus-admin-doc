interface RankingBadgeProps {
  rank: number;
}

export default function RankingBadge({ rank }: RankingBadgeProps) {
  const configs: Record<number, string> = {
    1: 'bg-amber-400 text-white',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-amber-600 text-white',
  };

  const className = configs[rank] || 'bg-gray-100 text-gray-600';

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${className}`}>
      {rank}
    </div>
  );
}
