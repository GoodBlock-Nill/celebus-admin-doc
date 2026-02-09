'use client';

import Modal from '@/components/ui/Modal';
import type { Game } from '@/lib/types';
import { formatGP } from '@/lib/utils';
import { getParticipantsByGameId } from '@/mock/participants';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  game: Game | null;
}

export default function RewardModal({ isOpen, onClose, onConfirm, game }: RewardModalProps) {
  if (!game || !game.result) return null;

  const participants = getParticipantsByGameId(game.id);
  const winners = participants.filter(p => p.choice === game.result);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="보상 지급 확인"
      width="max-w-xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            보상 지급
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[120px]">게임 결과</td>
              <td className="py-2.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  game.result === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {game.result}
                </span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">총 상금 GP</td>
              <td className="py-2.5 text-gray-900 font-medium">{formatGP(game.totalPrizeGP)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">정답자 수</td>
              <td className="py-2.5 text-gray-900">{winners.length}명</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">전체 참여자</td>
              <td className="py-2.5 text-gray-900">{participants.length}명</td>
            </tr>
            <tr>
              <td className="py-2.5 text-gray-500">환급 대상</td>
              <td className="py-2.5 text-gray-900">{participants.length}명 (전원)</td>
            </tr>
          </tbody>
        </table>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
          <p className="text-sm text-blue-700">보상 계산 안내:</p>
          <ul className="text-sm text-blue-600 list-disc list-inside space-y-0.5">
            <li>정답자에게 총 상금 GP를 (참여GP + 부스팅GP x2) 비율로 배분</li>
            <li>참여 GP는 정답/오답 관계없이 전액 환급</li>
            <li>부스팅 GP는 환급 없음, 보상 가중치 2배</li>
          </ul>
        </div>

        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">보상 지급 후에는 취소할 수 없습니다.</p>
        </div>
      </div>
    </Modal>
  );
}
