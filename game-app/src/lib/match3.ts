// V01D POP — 매치3 순수 로직 (렌더 무관, 테스트 가능). 시드 RNG로 일일 챌린지 결정성 확보.

export type Board = number[]; // 길이 SIZE*SIZE, 값=색 인덱스(0~COLORS-1), -1=빈칸
export const SIZE = 8;
export const COLORS = 6;

// 결정론적 RNG (mulberry32)
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const idx = (r: number, c: number): number => r * SIZE + c;
export const rc = (i: number): [number, number] => [Math.floor(i / SIZE), i % SIZE];

// 초기 매치 없는 보드 생성
export function makeBoard(rng: () => number): Board {
  const b = new Array<number>(SIZE * SIZE).fill(-1);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let color: number;
      do {
        color = Math.floor(rng() * COLORS);
      } while (
        (c >= 2 && b[idx(r, c - 1)] === color && b[idx(r, c - 2)] === color) ||
        (r >= 2 && b[idx(r - 1, c)] === color && b[idx(r - 2, c)] === color)
      );
      b[idx(r, c)] = color;
    }
  }
  return b;
}

// 3개 이상 연속(가로·세로) 매치 셀 집합
export function findMatches(b: Board): Set<number> {
  const m = new Set<number>();
  for (let r = 0; r < SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= SIZE; c++) {
      const same = c < SIZE && b[idx(r, c)] !== -1 && b[idx(r, c)] === b[idx(r, c - 1)];
      if (same) run++;
      else {
        if (run >= 3) for (let k = 0; k < run; k++) m.add(idx(r, c - 1 - k));
        run = 1;
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= SIZE; r++) {
      const same = r < SIZE && b[idx(r, c)] !== -1 && b[idx(r, c)] === b[idx(r - 1, c)];
      if (same) run++;
      else {
        if (run >= 3) for (let k = 0; k < run; k++) m.add(idx(r - 1 - k, c));
        run = 1;
      }
    }
  }
  return m;
}

// ── 스페셜 타일 ──
export type SpecialKind = "line" | "area" | "color"; // 라인클리어 / 광역(5x5) / 컬러밤

type Run = { cells: number[]; len: number; orient: "h" | "v" };

function collectRuns(b: Board): Run[] {
  const runs: Run[] = [];
  for (let r = 0; r < SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= SIZE; c++) {
      const same = c < SIZE && b[idx(r, c)] !== -1 && b[idx(r, c)] === b[idx(r, c - 1)];
      if (same) run++;
      else {
        if (run >= 3) {
          const cells: number[] = [];
          for (let k = 0; k < run; k++) cells.push(idx(r, c - 1 - k));
          runs.push({ cells, len: run, orient: "h" });
        }
        run = 1;
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= SIZE; r++) {
      const same = r < SIZE && b[idx(r, c)] !== -1 && b[idx(r, c)] === b[idx(r - 1, c)];
      if (same) run++;
      else {
        if (run >= 3) {
          const cells: number[] = [];
          for (let k = 0; k < run; k++) cells.push(idx(r - 1 - k, c));
          runs.push({ cells, len: run, orient: "v" });
        }
        run = 1;
      }
    }
  }
  return runs;
}

// 매치 분석 — 지울 셀 집합 + 스페셜 생성 지점.
//  · 가로·세로 3+ 교차(L/T) → area, 5+ 직선 → color, 4 직선 → line.
//  · prefer(스왑 셀)에 스페셜을 우선 배치해 플레이어가 만든 위치에 생성.
export function analyzeMatches(
  b: Board,
  prefer: number[] = [],
): { cleared: Set<number>; creations: { cell: number; kind: SpecialKind }[] } {
  const runs = collectRuns(b);
  const cleared = new Set<number>();
  for (const rn of runs) for (const cell of rn.cells) cleared.add(cell);

  const hCells = new Set<number>();
  const vCells = new Set<number>();
  for (const rn of runs) for (const cell of rn.cells) (rn.orient === "h" ? hCells : vCells).add(cell);

  const used = new Set<number>();
  const creations: { cell: number; kind: SpecialKind }[] = [];
  const pickPivot = (cells: number[]) => cells.find((c) => prefer.includes(c)) ?? cells[Math.floor(cells.length / 2)];

  // 1) L/T 교차 → 광역
  for (const cell of hCells) {
    if (vCells.has(cell) && !used.has(cell)) {
      creations.push({ cell, kind: "area" });
      used.add(cell);
    }
  }
  // 2) 직선 5+ → 컬러밤, 4 → 라인 (교차로 이미 스페셜이 된 셀 포함 런은 skip)
  for (const rn of runs) {
    if (rn.cells.some((c) => used.has(c))) continue;
    if (rn.len >= 5) {
      const p = pickPivot(rn.cells);
      creations.push({ cell: p, kind: "color" });
      used.add(p);
    } else if (rn.len === 4) {
      const p = pickPivot(rn.cells);
      creations.push({ cell: p, kind: "line" });
      used.add(p);
    }
  }
  return { cleared, creations };
}

// 광역: 중심 반경 radius 정사각형
export function areaCells(center: number, radius = 2): Set<number> {
  const [r0, c0] = rc(center);
  const s = new Set<number>();
  for (let r = r0 - radius; r <= r0 + radius; r++)
    for (let c = c0 - radius; c <= c0 + radius; c++) if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) s.add(idx(r, c));
  return s;
}

// 컬러밤: 특정 색 전체
export function colorCells(b: Board, color: number): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i < b.length; i++) if (b[i] === color) s.add(i);
  return s;
}

export const areAdjacent = (a: number, b: number): boolean => {
  const [r1, c1] = rc(a);
  const [r2, c2] = rc(b);
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
};

export function swap(b: Board, i: number, j: number): Board {
  const n = [...b];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

// 매치 셀 제거 → 낙하 → 상단 시드 리필
export function collapse(b: Board, cleared: Set<number>, rng: () => number): Board {
  const n = [...b];
  for (const i of cleared) n[i] = -1;
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (n[idx(r, c)] !== -1) {
        const v = n[idx(r, c)];
        n[idx(r, c)] = -1;
        n[idx(write, c)] = v;
        write--;
      }
    }
    for (let r = write; r >= 0; r--) n[idx(r, c)] = Math.floor(rng() * COLORS);
  }
  return n;
}

// 유효한 이동 하나 반환(유휴 힌트용) — 없으면 null
export function findMove(b: Board): [number, number] | null {
  for (let i = 0; i < b.length; i++) {
    const [r, c] = rc(i);
    const cands = [c < SIZE - 1 ? idx(r, c + 1) : -1, r < SIZE - 1 ? idx(r + 1, c) : -1];
    for (const j of cands) {
      if (j < 0) continue;
      if (findMatches(swap(b, i, j)).size > 0) return [i, j];
    }
  }
  return null;
}

// 유효한 이동(스왑 시 매치 발생)이 존재하는가
export function hasMove(b: Board): boolean {
  return findMove(b) !== null;
}

// 이동 가능한 새 보드
export function reshuffle(rng: () => number): Board {
  let b = makeBoard(rng);
  let guard = 0;
  while (!hasMove(b) && guard++ < 50) b = makeBoard(rng);
  return b;
}

// 폭탄: 중심 3x3 셀 집합
export function bombCells(center: number): Set<number> {
  const [r0, c0] = rc(center);
  const s = new Set<number>();
  for (let r = r0 - 1; r <= r0 + 1; r++)
    for (let c = c0 - 1; c <= c0 + 1; c++) if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) s.add(idx(r, c));
  return s;
}

// 라인: 해당 행 + 열 전체
export function lineCells(center: number): Set<number> {
  const [r0, c0] = rc(center);
  const s = new Set<number>();
  for (let c = 0; c < SIZE; c++) s.add(idx(r0, c));
  for (let r = 0; r < SIZE; r++) s.add(idx(r, c0));
  return s;
}

// 오늘(KST) 일일 챌린지 시드
export function dailySeed(now = new Date()): number {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return Number(`${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, "0")}${String(kst.getUTCDate()).padStart(2, "0")}`);
}
