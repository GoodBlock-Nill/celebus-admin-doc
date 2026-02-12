'use client';

import Modal from '@/components/ui/Modal';
import type { Game } from '@/lib/types';
import { GAME_STATUS_CONFIG } from '@/lib/constants';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  game: Game | null;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, game }: DeleteModalProps) {
  if (!game) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="게임을 삭제하시겠습니까?"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
            삭제하기
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">삭제된 게임은 복구할 수 없습니다.</p>

        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[140px]">타이틀</td>
              <td className="py-2.5 text-gray-900 font-medium">{game.title.ko}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">상태</td>
              <td className="py-2.5 text-gray-900">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${GAME_STATUS_CONFIG[game.status].bg} ${GAME_STATUS_CONFIG[game.status].text}`}>
                  {GAME_STATUS_CONFIG[game.status].label}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
