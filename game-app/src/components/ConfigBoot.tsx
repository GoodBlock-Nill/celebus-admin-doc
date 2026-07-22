"use client";

import { useEffect, useState } from "react";
import { fetchRemoteConfig } from "@/lib/game-api";

// 부트 게이트 — 서버 config 오버라이드를 GAME_CONFIG에 병합한 뒤 children(게임) 렌더.
// 병합이 게임 컴포넌트 마운트보다 먼저 끝나도록 게이트. 실패/지연 시 2초 타임아웃 후 기본값으로 진행.
export default function ConfigBoot({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const timer = setTimeout(finish, 2000); // 네트워크 죽어도 게임 진입 보장
    fetchRemoteConfig().finally(() => {
      clearTimeout(timer);
      finish();
    });
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark.svg" alt="CELEBUS" className="h-4 w-auto animate-pulse opacity-70" />
      </div>
    );
  }
  return <>{children}</>;
}
