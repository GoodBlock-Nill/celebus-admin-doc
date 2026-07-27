"use client";

import { useEffect, useRef, useState } from "react";
import Home from "./Home";
import Match3Game from "./Match3Game";
import Leaderboard from "./Leaderboard";
import Shop from "./Shop";
import MoreMenu, { type MoreDest } from "./MoreMenu";
import MyPage from "./MyPage";
import MyItems from "./MyItems";
import GameSettings from "./GameSettings";
import ThemeSettings from "./ThemeSettings";
import ConfigTheme from "./ConfigTheme";
import SsoGate from "./SsoGate";
import { dailySeed } from "@/lib/match3";
import { playMusic, stopMusic } from "@/lib/music";
import { ssoLogin, hasLocalSession, markLocalSession } from "@/lib/auth-api";
import { track } from "@/lib/track";
import { setNick, setAvatar, startMatch } from "@/lib/game-api";
import { GAME_CONFIG } from "@/lib/game-config";
import { useLang } from "./LangProvider";

type Screen =
  | { name: "home" }
  | { name: "game"; mode: "free" | "daily"; seed: number; matchId: string | null }
  | { name: "leaderboard" }
  | { name: "shop" }
  | { name: "more" }
  | { name: "mypage" }
  | { name: "items" }
  | { name: "settings" }
  | { name: "theme" };

export default function AppShell() {
  const { t } = useLang();
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  // SSO 게이트 — CELEBUS 본앱 세션을 서버가 검증해 자동로그인. 자체 가입/로그인 없음.
  // 네트워크/서버 실패(offline)로 판정 불가할 땐 로컬 세션 힌트로 통과(기존 유저 오프라인 실행 보장).
  const [auth, setAuth] = useState<"checking" | "need" | "ok">("checking");
  useEffect(() => {
    track("visit"); // 퍼널: 방문 (기기당 일 1회)
    ssoLogin().then((p) => {
      if (p.signed_up && p.nickname) {
        setNick(p.nickname); // CELEBUS 프로필을 로컬 표시값과 동기화
        if (p.avatar) setAvatar(p.avatar);
        markLocalSession(true);
        setAuth("ok");
      } else if (p.offline && hasLocalSession()) {
        setAuth("ok");
      } else {
        track("gate_view"); // 퍼널: 본앱 로그인 게이트 노출
        setAuth("need");
      }
    });
  }, []);
  const go = (s: Screen) => setScreen(s);
  const home = () => setScreen({ name: "home" });
  const more = () => setScreen({ name: "more" });

  // 게임 시작 — 서버에 matchId+seed 발급 요청(점수 위조 방어). 발급 실패 시 로컬 시드로 언랭크 플레이.
  const startingRef = useRef(false);
  const startGame = async (mode: "free" | "daily") => {
    if (startingRef.current) return; // 더블탭 중복 발급 방지
    startingRef.current = true;
    const m = await startMatch(mode);
    startingRef.current = false;
    go({
      name: "game",
      mode,
      seed: m ? m.seed : mode === "daily" ? dailySeed() : Math.floor(Math.random() * 2 ** 31),
      matchId: m ? m.matchId : null,
    });
  };

  const navigateMore = (d: MoreDest) => setScreen({ name: d } as Screen);

  // PWA 하드웨어/브라우저 뒤로가기 → 홈 복귀(앱 종료 방지). 홈을 떠날 때 히스토리 1개 추가.
  const prevName = useRef<Screen["name"]>("home");
  useEffect(() => {
    const onPop = () => setScreen({ name: "home" });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (prevName.current === "home" && screen.name !== "home") {
      window.history.pushState(null, "");
    }
    prevName.current = screen.name;
  }, [screen.name]);

  // 로비 음악 — 게임 화면을 제외한 전 메뉴에서 유지(홈↔상점 등 이동 시 끊김 없음).
  // 인게임은 절차적 BGM(bgm.ts)이 담당 → 진입 시 페이드 아웃으로 자연 전환.
  useEffect(() => {
    if (screen.name === "game") stopMusic();
    else playMusic();
  }, [screen.name]);
  // 탭 숨김 시 정지, 복귀 시 재개(게임 화면 제외)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopMusic();
      else if (prevName.current !== "game") playMusic();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // 게이트 미통과 — 스플래시 → 가입/로그인 화면
  if (auth !== "ok") {
    return (
      <>
        <ConfigTheme />
        {auth === "checking" ? (
          <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="stage-bg h-full w-full" />
            </div>
            {GAME_CONFIG.home.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={GAME_CONFIG.home.logo} alt="CELEB MATCH" className="anim-logo-float w-[210px]" />
            ) : (
              <div className="logo-puffy font-display text-[36px] font-black">CELEB MATCH</div>
            )}
            <p className="mt-6 text-[12px] font-bold text-white/45">{t("auth_checking")}</p>
          </div>
        ) : (
          <div className="anim-fade-up">
            <SsoGate onDone={() => setAuth("ok")} />
          </div>
        )}
      </>
    );
  }

  let body: React.ReactNode;
  switch (screen.name) {
    case "game":
      body = (
        <Match3Game
          seed={screen.seed}
          mode={screen.mode}
          matchId={screen.matchId}
          onExit={home}
          onViewRanking={() => go({ name: "leaderboard" })}
        />
      );
      break;
    case "leaderboard":
      body = <Leaderboard onBack={home} />;
      break;
    case "shop":
      body = <Shop onBack={home} />;
      break;
    case "more":
      body = <MoreMenu onBack={home} onNavigate={navigateMore} />;
      break;
    case "mypage":
      body = <MyPage onBack={more} />;
      break;
    case "items":
      body = <MyItems onBack={more} onOpenShop={() => go({ name: "shop" })} />;
      break;
    case "settings":
      body = <GameSettings onBack={more} />;
      break;
    case "theme":
      body = <ThemeSettings onBack={more} />;
      break;
    default:
      body = (
        <Home
          onPlay={(mode) => void startGame(mode)}
          onOpenLeaderboard={() => go({ name: "leaderboard" })}
          onOpenShop={() => go({ name: "shop" })}
          onOpenMore={more}
        />
      );
  }

  return (
    <>
      <ConfigTheme />
      {/* 화면 전환 페이드 (게임 화면은 키가 'game'으로 고정돼 리트라이 시 재애니메이션 없음) */}
      <div key={screen.name} className="anim-fade-up">
        {body}
      </div>
    </>
  );
}
