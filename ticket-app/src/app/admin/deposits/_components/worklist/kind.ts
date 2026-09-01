import type { Tone } from '../../../_components/labels';
import type { WorklistKind } from '@/lib/admin-types';

/** 할 일 유형별 표기 — 목록 필터·행 안내 문구에 함께 쓴다 */
export interface WorklistKindView {
  /** 필터 칩 표기 (짧게) */
  chipLabel: string;
  /** 행 확장에서 안내하는 처리 기준 */
  guide: string;
  tone: Tone;
}

export const WORKLIST_KIND_VIEW: Record<WorklistKind, WorklistKindView> = {
  REPORTED: {
    chipLabel: '요청',
    tone: 'accent',
    guide:
      '회원이 입금을 마쳤다고 알린 예매입니다. 은행 입금 내역에서 금액·입금자명을 찾아 아래에 그대로 옮겨 적으면 입금 확인까지 한 번에 끝납니다. 입금 내역에 없으면 미입금 반려로 입금 대기에 되돌리세요.',
  },
  AWAITING_CONFIRM: {
    chipLabel: '확인 대기',
    tone: 'warning',
    guide:
      '입금 금액·입금자명이 예매와 맞아 자동으로 이어진 건입니다. 은행 내역과 같은지 확인한 뒤 입금 확인을 누르면 티켓 지급 대기로 넘어갑니다. 같은 예매에 입금이 두 건 이상 이어졌다면 대금으로 인정할 1건만 확인하고 나머지는 반환 대상으로 지정해 종결하세요.',
  },
  ON_HOLD: {
    chipLabel: '보류',
    tone: 'warning',
    guide:
      '입금자명이나 금액이 예매와 어긋나 회원 확인이 필요한 건입니다. 회원이 알린 실제 입금자명으로 은행 내역이 확인되면 입금 확인(인정)으로 진행하고, 끝내 대조되지 않으면 보류 반려로 예매를 입금 대기에 되돌립니다(받은 입금은 반환 대상이 됩니다).',
  },
  ISSUE_PENDING: {
    chipLabel: '지급 대기',
    tone: 'success',
    guide:
      '입금이 확인된 예매입니다. 티켓 지급 처리를 해야 실명 티켓이 발급되며, 지급은 공연 당일 발권 일정에 맞추는 것이 원칙입니다. 회차 단위로 한 번에 지급하려면 아래 공연 당일 지급 구획을 사용하세요.',
  },
};

/** 목록 필터 — 전체 + 할 일 유형 4가지 */
export type WorklistFilter = 'ALL' | WorklistKind;

export const WORKLIST_FILTERS: Array<{ key: WorklistFilter; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'REPORTED', label: WORKLIST_KIND_VIEW.REPORTED.chipLabel },
  { key: 'AWAITING_CONFIRM', label: WORKLIST_KIND_VIEW.AWAITING_CONFIRM.chipLabel },
  { key: 'ON_HOLD', label: WORKLIST_KIND_VIEW.ON_HOLD.chipLabel },
  { key: 'ISSUE_PENDING', label: WORKLIST_KIND_VIEW.ISSUE_PENDING.chipLabel },
];
