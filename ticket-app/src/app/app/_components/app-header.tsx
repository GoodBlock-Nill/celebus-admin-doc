import Link from 'next/link';

import { ChevronLeftIcon } from './icons';

interface AppHeaderProps {
  title: string;
  /** 뒤로가기 대상 경로 — 지정하면 좌측에 뒤로가기 버튼을 노출한다. */
  backHref?: string;
  right?: React.ReactNode;
}

/** 하위 화면 공통 상단 헤더 */
export function AppHeader({ title, backHref, right }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-[#2A2C34] bg-[#0F1014F2] px-1.5 backdrop-blur">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="뒤로가기"
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#F1F0EC]"
        >
          <ChevronLeftIcon />
        </Link>
      ) : (
        <span className="h-11 w-2.5" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-[16px] font-bold">{title}</h1>
      <div className="flex min-h-11 items-center pr-2.5">{right}</div>
    </header>
  );
}
