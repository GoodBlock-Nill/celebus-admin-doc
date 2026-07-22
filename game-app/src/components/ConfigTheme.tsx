"use client";

// 게임 설정(GAME_CONFIG)의 테마 색을 런타임 CSS 변수로 주입.
// → 배경·CTA 색이 설정에서 나오므로, 추후 관리자에서 색을 바꾸면 그대로 반영된다.
import { useEffect } from "react";
import { GAME_CONFIG } from "@/lib/game-config";
import { getThemePrimary, applyAccent } from "@/lib/game-api";

export default function ConfigTheme() {
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--color-primary", GAME_CONFIG.theme.primary);
    r.setProperty("--color-bg", GAME_CONFIG.theme.background);
    r.setProperty("--color-surface-0", GAME_CONFIG.theme.background);
    // 사용자 강조색 오버라이드 (테마설정)
    const userAccent = getThemePrimary();
    if (userAccent) applyAccent(userAccent);
  }, []);
  return null;
}
