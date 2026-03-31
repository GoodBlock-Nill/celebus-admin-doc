import { TIER_CONFIG } from '@/lib/fq-constants';
import type { RankTier } from '@/lib/fq-types';

interface FQBadgeProps {
  tier: RankTier;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
}

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-3 py-1',
};

export default function FQBadge({ tier, size = 'md', showEmoji = true }: FQBadgeProps) {
  const config = TIER_CONFIG[tier];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeStyles[size]}`}
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      {showEmoji && <span>{config.emoji}</span>}
      {config.label}
    </span>
  );
}
