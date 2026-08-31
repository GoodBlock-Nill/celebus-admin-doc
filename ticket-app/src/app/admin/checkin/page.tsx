'use client';

import { useCallback } from 'react';

import { useAdminResource } from '../_components/hooks';
import { Card, PageHeader } from '../_components/ui';
import { IssuanceSummary } from './_components/issuance-summary';
import { Scanner } from './_components/scanner';
import { adminApi } from '@/lib/admin-client';

export default function AdminCheckInPage() {
  const loadIssuance = useCallback(() => adminApi.issuance(), []);
  const { state, reload } = useAdminResource(loadIssuance);

  return (
    <>
      <PageHeader
        title="발권·체크인"
        description="현장 입장 확인을 처리합니다. 같은 코드가 두 번 스캔되면 부정 사용 의심 건으로 경고합니다."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <Scanner onCheckedIn={() => void reload()} />

        {state.status === 'READY' ? (
          <IssuanceSummary items={state.data.items} />
        ) : (
          <Card>
            <p className="text-[13px] text-[#6B7080]">
              {state.status === 'LOADING' ? '발급 현황을 불러오는 중입니다…' : state.reason}
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
