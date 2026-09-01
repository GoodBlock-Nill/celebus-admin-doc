/** 상태 뱃지 — 화면 전반에서 상태 표기를 통일한다. */

export type BadgeTone =
  | 'accent'
  | 'info'
  | 'success'
  | 'successSoft'
  | 'warning'
  | 'danger'
  | 'muted';

const TONE_CLASS: Record<BadgeTone, string> = {
  accent: 'bg-[#FDF2F7] text-[#D6336C]',
  // 처리 진행 중임을 알리는 정보 톤 — 입금 확인중(회원 요청 접수) 표기에 사용
  info: 'bg-[#EFF4FF] text-[#175CD3]',
  success: 'bg-[#ECFDF3] text-[#067647]',
  // 성공 계열이지만 티켓 지급보다 한 단계 낮은 강조 — 입금 확인 표기에 사용
  successSoft: 'bg-[#F0FAF4] text-[#12B76A]',
  warning: 'bg-[#FFFAEB] text-[#B54708]',
  danger: 'bg-[#FEF3F2] text-[#D92D20]',
  muted: 'bg-[#F2F4F6] text-[#6B7684]',
};

interface BadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[10px] px-2.5 py-1.5 text-[11.5px] font-bold leading-none ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
