'use client';

import { cn } from '@/lib/utils';

const ARTIST_STYLES: Record<string, { emoji: string; gradient: string }> = {
  v01d: { emoji: '💜', gradient: 'from-violet-500 to-purple-600' },
  ikon: { emoji: '🔥', gradient: 'from-red-500 to-orange-500' },
  newjeans: { emoji: '🐰', gradient: 'from-sky-400 to-blue-500' },
  ateez: { emoji: '⚓', gradient: 'from-teal-500 to-cyan-600' },
  txt: { emoji: '💙', gradient: 'from-blue-400 to-indigo-500' },
  stayc: { emoji: '🌟', gradient: 'from-amber-400 to-yellow-500' },
  lesserafim: { emoji: '🦋', gradient: 'from-pink-400 to-rose-500' },
  aespa: { emoji: '✨', gradient: 'from-fuchsia-500 to-purple-500' },
  seventeen: { emoji: '💎', gradient: 'from-emerald-400 to-teal-500' },
  ive: { emoji: '🌸', gradient: 'from-rose-400 to-pink-500' },
};

const DEFAULT_STYLE = { emoji: '🎵', gradient: 'from-gray-400 to-gray-500' };

interface ArtistAvatarProps {
  artistId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-10 h-10 text-base',
  md: 'w-12 h-12 text-xl',
  lg: 'w-14 h-14 text-2xl',
  xl: 'w-20 h-20 text-3xl',
};

export default function ArtistAvatar({ artistId, size = 'md', active, className }: ArtistAvatarProps) {
  const style = ARTIST_STYLES[artistId] ?? DEFAULT_STYLE;

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center bg-gradient-to-br shadow-sm',
      style.gradient,
      SIZE_MAP[size],
      active && 'ring-2 ring-offset-1 ring-violet-500',
      className,
    )}>
      <span className="drop-shadow-sm">{style.emoji}</span>
    </div>
  );
}

export function getArtistEmoji(artistId: string): string {
  return (ARTIST_STYLES[artistId] ?? DEFAULT_STYLE).emoji;
}

export function getArtistGradient(artistId: string): string {
  return (ARTIST_STYLES[artistId] ?? DEFAULT_STYLE).gradient;
}
