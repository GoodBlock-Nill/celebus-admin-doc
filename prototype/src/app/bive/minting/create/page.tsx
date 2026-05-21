'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';

// [CEB-BO-BIVE-203-CREATE] 캠페인 생성 (운영 BO 풀페이지 정합)
// 라우트: /bive/minting/create?type=EVENT|TICKET|MIX|PICK

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'bive', label: 'BIVE 보상' },
] as const;

const LINKED_FEATURES = ['회원가입 보상', '출석체크 보상', '래플 보상', '팬퀘스트 보상'];

function CreateCampaignContent() {
  const router = useRouter();
  const search = useSearchParams();
  const type = (search.get('type') as 'EVENT' | 'TICKET' | 'MIX' | 'PICK') || 'EVENT';
  const typeLabel = type.charAt(0) + type.slice(1).toLowerCase();

  const [tab, setTab] = useState<'info' | 'bive'>('info');
  const [name, setName] = useState('');
  const [linked, setLinked] = useState('');

  const canSubmit = !!name.trim() && !!linked;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={`${typeLabel} 캠페인 생성`}
          breadcrumbItems={[
            { label: 'BIVE' },
            { label: '민팅 관리', href: '/bive/minting' },
            { label: '캠페인 생성' },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/bive/minting')}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소하기
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              alert(`[Mock] 캠페인 생성\n${name} (${linked})`);
              router.push('/bive/minting');
            }}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            생성하기
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
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm">
              캠페인 식별을 위한 캠페인 명을 입력하고, 연결기능을 선택해 주세요.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">캠페인 명</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="캠페인 명을 입력하세요"
                className="w-full h-12 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">연결 기능</label>
              <div className="relative">
                <select
                  value={linked}
                  onChange={(e) => setLinked(e.target.value)}
                  className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
                >
                  <option value="">연결 기능을 선택해주세요</option>
                  {LINKED_FEATURES.map((f) => <option key={f}>{f}</option>)}
                </select>
                <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
            보상으로 지급되는 BIVE를 추가하고 각 항목에 가중치를 입력하세요.
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">캠페인 생성 후 BIVE 보상을 추가할 수 있습니다.</div>
            <button
              disabled
              className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" />추가하기
            </button>
          </div>
          <SimpleTable
            columns={[
              { key: 'name', label: 'BIVE 명칭' },
              { key: 'group', label: '아티스트 그룹', width: '130px' },
              { key: 'artist', label: '아티스트', width: '100px' },
              { key: 'grade', label: '등급', width: '80px' },
              { key: 'gradeNumber', label: '등급번호', width: '90px' },
              { key: 'weight', label: '가중치', width: '110px' },
              { key: 'pct', label: '가중치 비중', width: '110px' },
              { key: 'manage', label: '관리', width: '60px' },
            ]}
            rows={[]}
            emptyMessage="캠페인 생성 후 BIVE 보상을 추가할 수 있습니다."
          />
        </div>
      )}
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={null}>
      <CreateCampaignContent />
    </Suspense>
  );
}
