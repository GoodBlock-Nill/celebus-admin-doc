'use client';

import { useState } from 'react';

import { ConfirmDialog } from '../../_components/confirm-dialog';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { useConfirm } from '../../_components/hooks';
import { useToast } from '../../_components/toast';
import { HeldTabGuide } from './held-tab-guide';
import {
  amountColumn,
  depositedAtColumn,
  depositorColumn,
  holdSubmissionColumn,
  matchHintColumn,
  memoColumn,
  orderColumn,
  statusColumn,
} from './deposit-columns';
import { DepositVoidForm } from './deposit-void-form';
import { HeldMatchForm, HeldRefundForm } from './held-match-form';
import { HeldRowActions } from './held-row-actions';
import { useVoidDeposit } from './use-void-deposit';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView, AdminOrderView } from '@/lib/admin-types';

const DEFAULT_REFUND_MEMO = '입금 마감 이후 입금 — 반환 대상';

type ActionKind = 'match' | 'refund' | 'void';

interface ActiveAction {
  depositId: string;
  kind: ActionKind;
}

/** ④ 보류 — 이름·금액이 어긋나 운영자 판단이 필요한 입금 */
export function HeldTab({
  rows,
  candidates,
  onDone,
}: {
  rows: AdminDepositView[];
  candidates: AdminOrderView[];
  onDone: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const voidDeposit = useVoidDeposit(confirm, onDone);

  const [active, setActive] = useState<ActiveAction | null>(null);
  const [memo, setMemo] = useState(DEFAULT_REFUND_MEMO);

  const openAction = (depositId: string, kind: ActionKind) => {
    setActive((current) =>
      current && current.depositId === depositId && current.kind === kind ? null : { depositId, kind },
    );
    if (kind === 'refund') setMemo(DEFAULT_REFUND_MEMO);
    if (kind === 'void') voidDeposit.resetReason();
  };

  const handleConfirm = async (row: AdminDepositView) => {
    const result = await adminApi.confirmDeposit(row.id);
    toast.fromResult(result, `주문 ${row.order?.orderNo ?? ''} 입금 확인 — 티켓 지급 대기로 전환되었습니다.`);
    if (result.ok) onDone();
  };

  const handleMatch = async (row: AdminDepositView, depositIds: string[], orderId: string) => {
    const result = await adminApi.manualMatch(depositIds, orderId);
    toast.fromResult(
      result,
      depositIds.length > 1
        ? `${row.depositorName} 분할 입금 ${depositIds.length}건을 선택한 주문에 연결했습니다.`
        : `${row.depositorName} 입금을 선택한 주문에 연결했습니다.`,
    );
    if (result.ok) {
      setActive(null);
      onDone();
    }
  };

  const handleRefundTarget = async (row: AdminDepositView) => {
    const result = await adminApi.markRefundTarget(row.id, memo.trim() || DEFAULT_REFUND_MEMO);
    toast.fromResult(result, `${row.depositorName} 입금을 반환 대상으로 지정했습니다.`);
    if (result.ok) {
      setActive(null);
      onDone();
    }
  };

  /** 보류 반려 — 예매를 입금 대기로 되돌리고 이 입금은 반환 대상으로 넘긴다 */
  const handleRejectHold = async (row: AdminDepositView) => {
    const order = row.order;
    if (!order) return;

    const result = await adminApi.rejectHold(order.id);
    toast.fromResult(
      result,
      `주문 ${order.orderNo} 보류 반려 — 입금 대기로 되돌리고 입금은 반환 대상으로 넘겼습니다.`,
    );
    if (result.ok) {
      setActive(null);
      onDone();
    }
  };

  const askRejectHold = (row: AdminDepositView) =>
    confirm.ask({
      title: '보류를 반려할까요?',
      message:
        '이 입금을 예매와 대조하지 않고 반환 대상으로 지정합니다. 주문은 입금 대기로 되돌아갑니다.',
      confirmLabel: '보류 반려',
      confirmVariant: 'danger',
      onConfirm: () => void handleRejectHold(row),
    });

  const columns: Array<Column<AdminDepositView>> = [
    depositorColumn,
    amountColumn,
    depositedAtColumn,
    statusColumn,
    memoColumn,
    orderColumn,
    matchHintColumn,
    holdSubmissionColumn,
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '300px',
      render: (row) => (
        <HeldRowActions
          row={row}
          onConfirm={() => void handleConfirm(row)}
          onMatch={() => openAction(row.id, 'match')}
          onRefundTarget={() => openAction(row.id, 'refund')}
          onRejectHold={() => askRejectHold(row)}
          onVoid={() => openAction(row.id, 'void')}
        />
      ),
    },
  ];

  const renderSubRow = (row: AdminDepositView) => {
    if (!active || active.depositId !== row.id) return null;

    if (active.kind === 'void') {
      return (
        <DepositVoidForm
          reason={voidDeposit.reason}
          onChange={voidDeposit.setReason}
          onSubmit={() => voidDeposit.ask(row)}
          onClose={() => setActive(null)}
        />
      );
    }

    if (active.kind === 'match') {
      // 분할 입금 후보로 함께 묶인 다른 입금은 이 화면에서 바로 골라 한 번에 연결한다.
      const siblingIds = row.splitHint?.depositIds.filter((id) => id !== row.id) ?? [];
      return (
        <HeldMatchForm
          key={row.id}
          row={row}
          candidates={candidates}
          siblings={rows.filter((deposit) => siblingIds.includes(deposit.id))}
          onSubmit={(depositIds, orderId) => void handleMatch(row, depositIds, orderId)}
          onClose={() => setActive(null)}
        />
      );
    }

    return (
      <HeldRefundForm
        memo={memo}
        onChange={setMemo}
        onSubmit={() => void handleRefundTarget(row)}
        onClose={() => setActive(null)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <HeldTabGuide />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="보류 중인 입금이 없습니다."
        minWidth="1640px"
        renderSubRow={renderSubRow}
      />
      <ConfirmDialog request={confirm.request} onClose={confirm.close} />
    </div>
  );
}
