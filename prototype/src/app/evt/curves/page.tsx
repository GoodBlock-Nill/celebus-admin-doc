'use client';

import PageHeader from '@/components/layout/PageHeader';
import { curves, type CurveFunction } from '@/mock/evt';

const FUNC_BADGE: Record<CurveFunction, { bg: string; text: string; label: string }> = {
  LINEAR: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Linear' },
  POWER: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Power' },
  CUSTOM: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Custom' },
};

export default function EvtCurvesPage() {
  return (
    <div>
      <PageHeader title="곡선 설정" breadcrumbItems={[{ label: '팬덤 레벨' }, { label: '곡선 설정' }]} />

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-indigo-900 mb-1">아티스트별 팬덤 곡선 정책 <span className="ml-2 text-xs text-indigo-700">🔴 Critical</span></h4>
        <p className="text-xs text-indigo-800 leading-relaxed">
          팬덤 레벨 곡선은 <strong>아티스트별</strong>로 운영됩니다 ([CEB-BO-100] §3, [CEB-BO-EVT-101] v1.3).
          시즌 주기는 <strong>모든 아티스트 동일 (매년 1.1 ~ 12.31, K-pop 팬클럽 N기 흐름)</strong>이지만 곡선 함수·최대 레벨은 아티스트별로 다릅니다.
          신규 아티스트 추가 시 템플릿 곡선이 자동 복제됩니다(옵트아웃 가능).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {curves.map((c) => {
          const f = FUNC_BADGE[c.func];
          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700">
                  {c.artistGroup}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${f.bg} ${f.text}`}>
                  {f.label}
                </span>
              </div>

              <h5 className="text-lg font-bold text-gray-900 mb-1">최대 Lv. {c.maxLevel}</h5>
              <div className="text-[11px] text-gray-500 font-mono bg-gray-50 rounded p-2 mb-3 leading-relaxed">
                {c.formula}
              </div>

              {/* 곡선 시각화 — 간단한 막대 */}
              <div className="flex items-end gap-0.5 h-16 mb-3">
                {Array.from({ length: 15 }, (_, i) => {
                  const lv = i + 1;
                  let h: number;
                  if (c.func === 'LINEAR') h = (lv / 15) * 100;
                  else if (c.func === 'POWER') h = Math.sqrt(lv / 15) * 100;
                  else h = (lv / 15) ** 0.7 * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-indigo-400 to-indigo-200 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-3">
                <span>Lv. 1</span>
                <span>Lv. 15</span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                <div>
                  <div className="text-gray-500">최근 수정</div>
                  <div className="text-gray-900 font-medium mt-0.5">{c.updatedBy} · {c.updatedAt}</div>
                </div>
                <button
                  onClick={() => alert(`[Mock] 곡선 편집 (EVT-101-EDIT) — ${c.artistGroup}`)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  편집 →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
