'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

// APP 배너 모달 4종 + Toast 헬퍼 — [CEB-BO-APP-201] v6.8 정합
// 패턴: components/gamezone/GameModals.tsx (BIVE 게임 모달) 동일

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// ─────────────── 1. 노출 종료 확인 (BannerStopExposureModal) ───────────────
// ACTIVE 상태 [노출 종료] 클릭 시. 비상 차단 권한.
export function BannerStopExposureModal({
  isOpen, onClose, onConfirm, bannerTitle,
}: BaseModalProps & { bannerTitle: string }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="노출 종료 확인"
      width="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">노출 종료</button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">배너 <span className="font-medium text-gray-900">&apos;{bannerTitle}&apos;</span>의 노출을 종료하시겠습니까?</p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          ⚠️ 운영자 수동 종료는 <span className="font-semibold">비상 차단 권한</span>입니다.<br />
          종료 후 다시 켜려면 CLOSED 상태에서 [노출 재개]를 사용하세요.
        </div>
      </div>
    </Modal>
  );
}

// ─────────────── 2. 노출 재개 확인 (BannerResumeExposureModal) — v6.8 신규 ───────────────
// CLOSED 상태 [노출 재개] 클릭 시. 슬롯 한도·단일 슬롯 교체·종료일 과거 분기 안내.
export function BannerResumeExposureModal({
  isOpen, onClose, onConfirm, onConfirmAfterEdit, bannerTitle,
  isCarouselFull, replaceTargetTitle, endDatePast, endDateText,
}: BaseModalProps & {
  bannerTitle: string;
  isCarouselFull?: boolean;       // 캐러셀 한도 초과 (차단)
  replaceTargetTitle?: string;     // 단일 슬롯에 기존 ACTIVE 1건 있으면 그 제목
  endDatePast?: boolean;           // 기존 종료일이 과거인 경우
  endDateText?: string;            // 종료일 표시 텍스트
  onConfirmAfterEdit?: () => void; // [수정 후 재개] 선택 시 — 수정 모드 진입
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="노출 재개 확인"
      width="max-w-md"
      footer={
        isCarouselFull ? (
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">닫기</button>
        ) : endDatePast ? (
          <>
            <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
            {onConfirmAfterEdit && (
              <button onClick={onConfirmAfterEdit} className="h-10 px-5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100">수정 후 재개</button>
            )}
            <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700">그대로 재개</button>
          </>
        ) : (
          <>
            <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
            <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">노출 재개</button>
          </>
        )
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">배너 <span className="font-medium text-gray-900">&apos;{bannerTitle}&apos;</span>의 노출을 재개하시겠습니까?</p>
        {isCarouselFull ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
            🚫 이 슬롯의 동시 노출이 한도(8개)에 도달했습니다.<br />
            다른 배너를 먼저 종료한 뒤 재시도해 주세요.
          </div>
        ) : (
          <>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800">
              즉시 ACTIVE로 전환됩니다. (운영자 복구 권한, 활동 로그 기록)
            </div>
            {replaceTargetTitle && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                ⚠️ 단일 슬롯 자동 교체 — 기존 배너 <span className="font-semibold">&apos;{replaceTargetTitle}&apos;</span>이(가) 자동 종료됩니다.
              </div>
            )}
            {endDatePast && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800">
                ⚠️ 종료일이 과거({endDateText})입니다.<br />
                <span className="font-semibold">[그대로 재개]</span> 선택 시 즉시 다시 종료됩니다.<br />
                <span className="font-semibold">[수정 후 재개]</span>로 종료일을 먼저 갱신하는 것을 권장합니다.
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// ─────────────── 3. 삭제 확인 (BannerDeleteModal) ───────────────
// DRAFT·CLOSED 상태 [삭제] 클릭 시.
export function BannerDeleteModal({
  isOpen, onClose, onConfirm, bannerTitle, status,
}: BaseModalProps & { bannerTitle: string; status: string }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="배너 삭제 확인"
      width="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">삭제하기</button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">삭제된 배너는 복구할 수 없습니다.</p>
        <dl className="grid grid-cols-[80px_1fr] gap-y-2 text-sm bg-gray-50 rounded-lg p-3">
          <dt className="text-gray-500">제목</dt>
          <dd className="text-gray-900 break-all">{bannerTitle}</dd>
          <dt className="text-gray-500">상태</dt>
          <dd className="text-gray-900">{status}</dd>
        </dl>
      </div>
    </Modal>
  );
}

// ─────────────── 4. 수정 취소 확인 (BannerEditCancelModal) — v6.8 신규 ───────────────
// 수정 모드에서 변경 사항이 있을 때만 [취소] 시 호출.
export function BannerEditCancelModal({ isOpen, onClose, onConfirm }: BaseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="수정 취소 확인"
      width="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">계속 수정</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">취소하기</button>
        </>
      }
    >
      <div className="space-y-2 text-sm text-gray-700">
        <p>배너 수정을 취소하시겠습니까?</p>
        <p className="text-gray-500">변경 중인 내용은 저장되지 않습니다.</p>
      </div>
    </Modal>
  );
}

// ─────────────── Toast 컴포넌트 (자체 구현, react-hot-toast 미사용) ───────────────
// [CEB-BO-000] §공통 토스트 규격 정합 — 상단 중앙·3초 자동·페이드인/아웃
export type ToastKind = 'success' | 'error' | 'info';
export interface ToastMsg {
  id: number;
  kind: ToastKind;
  message: string;
}

let toastId = 0;
let setToastListener: ((items: ToastMsg[]) => void) | null = null;
let toastItems: ToastMsg[] = [];

function emit(kind: ToastKind, message: string) {
  toastId += 1;
  const next = { id: toastId, kind, message };
  toastItems = [...toastItems.slice(-2), next]; // 최대 3개 스택
  setToastListener?.(toastItems);
  window.setTimeout(() => {
    toastItems = toastItems.filter((t) => t.id !== next.id);
    setToastListener?.(toastItems);
  }, 3000);
}

export const bannerToast = {
  success: (msg: string) => emit('success', msg),
  error: (msg: string) => emit('error', msg),
  info: (msg: string) => emit('info', msg),
};

export function BannerToastViewport() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    setToastListener = setItems;
    return () => { setToastListener = null; };
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-[fadeIn_0.2s_ease-out] ${
            t.kind === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            t.kind === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' :
                                   'bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          {t.kind === 'success' && '✓ '}
          {t.kind === 'error' && '✕ '}
          {t.kind === 'info' && 'ℹ '}
          {t.message}
        </div>
      ))}
    </div>
  );
}
