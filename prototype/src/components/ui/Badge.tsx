import {
  GAME_STATUS_CONFIG, GP_TYPE_CONFIG, EXCHANGE_DIRECTION_CONFIG, EXCHANGE_STATUS_CONFIG, GAME_TYPE_BADGE_CONFIG,
  QUEST_STATUS_CONFIG, RAFFLE_STATUS_CONFIG, SUBMISSION_STATUS_CONFIG, REWARD_TYPE_CONFIG, DELIVERY_TYPE_CONFIG,
} from '@/lib/constants';

interface BadgeProps {
  variant: 'gameStatus' | 'gpType' | 'exchangeDir' | 'exchangeStatus' | 'gameType'
    | 'questStatus' | 'raffleStatus' | 'submissionStatus' | 'rewardType' | 'deliveryType'
    | 'custom';
  value: string;
  customBg?: string;
  customText?: string;
  customLabel?: string;
}

const CONFIG_MAP = {
  gameStatus: GAME_STATUS_CONFIG,
  gpType: GP_TYPE_CONFIG,
  exchangeDir: EXCHANGE_DIRECTION_CONFIG,
  exchangeStatus: EXCHANGE_STATUS_CONFIG,
  gameType: GAME_TYPE_BADGE_CONFIG,
  questStatus: QUEST_STATUS_CONFIG,
  raffleStatus: RAFFLE_STATUS_CONFIG,
  submissionStatus: SUBMISSION_STATUS_CONFIG,
  rewardType: REWARD_TYPE_CONFIG,
  deliveryType: DELIVERY_TYPE_CONFIG,
};

export default function Badge({ variant, value, customBg, customText, customLabel }: BadgeProps) {
  if (variant === 'custom') {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${customBg} ${customText}`}>
        {customLabel || value}
      </span>
    );
  }

  const config = CONFIG_MAP[variant];
  const item = config[value as keyof typeof config] as { label: string; bg: string; text: string } | undefined;

  if (!item) return <span className="text-gray-400">-</span>;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${item.bg} ${item.text}`}>
      {item.label}
    </span>
  );
}
