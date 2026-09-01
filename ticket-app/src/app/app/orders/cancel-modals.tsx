'use client';

import { ConfirmModal } from '../_components/modal';

/** 예매 상세에서 열리는 취소 계열 확인 모달 구분 */
export type CancelModalKind = 'NONE' | 'CANCEL_AWAITING' | 'REQUEST_CANCEL';

/**
 * 예매 취소·환불 요청 확인 모달.
 *
 * 취소·환불 요청은 돈을 돌려주는 절차로 이어지므로,
 * 환불 계좌가 아직 없으면 "계좌 등록 후 환불"이라는 조건을 요청 전에 미리 알린다.
 */
export function CancelModals({
  kind,
  hasRefundAccount,
  onConfirm,
  onClose,
}: {
  kind: CancelModalKind;
  hasRefundAccount: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <ConfirmModal
        open={kind === 'CANCEL_AWAITING'}
        title="예매를 취소할까요?"
        description="입금 전 예매는 수수료 없이 즉시 취소되며, 확보된 좌석은 바로 반환됩니다."
        confirmLabel="예매 취소하기"
        onConfirm={onConfirm}
        onClose={onClose}
      />

      <ConfirmModal
        open={kind === 'REQUEST_CANCEL'}
        title="취소·환불을 요청할까요?"
        description={
          <>
            요청 후 24시간 이내에 처리됩니다. 아직 티켓이 지급되지 않은 예매로, 환불이 승인되면
            확보된 좌석은 반환됩니다.
            {hasRefundAccount ? null : (
              <span className="mt-2 block font-semibold text-[#B54708]">
                환불은 계좌 등록 후 처리됩니다. 요청 접수 뒤 예매 상세에서 환불 계좌를 등록해 주세요.
              </span>
            )}
          </>
        }
        confirmLabel="취소·환불 요청하기"
        onConfirm={onConfirm}
        onClose={onClose}
      />
    </>
  );
}
