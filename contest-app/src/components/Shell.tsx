"use client";

// 공통 셸 — 열람은 로그인 없이 자유. 세션은 SessionProvider가 관리하고,
// 상호작용(하트·댓글·업로드·마이) 시점에만 로그인 유도 모달이 뜬다.
// CELEBUS 복귀 버튼은 헤더 최상단(언어 선택 옆)으로 이동. 하단은 탭 내비게이션.
import { LangProvider } from "./LangProvider";
import SessionProvider from "./SessionProvider";
import Header from "./Header";
import BottomNav from "./BottomNav";
import LaunchPreviewToggle from "./LaunchPreviewToggle";
import DevAuthToggle from "./DevAuthToggle";

export default function Shell({ children }: { children: React.ReactNode }) {
  // 전체 높이(100dvh) 고정 셸 + 내부 스크롤. body가 스크롤하지 않아 iOS Safari 하단 툴바가
  // 접혔다 펴지지 않으므로 하단 탭바가 위아래로 튀지 않는다(고무줄 스크롤로 뜨는 것도 방지).
  return (
    <LangProvider>
      <SessionProvider>
        <div className="flex h-[100dvh] flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">{children}</div>
          </main>
          <BottomNav />
        </div>
        <LaunchPreviewToggle />
        <DevAuthToggle />
      </SessionProvider>
    </LangProvider>
  );
}
