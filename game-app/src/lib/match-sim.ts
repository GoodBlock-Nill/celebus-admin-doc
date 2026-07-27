// 서버 리플레이 엔진 (점수 위조 방어 Step 2b) — (seed + 입력 로그)를 결정론적으로 재생.
//   클라(Match3Game.tsx)의 점수·RNG·캐스케이드 로직을 그대로 이식. 피버(잔여시간 의존) 배수는
//   [하한=배수1 ~ 상한=러시배수]로 브래킷 → 정확한 타이밍 없이도 "가능 점수 범위"를 산출.
//   반환: 각 수의 합법성(illegal 수) + scoreMin/scoreMax. 클라 점수가 scoreMax 초과면 위조.
import {
  SIZE,
  COLORS,
  idx,
  mulberry32,
  makeBoard,
  reshuffle,
  hasMove,
  findMatches,
  analyzeMatches,
  bombCells,
  lineCells,
  rowCells,
  colCells,
  areaCells,
  colorCells,
  comboCells,
  isLineKind,
  type SpecialKind,
} from "./match3";

// 점수 상수 — GAME_CONFIG 기본값과 동일(엔진을 config/아이콘 그래프와 분리해 서버·테스트에서 가볍게 사용).
// 관리자가 remote config로 바꾸면 라우트가 override를 넘겨 반영.
export type SimConfig = { bonus4: number; bonus5: number; bonusCross: number; bonusSquare: number; rushMul: number };
const DEFAULT_CFG: SimConfig = { bonus4: 40, bonus5: 50, bonusCross: 30, bonusSquare: 15, rushMul: 2 };

type Cell = { color: number; kind?: SpecialKind } | null;
type Move = { t: number; k: string; a?: number; b?: number; c?: number };

const colorsOf = (cells: Cell[]) => cells.map((c) => (c ? c.color : -1));

// 클라 collapseTiles와 동일 — 열 단위 생존 낙하 + 상단 리필(RNG 소비, kind는 생존 타일만 유지)
function collapse(cells: Cell[], cleared: Set<number>, rng: () => number): Cell[] {
  const n: Cell[] = cells.map((c, i) => (cleared.has(i) ? null : c));
  for (let c = 0; c < SIZE; c++) {
    const survivors: Cell[] = [];
    for (let r = SIZE - 1; r >= 0; r--) {
      const t = n[idx(r, c)];
      if (t) survivors.push(t);
    }
    let write = SIZE - 1;
    for (const t of survivors) {
      n[idx(write, c)] = t;
      write--;
    }
    for (let r = write; r >= 0; r--) n[idx(r, c)] = { color: Math.floor(rng() * COLORS) };
  }
  return n;
}

// 클라 detonate와 동일 — 스페셜 연쇄 발동 효과 셀 확장
function detonate(seedCells: Set<number>, cells: Cell[]): Set<number> {
  const out = new Set(seedCells);
  const stack = [...seedCells];
  while (stack.length) {
    const i = stack.pop() as number;
    const tl = cells[i];
    if (!tl || !tl.kind) continue;
    const eff =
      tl.kind === "lineH" ? rowCells(i) : tl.kind === "lineV" ? colCells(i) : tl.kind === "area" ? areaCells(i, 2) : colorCells(colorsOf(cells), tl.color);
    for (const cc of eff)
      if (!out.has(cc)) {
        out.add(cc);
        stack.push(cc);
      }
  }
  return out;
}

type Sim = { min: number; max: number; illegal: number };

// 한 번의 clear에 점수 누적 (하한 배수1 / 상한 러시배수)
function addScore(sim: Sim, base: number, rush: number) {
  sim.min += Math.round(base * 1);
  sim.max += Math.round(base * rush);
}

// 캐스케이드 해소 (클라 resolve와 동일 순서) → 최종 보드 반환
function resolve(cells: Cell[], rng: () => number, sim: Sim, cfg: SimConfig, prefer: number[] = []): Cell[] {
  let ts = cells;
  let chain = 0;
  let pref = prefer;
  for (;;) {
    const { cleared, creations, squares } = analyzeMatches(colorsOf(ts), pref);
    pref = [];
    if (cleared.size === 0) break;
    chain++;
    const creationCells = new Set(creations.map((c) => c.cell));
    const base = new Set([...cleared].filter((c) => !creationCells.has(c)));
    const toClear = detonate(base, ts);
    for (const c of creationCells) toClear.delete(c);
    const bonus =
      creations.reduce((s, c) => s + (isLineKind(c.kind) ? cfg.bonus4 : c.kind === "color" ? cfg.bonus5 : cfg.bonusCross), 0) +
      squares * cfg.bonusSquare;
    addScore(sim, toClear.size * 10 * Math.max(chain, 1) + bonus, cfg.rushMul);
    // 생성 스페셜 kind 표시(붕괴 시 유지)
    const marked = creations.length
      ? ts.map((tl, i) => {
          const cr = creations.find((x) => x.cell === i);
          return cr && tl ? { ...tl, kind: cr.kind } : tl;
        })
      : ts;
    ts = collapse(marked, toClear, rng);
  }
  if (!hasMove(colorsOf(ts))) ts = reshuffle(rng).map((color) => ({ color }));
  return ts;
}

// (seed + moves) 재생 → 점수 범위 + 위법 수. mode='free'만 아이템 존재.
export function simulate(seed: number, moves: Move[], cfg: SimConfig = DEFAULT_CFG): Sim {
  const rng = mulberry32(seed);
  let colors = makeBoard(rng);
  if (!hasMove(colors)) colors = reshuffle(rng);
  let cells: Cell[] = colors.map((color) => ({ color }));
  const sim: Sim = { min: 0, max: 0, illegal: 0 };

  for (const m of moves) {
    if (m.k === "s") {
      const a = m.a!,
        b = m.b!;
      const swapped = [...cells];
      [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
      const specialInvolved = !!(swapped[a]?.kind || swapped[b]?.kind);
      const hasMatch = findMatches(colorsOf(swapped)).size > 0;
      if (!hasMatch && !specialInvolved) {
        sim.illegal++; // 로그된 스왑인데 실제로 매치/스페셜을 못 만듦 = 위조 로그
        continue;
      }
      if (specialInvolved) {
        // 스페셜 1개=시드 발동 / 스페셜 2개=메가콤보 (클라와 동일 comboCells → 결정론 유지)
        const toClear = detonate(comboCells(a, b, swapped), swapped);
        addScore(sim, toClear.size * 10, cfg.rushMul);
        cells = resolve(collapse(swapped, toClear, rng), rng, sim, cfg);
      } else {
        cells = resolve(swapped, rng, sim, cfg, [a, b]);
      }
    } else if (m.k === "b" || m.k === "l") {
      const center = m.c!;
      const seedCells = m.k === "b" ? bombCells(center) : lineCells(center);
      const toClear = detonate(seedCells, cells);
      addScore(sim, toClear.size * 10, cfg.rushMul);
      cells = resolve(collapse(cells, toClear, rng), rng, sim, cfg);
    } else if (m.k === "h") {
      cells = reshuffle(rng).map((color) => ({ color })); // 셔플 = RNG 소비
    }
    // 'x'(시간+)·'c'(이어하기)는 보드·RNG 무관 → 스킵
  }
  return sim;
}
