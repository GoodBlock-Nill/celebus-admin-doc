'use client';

import Modal from '@/components/ui/Modal';
import type { Game } from '@/lib/types';
import { formatNumber, formatGP } from '@/lib/utils';
import { getParticipantsByGameId } from '@/mock/participants';

interface ForceCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  game: Game | null;
}

export default function ForceCloseModal({ isOpen, onClose, onConfirm, game }: ForceCloseModalProps) {
  if (!game) return null;

  const participants = getParticipantsByGameId(game.id);
  const totalRefundGP = participants.reduce((sum, p) => sum + p.participationGP + p.boostingGP, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="게임을 강제 종료하시겠습니까?"
      width="max-w-xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
            강제 종료
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Warning text block */}
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-1">
          <p className="text-sm font-medium text-orange-800">
            {game.status === 'Active' && '⚠️ 강제 종료 시 진행 중인 참여가 즉시 마감됩니다.'}
            {game.status === 'Pending' && '⚠️ 결과를 입력하지 않고 즉시 종료됩니다.'}
          </p>
          <p className="text-sm text-orange-700">참여자에게는 참여 GP가 전액 환급됩니다.</p>
          <p className="text-sm text-orange-700">이 작업은 되돌릴 수 없습니다.</p>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800 mb-2">강제 종료 시 처리 내용</p>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>게임 상태: {game.status} → Ended</li>
            <li>모든 참여자 참여 GP 전액 환급</li>
            <li>부스팅 GP도 전액 환급</li>
            <li>보상 미지급 (결과 없이 종료)</li>
          </ul>
        </div>

        {/* Game info summary table */}
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[140px]">타이틀</td>
              <td className="py-2.5 text-gray-900 font-medium">{game.title.ko}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">현재 참여자</td>
              <td className="py-2.5 text-gray-900">{formatNumber(game.participantCount)}명</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">환급 예정 GP</td>
              <td className="py-2.5 text-gray-900 font-medium">{formatGP(totalRefundGP)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
