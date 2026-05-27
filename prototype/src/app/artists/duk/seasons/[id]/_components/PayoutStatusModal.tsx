'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { DukPayoutStatus, DukRewardPayout } from '@/mock/duk';

// [CEB-BO-ART-401-MD-PAYOUT] 지급 상태 변경 모달
// - 수동 지급 상품(배송 수령·현장 수령)에서만 호출됨
// - 지급 상태 4종 + 메모 (지급실패·재지급대기 선택 시 메모 필수, 50~200자)

interface Props {
  target: DukRewardPayout | null;
  groupName: string;
  seasonName: string;
  onClose: () => void;
  onSave: (updated: DukRewardPayout) => void;
}

const STATUS_OPTIONS: DukPayoutStatus[] = ['지급완료', '지급대기', '지급실패', '재지급대기'];

function nowText(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PayoutStatusModal({ target, groupName, seasonName, onClose, onSave }: Props) {
  const [status, setStatus] = useState<DukPayoutStatus>('지급대기');
  const [memo, setMemo] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (target) {
      setStatus(target.paidStatus);
      setMemo(target.memo ?? '');
      setTouched(false);
    }
  }, [target]);

  if (!target) return null;

  const memoRequired = status === '지급실패' || status === '재지급대기';
  const memoTrimmed = memo.trim();
  const memoError = (() => {
    if (memoRequired && memoTrimmed === '') return '메모를 입력해주세요. 사유 기록이 필요합니다.';
    if (memoRequired && memoTrimmed.length < 50) return '메모는 50자 이상으로 입력하세요.';
    if (memoTrimmed.length > 200) return '메모는 200자 이하로 입력하세요.';
    return null;
  })();

  const canSave = !memoError;

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    const prevStatus = target.paidStatus;
    const updated: DukRewardPayout = {
      ...target,
      paidStatus: status,
      memo: memoTrimmed === '' ? undefined : memoTrimmed,
      paidAt: status === '지급대기' ? undefined : nowText(),
      paidBy: '운영자',
    };
    // 활동 로그 (콘솔 mock — 실서비스에서는 API 호출)
    console.info(
      `[활동 로그] 덕력 시즌 '${groupName} - ${seasonName}' ${target.yearMonth} ${target.memberNickname} '${target.prizeTitle.ko}'의 지급 상태를 '${prevStatus}' → '${status}'(으)로 변경. 메모: '${memoTrimmed.slice(0, 30)}'`,
    );
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">지급 상태 변경</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 space-y-5">
          {/* 대상 안내 */}
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm">
            <p className="text-xs text-gray-500 mb-1">대상</p>
            <p className="text-gray-900 font-medium">
              {target.memberNickname} · {target.rank}위 · {target.prizeType}
            </p>
            <p className="text-gray-700 mt-0.5">&ldquo;{target.prizeTitle.ko}&rdquo;</p>
          </div>

          {/* 현재 상태 */}
          <div>
            <p className="text-xs text-gray-500 mb-1">현재 상태</p>
            <p className="text-sm text-gray-700">{target.paidStatus}</p>
          </div>

          {/* 지급 상태 라디오 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              지급 상태 <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payout-status"
                    value={opt}
                    checked={status === opt}
                    onChange={() => setStatus(opt)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-800">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label htmlFor="payout-memo" className="block text-xs font-medium text-gray-600 mb-1">
              메모 {memoRequired && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              id="payout-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              maxLength={200}
              placeholder={memoRequired ? '지급실패·재지급대기는 사유를 50자 이상 입력하세요' : '선택 입력'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-between mt-1">
              <p className={`text-xs ${touched && memoError ? 'text-rose-600' : 'text-gray-400'}`}>
                {touched && memoError ? memoError : ' '}
              </p>
              <p className="text-xs text-gray-400">{memoTrimmed.length}/200</p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave && touched}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
