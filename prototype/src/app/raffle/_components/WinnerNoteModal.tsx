'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { RaffleWinner } from '@/mock/fanquest';

interface Props {
  winner: RaffleWinner;
  onCancel: () => void;
  onSave: (note: string) => void;
}

export default function WinnerNoteModal({ winner, onCancel, onSave }: Props) {
  const [note, setNote] = useState(winner.note);
  const [showNoChangeWarn, setShowNoChangeWarn] = useState(false);
  const valid = winner.status === '당첨';

  // [CEB-BO-RFL-203-MD-NOTE] §4 정합 — 변경사항 없음 안내 후 모달 유지 (2026-05-21 sync 정정)
  const handleSave = () => {
    if (note === winner.note) {
      setShowNoChangeWarn(true);
      return;
    }
    onSave(note);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">당첨자 비고사항</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium text-gray-900">{winner.nickname}</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-mono">{winner.phone}</span>
            </p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4">
          {!valid ? (
            <div className="text-xs text-gray-500 leading-relaxed">
              미당첨자는 비고를 작성할 수 없습니다.
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 mb-2">CS 대응·배송 메모 등 운영 내부 노트 (한국어, 200자)</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                rows={5}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="비고사항을 입력하세요"
              />
              <div className="text-right text-[11px] text-gray-400 mt-1">{note.length}/200</div>
              {showNoChangeWarn && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  변경사항이 없습니다
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onCancel} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          {valid && (
            <button onClick={handleSave} className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
