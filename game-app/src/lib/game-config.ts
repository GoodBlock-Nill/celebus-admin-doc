// V01D POP — 게임 설정 중앙화.
// ⚠️ 여기 값들이 "추후 관리자 화면에서 변경할 대상"이다. 지금은 코드 기본값이지만,
//    나중에 Supabase `game_config`에서 읽어와 이 객체를 오버라이드하면 관리자화 완료.
//    (문구/타이틀/온보딩 텍스트는 i18n.ts(ko/en/ja)에 중앙화 → 관리자화 시 DB 문구 오버레이)
import { Bomb, Rows3, Shuffle, Clock, type LucideIcon } from "lucide-react";
import { COLORS } from "./match3";

export type TileSkin = { glyph: string; bg: string };
export type ItemType = "bomb" | "line" | "shuffle" | "time";
// price = 상점 표시용(CELEB Point). 실제 과금은 서버 game_item_catalog가 권위 — 값 동기 유지 필요.
export type ItemDef = { type: ItemType; icon: LucideIcon; labelKey: string; start: number; price: number };
export type ThemePreset = { id: string; label: string; primary: string };
// 랭킹 프로필 아바타 (무로그인). id를 game_scores.avatar에 저장 → 클라이언트가 id로 렌더.
// 추후 V01D 멤버·테마 아바타는 glyph 대신 이미지 URL로 교체 가능(소셜 로그인 시 프사 URL도 같은 컬럼 수용).
export type AvatarDef = { id: string; glyph: string; bg: string };

export interface GameConfig {
  theme: { primary: string; background: string }; // CTA·포인트 / 배경 색
  mascot: string; // 메인 이미지 (이모지 또는 추후 업로드 이미지 URL)
  tiles: TileSkin[]; // 타일 디자인 (개수 = COLORS)
  items: ItemDef[]; // 아이템 버튼 (아이콘·라벨키·시작 개수·상점 가격)
  avatars: AvatarDef[]; // 랭킹 프로필 아바타 세트 (관리자화 대상)
  themePresets: ThemePreset[]; // 강조색 프리셋 (테마설정)
  game: { seconds: number; maxSeconds: number }; // 라운드 길이 / 시간+ 아이템으로 도달 가능한 상한
  audio: { enabled: boolean; volume: number }; // 사운드 기본 on/off·마스터 볼륨(0~1) — 관리자 튜닝
  // 후반 점수 배율 곡선(스코어어택 '막판 폭발' 훅) — 관리자 튜닝
  pacing: { frenzySec: number; frenzyMul: number; rushSec: number; rushMul: number };
  // 레벨 진행 — 레벨 L 클리어 목표 = baseTarget + (L-1)*targetStep, 달성 시 +bonusSec — 관리자 튜닝
  levels: { baseTarget: number; targetStep: number; bonusSec: number };
  // 데일리 출석 보상 — 보상 = base + streakStep*(min(streak,maxStreakDays)-1) — 관리자 튜닝
  daily: { base: number; streakStep: number; maxStreakDays: number };
}

export const GAME_CONFIG: GameConfig = {
  theme: {
    primary: "#8b5cf6",
    background: "#0b0b0d",
  },
  mascot: "💜",
  tiles: [
    { glyph: "💜", bg: "#8b5cf6" },
    { glyph: "🩷", bg: "#f472b6" },
    { glyph: "💙", bg: "#60a5fa" },
    { glyph: "⭐", bg: "#fbbf24" },
    { glyph: "🍀", bg: "#34d399" },
    { glyph: "🔥", bg: "#fb923c" },
  ],
  items: [
    { type: "bomb", icon: Bomb, labelKey: "item_bomb", start: 1, price: 100 },
    { type: "line", icon: Rows3, labelKey: "item_line", start: 1, price: 100 },
    { type: "shuffle", icon: Shuffle, labelKey: "item_shuffle", start: 1, price: 60 },
    { type: "time", icon: Clock, labelKey: "item_time", start: 1, price: 80 },
  ],
  avatars: [
    { id: "heart", glyph: "💜", bg: "#8b5cf6" },
    { id: "pink", glyph: "🩷", bg: "#f472b6" },
    { id: "star", glyph: "⭐", bg: "#fbbf24" },
    { id: "fire", glyph: "🔥", bg: "#fb923c" },
    { id: "bunny", glyph: "🐰", bg: "#f9a8d4" },
    { id: "cat", glyph: "🐱", bg: "#fcd34d" },
    { id: "fox", glyph: "🦊", bg: "#fb7185" },
    { id: "crown", glyph: "👑", bg: "#facc15" },
    { id: "ribbon", glyph: "🎀", bg: "#f472b6" },
    { id: "moon", glyph: "🌙", bg: "#60a5fa" },
    { id: "cherry", glyph: "🍒", bg: "#f87171" },
    { id: "bubble", glyph: "🫧", bg: "#5eead4" },
  ],
  themePresets: [
    { id: "violet", label: "바이올렛", primary: "#8b5cf6" },
    { id: "pink", label: "핑크", primary: "#ec4899" },
    { id: "blue", label: "블루", primary: "#3b82f6" },
    { id: "mint", label: "민트", primary: "#10b981" },
    { id: "orange", label: "오렌지", primary: "#f97316" },
  ],
  game: { seconds: 60, maxSeconds: 90 },
  audio: { enabled: true, volume: 0.22 },
  pacing: { frenzySec: 15, frenzyMul: 1.5, rushSec: 5, rushMul: 2 },
  levels: { baseTarget: 800, targetStep: 500, bonusSec: 12 },
  daily: { base: 50, streakStep: 10, maxStreakDays: 7 },
};

// 기본 아바타 (미선택·미해석 폴백) — 함수로 노출해 부트 오버라이드 반영(모듈 상수 고착 방지)
export function defaultAvatar(): AvatarDef {
  return GAME_CONFIG.avatars[0];
}

// 서버 오버라이드를 GAME_CONFIG에 깊은 병합(관리자 튜닝). items는 제외(icon이 코드 컴포넌트).
//  · 객체(theme/game/audio/pacing/levels/daily): 키 병합
//  · 배열(tiles/avatars/themePresets)·스칼라(mascot): 교체
type ConfigOverride = Partial<Omit<GameConfig, "items">>;
export function mergeRemoteConfig(override: ConfigOverride | null | undefined): void {
  if (!override || typeof override !== "object") return;
  const obj = ["theme", "game", "audio", "pacing", "levels", "daily"] as const;
  for (const k of obj) {
    const v = override[k];
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(GAME_CONFIG[k], v);
  }
  if (Array.isArray(override.tiles) && override.tiles.length) GAME_CONFIG.tiles = override.tiles;
  if (Array.isArray(override.avatars) && override.avatars.length) GAME_CONFIG.avatars = override.avatars;
  if (Array.isArray(override.themePresets) && override.themePresets.length) GAME_CONFIG.themePresets = override.themePresets;
  if (typeof override.mascot === "string") GAME_CONFIG.mascot = override.mascot;
}

// 타일 세트 길이는 게임 색 수와 반드시 일치 (개발 안전장치)
if (GAME_CONFIG.tiles.length !== COLORS) {
  // eslint-disable-next-line no-console
  console.warn(`[game-config] tiles(${GAME_CONFIG.tiles.length}) !== COLORS(${COLORS})`);
}
