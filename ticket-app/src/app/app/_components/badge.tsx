/** 상태 뱃지 — 화면 전반에서 상태 표기를 통일한다. */

export type BadgeTone = 'accent' | 'success' | 'successSoft' | 'warning' | 'danger' | 'muted';

const TONE_CLASS: Record<BadgeTone, string> = {
  accent: 'border-[#F0426E55] bg-[#F0426E1F] text-[#F0426E]',
  success: 'border-[#3DC98A55] bg-[#3DC98A1F] text-[#3DC98A]',
  // 성공 계열이지만 지급 완료보다 한 단계 낮은 강조 — 지급 대기 표기에 사용
  successSoft: 'border-[#3DC98A33] bg-[#3DC98A0F] text-[#7FD3B0]',
  warning: 'border-[#F5B34155] bg-[#F5B3411F] text-[#F5B341]',
  danger: 'border-[#F0654855] bg-[#F065481F] text-[#F06548]',
  muted: 'border-[#2A2C34] bg-[#20222A] text-[#9A9AA4]',
};

interface BadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
