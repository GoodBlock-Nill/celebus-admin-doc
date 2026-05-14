'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';

export default function ExchangePage() {
  return (
    <div>
      <PageHeader title="GP 교환소" breadcrumbItems={[{ label: '게임존' }, { label: 'GP 교환소' }]} />

      {/* 운영 사이트 알려진 크래시 — 클론에서는 안내 표시 */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700 mb-1">Something went wrong!</p>
          <p className="text-xs text-red-600 mb-3">
            운영 사이트의 GP 교환소 페이지는 현재 알려진 크래시 이슈로 정상 동작하지 않습니다 (
            <span className="font-mono bg-red-100 px-1 rounded">TypeError: Cannot read properties of null (reading 'toLowerCase')</span>
            ).
          </p>
          <p className="text-xs text-red-500">
            클론에서도 운영 동작 그대로 재현했습니다. 정정 명세는 향후 Phase에서 진행 예정입니다.
          </p>
          <button className="mt-3 px-3 py-1.5 text-xs font-medium border border-red-300 rounded text-red-700 bg-white hover:bg-red-50">
            Show Error
          </button>
        </div>
      </div>
    </div>
  );
}
