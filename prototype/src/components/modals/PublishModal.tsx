'use client';

import Modal from '@/components/ui/Modal';
import type { Game } from '@/lib/types';
import { formatDateTime, formatGP } from '@/lib/utils';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  game: Game | null;
}

export default function PublishModal({ isOpen, onClose, onConfirm, game }: PublishModalProps) {
  if (!game) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="게임을 게시하시겠습니까?"
      width="max-w-xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            게시하기
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-600 space-y-1 mb-4">
          <p>게시하면 즉시 게임이 시작되어 참여가 가능해집니다.</p>
          <p>게시 후에는 일부 항목만 수정 가능합니다.</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[140px]">타이틀</td>
              <td className="py-2.5 text-gray-900 font-medium">{game.title.ko}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">참여 기간</td>
              <td className="py-2.5 text-gray-900">게시 즉시 ~ {formatDateTime(game.endDate)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">총 상금 GP</td>
              <td className="py-2.5 text-gray-900 font-medium">{formatGP(game.totalPrizeGP)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
