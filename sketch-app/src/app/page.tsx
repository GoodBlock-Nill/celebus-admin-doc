"use client";

// CELEB 스케치 — W1 수직 슬라이스 하네스 (비공개 라우트, 내비 미연결).
// 그리기(서버 제시어 3택 1 → 제출)와 맞히기(배정 → 리플레이 → 글자 타일 → 서버 판정) 두 루프의 E2E.
// 게이트: 그리기·맞히기 상호 보상 루프 체감 (기획 §11 W1). CP 보상·검수 큐·신고는 W2.
import { useEffect, useState } from "react";
import { CalendarCheck, ChevronLeft, Crown, Palette, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { partyApi } from "@/lib/sketch-party";
import { toast } from "sonner";
import LangSwitcher from "@/components/LangSwitcher";
import SketchCanvas from "@/components/sketch/SketchCanvas";
import SketchGuess from "@/components/sketch/SketchGuess";
import SketchReplay from "@/components/sketch/SketchReplay";
import { loadDrawings, saveDrawing, sketchToPngBlob, type SketchStroke } from "@/lib/sketch";
import { fetchSketchBest, fetchSketchWords, submitSketch, type SketchBest, type SketchWordChoice } from "@/lib/sketch-api";
import { GAME_CONFIG } from "@/lib/game-config";
import { useLang } from "@/components/LangProvider";

type Phase =
  | { name: "home" }
  | { name: "pick"; words: SketchWordChoice[] }
  | { name: "draw"; word: SketchWordChoice }
  | { name: "submitted"; word: SketchWordChoice; strokes: SketchStroke[] }
  | { name: "guess"; mode: "pool" | "daily" };

export default function SketchPage() {
  const { t } = useLang();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ name: "home" });
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [best, setBest] = useState<SketchBest | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [showBestReplay, setShowBestReplay] = useState(false);
  useEffect(() => setSavedCount(loadDrawings().length), [phase.name]);
  useEffect(() => {
    if (phase.name === "home") void fetchSketchBest().then(setBest);
  }, [phase.name]);
  useEffect(() => {
    try {
      if (!localStorage.getItem("sketch_intro_seen")) setShowIntro(true);
    } catch { /* ignore */ }
  }, []);

  const startDraw = async () => {
    const words = await fetchSketchWords();
    if (words.length === 0) return toast.error(t("sk_words_fail"));
    setPhase({ name: "pick", words });
  };

  const submit = (word: SketchWordChoice) => async (strokes: SketchStroke[], durationMs: number) => {
    saveDrawing({ word: word.text, strokes, durationMs, createdAt: new Date().toISOString() });
    const moderation = await submitSketch(word.id, strokes, durationMs);
    if (!moderation) toast.error(t("sk_submit_fail"));
    else if (moderation === "approve") toast.success(t("sk_submit_ok"));
    else if (moderation === "hold") toast.success(t("sk_submit_hold"));
    else if (moderation === "processing") toast.success(t("sk_submit_processing"));
    else toast.error(t("sk_submit_reject"));
    setPhase({ name: "submitted", word, strokes });
  };

  const back = () => setPhase({ name: "home" });

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-5 pb-8 pt-6 px-safe pb-safe pt-safe">
      {/* 상단 슬림 바 — 상위 앱 복귀 + 언어 (match 홈과 동일 패턴, 종이 톤) */}
      {phase.name === "home" && (
        <div className="-mb-2 flex items-center justify-between">
          {GAME_CONFIG.home.parentAppUrl ? (
            <button
              onClick={() => {
                window.location.href = GAME_CONFIG.home.parentAppUrl!;
              }}
              aria-label={t("home_back_celebus_aria")}
              className="flex items-center gap-0.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11.5px] font-bold tracking-wide text-muted transition-colors active:scale-95 hover:text-fg"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("home_back_celebus")}
            </button>
          ) : (
            <span />
          )}
          <LangSwitcher variant="ghost" />
        </div>
      )}
      <div className="flex items-center gap-1">
        {phase.name !== "home" && (
          <button onClick={back} aria-label={t("back")} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="sk-wordmark text-[24px]">CELEB SKETCH</h1>
        <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-black text-gold">BETA</span>
      </div>

      {phase.name === "home" && (
        <div className="flex flex-col gap-3">
          {showIntro && (
            <div className="flex items-start gap-2 rounded-[14px] bg-primary/10 px-3.5 py-3 ring-1 ring-primary/30">
              <p className="min-w-0 flex-1 text-[12px] leading-snug text-fg break-keep">{t("sk_intro")}</p>
              <button
                onClick={() => {
                  setShowIntro(false);
                  try { localStorage.setItem("sketch_intro_seen", "1"); } catch { /* ignore */ }
                }}
                aria-label={t("sk_fold")}
                className="shrink-0 text-subtle"
              >
                ✕
              </button>
            </div>
          )}
          {/* 메뉴 2열 그리드 — 카드마다 포인트 컬러 1개 (Sunshine·Violet·Sky·Mint) */}
          <div className="grid grid-cols-2 gap-3">
            {/* 데일리 그림 퀴즈 — 전원 동일 5문제, 완주 보너스 */}
            <button
              onClick={() => setPhase({ name: "guess", mode: "daily" })}
              className="sk-card flex min-h-[132px] flex-col justify-between gap-2.5 p-4 text-left"
            >
              <span className="sk-bubble" style={{ background: "#ffedc2" }}>📅</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-black leading-tight text-fg break-keep">{t("sk_daily_card")}</span>
                <span className="mt-1 block text-[11.5px] leading-snug text-muted break-keep">{t("sk_daily_desc")}</span>
              </span>
            </button>
            <button
              onClick={() => void startDraw()}
              className="sk-card flex min-h-[132px] flex-col justify-between gap-2.5 p-4 text-left"
            >
              <span className="sk-bubble" style={{ background: "#e8defc" }}>🎨</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-black leading-tight text-fg break-keep">{t("sk_draw_card")}</span>
                <span className="mt-1 block text-[11.5px] leading-snug text-muted break-keep">{t("sk_draw_desc")}</span>
              </span>
            </button>
            <button
              onClick={() => setPhase({ name: "guess", mode: "pool" })}
              className="sk-card flex min-h-[132px] flex-col justify-between gap-2.5 p-4 text-left"
            >
              <span className="sk-bubble" style={{ background: "#dcedfd" }}>🔍</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-black leading-tight text-fg break-keep">{t("sk_guess_card")}</span>
                <span className="mt-1 block text-[11.5px] leading-snug text-muted break-keep">{t("sk_guess_desc")}</span>
              </span>
            </button>

            {/* 파티룸 — 초대 링크 실시간 (W3) */}
            <button
              onClick={async () => {
                if (creatingRoom) return;
                setCreatingRoom(true);
                const { getNick } = await import("@/lib/game-api");
                const r = await partyApi({ action: "create", nick: getNick() });
                setCreatingRoom(false);
                if (r?.code) router.push(`/room/${r.code}`);
                else toast.error(t("sk_room_create_fail"));
              }}
              disabled={creatingRoom}
              className="sk-card flex min-h-[132px] flex-col justify-between gap-2.5 p-4 text-left disabled:opacity-60"
            >
              <span className="sk-bubble" style={{ background: "#d4f4ec" }}>🎉</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-black leading-tight text-fg break-keep">{t("sk_party_card")}</span>
                <span className="mt-1 block text-[11.5px] leading-snug text-muted break-keep">{t("sk_party_desc")}</span>
              </span>
            </button>
          </div>

          {/* 명예의 전당 — 지난주 베스트 스케치 (작가 보상 = 드로우 티켓) */}
          {best && (
            <div className="sk-card p-4">
              <button onClick={() => setShowBestReplay((v) => !v)} className="flex w-full items-center gap-3.5 active:scale-[0.99]">
                {best.thumb_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={best.thumb_url} alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-cover ring-1 ring-gold/50" />
                ) : (
                  <Crown className="h-8 w-8 shrink-0 text-gold" />
                )}
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-1.5 text-[14px] font-black text-fg">
                    <Crown className="h-4 w-4 text-gold" /> {t("sk_best_title")}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted break-keep">
                    {t("sk_best_sub").replace("{w}", best.word).replace("{n}", best.correct_count.toLocaleString())}
                  </span>
                </span>
                <span className="shrink-0 text-[11.5px] font-bold text-subtle">{showBestReplay ? t("sk_fold") : t("sk_replay")}</span>
              </button>
              {showBestReplay && (
                <div className="mt-3">
                  <SketchReplay strokes={best.strokes} />
                </div>
              )}
            </div>
          )}
          {savedCount > 0 && <p className="text-center text-[11.5px] text-subtle">{t("sk_my_drawings").replace("{n}", String(savedCount))}</p>}
        </div>
      )}

      {phase.name === "pick" && (
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] leading-relaxed text-muted break-keep">{t("sk_pick_hint")}</p>
          {phase.words.map((w) => (
            <button
              key={w.id}
              onClick={() => setPhase({ name: "draw", word: w })}
              className="sk-card flex items-center justify-between px-5 py-4"
            >
              <span className="text-[16px] font-black text-fg">{w.text}</span>
              <span className="text-[12px] font-bold text-gold">{"★".repeat(w.difficulty)}</span>
            </button>
          ))}
          <button onClick={() => void startDraw()} className="text-[12.5px] font-bold text-subtle">
            {t("sk_other_words")}
          </button>
        </div>
      )}

      {phase.name === "draw" && <SketchCanvas word={phase.word.text} onSubmit={submit(phase.word)} />}

      {phase.name === "submitted" && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-[14px] font-black text-fg break-keep">
            {t("sk_submitted_replay").replace("{w}", phase.word.text)}
          </p>
          <SketchReplay strokes={phase.strokes} />
          {/* 공유 카드 — 제시어를 가린 "이거 뭐게?" 이미지 (기획 §5 바이럴 루프) */}
          <button
            onClick={async () => {
              const blob = await sketchToPngBlob(phase.strokes);
              if (!blob) return;
              const file = new File([blob], "celeb-sketch.png", { type: "image/png" });
              const text = `${t("sk_share_text")} ${window.location.origin}`;
              try {
                if (navigator.canShare?.({ files: [file] })) {
                  await navigator.share({ files: [file], text });
                  return;
                }
              } catch { /* 공유 취소 — 무시 */ }
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "celeb-sketch.png";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="sk-btn-ghost w-full py-3 text-[13.5px] !text-gold"
          >
            {t("sk_share")} 🎨
          </button>
          <div className="flex gap-2">
            <button onClick={() => void startDraw()} className="sk-btn-ghost flex-1 py-3.5 text-[14px]">
              {t("sk_one_more")}
            </button>
            <button onClick={() => setPhase({ name: "guess", mode: "pool" })} className="sk-btn flex-1 py-3.5 text-[14px]">
              {t("sk_go_guess")}
            </button>
          </div>
        </div>
      )}

      {phase.name === "guess" && <SketchGuess mode={phase.mode} onDrawInstead={() => void startDraw()} />}
    </div>
  );
}
