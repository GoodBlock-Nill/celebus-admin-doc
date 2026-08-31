import Link from 'next/link';

import { CARD, GHOST_BUTTON, MUTED } from './ui';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

/** 데이터가 없을 때 표시 */
export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className={`${CARD} flex flex-col items-center gap-2 px-5 py-12 text-center`}>
      <p className="text-[14px] font-semibold">{title}</p>
      {description ? <p className={`text-[12.5px] leading-relaxed ${MUTED}`}>{description}</p> : null}
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={`${GHOST_BUTTON} mt-3 max-w-[220px]`}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** 데모 진행 안내 문구 */
export function DemoTip({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-[#2A2C34] px-3.5 py-3 text-[11.5px] leading-relaxed text-[#7B7C87]">
      {children}
    </p>
  );
}

/** 액션 실패 사유 표시 */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-[#F0654855] bg-[#F065481A] px-3.5 py-3 text-[12.5px] leading-relaxed text-[#F06548]"
    >
      {message}
    </p>
  );
}

/** 저장소 복원 전 자리표시 */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-5">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl border border-[#2A2C34] bg-[#191A20]" />
      ))}
    </div>
  );
}

/** 대상을 찾지 못했을 때의 안내 */
export function NotFoundNotice({ message, backHref }: { message: string; backHref: string }) {
  return (
    <div className="flex flex-col gap-4 px-4 py-8">
      <p className={`text-[13px] ${MUTED}`}>{message}</p>
      <Link href={backHref} className={GHOST_BUTTON}>
        목록으로 돌아가기
      </Link>
    </div>
  );
}
