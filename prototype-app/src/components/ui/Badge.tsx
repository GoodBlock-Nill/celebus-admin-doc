'use client';

import {
  GAME_STATUS_CONFIG,
  GP_TYPE_CONFIG,
  EXCHANGE_DIRECTION_CONFIG,
  EXCHANGE_STATUS_CONFIG,
  TRIVIA_STATUS_CONFIG,
} from '@/lib/constants';
import type { GameStatus, GPChangeType, ExchangeDirection, ExchangeStatus, TriviaStatus } from '@/lib/types';

type BadgeVariant = 'gameStatus' | 'gpType' | 'exchangeDir' | 'exchangeStatus' | 'triviaStatus';

interface BadgeProps {
  variant: BadgeVariant;
  value: string;
}

function getConfig(variant: BadgeVariant, value: string): { label: string; bg: string; text: string } | null {
  switch (variant) {
    case 'gameStatus':
      return GAME_STATUS_CONFIG[value as GameStatus] ?? null;
    case 'gpType':
      return GP_TYPE_CONFIG[value as GPChangeType] ?? null;
    case 'exchangeDir':
      return EXCHANGE_DIRECTION_CONFIG[value as ExchangeDirection] ?? null;
    case 'exchangeStatus':
      return EXCHANGE_STATUS_CONFIG[value as ExchangeStatus] ?? null;
    case 'triviaStatus':
      return TRIVIA_STATUS_CONFIG[value as TriviaStatus] ?? null;
    default:
      return null;
  }
}

export default function Badge({ variant, value }: BadgeProps) {
  const config = getConfig(variant, value);

  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
        {value}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
