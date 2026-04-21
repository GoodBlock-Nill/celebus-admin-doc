'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SubPageHeader from '@/components/layout/SubPageHeader';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

interface DiscoverArtist {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  members: number;
  recommended: boolean;
}

const ALL_ARTISTS: DiscoverArtist[] = [
  { id: 'v01d', name: 'V01D', nameEn: 'V01D', emoji: '💜', members: 4, recommended: true },
  { id: 'ikon', name: 'iKON', nameEn: 'iKON', emoji: '🔥', members: 6, recommended: true },
  { id: 'newjeans', name: 'NewJeans', nameEn: 'NewJeans', emoji: '🐰', members: 5, recommended: true },
  { id: 'ateez', name: 'ATEEZ', nameEn: 'ATEEZ', emoji: '⚓', members: 8, recommended: false },
  { id: 'txt', name: 'TOMORROW X TOGETHER', nameEn: 'TXT', emoji: '💙', members: 5, recommended: false },
  { id: 'stayc', name: 'STAYC', nameEn: 'STAYC', emoji: '🌟', members: 6, recommended: false },
];

export default function ArtistDiscoverPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const [followed, setFollowed] = useState<Set<string>>(new Set(['v01d']));
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unfollowTarget, setUnfollowTarget] = useState<DiscoverArtist | null>(null);

  const artists = ALL_ARTISTS;
  const followedArtists = artists.filter((a) => followed.has(a.id));
  const recommendedArtists = artists.filter((a) => a.recommended);

  const filteredArtists = searchQuery
    ? artists.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : artists;

  const allFollowed = artists.length > 0 && artists.every((a) => followed.has(a.id));

  const handleFollow = (artist: DiscoverArtist) => {
    setFollowed((prev) => new Set([...prev, artist.id]));
    addToast('success', `'${artist.name}'을 팔로우했어요!`);
    setTimeout(() => router.push('/'), 500);
  };

  const handleUnfollow = () => {
    if (!unfollowTarget) return;
    if (followed.size <= 1) {
      addToast('error', '최소 1명의 아티스트를 팔로우해야 해요');
      setUnfollowTarget(null);
      return;
    }
    setFollowed((prev) => {
      const next = new Set(prev);
      next.delete(unfollowTarget.id);
      return next;
    });
    addToast('success', '언팔로우했어요. 데이터는 보존돼요');
    setUnfollowTarget(null);
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <SubPageHeader title="아티스트" />

      {/* 검색 토글 */}
      <div className="px-4 pt-2 flex justify-end">
        <button onClick={() => setSearchOpen(!searchOpen)} className="text-lg">🔍</button>
      </div>

      {/* 검색바 */}
      {searchOpen && (
        <div className="px-4 mt-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아티스트 검색"
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 text-sm">✕</button>
            )}
          </div>
        </div>
      )}

      {artists.length > 0 && !searchQuery && (
        <>
          {/* 전체 팔로우 안내 */}
          {allFollowed && (
            <div className="mx-4 mt-4 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-center">
              <span className="text-sm font-semibold text-violet-700">모든 아티스트를 팔로우하고 있어요! 💜</span>
            </div>
          )}

          {/* 1. 내 아티스트 */}
          {followedArtists.length > 0 && (
            <div className="mt-4">
              <div className="px-4 flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">내 아티스트</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="px-4 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {followedArtists.map((artist) => (
                  <button key={artist.id} onClick={() => {
                      if (followedArtists.length <= 1) {
                        addToast('error', '최소 1명의 아티스트를 팔로우해야 해요');
                        return;
                      }
                      setUnfollowTarget(artist);
                    }}
                    className="flex flex-col items-center gap-1 shrink-0">
                    <div className="relative w-14 h-14 rounded-full bg-violet-100 border-2 border-violet-400 flex items-center justify-center">
                      <span className="text-xl">{artist.emoji}</span>
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-violet-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">✓</span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-700 max-w-[56px] truncate">{artist.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. 추천 아티스트 */}
          {recommendedArtists.length > 0 && (
            <div className="mt-5">
              <div className="px-4 flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">추천 아티스트</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="px-4 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {recommendedArtists.map((artist) => {
                  const isFollowed = followed.has(artist.id);
                  return (
                    <div key={artist.id} className="shrink-0 w-36 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3">
                      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
                        <span className="text-2xl">{artist.emoji}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 text-center mt-2 truncate">{artist.name}</p>
                      <p className="text-[10px] text-gray-400 text-center">{artist.members}명</p>
                      <button
                        onClick={() => isFollowed ? setUnfollowTarget(artist) : handleFollow(artist)}
                        className={cn(
                          'w-full mt-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
                          isFollowed ? 'bg-gray-100 text-gray-400' : 'bg-violet-600 text-white active:bg-violet-700'
                        )}>
                        {isFollowed ? '팔로우 중' : '팔로우'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 3. 전체 아티스트 */}
      {filteredArtists.length > 0 && (
        <div className="mt-5">
          <div className="px-4 flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {searchQuery ? `검색 결과 (${filteredArtists.length})` : '전체 아티스트'}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="px-4 space-y-1">
            {filteredArtists.map((artist) => {
              const isFollowed = followed.has(artist.id);
              return (
                <div key={artist.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <span className="text-lg">{artist.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{artist.name}</p>
                    <p className="text-[10px] text-gray-400">{artist.nameEn} · {artist.members}명</p>
                  </div>
                  <button
                    onClick={() => isFollowed ? setUnfollowTarget(artist) : handleFollow(artist)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-[10px] font-semibold shrink-0 transition-colors',
                      isFollowed ? 'bg-gray-100 text-gray-400' : 'bg-violet-600 text-white active:bg-violet-700'
                    )}>
                    {isFollowed ? '팔로우 중' : '팔로우'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {searchQuery && filteredArtists.length === 0 && (
        <div className="text-center py-16">
          <span className="text-3xl">🔍</span>
          <p className="text-sm text-gray-400 mt-3">앗, '{searchQuery}'에 해당하는 아티스트가 없어요</p>
        </div>
      )}

      {/* 언팔로우 확인 모달 */}
      {unfollowTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setUnfollowTarget(null)}>
          <div className="bg-white rounded-2xl w-72 p-5 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <span className="text-3xl">{unfollowTarget.emoji}</span>
            <p className="text-sm font-bold text-gray-900 mt-3">'{unfollowTarget.name}'을 언팔로우할까요?</p>
            <p className="text-xs text-gray-400 mt-1">기존 활동 데이터는 보존됩니다.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setUnfollowTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600">취소</button>
              <button onClick={handleUnfollow}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white">언팔로우</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
