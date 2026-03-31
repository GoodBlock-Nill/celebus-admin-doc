interface StreakFlameProps {
  currentStreak: number;
  size?: 'sm' | 'md';
}

export default function StreakFlame({ currentStreak, size = 'md' }: StreakFlameProps) {
  const isActive = currentStreak > 0;
  const isHot = currentStreak >= 7;

  return (
    <div className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <span className={isHot ? 'animate-pulse' : ''}>
        {isHot ? '🔥' : isActive ? '🕯️' : '💤'}
      </span>
      <span className={`font-bold ${isHot ? 'text-orange-500' : isActive ? 'text-amber-500' : 'text-gray-400'}`}>
        {currentStreak}일
      </span>
    </div>
  );
}
