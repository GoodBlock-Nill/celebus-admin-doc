'use client';

import { useMemo, useState } from 'react';

import { ConfirmDialog } from '../../../_components/confirm-dialog';
import { DataTable } from '../../../_components/data-table';
import { useConfirm, useNow } from '../../../_components/hooks';
import { useToast } from '../../../_components/toast';
import { Card, InfoNote } from '../../../_components/ui';
import { buildWorklistColumns } from './columns';
import { WorklistDetail } from './detail';
import { WORKLIST_FILTERS, type WorklistFilter } from './kind';
import type { OrderActionKey } from './order-actions';
import { recommendationOf, targetDepositId } from './recommendation';
import { useWorklistActions } from './use-worklist-actions';
import { MS_PER_MINUTE } from '@/lib/constants';
import type { AdminDepositView, AdminOrderView, AdminWorklistItemView } from '@/lib/admin-types';

/** 필터 칩 */
function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        active
          ? 'border-[#3056D3] bg-[#EDF1FD] text-[#3056D3]'
          : 'border-[#C9CDD6] bg-white text-[#4A4E5A] hover:bg-[#F2F3F6]'
      }`}
    >
      {label} <span className="tabular-nums">{count}</span>
    </button>
  );
}

/**
 * 구획 1 — 할 일 (주문 단일 큐).
 * 처리해야 할 예매만 우선순위 순으로 모으고, 행을 펼치면 그 예매의 맥락과 처리 손잡이가 모두 나온다.
 */
export function WorklistSection({
  items,
  allDeposits,
  candidates,
  onRefresh,
}: {
  items: AdminWorklistItemView[];
  allDeposits: AdminDepositView[];
  candidates: AdminOrderView[];
  onRefresh: () => void;
}) {
  const now = useNow(MS_PER_MINUTE);
  const toast = useToast();
  const confirm = useConfirm();
  const actions = useWorklistActions(onRefresh);

  const [filter, setFilter] = useState<WorklistFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reconcileId, setReconcileId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      ALL: items.length,
      REPORTED: items.filter((item) => item.kind === 'REPORTED').length,
      AWAITING_CONFIRM: items.filter((item) => item.kind === 'AWAITING_CONFIRM').length,
      ON_HOLD: items.filter((item) => item.kind === 'ON_HOLD').length,
      ISSUE_PENDING: items.filter((item) => item.kind === 'ISSUE_PENDING').length,
    }),
    [items],
  );

  const rows = filter === 'ALL' ? items : items.filter((item) => item.kind === filter);

  const expand = (orderId: string) =>
    setExpandedId((current) => (current === orderId ? null : orderId));

  const openReconcile = (item: AdminWorklistItemView) => {
    setExpandedId(item.order.id);
    setReconcileId(item.order.id);
  };

  const confirmTargetDeposit = (item: AdminWorklistItemView) => {
    const depositId = targetDepositId(item);
    if (!depositId) {
      toast.error('이 예매에 이어진 입금이 없습니다. 은행 내역 대조나 수동 매칭으로 먼저 연결해 주세요.');
      return;
    }
    void actions.confirmDeposit(item, depositId);
  };

  const askRejectHold = (item: AdminWorklistItemView) =>
    confirm.ask({
      title: '보류를 반려할까요?',
      message: `주문 ${item.order.orderNo}을(를) 입금 대기로 되돌리고, 이어진 입금은 반환 대상으로 넘깁니다.`,
      confirmLabel: '보류 반려',
      confirmVariant: 'danger',
      onConfirm: () => void actions.rejectHold(item.order),
    });

  const askUndoConfirm = (item: AdminWorklistItemView) =>
    confirm.ask({
      title: '입금 확인을 취소할까요?',
      message: `주문 ${item.order.orderNo}을(를) 입금 대기로 되돌립니다. 이어진 입금은 확인 대기로 돌아가고, 입금 마감이 지났다면 오늘 자정까지 연장됩니다.`,
      confirmLabel: '입금 확인 취소',
      confirmVariant: 'danger',
      onConfirm: () => void actions.undoConfirm(item.order),
    });

  const runOrderAction = (item: AdminWorklistItemView, key: OrderActionKey) => {
    if (key === 'reconcile') return openReconcile(item);
    if (key === 'confirm') return confirmTargetDeposit(item);
    if (key === 'reject-report') return void actions.rejectReport(item.order);
    if (key === 'reject-hold') return askRejectHold(item);
    if (key === 'undo-confirm') return askUndoConfirm(item);
    return void actions.issueTickets(item.order);
  };

  const runRecommended = (item: AdminWorklistItemView) => {
    const key = recommendationOf(item).key;
    if (key === 'match') {
      setExpandedId(item.order.id);
      return;
    }
    runOrderAction(item, key);
  };

  return (
    <Card
      title="① 할 일"
      description="처리해야 할 예매만 모았습니다. 회원 요청 → 확인 대기 → 보류 → 지급 대기 순으로 정렬되며, 행을 펼치면 그 예매의 맥락과 처리를 한곳에서 볼 수 있습니다."
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {WORKLIST_FILTERS.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              count={counts[chip.key]}
              active={filter === chip.key}
              onClick={() => setFilter(chip.key)}
            />
          ))}
        </div>

        {items.length === 0 ? (
          <InfoNote tone="success">지금 처리할 예매가 없습니다.</InfoNote>
        ) : null}

        <DataTable
          columns={buildWorklistColumns(now, expandedId, expand, runRecommended)}
          rows={rows}
          rowKey={(item) => item.order.id}
          emptyText="이 조건에 해당하는 예매가 없습니다."
          minWidth="940px"
          renderSubRow={(item) =>
            expandedId === item.order.id ? (
              <WorklistDetail
                item={item}
                allDeposits={allDeposits}
                candidates={candidates}
                actions={actions}
                confirm={confirm}
                onRefresh={onRefresh}
                onRunOrderAction={(key) => runOrderAction(item, key)}
                reconcileOpen={reconcileId === item.order.id}
                onCloseReconcile={() => setReconcileId(null)}
              />
            ) : null
          }
        />

        <ConfirmDialog request={confirm.request} onClose={confirm.close} />
      </div>
    </Card>
  );
}
