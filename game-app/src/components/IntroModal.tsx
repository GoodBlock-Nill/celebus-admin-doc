"use client";

// 온보딩(최초 1회) — 2페이지:
//   ① 인터랙티브 실습: 반짝이는 두 블록을 직접 스왑해 3매치를 성공시켜야 다음 진행(learn by doing).
//   ② 스페셜·아이템 안내. 스페셜 미리보기는 인게임과 동일한 sp-* 오버레이/실아트 재사용.
import { useRef, useState } from "react";
import { GAME_CONFIG } from "@/lib/game-config";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { sfxMatch, sfxInvalid, unlockAudio } from "@/lib/sfx";
import { vibrate } from "@/lib/game-api";
import { useLang } from "./LangProvider";

// 실습 미니보드 — 3×3, 유일 정답은 하이라이트된 두 칸 스왑(col0을 같은 색 3개로 완성)
const P_COLS = 3;
const P_SIZE = 52;
const P_INIT = [0, 1, 2, 0, 2, 1, 3, 0, 1]; // 색 인덱스(스왑 전, 사전 매치 없음)
const P_TARGET: [number, number] = [6, 7]; // (2,0)↔(2,1) 스왑 시 col0 = [0,0,0]
const P_CLEAR = [0, 3, 6]; // 성공 시 터지는 col0 셀
const adj = (a: number, b: number) => {
  const ra = Math.floor(a / P_COLS),
    ca = a % P_COLS,
    rb = Math.floor(b / P_COLS),
    cb = b % P_COLS;
  return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
};

function PracticeTile({ colorIdx }: { colorIdx: number }) {
  const skin = GAME_CONFIG.tiles[colorIdx];
  return skin.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={skin.img}
      alt=""
      draggable={false}
      className={`pointer-events-none h-full w-full rounded-[11px] ${skin.cover ? "object-cover" : "object-contain p-[13%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]"}`}
    />
  ) : (
    <span className="pointer-events-none text-[22px]">{skin.glyph}</span>
  );
}

function PracticeBoard({ onSolved }: { onSolved: () => void }) {
  const [board, setBoard] = useState<number[]>([...P_INIT]);
  const [selected, setSelected] = useState<number | null>(null);
  const [shakeCell, setShakeCell] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const startRef = useRef<number | null>(null);

  const isTarget = (a: number, b: number) => (a === P_TARGET[0] && b === P_TARGET[1]) || (a === P_TARGET[1] && b === P_TARGET[0]);

  const attempt = (a: number, b: number) => {
    if (solved) return;
    if (!adj(a, b) || !isTarget(a, b)) {
      // 잘못된/무효 스왑 — 흔들고 유지(정답 유도)
      sfxInvalid();
      vibrate(30);
      setShakeCell(a);
      setSelected(null);
      setTimeout(() => setShakeCell(null), 300);
      return;
    }
    // 정답 — 스왑 후 col0 3매치 클리어 + 성공
    const nb = [...board];
    [nb[a], nb[b]] = [nb[b], nb[a]];
    setBoard(nb);
    setSelected(null);
    setSolved(true);
    unlockAudio();
    sfxMatch(1, 3);
    vibrate(60);
    setTimeout(onSolved, 850);
  };

  const onDown = (i: number) => {
    if (solved) return;
    startRef.current = i;
  };
  const onUp = (i: number) => {
    if (solved) return;
    const s = startRef.current;
    startRef.current = null;
    if (s == null) return;
    if (i !== s) {
      attempt(s, i); // 드래그 스왑
    } else if (selected == null) {
      setSelected(i); // 탭-탭: 첫 선택
    } else if (selected === i) {
      setSelected(null); // 같은 칸 재탭 = 취소
    } else {
      attempt(selected, i); // 탭-탭: 두 번째 선택으로 스왑
    }
  };

  return (
    <div
      className="mx-auto my-5 w-fit"
      style={{ display: "grid", gridTemplateColumns: `repeat(${P_COLS}, ${P_SIZE}px)`, gap: 6, touchAction: "none" }}
    >
      {board.map((color, i) => {
        const isHint = !solved && (i === P_TARGET[0] || i === P_TARGET[1]);
        const clearing = solved && P_CLEAR.includes(i);
        return (
          <div
            key={i}
            onPointerDown={() => onDown(i)}
            onPointerUp={() => onUp(i)}
            className={`relative flex items-center justify-center rounded-[11px] ${shakeCell === i ? "anim-shake" : ""} ${
              clearing ? "anim-tile-clear" : ""
            } ${isHint ? "ring-[3px] ring-white/90 animate-pulse" : ""} ${selected === i ? "ring-[3px] ring-primary" : ""}`}
            style={{ width: P_SIZE, height: P_SIZE, background: GAME_CONFIG.tiles[color].bg }}
          >
            <PracticeTile colorIdx={color} />
          </div>
        );
      })}
    </div>
  );
}

// 스페셜·아이템 안내 행 (좌: 미리보기 타일, 우: 설명)
function InfoRow({ tile, text }: { tile: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-surface-1 px-3 py-2.5 ring-1 ring-hairline">
      <div className="relative h-10 w-10 shrink-0">{tile}</div>
      <span className="text-left text-[12.5px] font-bold leading-snug text-fg break-keep">{text}</span>
    </div>
  );
}

export default function IntroModal({ onStart }: { onStart: () => void }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [solved, setSolved] = useState(false);
  useFocusTrap(ref, true);
  const skin = (i: number) => GAME_CONFIG.tiles[i];
  const miniTile = (colorIdx: number, kind?: "lineH" | "lineV" | "area" | "color") => {
    const spImg = kind ? GAME_CONFIG.specials[kind] : undefined;
    return (
      <div className="relative flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ background: skin(colorIdx).bg }}>
        {!spImg && skin(colorIdx).img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={skin(colorIdx).img} alt="" className="pointer-events-none h-full w-full rounded-[10px] object-contain p-[13%]" />
        )}
        {spImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={spImg} alt="" className="pointer-events-none absolute inset-0 h-full w-full rounded-[10px] object-contain" />
        ) : (
          kind && <span className={`sp-${kind}`} />
        )}
      </div>
    );
  };
  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-black/75 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("tutorial_title")}
        tabIndex={-1}
        className="anim-pop-in my-auto w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
      >
        {page === 0 ? (
          <>
            <div className="text-[16px] font-black">{t("tutorial_title")}</div>
            {/* 인터랙티브 실습 — 직접 스왑해 3매치 성공 시 진행 */}
            <PracticeBoard onSolved={() => setSolved(true)} />
            <p className={`mb-5 text-[13px] font-bold leading-relaxed break-keep ${solved ? "text-gold" : "text-muted"}`}>
              {t(solved ? "tutorial_success" : "tutorial_try")}
            </p>
            <button
              onClick={() => setPage(1)}
              disabled={!solved}
              className="w-full rounded-full bg-primary py-3 text-[15px] font-black text-white transition-opacity active:scale-[0.99] disabled:opacity-40"
            >
              {t("tutorial_next")}
            </button>
            {!solved && (
              <button onClick={() => setPage(1)} className="mt-2 text-[12px] font-bold text-subtle underline underline-offset-2">
                {t("tutorial_skip")}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 text-[16px] font-black">{t("tutorial2_title")}</div>
            <div className="flex flex-col gap-2">
              {/* 2×2 정사각 매치는 온보딩 미안내 — 플레이 중 자연 발견(learn by doing)으로 남김 */}
              <InfoRow tile={miniTile(0, "lineH")} text={t("tut_sp_line")} />
              <InfoRow tile={miniTile(3, "color")} text={t("tut_sp_color")} />
              <InfoRow tile={miniTile(1, "area")} text={t("tut_sp_area")} />
              <InfoRow
                tile={
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/items/item-bomb.png" alt="" className="h-10 w-10 rounded-[10px] object-cover" />
                }
                text={t("tut_items")}
              />
            </div>
            <button
              onClick={onStart}
              className="mt-5 w-full rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]"
            >
              {t("tutorial_start")}
            </button>
          </>
        )}
        {/* 페이지 인디케이터 */}
        <div className="mt-4 flex justify-center gap-1.5">
          {[0, 1].map((p) => (
            <span key={p} className={`h-1.5 w-1.5 rounded-full ${page === p ? "bg-primary" : "bg-surface-3"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
