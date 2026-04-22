'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/useUIStore';
import { useArtistStore } from '@/stores/useArtistStore';
import { useArtists, useFollowedArtists, useFollowArtist, useUnfollowArtist } from '@/lib/hooks/useArtists';
import { ARTIST_DISCOVER_PRESET_OPTIONS, getArtistDiscoverPresetState } from '@/lib/presets/artistDiscover';
import GuestBanner from '@/components/ui/GuestBanner';
import ArtistAvatar, { getArtistEmoji } from '@/components/artist/ArtistAvatar';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyState from '@/components/ui/EmptyState';
import ArtistList from '@/components/artist/ArtistList';
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
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unfollowTarget, setUnfollowTarget] = useState<Artist | null>(null);

  const handlePreset = (key: string) => {
    setPreset(key);
    const state = getArtistDiscoverPresetState(key);
    setIsLoggedIn(state.isLoggedIn);
    if (key === 'searchEmpty') { setSearchOpen(true); setSearchQuery('zzzznotfound'); }
    if (key === 'guestEmpty') { setSearchOpen(true); setSearchQuery('zzzznotfound'); }
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
    if (!isLoggedIn) {
      addToast('info', '로그인 화면으로 이동합니다');
      return;
    }
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
        <SubPageHeader title="아티스트" backHref="/home" />
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
      {!isLoggedIn && <GuestBanner />}
      <SubPageHeader title="아티스트" backHref="/home" />

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
                      disabled={followMutation.isPending || !isLoggedIn}
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
        <ArtistList
          artists={filteredArtists}
          followedSet={followedSet}
          onFollow={handleFollow}
          onUnfollow={(artist) => setUnfollowTarget(artist)}
          isLoading={followMutation.isPending || unfollowMutation.isPending || !isLoggedIn}
          searchQuery={searchQuery}
        />
      )}

      {/* 검색 결과 없음 */}
      {searchQuery && filteredArtists.length === 0 && (
        <EmptyState
          emoji="🔍"
          title="해당하는 아티스트가 없어요"
        />
      )}

      {/* 언팔로우 확인 모달 */}
      <ConfirmModal
        open={!!unfollowTarget}
        title={unfollowTarget ? `'${unfollowTarget.name}'을 언팔로우할까요?` : '언팔로우'}
        confirmLabel="언팔로우"
        cancelLabel="취소"
        confirmVariant="danger"
        onConfirm={handleUnfollow}
        onCancel={() => setUnfollowTarget(null)}
        disabled={unfollowMutation.isPending}
      >
        {unfollowTarget && (
          <>
            <div className="flex justify-center mb-3">
              <ArtistAvatar artistId={unfollowTarget.id} size="xl" className="mx-auto" />
            </div>
            <p className="text-xs text-gray-400">기존 활동 데이터는 보존됩니다.</p>
          </>
        )}
      </ConfirmModal>

      <PresetSelector presets={ARTIST_DISCOVER_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
