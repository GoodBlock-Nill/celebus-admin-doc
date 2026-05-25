'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BannerForm from '@/components/home/BannerForm';
import {
  getArtistDisplay,
  getBannerById,
  getSlotKindLabel,
  SLOT_KIND_META,
  type ArtistGroup,
  type SlotKind,
} from '@/mock/home';
import { bannerToast } from '@/components/home/BannerModals';

const VALID_KINDS: SlotKind[] = ['MAIN', 'TODAY_TODO', 'TOGETHER', 'MISSION'];

function parseSlot(raw: string | null): SlotKind {
  return VALID_KINDS.includes(raw as SlotKind) ? (raw as SlotKind) : 'MAIN';
}

function parseArtist(raw: string | null): ArtistGroup | null {
  if (!raw || raw === 'GLOBAL') return null;
  return raw as ArtistGroup;
}

function NewBannerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSlot = searchParams.get('slot') ?? searchParams.get('slotKind');
  const rawArtist = searchParams.get('artist');
  // v6.8: 복제 모드 식별 — `?from={원본 배너ID}`
  const fromId = searchParams.get('from');
  const isCloneMode = !!fromId;
  const originalBanner = useMemo(
    () => (fromId ? getBannerById(parseInt(fromId, 10)) : null),
    [fromId],
  );

  // 슬롯 컨텍스트가 없으면 배너 관리 리스트로 안전망 리다이렉트
  useEffect(() => {
    if (!rawSlot && !rawArtist) {
      const timer = setTimeout(() => router.replace('/home/banners'), 1500);
      return () => clearTimeout(timer);
    }
  }, [rawSlot, rawArtist, router]);

  if (!rawSlot && !rawArtist) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-start gap-2 shadow-sm">
          <span className="font-semibold">슬롯을 먼저 선택해 주세요.</span>
          <span>배너 관리에서 슬롯 행을 클릭한 뒤 [+ 배너 추가]로 진입합니다. 잠시 후 이동합니다…</span>
        </div>
      </div>
    );
  }

  const slotKind = parseSlot(rawSlot);
  const artist = parseArtist(rawArtist);
  const meta = SLOT_KIND_META[slotKind];

  const slotLabel = getSlotKindLabel(slotKind);
  const artistLabel = getArtistDisplay(artist);

  const backUrl = `/home/banners/slot/${slotKind}/${artist ?? 'GLOBAL'}`;

  // v6.8: 복제 모드 — 원본 입력값 prefill (공개일·종료일·상태·통계는 초기화)
  const initialForClone = useMemo(() => {
    if (!isCloneMode || !originalBanner) return undefined;
    return {
      ...originalBanner,
      period: { type: 'CUSTOM' as const, openDt: '', closeDt: '' },
      status: 'DRAFT' as const,
      displayOrder: undefined as unknown as number,
    };
  }, [isCloneMode, originalBanner]);

  // 변경 추적은 신규 작성에서 사용하지 않으나 폼이 콜백을 요구할 수 있으므로 noop
  const [, setHasChanged] = useState(false);

  const handleSubmit = (action: 'save_draft' | 'create' | 'save') => {
    const msg =
      action === 'save_draft'
        ? '임시저장되었습니다 (메인 타이틀 KO 외 항목은 추후 보강 가능)'
        : action === 'create'
        ? '배너가 생성되었습니다 (공개일 도달 시 자동 노출)'
        : '저장되었습니다';
    bannerToast.success(msg);
    setTimeout(() => router.push(backUrl), 600);
  };

  return (
    <div>
      <PageHeader
        title={isCloneMode ? '배너 복제' : '새 배너 등록'}
        breadcrumbItems={[
          { label: '앱' },
          { label: '배너 관리', href: `/home/banners?placement=${meta.tab}` },
          { label: `${slotLabel} · ${artistLabel}`, href: backUrl },
          { label: isCloneMode ? '복제' : '새 배너' },
        ]}
      />
      {isCloneMode && originalBanner && (
        <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs text-indigo-800">
          ℹ️ 배너 <span className="font-semibold">&apos;{originalBanner.titleKO}&apos;</span>을(를) 복제 중입니다. 다른 슬롯에도 등록 가능합니다 (위치·아티스트 변경 허용).
        </div>
      )}
      <div className="mt-6">
        <BannerForm
          mode="create"
          slotKind={slotKind}
          artistGroup={artist}
          initial={initialForClone}
          slotEditable={isCloneMode}
          onHasChangedChange={setHasChanged}
          onSubmit={handleSubmit}
          onCancel={() => router.push(backUrl)}
        />
      </div>
    </div>
  );
}

export default function NewBannerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">불러오는 중…</div>}>
      <NewBannerPageInner />
    </Suspense>
  );
}
