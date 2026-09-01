'use client';

import { Badge, Card, EmptyState } from './ui';
import type { PoolIntegrityItemView, PoolIntegrityView } from '@/lib/admin-types';
import { formatDateTime } from '@/lib/format';

/** 어긋난 값 한 줄 — 현재 값과 기대값을 나란히 보여 준다 */
function MismatchRow({ item }: { item: PoolIntegrityItemView }) {
  const seatGap = item.reserved !== item.expectedReserved;
  const issuedGap = item.issued !== item.expectedIssued;

  return (
    <li className="flex flex-col gap-1 border-b border-[#F0F1F4] py-2.5 last:border-b-0">
      <span className="text-[13px] font-semibold text-[#1B1D22]">
        {item.concertTitle} · {item.sessionName}
        <span className="ml-1.5 text-[12px] font-normal text-[#6B7080]">{item.poolLabel}</span>
      </span>
      <span className="flex flex-wrap gap-3 text-[12px] tabular-nums text-[#4A4E5A]">
        <span className={seatGap ? 'font-semibold text-[#C2402A]' : undefined}>
          선점 {item.reserved} (기대 {item.expectedReserved})
        </span>
        <span className={issuedGap ? 'font-semibold text-[#C2402A]' : undefined}>
          발급 {item.issued} (기대 {item.expectedIssued})
        </span>
      </span>
    </li>
  );
}

/**
 * 재고 정합 점검 (재설계서 F-3).
 * 선점·발급 수치를 예매·티켓 실측으로 다시 계산해 어긋난 회차를 드러낸다.
 * 값을 고치지는 않으므로, 불일치가 보이면 해당 회차의 처리 이력을 먼저 확인해야 한다.
 */
export function IntegrityCard({ integrity }: { integrity: PoolIntegrityView | null }) {
  if (!integrity) {
    return (
      <Card title="재고 정합">
        <p className="text-[13px] text-[#6B7080]">재고 정합 점검 결과를 불러오지 못했습니다.</p>
      </Card>
    );
  }

  const isHealthy = integrity.mismatchCount === 0;

  return (
    <Card
      title="재고 정합"
      description={`회차·분류 ${integrity.checkedCount}건의 선점·발급 수치를 예매·티켓 실측과 대조했습니다. (점검 ${formatDateTime(integrity.checkedAt)})`}
      actions={
        <Badge tone={isHealthy ? 'success' : 'danger'}>
          {isHealthy ? '정상' : `불일치 ${integrity.mismatchCount}건`}
        </Badge>
      }
    >
      {isHealthy ? (
        <EmptyState text="어긋난 재고가 없습니다." />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] leading-relaxed text-[#C2402A]">
            아래 회차의 좌석 수치가 실제 예매·티켓과 다릅니다. 해당 회차의 지급·취소 이력을 확인해 원인을 찾은 뒤
            바로잡아 주세요. (이 점검은 값을 고치지 않습니다)
          </p>
          <ul className="flex flex-col">
            {integrity.items.map((item) => (
              <MismatchRow key={`${item.sessionId}-${item.poolType}`} item={item} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
