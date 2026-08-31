import Link from 'next/link';

import { ChevronLeftIcon } from './icons';
import { MUTED, PAGE_TITLE } from './ui';
import { Wordmark } from './wordmark';

interface AppHeaderProps {
  /** 화면 제목 — 상단 바 아래에 본문 제목으로 노출한다. */
  title: string;
  /** 제목 아래 보조 설명 */
  description?: string;
  /** 뒤로가기 대상 경로 — 지정하면 좌측에 뒤로가기 버튼을 노출한다. */
  backHref?: string;
  /** 상단 바 우측 영역 (상태 뱃지 등) */
  right?: React.ReactNode;
  /** 제목 블록 아래에 덧붙일 내용 */
  children?: React.ReactNode;
}

/**
 * 회원 앱 공통 상단 헤더.
 * 모든 화면이 같은 구조(워드마크 바 + 화면 제목)를 쓰도록 한 곳에서 관리한다.
 */
export function AppHeader({ title, description, backHref, right, children }: AppHeaderProps) {
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-[#E5E8EB] bg-white px-1.5">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="뒤로가기"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#191F28]"
          >
            <ChevronLeftIcon />
          </Link>
        ) : (
          <span className="h-11 w-2.5" />
        )}
        <div className="min-w-0 flex-1">
          <Wordmark />
        </div>
        <div className="flex min-h-11 items-center pr-2.5">{right}</div>
      </div>

      <header className="px-4 pb-3 pt-5">
        <h1 className={PAGE_TITLE}>{title}</h1>
        {description ? (
          <p className={`mt-1 text-[13px] leading-relaxed ${MUTED}`}>{description}</p>
        ) : null}
        {children}
      </header>
    </>
  );
}
