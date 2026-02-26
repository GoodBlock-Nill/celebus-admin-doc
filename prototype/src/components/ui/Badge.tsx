import { GAME_STATUS_CONFIG, GP_TYPE_CONFIG, EXCHANGE_DIRECTION_CONFIG, EXCHANGE_STATUS_CONFIG, GAME_TYPE_BADGE_CONFIG } from '@/lib/constants';

interface BadgeProps {
  variant: 'gameStatus' | 'gpType' | 'exchangeDir' | 'exchangeStatus' | 'gameType' | 'custom';
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
