'use client';

import type { Tone } from '../../_components/labels';
import type { CheckInKind, CheckInResultView } from '@/lib/admin-types';
import { poolLabel } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

const CARD_STYLE: Record<Tone, string> = {
  neutral: 'border-[#E3E5EA] bg-[#F2F3F6] text-[#6B7080]',
  accent: 'border-[#C6D2F5] bg-[#EDF1FD] text-[#3056D3]',
  success: 'border-[#188A5B] bg-[#EAF6F0] text-[#146B47]',
  warning: 'border-[#B97D10] bg-[#FBF3E1] text-[#B97D10]',
  danger: 'border-[#C2402A] bg-[#FBEDEA] text-[#C2402A]',
};

export interface ScanView {
  tone: Tone;
  title: string;
  guide: string;
}

export const SCAN_VIEW: Record<CheckInKind, ScanView> = {
  OK: { tone: 'success', title: '입장 처리 완료', guide: '입장을 안내해 주세요.' },
  DUPLICATE: {
    tone: 'warning',
    title: '⚠ 이미 입장 처리된 티켓',
    guide: '동일 코드가 다시 스캔되었습니다. 부정 사용이 의심되므로 현장에서 신분을 확인해 주세요.',
  },
  REVOKED: {
    tone: 'danger',
    title: '회수된 티켓',
    guide: '환불 또는 부정 거래 조치로 무효화된 티켓입니다. 입장할 수 없습니다.',
  },
  INVALID: {
    tone: 'danger',
    title: '존재하지 않는 코드',
    guide: '발급된 적이 없는 코드입니다. 코드 입력을 다시 확인해 주세요.',
  },
  EXPIRED_TOKEN: {
    tone: 'warning',
    title: '토큰이 만료되었습니다',
    guide: '관람객에게 티켓 화면을 새로 열어 달라고 안내해 주세요. 화면을 열면 새 코드가 표시됩니다.',
  },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[13px]">
      <span className="w-[80px] shrink-0 opacity-70">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

/** 스캔 결과 대형 카드 */
export function ScanResultCard({ result }: { result: CheckInResultView | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-[#E3E5EA] bg-[#FAFBFC] px-4 py-10 text-center text-[13px] text-[#6B7080]">
        티켓 코드 또는 QR 값을 입력하면 결과가 여기에 표시됩니다.
      </div>
    );
  }

  const view = SCAN_VIEW[result.kind];
  const ticket = result.ticket;

  return (
    <div className={`rounded-xl border-2 px-5 py-5 ${CARD_STYLE[view.tone]}`}>
      <p className="text-[20px] font-bold">{view.title}</p>
      <p className="mt-1.5 text-[12px] leading-relaxed opacity-80">{view.guide}</p>

      {ticket ? (
        <div className="mt-4 flex flex-col gap-1.5 border-t border-black/10 pt-3">
          <Row label="코드" value={ticket.code} />
          <Row label="공연" value={ticket.concertTitle} />
          <Row label="회차" value={ticket.sessionName} />
          <Row label="수령 경로" value={poolLabel(ticket.poolType)} />
          {ticket.usedAt ? (
            <Row
              label={result.kind === 'DUPLICATE' ? '최초 입장' : '입장 시각'}
              value={formatDateTime(ticket.usedAt)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
