'use client';

import { useState } from 'react';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { artistGroups, getArtistsByGroup, BIVE_GRADES } from '@/mock/bive';

// [CEB-BO-BIVE-202-CREATE] BIVE 등록 모달
// 운영 BO 정합: 아티스트 그룹 5종 + 그룹별 멤버 동적 + 등급 6종 + 미디어 5종 확장자

export default function RegisterBiveModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'info' | 'feature'>('info');
  const [group, setGroup] = useState('');
  const [artist, setArtist] = useState('');
  const [descEN, setDescEN] = useState('');
  const [grade, setGrade] = useState('');
  const [gradeNum, setGradeNum] = useState('');
  const [media, setMedia] = useState<string>('');
  const [toggles, setToggles] = useState({ send: true, mix: true, pick: true });

  if (!isOpen) return null;

  const canSubmit = group && artist && grade && gradeNum && media;
  const availableArtists = group ? getArtistsByGroup(group) : [];

  const reset = () => {
    setTab('info'); setGroup(''); setArtist(''); setDescEN(''); setGrade(''); setGradeNum('');
    setMedia(''); setToggles({ send: true, mix: true, pick: true });
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setMedia(f.name);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">BIVE 등록</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleClose} className="h-9 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              취소
            </button>
            <button
              disabled={!canSubmit}
              onClick={() => {
                alert(`[Mock] BIVE 등록\n그룹: ${group} / 아티스트: ${artist} / 등급: ${grade}-${gradeNum} / 미디어: ${media}\n기능: 보내기=${toggles.send} Mix=${toggles.mix} Pick=${toggles.pick}`);
                handleClose();
              }}
              className="h-9 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              등록
            </button>
            <button onClick={handleClose} className="ml-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
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
                    <select
                      value={group}
                      onChange={(e) => { setGroup(e.target.value); setArtist(''); }}
                      className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
                    >
                      <option value="">아티스트 그룹을 선택해주세요</option>
                      {artistGroups.map((g) => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                    <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">아티스트 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      disabled={!group}
                      className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50"
                    >
                      <option value="">아티스트를 선택해주세요</option>
                      {availableArtists.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
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
                        <option value="">등급을 선택해주세요</option>
                        {BIVE_GRADES.map((g) => <option key={g}>{g}</option>)}
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
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-300">
                  {media ? (
                    <>
                      <span className="text-sm text-gray-700 font-medium">{media}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setMedia(''); }}
                        className="mt-3 text-xs text-red-500 hover:underline"
                      >
                        파일 제거
                      </button>
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="w-8 h-8 mb-2" />
                      <span className="text-sm">파일 등록</span>
                    </>
                  )}
                  <input type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4" className="hidden" onChange={handleFile} />
                </label>
              </div>
            </div>
          ) : (
            <div className="max-w-xl space-y-5">
              <div className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg text-sm">
                기본정보 및 기능설정이 모두 입력·저장되어야 활성화할 수 있습니다.
              </div>
              {([
                { key: 'send', label: '보내기 (Send)', desc: '회원 간 BIVE 양도 허용 여부' },
                { key: 'mix', label: 'Mix', desc: 'BIVE 합성에 사용 가능 여부' },
                { key: 'pick', label: 'Pick', desc: 'BIVE 픽에 사용 가능 여부' },
              ] as const).map((row) => (
                <div key={row.key} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{row.label}</div>
                    <div className="text-xs text-gray-500">{row.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToggles((p) => ({ ...p, [row.key]: !p[row.key] }))}
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${toggles[row.key] ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white transform transition-transform mt-0.5 ${toggles[row.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
