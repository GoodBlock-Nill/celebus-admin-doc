'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import BannerForm from '@/components/home/BannerForm';
import {
  formatPeriod,
  getArtistDisplay,
  getBannerById,
  getSlotKindBadge,
  getSlotKindLabel,
  getStatusBadge,
  getStatusLabel,
  SLOT_KIND_META,
  type BannerStatus,
  type SlotKind,
} from '@/mock/home';

export default function BannerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const sp = use(searchParams);
  const banner = getBannerById(parseInt(id, 10));
  const initialMode = sp.mode === 'edit' ? 'edit' : 'view';
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);

  if (!banner) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push('/home/banners')}
          className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeftIcon className="w-4 h-4" /> 배너 리스트로
        </button>
        <p className="mt-4 text-sm text-gray-500">배너를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const status = getStatusBadge(banner.status as BannerStatus);
  const kindBadge = getSlotKindBadge(banner.slotKind as SlotKind);
  const statusLabel = getStatusLabel(banner.status as BannerStatus);
  const slotLabel = getSlotKindLabel(banner.slotKind as SlotKind);
  const artistLabel = getArtistDisplay(banner.artistGroup);
  const slotMeta = SLOT_KIND_META[banner.slotKind as SlotKind];

  const backUrl = `/home/banners/slot/${banner.slotKind}/${banner.artistGroup ?? 'GLOBAL'}`;
  const isArtistTarget = banner.artistGroup !== null;

  // v6.7: action 시그니처 정정 ('start_now' 제거, 'create' 추가)
  const handleSubmit = (action: 'save_draft' | 'create' | 'save') => {
    alert(`[Mock] ${action === 'save' ? '수정 저장' : action === 'create' ? '생성' : '임시저장'} 완료`);
    setMode('view');
  };

  // v6.7: [노출 종료]는 비상 차단 권한 — 확인 모달 후 즉시 CLOSED 전이
  const handleStopExposure = () => {
    if (!confirm(`배너 '${banner.titleKO}'의 노출을 종료하시겠습니까?\n운영자 수동 종료는 비상 차단 권한입니다 (활동 로그 기록).`)) return;
    alert('[Mock] 노출 종료 (운영자 비상 차단)');
  };
  const handleClone = () => {
    alert('[Mock] 배너 복제 후 신규 작성 화면으로 이동');
    router.push(
      `/home/banners/new?slot=${banner.slotKind}&artist=${banner.artistGroup ?? 'GLOBAL'}`
    );
  };
  const handleDelete = () => {
    if (!confirm('삭제하시겠습니까?')) return;
    alert('[Mock] 삭제 완료');
    router.push(backUrl);
  };

  return (
    <div>
      <PageHeader
        title={banner.titleKO || '(제목 없음)'}
        breadcrumbItems={[
          { label: '앱' },
          { label: '배너 관리', href: `/home/banners?placement=${slotMeta.tab}` },
          { label: `${slotLabel} · ${artistLabel}`, href: backUrl },
          { label: banner.titleKO || `#${banner.id}` },
        ]}
      />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${kindBadge.bg} ${kindBadge.text}`}
          >
            {slotLabel}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
            {statusLabel}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              banner.artistGroup === null ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {artistLabel}
          </span>
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700">
            기간: {formatPeriod(banner.period)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'view' && (
            <>
              {/* v6.7: DRAFT는 [즉시 노출 시작] 제거 — 공개일 도달 시 시스템 자동 활성화 */}
              <ActionBtn icon={<PencilSquareIcon className="w-4 h-4" />} onClick={() => setMode('edit')}>
                수정
              </ActionBtn>
              {banner.status !== 'DRAFT' && (
                <ActionBtn icon={<DocumentDuplicateIcon className="w-4 h-4" />} onClick={handleClone}>
                  복제
                </ActionBtn>
              )}
              {/* v6.7: ACTIVE [노출 종료] (비상 차단 권한, "즉시" 단어 제거) */}
              {banner.status === 'ACTIVE' && (
                <ActionBtn icon={<StopIcon className="w-4 h-4" />} onClick={handleStopExposure} variant="warning">
                  노출 종료
                </ActionBtn>
              )}
              {banner.status !== 'ACTIVE' && (
                <ActionBtn icon={<TrashIcon className="w-4 h-4" />} onClick={handleDelete} variant="danger">
                  삭제
                </ActionBtn>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <BannerForm
          mode={mode}
          initial={banner}
          onSubmit={handleSubmit}
          onCancel={mode === 'edit' ? () => setMode('view') : () => router.push(backUrl)}
        />
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  onClick,
  children,
  variant,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'danger' | 'warning';
}) {
  const cls =
    variant === 'danger'
      ? 'text-rose-700 bg-white border-rose-200 hover:bg-rose-50'
      : variant === 'warning'
      ? 'text-amber-700 bg-white border-amber-200 hover:bg-amber-50'
      : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50';
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium border rounded-lg ${cls}`}
    >
      {icon} {children}
    </button>
  );
}
