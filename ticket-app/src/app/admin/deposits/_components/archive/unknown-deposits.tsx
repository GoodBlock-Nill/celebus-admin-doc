'use client';

import { useState } from 'react';

import { ConfirmDialog } from '../../../_components/confirm-dialog';
import { DataTable } from '../../../_components/data-table';
import { useConfirm } from '../../../_components/hooks';
import { useToast } from '../../../_components/toast';
import { Card, InfoNote } from '../../../_components/ui';
import { DepositMemoForm } from '../deposit-memo-form';
import { DepositVoidForm } from '../deposit-void-form';
import { DepositMatchForm } from '../match-form';
import { ManualDepositForm } from '../manual-deposit-form';
import { useVoidDeposit } from '../use-void-deposit';
import {
  buildRefundTargetColumns,
  buildUnknownColumns,
  type UnknownFormKind,
} from './unknown-deposit-columns';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView, AdminOrderView } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

const DEFAULT_REFUND_MEMO = '예매와 연결되지 않은 입금 — 반환 대상';

interface ActiveForm {
  depositId: string;
  kind: UnknownFormKind;
}

/**
 * 주문 미상·반환 입금 — 어느 예매의 돈인지 알 수 없는 입금과 돌려줘야 할 입금만 모은다.
 * 예매가 정해진 입금은 위 할 일 큐에서 처리하므로 여기에는 나오지 않는다.
 */
export function UnknownDepositsSection({
  deposits,
  candidates,
  onRefresh,
}: {
  deposits: AdminDepositView[];
  candidates: AdminOrderView[];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const voidDeposit = useVoidDeposit(confirm, onRefresh);

  const [active, setActive] = useState<ActiveForm | null>(null);
  const [memo, setMemo] = useState(DEFAULT_REFUND_MEMO);

  const unknown = deposits.filter(
    (deposit) => !deposit.order && (deposit.status === 'UNMATCHED' || deposit.status === 'HELD'),
  );
  const refundTargets = deposits.filter((deposit) => deposit.status === 'REFUND_TARGET');

  const open = (depositId: string, kind: UnknownFormKind) => {
    setActive((current) =>
      current && current.depositId === depositId && current.kind === kind ? null : { depositId, kind },
    );
    if (kind === 'void') voidDeposit.resetReason();
    if (kind === 'refund') setMemo(DEFAULT_REFUND_MEMO);
  };

  const handleMatch = async (depositIds: string[], orderId: string) => {
    const result = await adminApi.manualMatch(depositIds, orderId);
    toast.fromResult(
      result,
      depositIds.length > 1
        ? `분할 입금 ${depositIds.length}건을 선택한 주문에 연결했습니다.`
        : '입금을 선택한 주문에 연결했습니다.',
    );
    if (result.ok) {
      setActive(null);
      onRefresh();
    }
  };

  const handleRefundTarget = async (row: AdminDepositView) => {
    const result = await adminApi.markRefundTarget(row.id, memo.trim() || DEFAULT_REFUND_MEMO);
    toast.fromResult(result, `${row.depositorName} 입금을 반환 대상으로 지정했습니다.`);
    if (result.ok) {
      setActive(null);
      onRefresh();
    }
  };

  const handleRefund = async (row: AdminDepositView) => {
    const result = await adminApi.refundDeposit(row.id);
    toast.fromResult(result, `${row.depositorName} · ${formatKrw(row.amountKrw)} 반환 처리했습니다.`);
    if (result.ok) onRefresh();
  };

  const askRefund = (row: AdminDepositView) =>
    confirm.ask({
      title: '환불 완료로 처리할까요?',
      message: `${row.depositorName} 님에게 ${formatKrw(row.amountKrw)}을 반환한 것으로 기록합니다. 되돌릴 수 없습니다.`,
      confirmLabel: '환불 완료 처리',
      confirmVariant: 'danger',
      onConfirm: () => void handleRefund(row),
    });

  const renderForm = (row: AdminDepositView) => {
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
      const siblingIds = row.splitHint?.depositIds.filter((id) => id !== row.id) ?? [];
      return (
        <DepositMatchForm
          row={row}
          candidates={candidates}
          siblings={deposits.filter((deposit) => siblingIds.includes(deposit.id))}
          onSubmit={(depositIds, orderId) => void handleMatch(depositIds, orderId)}
          onClose={() => setActive(null)}
        />
      );
    }

    return (
      <DepositMemoForm
        kind="refund"
        memo={memo}
        onChange={setMemo}
        onSubmit={() => void handleRefundTarget(row)}
        onClose={() => setActive(null)}
      />
    );
  };

  return (
    <Card
      title="주문 미상 입금"
      description="어느 예매의 돈인지 알 수 없는 입금과 돌려줘야 할 입금을 모았습니다. 예매가 정해진 입금은 위 할 일 큐에서 처리합니다."
    >
      <div className="flex flex-col gap-4">
        <ManualDepositForm onDone={onRefresh} />

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-bold text-[#1B1D22]">대조 필요 ({unknown.length}건)</p>
          <InfoNote tone="warning">
            입금자명·금액으로 예매를 특정하지 못한 입금입니다. 은행 내역을 확인해 수동 매칭하거나, 예매와 무관한
            입금이면 반환 대상으로 지정하세요. 같은 이름으로 나눠 들어온 입금은 대조 힌트의 후보를 보고 여러 건을
            한 번에 연결할 수 있습니다. 잘못 등록한 입금은 등록 취소로 무효 처리합니다.
          </InfoNote>
          <DataTable
            columns={buildUnknownColumns(open)}
            rows={unknown}
            rowKey={(row) => row.id}
            emptyText="주문 미상 입금이 없습니다."
            minWidth="1180px"
            renderSubRow={renderForm}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-bold text-[#1B1D22]">반환 대상 ({refundTargets.length}건)</p>
          <InfoNote tone="danger">
            입금 마감 이후 입금, 보류 반려로 넘어온 입금 등 티켓으로 이을 수 없는 건입니다. 연결된 예매가 남아 있으면
            그 회원에게 돌려줄 돈이며, 회원이 등록한 환불 계좌는 &lsquo;회원이 알린 정보&rsquo;에 표시됩니다. 계좌로
            반환한 뒤 완료 처리해 주세요.
          </InfoNote>
          <DataTable
            columns={buildRefundTargetColumns(askRefund)}
            rows={refundTargets}
            rowKey={(row) => row.id}
            emptyText="반환 대상 입금이 없습니다."
            minWidth="1240px"
          />
        </div>

        <ConfirmDialog request={confirm.request} onClose={confirm.close} />
      </div>
    </Card>
  );
}
