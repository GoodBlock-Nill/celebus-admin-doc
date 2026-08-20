"use client";

// 앱 공통 셸 — 언어 컨텍스트 + 스케치북 테마 + CELEBUS 세션 확보.
// /admin은 별도 콘솔이므로 테마·세션 게이트를 씌우지 않는다.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LangProvider } from "@/components/LangProvider";
import SsoGate from "@/components/SsoGate";
import { hasLocalSession, markLocalSession, ssoLogin } from "@/lib/auth-api";
import { getNick, setAvatar, setNick } from "@/lib/game-api";

// 테스트 기간 게스트 모드 — CELEBUS 로그인 없이 기기별 익명 신원으로 진행.
// 정식 오픈 시 env 제거로 SSO 게이트 복귀.
const GUEST_MODE = process.env.NEXT_PUBLIC_SKETCH_GUEST === "1";

function AuthBoundary({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<"checking" | "need" | "ok">("checking");
  useEffect(() => {
    if (GUEST_MODE) {
      void fetch("/api/auth/guest", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then((res) => {
          if (!res.ok) throw new Error();
          if (!getNick()) setNick(`팬${Math.floor(1000 + Math.random() * 9000)}`); // 파티룸 표시용 게스트 닉
          markLocalSession(true);
          setAuth("ok");
        })
        .catch(() => setAuth("need")); // 발급 실패 시에만 게이트 폴백
      return;
    }
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

export default function ShellBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  // 스케치 전용 토스트 테마 스코프 — 포털(body 직속)이라 CSS 스코프가 닿도록 body 속성 부여
  useEffect(() => {
    if (isAdmin) return;
    document.body.dataset.sketch = "1";
    return () => { delete document.body.dataset.sketch; };
  }, [isAdmin]);

  if (isAdmin) return <>{children}</>;
  return (
    <LangProvider>
      <div className="sketch-shell">
        <AuthBoundary>{children}</AuthBoundary>
      </div>
    </LangProvider>
  );
}
