"use client";

// 가챠 화면 (Phase 3: 재화 확률형) — 대기(카드 부유) → 뽑기(셔플 긴장) → 공개(등급 글로우 + 플립).
// 유상 이용권은 이 재화 뽑기 전용(사행성 분리 — 실물 뽑기는 무상 전용, Phase 4).
import { useEffect, useRef, useState } from "react";
import { Sparkles, Ticket } from "lucide-react";
import { toast } from "sonner";
import { drawGacha, fetchGachaStatus, type GachaDrawCard, type GachaEvent, type GachaWallet } from "@/lib/game-api";
import { sfxCoin, sfxNewBest, sfxPower, sfxSpecial, unlockAudio } from "@/lib/sfx";
import GachaCard, { rewardLabel } from "./GachaCard";
import GachaOddsModal from "./GachaOddsModal";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

const GRADE_ORDER = { D: 0, C: 1, B: 2, A: 3, S: 4 } as const;
const FLIP_INTERVAL_MS = 300;
const SINGLE_AUTO_FLIP_MS = 2200;
const DRAW_SUSPENSE_MS = 1100;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Stage = "idle" | "drawing" | "reveal";

export default function GachaScreen({ onBack, onOpenShop }: { onBack: () => void; onOpenShop: () => void }) {
  const { t, lang } = useLang();
  const [wallet, setWallet] = useState<GachaWallet>({ free_tickets: 0, paid_tickets: 0 });
  const [event, setEvent] = useState<GachaEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("idle");
  const [cards, setCards] = useState<GachaDrawCard[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [bonus, setBonus] = useState(false);
  const [showOdds, setShowOdds] = useState(false);
  const busyRef = useRef(false);
  const sfxDone = useRef<Set<number>>(new Set());

  useEffect(() => {
    unlockAudio();
    fetchGachaStatus()
      .then((s) => {
        setWallet({ free_tickets: s.free_tickets, paid_tickets: s.paid_tickets });
        setEvent(s.events.find((e) => e.kind === "digital") ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const flipOne = (i: number, grade?: GachaDrawCard["grade"]) => {
    setFlipped((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
    if (!sfxDone.current.has(i)) {
      sfxDone.current.add(i);
      const g = grade ?? cards[i]?.grade;
      if (g === "S") sfxNewBest();
      else if (g === "A") sfxSpecial();
      else sfxCoin();
    }
  };

  // 10연 — 약한 등급부터 순차 자동 플립 (최고 카드는 마지막)
  useEffect(() => {
    if (stage !== "reveal" || cards.length <= 1 || reducedMotion()) return;
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= cards.length) return clearInterval(iv);
      flipOne(idx++);
    }, FLIP_INTERVAL_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, cards]);

  // 1회 — 탭 유도 + 자동 플립 폴백
  useEffect(() => {
    if (stage !== "reveal" || cards.length !== 1 || reducedMotion()) return;
    const tm = setTimeout(() => flipOne(0), SINGLE_AUTO_FLIP_MS);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, cards]);

  const doDraw = async (count: 1 | 10) => {
    if (busyRef.current || !event) return;
    if (wallet.free_tickets + wallet.paid_tickets < count) return toast.error(t("gacha_insufficient"));
    busyRef.current = true;
    sfxDone.current = new Set();
    setStage("drawing");
    sfxPower();
    const [res] = await Promise.all([drawGacha(event.id, count), delay(reducedMotion() ? 0 : DRAW_SUSPENSE_MS)]);
    busyRef.current = false;
    if (!res.ok) {
      setStage("idle");
      return toast.error(res.reason === "insufficient_tickets" ? t("gacha_insufficient") : t("load_failed"));
    }
    const sorted = [...res.results].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]);
    setCards(sorted);
    setBonus(res.bonus_ticket);
    setWallet(res.wallet);
    setFlipped(new Set(reducedMotion() ? sorted.map((_, i) => i) : []));
    setStage("reveal");
  };

  const allFlipped = stage === "reveal" && flipped.size >= cards.length;
  const cpSum = cards.reduce((s, c) => s + (c.reward?.cp ?? 0), 0);
  const itemCards = cards.filter((c) => c.reward?.item);
  const ticketChip = (
    <span className="flex items-center gap-1 rounded-full bg-surface-1 px-3 py-1.5 text-[12px] font-black text-fg ring-1 ring-hairline">
      <Ticket className="h-4 w-4 text-primary-400" />
      <span className="tabular-nums">{wallet.free_tickets}</span>
      <span className="text-subtle">·</span>
      <span className="tabular-nums text-muted">{wallet.paid_tickets}</span>
    </span>
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      <ScreenHeader title={t("gacha_title")} onBack={stage === "idle" ? onBack : () => {}} right={ticketChip} />

      {loading ? (
        <div className="mt-6 h-[320px] animate-pulse rounded-[16px] bg-surface-1" />
      ) : !event ? (
        <p className="mt-20 text-center text-[13px] text-muted break-keep">{t("gacha_no_event")}</p>
      ) : (
        <>
          {/* 이벤트 안내 */}
          <div className="mt-4 text-center">
            <div className="text-[17px] font-black text-fg">{event.title[lang] || event.title.ko}</div>
            {(event.description[lang] || event.description.ko) && (
              <p className="mt-1 text-[12px] text-muted break-keep">{event.description[lang] || event.description.ko}</p>
            )}
          </div>

          {/* 카드 스테이지 */}
          <div className="mt-5 flex min-h-[300px] flex-1 flex-col items-center justify-center">
            {stage !== "reveal" ? (
              <div className={`flex items-center justify-center ${stage === "drawing" ? "gacha-shake" : ""}`}>
                {[-10, 0, 10].map((tilt, i) => (
                  <div
                    key={i}
                    className={`gacha-float ${i === 1 ? "z-10 -mx-8" : "scale-90 opacity-80"}`}
                    style={{ "--tilt": `${stage === "drawing" ? 0 : tilt}deg`, animationDelay: `${i * 0.4}s` } as React.CSSProperties}
                  >
                    <GachaCard card={null} flipped={false} glowing={stage === "drawing"} size="lg" lang={lang} />
                  </div>
                ))}
              </div>
            ) : cards.length === 1 ? (
              <div className="gacha-reveal-pop flex flex-col items-center gap-3">
                <GachaCard card={cards[0]} flipped={flipped.has(0)} glowing={!flipped.has(0)} size="lg" lang={lang} onTap={() => flipOne(0)} />
                {!allFlipped && <p className="text-[12px] font-bold text-muted">{t("gacha_tap_flip")}</p>}
                {allFlipped && <p className="text-[15px] font-black text-gold">{rewardLabel(cards[0], t)}</p>}
              </div>
            ) : (
              <div className="gacha-reveal-pop flex flex-col items-center gap-3">
                <div className="grid grid-cols-5 gap-1.5">
                  {cards.map((c, i) => (
                    <GachaCard key={c.draw_id} card={c} flipped={flipped.has(i)} glowing={!flipped.has(i)} size="sm" lang={lang} onTap={() => flipOne(i)} />
                  ))}
                </div>
                {!allFlipped ? (
                  <button onClick={() => cards.forEach((_, i) => flipOne(i))} className="rounded-full bg-surface-1 px-4 py-2 text-[12.5px] font-bold text-fg ring-1 ring-hairline active:scale-95">
                    {t("gacha_skip")}
                  </button>
                ) : (
                  <div className="text-center">
                    {cpSum > 0 && <div className="text-[16px] font-black text-gold">+{cpSum.toLocaleString()} CP</div>}
                    {itemCards.length > 0 && (
                      <div className="text-[12.5px] font-bold text-muted">{itemCards.map((c) => rewardLabel(c, t)).join(" · ")}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 하단 CTA */}
          {stage === "reveal" && allFlipped ? (
            <div className="mb-4 flex flex-col gap-2">
              {bonus && (
                <p className="flex items-center justify-center gap-1 text-[12.5px] font-black text-primary-400">
                  <Sparkles className="h-4 w-4" /> {t("gacha_bonus_ticket")}
                </p>
              )}
              <button onClick={() => setStage("idle")} className="w-full rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99]">
                {t("gacha_result_done")}
              </button>
            </div>
          ) : stage === "idle" ? (
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={() => void doDraw(1)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99]">
                  {t("gacha_draw1")} <span className="flex items-center text-[12px] font-bold opacity-80"><Ticket className="mr-0.5 h-3.5 w-3.5" />1</span>
                </button>
                <button
                  onClick={() => void doDraw(10)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3.5 text-[15px] font-black text-white ring-1 ring-white/15 active:scale-[0.99]"
                  style={{ background: "linear-gradient(180deg, #f0a53c 0%, #c07d1c 100%)" }}
                >
                  {t("gacha_draw10")} <span className="flex items-center text-[12px] font-bold opacity-80"><Ticket className="mr-0.5 h-3.5 w-3.5" />10</span>
                </button>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setShowOdds(true)} className="text-[12px] font-bold text-muted underline underline-offset-2">
                  {t("gacha_odds")}
                </button>
                <button onClick={onOpenShop} className="text-[12px] font-bold text-muted underline underline-offset-2">
                  {t("gacha_go_shop")}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {showOdds && event && <GachaOddsModal event={event} onClose={() => setShowOdds(false)} />}
    </div>
  );
}
