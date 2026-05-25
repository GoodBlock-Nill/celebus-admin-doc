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
  // ([CEB-BO-APP-201] §4-2 정합 — 공통 토스트 규격 [CEB-BO-000] §16, 2026-05-21 sync 정정)
  useEffect(() => {
    if (!rawSlot && !rawArtist) {
      // 1초 뒤 리다이렉트 (안내 메시지가 보이도록 짧게 노출)
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

  // v6.7: 신규 생성은 항상 DRAFT 진입. 공개일 도달 시 시스템 자동 ACTIVE 전이.
  // 운영자가 "지금 노출"을 원하면 공개일을 현재 시각으로 설정하면 됨 (트리거 일원화).
  const handleSubmit = (action: 'save_draft' | 'create' | 'save') => {
    const msg =
      action === 'save_draft'
        ? '[Mock] 임시저장 완료. 메인 타이틀 KO 외 항목은 추후 보강 가능.'
        : action === 'create'
        ? '[Mock] 배너 생성 완료 (DRAFT). 공개일 도달 시 시스템이 자동으로 노출을 시작합니다.'
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
