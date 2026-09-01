'use client';

import { Button } from '../../../_components/form';
import { Badge } from '../../../_components/ui';
import { recommendationOf } from './recommendation';
import type { AdminWorklistItemView } from '@/lib/admin-types';

/** 예매 단위 처리 구분 */
export type OrderActionKey =
  | 'reconcile'
  | 'confirm'
  | 'reject-report'
  | 'reject-hold'
  | 'issue'
  | 'undo-confirm';

interface ActionItem {
  key: OrderActionKey;
  label: string;
  danger?: boolean;
}

/** 유형별로 열어 두는 예매 단위 처리 (권장 처리는 앞에서 따로 강조한다) */
function supportActionsOf(item: AdminWorklistItemView): ActionItem[] {
  if (item.kind === 'REPORTED') {
    return [{ key: 'reject-report', label: '미입금 반려', danger: true }];
  }
  if (item.kind === 'ON_HOLD') {
    return [
      { key: 'confirm', label: '입금 확인 (인정)' },
      { key: 'reject-hold', label: '보류 반려', danger: true },
      { key: 'reconcile', label: '은행 내역 대조' },
    ];
  }
  if (item.kind === 'ISSUE_PENDING') {
    return [{ key: 'undo-confirm', label: '입금 확인 취소', danger: true }];
  }
  return [{ key: 'reconcile', label: '은행 내역 대조' }];
}

/**
 * 예매 단위 처리 줄 — 권장 처리 1개를 강조하고 나머지는 보조로 둔다.
 * 확인 보류처럼 권장이 갈리는 상황에서는 권장 이유를 함께 보여 준다.
 */
export function OrderActionBar({
  item,
  onRun,
}: {
  item: AdminWorklistItemView;
  onRun: (key: OrderActionKey) => void;
}) {
  const recommended = recommendationOf(item);
  const isOrderLevel = recommended.key !== 'match';
  const supports = supportActionsOf(item).filter((action) => action.key !== recommended.key);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {isOrderLevel ? (
          <>
            <Badge tone="accent">권장</Badge>
            <Button variant="primary" onClick={() => onRun(recommended.key as OrderActionKey)}>
              {recommended.label}
            </Button>
          </>
        ) : (
          <Badge tone="warning">권장 — 아래 연결 입금에서 수동 매칭</Badge>
        )}
        {supports.map((action) => (
          <Button
            key={action.key}
            size="sm"
            variant={action.danger ? 'danger' : 'secondary'}
            onClick={() => onRun(action.key)}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <p className="text-[12px] leading-relaxed text-[#4A4E5A]">{recommended.reason}</p>
    </div>
  );
}
