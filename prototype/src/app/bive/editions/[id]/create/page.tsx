'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import {
  artistGroups,
  getArtistsByGroup,
  BIVE_GRADES,
  getEditionById,
} from '@/mock/bive';

// [CEB-BO-BIVE-202-CREATE] BIVE 등록 (운영 BO 풀페이지 정합)
// 라우트: /bive/editions/{editionId}/create

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'feature', label: '기능설정' },
] as const;

export default function BiveCreatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const editionId = parseInt(id, 10);
  const edition = getEditionById(editionId);
  const router = useRouter();

  const [tab, setTab] = useState<'info' | 'feature'>('info');
  const [group, setGroup] = useState('');
  const [artist, setArtist] = useState('');
  const [descEN, setDescEN] = useState('');
  const [grade, setGrade] = useState('');
  const [gradeNum, setGradeNum] = useState('');
  // BIVE 미디어 — 앞면(필수) + 뒷면(선택) ([CEB-BO-BIVE-202-CREATE] §2-2 v1.3)
  const [mediaFront, setMediaFront] = useState('');
  const [mediaBack, setMediaBack] = useState('');
  const [toggles, setToggles] = useState({ send: true, mix: true, pick: true });

  if (!edition) {
    return <div className="p-8 text-sm text-gray-500">에디션을 찾을 수 없습니다.</div>;
  }

  const canSubmit = group && artist && grade && gradeNum && mediaFront; // 앞면만 필수
  const availableArtists = group ? getArtistsByGroup(group) : [];

  const handleFile = (setter: (name: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setter(f.name);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="BIVE 등록"
          breadcrumbItems={[
            { label: 'BIVE' },
            { label: '에디션 관리', href: '/bive/editions' },
            { label: '에디션 BIVE 관리', href: `/bive/editions/${editionId}` },
            { label: 'BIVE 등록' },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/bive/editions/${editionId}`)}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              alert(`[Mock] BIVE 등록\n그룹: ${group} / 아티스트: ${artist} / 등급: ${grade}-${gradeNum}\n앞면: ${mediaFront} / 뒷면: ${mediaBack || '(미등록)'}\n기능: 보내기=${toggles.send} Mix=${toggles.mix} Pick=${toggles.pick}`);
              router.push(`/bive/editions/${editionId}`);
            }}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            등록
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-6">
            기본정보 및 속성정보를 모두 입력해주세요
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">아티스트 그룹 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={group}
                    onChange={(e) => { setGroup(e.target.value); setArtist(''); }}
                    className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
                  >
                    <option value="">아티스트 그룹 선택</option>
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
                    className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50"
                  >
                    <option value="">아티스트 선택</option>
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
                  rows={5}
                  placeholder="영문 설명을 입력하세요"
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="border border-gray-200 rounded-xl p-5 space-y-5">
                <h3 className="text-sm font-semibold text-gray-900">속성정보</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">등급 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white">
                      <option value="">등급 선택</option>
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
                    className="w-full h-12 px-3 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">미디어 파일</h3>
              <p className="text-xs text-gray-500 mb-4">허용 확장자: PNG, JPG, GIF, WebP, MP4 (각 최대 20MB)</p>
              <div className="grid grid-cols-2 gap-3">
                {/* 앞면 (필수) */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm font-medium text-gray-900">앞면</span>
                    <span className="text-red-500">*</span>
                  </div>
                  <label className="block w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-300 bg-white">
                    {mediaFront ? (
                      <>
                        <span className="text-sm text-gray-700 font-medium text-center px-3 break-all">{mediaFront}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setMediaFront(''); }}
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
                    <input type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4" className="hidden" onChange={handleFile(setMediaFront)} />
                  </label>
                </div>
                {/* 뒷면 (선택) */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm font-medium text-gray-900">뒷면</span>
                    <span className="text-xs text-gray-400">(선택)</span>
                  </div>
                  <label className="block w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-300 bg-white">
                    {mediaBack ? (
                      <>
                        <span className="text-sm text-gray-700 font-medium text-center px-3 break-all">{mediaBack}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setMediaBack(''); }}
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
                    <input type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4" className="hidden" onChange={handleFile(setMediaBack)} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl space-y-5">
          <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm">
            기본정보 및 기능설정이 모두 입력·저장되어야 활성화할 수 있습니다.
          </div>
          {([
            { key: 'send', label: '보내기 (Send)', desc: '회원 간 BIVE 양도 허용 여부' },
            { key: 'mix', label: 'Mix', desc: 'BIVE 합성에 사용 가능 여부' },
            { key: 'pick', label: 'Pick', desc: 'BIVE 픽에 사용 가능 여부' },
          ] as const).map((row) => (
            <div key={row.key} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white">
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
  );
}
