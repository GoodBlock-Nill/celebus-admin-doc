"use client";

// 온보딩(최초 1회) — 2페이지: ① 기본 매치 드래그 데모(실제 타일 아트) ② 스페셜·아이템 안내.
// 데모 애니메이션 keyframes는 globals.css(demo-*) 참조. 스페셜 미리보기는 인게임과 동일한 sp-* 오버레이 재사용.
import { useRef, useState } from "react";
import { GAME_CONFIG } from "@/lib/game-config";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLang } from "./LangProvider";

// 실제 게임과 동일한 렌더 규칙의 미니 타일 (배경 + 악기 아트 / cover 아트)
function DemoTile({ colorIdx, size = 44, anim, left, top, children }: {
  colorIdx: number;
  size?: number;
  anim?: string;
  left?: number;
  top?: number;
  children?: React.ReactNode;
}) {
  const skin = GAME_CONFIG.tiles[colorIdx];
  return (
    <div
      className="absolute flex items-center justify-center rounded-[12px]"
      style={{ left, top, width: size, height: size, background: skin.bg, animation: anim }}
    >
      {skin.img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={skin.img}
          alt=""
          draggable={false}
          className={`pointer-events-none h-full w-full rounded-[12px] ${skin.cover ? "object-cover" : "object-contain p-[13%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]"}`}
        />
      ) : (
        <span className="text-[22px]">{skin.glyph}</span>
      )}
      {children}
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
  useFocusTrap(ref, true);
  const skin = (i: number) => GAME_CONFIG.tiles[i];
  const miniTile = (colorIdx: number, kind?: "line" | "area" | "color") => {
    const spImg = kind ? GAME_CONFIG.specials[kind] : undefined;
    return (
      <div className="relative flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ background: skin(colorIdx).bg }}>
        {/* 스페셜 실아트가 있으면 완성형 블록 미리보기, 없으면 악기 타일 + CSS 오버레이 */}
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
            {/* 데모: 별 타일을 옆 칸으로 끌어와 같은 악기 3개를 맞춤 (실제 타일 아트) */}
            <div className="relative mx-auto my-6 h-12" style={{ width: 200 }}>
              {/* 3매치 하이라이트(스왑 완료 순간) */}
              <div
                className="absolute rounded-[14px] ring-[3px] ring-white/85"
                style={{ left: -2, top: -2, width: 152, height: 52, animation: "demo-glow 2.8s ease-in-out infinite" }}
              />
              {/* 고정 타일 (슬롯 0·1) — 기타 */}
              <DemoTile colorIdx={0} left={0} top={0} />
              <DemoTile colorIdx={0} left={52} top={0} />
              {/* 별 타일 — 오른쪽으로 이동 */}
              <DemoTile colorIdx={5} left={104} top={0} anim="demo-move-r 2.8s ease-in-out infinite" />
              {/* 옆 기타 타일 — 왼쪽으로 밀려나 자리 교환 */}
              <DemoTile colorIdx={0} left={156} top={0} anim="demo-move-l 2.8s ease-in-out infinite" />
              {/* 손가락 */}
              <span className="absolute text-[24px]" style={{ left: 112, top: 30, animation: "demo-finger 2.8s ease-in-out infinite" }}>
                👆
              </span>
            </div>
            <p className="mb-5 text-[13px] leading-relaxed text-muted break-keep">{t("tutorial_body")}</p>
            <button
              onClick={() => setPage(1)}
              className="w-full rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]"
            >
              {t("tutorial_next")}
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 text-[16px] font-black">{t("tutorial2_title")}</div>
            <div className="flex flex-col gap-2">
              {/* 2×2 정사각 매치는 온보딩 미안내 — 플레이 중 자연 발견(learn by doing)으로 남김 */}
              <InfoRow tile={miniTile(0, "line")} text={t("tut_sp_line")} />
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
