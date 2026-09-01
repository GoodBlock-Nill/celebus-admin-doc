import { CheckIcon } from '../_components/icons';
import { MUTED, NUMERIC } from '../_components/ui';
import type { OrderDetailView, OrderStatus } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

type StepState = 'DONE' | 'CURRENT' | 'PENDING' | 'CANCELED';

interface TimelineStep {
  title: string;
  description: string;
  state: StepState;
  at?: string;
}

const DEPOSIT_DONE_STATUSES = new Set<OrderStatus>([
  'DEPOSIT_CONFIRMED',
  'PAID',
  'CANCEL_REQUESTED',
  'REFUNDED',
]);
const CANCELED_STATUSES = new Set<OrderStatus>(['EXPIRED', 'REFUNDED']);

/** 2단계(입금 대기) 설명 — 회원의 입금확인 요청 여부에 따라 문구가 갈린다. */
function waitingDescription(order: OrderDetailView): string {
  if (DEPOSIT_DONE_STATUSES.has(order.status)) return '입금이 접수되었습니다.';
  if (order.status === 'DEPOSIT_REPORTED') return '입금 확인 요청 접수 — 운영자 확인 중입니다.';
  if (order.status === 'ON_HOLD') return '입금 정보 확인이 필요해 보류 중입니다.';
  if (order.status === 'EXPIRED') return '입금이 확인되지 않아 예매가 취소되었습니다.';
  return '안내된 계좌로 마감 시각까지 입금해 주세요.';
}

/** 3단계(입금 확인) 설명 */
function confirmDescription(order: OrderDetailView): string {
  if (DEPOSIT_DONE_STATUSES.has(order.status)) {
    return '입금자명과 금액 확인이 완료되어 예매가 확정되었습니다.';
  }
  if (order.status === 'DEPOSIT_REPORTED') return '요청하신 입금 내역을 운영자가 확인하고 있습니다.';
  if (order.status === 'AWAITING_DEPOSIT' || order.status === 'ON_HOLD') {
    return '입금이 접수되면 운영자가 확인합니다.';
  }
  return '입금이 확인되면 예매가 확정됩니다.';
}

/** 예매 상태로 4단계(예매 접수 → 입금 대기 → 입금 확인 → 티켓 지급) 진행 상태를 계산한다. */
function buildSteps(order: OrderDetailView): TimelineStep[] {
  const ticketIssuedAt = order.ticketIssuedAt ?? undefined;
  const isDepositDone = DEPOSIT_DONE_STATUSES.has(order.status);
  const isCanceled = CANCELED_STATUSES.has(order.status);

  const waitingState: StepState = isDepositDone
    ? 'DONE'
    : order.status === 'EXPIRED'
      ? 'CANCELED'
      : 'CURRENT';
  const confirmState: StepState = isDepositDone
    ? 'DONE'
    : order.status === 'EXPIRED'
      ? 'CANCELED'
      : 'PENDING';
  const issueState: StepState = ticketIssuedAt
    ? 'DONE'
    : isCanceled
      ? 'CANCELED'
      : isDepositDone
        ? 'CURRENT'
        : 'PENDING';

  return [
    {
      title: '예매 접수',
      description: '예매 신청이 접수되고 좌석이 임시 확보되었습니다.',
      state: 'DONE',
      at: order.createdAt,
    },
    {
      title: '입금 대기',
      description: waitingDescription(order),
      state: waitingState,
      // 입금확인 요청 접수 시각은 회원이 언제 알렸는지 확인하는 근거가 된다
      at: order.status === 'DEPOSIT_REPORTED' ? (order.depositReportedAt ?? undefined) : undefined,
    },
    {
      title: '입금 확인',
      description: confirmDescription(order),
      state: confirmState,
      // 입금 확인 시각이 없는 과거 예매는 티켓 발급 시각으로 대체한다
      at: isDepositDone ? (order.depositConfirmedAt ?? ticketIssuedAt) : undefined,
    },
    {
      title: '티켓 지급',
      description: ticketIssuedAt
        ? '티켓이 지급되었습니다. CELEBUS 앱에서 확인해 주세요. 지급된 예매는 취소·환불이 불가능합니다.'
        : isDepositDone
          ? '공연 당일 CELEBUS 앱으로 티켓이 지급됩니다. 지급 후에는 취소·환불이 불가능합니다.'
          : '입금 확인 후 공연 당일 CELEBUS 앱으로 지급됩니다.',
      state: issueState,
      at: ticketIssuedAt,
    },
  ];
}

const DOT_CLASS: Record<StepState, string> = {
  DONE: 'border-[#12B76A] bg-[#12B76A] text-white',
  CURRENT: 'border-[#D6336C] bg-[#FDF2F7] text-[#D6336C]',
  PENDING: 'border-[#E5E8EB] bg-[#F2F4F6] text-[#B0B8C1]',
  CANCELED: 'border-[#E5E8EB] bg-[#F2F4F6] text-[#B0B8C1]',
};

/** 예매 진행 타임라인 */
export function OrderTimeline({ order }: { order: OrderDetailView }) {
  const steps = buildSteps(order);

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold ${DOT_CLASS[step.state]}`}
            >
              {step.state === 'DONE' ? <CheckIcon className="h-4 w-4" /> : index + 1}
            </span>
            {index < steps.length - 1 ? <span className="h-full w-px flex-1 bg-[#E5E8EB]" /> : null}
          </div>

          <div className={index < steps.length - 1 ? 'pb-4' : ''}>
            <p
              className={`text-[14.5px] font-bold ${
                step.state === 'CURRENT'
                  ? 'text-[#D6336C]'
                  : step.state === 'DONE'
                    ? 'text-[#191F28]'
                    : 'text-[#B0B8C1]'
              }`}
            >
              {step.title}
            </p>
            <p className={`mt-0.5 text-[13px] leading-relaxed ${MUTED}`}>{step.description}</p>
            {step.at ? (
              <p className={`mt-0.5 text-[12.5px] text-[#8B95A1] ${NUMERIC}`}>
                {formatDateTime(step.at)}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
