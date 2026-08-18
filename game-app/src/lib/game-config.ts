// V01D POP — 게임 설정 중앙화.
// ⚠️ 여기 값들이 "추후 관리자 화면에서 변경할 대상"이다. 지금은 코드 기본값이지만,
//    나중에 Supabase `game_config`에서 읽어와 이 객체를 오버라이드하면 관리자화 완료.
//    (문구/타이틀/온보딩 텍스트는 i18n.ts(ko/en/ja)에 중앙화 → 관리자화 시 DB 문구 오버레이)
import { Bomb, Rows3, Shuffle, Clock, type LucideIcon } from "lucide-react";
import { COLORS } from "./match3";

// glyph = 이모지 폴백. img = 타일 아이콘(악기/스타). cover=true면 배경 baked 아트라 tile을 꽉 채움(object-cover), 아니면 컷아웃 중앙 배치(object-contain).
export type TileSkin = { glyph: string; bg: string; img?: string; cover?: boolean };
export type ItemType = "bomb" | "line" | "shuffle" | "time";
// 상점 판매 품목 = 게임 아이템 + 하트(일반 매치 이어하기)
export type ShopItemType = ItemType | "heart";
// 데일리 미션 종류 — 모두 game_scores 당일 집계로 검증 가능한 지표
export type MissionId = "plays" | "score" | "level" | "high" | "item" | "normal";
// price = 상점 표시용(CELEB Point). 실제 과금은 서버 game_item_catalog가 권위 — 값 동기 유지 필요.
export type ItemDef = { type: ItemType; icon: LucideIcon; labelKey: string; start: number; price: number };
export type ThemePreset = { id: string; label: string; primary: string };
// 랭킹 프로필 아바타. id를 game_scores.avatar에 저장 → 클라이언트가 id로 렌더.
// img가 있으면 배경색 위 아이콘 이미지, 없으면 glyph(이모지). 업로드 프사(URL)는 avatar 값에 URL 직접 저장.
export type AvatarDef = { id: string; glyph: string; bg: string; img?: string };

export interface GameConfig {
  theme: { primary: string; background: string }; // CTA·포인트 / 배경 색
  mascot: string; // 메인 이미지 (이모지 또는 추후 업로드 이미지 URL)
  tiles: TileSkin[]; // 타일 디자인 (개수 = COLORS)
  items: ItemDef[]; // 아이템 버튼 (아이콘·라벨키·시작 개수·상점 가격)
  avatars: AvatarDef[]; // 랭킹 프로필 아바타 세트 (관리자화 대상)
  themePresets: ThemePreset[]; // 강조색 프리셋 (테마설정)
  // 라운드 길이 / 시간+ 상한 / 유휴 힌트 대기 초(0=끔) / 시간+ 아이템 추가 초 — 관리자 튜닝
  game: { seconds: number; maxSeconds: number; hintSec: number; timeItemSec: number };
  // 4매치(라인)·5매치(컬러밤)·교차 매치(광역) 즉시 보너스 점수 — 관리자 튜닝
  scoring: { bonus4: number; bonus5: number; bonusCross: number; bonusSquare: number };
  // 사운드 기본 on/off·마스터 볼륨(0~1) / BGM 기본 on/off·볼륨 / 홈(로비) 음악 볼륨 — 관리자 튜닝
  audio: { enabled: boolean; volume: number; bgm: boolean; bgmVolume: number; homeVolume: number };
  // 스페셜 타일 표시 이미지 슬롯(URL) — 없으면 CSS 오버레이 폴백. 관리자 교체.
  //   lineH=가로 스트라이프 / lineV=세로 스트라이프(기본은 CSS 오버레이) / area / color
  specials: { lineH?: string; lineV?: string; area?: string; color?: string };
  // 후반 점수 배율 곡선(스코어어택 '막판 폭발' 훅) + 연쇄 가속(체인당 딜레이 배수·하한 ms) — 관리자 튜닝
  pacing: { frenzySec: number; frenzyMul: number; rushSec: number; rushMul: number; cascadeAccel: number; cascadeMinMs: number };
  // 레벨 진행 — 레벨 L 클리어 목표 = baseTarget + (L-1)*targetStep, 달성 시 +bonusSec — 관리자 튜닝
  levels: { baseTarget: number; targetStep: number; bonusSec: number };
  // 데일리 출석 보상 — 보상 = base + streakStep*(min(streak,maxStreakDays)-1) — 관리자 튜닝
  daily: { base: number; streakStep: number; maxStreakDays: number };
  // 게임 플레이 BGM 트랙 목록 — 랜덤 재생, 곡명은 헤더 표시. 관리자 교체(배열 = 통째 교체)
  bgmTracks: { url: string; title: string; artist?: string }[];
  // 데일리 미션 목표·보상 (KST 일 리셋) — 관리자 튜닝
  // 데일리 미션 — 풀에서 매일 count개 로테이션(KST 날짜 결정론). id별 목표·보상 CP. 관리자 튜닝.
  missions: { count: number; pool: { id: MissionId; goal: number; cp: number }[] };
  // 주간 랭킹 보상 — weeklyTop: 인덱스 = 순위-1 (CP). weeklyTickets: 순위 구간별 가챠 이용권(무상) + others(구간 밖 기록 보유자 전원 지급 장수).
  //   ticketPrice: 유상 이용권 상점 가격(CP). 두 모드 각각 지급, 수령 시점에 적용(소급 주의) — 관리자 튜닝(전용 폼)
  rewards: {
    weeklyTop: number[];
    weeklyTickets: { tiers: { from: number; to: number; tickets: number }[]; others: number };
    ticketPrice: number;
    ticketDailyBuyCap: number; // 드로우 티켓 구매 일일 한도(KST, 0=무제한) — 헤비 소진 완화
  };
  // 럭키드로우 재화 카드 기본 이미지 — 풀 행에 개별 이미지가 없을 때 재화 종류별로 재사용 (관리자 업로드)
  gachaCards: Partial<Record<"cp" | "heart" | "bomb" | "line" | "shuffle" | "time", string>>;
  // 이어하기 하트 (일반 매치 전용) — 판당 기본 start개 + 상점 구매 보유분. slots=표시 슬롯 수, maxPerRun=판당 사용 상한(랭킹 공정성), price=상점 폴백 표시가(권위는 카탈로그) — 관리자 튜닝
  hearts: { start: number; slots: number; maxPerRun: number; continueSec: number; price: number };
  // CELEB PASS 시즌 누적 트랙(Wave A) — 판당 XP = xpBase + floor(min(경과초,xpSecCap)/xpSecDiv), 성과 무관.
  //   레벨당 perLevel XP, 최대 maxLevel. 보상: 기본 defaultCp CP + milestones(레벨별 CP·하트, 고급 JSON) — 관리자 튜닝
  pass: { xpBase: number; xpSecCap: number; xpSecDiv: number; perLevel: number; maxLevel: number; defaultCp: number; milestones: { level: number; cp: number; hearts?: number }[] };
  // 순항 구간(피로감 완화, Wave D) — 웜업·스트릭 보너스는 서버(game_start_match)가 판정, 라스트 스퍼트는 클라 판정. 0=끔 — 관리자 튜닝
  //   warmupSec: 오늘 첫 일반 매치 시작 시간 보너스 / streakT*: 출석 연속 일수별 시작 보너스
  //   graceThreshold: 시간 종료 시 레벨 진행도가 이 이상이면 / graceSec: 무료 +초 / gracePerRun: 판당 횟수
  coasting: { warmupSec: number; streakT1Days: number; streakT1Sec: number; streakT2Days: number; streakT2Sec: number; graceThreshold: number; graceSec: number; gracePerRun: number };
  // 홈 아트 에셋 슬롯(URL) — 없으면 CSS/텍스트 폴백. music = 로비 배경음악(게임 화면 제외 전 메뉴 재생). 관리자가 교체.
  home: { background?: string; logo?: string; hero?: string; music?: string; beta?: boolean; parentAppUrl?: string };
  // 게임 플레이 화면 아트 슬롯(URL) — 스테이지 배경. 없으면 CSS 폴백. 관리자 교체.
  match: { background?: string };
  // 점수 위조 방어 튜너블 — 레벨당 최소 시간(초)·초당 점수율 상한(초과=거부)·의심 임계(초과=플래그).
  //   서버 리플레이: replayEnforceModes=거부 활성 모드(자동 관리), replayAutoEnable=자동 승격 on/off,
  //   replayMinGamesPerMode=승격 최소 관찰 게임 수, replayMaxMismatchPct=승격 허용 명백조작률(%). 관리자 조정.
  integrity: {
    minSecPerLevel: number;
    maxScorePerSec: number;
    suspectScorePerSec: number;
    replayEnforceModes: string[];
    replayAutoEnable: boolean;
    replayMinGamesPerMode: number;
    replayMaxMismatchPct: number;
  };
}

export const GAME_CONFIG: GameConfig = {
  theme: {
    primary: "#8b5cf6",
    background: "#0b0b0d",
  },
  mascot: "💜",
  tiles: [
    { glyph: "🎸", img: "/tiles/guitar.png", bg: "#e04b4b" }, // 기타 · 레드
    { glyph: "🥁", img: "/tiles/drum.png", bg: "#e79a3a" }, // 드럼 · 앰버
    { glyph: "🎵", img: "/tiles/bass.png", bg: "#43b85e" }, // 베이스 · 그린
    { glyph: "🎹", img: "/tiles/keyboard.png", bg: "#4f86ef" }, // 키보드 · 블루
    { glyph: "🎤", img: "/tiles/microphone.png", bg: "#7c4ddb" }, // 마이크 · 딥 바이올렛(키보드 블루와 판별 거리 확보)
    { glyph: "⭐", img: "/tiles/star.png", bg: "#e06fb0", cover: true }, // 스타 · 핑크(배경 baked)
  ],
  items: [
    { type: "bomb", icon: Bomb, labelKey: "item_bomb", start: 1, price: 100 },
    { type: "line", icon: Rows3, labelKey: "item_line", start: 1, price: 100 },
    { type: "shuffle", icon: Shuffle, labelKey: "item_shuffle", start: 1, price: 60 },
    { type: "time", icon: Clock, labelKey: "item_time", start: 1, price: 80 },
  ],
  avatars: [
    // 기본 아바타 6종 (V01D 악기 테마) — 가입·프로필 선택지는 앞 6개(signupAvatars() 참조)
    { id: "guitar", glyph: "🎸", img: "/tiles/guitar.png", bg: "#e04b4b" },
    { id: "drum", glyph: "🥁", img: "/tiles/drum.png", bg: "#e79a3a" },
    { id: "bass", glyph: "🎵", img: "/tiles/bass.png", bg: "#43b85e" },
    { id: "keyboard", glyph: "🎹", img: "/tiles/keyboard.png", bg: "#4f86ef" },
    { id: "mic", glyph: "🎤", img: "/tiles/microphone.png", bg: "#7c4ddb" },
    { id: "starface", glyph: "⭐", img: "/tiles/star.png", bg: "#e06fb0" },
    // 레거시 이모지 아바타 (기존 유저 렌더 호환 — 신규 선택지에는 미노출)
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
  game: { seconds: 60, maxSeconds: 90, hintSec: 5, timeItemSec: 10 },
  // bonus4: 4매치(스트라이프) 생성 보너스 — 스트라이프는 십자보다 위력이 약해 생성 보상을 상향(난이도 정합)
  // bonusSquare: 2×2 정사각 매치 즉시 보너스 — 가장 쉬운 4매치라 bonus4보다 낮게
  scoring: { bonus4: 40, bonus5: 50, bonusCross: 30, bonusSquare: 15 },
  audio: { enabled: true, volume: 0.22, bgm: true, bgmVolume: 0.1, homeVolume: 0.1 },
  specials: { lineH: "/tiles/sp-lineH.png", lineV: "/tiles/sp-lineV.png", area: "/tiles/sp-area.png", color: "/tiles/sp-color.png" },
  pacing: { frenzySec: 15, frenzyMul: 1.5, rushSec: 5, rushMul: 2, cascadeAccel: 0.88, cascadeMinMs: 130 },
  levels: { baseTarget: 800, targetStep: 500, bonusSec: 12 },
  daily: { base: 50, streakStep: 10, maxStreakDays: 7 },
  bgmTracks: [
    { url: "/bgm/game/rockrock.m4a", title: "ROCKROCK (樂樂)", artist: "V01D" },
    { url: "/bgm/game/luna.m4a", title: "LUNA", artist: "V01D" },
    { url: "/bgm/game/the-one.m4a", title: "The One", artist: "V01D" },
    { url: "/bgm/game/tug-of-war.m4a", title: "Tug of War", artist: "V01D" },
  ],
  missions: {
    count: 3,
    pool: [
      { id: "plays", goal: 3, cp: 20 }, // 오늘 N판
      { id: "score", goal: 2000, cp: 20 }, // 오늘 누적 점수
      { id: "level", goal: 3, cp: 30 }, // 최고 레벨 도달
      { id: "high", goal: 1500, cp: 20 }, // 한 판 최고 점수
      { id: "item", goal: 2, cp: 20 }, // 아이템 매치 N판
      { id: "normal", goal: 2, cp: 20 }, // 일반 매치 N판
    ],
  },
  rewards: {
    weeklyTop: [100, 70, 50, 30, 30, 20, 20, 20, 20, 20],
    weeklyTickets: {
      tiers: [
        { from: 1, to: 1, tickets: 10 },
        { from: 2, to: 5, tickets: 5 },
        { from: 6, to: 10, tickets: 3 },
      ],
      others: 1,
    },
    ticketPrice: 500,
    ticketDailyBuyCap: 10,
  },
  gachaCards: {},
  hearts: { start: 1, slots: 6, maxPerRun: 3, continueSec: 30, price: 5 },
  coasting: { warmupSec: 15, streakT1Days: 3, streakT1Sec: 5, streakT2Days: 7, streakT2Sec: 10, graceThreshold: 0.7, graceSec: 5, gracePerRun: 1 },
  pass: {
    xpBase: 10,
    xpSecCap: 120,
    xpSecDiv: 12,
    perLevel: 100,
    maxLevel: 30,
    defaultCp: 10,
    milestones: [
      { level: 5, cp: 30, hearts: 1 },
      { level: 10, cp: 30, hearts: 1 },
      { level: 15, cp: 30, hearts: 1 },
      { level: 20, cp: 50, hearts: 1 },
      { level: 25, cp: 50, hearts: 2 },
      { level: 30, cp: 100, hearts: 2 },
    ],
  },
  // beta: 베타 뱃지 노출 — 정식 전환 시 관리자 설정(home.beta=false)으로 배포 없이 제거
  // parentAppUrl: 홈의 'CELEBUS로' 버튼 목적지 — 관리자 교체 가능
  home: { background: "/home-bg.png", logo: "/celeb-title.png", music: "/bgm/rockrock-v2.mp3", beta: true, parentAppUrl: "https://app.celebus.xyz" },
  match: { background: "/match-bg.png" },
  integrity: {
    minSecPerLevel: 5,
    maxScorePerSec: 800,
    suspectScorePerSec: 500,
    replayEnforceModes: [], // 자동 관리 — 비어있으면 전체 섀도우(거부 없음)
    replayAutoEnable: true,
    replayMinGamesPerMode: 200,
    replayMaxMismatchPct: 1,
  },
};

// 기본 아바타 (미선택·미해석 폴백) — 함수로 노출해 부트 오버라이드 반영(모듈 상수 고착 방지)
export function defaultAvatar(): AvatarDef {
  return GAME_CONFIG.avatars[0];
}

// 가입·프로필 화면의 기본 아바타 선택지 6종 (배열 앞 6개)
export function signupAvatars(): AvatarDef[] {
  return GAME_CONFIG.avatars.slice(0, 6);
}

// 서버 오버라이드를 GAME_CONFIG에 깊은 병합(관리자 튜닝). items는 제외(icon이 코드 컴포넌트).
//  · 객체(theme/game/audio/pacing/levels/daily): 키 병합
//  · 배열(tiles/avatars/themePresets)·스칼라(mascot): 교체
type ConfigOverride = Partial<Omit<GameConfig, "items">>;
export function mergeRemoteConfig(override: ConfigOverride | null | undefined): void {
  if (!override || typeof override !== "object") return;
  const obj = ["theme", "game", "audio", "pacing", "levels", "daily", "home", "match", "specials", "scoring", "hearts", "rewards", "gachaCards", "missions", "integrity", "coasting", "pass"] as const;
  for (const k of obj) {
    const v = override[k];
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(GAME_CONFIG[k], v);
  }
  if (Array.isArray(override.tiles) && override.tiles.length) GAME_CONFIG.tiles = override.tiles;
  if (Array.isArray(override.bgmTracks) && override.bgmTracks.length) GAME_CONFIG.bgmTracks = override.bgmTracks;
  if (Array.isArray(override.avatars) && override.avatars.length) GAME_CONFIG.avatars = override.avatars;
  if (Array.isArray(override.themePresets) && override.themePresets.length) GAME_CONFIG.themePresets = override.themePresets;
  if (typeof override.mascot === "string") GAME_CONFIG.mascot = override.mascot;
}

// 타일 세트 길이는 게임 색 수와 반드시 일치 (개발 안전장치)
if (GAME_CONFIG.tiles.length !== COLORS) {
  // eslint-disable-next-line no-console
  console.warn(`[game-config] tiles(${GAME_CONFIG.tiles.length}) !== COLORS(${COLORS})`);
}
