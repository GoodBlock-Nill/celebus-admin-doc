'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type Lang = 'ko' | 'en' | 'jp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuspensionReasonModal({ isOpen, onClose }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [lang, setLang] = useState<Lang>('ko');
  const [messages, setMessages] = useState<Record<Lang, string>>({ ko: '', en: '', jp: '' });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // 초기화
      setDisplayName('');
      setLang('ko');
      setMessages({ ko: '', en: '', jp: '' });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const setMessage = (val: string) =>
    setMessages((prev) => ({ ...prev, [lang]: val.slice(0, 200) }));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[520px] mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">정지사유 추가</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            aria-label="닫기"
          >
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">운영자 노출명</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
              placeholder="운영자 노출명 입력"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">{displayName.length}/20자</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">유저 노출 메시지</label>
            <div className="flex items-center gap-4 mb-2">
              {[
                { k: 'ko', label: '한국어(기본값)' },
                { k: 'en', label: '영어' },
                { k: 'jp', label: '일본어' },
              ].map((opt) => (
                <label key={opt.k} className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="lang"
                    checked={lang === opt.k}
                    onChange={() => setLang(opt.k as Lang)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={messages[lang]}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="유저 노출 메시지 입력"
              rows={5}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">{messages[lang].length}/200자</p>
            {/* 언어별 입력 상태 배지 */}
            <div className="flex items-center gap-1.5 mt-2">
              {(['ko', 'en', 'jp'] as Lang[]).map((l) => (
                <span
                  key={l}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                    messages[l] ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {l === 'ko' ? 'KO' : l === 'en' ? 'EN' : 'JA'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소하기
          </button>
          <button
            onClick={() => {
              alert(`[Mock] 정지사유 추가\n노출명: ${displayName}\nKO: ${messages.ko}\nEN: ${messages.en}\nJP: ${messages.jp}`);
              onClose();
            }}
            disabled={!displayName.trim() || !messages.ko.trim()}
            className="h-10 px-5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300"
          >
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
