'use client';

import { usePathname } from 'next/navigation';

import { MemberSessionProvider } from './_components/member-session';
import { SiteFooter } from './_components/site-footer';
import { TabBar } from './_components/tab-bar';
import { AppToastProvider } from './_components/toast';

/** 하단 탭바를 노출하는 최상위 화면 경로 */
const TAB_ROUTES = new Set(['/app', '/app/orders', '/app/tickets', '/app/report']);

/** 로그인 없이도 열람할 수 있는 약관·방침 경로 */
const PUBLIC_ROUTES = new Set(['/app/terms', '/app/privacy']);

/** 회원 앱 셸 — 모바일 프레임 + CELEBUS 계정 연계 게이트 + 하단 탭바 + 사업자 정보 푸터 */
export default function MemberAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabBar = TAB_ROUTES.has(pathname);
  const isPublic = PUBLIC_ROUTES.has(pathname);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-[#F7F7FA] text-[#191F28]">
      <AppToastProvider>
        {/* 본문이 짧아도 푸터가 화면 아래에 붙도록 세로 흐름을 잡는다. */}
        <div className={`flex flex-1 flex-col ${showTabBar ? 'pb-[76px]' : 'pb-4'}`}>
          <div className="flex-1">
            {isPublic ? children : <MemberSessionProvider>{children}</MemberSessionProvider>}
          </div>
          <SiteFooter />
        </div>
        {showTabBar ? <TabBar /> : null}
      </AppToastProvider>
    </div>
  );
}
