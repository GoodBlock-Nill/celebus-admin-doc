'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { Game, MultiLangText } from '@/lib/types';
import { formatGP } from '@/lib/utils';
import { getParticipantsByGameId } from '@/mock/participants';

interface ResultInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    result: 'YES' | 'NO',
    resultTitle: MultiLangText,
    resultDescription: MultiLangText,
    resultLinkText?: MultiLangText,
    resultLinkUrl?: MultiLangText,
  ) => void;
  game: Game | null;
}

const LANG_TABS = [
  { key: 'ko' as const, label: 'KO' },
  { key: 'en' as const, label: 'EN' },
  { key: 'jp' as const, label: 'JP' },
];

const EMPTY_LANG: MultiLangText = { ko: '', en: '', jp: '' };
const MAX_TITLE_LENGTH = 50;
const MAX_DESC_LENGTH = 500;

export default function ResultInputModal({ isOpen, onClose, onConfirm, game }: ResultInputModalProps) {
  const [selected, setSelected] = useState<'YES' | 'NO' | null>(null);
  const [resultTitle, setResultTitle] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [titleLang, setTitleLang] = useState<'ko' | 'en' | 'jp'>('ko');
  const [resultDescription, setResultDescription] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [descLang, setDescLang] = useState<'ko' | 'en' | 'jp'>('ko');
  const [resultLinkText, setResultLinkText] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [resultLinkUrl, setResultLinkUrl] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [linkLang, setLinkLang] = useState<'ko' | 'en' | 'jp'>('ko');
  const [confirmed, setConfirmed] = useState(false);

  if (!game) return null;

  const participants = getParticipantsByGameId(game.id);
  const yesCount = participants.filter(p => p.choice === 'YES').length;
  const noCount = participants.filter(p => p.choice === 'NO').length;

  const isTitleComplete = resultTitle.ko.trim() !== '' && resultTitle.en.trim() !== '' && resultTitle.jp.trim() !== '';
  const isDescriptionComplete = resultDescription.ko.trim() !== '' && resultDescription.en.trim() !== '' && resultDescription.jp.trim() !== '';
  const canConfirm = selected !== null && isTitleComplete && isDescriptionComplete;

  const resetState = () => {
    setSelected(null);
    setResultTitle({ ...EMPTY_LANG });
    setTitleLang('ko');
    setResultDescription({ ...EMPTY_LANG });
    setDescLang('ko');
    setResultLinkText({ ...EMPTY_LANG });
    setResultLinkUrl({ ...EMPTY_LANG });
    setLinkLang('ko');
    setConfirmed(false);
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    onConfirm(selected, resultTitle, resultDescription, resultLinkText, resultLinkUrl);
    resetState();
  };

  const handleClose = () => {
    resetState();
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
            disabled={!canConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmed ? '최종 확정' : '결과 확정'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 게임 정보 테이블 */}
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

        {/* 결과제목 (다국어) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            결과제목 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1 mb-2">
            {LANG_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTitleLang(tab.key)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  titleLang === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={resultTitle[titleLang]}
            onChange={(e) => {
              if (e.target.value.length <= MAX_TITLE_LENGTH) {
                setResultTitle(prev => ({ ...prev, [titleLang]: e.target.value }));
                setConfirmed(false);
              }
            }}
            placeholder="결과 제목을 입력하세요."
            maxLength={MAX_TITLE_LENGTH}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">{resultTitle[titleLang].length}/{MAX_TITLE_LENGTH}</span>
          </div>
        </div>

        {/* 결과 선택 */}
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

        {/* 결과설명 (다국어) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            결과설명 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1 mb-2">
            {LANG_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDescLang(tab.key)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  descLang === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <textarea
            value={resultDescription[descLang]}
            onChange={(e) => {
              if (e.target.value.length <= MAX_DESC_LENGTH) {
                setResultDescription(prev => ({ ...prev, [descLang]: e.target.value }));
                setConfirmed(false);
              }
            }}
            placeholder="결과에 대한 설명을 입력하세요."
            rows={3}
            maxLength={MAX_DESC_LENGTH}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">{resultDescription[descLang].length}/{MAX_DESC_LENGTH}</span>
          </div>
        </div>

        {/* 결과링크 (다국어, 선택) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            결과링크
          </label>
          <div className="flex gap-1 mb-2">
            {LANG_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLinkLang(tab.key)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  linkLang === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={resultLinkText[linkLang]}
              onChange={(e) => setResultLinkText(prev => ({ ...prev, [linkLang]: e.target.value }))}
              placeholder="링크 텍스트를 입력하세요."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              value={resultLinkUrl[linkLang]}
              onChange={(e) => setResultLinkUrl(prev => ({ ...prev, [linkLang]: e.target.value }))}
              placeholder="https://example.com/result-proof"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">결과를 확인할 수 있는 링크를 입력하세요. (선택)</p>
        </div>

        {/* 경고 박스 */}
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
