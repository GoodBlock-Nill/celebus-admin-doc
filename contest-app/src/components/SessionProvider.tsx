"use client";

// 세션 컨텍스트 — 정책: 열람은 로그인 없이 자유, 상호작용(하트·댓글·업로드·마이)만 로그인 필수.
// 상호작용 지점은 requireLogin(pending?)으로 게이트. 미로그인 시 로그인 유도 모달을 띄우고,
// 로그인 성공 후 pending(원래 시도하려던 액션)을 자동 재실행해 "의도 복귀"를 보장한다.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ssoLogin } from "@/lib/sso-client";
import LoginPrompt from "./LoginPrompt";

type Member = { display_name: string; avatar_url: string | null };
type SessionValue = {
  signedIn: boolean;
  member: Member | null; // 실제 멤버 계정일 때만 (멤버 하트/픽 권한)
  nickname: string;
  loading: boolean;
  refresh: () => Promise<boolean>;
  // 로그인돼 있으면 true. 아니면 모달 열고 false 반환 + 로그인 성공 시 pending 자동 실행
  requireLogin: (pending?: () => void) => boolean;
};

const Ctx = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession must be used within SessionProvider");
  return c;
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState(false);
  // requireLogin이 항상 최신 로그인 상태를 읽도록 ref 병행 (모달 직후 stale 방지)
  const signedInRef = useRef(false);
  const pendingRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await fetch("/api/stage/me").then((r) => r.json());
      signedInRef.current = !!me.signed_in;
      setSignedIn(!!me.signed_in);
      setMember(me.member ?? null);
      setNickname(me.nickname ?? "");
      return !!me.signed_in;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await refresh();
      // 운영: 이미 CELEBUS 로그인 상태면 조용히 세션 발급 (열람만 하는 유저에겐 무해)
      if (!ok && process.env.NODE_ENV === "production") {
        const r = await ssoLogin();
        if (r.signed_in) await refresh();
      }
      setLoading(false);
    })();
  }, [refresh]);

  const requireLogin = useCallback((pending?: () => void) => {
    if (signedInRef.current) return true;
    pendingRef.current = pending ?? null;
    setPrompt(true);
    return false;
  }, []);

  return (
    <Ctx.Provider value={{ signedIn, member, nickname, loading, refresh, requireLogin }}>
      {children}
      {prompt && (
        <LoginPrompt
          onClose={() => {
            pendingRef.current = null;
            setPrompt(false);
          }}
          onDone={async () => {
            setPrompt(false);
            const ok = await refresh();
            const fn = pendingRef.current;
            pendingRef.current = null;
            // 로그인 성공 시 원래 시도하려던 액션 재실행 (하트·댓글·투표·업로드 복귀)
            if (ok && fn) fn();
          }}
        />
      )}
    </Ctx.Provider>
  );
}
