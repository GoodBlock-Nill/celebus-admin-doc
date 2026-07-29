"use client";

// 로그인/비로그인 전환 (dev 전용) — 로그인·비로그인 UI를 손쉽게 확인. 프로덕션에선 렌더 안 됨.
// 로그인: dev SSO(uid mock)로 세션 발급 / 로그아웃: 세션 파기. 클릭 후 새로고침으로 반영.
import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { useSession } from "./SessionProvider";

export default function DevAuthToggle() {
  const { signedIn } = useSession();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);
  if (process.env.NODE_ENV === "production" || !mounted) return null;

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (signedIn) {
        await fetch("/api/auth/logout", { method: "POST", headers: { Origin: location.origin } });
      } else {
        await fetch("/api/auth/sso", {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: location.origin },
          body: JSON.stringify({ uid: "dev-user", nickname: "dev.user" }),
        });
      }
      window.location.reload();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title="로그인 / 비로그인 전환 — dev 전용"
      className="fixed bottom-[8.5rem] left-3 z-40 flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 text-[11px] font-bold text-fg shadow-lg backdrop-blur active:scale-95 disabled:opacity-50"
    >
      {signedIn ? <LogOut className="h-3.5 w-3.5 text-primary" /> : <LogIn className="h-3.5 w-3.5 text-subtle" />}
      {signedIn ? "로그인됨" : "비로그인"}
    </button>
  );
}
