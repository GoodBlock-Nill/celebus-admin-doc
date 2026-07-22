"use client";

// V01D POP — 매치3 게임 (드래그 스왑 + 낙하/클리어 애니메이션 + 온보딩/카운트다운).
// 타일 id 기반 렌더: 같은 id가 새 셀로 이동 → CSS 트랜지션으로 부드러운 낙하·스왑.
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Home, Trophy } from "lucide-react";
import { toast } from "sonner";
import {
  SIZE,
  COLORS,
  idx,
  rc,
  mulberry32,
  makeBoard,
  findMatches,
  hasMove,
  reshuffle,
  bombCells,
  lineCells,
  areaCells,
  colorCells,
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
  topPercent,
  type RankInfo,
  type Inventory,
} from "@/lib/game-api";
import Avatar from "./Avatar";
import { unlockAudio, sfxMatch, sfxItem, sfxInvalid, sfxCountdown, sfxGo, sfxGameOver, sfxNewBest, sfxPower, sfxSpecial, sfxLevelUp } from "@/lib/sfx";
import { useCountUp } from "@/lib/use-count-up";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLang } from "./LangProvider";

// 콤보 단계별 응원 문구 (2연쇄부터)
const COMBO_WORDS = ["", "", "NICE!", "GREAT!", "COMBO!", "AMAZING!", "INCREDIBLE!", "UNREAL!"];

// new-best 컨페티 (결정적 배치 — 랜덤 미사용)
const CONFETTI_COLORS = ["#f5c451", "#8b5cf6", "#ec4899", "#60a5fa", "#34d399"];
const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 61) % 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i % 5) * 0.12,
}));

const DRAG_THRESHOLD = 12;
// ⚠️ config 값은 모듈 상수로 굳히지 말고 사용 시점에 GAME_CONFIG에서 읽기(부트 오버라이드 반영).
const targetOf = (level: number) => GAME_CONFIG.levels.baseTarget + (level - 1) * GAME_CONFIG.levels.targetStep; // 레벨 추가 목표
// 아이템 기본 지급 개수(config start). 두 모드 공통 기본 + 아이템 대전은 보유분 가산.
const baseOf = (t: ItemType): number => GAME_CONFIG.items.find((i) => i.type === t)?.start ?? 0;
const initialItems = (): Record<ItemType, number> =>
  Object.fromEntries(GAME_CONFIG.items.map((i) => [i.type, i.start])) as Record<ItemType, number>;

type Tile = { id: number; color: number; kind?: SpecialKind };
type Floater = { id: number; left: number; top: number; text: string };
type Phase = "intro" | "countdown" | "playing" | "over";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const colorsOf = (ts: (Tile | null)[]) => ts.map((t) => (t ? t.color : -1));

export default function Match3Game({
  seed,
  mode = "free",
  onExit,
  onGameOver,
  onViewRanking,
}: {
  seed: number;
  mode?: "free" | "daily";
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

  const [tiles, setTiles] = useState<(Tile | null)[]>([]);
  const [clearing, setClearing] = useState<Set<number>>(new Set());
  const [spawnedIds, setSpawnedIds] = useState<Set<number>>(new Set());
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.game.seconds);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Record<ItemType, number>>(initialItems);
  const [pending, setPending] = useState<ItemType | null>(null);
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
  const [comboFlash, setComboFlash] = useState<{ n: number; key: number } | null>(null); // 콤보 응원 배너
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownScore = useCountUp(score); // HUD 점수 오도미터
  const introRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  useFocusTrap(introRef, phase === "intro");
  useFocusTrap(resultRef, phase === "over");

  const triggerShake = useCallback(() => {
    setShake(false);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    // 다음 프레임에 다시 켜 애니메이션 재시작 보장
    requestAnimationFrame(() => {
      setShake(true);
      shakeTimer.current = setTimeout(() => setShake(false), 220);
    });
  }, []);

  const makeTilesFromColors = useCallback((colors: number[]): Tile[] => colors.map((c) => ({ id: nextId.current++, color: c })), []);

  const init = useCallback(() => {
    rngRef.current = mulberry32(seed);
    let colors = makeBoard(rngRef.current);
    if (!hasMove(colors)) colors = reshuffle(rngRef.current);
    setTiles(makeTilesFromColors(colors));
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_CONFIG.game.seconds);
    setPending(null);
    setFloaters([]);
    setClearing(new Set());
    setIsNewBest(false);
    setRank(null);
    setSubmitting(false);
    levelRef.current = 1;
    levelStartRef.current = 0;
    setLevel(1);
    setLevelProgress(0);
    setLevelBanner(null);
    usedRef.current = { bomb: 0, line: 0, shuffle: 0, time: 0 };
    // 아이템 소싱 — 두 모드 모두 기본(config start)씩 지급.
    //  · 랭킹도전(daily): 고정(공정, 인벤토리 미참조)
    //  · 아이템 대전(free): 기본 + 서버 보유분. 보유분은 invRef에 담아두고 '플레이 시작' 시 1회 반영
    //    (여기서 setItems로 덮으면 인게임 사용분을 롤백하는 레이스 발생 → 금지)
    setItems(initialItems()); // 기본 개수 즉시 표시(카운트다운 동안 프리뷰)
    invRef.current = {};
    if (mode === "free") {
      fetchAccount().then((a) => {
        invRef.current = a.inventory;
      });
    }
    try {
      setBest(Number(localStorage.getItem(bestKey) || 0));
    } catch {
      /* ignore */
    }
    // 온보딩: 최초 1회 자동 표시 + 설정으로 강제 표시 시. 이후엔 바로 카운트다운.
    setPhase(getOnboarding() || !getSeenIntro() ? "intro" : "countdown");
  }, [seed, mode, bestKey, makeTilesFromColors]);

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
        // 아이템 대전: 플레이 시작 시점에 기본 + 보유분을 1회 확정(이후 비동기 덮어쓰기 없음)
        if (mode === "free") {
          const inv = invRef.current;
          setItems({
            bomb: baseOf("bomb") + (inv.bomb ?? 0),
            line: baseOf("line") + (inv.line ?? 0),
            shuffle: baseOf("shuffle") + (inv.shuffle ?? 0),
            time: baseOf("time") + (inv.time ?? 0),
          });
        }
        setPhase("playing");
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
      setTimeLeft((tl) => Math.min(GAME_CONFIG.game.maxSeconds, tl + GAME_CONFIG.levels.bonusSec));
      sfxLevelUp();
      vibrate(80);
      triggerShake();
      const key = floaterId.current++;
      setLevelBanner({ n: levelRef.current, key });
      if (levelBannerTimer.current) clearTimeout(levelBannerTimer.current);
      levelBannerTimer.current = setTimeout(() => setLevelBanner(null), 1100);
    }
    setLevelProgress(Math.min(1, (score - levelStartRef.current) / targetOf(levelRef.current)));
  }, [score, phase]);

  // 타이머
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    // 시간이 다 됐어도 진행 중인 캐스케이드(busy)가 끝난 뒤에 종료·제출 → 표시 점수 = 제출 점수
    if (timeLeft === 0 && phase === "playing" && !busy) {
      setPhase("over");
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
        submitScore({ mode, seed, score, level: levelRef.current, nickname: getNick(), avatar: getAvatar() })
          .then((r) => {
            setRank(r);
            if (!r) toast.error(t("submit_failed")); // 실패를 사용자에게 통지(무음 삼킴 방지)
          })
          .finally(() => setSubmitting(false));
      }
      // 아이템 대전(free)은 기본 지급 초과 사용분만 서버 인벤토리에서 차감.
      if (mode === "free") {
        const u = usedRef.current;
        const toConsume: Inventory = {
          bomb: Math.max(0, u.bomb - baseOf("bomb")),
          line: Math.max(0, u.line - baseOf("line")),
          shuffle: Math.max(0, u.shuffle - baseOf("shuffle")),
          time: Math.max(0, u.time - baseOf("time")),
        };
        if (toConsume.bomb || toConsume.line || toConsume.shuffle || toConsume.time) void consumeItems(toConsume);
      }
    }
  }, [timeLeft, phase, busy, score, best, bestKey, onGameOver, mode, seed, t]);

  function spawnFloater(cells: Set<number>, text: string) {
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
    setFloaters((f) => [...f, { id, left, top, text }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 760);
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

  // 스페셜 연쇄 발동 — 시드 셀에 포함된 스페셜을 효과 셀로 확장(연쇄까지). 순수 계산.
  function detonate(seed: Set<number>, ts: (Tile | null)[]): Set<number> {
    const out = new Set(seed);
    const stack = [...seed];
    while (stack.length) {
      const i = stack.pop() as number;
      const t = ts[i];
      if (!t || !t.kind) continue;
      const cells = t.kind === "line" ? lineCells(i) : t.kind === "area" ? areaCells(i, 2) : colorCells(colorsOf(ts), t.color);
      for (const c of cells) if (!out.has(c)) { out.add(c); stack.push(c); }
    }
    return out;
  }

  // 후반 점수 배율(막판 폭발 훅)
  const scoreMul = (tl: number) => {
    const p = GAME_CONFIG.pacing;
    if (tl <= p.rushSec) return p.rushMul;
    if (tl <= p.frenzySec) return p.frenzyMul;
    return 1;
  };

  // 지운 셀 집합에 점수·연출 적용 + 스페셜 생성 반영 후 붕괴. 다음 보드 반환.
  async function applyClear(
    ts: (Tile | null)[],
    toClear: Set<number>,
    chain: number,
    creations: { cell: number; kind: SpecialKind }[],
  ): Promise<(Tile | null)[]> {
    setCombo(chain);
    setClearing(toClear);
    const gained = Math.round(toClear.size * 10 * Math.max(chain, 1) * scoreMul(timeLeftRef.current));
    setScore((s) => s + gained);
    spawnFloater(toClear, `+${gained}`);
    sfxMatch(chain);
    if (creations.length) sfxPower(); // 스페셜 생성 시 파워업 사운드
    vibrate(Math.min(8 + chain * 6, 40));
    if (chain >= 3 || toClear.size >= 8) triggerShake();
    if (chain >= 2) {
      const key = floaterId.current++;
      setComboFlash({ n: chain, key });
      if (comboTimer.current) clearTimeout(comboTimer.current);
      comboTimer.current = setTimeout(() => setComboFlash(null), 700);
    }
    // 생성될 스페셜을 타일에 표시(붕괴 시 유지) — 지워지지 않고 살아남음
    const marked = creations.length
      ? ts.map((t, i) => {
          const cr = creations.find((x) => x.cell === i);
          return cr && t ? { ...t, kind: cr.kind } : t;
        })
      : ts;
    await sleep(200);
    const { next, spawned } = collapseTiles(marked, toClear, rngRef.current);
    setClearing(new Set());
    setSpawnedIds(spawned);
    setTiles(next);
    await sleep(230);
    return next;
  }

  async function resolve(startTiles: (Tile | null)[], prefer: number[] = []) {
    let ts = startTiles;
    let chain = 0;
    let pref = prefer;
    for (;;) {
      const { cleared, creations } = analyzeMatches(colorsOf(ts), pref);
      pref = [];
      if (cleared.size === 0) break;
      chain++;
      const creationCells = new Set(creations.map((c) => c.cell));
      // 생성 스페셜은 이번엔 살아남음 → clear에서 제외. 기존 스페셜은 연쇄 발동.
      const base = new Set([...cleared].filter((c) => !creationCells.has(c)));
      let toClear = detonate(base, ts);
      if (toClear.size > base.size) {
        sfxSpecial();
        triggerShake();
      }
      for (const c of creationCells) toClear.delete(c);
      ts = await applyClear(ts, toClear, chain, creations);
    }
    setCombo(0);
    if (!hasMove(colorsOf(ts))) {
      const colors = reshuffle(rngRef.current);
      const fresh = makeTilesFromColors(colors);
      setSpawnedIds(new Set(fresh.map((x) => x.id)));
      setTiles(fresh);
    }
  }

  async function clearWithItem(cells: Set<number>, base: (Tile | null)[]) {
    setBusy(true);
    triggerShake(); // 아이템 폭발 임팩트
    vibrate(35);
    const toClear = detonate(cells, base); // 아이템 범위에 걸린 보드 스페셜도 연쇄 발동
    setClearing(toClear);
    const gained = Math.round(toClear.size * 10 * scoreMul(timeLeftRef.current));
    setScore((s) => s + gained);
    spawnFloater(toClear, `+${gained}`);
    await sleep(200);
    const { next, spawned } = collapseTiles(base, toClear, rngRef.current);
    setClearing(new Set());
    setSpawnedIds(spawned);
    setTiles(next);
    await sleep(230);
    await resolve(next);
    setBusy(false);
  }

  async function attemptSwap(a: number, b: number) {
    if (busy || phase !== "playing") return;
    const swapped = [...tiles];
    [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
    const specialInvolved = !!(swapped[a]?.kind || swapped[b]?.kind);
    const hasMatch = findMatches(colorsOf(swapped)).size > 0;

    if (!hasMatch && !specialInvolved) {
      // 무효 스왑 — 흔들림 + 사운드 + 햅틱 피드백 후 되돌림
      setBusy(true);
      triggerShake();
      sfxInvalid();
      vibrate(30);
      setTiles(swapped);
      await sleep(170);
      setTiles(tiles);
      setBusy(false);
      return;
    }

    setBusy(true);
    setTiles(swapped);
    await sleep(120);

    if (specialInvolved) {
      // 스페셜을 스왑으로 발동(3매치 불필요) — 스왑 두 칸의 스페셜을 연쇄 발동
      triggerShake();
      sfxSpecial();
      vibrate(45);
      const seed = new Set<number>();
      if (swapped[a]?.kind) seed.add(a);
      if (swapped[b]?.kind) seed.add(b);
      const toClear = detonate(seed, swapped);
      setClearing(toClear);
      const gained = Math.round(toClear.size * 10 * scoreMul(timeLeftRef.current));
      setScore((s) => s + gained);
      spawnFloater(toClear, `+${gained}`);
      await sleep(200);
      const { next, spawned } = collapseTiles(swapped, toClear, rngRef.current);
      setClearing(new Set());
      setSpawnedIds(spawned);
      setTiles(next);
      await sleep(230);
      await resolve(next);
    } else {
      await resolve(swapped, [a, b]); // 스왑 위치에 스페셜 우선 생성
    }
    setBusy(false);
  }

  // 아이템 1개 소비 — 개수 차감 + 사용량 누적(자유 플레이 인벤토리 차감용)
  function spendItem(type: ItemType) {
    setItems((it) => ({ ...it, [type]: it[type] - 1 }));
    usedRef.current[type] += 1;
    sfxItem();
    vibrate(20);
  }

  // ── 입력: 드래그 스왑 (아이템 타게팅은 탭) ──
  function onDown(e: React.PointerEvent, cell: number) {
    if (phase !== "playing" || busy) return;
    if (pending === "bomb" || pending === "line") {
      const type = pending;
      setPending(null);
      spendItem(type);
      void clearWithItem(type === "bomb" ? bombCells(cell) : lineCells(cell), tiles);
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
    if (!d || busy) return;
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
    void attemptSwap(d.cell, idx(tr, tc));
  }
  const onUp = () => {
    dragRef.current = null;
  };

  function useItem(type: ItemType) {
    if (phase !== "playing" || busy || items[type] <= 0) return;
    if (type === "time") {
      spendItem("time");
      setTimeLeft((s) => Math.min(GAME_CONFIG.game.maxSeconds, s + 10)); // 상한 — score-attack 정합
      return;
    }
    if (type === "shuffle") {
      spendItem("shuffle");
      const colors = reshuffle(rngRef.current);
      const fresh = makeTilesFromColors(colors);
      setSpawnedIds(new Set(fresh.map((x) => x.id)));
      setTiles(fresh);
      return;
    }
    setPending((p) => (p === type ? null : type));
  }

  const startTutorial = () => {
    unlockAudio();
    setSeenIntro(); // 최초 1회 이후 자동 표시 중단
    setPhase("countdown");
  };

  const cell = 100 / SIZE;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-3 pb-4 pt-3">
      {/* HUD */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[14px] bg-surface-1 py-2 ring-1 ring-hairline">
          <div className="text-[10px] font-bold uppercase tracking-wide text-subtle">{t("score")}</div>
          <div className="text-[20px] font-black tabular-nums">{shownScore.toLocaleString()}</div>
        </div>
        <div className={`relative rounded-[14px] py-2 ring-1 ${timeLeft <= 10 ? "bg-live/15 ring-live/40" : "bg-surface-1 ring-hairline"}`}>
          <div className="text-[10px] font-bold uppercase tracking-wide text-subtle">{t("time")}</div>
          <div className={`text-[20px] font-black tabular-nums ${timeLeft <= 10 ? "text-live" : ""}`}>{timeLeft}</div>
          {phase === "playing" && scoreMul(timeLeft) > 1 && (
            <span className="anim-count-pop absolute -right-1 -top-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-black text-black">
              ×{scoreMul(timeLeft)}
            </span>
          )}
        </div>
        <div className="rounded-[14px] bg-surface-1 py-2 ring-1 ring-hairline">
          <div className="text-[10px] font-bold uppercase tracking-wide text-subtle">{t("combo")}</div>
          <div key={combo} className={`text-[20px] font-black tabular-nums ${combo > 1 ? "anim-count-pop text-primary-400" : ""}`}>
            {combo > 0 ? `${combo}x` : "-"}
          </div>
        </div>
      </div>

      {/* 레벨 + 진행 바 */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[12px] font-black text-primary-400">
          {t("lv_prefix")}
          {level}
        </span>
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2 ring-1 ring-hairline">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.round(levelProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* 보드 */}
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-[18px] bg-surface-1 p-1 ring-1 ring-hairline ${shake ? "anim-shake" : ""}`}
        style={{ touchAction: "none" }}
      >
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
              onPointerUp={onUp}
            >
              <div
                className={`relative flex h-full w-full items-center justify-center rounded-[10px] text-[min(5.5vw,24px)] leading-none ${
                  clearing.has(i) ? "anim-tile-clear" : spawnedIds.has(tile.id) ? "anim-tile-spawn" : ""
                } ${pending ? "cursor-crosshair" : ""} ${tile.kind ? "special-tile ring-2 ring-white/90" : ""}`}
                style={{ background: GAME_CONFIG.tiles[tile.color].bg }}
              >
                <span className="pointer-events-none drop-shadow-sm">{GAME_CONFIG.tiles[tile.color].glyph}</span>
                {tile.kind && (
                  <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[42%] w-[42%] items-center justify-center rounded-full bg-black/75 text-[min(2.6vw,11px)]">
                    {tile.kind === "line" ? "✚" : tile.kind === "area" ? "💥" : "🌈"}
                  </span>
                )}
              </div>
            </div>
          ) : null,
        )}

        {/* 플로팅 +점수 */}
        {floaters.map((f) => (
          <span
            key={f.id}
            className="anim-float-up pointer-events-none absolute z-20 text-[15px] font-black text-white drop-shadow"
            style={{ left: `${f.left}%`, top: `${f.top}%` }}
          >
            {f.text}
          </span>
        ))}

        {/* 레벨업 배너 */}
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
              <div className="text-[12px] font-black text-white/90">{t("level_up")}</div>
            </div>
          </div>
        )}

        {/* 콤보 응원 배너 (2연쇄부터, 체인 상승 시 강조) */}
        {comboFlash && (
          <div
            key={comboFlash.key}
            className="anim-combo-flash pointer-events-none absolute left-1/2 top-[42%] z-20"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div className="font-display font-black text-primary-400 drop-shadow-lg" style={{ fontSize: `${Math.min(28 + comboFlash.n * 5, 60)}px` }}>
              {comboFlash.n}x
            </div>
            <div className="text-center text-[13px] font-black text-white drop-shadow">
              {COMBO_WORDS[Math.min(comboFlash.n, COMBO_WORDS.length - 1)] || "COMBO!"}
            </div>
          </div>
        )}

        {/* 아이템 타게팅 안내 */}
        {pending && (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center">
            <span className="rounded-full bg-black/70 px-3 py-1 text-[12px] font-bold text-white">
              {t(pending === "bomb" ? "item_bomb" : "item_line")} · 위치를 탭하세요
            </span>
          </div>
        )}

        {/* 카운트다운 */}
        {phase === "countdown" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
            <div key={countdown} className="anim-count-punch font-display text-[88px] font-black text-white drop-shadow-lg">
              {countdown > 0 ? countdown : t("go")}
            </div>
          </div>
        )}
      </div>

      {/* 아이템 바 */}
      <div className="grid grid-cols-4 gap-2">
        {GAME_CONFIG.items.map(({ type, icon: Icon, labelKey }) => (
          <button
            key={type}
            onClick={() => useItem(type)}
            disabled={items[type] <= 0 || phase !== "playing"}
            className={`flex flex-col items-center gap-0.5 rounded-[14px] py-2 text-[11px] font-bold ring-1 transition-colors ${
              pending === type
                ? "bg-primary/20 text-primary-400 ring-primary/40"
                : items[type] > 0
                  ? "bg-surface-1 text-fg ring-hairline active:scale-95"
                  : "bg-surface-1 text-subtle ring-hairline opacity-40"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
            <span className="text-[10px] text-muted">×{items[type]}</span>
          </button>
        ))}
      </div>

      {/* 온보딩 (최초 1회) */}
      {phase === "intro" && (
        <div className="anim-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6">
          <div
            ref={introRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("tutorial_title")}
            tabIndex={-1}
            className="anim-pop-in w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
          >
            <div className="text-[16px] font-black">{t("tutorial_title")}</div>
            {/* 데모: 첫 블록을 옆 칸으로 끌어와 같은 색 3개를 맞춤 */}
            <div className="relative mx-auto my-6 h-12" style={{ width: 200 }}>
              {/* 3매치 하이라이트(스왑 완료 순간) */}
              <div
                className="absolute rounded-[14px] ring-[3px] ring-white/85"
                style={{ left: -2, top: -2, width: 152, height: 52, animation: "demo-glow 2.8s ease-in-out infinite" }}
              />
              {/* 고정 타일 (슬롯 0·1) */}
              {[0, 52].map((x) => (
                <div
                  key={x}
                  className="absolute flex h-11 w-11 items-center justify-center rounded-[12px] text-[22px]"
                  style={{ left: x, top: 0, background: GAME_CONFIG.tiles[0].bg }}
                >
                  💜
                </div>
              ))}
              {/* 첫 블록 ⭐ — 오른쪽으로 이동 */}
              <div
                className="absolute flex h-11 w-11 items-center justify-center rounded-[12px] text-[22px]"
                style={{ left: 104, top: 0, background: GAME_CONFIG.tiles[3].bg, animation: "demo-move-r 2.8s ease-in-out infinite" }}
              >
                ⭐
              </div>
              {/* 옆 블록 💜 — 왼쪽으로 밀려나 자리 교환 */}
              <div
                className="absolute flex h-11 w-11 items-center justify-center rounded-[12px] text-[22px]"
                style={{ left: 156, top: 0, background: GAME_CONFIG.tiles[0].bg, animation: "demo-move-l 2.8s ease-in-out infinite" }}
              >
                💜
              </div>
              {/* 손가락 */}
              <span
                className="absolute text-[24px]"
                style={{ left: 112, top: 30, animation: "demo-finger 2.8s ease-in-out infinite" }}
              >
                👆
              </span>
            </div>
            <p className="mb-5 text-[13px] leading-relaxed text-muted break-keep">{t("tutorial_body")}</p>
            <button
              onClick={startTutorial}
              className="w-full rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]"
            >
              {t("tutorial_start")}
            </button>
          </div>
        </div>
      )}

      {/* 결과 */}
      {phase === "over" && (
        <div className="anim-backdrop-in fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/75 p-6">
          {/* 최고 점수 갱신 컨페티 */}
          {isNewBest &&
            CONFETTI.map((p, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }}
              />
            ))}
          <div
            ref={resultRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("result_title")}
            tabIndex={-1}
            className="anim-pop-in w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
          >
            <div className="mb-3 flex items-center justify-center gap-2">
              <Avatar value={getAvatar()} size="sm" />
              <span className="max-w-[60%] truncate text-[13px] font-bold text-fg">{getNick() || t("nickname")}</span>
            </div>
            {/* 도달 레벨 뱃지 */}
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[13px] font-black text-primary-400">
              {t("result_level")} {t("lv_prefix")}
              {levelRef.current}
            </div>
            <div className="text-[15px] font-black text-muted">{t("result_title")}</div>
            <div className="my-2 text-[44px] font-black tabular-nums text-primary-400">{shownScore.toLocaleString()}</div>
            {isNewBest && <div className="mb-2 text-[13px] font-bold text-gold">{t("result_new_best")}</div>}

            {/* 모드 랭크 (서버 응답) */}
            {(submitting || (rank && rank.rank != null && (rank.total || 0) > 0)) && (
              <div className="mb-4 rounded-[14px] bg-surface-1 px-4 py-3 ring-1 ring-hairline">
                <div className="text-[10px] font-bold text-subtle">{t(mode === "free" ? "lb_item" : "lb_normal")}</div>
                {submitting || !rank || rank.rank == null ? (
                  <div className="mx-auto mt-1 h-5 w-24 animate-pulse rounded bg-surface-2" />
                ) : (
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-[22px] font-black tabular-nums text-primary-400">
                      {rank.rank.toLocaleString()}
                      <span className="text-[12px] font-bold text-muted">{t("rank_unit")}</span>
                    </span>
                    <span className="text-[11px] font-bold text-gold">
                      {t("top_percent").replace("{p}", String(topPercent(rank.rank, rank.total || 0)))}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button onClick={init} className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]">
                <RotateCcw className="h-4 w-4" /> {t("retry")}
              </button>
              {onViewRanking && (
                <button onClick={onViewRanking} className="flex items-center justify-center gap-2 rounded-full bg-surface-1 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]">
                  <Trophy className="h-4 w-4 text-gold" /> {t("view_ranking")}
                </button>
              )}
              {onExit && (
                <button onClick={onExit} className="flex items-center justify-center gap-2 rounded-full bg-surface-1 py-3 text-[14px] font-bold text-muted ring-1 ring-hairline">
                  <Home className="h-4 w-4" /> {t("home")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
