'use client';

import { useState } from 'react';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

export default function RegisterBiveModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'info' | 'feature'>('info');
  const [group, setGroup] = useState('');
  const [artist, setArtist] = useState('');
  const [descEN, setDescEN] = useState('');
  const [grade, setGrade] = useState('');
  const [gradeNum, setGradeNum] = useState('');

  if (!isOpen) return null;

  const canSubmit = group && artist && grade && gradeNum;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">BIVE 등록</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              취소
            </button>
            <button
              disabled={!canSubmit}
              onClick={() => {
                alert(`[Mock] BIVE 등록\n그룹: ${group} / 아티스트: ${artist} / 등급: ${grade} ${gradeNum}`);
                onClose();
              }}
              className="h-9 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              등록
            </button>
            <button onClick={onClose} className="ml-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <XMarkIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6">
          <div className="flex gap-0">
            {([['info', '기본정보'], ['feature', '기능설정']] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {tab === 'info' ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg text-sm">
                  기본정보 및 속성정보를 모두 입력해주세요
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">아티스트 그룹 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={group} onChange={(e) => setGroup(e.target.value)} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white">
                      <option value="">아티스트 그룹 선택</option>
                      <option>V01D</option>
                      <option>CELEBUS</option>
                    </select>
                    <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">아티스트 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={artist} onChange={(e) => setArtist(e.target.value)} disabled={!group} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50">
                      <option value="">아티스트 선택</option>
                      <option>송유찬</option>
                      <option>정지섭</option>
                      <option>케빈박</option>
                      <option>신노스케</option>
                      <option>조주연</option>
                    </select>
                    <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">설명(EN) <span className="text-gray-400 text-xs">(선택)</span></label>
                  <textarea
                    value={descEN}
                    onChange={(e) => setDescEN(e.target.value)}
                    rows={3}
                    placeholder="영문 설명을 입력하세요"
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
                  />
                </div>
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900">속성정보</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">등급 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white">
                        <option value="">등급 선택</option>
                        <option>Event</option>
                        <option>Ticket</option>
                        <option>Mix</option>
                        <option>Pick</option>
                      </select>
                      <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">등급번호 <span className="text-red-500">*</span></label>
                    <input
                      value={gradeNum}
                      onChange={(e) => setGradeNum(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="숫자 5자리 이내"
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">미디어 파일 <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-500">허용 확장자: PNG, JPG, GIF, WebP, MP4 (최대 20MB)</p>
                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-300">
                  <ArrowUpTrayIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm">파일 등록</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-sm text-gray-500">기능 설정 (운영 사이트와 동일하게 추후 연결)</div>
          )}
        </div>
      </div>
    </div>
  );
}
