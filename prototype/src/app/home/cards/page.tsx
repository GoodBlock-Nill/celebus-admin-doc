'use client';

import PageHeader from '@/components/layout/PageHeader';
import { homeCards, type HomeCardType } from '@/mock/home';

const CARD_TYPE_LABEL: Record<HomeCardType, { label: string; bg: string; text: string }> = {
  BANNER_TOP: { label: '상단 배너', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  NEW_NEWS: { label: '최신 소식', bg: 'bg-sky-100', text: 'text-sky-700' },
  FAN_QUEST: { label: '팬퀘스트', bg: 'bg-amber-100', text: 'text-amber-700' },
  BIVE_HIGHLIGHT: { label: 'BIVE 하이라이트', bg: 'bg-purple-100', text: 'text-purple-700' },
  SUPPORT_EVENT: { label: '응원하기', bg: 'bg-rose-100', text: 'text-rose-700' },
};

export default function HomeCardsPage() {
  return (
    <div>
      <PageHeader title="카드 관리" breadcrumbItems={[{ label: '홈 운영' }, { label: '카드 관리' }]} />

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-indigo-900 mb-1">홈 카드 노출 정책</h4>
        <p className="text-xs text-indigo-800 leading-relaxed">
          홈 화면에 노출되는 콘텐츠 블록 단위. 카드별로 활성/비활성 + 노출 순서 조정. 아티스트별 분리 노출(헤더 토글 연동) 또는 전역 노출 선택.
          상세 정책: <code className="px-1 bg-indigo-100 rounded">[CEB-BO-HOM-201]</code> 카드 정책 마스터.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {homeCards.map((c) => {
          const t = CARD_TYPE_LABEL[c.cardType];
          return (
            <div key={c.id} className={`bg-white border ${c.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60'} rounded-xl p-5 hover:shadow-sm transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">#{c.displayOrder}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${t.bg} ${t.text}`}>
                    {t.label}
                  </span>
                  {c.artistGroup ? (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700">
                      {c.artistGroup}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600">
                      전역
                    </span>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.enabled}
                    onChange={() => alert(`[Mock] 카드 토글 (HOM-201-TOGGLE) — ${c.titleKO}`)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <h5 className="text-base font-bold text-gray-900 mb-1.5">{c.titleKO}</h5>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{c.description}</p>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-500">
                  표시 콘텐츠 <span className="text-gray-900 font-semibold">{c.sourceCount}건</span>
                </div>
                <button
                  onClick={() => alert(`[Mock] 카드 상세 설정 (HOM-201-EDIT) — ${c.titleKO}`)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  설정 →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
