"use client";

// V01D POP — 매치3 게임 (드래그/탭-탭 스왑 + 낙하/클리어 애니메이션 + 온보딩/카운트다운).
// 타일 id 기반 렌더: 같은 id가 새 셀로 이동 → CSS 트랜지션으로 부드러운 낙하·스왑.
// 타이머는 벽시계 앵커(백그라운드 스로틀·기권 confirm 중에도 실제 경과 기준 — 랭킹 공정성).
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { X, VolumeX } from "lucide-react";
import { toast } from "sonner";
import {
  SIZE,
  COLORS,
  idx,
  rc,
  mulberry32,
  makeBoard,
  findMatches,
  findMove,
  hasMove,
  reshuffle,
  areAdjacent,
  bombCells,
  lineCells,
  rowCells,
  colCells,
  areaCells,
  colorCells,
  comboCells,
  isLineKind,
  analyzeMatches,
  type SpecialKind,
} from "@/lib/match3";
import { GAME_CONFIG, type ItemType } from "@/lib/game-config";
import {
  submitScore,
  getNick,
  getAvatar,
  getOnboarding,
  getSeenIntro,
  setSeenIntro,
  fetchAccount,
  consumeItems,
  vibrate,
  type RankInfo,
  type Inventory,
} from "@/lib/game-api";
import {
  unlockAudio,
  sfxMatch,
  sfxItem,
  sfxInvalid,
  sfxCountdown,
  sfxGo,
  sfxGameOver,
  sfxNewBest,
  sfxPower,
  sfxSpecial,
  sfxLevelUp,
  sfxTick,
  sfxFever,
  sfxCombo,
} from "@/lib/sfx";
import { startBgm, stopBgm, setBgmFever, getBgmTrack, bgmEnabled, unlockBgm } from "@/lib/bgm";
import { track } from "@/lib/track";
import { useCountUp } from "@/lib/use-count-up";
import { useLang } from "./LangProvider";
import IntroModal from "./IntroModal";
import ResultModal from "./ResultModal";
import QuitConfirm from "./QuitConfirm";
import ContinueModal from "./ContinueModal";

// 콤보 단계별 응원 문구 (2연쇄부터)
const COMBO_WORDS = ["", "", "NICE!", "GREAT!", "COMBO!", "AMAZING!", "INCREDIBLE!", "UNREAL!"];

const DRAG_THRESHOLD = 12;
// 아이템 바 아이콘 = 상점과 동일한 일러스트(스테이지 톤 융화)
const ITEM_ART: Record<ItemType, string> = {
  bomb: "/items/item-bomb.png",
  line: "/items/item-line.png",
  shuffle: "/items/item-shuffle.png",
  time: "/items/item-time.png",
};
// ⚠️ config 값은 모듈 상수로 굳히지 말고 사용 시점에 GAME_CONFIG에서 읽기(부트 오버라이드 반영).
const targetOf = (level: number) => GAME_CONFIG.levels.baseTarget + (level - 1) * GAME_CONFIG.levels.targetStep; // 레벨 추가 목표
// 아이템 기본 지급 개수(config start). 두 모드 공통 기본 + 아이템 매치은 보유분 가산.
const baseOf = (t: ItemType): number => GAME_CONFIG.items.find((i) => i.type === t)?.start ?? 0;
const initialItems = (): Record<ItemType, number> =>
  Object.fromEntries(GAME_CONFIG.items.map((i) => [i.type, i.start])) as Record<ItemType, number>;

type Tile = { id: number; color: number; kind?: SpecialKind };
type Floater = { id: number; left: number; top: number; text: string; cls: string };
// W2 파편 파티클 — 셀 색으로 사방 튀는 조각(--dx/--dy px)
type Particle = { id: number; left: number; top: number; dx: number; dy: number; color: string };
type Phase = "intro" | "countdown" | "playing" | "continue" | "over"; // continue = 시간 종료 후 하트 이어하기 선택(일반 매치)
// 스페셜/아이템 발동 이펙트 (라인=빔 십자 / 광역·폭탄=링 / 컬러밤=플래시)
type FxKind = SpecialKind | "item-bomb" | "item-line";
type Fx = { id: number; type: "beamH" | "beamV" | "ring" | "flash"; row: number; col: number; span: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const colorsOf = (ts: (Tile | null)[]) => ts.map((t) => (t ? t.color : -1));

export default function Match3Game({
  seed,
  mode = "free",
  matchId = null,
  startBonus,
  onRetry,
  onExit,
  onGameOver,
  onViewRanking,
}: {
  seed: number;
  mode?: "free" | "daily";
  matchId?: string | null; // 서버 발급 matchId — 점수 제출 시 필수(위조 방어)
  startBonus?: { warmupSec: number; streakSec: number; streakDays: number }; // 순항 보너스(서버 판정) — 시작 시간 가산
  onRetry?: () => void; // 다시하기 — 부모에서 매치 재발급(matchId 1회용) 후 리마운트. 미지정 시 로컬 init 폴백(언랭크)
  onExit?: () => void;
  onGameOver?: (score: number) => void;
  onViewRanking?: () => void;
}) {
  const { t } = useLang();
  const rngRef = useRef<() => number>(mulberry32(seed));
  const nextId = useRef(1);
  const floaterId = useRef(1);
  const dragRef = useRef<{ cell: number; x: number; y: number } | null>(null);
  // 자유 플레이에서 사용한 아이템 누적(게임오버 시 서버 인벤토리 차감). 일일은 미사용.
  const usedRef = useRef<Record<ItemType, number>>({ bomb: 0, line: 0, shuffle: 0, time: 0 });
  // 자유모드 보유 인벤토리 스냅샷 — 플레이 시작 시 1회만 아이템 개수에 반영(비동기 setItems 레이스 방지).
  const invRef = useRef<Inventory>({});
  const timeLeftRef = useRef(GAME_CONFIG.game.seconds); // 비동기 resolve에서 최신 시간 참조(후반 배율)
  const endAtRef = useRef(0); // 벽시계 앵커 — 이 시각이 되면 시간 종료

  const [tiles, setTiles] = useState<(Tile | null)[]>([]);
  // 최신 보드 참조 — 버퍼된 스왑(flushBuffered)이 stale 클로저의 이전 보드로 실행되는 것을 방지
  const tilesRef = useRef<(Tile | null)[]>([]);
  const [clearing, setClearing] = useState<Set<number>>(new Set());
  const [spawnedIds, setSpawnedIds] = useState<Set<number>>(new Set());
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [fx, setFx] = useState<Fx[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0); // 이번 판 최대 연쇄(HUD 유휴 표시·결과 통계)
  // 이어하기 하트 (일반 매치 전용) — 판당 기본 start개 + 상점 구매 보유분(카운트다운 종료 시 1회 확정)
  const [hearts, setHearts] = useState(GAME_CONFIG.hearts.start);
  const heartsUsedRef = useRef(0); // 이번 판 사용 하트(기본 초과분만 서버 차감)
  const endReasonRef = useRef<"timeout" | "continue_declined">("timeout"); // 종료 사유 텔레메트리(밸런스 계측)
  const [prevBest, setPrevBest] = useState(0); // 게임오버 시점의 이전 최고 점수(결과 모달 대비 표기)
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.game.seconds);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // 핸들러·비동기 완료 시점의 최신 busy 참조(입력 버퍼링용)
  const bufferedRef = useRef<{ a: number; b: number } | null>(null); // 캐스케이드 중 예약된 드래그 스왑(마지막 1건)
  // 입력 로그(서버 리플레이 검증용, Step 2a 수집) — 스왑·아이템·이어하기 + 상대 타이밍(ms)
  const movesRef = useRef<{ t: number; k: string; a?: number; b?: number; c?: number }[]>([]);
  const matchStartRef = useRef(0);
  const logMove = (m: { k: string; a?: number; b?: number; c?: number }) => {
    if (movesRef.current.length < 3000) movesRef.current.push({ t: Date.now() - matchStartRef.current, ...m });
  };
  const [items, setItems] = useState<Record<ItemType, number>>(initialItems);
  const [pending, setPending] = useState<ItemType | null>(null);
  const [aim, setAim] = useState<number | null>(null); // 아이템 조준 셀(1차 탭 = 범위 프리뷰)
  const [selected, setSelected] = useState<number | null>(null); // 탭-탭 스왑 선택 셀
  const [hint, setHint] = useState<[number, number] | null>(null); // 유휴 힌트 스왑 쌍
  const [quitOpen, setQuitOpen] = useState(false);
  const bestKey = `cfg_best_${mode}`;
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [rank, setRank] = useState<RankInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 레벨 진행 — 누적 점수가 레벨 목표 도달 시 레벨업 + 보너스 시간
  const [level, setLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0); // 0~1 현재 레벨 진행도
  const levelRef = useRef(1);
  const levelStartRef = useRef(0); // 현재 레벨 시작 시점의 누적 점수
  const [levelBanner, setLevelBanner] = useState<{ n: number; key: number } | null>(null);
  const levelBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shake, setShake] = useState(false); // 무효 스왑·임팩트 화면 흔들림
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [comboFlash, setComboFlash] = useState<{ n: number; key: number; label?: string } | null>(null); // 콤보 응원 배너(label=메가콤보 전용 문구)
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feverBanner, setFeverBanner] = useState<{ mul: number; key: number } | null>(null); // 피버 진입 배너
  const feverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMulRef = useRef(1); // 피버 단계 진입 감지
  const [timeBonus, setTimeBonus] = useState<{ n: number; key: number } | null>(null); // +초 플라이업
  const timeBonusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 순항 구간(Wave D) — 시작 보너스 합(서버 판정) + 라스트 스퍼트(시간 종료 직전 레벨 임박 시 무료 +초, 판당 제한)
  const startBonusSec = (startBonus?.warmupSec ?? 0) + (startBonus?.streakSec ?? 0);
  const graceLeftRef = useRef(GAME_CONFIG.coasting.gracePerRun);
  const [spurtBanner, setSpurtBanner] = useState<{ key: number } | null>(null);
  const spurtTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // W2 타격감 — 파편 파티클 / 보드 펀치(히트스톱) / 스페셜 생성 수렴
  const [particles, setParticles] = useState<Particle[]>([]);
  const [punch, setPunch] = useState(false);
  const punchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bornIds, setBornIds] = useState<Set<number>>(new Set()); // 방금 생성된 스페셜 타일 id(수렴 연출)
  const reduceMotionRef = useRef(false);
  // 점수 출처별 집계(결과 화면 분해) — 매치/연쇄/스페셜·콤보/피버. 합 = 최종 점수.
  const breakdownRef = useRef({ match: 0, chain: 0, special: 0, fever: 0 });
  const shownScore = useCountUp(score); // HUD 점수 오도미터

  // 모션 최소화 선호 감지 — 파티클·펀치 등 W2 연출 스킵(접근성)
  useEffect(() => {
    reduceMotionRef.current = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // 후반 점수 배율(막판 폭발 훅)
  const scoreMul = (tl: number) => {
    const p = GAME_CONFIG.pacing;
    if (tl <= p.rushSec) return p.rushMul;
    if (tl <= p.frenzySec) return p.frenzyMul;
    return 1;
  };

  const triggerShake = useCallback(() => {
    setShake(false);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    // 다음 프레임에 다시 켜 애니메이션 재시작 보장
    requestAnimationFrame(() => {
      setShake(true);
      shakeTimer.current = setTimeout(() => setShake(false), 220);
    });
  }, []);

  // 보너스 시간 — 벽시계 앵커 연장(상한 maxSeconds) + 타이머 카드 "+N s" 플라이업
  const addTime = useCallback((sec: number) => {
    const now = Date.now();
    endAtRef.current = Math.min(now + GAME_CONFIG.game.maxSeconds * 1000, endAtRef.current + sec * 1000);
    setTimeLeft(Math.max(0, Math.ceil((endAtRef.current - now) / 1000)));
    const key = floaterId.current++;
    setTimeBonus({ n: sec, key });
    if (timeBonusTimer.current) clearTimeout(timeBonusTimer.current);
    timeBonusTimer.current = setTimeout(() => setTimeBonus(null), 900);
  }, []);

  const makeTilesFromColors = useCallback((colors: number[]): Tile[] => colors.map((c) => ({ id: nextId.current++, color: c })), []);

  // busy는 렌더용 state + 핸들러용 ref 동기 유지 (비동기 완료 직후 stale closure 방지)
  const setBusyState = useCallback((v: boolean) => {
    busyRef.current = v;
    setBusy(v);
  }, []);

  // 보드 갱신은 반드시 이 함수로 — state(렌더)와 ref(로직)를 동시 커밋
  const commitTiles = useCallback((ts: (Tile | null)[]) => {
    tilesRef.current = ts;
    setTiles(ts);
  }, []);

  const init = useCallback(() => {
    rngRef.current = mulberry32(seed);
    let colors = makeBoard(rngRef.current);
    if (!hasMove(colors)) colors = reshuffle(rngRef.current);
    commitTiles(makeTilesFromColors(colors));
    setScore(0);
    breakdownRef.current = { match: 0, chain: 0, special: 0, fever: 0 }; // 점수 출처별 집계 리셋
    setCombo(0);
    setMaxCombo(0);
    setPrevBest(0);
    setHearts(GAME_CONFIG.hearts.start);
    heartsUsedRef.current = 0;
    endReasonRef.current = "timeout";
    graceLeftRef.current = GAME_CONFIG.coasting.gracePerRun;
    setSpurtBanner(null);
    // 시작 시간 = 기본 + 순항 보너스(웜업·스트릭, 서버 판정) — maxSeconds 상한은 addTime에서만 적용
    setTimeLeft(GAME_CONFIG.game.seconds + startBonusSec);
    timeLeftRef.current = GAME_CONFIG.game.seconds + startBonusSec;
    setPending(null);
    setAim(null);
    setSelected(null);
    setHint(null);
    setQuitOpen(false);
    setBusyState(false);
    bufferedRef.current = null;
    setFloaters([]);
    setFx([]);
    setClearing(new Set());
    setIsNewBest(false);
    setRank(null);
    setSubmitting(false);
    setFeverBanner(null);
    setTimeBonus(null);
    prevMulRef.current = 1;
    levelRef.current = 1;
    levelStartRef.current = 0;
    setLevel(1);
    setLevelProgress(0);
    setLevelBanner(null);
    usedRef.current = { bomb: 0, line: 0, shuffle: 0, time: 0 };
    // 아이템 소싱 — 두 모드 모두 기본(config start)씩 지급.
    //  · 일반 매치(daily): 고정(공정, 인벤토리 미참조)
    //  · 아이템 매치(free): 기본 + 서버 보유분. 보유분은 invRef에 담아두고 '플레이 시작' 시 1회 반영
    //    (여기서 setItems로 덮으면 인게임 사용분을 롤백하는 레이스 발생 → 금지)
    setItems(initialItems()); // 기본 개수 즉시 표시(카운트다운 동안 프리뷰)
    invRef.current = {};
    // 두 모드 모두 보유분 조회 — free: 아이템 가산 / daily: 하트 가산 (카운트다운 종료 시 1회 확정)
    fetchAccount().then((a) => {
      invRef.current = a.inventory;
    });
    try {
      setBest(Number(localStorage.getItem(bestKey) || 0));
    } catch {
      /* ignore */
    }
    movesRef.current = []; // 새 판 입력 로그 초기화
    // 온보딩: 최초 1회 자동 표시 + 설정으로 강제 표시 시. 이후엔 바로 카운트다운.
    setPhase(getOnboarding() || !getSeenIntro() ? "intro" : "countdown");
  }, [seed, mode, bestKey, makeTilesFromColors, setBusyState, commitTiles, startBonusSec]);

  useEffect(() => {
    init();
  }, [init]);

  // 카운트다운 (3·2·1·GO → playing). 이 동안 타이머 정지.
  useEffect(() => {
    if (phase !== "countdown") return;
    let n = 3;
    setCountdown(3);
    sfxCountdown();
    const id = setInterval(() => {
      n -= 1;
      if (n < 0) {
        clearInterval(id);
        // 아이템 매치: 플레이 시작 시점에 기본 + 보유분을 1회 확정(이후 비동기 덮어쓰기 없음)
        if (mode === "free") {
          const inv = invRef.current;
          setItems({
            bomb: baseOf("bomb") + (inv.bomb ?? 0),
            line: baseOf("line") + (inv.line ?? 0),
            shuffle: baseOf("shuffle") + (inv.shuffle ?? 0),
            time: baseOf("time") + (inv.time ?? 0),
          });
        } else {
          // 일반 매치: 하트 = 기본 지급 + 상점 구매 보유분
          setHearts(GAME_CONFIG.hearts.start + (invRef.current.heart ?? 0));
        }
        matchStartRef.current = Date.now(); // 입력 로그 타임라인 기준(플레이 시작)
        setPhase("playing");
        track("first_game"); // 퍼널: 첫 판 시작 (기기당 1회 dedup)
      } else {
        setCountdown(n); // 2, 1, 0(GO)
        if (n === 0) sfxGo();
        else sfxCountdown();
      }
    }, 650);
    return () => clearInterval(id);
  }, [phase, mode]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // 레벨업 감지 — 누적 점수가 현재 레벨 목표를 넘으면 레벨업(+보너스 시간). 초과분은 다음 레벨로 이월.
  useEffect(() => {
    if (phase !== "playing") return;
    let leveled = false;
    while (score - levelStartRef.current >= targetOf(levelRef.current)) {
      levelStartRef.current += targetOf(levelRef.current);
      levelRef.current += 1;
      leveled = true;
    }
    if (leveled) {
      setLevel(levelRef.current);
      addTime(GAME_CONFIG.levels.bonusSec);
      sfxLevelUp();
      vibrate(80);
      triggerShake();
      const key = floaterId.current++;
      setLevelBanner({ n: levelRef.current, key });
      if (levelBannerTimer.current) clearTimeout(levelBannerTimer.current);
      levelBannerTimer.current = setTimeout(() => setLevelBanner(null), 1100);
    }
    setLevelProgress(Math.min(1, (score - levelStartRef.current) / targetOf(levelRef.current)));
  }, [score, phase, addTime, triggerShake]);

  // 타이머 — 벽시계 앵커: setInterval 지연·백그라운드 스로틀과 무관하게 실제 경과 시간으로 감산
  useEffect(() => {
    if (phase !== "playing") return;
    endAtRef.current = Date.now() + timeLeftRef.current * 1000;
    const id = setInterval(() => {
      const remain = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setTimeLeft((prev) => (prev === remain ? prev : remain));
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  // 막판 10초 카운트다운 틱(긴장 훅)
  useEffect(() => {
    if (phase === "playing" && timeLeft <= 10 && timeLeft > 0) sfxTick();
  }, [timeLeft, phase]);

  // 피버 단계 진입 감지 — 배너 + 스팅어 (프레임 골드 전환은 렌더에서 처리)
  useEffect(() => {
    if (phase !== "playing") {
      prevMulRef.current = 1;
      return;
    }
    const m = scoreMul(timeLeft);
    if (m > prevMulRef.current) {
      sfxFever();
      vibrate(50);
      const key = floaterId.current++;
      setFeverBanner({ mul: m, key });
      if (feverTimer.current) clearTimeout(feverTimer.current);
      feverTimer.current = setTimeout(() => setFeverBanner(null), 950);
    }
    prevMulRef.current = m;
  }, [timeLeft, phase]);

  // BGM — 플레이 중 V01D 실곡 랜덤 재생, 종료/이탈 시 정지. 현재 곡명은 헤더 표시.
  const [bgmTrack, setBgmTrack] = useState<{ title: string; artist: string }>({ title: "", artist: "" });
  useEffect(() => {
    const onTrack = (e: Event) => {
      const d = (e as CustomEvent<{ title?: string; artist?: string }>).detail;
      setBgmTrack({ title: d?.title ?? "", artist: d?.artist ?? "" });
    };
    document.addEventListener("gamebgm", onTrack);
    setBgmTrack(getBgmTrack());
    return () => document.removeEventListener("gamebgm", onTrack);
  }, []);
  useEffect(() => {
    if (phase === "playing") startBgm();
    else stopBgm();
    return () => stopBgm();
  }, [phase]);
  useEffect(() => {
    setBgmFever(phase === "playing" ? scoreMul(timeLeft) : 1); // 피버 시 곡 템포 상승(피치 보존)
  }, [timeLeft, phase]);
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopBgm();
      else if (phase === "playing") startBgm();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  // 유휴 힌트 — 일정 시간 입력·보드 변화 없으면 유효 스왑 한 쌍 반짝
  useEffect(() => {
    setHint(null);
    if (phase !== "playing" || busy || pending) return;
    const sec = GAME_CONFIG.game.hintSec;
    if (!sec) return;
    const id = setTimeout(() => {
      const mv = findMove(colorsOf(tiles));
      if (mv) setHint(mv);
    }, sec * 1000);
    return () => clearTimeout(id);
  }, [tiles, phase, busy, pending]);

  useEffect(() => {
    // 시간이 다 됐어도 진행 중인 캐스케이드(busy)가 끝난 뒤에 종료·제출 → 표시 점수 = 제출 점수
    if (timeLeft === 0 && phase === "playing" && !busy) {
      // 라스트 스퍼트(순항 구간) — 레벨 목표 임박(진행도 ≥ 임계) 시 판당 제한 횟수만큼 무료 +초.
      //   하트(유료 30초)보다 먼저 발동하는 가벼운 관용 — near-miss 좌절의 바닥을 잘라낸다.
      const co = GAME_CONFIG.coasting;
      if (graceLeftRef.current > 0 && co.graceSec > 0 && levelProgress >= co.graceThreshold) {
        graceLeftRef.current -= 1;
        logMove({ k: "g" }); // 리플레이 로그(시뮬레이터는 시간계 이벤트로 무시)
        endAtRef.current = Date.now() + co.graceSec * 1000;
        timeLeftRef.current = co.graceSec;
        setTimeLeft(co.graceSec);
        prevMulRef.current = scoreMul(co.graceSec); // 재시작 순간 배율 기준 재설정(피버 배너 오발 방지)
        setTimeBonus({ n: co.graceSec, key: floaterId.current++ });
        if (timeBonusTimer.current) clearTimeout(timeBonusTimer.current);
        timeBonusTimer.current = setTimeout(() => setTimeBonus(null), 900);
        setSpurtBanner({ key: floaterId.current++ });
        if (spurtTimer.current) clearTimeout(spurtTimer.current);
        spurtTimer.current = setTimeout(() => setSpurtBanner(null), 1100);
        sfxLevelUp();
        vibrate(80);
        return;
      }
      // 일반 매치 + 하트 보유 + 판당 상한 미달 → 이어하기 선택지 먼저 (제출은 최종 종료 시에만)
      if (mode === "daily" && hearts > 0 && heartsUsedRef.current < GAME_CONFIG.hearts.maxPerRun) {
        setQuitOpen(false);
        setPending(null);
        setAim(null);
        setSelected(null);
        sfxCountdown();
        vibrate(40);
        setPhase("continue");
        return;
      }
      setPhase("over");
      setPrevBest(best); // 갱신 전 최고 점수 보존(결과 모달 "+N" 대비 표기)
      const newBest = score > best;
      if (newBest) {
        try {
          localStorage.setItem(bestKey, String(score));
        } catch {
          /* ignore */
        }
        setBest(score);
        setIsNewBest(true);
      }
      vibrate(newBest ? 120 : 60);
      if (newBest) sfxNewBest();
      else sfxGameOver();
      onGameOver?.(score);
      // 두 모드 모두 랭킹 제출(모드별 별도 보드) — 랭크는 (최고 레벨, 누적 점수). 0점 제외.
      if (score > 0) {
        setSubmitting(true);
        submitScore({
          mode,
          seed,
          score,
          level: levelRef.current,
          matchId,
          moves: movesRef.current,
          endReason: endReasonRef.current,
          continuesUsed: heartsUsedRef.current,
          levelProgress,
          nickname: getNick(),
          avatar: getAvatar(),
        })
          .then((r) => {
            setRank(r);
            if (!r) {
              toast.error(t("submit_failed")); // 실패를 사용자에게 통지(무음 삼킴 방지)
              return;
            }
            // 서버 최고점(타 기기 포함)이 더 높으면 로컬 표시 기준 동기화 — 기기 이동 시 신기록 판정 정합
            const serverBest = r.best_score ?? 0;
            if (serverBest > Math.max(best, score)) {
              try {
                localStorage.setItem(bestKey, String(serverBest));
              } catch {
                /* ignore */
              }
              setBest(serverBest);
            }
          })
          .finally(() => setSubmitting(false));
      }
      consumeUsed(); // 기본 지급 초과 사용분 서버 차감 (free=아이템 / daily=하트)
    }
  }, [timeLeft, phase, busy, score, best, bestKey, onGameOver, mode, seed, matchId, t, hearts, levelProgress]);

  // 기본 지급 초과 사용분 서버 인벤토리 차감 — 종료·기권 공통 (기권 시 공짜 사용 악용 방지)
  function consumeUsed() {
    if (mode === "free") {
      const u = usedRef.current;
      const toConsume: Inventory = {
        bomb: Math.max(0, u.bomb - baseOf("bomb")),
        line: Math.max(0, u.line - baseOf("line")),
        shuffle: Math.max(0, u.shuffle - baseOf("shuffle")),
        time: Math.max(0, u.time - baseOf("time")),
      };
      if (toConsume.bomb || toConsume.line || toConsume.shuffle || toConsume.time) void consumeItems(toConsume);
    } else {
      const overHearts = heartsUsedRef.current - GAME_CONFIG.hearts.start;
      if (overHearts > 0) void consumeItems({ heart: overHearts });
    }
    usedRef.current = { bomb: 0, line: 0, shuffle: 0, time: 0 }; // 중복 차감 방지
    heartsUsedRef.current = 0;
  }

  // 하트 이어하기 — 1개 소모 후 continueSec으로 재시작(점수·레벨 유지)
  function continueWithHeart() {
    const sec = GAME_CONFIG.hearts.continueSec;
    logMove({ k: "c" }); // 이어하기(+시간 — 리플레이 로그)
    heartsUsedRef.current += 1;
    setHearts((h) => Math.max(0, h - 1));
    endAtRef.current = Date.now() + sec * 1000;
    timeLeftRef.current = sec;
    setTimeLeft(sec);
    prevMulRef.current = scoreMul(sec); // 재시작 순간 배율 기준 재설정(피버 배너 오발 방지)
    setPhase("playing");
    sfxLevelUp();
    vibrate(60);
  }

  // 이어하기 포기 — 하트를 0으로 만들어 종료 경로(제출 포함)로 합류
  function giveUpContinue() {
    endReasonRef.current = "continue_declined";
    setHearts(0);
    setPhase("playing"); // timeLeft=0 + hearts=0 → 위 효과가 즉시 최종 종료 처리
  }

  function spawnFloater(cells: Set<number>, gained: number) {
    const arr = [...cells];
    let sr = 0;
    let sc = 0;
    for (const i of arr) {
      const [r, c] = rc(i);
      sr += r;
      sc += c;
    }
    const left = ((sc / arr.length + 0.5) / SIZE) * 100;
    const top = ((sr / arr.length + 0.5) / SIZE) * 100;
    const id = floaterId.current++;
    // 획득량·피버에 따라 크기/색 차등 — 큰 보상일수록 크게, 피버 중엔 골드
    const fever = scoreMul(timeLeftRef.current) > 1;
    const cls =
      gained >= 800
        ? "text-[26px] text-gold"
        : gained >= 300
          ? "text-[20px] text-primary-400"
          : fever
            ? "text-[15px] text-gold"
            : "text-[15px] text-white";
    setFloaters((f) => [...f, { id, left, top, text: `+${gained}`, cls }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 760);
  }

  // 보드 순간 펀치 — 큰 매치·스페셜에서 "쿵" 하는 임팩트(히트스톱 체감). rAF 재시작으로 연속 발동.
  function triggerPunch() {
    if (reduceMotionRef.current) return;
    setPunch(false);
    requestAnimationFrame(() => setPunch(true));
    if (punchTimer.current) clearTimeout(punchTimer.current);
    punchTimer.current = setTimeout(() => setPunch(false), 200);
  }

  // 매치 파편 파티클 — 지워진 셀에서 그 셀 색으로 사방 튀며 소멸. 성능 위해 셀 수 상한.
  function spawnParticles(cells: Set<number>, ts: (Tile | null)[]) {
    if (reduceMotionRef.current) return;
    const arr = [...cells];
    const capped = arr.length > 18 ? arr.filter((_, k) => k % Math.ceil(arr.length / 18) === 0) : arr;
    const add: Particle[] = [];
    for (const i of capped) {
      const [r, c] = rc(i);
      const tl = ts[i];
      const color = tl ? GAME_CONFIG.tiles[tl.color].bg : "#ffffff";
      const left = (c + 0.5) * cell;
      const top = (r + 0.5) * cell;
      for (let p = 0; p < 2; p++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 16 + Math.random() * 26;
        add.push({ id: floaterId.current++, left, top, dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist - 6, color });
      }
    }
    setParticles((ps) => [...ps, ...add]);
    const ids = new Set(add.map((a) => a.id));
    setTimeout(() => setParticles((ps) => ps.filter((x) => !ids.has(x.id))), 520);
  }

  // 스페셜/아이템 발동 이펙트 스폰 — 라인=십자 빔, 광역/폭탄=확산 링, 컬러밤=보드 플래시
  function spawnFx(list: { cell: number; kind: FxKind }[]) {
    if (!list.length) return;
    const add: Fx[] = [];
    for (const { cell, kind } of list) {
      const [r, c] = rc(cell);
      if (kind === "lineH") {
        add.push({ id: floaterId.current++, type: "beamH", row: r, col: c, span: 0 });
      } else if (kind === "lineV") {
        add.push({ id: floaterId.current++, type: "beamV", row: r, col: c, span: 0 });
      } else if (kind === "item-line") {
        add.push({ id: floaterId.current++, type: "beamH", row: r, col: c, span: 0 }); // 아이템 라인 = 십자
        add.push({ id: floaterId.current++, type: "beamV", row: r, col: c, span: 0 });
      } else if (kind === "area" || kind === "item-bomb") {
        add.push({ id: floaterId.current++, type: "ring", row: r, col: c, span: kind === "area" ? 5 : 3 });
      } else {
        add.push({ id: floaterId.current++, type: "flash", row: r, col: c, span: 0 });
      }
    }
    setFx((f) => [...f, ...add]);
    const ids = new Set(add.map((a) => a.id));
    setTimeout(() => setFx((f) => f.filter((x) => !ids.has(x.id))), 460);
  }

  // 메가콤보 조합별 전용 시각 연출 — 조합 종류를 한눈에 알아보게 빔/링/플래시 패턴 차등. 배너 문구 반환.
  function spawnComboFx(a: number, b: number, ts: (Tile | null)[]): string {
    const ka = ts[a]?.kind;
    const kb = ts[b]?.kind;
    if (!ka || !kb) return "MEGA COMBO!";
    const has = (k: SpecialKind) => ka === k || kb === k;
    const hasLine = isLineKind(ka) || isLineKind(kb);
    const add: Fx[] = [];
    const beam = (r: number, c: number) => {
      add.push({ id: floaterId.current++, type: "beamH", row: r, col: c, span: 0 });
      add.push({ id: floaterId.current++, type: "beamV", row: r, col: c, span: 0 });
    };
    const ring = (r: number, c: number, span: number) => add.push({ id: floaterId.current++, type: "ring", row: r, col: c, span });
    const flash = () => add.push({ id: floaterId.current++, type: "flash", row: 0, col: 0, span: 0 });
    const cellsOfColor = (color: number, cap: number) =>
      ts.map((t, i) => (t && t.color === color ? i : -1)).filter((i) => i >= 0).slice(0, cap);
    const [ra, ca] = rc(a);
    const [rb, cb] = rc(b);
    let label: string;
    if (ka === "color" && kb === "color") {
      flash();
      flash(); // 이중 풀보드 플래시 = 최대 연출
      label = "RAINBOW!!";
    } else if (has("color") && hasLine) {
      // 대상 색 셀마다 빔 십자 = "전부 라인화"
      flash();
      for (const i of cellsOfColor(ts[isLineKind(ka) ? a : b]!.color, 8)) beam(rc(i)[0], rc(i)[1]);
      label = "COLOR LINE!";
    } else if (has("color") && has("area")) {
      // 대상 색 셀마다 확산 링 = "전부 폭탄화"
      flash();
      for (const i of cellsOfColor(ts[ka === "area" ? a : b]!.color, 8)) ring(rc(i)[0], rc(i)[1], 5);
      label = "COLOR BLAST!";
    } else if (isLineKind(ka) && isLineKind(kb)) {
      beam(ra, ca);
      beam(rb, cb); // 양쪽 십자 = 거대 십자
      label = "MEGA CROSS!";
    } else if (hasLine && has("area")) {
      // 광역 중심 ±1 행/열 굵은 빔 + 라인 십자
      const areaC = ka === "area" ? a : b;
      const lineC = isLineKind(ka) ? a : b;
      const [rA, cA] = rc(areaC);
      for (let d = -1; d <= 1; d++) {
        if (rA + d >= 0 && rA + d < SIZE) add.push({ id: floaterId.current++, type: "beamH", row: rA + d, col: cA, span: 0 });
        if (cA + d >= 0 && cA + d < SIZE) add.push({ id: floaterId.current++, type: "beamV", row: rA, col: cA + d, span: 0 });
      }
      beam(rc(lineC)[0], rc(lineC)[1]);
      ring(rA, cA, 5);
      label = "FAT CROSS!";
    } else {
      ring(ra, ca, 7);
      ring(rb, cb, 7);
      flash(); // 광역+광역 = 초대형 이중 링
      label = "DOUBLE BLAST!";
    }
    setFx((f) => [...f, ...add]);
    const ids = new Set(add.map((x) => x.id));
    setTimeout(() => setFx((f) => f.filter((x) => !ids.has(x.id))), 480);
    return label;
  }

  function collapseTiles(ts: (Tile | null)[], cleared: Set<number>, rng: () => number) {
    const n = ts.map((t, i) => (cleared.has(i) ? null : t));
    const spawned = new Set<number>();
    for (let c = 0; c < SIZE; c++) {
      const survivors: Tile[] = [];
      for (let r = SIZE - 1; r >= 0; r--) {
        const tt = n[idx(r, c)];
        if (tt) survivors.push(tt);
      }
      let write = SIZE - 1;
      for (const tt of survivors) {
        n[idx(write, c)] = tt;
        write--;
      }
      for (let r = write; r >= 0; r--) {
        const tt: Tile = { id: nextId.current++, color: Math.floor(rng() * COLORS) };
        n[idx(r, c)] = tt;
        spawned.add(tt.id);
      }
    }
    return { next: n, spawned };
  }

  // 스페셜 연쇄 발동 — 시드 셀에 포함된 스페셜을 효과 셀로 확장(연쇄까지) + 발동 목록 수집. 순수 계산.
  function detonate(seedCells: Set<number>, ts: (Tile | null)[]): { cells: Set<number>; activated: { cell: number; kind: SpecialKind }[] } {
    const out = new Set(seedCells);
    const activated: { cell: number; kind: SpecialKind }[] = [];
    const stack = [...seedCells];
    while (stack.length) {
      const i = stack.pop() as number;
      const tl = ts[i];
      if (!tl || !tl.kind) continue;
      activated.push({ cell: i, kind: tl.kind });
      const cells =
        tl.kind === "lineH" ? rowCells(i) : tl.kind === "lineV" ? colCells(i) : tl.kind === "area" ? areaCells(i, 2) : colorCells(colorsOf(ts), tl.color);
      for (const c of cells)
        if (!out.has(c)) {
          out.add(c);
          stack.push(c);
        }
    }
    return { cells: out, activated };
  }

  // 지운 셀 집합에 점수·연출 적용 + 스페셜 생성 반영 후 붕괴. 다음 보드 반환.
  async function applyClear(
    ts: (Tile | null)[],
    toClear: Set<number>,
    chain: number,
    creations: { cell: number; kind: SpecialKind }[],
    squares = 0,
  ): Promise<(Tile | null)[]> {
    setCombo(chain);
    setMaxCombo((m) => Math.max(m, chain));
    setClearing(toClear);
    // 큰 매치 즉시 보너스(4→라인, 5→컬러밤, 교차→광역, 2×2 정사각) — 기본 점수와 달리 체인 배수 미적용, 피버 배수만 적용
    const sc = GAME_CONFIG.scoring;
    const bonus =
      creations.reduce((s, c) => s + (isLineKind(c.kind) ? sc.bonus4 : c.kind === "color" ? sc.bonus5 : sc.bonusCross), 0) +
      squares * sc.bonusSquare;
    const rawBase = toClear.size * 10;
    const chainExtra = rawBase * (Math.max(chain, 1) - 1);
    const gained = Math.round((rawBase + chainExtra + bonus) * scoreMul(timeLeftRef.current));
    // 출처별 집계 — 매치(기본)/연쇄(체인 배수분)/스페셜(생성·정사각 보너스)/피버(배수 추가분)
    const bd = breakdownRef.current;
    bd.match += rawBase;
    bd.chain += chainExtra;
    bd.special += bonus;
    bd.fever += gained - (rawBase + chainExtra + bonus);
    setScore((s) => s + gained);
    spawnFloater(toClear, gained);
    spawnParticles(toClear, ts); // W2 파편 파티클(셀 색)
    sfxMatch(chain, toClear.size); // 체인 음정 + 큰 매치 저음 임팩트
    if (creations.length) sfxPower(); // 스페셜 생성 시 파워업 사운드
    vibrate(Math.min(8 + chain * 6, 40));
    if (chain >= 3 || toClear.size >= 8) triggerShake();
    if (chain >= 3 || toClear.size >= 8 || creations.length) triggerPunch(); // W2 보드 펀치(임팩트)
    if (chain >= 2) {
      const key = floaterId.current++;
      setComboFlash({ n: chain, key });
      if (comboTimer.current) clearTimeout(comboTimer.current);
      comboTimer.current = setTimeout(() => setComboFlash(null), 700);
    }
    // 생성될 스페셜을 타일에 표시(붕괴 시 유지) — 지워지지 않고 살아남음
    const marked = creations.length
      ? ts.map((tl, i) => {
          const cr = creations.find((x) => x.cell === i);
          return cr && tl ? { ...tl, kind: cr.kind } : tl;
        })
      : ts;
    // W2 스페셜 생성 수렴 연출 — 방금 특수타일이 된 타일 id에 born 애니 부여(짧게)
    if (creations.length) {
      const bt = new Set(creations.map((c) => marked[c.cell]?.id).filter((x): x is number => x != null));
      setBornIds(bt);
      setTimeout(() => setBornIds(new Set()), 440);
    }
    // 연쇄 가속 — 체인이 깊어질수록 템포 업(캐스케이드 흥분감)
    const p = GAME_CONFIG.pacing;
    const tempo = Math.pow(p.cascadeAccel, Math.max(0, chain - 1));
    // 큰 매치는 클리어 순간을 살짝 더 붙잡아 무게감 부여(히트스톱)
    const hold = toClear.size >= 10 ? 55 : 0;
    await sleep(Math.max(p.cascadeMinMs, Math.round(200 * tempo)) + hold);
    const { next, spawned } = collapseTiles(marked, toClear, rngRef.current);
    setClearing(new Set());
    setSpawnedIds(spawned);
    commitTiles(next);
    await sleep(Math.max(p.cascadeMinMs, Math.round(230 * tempo)));
    return next;
  }

  async function resolve(startTiles: (Tile | null)[], prefer: number[] = []) {
    let ts = startTiles;
    let chain = 0;
    let pref = prefer;
    for (;;) {
      const { cleared, creations, squares } = analyzeMatches(colorsOf(ts), pref);
      pref = [];
      if (cleared.size === 0) break;
      chain++;
      const creationCells = new Set(creations.map((c) => c.cell));
      // 생성 스페셜은 이번엔 살아남음 → clear에서 제외. 기존 스페셜은 연쇄 발동.
      const base = new Set([...cleared].filter((c) => !creationCells.has(c)));
      const det = detonate(base, ts);
      const toClear = det.cells;
      if (det.activated.length) {
        spawnFx(det.activated);
        sfxSpecial();
        triggerShake();
      }
      for (const c of creationCells) toClear.delete(c);
      ts = await applyClear(ts, toClear, chain, creations, squares);
    }
    setCombo(0);
    if (!hasMove(colorsOf(ts))) {
      const colors = reshuffle(rngRef.current);
      const fresh = makeTilesFromColors(colors);
      setSpawnedIds(new Set(fresh.map((x) => x.id)));
      commitTiles(fresh);
    }
  }

  // 캐스케이드 종료 후 예약 스왑 1건 실행 — 게임오버 드레인(잔여 0초)과는 충돌하지 않게 차단
  function flushBuffered() {
    const b = bufferedRef.current;
    bufferedRef.current = null;
    if (!b || timeLeftRef.current <= 0) return;
    void attemptSwap(b.a, b.b);
  }

  async function clearWithItem(type: "bomb" | "line", center: number, base: (Tile | null)[]) {
    setBusyState(true);
    logMove({ k: type === "bomb" ? "b" : "l", c: center }); // 아이템 사용(리플레이 로그)
    triggerShake(); // 아이템 폭발 임팩트
    vibrate(35);
    const seedCells = type === "bomb" ? bombCells(center) : lineCells(center);
    const det = detonate(seedCells, base); // 아이템 범위에 걸린 보드 스페셜도 연쇄 발동
    spawnFx([{ cell: center, kind: type === "bomb" ? "item-bomb" : "item-line" }, ...det.activated]);
    const toClear = det.cells;
    setClearing(toClear);
    const gained = Math.round(toClear.size * 10 * scoreMul(timeLeftRef.current));
    breakdownRef.current.special += toClear.size * 10; // 아이템 발동 = 스페셜 버킷
    breakdownRef.current.fever += gained - toClear.size * 10;
    setScore((s) => s + gained);
    spawnFloater(toClear, gained);
    spawnParticles(toClear, base); // W2 파편 파티클
    triggerPunch(); // W2 아이템 폭발 임팩트
    await sleep(200);
    const { next, spawned } = collapseTiles(base, toClear, rngRef.current);
    setClearing(new Set());
    setSpawnedIds(spawned);
    commitTiles(next);
    await sleep(230);
    await resolve(next);
    setBusyState(false);
    flushBuffered();
  }

  async function attemptSwap(a: number, b: number) {
    if (busyRef.current || phase !== "playing") return;
    const before = tilesRef.current; // 버퍼 실행 시 stale 클로저 방지 — 항상 최신 보드에서 시작
    const swapped = [...before];
    [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
    const specialInvolved = !!(swapped[a]?.kind || swapped[b]?.kind);
    const hasMatch = findMatches(colorsOf(swapped)).size > 0;

    if (!hasMatch && !specialInvolved) {
      // 무효 스왑 — 흔들림 + 사운드 + 햅틱 피드백 후 되돌림
      setBusyState(true);
      triggerShake();
      sfxInvalid();
      vibrate(30);
      commitTiles(swapped);
      await sleep(170);
      commitTiles(before);
      setBusyState(false);
      flushBuffered();
      return;
    }

    setBusyState(true);
    logMove({ k: "s", a, b }); // 유효 스왑 커밋(리플레이 로그)
    commitTiles(swapped);
    await sleep(120);

    if (specialInvolved) {
      // 스페셜을 스왑으로 발동(3매치 불필요). 두 칸 모두 스페셜이면 메가콤보(comboCells).
      const isCombo = !!(swapped[a]?.kind && swapped[b]?.kind);
      triggerShake();
      vibrate(isCombo ? 70 : 45);
      const det = detonate(comboCells(a, b, swapped), swapped);
      const toClear = det.cells;
      if (isCombo) {
        // 메가콤보 — 조합별 전용 시각 연출 + 펀치 + 조합 전용음 + 조합명 배너
        const label = spawnComboFx(a, b, swapped);
        triggerPunch();
        sfxCombo();
        const key = floaterId.current++;
        setComboFlash({ n: Math.max(4, Math.round(toClear.size / 4)), key, label });
        if (comboTimer.current) clearTimeout(comboTimer.current);
        comboTimer.current = setTimeout(() => setComboFlash(null), 900);
      } else {
        sfxSpecial();
        spawnFx(det.activated);
      }
      setClearing(toClear);
      const gained = Math.round(toClear.size * 10 * scoreMul(timeLeftRef.current));
      breakdownRef.current.special += toClear.size * 10; // 스페셜·메가콤보 발동 = 스페셜 버킷
      breakdownRef.current.fever += gained - toClear.size * 10;
      setScore((s) => s + gained);
      spawnFloater(toClear, gained);
      spawnParticles(toClear, swapped); // W2 파편(스페셜/콤보 클리어에도)
      await sleep(200);
      const { next, spawned } = collapseTiles(swapped, toClear, rngRef.current);
      setClearing(new Set());
      setSpawnedIds(spawned);
      commitTiles(next);
      await sleep(230);
      await resolve(next);
    } else {
      await resolve(swapped, [a, b]); // 스왑 위치에 스페셜 우선 생성
    }
    setBusyState(false);
    flushBuffered();
  }

  // 아이템 1개 소비 — 개수 차감 + 사용량 누적(자유 플레이 인벤토리 차감용)
  function spendItem(type: ItemType) {
    setItems((it) => ({ ...it, [type]: it[type] - 1 }));
    usedRef.current[type] += 1;
    sfxItem();
    vibrate(20);
  }

  // ── 입력: 드래그 스왑 + 탭-탭 스왑 병행 (아이템 타게팅은 2단계 탭) ──
  // 캐스케이드(busy) 중에도 드래그는 받아 마지막 1건을 예약(템포 유지). 아이템·탭탭은 busy 중 차단.
  function onDown(e: React.PointerEvent, cell: number) {
    if (phase !== "playing") return;
    if (hint) setHint(null);
    if (pending === "bomb" || pending === "line") {
      if (busyRef.current) return;
      if (aim !== cell) {
        setAim(cell); // 1차 탭: 범위 프리뷰
        return;
      }
      const type = pending; // 같은 칸 재탭: 사용 확정
      setPending(null);
      setAim(null);
      spendItem(type);
      void clearWithItem(type, cell, tilesRef.current);
      return;
    }
    dragRef.current = { cell, x: e.clientX, y: e.clientY };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* 일부 환경/합성 이벤트에서 캡처 실패해도 드래그는 진행 */
    }
  }
  function onMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_THRESHOLD) return;
    const [r, c] = rc(d.cell);
    let tr = r;
    let tc = c;
    if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
    else tr += dy > 0 ? 1 : -1;
    dragRef.current = null;
    if (tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE) return;
    if (busyRef.current) {
      bufferedRef.current = { a: d.cell, b: idx(tr, tc) }; // 연쇄 중 예약(마지막 1건)
      return;
    }
    setSelected(null);
    void attemptSwap(d.cell, idx(tr, tc));
  }
  // 손을 뗄 때까지 threshold 미만 이동 = 탭 → 탭-탭 스왑(선택 → 인접 탭 스왑)
  function onUp(cell: number) {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.cell !== cell) return;
    if (phase !== "playing" || busyRef.current || pending) return;
    if (selected === null) setSelected(cell);
    else if (selected === cell) setSelected(null);
    else if (areAdjacent(selected, cell)) {
      const a = selected;
      setSelected(null);
      void attemptSwap(a, cell);
    } else setSelected(cell);
  }

  // 아이템 조준 중 보드·아이템 바 밖 탭 = 조준 취소
  function onRootDown(e: React.PointerEvent) {
    if (!pending) return;
    const target = e.target as HTMLElement;
    if (target.closest?.(".board-inner") || target.closest?.(".item-bar")) return;
    setPending(null);
    setAim(null);
  }

  function useItem(type: ItemType) {
    if (phase !== "playing" || busyRef.current || items[type] <= 0) return;
    if (type === "time") {
      logMove({ k: "x" }); // 시간+ 아이템(리플레이 로그)
      spendItem("time");
      addTime(GAME_CONFIG.game.timeItemSec); // 상한(maxSeconds)은 addTime에서 보장 — score-attack 정합
      return;
    }
    if (type === "shuffle") {
      logMove({ k: "h" }); // 셔플(RNG 소비 — 리플레이 로그)
      spendItem("shuffle");
      const colors = reshuffle(rngRef.current);
      const fresh = makeTilesFromColors(colors);
      setSpawnedIds(new Set(fresh.map((x) => x.id)));
      commitTiles(fresh);
      return;
    }
    setAim(null);
    setSelected(null);
    setPending((p) => (p === type ? null : type));
  }

  const startTutorial = () => {
    unlockAudio();
    unlockBgm(); // iOS: 온보딩 시작 제스처에서 BGM 요소 승인
    setSeenIntro(); // 최초 1회 이후 자동 표시 중단
    setPhase("countdown");
  };

  const cell = 100 / SIZE;
  const match = GAME_CONFIG.match;
  const feverOn = phase === "playing" && scoreMul(timeLeft) > 1; // 프레임 골드 전환
  const rushOn = phase === "playing" && timeLeft > 0 && timeLeft <= GAME_CONFIG.pacing.rushSec; // 비네트 펄스

  return (
    <div
      className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center gap-3 overflow-hidden px-3 pb-safe pt-safe-game"
      onPointerDown={onRootDown}
    >
      {/* 스테이지 배경 + 스크림 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {match.background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={match.background} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="stage-bg h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* BGM 꺼짐 안내 (설정에서 끈 상태) — 재생 pill 자리에 음소거 표시 */}
      {!bgmTrack.title && phase !== "intro" && !bgmEnabled() && (
        <div className="pointer-events-none absolute left-1/2 top-[max(0.25rem,env(safe-area-inset-top))] z-20 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-black/40 px-2.5 py-1 ring-1 ring-white/10">
          <VolumeX className="h-3 w-3 text-white/35" />
          <span className="text-[9.5px] font-bold text-white/35">{t("bgm_off")}</span>
        </div>
      )}

      {/* 재생 중 곡 pill (헤더 상단 중앙 — 레이아웃 불변 absolute): 회전 레코드 + 이퀄라이저 + 곡명·가수 */}
      {bgmTrack.title && (
        <div
          key={bgmTrack.title}
          className="anim-fade-up pointer-events-none absolute left-1/2 top-[max(0.25rem,env(safe-area-inset-top))] z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/55 py-1 pl-1 pr-3 ring-1 ring-white/15 backdrop-blur"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/items/item-shuffle.png" alt="" className="anim-spin-slow h-5 w-5 rounded-full object-cover" />
          <span className="eq-bars" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="text-[10.5px] font-black text-white/90">{bgmTrack.title}</span>
          {bgmTrack.artist && <span className="text-[9.5px] font-bold text-white/45">{bgmTrack.artist}</span>}
        </div>
      )}

      {/* 러시(×2) 비네트 펄스 — 막판 폭발 상태 전달 */}
      {rushOn && <div className="fx-vignette" />}

      {/* HUD (+기권 버튼) — score-attack 위계: 점수 카드를 가장 크게 */}
      <div className="grid gap-2 text-center" style={{ gridTemplateColumns: onExit ? "auto 1.4fr 1fr 1fr" : "1.4fr 1fr 1fr" }}>
        {onExit && (
          <button
            onClick={() => setQuitOpen(true)}
            aria-label={t("quit_aria")}
            className="flex min-h-11 w-11 items-center justify-center self-stretch rounded-[14px] bg-black/40 text-subtle ring-1 ring-white/15 backdrop-blur active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="rounded-[14px] bg-black/40 py-2 ring-1 ring-white/15 backdrop-blur">
          <div className="text-[10px] font-bold uppercase tracking-wide text-subtle">{t("score")}</div>
          <div className="text-[24px] font-black leading-7 tabular-nums text-primary-400">{shownScore.toLocaleString()}</div>
        </div>
        <div className={`relative rounded-[14px] py-2 ring-1 backdrop-blur ${timeLeft <= 10 ? "bg-live/15 ring-live/40" : "bg-black/40 ring-white/15"}`}>
          <div className="text-[10px] font-bold uppercase tracking-wide text-subtle">{t("time")}</div>
          <div
            key={phase === "playing" && timeLeft <= 10 ? timeLeft : undefined}
            className={`text-[20px] font-black tabular-nums ${timeLeft <= 10 ? "anim-count-pop text-live" : ""}`}
          >
            {timeLeft}
          </div>
          {/* 보너스 시간 획득 플라이업 */}
          {timeBonus && (
            <span key={timeBonus.key} className="anim-float-up absolute left-1/2 top-0 z-10 text-[13px] font-black text-gold">
              +{timeBonus.n}s
            </span>
          )}
          {phase === "playing" && scoreMul(timeLeft) > 1 && (
            <span className="anim-count-pop absolute -right-1 -top-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-black text-black">
              ×{scoreMul(timeLeft)}
            </span>
          )}
        </div>
        <div className="rounded-[14px] bg-black/40 py-2 ring-1 ring-white/15 backdrop-blur">
          <div className="text-[10px] font-bold uppercase tracking-wide text-subtle">{t("combo")}</div>
          {/* 연쇄 중엔 현재 콤보, 유휴 시엔 이번 판 최대 콤보(죽은 공간 해소) */}
          <div key={combo} className={`text-[20px] font-black tabular-nums ${combo > 1 ? "anim-count-pop text-primary-400" : ""}`}>
            {combo > 0 ? `${combo}x` : maxCombo > 1 ? <span className="text-muted">{maxCombo}x</span> : "-"}
          </div>
        </div>
      </div>

      {/* 레벨 + 진행 바 + 목표 수치 */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[12px] font-black text-primary-400">
          {t("lv_prefix")}
          {level}
        </span>
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/15 backdrop-blur">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.round(levelProgress * 100)}%` }}
          />
        </div>
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-subtle">
          {Math.max(0, Math.min(score - levelStartRef.current, targetOf(level))).toLocaleString()}/{targetOf(level).toLocaleString()}
        </span>
      </div>

      {/* 보드 */}
      <div
        className={`board-frame relative aspect-square w-full ${shake ? "anim-shake" : ""} ${feverOn ? "board-frame-fever" : ""}`}
        style={{ touchAction: "none" }}
      >
        {/* 네온 프레임 안쪽 다크 보드 */}
        <div className={`board-inner relative h-full w-full overflow-hidden ${punch ? "anim-board-punch" : ""}`}>
        {/* 타일 플레이영역 — 프레임과 여백 확보(답답함 해소) */}
        <div className="absolute inset-[4.5%]">
        {tiles.map((tile, i) =>
          tile ? (
            <div
              key={tile.id}
              className="absolute p-[3px]"
              style={{
                left: `${(i % SIZE) * cell}%`,
                top: `${Math.floor(i / SIZE) * cell}%`,
                width: `${cell}%`,
                height: `${cell}%`,
                transition: "left 0.2s ease, top 0.2s ease",
              }}
              onPointerDown={(e) => onDown(e, i)}
              onPointerMove={onMove}
              onPointerUp={() => onUp(i)}
            >
              <div
                className={`relative flex h-full w-full items-center justify-center rounded-[10px] text-[min(5.5vw,24px)] leading-none ${
                  clearing.has(i) ? "anim-tile-clear" : bornIds.has(tile.id) ? "anim-special-born" : spawnedIds.has(tile.id) ? "anim-tile-spawn" : ""
                } ${pending ? "cursor-crosshair" : ""} ${tile.kind ? "special-tile ring-2 ring-white/90" : ""} ${
                  selected === i ? "sel-tile" : hint && (hint[0] === i || hint[1] === i) ? "hint-tile" : ""
                }`}
                style={{ background: GAME_CONFIG.tiles[tile.color].bg }}
              >
                {/* 스페셜 아트가 있으면 완성형 블록으로 교체 — 악기 아이콘은 숨김(코너 배경색으로 색 식별 유지) */}
                {tile.kind && GAME_CONFIG.specials[tile.kind] ? null : GAME_CONFIG.tiles[tile.color].img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={GAME_CONFIG.tiles[tile.color].img}
                    alt=""
                    draggable={false}
                    className={`pointer-events-none h-full w-full rounded-[10px] ${
                      GAME_CONFIG.tiles[tile.color].cover
                        ? "object-cover"
                        : "object-contain p-[13%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]"
                    }`}
                  />
                ) : (
                  <span className="pointer-events-none drop-shadow-sm">{GAME_CONFIG.tiles[tile.color].glyph}</span>
                )}
                {/* 스페셜 표시 — 관리자 이미지 슬롯 우선, 없으면 CSS 오버레이(십자 광선/폭발 코어/무지개 링) */}
                {tile.kind &&
                  (GAME_CONFIG.specials[tile.kind] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={GAME_CONFIG.specials[tile.kind]}
                      alt=""
                      draggable={false}
                      className="pointer-events-none absolute inset-0 h-full w-full rounded-[10px] object-contain"
                    />
                  ) : (
                    <span className={`sp-${tile.kind}`} />
                  ))}
              </div>
            </div>
          ) : null,
        )}

        {/* 아이템 조준 프리뷰 — 확정 탭 전에 폭발 범위 표시 */}
        {pending && aim != null &&
          [...(pending === "bomb" ? bombCells(aim) : lineCells(aim))].map((ci) => {
            const [ar, ac] = rc(ci);
            return (
              <div
                key={`aim-${ci}`}
                className="aim-cell"
                style={{ left: `${ac * cell}%`, top: `${ar * cell}%`, width: `${cell}%`, height: `${cell}%` }}
              />
            );
          })}

        {/* 스페셜/아이템 발동 이펙트 */}
        {fx.map((f) =>
          f.type === "flash" ? (
            <div key={f.id} className="fx-flash" />
          ) : f.type === "ring" ? (
            <div
              key={f.id}
              className="fx-ring"
              style={{
                left: `${(f.col + 0.5) * cell}%`,
                top: `${(f.row + 0.5) * cell}%`,
                width: `${f.span * cell}%`,
                height: `${f.span * cell}%`,
              }}
            />
          ) : f.type === "beamH" ? (
            <div
              key={f.id}
              className="fx-beam-h"
              style={{ left: 0, width: "100%", top: `${(f.row + 0.25) * cell}%`, height: `${cell * 0.5}%` }}
            />
          ) : (
            <div
              key={f.id}
              className="fx-beam-v"
              style={{ top: 0, height: "100%", left: `${(f.col + 0.25) * cell}%`, width: `${cell * 0.5}%` }}
            />
          ),
        )}

        {/* W2 매치 파편 파티클 (셀 색으로 사방 튐) */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="fx-particle"
            style={
              {
                left: `${p.left}%`,
                top: `${p.top}%`,
                background: p.color,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
              } as CSSProperties
            }
          />
        ))}

        {/* 플로팅 +점수 (획득량·피버별 차등) */}
        {floaters.map((f) => (
          <span
            key={f.id}
            className={`anim-float-up pointer-events-none absolute z-20 font-black drop-shadow ${f.cls}`}
            style={{ left: `${f.left}%`, top: `${f.top}%` }}
          >
            {f.text}
          </span>
        ))}
        </div>

        {/* 레벨업 배너 (+보너스 시간 표기) */}
        {levelBanner && (
          <div
            key={`lv-${levelBanner.key}`}
            className="anim-combo-flash pointer-events-none absolute left-1/2 top-[38%] z-30"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div className="rounded-2xl bg-primary px-5 py-2 text-center shadow-lg">
              <div className="font-display text-[26px] font-black leading-none text-white">
                {t("lv_prefix")}
                {levelBanner.n}
              </div>
              <div className="text-[12px] font-black text-white/90">
                {t("level_up")} · +{GAME_CONFIG.levels.bonusSec}s
              </div>
            </div>
          </div>
        )}

        {/* 라스트 스퍼트 배너 — 시간 종료 직전 레벨 임박 시 무료 +초(순항 구간) */}
        {spurtBanner && (
          <div
            key={`sp-${spurtBanner.key}`}
            className="anim-combo-flash pointer-events-none absolute left-1/2 top-[33%] z-30"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div className="rounded-2xl bg-gold px-5 py-2 text-center shadow-lg">
              <div className="font-display text-[22px] font-black leading-none text-black">
                🔥 {t("spurt_banner")} +{GAME_CONFIG.coasting.graceSec}s
              </div>
            </div>
          </div>
        )}

        {/* 피버 진입 배너 (배율 단계 상승 시 1회) */}
        {feverBanner && (
          <div
            key={`fv-${feverBanner.key}`}
            className="anim-combo-flash pointer-events-none absolute left-1/2 top-[28%] z-30"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div className="rounded-2xl bg-gold px-5 py-2 text-center shadow-lg">
              <div className="font-display text-[24px] font-black leading-none text-black">FEVER ×{feverBanner.mul}</div>
            </div>
          </div>
        )}

        {/* 콤보 응원 배너 (2연쇄부터). label 있으면 메가콤보 조합명(골드) 강조 */}
        {comboFlash && (
          <div
            key={comboFlash.key}
            className="anim-combo-flash pointer-events-none absolute left-1/2 top-[42%] z-20"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            {comboFlash.label ? (
              <div className="font-display font-black text-gold drop-shadow-[0_2px_10px_rgba(245,196,81,0.7)]" style={{ fontSize: "34px" }}>
                {comboFlash.label}
              </div>
            ) : (
              <>
                <div className="font-display font-black text-primary-400 drop-shadow-lg" style={{ fontSize: `${Math.min(28 + comboFlash.n * 5, 60)}px` }}>
                  {comboFlash.n}x
                </div>
                <div className="text-center text-[13px] font-black text-white drop-shadow">
                  {COMBO_WORDS[Math.min(comboFlash.n, COMBO_WORDS.length - 1)] || "COMBO!"}
                </div>
              </>
            )}
          </div>
        )}

        {/* 아이템 타게팅 안내 (조준 전/후 문구 구분) */}
        {pending && (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center">
            <span className="rounded-full bg-black/70 px-3 py-1 text-[12px] font-bold text-white">
              {t(pending === "bomb" ? "item_bomb" : "item_line")} · {t(aim == null ? "item_target_hint" : "item_target_confirm")}
            </span>
          </div>
        )}

        {/* 카운트다운 */}
        {phase === "countdown" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
            <div key={countdown} className="anim-count-punch font-display text-[88px] font-black text-white drop-shadow-lg">
              {countdown > 0 ? countdown : t("go")}
            </div>
            {/* 순항 보너스 칩 — 웜업(오늘 첫 판)·출석 스트릭 부스터 (서버 판정) */}
            {startBonusSec > 0 && (
              <div className="absolute bottom-[16%] flex flex-col items-center gap-1.5">
                {(startBonus?.warmupSec ?? 0) > 0 && (
                  <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-bold text-white ring-1 ring-white/25 backdrop-blur">
                    ☀️ {t("bonus_warmup")} +{startBonus!.warmupSec}s
                  </span>
                )}
                {(startBonus?.streakSec ?? 0) > 0 && (
                  <span className="rounded-full bg-gold/25 px-3.5 py-1.5 text-[13px] font-bold text-white ring-1 ring-gold/50 backdrop-blur">
                    🔥 {t("bonus_streak").replace("{n}", String(startBonus!.streakDays))} +{startBonus!.streakSec}s
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* 하단 섹션 — 일반 매치: 이어하기 하트칸 / 아이템 매치: 아이템 바 */}
      {mode === "daily" ? (
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-black/40 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur">
          {/* 1줄: 하트 슬롯 + 수량 */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: GAME_CONFIG.hearts.slots }).map((_, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src="/items/heart.png"
                alt=""
                className={`h-10 w-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] transition-opacity ${
                  i < hearts ? "" : "opacity-25 grayscale"
                }`}
              />
            ))}
            <span className="ml-1 shrink-0 text-[13px] font-black tabular-nums text-primary-400">×{hearts}</span>
          </div>
          {/* 2줄: 설명 */}
          <div className="text-center text-[10.5px] leading-tight text-subtle break-keep">
            <span className="font-black text-fg">{t("hearts_label")}</span> · {t("hearts_hint")}
          </div>
        </div>
      ) : (
      <div className="item-bar grid grid-cols-4 gap-2">
        {GAME_CONFIG.items.map(({ type, labelKey }) => (
          <button
            key={type}
            onClick={() => useItem(type)}
            disabled={items[type] <= 0 || phase !== "playing"}
            className={`flex flex-col items-center gap-1 rounded-[14px] py-2 text-[11px] font-bold ring-1 backdrop-blur transition-colors ${
              pending === type
                ? "bg-primary/25 text-primary-400 ring-primary/50"
                : items[type] > 0
                  ? "bg-black/40 text-fg ring-white/15 active:scale-95"
                  : "bg-black/40 text-subtle ring-white/10 opacity-40"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ITEM_ART[type]} alt="" className="h-[34px] w-[34px] rounded-[10px] object-cover" />
            {t(labelKey)}
            {/* 시간+ 효과량 명시(+Ns) */}
            <span className="text-[10px] text-muted">
              {type === "time" ? `+${GAME_CONFIG.game.timeItemSec}s · ` : ""}×{items[type]}
            </span>
          </button>
        ))}
      </div>
      )}

      {/* 온보딩 (최초 1회) */}
      {phase === "intro" && <IntroModal onStart={startTutorial} />}

      {/* 이어하기 (일반 매치 — 시간 종료 & 하트 보유) */}
      {phase === "continue" && <ContinueModal hearts={hearts} onContinue={continueWithHeart} onGiveUp={giveUpContinue} />}

      {/* 기권 confirm — 타이머는 계속 흐름(공정성). 시간이 다 되면 결과 모달이 대체 */}
      {quitOpen && phase !== "over" && (
        <QuitConfirm
          onResume={() => setQuitOpen(false)}
          onQuit={() => {
            setQuitOpen(false);
            consumeUsed(); // 기권해도 사용분은 차감
            onExit?.();
          }}
        />
      )}

      {/* 결과 */}
      {phase === "over" && (
        <ResultModal
          score={score}
          maxCombo={maxCombo}
          prevBest={prevBest}
          level={levelRef.current}
          breakdown={breakdownRef.current}
          isNewBest={isNewBest}
          rank={rank}
          submitting={submitting}
          mode={mode}
          onRetry={onRetry ?? init}
          onViewRanking={onViewRanking}
          onExit={onExit}
        />
      )}
    </div>
  );
}
