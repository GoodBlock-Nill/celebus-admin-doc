'use client';

import { HOLD_CAUSE_VIEW } from '../../../_components/labels';
import { Badge, InfoNote, StatusBadge } from '../../../_components/ui';
import { DepositList } from './deposit-list';
import { WORKLIST_KIND_VIEW } from './kind';
import { OrderActionBar, type OrderActionKey } from './order-actions';
import { ReconcileForm } from './reconcile-form';
import type { ConfirmRequest } from '../../../_components/confirm-dialog';
import type { WorklistActions } from './use-worklist-actions';
import type { AdminDepositView, AdminOrderView, AdminWorklistItemView } from '@/lib/admin-types';
import { formatDateTime } from '@/lib/format';

/** 라벨 + 값 한 줄 */
function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1">
      <span className="w-[92px] shrink-0 text-[12px] text-[#6B7080]">{label}</span>
      <span className="flex-1 text-[12.5px] leading-relaxed text-[#1B1D22]">{children}</span>
    </div>
  );
}

/** 회원이 알려 온 정보·요청 이력 — 처리 판단의 근거 */
function OrderContext({ item }: { item: AdminWorklistItemView }) {
  const order = item.order;

  return (
    <div className="rounded-lg border border-[#E3E5EA] bg-white px-3 py-2">
      <Line label="입금 마감">{formatDateTime(order.depositDeadline)}</Line>
      <Line label="회원 요청">
        {order.depositReportedAt
          ? `${formatDateTime(order.depositReportedAt)} (누적 ${order.depositReportCount}회)`
          : '요청 없음'}
      </Line>
      {order.holdReason || order.holdCause ? (
        <Line label="보류 사유">
          <span className="flex flex-wrap items-center gap-1.5">
            {order.holdCause ? <StatusBadge view={HOLD_CAUSE_VIEW[order.holdCause]} /> : null}
            <span>{order.holdReason ?? '-'}</span>
          </span>
        </Line>
      ) : null}
      <Line label="회원 알림">
        {order.holdInfoSubmittedAt ? (
          <span className="flex flex-col gap-0.5">
            {order.holdActualDepositor ? (
              <span>
                실제 입금자명 <b>{order.holdActualDepositor}</b>
              </span>
            ) : null}
            {order.refundBank && order.refundAccountMasked ? (
              <span>
                환불 계좌 {order.refundBank} {order.refundAccountMasked} · 예금주{' '}
                {order.refundHolder}
              </span>
            ) : null}
            <span className="text-[11.5px] text-[#6B7080]">
              전달 {formatDateTime(order.holdInfoSubmittedAt)}
            </span>
          </span>
        ) : (
          '알려온 정보 없음'
        )}
      </Line>
      {order.depositConfirmedAt ? (
        <Line label="입금 확인">{formatDateTime(order.depositConfirmedAt)}</Line>
      ) : null}
    </div>
  );
}

/** 이 예매와 관련된 최근 활동 */
function ActivityLogs({ item }: { item: AdminWorklistItemView }) {
  if (item.logs.length === 0) {
    return <p className="text-[12px] text-[#6B7080]">기록된 활동이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {item.logs.map((log) => (
        <li key={log.id} className="flex flex-wrap items-center gap-2 text-[12px] text-[#4A4E5A]">
          <span className="tabular-nums text-[#6B7080]">{formatDateTime(log.createdAt)}</span>
          <Badge>{log.action}</Badge>
          <span className="flex-1">{log.detail}</span>
          <span className="text-[11.5px] text-[#6B7080]">{log.actor}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-bold text-[#4A4E5A]">{children}</p>;
}

/** 할 일 큐 행 확장 — 이 예매를 끝내는 데 필요한 맥락과 처리 손잡이를 한곳에 모은다 */
export function WorklistDetail({
  item,
  allDeposits,
  candidates,
  actions,
  confirm,
  onRefresh,
  onRunOrderAction,
  reconcileOpen,
  onCloseReconcile,
}: {
  item: AdminWorklistItemView;
  allDeposits: AdminDepositView[];
  candidates: AdminOrderView[];
  actions: WorklistActions;
  confirm: { ask: (request: ConfirmRequest) => void };
  onRefresh: () => void;
  onRunOrderAction: (key: OrderActionKey) => void;
  reconcileOpen: boolean;
  onCloseReconcile: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <InfoNote tone={WORKLIST_KIND_VIEW[item.kind].tone}>
        {WORKLIST_KIND_VIEW[item.kind].guide}
      </InfoNote>

      <OrderActionBar item={item} onRun={onRunOrderAction} />

      {reconcileOpen ? (
        <ReconcileForm
          item={item}
          onSubmit={(depositorName, amountKrw) => {
            onCloseReconcile();
            void actions.reconcile(item, depositorName, amountKrw);
          }}
          onClose={onCloseReconcile}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <SectionTitle>예매 맥락</SectionTitle>
          <OrderContext item={item} />
        </div>
        <div className="flex flex-col gap-1.5">
          <SectionTitle>연결 입금 ({item.deposits.length}건)</SectionTitle>
          <DepositList
            item={item}
            allDeposits={allDeposits}
            candidates={candidates}
            actions={actions}
            confirm={confirm}
            onRefresh={onRefresh}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionTitle>최근 활동</SectionTitle>
        <ActivityLogs item={item} />
      </div>
    </div>
  );
}
