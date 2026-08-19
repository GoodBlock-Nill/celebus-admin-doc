"use client";

// /sketch 라우트 공통 레이아웃 — 언어 컨텍스트 + CELEBUS 세션 확보.
// 전용 도메인(sketch.celebus.xyz)은 쿠키가 호스트 단위라 본 게임 방문 없이 진입할 수 있다 —
// AppShell과 동일한 SSO 흐름으로 이 호스트의 세션을 만들고, 실패 시 로그인 게이트를 띄운다.
import { useEffect, useState } from "react";
import { LangProvider } from "@/components/LangProvider";
import SsoGate from "@/components/SsoGate";
import { hasLocalSession, markLocalSession, ssoLogin } from "@/lib/auth-api";
import { setAvatar, setNick } from "@/lib/game-api";

function AuthBoundary({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<"checking" | "need" | "ok">("checking");
  useEffect(() => {
    ssoLogin().then((p) => {
      if (p.signed_up && p.nickname) {
        setNick(p.nickname);
        if (p.avatar) setAvatar(p.avatar);
        markLocalSession(true);
        setAuth("ok");
      } else if (p.offline && hasLocalSession()) {
        setAuth("ok");
      } else {
        setAuth("need");
      }
    });
  }, []);

  if (auth === "checking")
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center justify-center px-5">
        <div className="h-24 w-full animate-pulse rounded-[16px] bg-surface-1" />
      </div>
    );
  if (auth === "need") return <SsoGate onDone={() => setAuth("ok")} />;
  return <>{children}</>;
}

export default function SketchLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AuthBoundary>{children}</AuthBoundary>
    </LangProvider>
  );
}
