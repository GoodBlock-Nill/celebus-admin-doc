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
import { dailySeed } from "@/lib/match3";

type Screen =
  | { name: "home" }
  | { name: "game"; mode: "free" | "daily"; seed: number }
  | { name: "leaderboard" }
  | { name: "shop" }
  | { name: "more" }
  | { name: "mypage" }
  | { name: "items" }
  | { name: "settings" }
  | { name: "theme" };

export default function AppShell() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const go = (s: Screen) => setScreen(s);
  const home = () => setScreen({ name: "home" });
  const more = () => setScreen({ name: "more" });

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

  let body: React.ReactNode;
  switch (screen.name) {
    case "game":
      body = (
        <Match3Game
          seed={screen.seed}
          mode={screen.mode}
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
          onPlay={(mode) =>
            go({
              name: "game",
              mode,
              seed: mode === "daily" ? dailySeed() : Math.floor(Math.random() * 2 ** 31),
            })
          }
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
