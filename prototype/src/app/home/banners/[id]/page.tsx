'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import BannerForm from '@/components/home/BannerForm';
import {
  formatPeriod,
  getArtistDisplay,
  getBannerById,
  getSlot,
  getSlotKindBadge,
  getSlotKindLabel,
  getStatusBadge,
  getStatusLabel,
  SLOT_KIND_META,
  type BannerStatus,
  type SlotKind,
} from '@/mock/home';
import {
  BannerStopExposureModal,
  BannerResumeExposureModal,
  BannerDeleteModal,
  BannerEditCancelModal,
  bannerToast,
} from '@/components/home/BannerModals';

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

  // v6.8: 변경 추적
  const [hasChanged, setHasChanged] = useState(false);

  // v6.8: 모달 4종 state
  const [modalStop, setModalStop] = useState(false);
  const [modalResume, setModalResume] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  // v6.9 (B1): pendingNav state 제거 → EditCancel 모달의 onConfirm을 클로저로 매번 주입.
  // editCancelAction이 null이면 모달 미오픈, 함수가 있으면 모달 오픈 + 확정 시 그 함수 실행.
  const [editCancelAction, setEditCancelAction] = useState<null | (() => void)>(null);

  // v6.9 (A2): "수정 후 재개" 흐름 자동 연결 — 사용자가 [수정 후 재개]를 누르면
  // 이 플래그가 켜지고, 수정 [저장] 후 자동으로 노출 재개 모달이 다시 열린다.
  const [pendingResumeAfterEdit, setPendingResumeAfterEdit] = useState(false);

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

  // v6.8: [노출 재개] 사전 분기 — 슬롯 한도·단일 자동 교체·종료일 과거 계산
  const slot = getSlot(banner.slotKind as SlotKind, banner.artistGroup);
  const activeInSlot = slot.banners.filter((b) => b.status === 'ACTIVE' && b.id !== banner.id);
  const isCarouselFull = slotMeta.capacity === 'MULTI' && activeInSlot.length >= (slotMeta.capacityLimit ?? 0);
  const replaceTargetTitle = slotMeta.capacity === 'SINGLE' && activeInSlot.length >= 1
    ? activeInSlot[0].titleKO
    : undefined;
  const closeDtStr = banner.period.type === 'CUSTOM' ? banner.period.closeDt : '';
  const endDatePast = useMemo(() => {
    if (!closeDtStr) return false;
    const t = Date.parse(closeDtStr.replace(/\./g, '-').replace(' ', 'T'));
    return Number.isFinite(t) && t < Date.now();
  }, [closeDtStr]);

  // ─────────────── 핸들러 ───────────────
  // v6.9 (B2): handleSubmit Toast 차단 제거 — [저장] 버튼 disabled로 이미 차단됨
  const handleSubmit = (action: 'save_draft' | 'create' | 'save') => {
    const msg =
      action === 'save' ? '저장되었습니다'
      : action === 'create' ? '배너가 생성되었습니다'
      : '임시저장되었습니다';
    bannerToast.success(msg);
    setHasChanged(false);
    setMode('view');

    // v6.9 (A2): "수정 후 재개" 의도가 있으면 저장 후 자동으로 노출 재개 모달 재오픈
    if (action === 'save' && pendingResumeAfterEdit) {
      setPendingResumeAfterEdit(false);
      // 약간의 지연 후 재개 모달 — 저장 토스트 노출 시간 확보
      setTimeout(() => setModalResume(true), 400);
    }
  };

  // v6.9 (B1): 수정 모드 [취소] — 클로저로 view 전환 액션 주입
  const handleEditCancel = () => {
    if (hasChanged) {
      setEditCancelAction(() => () => { setMode('view'); setPendingResumeAfterEdit(false); });
    } else {
      setMode('view');
      setPendingResumeAfterEdit(false);
    }
  };

  // v6.9 (B1): [← 슬롯으로] — 클로저로 슬롯 이동 액션 주입
  const handleBackToSlot = () => {
    if (mode === 'edit' && hasChanged) {
      setEditCancelAction(() => () => { router.push(backUrl); setPendingResumeAfterEdit(false); });
    } else {
      router.push(backUrl);
      setPendingResumeAfterEdit(false);
    }
  };

  const handleStopExposureConfirm = () => {
    setModalStop(false);
    bannerToast.success('노출이 종료되었습니다 (운영자 비상 차단)');
  };

  // 노출 재개 — 한도 초과 시 차단, 그 외 ACTIVE 전이
  const handleResumeExposureConfirm = () => {
    if (isCarouselFull) {
      bannerToast.error(`이 슬롯의 동시 노출이 한도(${slotMeta.capacityLimit}개)에 도달했습니다`);
      return;
    }
    setModalResume(false);
    if (replaceTargetTitle) {
      bannerToast.info(`기존 배너 '${replaceTargetTitle}'이(가) 자동 종료됩니다`);
    }
    bannerToast.success('노출이 재개되었습니다 (CLOSED → ACTIVE)');
  };

  // v6.9 (A2): "수정 후 재개" — 수정 모드 전환 + 의도 플래그 set
  // 운영자가 수정 [저장] 후 자동으로 노출 재개 모달이 재오픈됨
  const handleResumeAfterEdit = () => {
    setModalResume(false);
    setPendingResumeAfterEdit(true);
    setMode('edit');
  };

  const handleClone = () => {
    router.push(
      `/home/banners/new?slot=${banner.slotKind}&artist=${banner.artistGroup ?? 'GLOBAL'}&from=${banner.id}`,
    );
  };

  const handleDeleteConfirm = () => {
    setModalDelete(false);
    bannerToast.success('배너가 삭제되었습니다');
    setTimeout(() => router.push(backUrl), 600);
  };

  // v6.9 (B1): EditCancel 모달 확정 시 — 저장된 클로저 실행
  const handleEditCancelConfirm = () => {
    const action = editCancelAction;
    setEditCancelAction(null);
    setHasChanged(false);
    action?.();
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

      {/* v6.8: [← 슬롯으로] 원터치 복귀 (view·edit 모두) */}
      <div className="mt-3">
        <button
          onClick={handleBackToSlot}
          className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeftIcon className="w-4 h-4" /> {slotLabel} · {artistLabel} 슬롯으로
        </button>
      </div>

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
              <ActionBtn icon={<PencilSquareIcon className="w-4 h-4" />} onClick={() => setMode('edit')}>
                수정
              </ActionBtn>
              {banner.status !== 'DRAFT' && (
                <ActionBtn icon={<DocumentDuplicateIcon className="w-4 h-4" />} onClick={handleClone}>
                  복제
                </ActionBtn>
              )}
              {/* ACTIVE: [노출 종료] (비상 차단) */}
              {banner.status === 'ACTIVE' && (
                <ActionBtn icon={<StopIcon className="w-4 h-4" />} onClick={() => setModalStop(true)} variant="warning">
                  노출 종료
                </ActionBtn>
              )}
              {/* v6.8: CLOSED → [노출 재개] 신규 (운영자 복구 권한) */}
              {banner.status === 'CLOSED' && (
                <ActionBtn icon={<PlayIcon className="w-4 h-4" />} onClick={() => setModalResume(true)} variant="primary">
                  노출 재개
                </ActionBtn>
              )}
              {/* DRAFT·CLOSED는 [삭제] 가능. ACTIVE는 [노출 종료] 먼저 */}
              {banner.status !== 'ACTIVE' && (
                <ActionBtn icon={<TrashIcon className="w-4 h-4" />} onClick={() => setModalDelete(true)} variant="danger">
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
          onHasChangedChange={setHasChanged}
          onSubmit={handleSubmit}
          onCancel={mode === 'edit' ? handleEditCancel : () => router.push(backUrl)}
        />
      </div>

      {/* 모달 4종 — v6.8 */}
      <BannerStopExposureModal
        isOpen={modalStop}
        onClose={() => setModalStop(false)}
        onConfirm={handleStopExposureConfirm}
        bannerTitle={banner.titleKO || `#${banner.id}`}
      />
      <BannerResumeExposureModal
        isOpen={modalResume}
        onClose={() => setModalResume(false)}
        onConfirm={handleResumeExposureConfirm}
        onConfirmAfterEdit={endDatePast ? handleResumeAfterEdit : undefined}
        bannerTitle={banner.titleKO || `#${banner.id}`}
        isCarouselFull={isCarouselFull}
        replaceTargetTitle={replaceTargetTitle}
        endDatePast={endDatePast}
        endDateText={closeDtStr}
      />
      <BannerDeleteModal
        isOpen={modalDelete}
        onClose={() => setModalDelete(false)}
        onConfirm={handleDeleteConfirm}
        bannerTitle={banner.titleKO || `#${banner.id}`}
        status={statusLabel}
      />
      <BannerEditCancelModal
        isOpen={editCancelAction !== null}
        onClose={() => setEditCancelAction(null)}
        onConfirm={handleEditCancelConfirm}
      />
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
  variant?: 'danger' | 'warning' | 'primary';
}) {
  const cls =
    variant === 'danger'
      ? 'text-rose-700 bg-white border-rose-200 hover:bg-rose-50'
      : variant === 'warning'
      ? 'text-amber-700 bg-white border-amber-200 hover:bg-amber-50'
      : variant === 'primary'
      ? 'text-white bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
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
