'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import SeasonTab from './_components/SeasonTab';
import RankingTab from './_components/RankingTab';
import HistoryTab from './_components/HistoryTab';

// [CEB-BO-ART-401] 덕력 관리 (3탭) v1.0
// 라우트: /artists/duk?tab={season|ranking|history}

type Tab = 'season' | 'ranking' | 'history';

const TABS: { key: Tab; label: string }[] = [
  { key: 'season', label: '랭킹 시즌 설정' },
  { key: 'ranking', label: '덕력랭킹' },
  { key: 'history', label: '덕력내역' },
];

function DukContent() {
  const router = useRouter();
  const search = useSearchParams();
  const tabParam = (search.get('tab') as Tab) || 'season';
  const [tab, setTab] = useState<Tab>(tabParam);

  const handleTab = (next: Tab) => {
    setTab(next);
    router.replace(`/artists/duk?tab=${next}`);
  };

  return (
    <div>
      <PageHeader
        title="덕력관리"
        breadcrumbItems={[{ label: '아티스트' }, { label: '덕력관리' }]}
      />

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'season' && <SeasonTab />}
      {tab === 'ranking' && <RankingTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  );
}

export default function DukPage() {
  return (
    <Suspense fallback={null}>
      <DukContent />
    </Suspense>
  );
}
