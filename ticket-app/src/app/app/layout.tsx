'use client';

import { usePathname } from 'next/navigation';

import { MemberSessionProvider } from './_components/member-session';
import { TabBar } from './_components/tab-bar';

/** 하단 탭바를 노출하는 최상위 화면 경로 */
const TAB_ROUTES = new Set(['/app', '/app/orders', '/app/tickets', '/app/report']);

/** 회원 앱 셸 — 모바일 프레임 + CELEBUS 계정 연계 게이트 + 하단 탭바 */
export default function MemberAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabBar = TAB_ROUTES.has(pathname);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[420px] bg-[#0F1014] text-[#F1F0EC]">
      <MemberSessionProvider>
        <div className={showTabBar ? 'pb-[76px]' : 'pb-8'}>{children}</div>
        {showTabBar ? <TabBar /> : null}
      </MemberSessionProvider>
    </div>
  );
}
