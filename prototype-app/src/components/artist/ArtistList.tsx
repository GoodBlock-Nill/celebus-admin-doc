'use client';

import { cn } from '@/lib/utils';
import ArtistAvatar from '@/components/artist/ArtistAvatar';
import type { Artist } from '@/lib/types';

interface ArtistListProps {
  artists: Artist[];
  followedSet: Set<string>;
  onFollow: (artist: Artist) => void;
  onUnfollow: (artist: Artist) => void;
  isLoading: boolean;
  searchQuery?: string;
}

export default function ArtistList({
  artists,
  followedSet,
  onFollow,
  onUnfollow,
  isLoading,
  searchQuery,
}: ArtistListProps) {
  return (
    <div className="mt-5">
      <div className="px-4 flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {searchQuery ? `검색 결과 (${artists.length})` : '전체 아티스트'}
        </span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="px-4 space-y-1">
        {artists.map((artist) => {
          const isFollowed = followedSet.has(artist.id);
          return (
            <div key={artist.id} className="flex items-center gap-3 py-2.5">
              <ArtistAvatar artistId={artist.id} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{artist.name}</p>
                <p className="text-[10px] text-gray-400">{artist.nameEn} · {artist.members.length}명</p>
              </div>
              <button
                onClick={() => isFollowed ? onUnfollow(artist) : onFollow(artist)}
                disabled={isLoading}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-[10px] font-semibold shrink-0 transition-colors flex items-center justify-center gap-1',
                  isFollowed ? 'bg-gray-100 text-gray-400' : 'bg-violet-600 text-white active:bg-violet-700'
                )}
              >
                {!isFollowed && isLoading ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isFollowed ? '팔로우 중' : '팔로우'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
