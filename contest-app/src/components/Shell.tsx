"use client";

// 공통 셸 — 열람은 로그인 없이 자유. 세션은 SessionProvider가 관리하고,
// 상호작용(하트·댓글·업로드·마이) 시점에만 로그인 유도 모달이 뜬다.
// CELEBUS 복귀 버튼은 헤더 최상단(언어 선택 옆)으로 이동. 하단은 탭 내비게이션.
import { useEffect } from "react";
import { LangProvider } from "./LangProvider";
import SessionProvider from "./SessionProvider";
import Header from "./Header";
import BottomNav from "./BottomNav";
import LaunchPreviewToggle from "./LaunchPreviewToggle";
import DevAuthToggle from "./DevAuthToggle";
import ViewportDebug from "./ViewportDebug";

// iOS가 키보드를 완전히 접고 뷰포트를 되돌리는 데 걸리는 여유 시간
const KEYBOARD_SETTLE_MS = 60;

export default function Shell({ children }: { children: React.ReactNode }) {
  // iOS는 입력창 포커스 시 문서(레이아웃 뷰포트)를 강제로 밀어 올리는데,
  // 키보드가 닫힌 뒤에도 이 오프셋이 남아 하단 탭바가 바닥에서 떠 보이는 경우가 있다.
  // 키보드 종료 시점(뷰포트 복원·포커스 해제)에 원점으로 복귀시킨다.
  useEffect(() => {
    const reset = () => {
      const el = document.activeElement;
      const isEditing =
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (!isEditing && window.scrollY !== 0) window.scrollTo(0, 0);
    };
    const onFocusOut = () => {
      window.setTimeout(reset, KEYBOARD_SETTLE_MS);
    };
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", reset);
    window.addEventListener("focusout", onFocusOut);
    return () => {
      visualViewport?.removeEventListener("resize", reset);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // 뷰포트 앵커 고정 셸(.app-shell, globals.css) + 내부 스크롤. iOS 26 standalone의
  // 하단 뷰포트 축소 버그 대응 포함. body가 스크롤하지 않아 하단 탭바가 튀지 않는다.
  return (
    <LangProvider>
      <SessionProvider>
        <div className="app-shell flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">{children}</div>
          </main>
          <BottomNav />
        </div>
        <LaunchPreviewToggle />
        <DevAuthToggle />
        {/* [임시] iOS 26 하단 갭 진단 — 원인 확정 후 제거 */}
        <ViewportDebug />
      </SessionProvider>
    </LangProvider>
  );
}
