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
  if (!game) return null;
  if (!game.result) return null;

  const participants = getParticipantsByGameId(game.id);
  const winners = participants.filter(p => p.choice === game.result);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="보상을 지급하시겠습니까?"
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
              <td className="py-2.5 text-gray-500 w-[140px]">타이틀</td>
              <td className="py-2.5 text-gray-900 font-medium">{game.title.ko}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[140px]">결과</td>
              <td className="py-2.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  game.result === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {game.result}
                </span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[140px]">총 상금 GP</td>
              <td className="py-2.5 text-gray-900 font-medium">{formatGP(game.totalPrizeGP)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[140px]">정답자 수</td>
              <td className="py-2.5 text-gray-900">{winners.length}명</td>
            </tr>
            <tr>
              <td className="py-2.5 text-gray-500 w-[140px]">환급 대상</td>
              <td className="py-2.5 text-gray-900">전체 참여자 {participants.length}명</td>
            </tr>
          </tbody>
        </table>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
          <p className="text-sm font-medium text-blue-800">💡 보상 계산 안내</p>
          <ul className="text-sm text-blue-600 list-disc list-inside space-y-0.5">
            <li>정답자에게 총 상금 GP가 (참여GP + 부스팅GP×2) 비율로 배분됩니다.</li>
            <li>모든 참여자에게 참여 GP가 전액 환급됩니다.</li>
            <li>부스팅 GP는 환급되지 않습니다.</li>
          </ul>
        </div>

        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">⚠️ 보상 지급은 1회만 가능하며, 지급 후 취소할 수 없습니다.</p>
        </div>
      </div>
    </Modal>
  );
}
