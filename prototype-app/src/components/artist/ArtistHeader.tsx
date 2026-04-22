'use client';

import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import ArtistAvatar, { getArtistGradient } from './ArtistAvatar';
import { cn } from '@/lib/utils';

export default function ArtistHeader() {
  const { activeArtist: artist, activeArtistId } = useActiveArtist();
  const gradient = getArtistGradient(activeArtistId);

  return (
    <div className={cn('relative h-40 overflow-hidden bg-gradient-to-br', gradient)}>
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 right-8 text-6xl opacity-30">
          {artist.name[0]}
        </div>
        <div className="absolute bottom-2 left-4 text-4xl opacity-20">
          {artist.nameEn}
        </div>
      </div>
      {/* 콘텐츠 */}
      <div className="relative z-10 flex items-end h-full px-5 pb-5">
        <div className="flex items-center gap-3">
          <ArtistAvatar artistId={activeArtistId} size="md" className="ring-2 ring-white/30" />
          <div>
            <h1 className="text-white text-xl font-bold tracking-wide drop-shadow-sm">{artist.name}</h1>
            <p className="text-white/70 text-xs">{artist.nameEn}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
