"use client";

// 세션 컨텍스트 — 정책: 열람은 로그인 없이 자유, 상호작용(하트·댓글·업로드·마이)만 로그인 필수.
// 상호작용 지점은 requireLogin()으로 게이트하고, 미로그인 시 로그인 유도 모달을 띄운다.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ssoLogin } from "@/lib/sso-client";
import LoginPrompt from "./LoginPrompt";

type Member = { display_name: string; avatar_url: string | null };
type SessionValue = {
  signedIn: boolean;
  member: Member | null; // 실제 멤버 계정일 때만 (멤버 하트/픽 권한)
  nickname: string;
  loading: boolean;
  refresh: () => Promise<boolean>;
  requireLogin: () => boolean; // 로그인돼 있으면 true, 아니면 모달 열고 false
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

  const refresh = useCallback(async () => {
    try {
      const me = await fetch("/api/stage/me").then((r) => r.json());
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

  const requireLogin = useCallback(() => {
    if (signedIn) return true;
    setPrompt(true);
    return false;
  }, [signedIn]);

  return (
    <Ctx.Provider value={{ signedIn, member, nickname, loading, refresh, requireLogin }}>
      {children}
      {prompt && (
        <LoginPrompt
          onClose={() => setPrompt(false)}
          onDone={async () => {
            setPrompt(false);
            await refresh();
          }}
        />
      )}
    </Ctx.Provider>
  );
}
