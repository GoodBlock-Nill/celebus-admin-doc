'use client';

import { useActiveArtist } from '@/lib/hooks/useActiveArtist';

export default function ArtistHeader() {
  const { activeArtist: artist } = useActiveArtist();

  return (
    <div className="relative h-40 bg-gradient-to-b from-fq-dark to-gray-900 overflow-hidden">
      {/* 배경 이미지 (피그마 참조) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${artist.backgroundUrl})` }}
      />
      {/* 콘텐츠 */}
      <div className="relative z-10 flex items-end h-full px-5 pb-5">
        <div className="flex items-center gap-3">
          {/* 아티스트 로고 */}
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.logoUrl}
              alt={artist.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-white text-lg font-bold">${artist.name[0]}</span>`;
              }}
            />
          </div>
          {/* 아티스트명 */}
          <div>
            <h1 className="text-white text-xl font-bold tracking-wide">{artist.name}</h1>
            <p className="text-white/60 text-xs">{artist.nameEn}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
