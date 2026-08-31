'use client';

import { useHydrated } from '@/lib/use-hydrated';
import { Card, PageHeader } from '../_components/ui';
import { IssuanceSummary } from './_components/issuance-summary';
import { Scanner } from './_components/scanner';

export default function CheckInPage() {
  const hydrated = useHydrated();

  return (
    <>
      <PageHeader
        title="발권·체크인"
        description="현장 입장 확인을 모의합니다. 같은 코드가 두 번 스캔되면 부정 사용 의심 건으로 경고합니다."
      />

      {!hydrated ? (
        <Card>
          <p className="text-[13px] text-[#6B7080]">티켓 정보를 불러오는 중입니다…</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
          <Scanner />
          <IssuanceSummary />
        </div>
      )}
    </>
  );
}
