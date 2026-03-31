'use client';

interface FQProgressBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'violet' | 'gold' | 'green';
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorMap = {
  violet: 'from-violet-500 to-violet-400',
  gold: 'from-amber-500 to-amber-400',
  green: 'from-emerald-500 to-emerald-400',
};

export default function FQProgressBar({
  current,
  max,
  showLabel = false,
  size = 'md',
  color = 'violet',
}: FQProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${sizeMap[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorMap[color]} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            {current.toLocaleString()} / {max.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-violet-600">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
