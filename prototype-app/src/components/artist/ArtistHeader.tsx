'use client';

import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import ArtistAvatar, { getArtistGradient } from './ArtistAvatar';
import { cn } from '@/lib/utils';

export default function ArtistHeader() {
  const { activeArtist: artist, activeArtistId } = useActiveArtist();
  const gradient = getArtistGradient(activeArtistId);

  return (
    <div className={cn('relative h-44 overflow-hidden bg-gradient-to-br', gradient)}>
      {/* 하단 어둡게 오버레이 (텍스트 가독성) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-6 right-6 text-7xl font-black text-white">
          {artist.nameEn}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 flex items-end h-full px-5 pb-6">
        <div className="flex items-center gap-4">
          <ArtistAvatar artistId={activeArtistId} size="lg" className="ring-2 ring-white/40 shadow-lg" />
          <div>
            <h1 className="text-white text-xl font-bold tracking-wide drop-shadow-md">{artist.name}</h1>
            <p className="text-white/80 text-xs mt-0.5 drop-shadow-sm">{artist.nameEn} · {artist.members.length}명</p>
          </div>
        </div>
      </div>
    </div>
  );
}
