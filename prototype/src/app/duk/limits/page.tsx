'use client';

import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import { limits } from '@/mock/duk';

export default function DukLimitsPage() {
  const globalLimit = limits.find((l) => l.scope === '글로벌');
  const artistLimits = limits.filter((l) => l.scope === '아티스트별');

  return (
    <div>
      <PageHeader title="한도 정책" breadcrumbItems={[{ label: '덕력' }, { label: '한도 정책' }]} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label="활성 정책" count={limits.length} variant="default" />
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">글로벌 일일 한도</div>
          <div className="text-2xl font-bold text-gray-900">{globalLimit?.dailyLimit ?? 0}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">글로벌 주간 한도</div>
          <div className="text-2xl font-bold text-gray-900">{globalLimit?.weeklyLimit.toLocaleString() ?? 0}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">글로벌 월간 한도</div>
          <div className="text-2xl font-bold text-indigo-700">{globalLimit?.monthlyLimit.toLocaleString() ?? 0}</div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-indigo-900 mb-1">덕력 한도 정책 (일·주·월간)</h4>
        <p className="text-xs text-indigo-800 leading-relaxed">
          어뷰징 방지를 위한 일·주·월 단위 덕력 적립 상한선. <strong>글로벌 정책 + 아티스트별 정책</strong>이 모두 적용됩니다.
          개별 회원의 일·주·월 누적 덕력이 한도에 도달하면 추가 적립 차단. ERD <code className="px-1 bg-indigo-100 rounded">fan_power_limit</code>.
        </p>
      </div>

      {/* 글로벌 정책 카드 */}
      {globalLimit && (
        <div className="bg-white border-2 border-indigo-100 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-600 text-white">글로벌 (전체 적용)</span>
              <h4 className="text-sm font-semibold text-gray-900">기본 한도 정책</h4>
            </div>
            <button
              onClick={() => alert('[Mock] 글로벌 한도 편집 (DUK-501-EDIT)')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              편집 →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <LimitCell label="일일 한도" value={globalLimit.dailyLimit} accent="emerald" />
            <LimitCell label="주간 한도" value={globalLimit.weeklyLimit} accent="amber" />
            <LimitCell label="월간 한도" value={globalLimit.monthlyLimit} accent="indigo" />
          </div>
          <div className="border-t border-gray-100 pt-3 mt-4 text-xs text-gray-500">
            최근 수정: {globalLimit.updatedBy} · {globalLimit.updatedAt}
          </div>
        </div>
      )}

      {/* 아티스트별 정책 */}
      <h4 className="text-sm font-semibold text-gray-900 mb-3">아티스트별 정책 ({artistLimits.length}건)</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {artistLimits.map((l) => (
          <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700">
                {l.artistGroup}
              </span>
              <button
                onClick={() => alert(`[Mock] ${l.artistGroup} 한도 편집 (DUK-501-EDIT)`)}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
              >
                편집 →
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">일일</span>
                <span className="text-gray-900 font-bold">{l.dailyLimit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">주간</span>
                <span className="text-gray-900 font-bold">{l.weeklyLimit.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">월간</span>
                <span className="text-indigo-700 font-bold">{l.monthlyLimit.toLocaleString()}</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-3 text-[11px] text-gray-500">
              {l.updatedBy} · {l.updatedAt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LimitCell({ label, value, accent }: { label: string; value: number; accent: 'emerald' | 'amber' | 'indigo' }) {
  const bg = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  }[accent];
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <div className="text-[11px] mb-1 opacity-80">{label}</div>
      <div className="text-xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
