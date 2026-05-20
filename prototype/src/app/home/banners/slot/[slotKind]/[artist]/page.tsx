'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  Bars3Icon,
  InboxIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import {
  formatPeriod,
  getArtistDisplay,
  getSlot,
  getSlotKindBadge,
  getSlotKindLabel,
  getSourceTypeBadge,
  getStatusBadge,
  getStatusLabel,
  SLOT_KIND_META,
  type ArtistGroup,
  type BannerSourceType,
  type BannerStatus,
  type HomeBanner,
  type SlotKind,
} from '@/mock/home';

const VALID_KINDS: SlotKind[] = ['MAIN', 'TODAY_TODO', 'TOGETHER', 'MISSION'];

function parseArtist(raw: string): ArtistGroup | null {
  if (raw === 'GLOBAL') return null;
  return raw as ArtistGroup;
}

export default function SlotDetailPage({
  params,
}: {
  params: Promise<{ slotKind: string; artist: string }>;
}) {
  const router = useRouter();
  const { slotKind: rawKind, artist: rawArtist } = use(params);

  if (!VALID_KINDS.includes(rawKind as SlotKind)) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push('/home/banners')}
          className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeftIcon className="w-4 h-4" /> 배너 리스트로
        </button>
        <p className="mt-4 text-sm text-gray-500">알 수 없는 슬롯 종류입니다.</p>
      </div>
    );
  }

  const slotKind = rawKind as SlotKind;
  const artist = parseArtist(rawArtist);
  const meta = SLOT_KIND_META[slotKind];

  // 위치별 타겟 모드 가드 (잘못된 조합 차단)
  const targetMismatch =
    (meta.targetMode === 'GLOBAL_ONLY' && artist !== null) ||
    (meta.targetMode === 'ARTIST_ONLY' && artist === null);
  if (targetMismatch) {
    const msg =
      meta.targetMode === 'GLOBAL_ONLY'
        ? `${meta.label} 위치는 전역만 지원합니다.`
        : `${meta.label} 위치는 아티스트만 지원합니다.`;
    return (
      <div className="p-8">
        <button
          onClick={() => router.push('/home/banners')}
          className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeftIcon className="w-4 h-4" /> 배너 리스트로
        </button>
        <p className="mt-4 text-sm text-gray-500">{msg}</p>
      </div>
    );
  }

  const tabPlacement = meta.tab; // 'home' 또는 'artist'
  const slot = useMemo(() => getSlot(slotKind, artist), [slotKind, artist]);

  const [list, setList] = useState<HomeBanner[]>(slot.banners);
  const [dragId, setDragId] = useState<number | null>(null);

  const activeCount = list.filter((b) => b.status === 'ACTIVE').length;
  const draftCount = list.filter((b) => b.status === 'DRAFT').length;
  const isCarousel = meta.capacity === 'MULTI';
  const isSingleSlot = !isCarousel;
  const capacityLimit = meta.capacityLimit; // 캐러셀=8, 단일=1
  // 캐러셀은 ACTIVE 8개 도달 시 신규 ON 차단 (등록은 가능)
  const isCarouselFull = isCarousel && capacityLimit !== null && activeCount >= capacityLimit;
  // 등록은 항상 가능 (단일 슬롯도 DRAFT 다수 등록 가능, [노출 시작] 시 자동 교체)
  const canAddBanner = true;

  const slotLabel = getSlotKindLabel(slotKind);
  const artistLabel = getArtistDisplay(artist);
  const kindBadge = getSlotKindBadge(slotKind);

  const newUrl =
    `/home/banners/new?slot=${slotKind}` +
    (artist ? `&artist=${encodeURIComponent(artist)}` : '&artist=GLOBAL');

  // 드래그 정렬 (캐러셀만)
  const handleDragStart = (id: number) => setDragId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetId: number) => {
    if (!isCarousel) return setDragId(null);
    if (dragId === null || dragId === targetId) return setDragId(null);
    const next = [...list];
    const fromIdx = next.findIndex((b) => b.id === dragId);
    const toIdx = next.findIndex((b) => b.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return setDragId(null);
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setList(next.map((b, i) => ({ ...b, displayOrder: i + 1 })));
    setDragId(null);
  };

  return (
    <div>
      <PageHeader
        title={`${slotLabel} — ${artistLabel}`}
        breadcrumbItems={[
          { label: '앱' },
          { label: '배너 관리', href: `/home/banners?placement=${tabPlacement}` },
          { label: `${slotLabel} · ${artistLabel}` },
        ]}
      />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${kindBadge.bg} ${kindBadge.text}`}
          >
            {slotLabel}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              artist === null ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {artistLabel}
          </span>
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700">
            {isCarousel ? `캐러셀 (최대 동시 ${capacityLimit}개)` : '단일 배너 1개 고정'}
          </span>
        </div>

        <button
          onClick={() => router.push(newUrl)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />
          배너 추가
        </button>
      </div>

      {/* 슬롯 상태 안내 */}
      <div
        className={`mt-4 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between ${
          isCarouselFull
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-violet-50 border border-violet-100 text-violet-800'
        }`}
      >
        <div>
          {list.length === 0 ? (
            <span>
              이 슬롯은 비어 있습니다. [배너 추가]로 등록해 주세요. (
              {isCarousel ? `캐러셀, 최대 동시 ${capacityLimit}개` : '단일, 1건만 노출'})
            </span>
          ) : (
            <>
              <span className="font-semibold">노출중</span>{' '}
              <span className="font-bold">
                {activeCount} / {capacityLimit}
              </span>
              {draftCount > 0 && (
                <span className="ml-3 text-xs opacity-70">대기 {draftCount}건</span>
              )}
              {isCarouselFull && (
                <span className="ml-2">— 한도 도달. 신규 노출 시작 시 기존 1건을 종료해 주세요.</span>
              )}
              {isSingleSlot && activeCount === 1 && draftCount > 0 && (
                <span className="ml-2 text-xs opacity-70">
                  · 대기 배너 [노출 시작] 시 기존이 자동 종료됩니다.
                </span>
              )}
            </>
          )}
        </div>
        <span className="text-xs opacity-70">슬롯 자체는 시스템 자동 생성 (운영자는 배너만 관리)</span>
      </div>

      {/* 배너 리스트 */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              {isCarousel && <th className="w-10 px-2 py-3" />}
              {isCarousel && <th className="w-14 px-3 py-3 text-right">순서</th>}
              <th className="w-24 px-3 py-3 text-left">상태</th>
              <th className="w-24 px-3 py-3 text-left">소스 타입</th>
              <th className="px-3 py-3 text-left">타이틀 (KO)</th>
              <th className="w-64 px-3 py-3 text-left">노출 기간</th>
              <th className="w-36 px-3 py-3 text-left">최근 수정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 ? (
              <tr>
                <td
                  colSpan={isCarousel ? 7 : 5}
                  className="px-4 py-16 text-center"
                >
                  <InboxIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">등록된 배너가 없습니다.</p>
                  <button
                    onClick={() => router.push(newUrl)}
                    className="mt-3 h-9 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    <PlusIcon className="w-4 h-4" />첫 배너 추가
                  </button>
                </td>
              </tr>
            ) : (
              list.map((b) => (
                <BannerRow
                  key={b.id}
                  banner={b}
                  isCarousel={isCarousel}
                  isDragging={dragId === b.id}
                  onDragStart={() => handleDragStart(b.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(b.id)}
                  onClick={() => router.push(`/home/banners/${b.id}`)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BannerRow({
  banner,
  isCarousel,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onClick,
}: {
  banner: HomeBanner;
  isCarousel: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onClick: () => void;
}) {
  const status = getStatusBadge(banner.status as BannerStatus);
  const source = getSourceTypeBadge(banner.sourceType as BannerSourceType);
  const period = formatPeriod(banner.period);
  return (
    <tr
      onClick={onClick}
      onDragOver={isCarousel ? onDragOver : undefined}
      onDrop={isCarousel ? onDrop : undefined}
      className={`cursor-pointer hover:bg-gray-50 ${isDragging ? 'opacity-40 bg-violet-50' : ''}`}
    >
      {isCarousel && (
        <td className="px-2 py-3 text-center whitespace-nowrap">
          <span
            draggable
            onDragStart={onDragStart}
            onClick={(e) => e.stopPropagation()}
            title="드래그하여 순서 변경"
            className="inline-flex w-6 h-6 items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
          >
            <Bars3Icon className="w-4 h-4" />
          </span>
        </td>
      )}
      {isCarousel && (
        <td className="px-3 py-3 text-sm text-right text-gray-700 whitespace-nowrap">
          {banner.displayOrder}
        </td>
      )}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
          {getStatusLabel(banner.status as BannerStatus)}
        </span>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${source.bg} ${source.text}`}>
          {source.label}
        </span>
      </td>
      <td className="px-3 py-3 text-sm">
        <div className="text-gray-900 font-medium truncate max-w-[420px]">{banner.titleKO}</div>
        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[420px]">{banner.subtitleKO}</div>
      </td>
      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
        {banner.period.type === 'UNLIMITED' ? (
          <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700">
            무기한
          </span>
        ) : (
          period
        )}
      </td>
      <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
        <div>{banner.updatedAt}</div>
        <div className="text-gray-400">{banner.updatedBy}</div>
      </td>
    </tr>
  );
}
