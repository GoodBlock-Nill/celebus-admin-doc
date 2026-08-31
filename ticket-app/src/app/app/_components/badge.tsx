/** 상태 뱃지 — 화면 전반에서 상태 표기를 통일한다. */

export type BadgeTone = 'accent' | 'success' | 'successSoft' | 'warning' | 'danger' | 'muted';

const TONE_CLASS: Record<BadgeTone, string> = {
  accent: 'bg-[#FDF2F7] text-[#D6336C]',
  success: 'bg-[#ECFDF3] text-[#067647]',
  // 성공 계열이지만 지급 완료보다 한 단계 낮은 강조 — 지급 대기 표기에 사용
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
