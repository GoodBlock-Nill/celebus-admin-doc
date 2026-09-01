'use client';

import { useState } from 'react';

import { ConfirmDialog } from '../../_components/confirm-dialog';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button, Select, TextInput } from '../../_components/form';
import { useConfirm } from '../../_components/hooks';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import { HeldRowActions } from './held-row-actions';
import {
  amountColumn,
  depositedAtColumn,
  depositorColumn,
  holdSubmissionColumn,
  memoColumn,
  orderColumn,
  statusColumn,
} from './deposit-columns';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView, AdminOrderView } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

const DEFAULT_REFUND_MEMO = '입금 마감 이후 입금 — 반환 대상';

type ActionKind = 'match' | 'refund';

interface ActiveAction {
  depositId: string;
  kind: ActionKind;
}

function candidateLabel(order: AdminOrderView): string {
  return `${order.orderNo} · ${order.party.realName} · ${order.qty}매 · ${formatKrw(order.amountKrw)}`;
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

  const [active, setActive] = useState<ActiveAction | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [memo, setMemo] = useState(DEFAULT_REFUND_MEMO);

  const openAction = (depositId: string, kind: ActionKind) => {
    setActive((current) =>
      current && current.depositId === depositId && current.kind === kind ? null : { depositId, kind },
    );
    if (kind === 'match') setSelectedOrderId(candidates[0]?.id ?? '');
    if (kind === 'refund') setMemo(DEFAULT_REFUND_MEMO);
  };

  const handleConfirm = async (row: AdminDepositView) => {
    const result = await adminApi.confirmDeposit(row.id);
    toast.fromResult(result, `주문 ${row.order?.orderNo ?? ''} 입금 확인 — 티켓 지급 대기로 전환되었습니다.`);
    if (result.ok) onDone();
  };

  const handleMatch = async (row: AdminDepositView) => {
    const result = await adminApi.manualMatch(row.id, selectedOrderId);
    toast.fromResult(result, `${row.depositorName} 입금을 선택한 주문에 연결했습니다.`);
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
    holdSubmissionColumn,
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '230px',
      render: (row) => (
        <HeldRowActions
          row={row}
          onConfirm={() => void handleConfirm(row)}
          onMatch={() => openAction(row.id, 'match')}
          onRefundTarget={() => openAction(row.id, 'refund')}
          onRejectHold={() => askRejectHold(row)}
        />
      ),
    },
  ];

  const renderSubRow = (row: AdminDepositView) => {
    if (!active || active.depositId !== row.id) return null;

    if (active.kind === 'match') {
      return (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[#4A4E5A]">연결할 주문 선택</span>
            <Select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)}>
              {candidates.length === 0 ? <option value="">연결 가능한 주문이 없습니다</option> : null}
              {candidates.map((order) => (
                <option key={order.id} value={order.id}>
                  {candidateLabel(order)}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="primary" disabled={!selectedOrderId} onClick={() => void handleMatch(row)}>
            주문에 연결
          </Button>
          <Button onClick={() => setActive(null)}>닫기</Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#4A4E5A]">반환 사유</span>
          <TextInput value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={100} />
        </div>
        <Button variant="danger" onClick={() => void handleRefundTarget(row)}>
          반환 대상으로 지정
        </Button>
        <Button onClick={() => setActive(null)}>닫기</Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <InfoNote tone="warning">
        금액만 맞고 입금자명이 다른 건은 자동으로 보류됩니다. 동명이인·대리 입금은 주문을 확인한 뒤 수동 매칭하고,
        예매와 무관한 입금은 반환 대상으로 지정하세요. 회원이 실제 입금자명·환불 계좌를 알려온 건은
        &lsquo;회원이 알린 정보&rsquo;에 표시되며, 그 이름으로 은행 내역을 대조하면 됩니다. 끝내 대조되지 않으면
        보류 반려로 예매를 입금 대기에 되돌리세요. 받은 입금은 반환 대상으로 넘어가고, 회원에게는 환불 후 재송금
        안내가 표시됩니다.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="보류 중인 입금이 없습니다."
        minWidth="1320px"
        renderSubRow={renderSubRow}
      />
      <ConfirmDialog request={confirm.request} onClose={confirm.close} />
    </div>
  );
}
