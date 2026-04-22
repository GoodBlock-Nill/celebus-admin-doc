'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/useUIStore';
import { useArtistStore } from '@/stores/useArtistStore';
import { useArtists, useFollowedArtists, useFollowArtist, useUnfollowArtist } from '@/lib/hooks/useArtists';
import { ARTIST_DISCOVER_PRESET_OPTIONS } from '@/lib/presets/artistDiscover';
import { cn } from '@/lib/utils';
import ArtistAvatar, { getArtistEmoji } from '@/components/artist/ArtistAvatar';
import type { Artist } from '@/lib/types';

export default function ArtistDiscoverPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const setActiveArtist = useArtistStore((s) => s.setActiveArtist);
  const activeArtistId = useArtistStore((s) => s.activeArtistId);

  const { data: allArtists, isLoading: artistsLoading } = useArtists();
  const { data: followedIds, isLoading: followsLoading } = useFollowedArtists();
  const followMutation = useFollowArtist();
  const unfollowMutation = useUnfollowArtist();

  const [preset, setPreset] = useState('default');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unfollowTarget, setUnfollowTarget] = useState<Artist | null>(null);

  const handlePreset = (key: string) => {
    setPreset(key);
    if (key === 'searchEmpty') { setSearchOpen(true); setSearchQuery('zzzznotfound'); }
  };

  const isLoading = artistsLoading || followsLoading;
  const artists = allArtists ?? [];
  const followedSet = new Set(followedIds ?? []);
  const followedArtists = artists.filter((a) => followedSet.has(a.id));
  const allFollowed = artists.length > 0 && artists.every((a) => followedSet.has(a.id));

  const filteredArtists = searchQuery
    ? artists.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : artists;

  const handleFollow = async (artist: Artist) => {
    try {
      await followMutation.mutateAsync(artist.id);
      addToast('success', `'${artist.name}'을 팔로우했어요!`);
      setActiveArtist(artist.id);
      setTimeout(() => router.push('/home'), 500);
    } catch {
      addToast('error', '팔로우에 실패했어요. 다시 시도해 주세요');
    }
  };

  const handleUnfollow = async () => {
    if (!unfollowTarget) return;

    // 최소 1명 팔로우 필수
    if (followedSet.size <= 1) {
      addToast('error', '최소 1명의 아티스트를 팔로우해야 해요');
      setUnfollowTarget(null);
      return;
    }

    try {
      await unfollowMutation.mutateAsync(unfollowTarget.id);
      addToast('success', '언팔로우했어요. 데이터는 보존돼요');

      // 현재 활성 아티스트를 언팔로우했으면 → 가장 오래된 팔로우 아티스트로 자동 전환
      if (unfollowTarget.id === activeArtistId) {
        const remaining = followedArtists.filter((a) => a.id !== unfollowTarget.id);
        if (remaining.length > 0) {
          setActiveArtist(remaining[0].id);
        }
      }
    } catch {
      addToast('error', '언팔로우에 실패했어요. 다시 시도해 주세요');
    }
    setUnfollowTarget(null);
  };


  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white pb-20">
        <SubPageHeader title="아티스트" />
        <div className="px-4 mt-4 space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-20">
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
              <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {followedArtists.map((artist) => (
                  <button key={artist.id} onClick={() => {
                      if (followedSet.size <= 1) {
                        addToast('error', '최소 1명의 아티스트를 팔로우해야 해요');
                        return;
                      }
                      setUnfollowTarget(artist);
                    }}
                    className="flex flex-col items-center gap-1 shrink-0">
                    <div className="relative">
                      <ArtistAvatar artistId={artist.id} size="lg" active={artist.id === activeArtistId} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-violet-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">✓</span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-700 max-w-[56px] truncate">{artist.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. 추천 아티스트 (미팔로우만) */}
          {artists.filter((a) => !followedSet.has(a.id)).length > 0 && (
            <div className="mt-5">
              <div className="px-4 flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">추천 아티스트</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {artists.filter((a) => !followedSet.has(a.id)).map((artist) => (
                  <div key={artist.id} className="shrink-0 w-36 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3">
                    <div className="mx-auto">
                      <ArtistAvatar artistId={artist.id} size="md" />
                    </div>
                    <p className="text-xs font-bold text-gray-900 text-center mt-2 truncate">{artist.name}</p>
                    <p className="text-[10px] text-gray-400 text-center">{artist.members.length}명</p>
                    <button
                      onClick={() => handleFollow(artist)}
                      disabled={followMutation.isPending}
                      className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-semibold bg-violet-600 text-white active:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-1"
                    >
                      {followMutation.isPending ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : '팔로우'}
                    </button>
                  </div>
                ))}
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
              const isFollowed = followedSet.has(artist.id);
              return (
                <div key={artist.id} className="flex items-center gap-3 py-2.5">
                  <ArtistAvatar artistId={artist.id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{artist.name}</p>
                    <p className="text-[10px] text-gray-400">{artist.nameEn} · {artist.members.length}명</p>
                  </div>
                  <button
                    onClick={() => isFollowed ? setUnfollowTarget(artist) : handleFollow(artist)}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-[10px] font-semibold shrink-0 transition-colors flex items-center justify-center gap-1',
                      isFollowed ? 'bg-gray-100 text-gray-400' : 'bg-violet-600 text-white active:bg-violet-700'
                    )}>
                    {!isFollowed && followMutation.isPending ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isFollowed ? '팔로우 중' : '팔로우'}
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
          <p className="text-sm text-gray-400 mt-3">해당하는 아티스트가 없어요</p>
        </div>
      )}

      {/* 언팔로우 확인 모달 */}
      {unfollowTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 bg-white rounded-2xl w-72 p-5 text-center shadow-xl animate-scaleIn">
            <ArtistAvatar artistId={unfollowTarget.id} size="xl" className="mx-auto" />
            <p className="text-sm font-bold text-gray-900 mt-3">'{unfollowTarget.name}'을 언팔로우할까요?</p>
            <p className="text-xs text-gray-400 mt-1">기존 활동 데이터는 보존됩니다.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setUnfollowTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600">취소</button>
              <button onClick={handleUnfollow}
                disabled={unfollowMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white disabled:bg-red-300">
                {unfollowMutation.isPending ? '처리중...' : '언팔로우'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PresetSelector presets={ARTIST_DISCOVER_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
