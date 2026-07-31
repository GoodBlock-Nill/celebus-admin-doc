"use client";

// dev 전용 — 상시 로그인. 접속 시 자동으로 "접속자별 고유 팬 계정"으로 로그인한다.
// 브라우저마다 고유 uid를 localStorage에 보존해 멀티 테스터가 각자 독립 신원을 갖는다.
// 프로덕션에서는 절대 동작하지 않는다(렌더/로그인 모두 skip).
import { useEffect, useRef } from "react";
import { useSession } from "./SessionProvider";

export default function DevAutoLogin() {
  const { signedIn, loading, refresh } = useSession();
  const tried = useRef(false);

  useEffect(() => {
    // 데모/개발 환경에서만 상시 로그인. 실 프로덕션(플래그 없음)은 비활성.
    // NEXT_PUBLIC_DEMO_MODE=1 이면 Vercel 배포(NODE_ENV=production)에서도 동작 → 배포형 dev 지원.
    const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "1" || process.env.NODE_ENV !== "production";
    if (!demo) return;
    if (loading || signedIn || tried.current) return; // 세션 확인 전·이미 로그인·재시도 방지
    tried.current = true;
    void (async () => {
      // 접속자별 고유 uid — 브라우저 로컬에 보존(재방문 시 동일 신원 유지)
      let uid = "";
      try {
        uid = localStorage.getItem("dev_demo_uid") || "";
      } catch {
        /* noop */
      }
      if (!uid) {
        uid = `demo-${Math.random().toString(36).slice(2, 10)}`;
        try {
          localStorage.setItem("dev_demo_uid", uid);
        } catch {
          /* noop */
        }
      }
      try {
        await fetch("/api/auth/sso", {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: location.origin },
          body: JSON.stringify({ uid, nickname: `게스트-${uid.slice(-4)}` }),
        });
        await refresh();
      } catch {
        /* 자동 로그인 실패는 조용히 무시 — 수동 상호작용 시 로그인 유도로 폴백 */
      }
    })();
  }, [signedIn, loading, refresh]);

  return null;
}
