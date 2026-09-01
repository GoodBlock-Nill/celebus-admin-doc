'use client';

import { useState } from 'react';

import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button, TextInput } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import { amountColumn, depositedAtColumn, depositorColumn, orderColumn } from './deposit-columns';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView } from '@/lib/admin-types';

const MEMO_MAX_LENGTH = 100;

const DEFAULT_HOLD_MEMO = '중복 입금 — 확인 필요';
const DEFAULT_REFUND_MEMO = '중복 입금 — 반환 대상';

/** 행에서 펼쳐 둔 보조 처리 구분 */
type ActionKind = 'hold' | 'refund';

interface ActiveAction {
  depositId: string;
  kind: ActionKind;
}

/**
 * ② 확인 대기 — 자동 대조가 끝나 운영자 확인만 남은 입금.
 *
 * 한 예매에 입금이 두 건 대조되는 일이 있다(회원이 두 번 보낸 경우).
 * 1건을 확인하면 나머지 1건은 예매 대금이 아니므로,
 * 이 탭에서 바로 보류·반환 대상으로 종결할 수 있게 보조 손잡이를 함께 둔다.
 */
export function PendingTab({ rows, onDone }: { rows: AdminDepositView[]; onDone: () => void }) {
  const toast = useToast();

  const [active, setActive] = useState<ActiveAction | null>(null);
  const [memo, setMemo] = useState(DEFAULT_HOLD_MEMO);

  const openAction = (depositId: string, kind: ActionKind) => {
    setActive((current) =>
      current && current.depositId === depositId && current.kind === kind ? null : { depositId, kind },
    );
    setMemo(kind === 'hold' ? DEFAULT_HOLD_MEMO : DEFAULT_REFUND_MEMO);
  };

  const handleConfirm = async (row: AdminDepositView) => {
    const result = await adminApi.confirmDeposit(row.id);
    toast.fromResult(result, `주문 ${row.order?.orderNo ?? ''} 입금 확인 — 티켓 지급 대기로 전환되었습니다.`);
    if (result.ok) onDone();
  };

  const handleHold = async (row: AdminDepositView) => {
    const result = await adminApi.holdDeposit(row.id, memo.trim() || DEFAULT_HOLD_MEMO);
    toast.fromResult(result, `${row.depositorName} 입금을 보류로 돌렸습니다.`);
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

  const columns: Array<Column<AdminDepositView>> = [
    depositorColumn,
    amountColumn,
    depositedAtColumn,
    orderColumn,
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '270px',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button variant="primary" size="sm" onClick={() => void handleConfirm(row)}>
            입금 확인
          </Button>
          <Button size="sm" onClick={() => openAction(row.id, 'hold')}>
            보류
          </Button>
          <Button variant="danger" size="sm" onClick={() => openAction(row.id, 'refund')}>
            반환 대상 지정
          </Button>
        </div>
      ),
    },
  ];

  const renderSubRow = (row: AdminDepositView) => {
    if (!active || active.depositId !== row.id) return null;
    const isHold = active.kind === 'hold';

    return (
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#4A4E5A]">
            {isHold ? '보류 사유' : '반환 사유'}
          </span>
          <TextInput
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            maxLength={MEMO_MAX_LENGTH}
          />
        </div>
        {isHold ? (
          <Button variant="primary" onClick={() => void handleHold(row)}>
            보류로 돌리기
          </Button>
        ) : (
          <Button variant="danger" onClick={() => void handleRefundTarget(row)}>
            반환 대상으로 지정
          </Button>
        )}
        <Button onClick={() => setActive(null)}>닫기</Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <InfoNote>
        자동 대조는 금액 완전 일치 + 실명(또는 실명 + 주문번호 끝 4자리) 기준으로 이뤄집니다. 입금 확인 후 티켓 지급
        대기로 전환되며, 티켓 지급 대기 탭에서 지급 처리를 해야 티켓이 발급됩니다. 같은 예매에 입금이 두 건 이상
        대조된 경우, 대금으로 인정할 1건만 확인하고 나머지는 보류 또는 반환 대상으로 지정해 종결하세요.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="확인 대기 중인 입금이 없습니다."
        minWidth="900px"
        renderSubRow={renderSubRow}
      />
    </div>
  );
}
