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
      title="게시 확인"
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
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[140px]">타이틀</td>
              <td className="py-2.5 text-gray-900 font-medium">{game.title.ko}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">투표 시작일시</td>
              <td className="py-2.5 text-gray-900">게시 즉시 시작</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">투표 종료일시</td>
              <td className="py-2.5 text-gray-900">{formatDateTime(game.endDate)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">결과 발표 예정일</td>
              <td className="py-2.5 text-gray-900">{formatDateTime(game.resultDate)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">총 상금 GP</td>
              <td className="py-2.5 text-gray-900 font-medium">{formatGP(game.totalPrizeGP)}</td>
            </tr>
          </tbody>
        </table>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            게시 즉시 게임이 시작되며, 사용자가 참여할 수 있습니다.
            게시 후에는 일부 설정만 수정할 수 있습니다.
          </p>
        </div>
      </div>
    </Modal>
  );
}
