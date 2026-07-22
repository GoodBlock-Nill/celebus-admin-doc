"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Play, Trophy, Store, Swords, MoreHorizontal, Gift } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { getNick, setNick, getAvatar, setAvatar, fetchAccount, getDailyStatus } from "@/lib/game-api";
import { unlockAudio } from "@/lib/sfx";
import Avatar from "./Avatar";
import CoinBalance from "./CoinBalance";
import DailyReward from "./DailyReward";
import LangSwitcher from "./LangSwitcher";
import { useLang } from "./LangProvider";

export default function Home({
  onPlay,
  onOpenLeaderboard,
  onOpenShop,
  onOpenMore,
}: {
  onPlay: (mode: "free" | "daily") => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenMore: () => void;
}) {
  const { t } = useLang();
  const [nick, setNickState] = useState("");
  const [avatar, setAvatarState] = useState<string>(GAME_CONFIG.avatars[0].id);
  const [point, setPoint] = useState<number | null>(null);
  const [dailyClaimable, setDailyClaimable] = useState(false);
  const [showDaily, setShowDaily] = useState(false);

  useEffect(() => {
    setNickState(getNick());
    setAvatarState(getAvatar());
    fetchAccount().then((a) => setPoint(a.celeb_point));
    getDailyStatus().then((s) => setDailyClaimable(s.claimable));
  }, []);

  const pickAvatar = (id: string) => {
    setAvatarState(id);
    setAvatar(id);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-4">
      <header className="flex items-center justify-between gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark.svg" alt="CELEBUS" className="h-[14px] w-auto opacity-80" />
        <div className="flex items-center gap-2">
          {point != null && <CoinBalance amount={point} />}
          {/* 출석 보상 — 오늘 미수령 시 강조 + 점 표시 */}
          <button
            onClick={() => setShowDaily(true)}
            aria-label={t("daily_reward")}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full ring-1 transition-transform active:scale-90 ${
              dailyClaimable ? "bg-primary/20 text-primary-400 ring-primary/40" : "bg-surface-1 text-subtle ring-hairline"
            }`}
          >
            <Gift className="h-4 w-4" />
            {dailyClaimable && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-live ring-2 ring-surface-0" />}
          </button>
          <LangSwitcher />
        </div>
      </header>

      {/* 타이틀 */}
      <div className="mt-10 text-center">
        <div className="text-[13px] font-black uppercase tracking-[0.2em] text-primary-400">CELEBUS · V01D</div>
        <h1 className="font-display text-[52px] font-black leading-none tracking-tight">V01D POP</h1>
        <p className="mt-3 text-[14px] text-muted break-keep">{t("tagline")}</p>
      </div>

      {/* 내 프로필 (아바타 + 닉네임) */}
      <div className="mt-8">
        <div className="flex items-center justify-center">
          <Avatar value={avatar} size="lg" />
        </div>

        <label className="mb-1.5 mt-5 block text-[11px] font-bold text-subtle">{t("nickname")}</label>
        <input
          value={nick}
          onChange={(e) => setNickState(e.target.value.slice(0, 16))}
          onBlur={() => setNick(nick)}
          maxLength={16}
          placeholder={t("nickname_ph")}
          className="w-full rounded-[14px] bg-surface-1 px-4 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline placeholder:font-normal placeholder:text-subtle focus:ring-primary/40"
        />

        <div className="mb-2 mt-4 text-[11px] font-bold text-subtle">{t("avatar")}</div>
        <div className="grid grid-cols-6 gap-2">
          {GAME_CONFIG.avatars.map((a) => (
            <button
              key={a.id}
              onClick={() => pickAvatar(a.id)}
              aria-label={a.id}
              aria-pressed={avatar === a.id}
              className={`flex aspect-square items-center justify-center rounded-full text-[20px] ring-2 transition-transform active:scale-90 ${
                avatar === a.id ? "ring-primary" : "ring-transparent"
              }`}
              style={{ background: a.bg }}
            >
              {a.glyph}
            </button>
          ))}
        </div>
      </div>

      {/* 플레이 버튼 */}
      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button
          onClick={() => {
            unlockAudio();
            onPlay("daily");
          }}
          className="flex items-center justify-center gap-2 rounded-[16px] bg-primary py-4 text-[16px] font-black text-white transition-transform active:scale-[0.99]"
        >
          <CalendarDays className="h-5 w-5" /> {t("home_daily")}
        </button>
        <button
          onClick={() => {
            unlockAudio();
            onPlay("free");
          }}
          className="flex items-center justify-center gap-2 rounded-[16px] bg-surface-1 py-4 text-[15px] font-black text-fg ring-1 ring-hairline transition-transform active:scale-[0.99]"
        >
          <Play className="h-5 w-5" /> {t("home_free")}
        </button>

        {/* 랭킹 · 상점 · 멤버 도전(곧) · 더보기 */}
        <div className="mt-2 grid grid-cols-4 gap-2">
          <button
            onClick={onOpenLeaderboard}
            className="flex flex-col items-center gap-1 rounded-[14px] bg-surface-1 py-3 text-center ring-1 ring-hairline transition-transform active:scale-95"
          >
            <Trophy className="h-5 w-5 text-gold" />
            <span className="text-[11px] font-bold text-fg">{t("home_leaderboard")}</span>
          </button>
          <button
            onClick={onOpenShop}
            className="flex flex-col items-center gap-1 rounded-[14px] bg-surface-1 py-3 text-center ring-1 ring-hairline transition-transform active:scale-95"
          >
            <Store className="h-5 w-5 text-primary-400" />
            <span className="text-[11px] font-bold text-fg">{t("home_shop")}</span>
          </button>
          <div className="flex flex-col items-center gap-1 rounded-[14px] bg-surface-1/60 py-3 text-center ring-1 ring-hairline">
            <Swords className="h-5 w-5 text-subtle" />
            <span className="text-[11px] font-bold text-muted">{t("home_member")}</span>
            <span className="text-[9px] font-bold text-subtle">{t("coming_soon")}</span>
          </div>
          <button
            onClick={onOpenMore}
            className="flex flex-col items-center gap-1 rounded-[14px] bg-surface-1 py-3 text-center ring-1 ring-hairline transition-transform active:scale-95"
          >
            <MoreHorizontal className="h-5 w-5 text-fg" />
            <span className="text-[11px] font-bold text-fg">{t("home_more")}</span>
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-subtle break-keep">{t("how_to")}</p>
      </div>

      {showDaily && (
        <DailyReward
          onClose={() => setShowDaily(false)}
          onClaimed={(cp) => {
            setPoint(cp);
            setDailyClaimable(false);
          }}
        />
      )}
    </div>
  );
}
