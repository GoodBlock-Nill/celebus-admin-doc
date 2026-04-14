'use client';

const REJECT_MESSAGES: Record<string, string> = {
  IMG_BLUR: '이미지가 흐릿하거나 너무 어두워서 내용을 확인할 수 없습니다. 선명한 사진으로 다시 올려주세요!',
  WRONG_OBJ: '퀘스트와 관련 없는 사진입니다. 미션 가이드를 다시 확인하고 올바른 대상을 촬영해 주세요.',
  DUP_ENTRY: '이미 제출되었거나 다른 유저가 사용한 이미지와 동일한 것으로 확인됩니다. 직접 촬영한 새로운 사진으로 참여해 주세요.',
  DATE_EXP: '인증 기준(날짜, 시간, 필수 정보 등)이 충족되지 않았습니다. 유효 기간 내의 사진인지 확인해 주세요.',
};

interface RejectReasonModalProps {
  reasonCode: string;
  reasonText?: string;
  onRetry: () => void;
  onClose: () => void;
}

export default function RejectReasonModal({ reasonCode, reasonText, onRetry, onClose }: RejectReasonModalProps) {
  const message = reasonCode === 'ETC_INPUT'
    ? (reasonText || '가이드에 맞지 않았어요. 가이드를 확인하고 다시 도전해 주세요!')
    : (REJECT_MESSAGES[reasonCode] || '가이드에 맞지 않았어요. 가이드를 확인하고 다시 도전해 주세요!');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
      <div className="relative z-10 w-full max-w-[340px] bg-white rounded-2xl overflow-hidden animate-scaleIn">
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">다시 한번 도전해볼까요?</h3>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{message}</p>
        </div>
        <div className="flex border-t border-gray-100">
          <button
            onClick={onRetry}
            className="flex-1 py-3.5 text-sm font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
          >
            재도전
          </button>
          <div className="w-px bg-gray-100" />
          <button
            onClick={onClose}
            className="flex-1 py-3.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
