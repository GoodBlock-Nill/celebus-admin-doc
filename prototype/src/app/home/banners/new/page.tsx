'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BannerForm from '@/components/home/BannerForm';
import {
  getArtistDisplay,
  getSlotKindLabel,
  SLOT_KIND_META,
  type ArtistGroup,
  type SlotKind,
} from '@/mock/home';

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

  // 슬롯 컨텍스트가 없으면 배너 관리 리스트로 안전망 리다이렉트
  useEffect(() => {
    if (!rawSlot && !rawArtist) {
      alert('슬롯을 먼저 선택해 주세요. 배너 관리에서 슬롯 행을 클릭한 뒤 [+ 배너 추가]로 진입합니다.');
      router.replace('/home/banners');
    }
  }, [rawSlot, rawArtist, router]);

  if (!rawSlot && !rawArtist) {
    return <div className="p-8 text-sm text-gray-500">슬롯 선택 화면으로 이동 중…</div>;
  }

  const slotKind = parseSlot(rawSlot);
  const artist = parseArtist(rawArtist);
  const meta = SLOT_KIND_META[slotKind];

  const slotLabel = getSlotKindLabel(slotKind);
  const artistLabel = getArtistDisplay(artist);

  const backUrl = `/home/banners/slot/${slotKind}/${artist ?? 'GLOBAL'}`;

  const handleSubmit = (action: 'save_draft' | 'start_now' | 'save') => {
    const msg =
      action === 'save_draft'
        ? '[Mock] 임시저장 완료. 슬롯으로 돌아갑니다.'
        : action === 'start_now'
        ? '[Mock] 저장 + 즉시 노출 시작. (실제 등록 처리는 미구현)'
        : '[Mock] 저장 완료.';
    alert(msg);
    router.push(backUrl);
  };

  return (
    <div>
      <PageHeader
        title="새 배너 등록"
        breadcrumbItems={[
          { label: '앱' },
          { label: '배너 관리', href: `/home/banners?placement=${meta.tab}` },
          { label: `${slotLabel} · ${artistLabel}`, href: backUrl },
          { label: '새 배너' },
        ]}
      />
      <div className="mt-6">
        <BannerForm
          mode="create"
          slotKind={slotKind}
          artistGroup={artist}
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
