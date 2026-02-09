'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { Game } from '@/lib/types';
import { formatGP } from '@/lib/utils';
import { getParticipantsByGameId } from '@/mock/participants';

interface ResultInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: 'YES' | 'NO', resultLink?: string) => void;
  game: Game | null;
}

export default function ResultInputModal({ isOpen, onClose, onConfirm, game }: ResultInputModalProps) {
  const [selected, setSelected] = useState<'YES' | 'NO' | null>(null);
  const [resultLink, setResultLink] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!game) return null;

  const participants = getParticipantsByGameId(game.id);
  const yesCount = participants.filter(p => p.choice === 'YES').length;
  const noCount = participants.filter(p => p.choice === 'NO').length;

  const handleConfirm = () => {
    if (!selected) return;
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    onConfirm(selected, resultLink);
    setSelected(null);
    setResultLink('');
    setConfirmed(false);
  };

  const handleClose = () => {
    setSelected(null);
    setResultLink('');
    setConfirmed(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="결과 입력"
      width="max-w-xl"
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmed ? '최종 확정' : '결과 확정'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500 w-[120px]">타이틀</td>
              <td className="py-2.5 text-gray-900">{game.title.ko}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">총 참여자</td>
              <td className="py-2.5 text-gray-900">{participants.length}명</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2.5 text-gray-500">총 상금 GP</td>
              <td className="py-2.5 text-gray-900">{formatGP(game.totalPrizeGP)}</td>
            </tr>
          </tbody>
        </table>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">결과 선택</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setSelected('YES'); setConfirmed(false); }}
              className={`p-4 rounded-lg border-2 text-center transition-colors ${
                selected === 'YES'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-lg font-bold text-green-600">YES</span>
              <p className="text-sm text-gray-500 mt-1">예상 정답자: {yesCount}명</p>
            </button>
            <button
              type="button"
              onClick={() => { setSelected('NO'); setConfirmed(false); }}
              className={`p-4 rounded-lg border-2 text-center transition-colors ${
                selected === 'NO'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-lg font-bold text-red-600">NO</span>
              <p className="text-sm text-gray-500 mt-1">예상 정답자: {noCount}명</p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            결과 확인 링크
          </label>
          <input
            type="url"
            value={resultLink}
            onChange={(e) => setResultLink(e.target.value)}
            placeholder="https://example.com/result-proof"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">결과를 확인할 수 있는 URL을 입력하세요. (선택)</p>
        </div>

        {confirmed && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700 font-medium">
              결과 확정 후에는 변경할 수 없습니다. 정말로 &quot;{selected}&quot;(으)로 확정하시겠습니까?
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
