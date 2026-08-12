"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, ChevronLeft } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { getNick, getAvatar, fetchAccount, getDailyStatus, claimWeeklyReward, fetchMyPrizes, type WeeklyReward, type PrizeWinner } from "@/lib/game-api";
import PrizeClaimModal from "./PrizeClaimModal";
import { kstWeekStart } from "@/lib/week";
import { unlockAudio } from "@/lib/sfx";
import { unlockBgm } from "@/lib/bgm";
import Avatar from "./Avatar";
import BetaBadge from "./BetaBadge";
import DailyReward from "./DailyReward";
import WeeklyResultModal from "./WeeklyResultModal";
import DailyMissions from "./DailyMissions";
import ProfileSetup from "./ProfileSetup";
import LangSwitcher from "./LangSwitcher";
import { useLang } from "./LangProvider";

export default function Home({
  onPlay,
  onOpenLeaderboard,
  onOpenShop,
  onOpenGacha,
  onOpenMore,
}: {
  onPlay: (mode: "free" | "daily") => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenGacha: () => void;
  onOpenMore: () => void;
}) {
  const { t } = useLang();
  const [nick, setNickState] = useState("");
  const [avatar, setAvatarState] = useState<string>(GAME_CONFIG.avatars[0].id);
  const [point, setPoint] = useState<number | null>(null);
  const [dailyClaimable, setDailyClaimable] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [weekly, setWeekly] = useState<WeeklyReward | null>(null);
  const [pendingPrizes, setPendingPrizes] = useState<PrizeWinner[]>([]); // 실물 당첨 미제출 — 매 접속 리마인드 (푸시 없음)
  const [showPrizes, setShowPrizes] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const n = getNick();
    setNickState(n);
    setAvatarState(getAvatar());
    if (!n) setShowProfile(true); // 최초 진입(닉네임 미설정) 시 프로필 설정 모달 자동 노출
    fetchAccount().then((a) => setPoint(a.celeb_point));
    getDailyStatus().then((s) => setDailyClaimable(s.claimable));
    // 실물 당첨 미제출 리마인드 — 수령 기한 유실 방지 (localStorage 1회성 아님, 제출 전까지 반복)
    fetchMyPrizes().then((ws) => {
      const pending = ws.filter((w) => w.status === "pending");
      setPendingPrizes(pending);
      if (pending.length > 0) setShowPrizes(true);
    });
    // 지난주 랭킹 결과 — 새 주(KST 월요일) 첫 진입 시 1회: 순위 표시 + 보상 자동 지급
    const wk = kstWeekStart();
    let seen = false;
    try {
      seen = !!localStorage.getItem(`wk_seen_${wk}`);
    } catch {
      /* ignore */
    }
    if (!seen) {
      claimWeeklyReward().then((r) => {
        if (!r) return; // 네트워크/서버 실패 — 기록하지 않고 다음 진입에 재시도
        try {
          localStorage.setItem(`wk_seen_${wk}`, "1");
        } catch {
          /* ignore */
        }
        if (r.has_result) {
          setWeekly(r);
          if ((r.total_cp ?? 0) > 0 && r.celeb_point != null) setPoint(r.celeb_point);
        }
      });
    }
  }, []);

  const home = GAME_CONFIG.home;

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden">
      {/* 배경 (실이미지 슬롯 or 스테이지 그라데이션 폴백) + 스크림 */}
      <div className="stage-bg pointer-events-none absolute inset-0 -z-10">
        {home.background && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={home.background} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/75" />
      </div>

      {/* 상단 바 */}
      <header className="flex flex-col gap-2 px-4 pt-safe">
        {/* 상단 슬림 바 — 상위 앱 복귀 + 언어 (내비 크롬, 가벼운 톤) */}
        <div className="flex items-center justify-between">
          {home.parentAppUrl ? (
            <button
              onClick={() => {
                window.location.href = home.parentAppUrl!;
              }}
              aria-label={t("home_back_celebus_aria")}
              className="group flex items-center gap-0.5 rounded-full py-1 pl-1.5 pr-2.5 text-white/80 transition-colors active:scale-95 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-[11.5px] font-bold tracking-wide">{t("home_back_celebus")}</span>
            </button>
          ) : (
            <span />
          )}
          <LangSwitcher />
        </div>

        {/* 프로필 + 포인트 (여유 있게) */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowProfile(true)}
            aria-label={t("profile_edit")}
            className="flex items-center gap-1.5 rounded-full bg-black/45 py-1 pl-1 pr-3.5 ring-1 ring-white/15 backdrop-blur active:scale-95"
          >
            <Avatar value={avatar} size="sm" />
            <span className="max-w-[140px] truncate text-[12.5px] font-black text-white">{nick || t("nickname_ph")}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 py-1 pl-1 pr-3 ring-1 ring-white/15 backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/currency.png" alt="CELEB Point" className="h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" />
            <span className="text-[13px] font-black tabular-nums text-white">{(point ?? 0).toLocaleString()}</span>
          </span>
        </div>
      </header>

      {/* 로고 + 서브카피 */}
      <div className="mt-6 flex flex-col items-center px-5 text-center">
        {home.logo ? (
          // 로고 이미지에 서브타이틀이 포함된 경우가 있어 별도 리본은 폴백(텍스트) 모드에서만 노출
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={home.logo} alt="CELEB MATCH" className="anim-logo-float max-h-[150px] w-auto drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]" />
            <BetaBadge className="absolute -right-3 top-2" />
          </div>
        ) : (
          <>
            <div className="font-display font-black leading-[0.9]">
              <div className="logo-puffy text-[56px]" style={{ color: "#f26a56" }}>
                CELEB
              </div>
              <div className="logo-puffy -mt-1 text-[56px]" style={{ color: "#3ac9bf" }}>
                MATCH
              </div>
            </div>
            <span className="mt-2 rounded-full bg-black/35 px-3 py-1 text-[12px] font-black text-white/90 ring-1 ring-white/15">
              {t("game_subcopy")}
            </span>
          </>
        )}
      </div>

      {/* 히어로 아트 슬롯 — hero URL 있으면 이미지, 없고 배경도 없으면 마스코트 플레이스홀더,
          배경 이미지가 히어로 아트를 겸하면 빈 스페이서(배경이 그대로 비치도록) */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-3">
        {home.hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={home.hero} alt="" className="max-h-full w-auto object-contain" />
        ) : home.background ? null : (
          <div className="flex h-full max-h-[240px] w-full items-center justify-center rounded-[28px] bg-white/5 ring-1 ring-white/10">
            <span className="text-[96px] drop-shadow-lg">{GAME_CONFIG.mascot}</span>
          </div>
        )}
      </div>

      {/* 오늘의 미션 (달성 → 받기, KST 일 리셋) + 데일리 체크인 스티커(카드 우상단 밖) */}
      <div className="relative mb-3">
        <button
          onClick={() => setShowDaily(true)}
          aria-label={t("daily_checkin")}
          className="absolute -top-[86px] right-5 z-30 w-[82px] active:scale-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/daily-checkin.png"
            alt=""
            className={`w-full drop-shadow-[0_5px_12px_rgba(0,0,0,0.45)] ${dailyClaimable ? "anim-gift-bob" : ""}`}
          />
        </button>
        <DailyMissions onReward={(cp) => setPoint(cp)} />
      </div>

      {/* 대형 CTA 2개 */}
      <div className="grid grid-cols-2 gap-3 px-5">
        <button
          onClick={() => {
            unlockAudio();
            unlockBgm(); // iOS: 진입 제스처에서 BGM 요소 승인
            onPlay("daily");
          }}
          className="btn-ornate w-full rounded-[18px] py-4 text-[18px] font-black text-white"
          style={{ background: "linear-gradient(180deg, #7c5cf0 0%, #5a3cc0 100%)" }}
        >
          {t("home_daily")}
        </button>
        {/* 아이템 매치 버튼 + 우상단 데일리 체크인 스티커(버튼 위로 띄움) */}
        <div className="relative">
          <button
            onClick={() => {
              unlockAudio();
              unlockBgm(); // iOS: 진입 제스처에서 BGM 요소 승인
              onPlay("free");
            }}
            className="btn-ornate w-full rounded-[18px] py-4 text-[18px] font-black text-white"
            style={{ background: "linear-gradient(180deg, #e2604f 0%, #b23d34 100%)" }}
          >
            {t("home_free")}
          </button>
        </div>
      </div>

      {/* 하단 내비 (랭킹 · 아이템상점 · 가챠 · 더보기) — 3D 일러스트 아이콘 */}
      <div className="mx-5 mb-safe mt-3 grid grid-cols-4 rounded-[22px] bg-black/45 px-2 py-2.5 ring-1 ring-white/15 backdrop-blur">
        <button onClick={onOpenLeaderboard} className="flex flex-col items-center gap-1 py-1 transition-transform active:scale-90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-ranking.png" alt="" className="h-9 w-9 object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
          <span className="text-[11px] font-bold text-white">{t("home_leaderboard")}</span>
        </button>
        <button onClick={onOpenShop} className="flex flex-col items-center gap-1 py-1 transition-transform active:scale-90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-shop.png" alt="" className="h-9 w-9 object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
          <span className="text-[11px] font-bold text-white">{t("home_shop")}</span>
        </button>
        <button onClick={onOpenGacha} className="flex flex-col items-center gap-1 py-1 transition-transform active:scale-90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nav-draw.png" alt="" className="h-9 w-9 object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
          <span className="text-[11px] font-bold text-white">{t("home_gacha")}</span>
        </button>
        <button onClick={onOpenMore} className="flex flex-col items-center gap-1 py-1 transition-transform active:scale-90">
          <span className="flex h-9 w-9 items-center justify-center">
            <LayoutGrid className="h-7 w-7 text-gold drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" strokeWidth={2.5} />
          </span>
          <span className="text-[11px] font-bold text-white">{t("home_more")}</span>
        </button>
      </div>

      {weekly && (
        <WeeklyResultModal
          data={weekly}
          onClose={() => setWeekly(null)}
          onGoGacha={() => {
            setWeekly(null);
            onOpenGacha();
          }}
        />
      )}

      {/* 실물 당첨 리마인드 — 주간 결과 모달을 닫은 뒤에 순차 노출 (겹침 방지) */}
      {!weekly && showPrizes && pendingPrizes.length > 0 && (
        <PrizeClaimModal
          winners={pendingPrizes}
          onClose={() => setShowPrizes(false)}
          onChanged={() => void fetchMyPrizes().then((ws) => setPendingPrizes(ws.filter((w) => w.status === "pending" || w.status === "submitted")))}
        />
      )}

      {showDaily && (
        <DailyReward
          onClose={() => setShowDaily(false)}
          onClaimed={(cp) => {
            setPoint(cp);
            setDailyClaimable(false);
          }}
        />
      )}

      {showProfile && (
        <ProfileSetup
          onClose={() => setShowProfile(false)}
          onSaved={(n, a) => {
            setNickState(n);
            setAvatarState(a);
          }}
        />
      )}
    </div>
  );
}
