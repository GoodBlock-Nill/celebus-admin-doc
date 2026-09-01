'use client';

import { useState } from 'react';

import { Button } from '../../../_components/form';
import { DEPOSIT_STATUS_VIEW } from '../../../_components/labels';
import { StatusBadge } from '../../../_components/ui';
import { DepositMemoForm } from '../deposit-memo-form';
import { DepositVoidForm } from '../deposit-void-form';
import { DepositMatchForm } from '../match-form';
import { useVoidDeposit } from '../use-void-deposit';
import type { WorklistActions } from './use-worklist-actions';
import type { ConfirmRequest } from '../../../_components/confirm-dialog';
import type {
  AdminDepositView,
  AdminLinkedDepositView,
  AdminOrderView,
  AdminWorklistItemView,
} from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

const DEFAULT_HOLD_MEMO = '중복 입금 — 확인 필요';
const DEFAULT_REFUND_MEMO = '예매 대금 아님 — 반환 대상';

type FormKind = 'hold' | 'refund' | 'void' | 'match';

interface ActiveForm {
  depositId: string;
  kind: FormKind;
}

/** 입금 상태별로 열어 둘 처리 손잡이 */
function actionKeysOf(deposit: AdminLinkedDepositView): FormKind[] {
  if (deposit.status === 'AUTO_MATCHED') return ['hold', 'refund', 'void'];
  if (deposit.status === 'HELD') return ['match', 'refund', 'void'];
  return [];
}

const FORM_LABEL: Record<FormKind, string> = {
  hold: '보류',
  refund: '반환 대상 지정',
  void: '등록 취소',
  match: '수동 매칭',
};

/**
 * 이 예매에 이어진 입금 전부 — 상태·사유·힌트와 건별 처리 손잡이.
 * 한 예매에 입금이 둘 이상 이어진 경우(중복 송금) 여기서 1건만 인정하고 나머지를 종결한다.
 */
export function DepositList({
  item,
  allDeposits,
  candidates,
  actions,
  confirm,
  onRefresh,
}: {
  item: AdminWorklistItemView;
  /** 분할 입금으로 함께 연결할 다른 입금을 찾기 위한 전체 목록 */
  allDeposits: AdminDepositView[];
  candidates: AdminOrderView[];
  actions: WorklistActions;
  confirm: { ask: (request: ConfirmRequest) => void };
  onRefresh: () => void;
}) {
  const [active, setActive] = useState<ActiveForm | null>(null);
  const [memo, setMemo] = useState(DEFAULT_HOLD_MEMO);
  const voidDeposit = useVoidDeposit(confirm, onRefresh);

  if (item.deposits.length === 0) {
    return (
      <p className="text-[12px] text-[#6B7080]">
        아직 이 예매에 이어진 입금이 없습니다. 은행 내역 대조로 입금을 등록해 주세요.
      </p>
    );
  }

  const open = (depositId: string, kind: FormKind) => {
    setActive((current) =>
      current && current.depositId === depositId && current.kind === kind ? null : { depositId, kind },
    );
    if (kind === 'void') voidDeposit.resetReason();
    if (kind === 'hold') setMemo(DEFAULT_HOLD_MEMO);
    if (kind === 'refund') setMemo(DEFAULT_REFUND_MEMO);
  };

  const renderForm = (deposit: AdminLinkedDepositView) => {
    if (!active || active.depositId !== deposit.id) return null;

    if (active.kind === 'void') {
      return (
        <DepositVoidForm
          reason={voidDeposit.reason}
          onChange={voidDeposit.setReason}
          onSubmit={() => voidDeposit.ask(deposit)}
          onClose={() => setActive(null)}
        />
      );
    }

    if (active.kind === 'match') {
      const siblingIds = deposit.splitHint?.depositIds.filter((id) => id !== deposit.id) ?? [];
      return (
        <DepositMatchForm
          row={deposit}
          candidates={candidates}
          siblings={allDeposits.filter((row) => siblingIds.includes(row.id))}
          onSubmit={(depositIds, orderId) => {
            setActive(null);
            void actions.manualMatch(depositIds, orderId);
          }}
          onClose={() => setActive(null)}
        />
      );
    }

    const isHold = active.kind === 'hold';
    return (
      <DepositMemoForm
        kind={isHold ? 'hold' : 'refund'}
        memo={memo}
        onChange={setMemo}
        onClose={() => setActive(null)}
        onSubmit={() => {
          setActive(null);
          const trimmed = memo.trim() || (isHold ? DEFAULT_HOLD_MEMO : DEFAULT_REFUND_MEMO);
          void (isHold
            ? actions.holdDeposit(deposit.id, trimmed)
            : actions.markRefundTarget(deposit.id, trimmed));
        }}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {item.deposits.map((deposit) => (
        <div
          key={deposit.id}
          className="flex flex-col gap-2 rounded-lg border border-[#E3E5EA] bg-white px-3 py-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge view={DEPOSIT_STATUS_VIEW[deposit.status]} />
              <span className="text-[13px] font-semibold text-[#1B1D22]">{deposit.depositorName}</span>
              <span className="text-[13px] tabular-nums text-[#1B1D22]">
                {formatKrw(deposit.amountKrw)}
              </span>
              <span className="text-[11.5px] tabular-nums text-[#6B7080]">
                {formatDateTime(deposit.depositedAt)}
              </span>
              {deposit.memo ? (
                <span className="text-[12px] text-[#4A4E5A]">· {deposit.memo}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {deposit.status === 'AUTO_MATCHED' || deposit.status === 'HELD' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void actions.confirmDeposit(item, deposit.id)}
                >
                  이 입금으로 확인
                </Button>
              ) : null}
              {actionKeysOf(deposit).map((kind) => (
                <Button
                  key={kind}
                  variant={kind === 'match' ? 'secondary' : 'danger'}
                  size="sm"
                  onClick={() => open(deposit.id, kind)}
                >
                  {FORM_LABEL[kind]}
                </Button>
              ))}
            </div>
          </div>
          {deposit.splitHint ? (
            <p className="text-[12px] text-[#4A4E5A]">
              분할 입금 후보 — 같은 이름의 미종결 입금 합계 {formatKrw(deposit.splitHint.totalKrw)}가 예매{' '}
              {deposit.splitHint.order.orderNo} 금액과 맞습니다. 수동 매칭에서 함께 연결하세요.
            </p>
          ) : null}
          {renderForm(deposit)}
        </div>
      ))}
    </div>
  );
}
