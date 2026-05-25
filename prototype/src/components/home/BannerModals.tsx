'use client';

import Modal from '@/components/ui/Modal';
// v6.9 후속: Toast는 공용 컴포넌트로 분리됨 — 호환성 위해 re-export 유지.
// 신규 코드는 `import { toast } from '@/components/ui/Toast'` 직접 사용 권장.
export { toast as bannerToast } from '@/components/ui/Toast';

// APP 배너 모달 4종 — [CEB-BO-APP-201] v6.8 정합
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
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
              🚫 이 슬롯의 동시 노출이 한도(8개)에 도달했습니다.<br />
              다른 배너를 먼저 종료한 뒤 재시도해 주세요.
            </div>
            {/* v6.9 (A4): 한도 + 종료일 과거 동시 발생 시 종료일도 함께 안내 (재시도 시 놓치지 않도록) */}
            {endDatePast && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                ⚠️ 또한 종료일이 과거({endDateText})입니다. 슬롯 정리 후 재시도할 때 종료일도 함께 수정해 주세요.
              </div>
            )}
          </>
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

// Toast·ToastViewport는 components/ui/Toast.tsx로 분리됨 (공용화).
// 호환성을 위해 파일 상단에서 `bannerToast`를 re-export 한다.
