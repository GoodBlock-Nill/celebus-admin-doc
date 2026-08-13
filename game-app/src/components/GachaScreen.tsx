"use client";

// 가챠 화면 (Phase 3: 재화 확률형) — 대기(카드 부유) → 뽑기(셔플 긴장) → 공개(등급 글로우 + 플립).
// 유상 이용권은 이 재화 뽑기 전용(사행성 분리 — 실물 뽑기는 무상 전용, Phase 4).
import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { drawGacha, fetchGachaStatus, fetchMyPrizes, type GachaDrawCard, type GachaEvent, type GachaWallet, type PrizeWinner } from "@/lib/game-api";
import { sfxCoin, sfxNewBest, sfxPower, sfxSpecial, unlockAudio } from "@/lib/sfx";
import DrawTicketIcon from "./DrawTicketIcon";
import GachaCard, { rewardLabel } from "./GachaCard";
import GachaOddsModal from "./GachaOddsModal";
import PrizeClaimModal from "./PrizeClaimModal";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

const GRADE_ORDER = { D: 0, C: 1, B: 2, A: 3, S: 4 } as const;
// 상위 등급 당첨 컨페티 — 결정적 배치 (랜덤 미사용, WeeklyResultModal 패턴)
const CONFETTI_COLORS: Record<"S" | "A", string[]> = {
  S: ["#f5c451", "#ffd97a", "#f0a53c", "#fff0c0", "#e8b64a"],
  A: ["#a78bfa", "#c4b5fd", "#8b5cf6", "#ede9fe", "#7c4ddb"],
};
const confettiPieces = (grade: "S" | "A") =>
  Array.from({ length: grade === "S" ? 24 : 16 }, (_, i) => ({
    left: (i * 61) % 100,
    color: CONFETTI_COLORS[grade][i % CONFETTI_COLORS[grade].length],
    delay: (i % 6) * 0.12,
  }));
const FLIP_INTERVAL_MS = 300;
const SINGLE_AUTO_FLIP_MS = 2200;
const DRAW_SUSPENSE_MS = 1100;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Stage = "idle" | "drawing" | "reveal";

export default function GachaScreen({ onBack, onOpenShop }: { onBack: () => void; onOpenShop: () => void }) {
  const { t, lang } = useLang();
  const [wallet, setWallet] = useState<GachaWallet>({ free_tickets: 0, paid_tickets: 0 });
  const [events, setEvents] = useState<GachaEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("idle");
  const [cards, setCards] = useState<GachaDrawCard[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [bonus, setBonus] = useState(false);
  const [partial, setPartial] = useState<number | null>(null); // 재고 소진으로 요청보다 적게 뽑힌 경우 (뽑은 횟수)
  const [showOdds, setShowOdds] = useState(false);
  const [prizeList, setPrizeList] = useState<PrizeWinner[] | null>(null); // 실물 당첨 수령 모달
  const [showIntro, setShowIntro] = useState(false); // 첫 진입 안내 (닫으면 다시 안 뜸)
  const busyRef = useRef(false);
  const sfxDone = useRef<Set<number>>(new Set());
  const tabsRef = useRef<HTMLDivElement>(null);

  // 선택한 이벤트 칩을 가로 스크롤 중앙으로 — 이벤트가 많아 칩이 화면 밖에 있어도 현재 위치가 보이도록
  useEffect(() => {
    if (stage !== "idle") return;
    const chip = tabsRef.current?.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(selectedId ?? "")}"]`);
    chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
  }, [selectedId, stage]);

  const refresh = (keepSelection = true) =>
    fetchGachaStatus().then((s) => {
      setWallet({ free_tickets: s.free_tickets, paid_tickets: s.paid_tickets });
      setEvents(s.events);
      setSelectedId((prev) => {
        if (keepSelection && prev && s.events.some((e) => e.id === prev)) return prev;
        // 실물 이벤트 우선 노출 (이벤트성 — 참여 동기), 없으면 상시 재화 가챠
        return (s.events.find((e) => e.kind === "physical_box") ?? s.events[0])?.id ?? null;
      });
    });

  useEffect(() => {
    unlockAudio();
    try {
      if (!localStorage.getItem("gacha_intro_seen")) setShowIntro(true);
    } catch {
      /* ignore */
    }
    void refresh(false).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissIntro = () => {
    setShowIntro(false);
    try {
      localStorage.setItem("gacha_intro_seen", "1");
    } catch {
      /* ignore */
    }
  };

  const event = events.find((e) => e.id === selectedId) ?? null;
  const isBox = event?.kind === "physical_box";

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
    if (!canDraw(count)) return toast.error(t("gacha_insufficient"));
    busyRef.current = true;
    sfxDone.current = new Set();
    setStage("drawing");
    sfxPower();
    const [res] = await Promise.all([drawGacha(event.id, count), delay(reducedMotion() ? 0 : DRAW_SUSPENSE_MS)]);
    busyRef.current = false;
    if (!res.ok) {
      setStage("idle");
      if (res.reason === "no_stock" || res.reason === "bad_event") {
        void refresh(); // 소진·종료 반영
        return toast.error(t("gacha_sold_out"));
      }
      return toast.error(res.reason === "insufficient_tickets" ? t("gacha_insufficient") : t("load_failed"));
    }
    const sorted = [...res.results].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]);
    setCards(sorted);
    setBonus(res.bonus_ticket);
    setPartial(res.count < count ? res.count : null); // 재고 소진 부분 뽑기 — 차감도 뽑은 만큼만
    setWallet(res.wallet);
    setFlipped(new Set(reducedMotion() ? sorted.map((_, i) => i) : []));
    setStage("reveal");
    if (isBox) void refresh(); // 재고·이벤트 상태 최신화 (소진 시 목록에서 제거)
  };

  const openPrizeClaim = async () => {
    const winners = await fetchMyPrizes();
    setPrizeList(winners.filter((w) => w.status === "pending" || w.status === "submitted"));
  };

  const allFlipped = stage === "reveal" && flipped.size >= cards.length;
  // 최고 등급 카드(정렬상 마지막)가 공개되면 S/A 컨페티 (등급색 팔레트)
  const bestGrade = cards[cards.length - 1]?.grade;
  const celebrate = stage === "reveal" && (bestGrade === "S" || bestGrade === "A") && flipped.has(cards.length - 1) ? bestGrade : null;
  const cpSum = cards.reduce((s, c) => s + (c.reward?.cp ?? 0), 0);
  const itemCards = cards.filter((c) => c.reward?.item);
  // 드로우 티켓 단일 표시 (v2.3 통합 — 무상/유상 구분 폐지, 내부 원장만 출처 유지)
  const totalTickets = wallet.free_tickets + wallet.paid_tickets;
  const ticketChip = (
    <span className="flex items-center gap-1 rounded-full bg-surface-1 px-3 py-1.5 text-[12px] font-black text-fg ring-1 ring-hairline">
      <DrawTicketIcon className="h-5 w-5" />
      <span className="tabular-nums">{totalTickets}</span>
    </span>
  );
  const canDraw = (count: number) => totalTickets >= count;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      {celebrate &&
        confettiPieces(celebrate).map((p, i) => (
          <span key={i} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }} />
        ))}
      <ScreenHeader title={t("gacha_title")} onBack={stage === "idle" ? onBack : () => {}} right={ticketChip} />

      {loading ? (
        <div className="mt-6 h-[320px] animate-pulse rounded-[16px] bg-surface-1" />
      ) : !event ? (
        <p className="mt-20 text-center text-[13px] text-muted break-keep">{t("gacha_no_event")}</p>
      ) : (
        <>
          {/* 첫 진입 안내 — 이용권 획득 경로·유상 규칙 (닫으면 다시 안 뜸) */}
          {showIntro && stage === "idle" && (
            <div className="mt-3 flex items-start gap-2 rounded-[14px] bg-primary/10 px-3.5 py-3 ring-1 ring-primary/30">
              <DrawTicketIcon className="h-5 w-5" />
              <p className="min-w-0 flex-1 text-[12px] leading-snug text-fg break-keep">{t("gacha_ticket_desc")}</p>
              <button onClick={dismissIntro} aria-label={t("notice_close")} className="shrink-0 text-subtle hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 이벤트 전환 (실물 이벤트 진행 중일 때 재화 가챠와 병행 노출)
              — 다수 이벤트 시 줄바꿈 대신 가로 스크롤 단일 라인 (칩 내 제목 개행 금지, 선택 칩 자동 센터링) */}
          {events.length > 1 && stage === "idle" && (
            <div ref={tabsRef} className="gacha-event-tabs mt-3 overflow-x-auto scrollbar-none">
              <div className="mx-auto flex w-max gap-1.5 px-1 py-0.5">
                {events.map((e) => (
                  <button
                    key={e.id}
                    data-event-id={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={`max-w-[160px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-bold ring-1 transition-colors ${
                      e.id === selectedId ? "bg-primary text-white ring-primary" : "bg-surface-1 text-muted ring-hairline"
                    }`}
                  >
                    {e.title[lang] || e.title.ko}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 이벤트 안내 — 설명은 본문 크기·행간·읽기 폭을 확보해 제목과 분리 (가독성) */}
          <div className="mt-3 text-center">
            <div className="text-[17px] font-black text-fg">{event.title[lang] || event.title.ko}</div>
            {(event.description[lang] || event.description.ko) && (
              <p className="mx-auto mt-1.5 max-w-[300px] text-[13px] font-medium leading-relaxed text-muted break-keep">
                {event.description[lang] || event.description.ko}
              </p>
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
                    <GachaCard card={null} flipped={false} glowing={stage === "drawing"} size="lg" />
                  </div>
                ))}
              </div>
            ) : cards.length === 1 ? (
              <div className="gacha-reveal-pop flex flex-col items-center gap-3">
                <GachaCard card={cards[0]} flipped={flipped.has(0)} glowing={!flipped.has(0)} size="lg" onTap={() => flipOne(0)} />
                {!allFlipped && <p className="text-[12px] font-bold text-muted">{t("gacha_tap_flip")}</p>}
              </div>
            ) : (
              <div className="gacha-reveal-pop flex flex-col items-center gap-3">
                <div className="grid grid-cols-5 gap-x-1.5 gap-y-1">
                  {cards.map((c, i) => (
                    <GachaCard key={c.draw_id} card={c} flipped={flipped.has(i)} glowing={!flipped.has(i)} size="sm" onTap={() => flipOne(i)} />
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
              {partial != null && (
                <p className="text-center text-[12px] font-bold leading-snug text-muted break-keep">
                  {t("gacha_partial_note").replace(/\{n\}/g, String(partial))}
                </p>
              )}
              {bonus && (
                <p className="flex items-center justify-center gap-1 text-[12.5px] font-black text-primary-400">
                  <Sparkles className="h-4 w-4" /> {t("gacha_bonus_ticket")}
                </p>
              )}
              {cards.some((c) => c.physical) &&
                (cards.some((c) => c.physical && c.fulfillment !== "mobile_ticket") ? (
                  <>
                    <p className="text-center text-[12.5px] font-black text-gold break-keep">{t("gacha_physical_win")}</p>
                    <button
                      onClick={() => void openPrizeClaim()}
                      className="w-full rounded-full py-3.5 text-[15px] font-black text-white ring-1 ring-white/15 active:scale-[0.99]"
                      style={{ background: "linear-gradient(180deg, #f0a53c 0%, #c07d1c 100%)" }}
                    >
                      {t("prize_input_cta")}
                    </button>
                  </>
                ) : (
                  // 모바일 티켓만 당첨 — 입력 불필요, CELEBUS 앱 지급 안내만
                  <>
                    <p className="text-center text-[12.5px] font-black leading-snug text-gold break-keep">{t("prize_mobile_note")}</p>
                    <button
                      onClick={() => void openPrizeClaim()}
                      className="w-full rounded-full bg-surface-1 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]"
                    >
                      {t("prize_check_cta")}
                    </button>
                  </>
                ))}
              <button onClick={() => setStage("idle")} className="w-full rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99]">
                {t("gacha_result_done")}
              </button>
            </div>
          ) : stage === "idle" ? (
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => void doDraw(1)}
                  disabled={!canDraw(1)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99] disabled:opacity-40"
                >
                  {t("gacha_draw1")} <span className="flex items-center text-[12px] font-bold"><DrawTicketIcon className="mr-0.5 h-[18px] w-[18px]" />1</span>
                </button>
                <button
                  onClick={() => void doDraw(10)}
                  disabled={!canDraw(10)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3.5 text-[15px] font-black text-white ring-1 ring-white/15 active:scale-[0.99] disabled:opacity-40"
                  style={{ background: "linear-gradient(180deg, #f0a53c 0%, #c07d1c 100%)" }}
                >
                  {t("gacha_draw10")} <span className="flex items-center text-[12px] font-bold"><DrawTicketIcon className="mr-0.5 h-[18px] w-[18px]" />10</span>
                </button>
              </div>
              {!canDraw(1) && (
                // 뽑을 수 없는 상태 — 획득 경로 안내
                <p className="text-center text-[12px] font-bold leading-snug text-gold break-keep">{t("gacha_earn_hint")}</p>
              )}
              {/* 확률 공시 접근성 — 링크가 아닌 버튼으로 노출 (공시 의무 대응) */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowOdds(true)}
                  className="rounded-full bg-surface-1 px-4 py-2 text-[12.5px] font-bold text-fg ring-1 ring-hairline active:scale-95"
                >
                  {t("gacha_odds")}
                </button>
                <button
                  onClick={onOpenShop}
                  className="rounded-full bg-surface-1 px-4 py-2 text-[12.5px] font-bold text-muted ring-1 ring-hairline active:scale-95"
                >
                  {t("gacha_go_shop")}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {showOdds && event && <GachaOddsModal event={event} onClose={() => setShowOdds(false)} />}
      {prizeList && prizeList.length > 0 && (
        <PrizeClaimModal winners={prizeList} onClose={() => setPrizeList(null)} onChanged={() => void openPrizeClaim()} />
      )}
    </div>
  );
}
