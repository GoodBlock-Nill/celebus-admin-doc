"use client";

// 공통 셸 — 열람은 로그인 없이 자유. 세션은 SessionProvider가 관리하고,
// 상호작용(하트·댓글·업로드·마이) 시점에만 로그인 유도 모달이 뜬다.
import { LangProvider } from "./LangProvider";
import SessionProvider from "./SessionProvider";
import Header from "./Header";
import Footer from "./Footer";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <SessionProvider>
        <Header />
        <main className="mx-auto max-w-2xl px-4 pb-6 pt-4">{children}</main>
        <Footer />
      </SessionProvider>
    </LangProvider>
  );
}
