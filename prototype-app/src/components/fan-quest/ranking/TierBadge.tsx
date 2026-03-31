import { TIER_CONFIG } from '@/lib/fq-constants';
import type { RankTier } from '@/lib/fq-types';

interface TierBadgeProps {
  tier: RankTier;
}

export default function TierBadge({ tier }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];
  return (
    <div
      className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl"
      style={{ backgroundColor: config.bgColor }}
    >
      <span className="text-2xl">{config.emoji}</span>
      <span className="text-[10px] font-bold mt-0.5" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}
