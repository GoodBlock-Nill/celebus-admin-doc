"use client";

import { useEffect, useState } from "react";
import { GAME_CONFIG } from "@/lib/game-config";
import {
  getNick,
  setNick,
  getAvatar,
  setAvatar,
  fetchMyRank,
  fetchAccount,
  topPercent,
  type MyRank,
} from "@/lib/game-api";
import Avatar from "./Avatar";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

export default function MyPage({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  const [nick, setNickState] = useState("");
  const [avatar, setAvatarState] = useState(GAME_CONFIG.avatars[0].id);
  const [rank, setRank] = useState<MyRank | null>(null);
  const [point, setPoint] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNickState(getNick());
    setAvatarState(getAvatar());
    Promise.all([fetchMyRank().then(setRank), fetchAccount().then((a) => setPoint(a.celeb_point))]).finally(() =>
      setLoading(false),
    );
  }, []);

  const pick = (id: string) => {
    setAvatarState(id);
    setAvatar(id);
  };

  // "Lv.N · 순위위 · 상위%" (미기록 시 -)
  const rankText = (lvl: number | null | undefined, r: number | null | undefined, tot: number | null | undefined) =>
    r && tot && lvl
      ? `${t("lv_prefix")}${lvl} · ${r.toLocaleString()}${t("rank_unit")} · ${t("top_percent").replace("{p}", String(topPercent(r, tot)))}`
      : "-";

  const stats: { label: string; value: string }[] = [
    { label: t("lb_normal"), value: rankText(rank?.normal_best_level, rank?.normal_rank, rank?.normal_total) },
    { label: t("lb_item"), value: rankText(rank?.item_best_level, rank?.item_rank, rank?.item_total) },
    { label: t("cp_balance"), value: point.toLocaleString() },
  ];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-4">
      <ScreenHeader title={t("mypage_title")} onBack={onBack} />

      {/* 프로필 */}
      <div className="mt-5 flex items-center gap-3">
        <Avatar value={avatar} size="lg" />
        <input
          value={nick}
          onChange={(e) => setNickState(e.target.value.slice(0, 16))}
          onBlur={() => setNick(nick)}
          maxLength={16}
          placeholder={t("nickname_ph")}
          className="flex-1 rounded-[14px] bg-surface-1 px-4 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline placeholder:font-normal placeholder:text-subtle focus:ring-primary/40"
        />
      </div>

      <div className="mb-2 mt-4 text-[11px] font-bold text-subtle">{t("avatar")}</div>
      <div className="grid grid-cols-6 gap-2">
        {GAME_CONFIG.avatars.map((a) => (
          <button
            key={a.id}
            onClick={() => pick(a.id)}
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

      {/* 통계 */}
      <div className="mb-2 mt-6 text-[11px] font-bold text-subtle">{t("stats")}</div>
      <div className="flex flex-col gap-1.5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-[14px] bg-surface-1 px-4 py-3 ring-1 ring-hairline">
            <span className="text-[13px] text-muted">{s.label}</span>
            {loading ? (
              <span className="h-4 w-28 animate-pulse rounded bg-surface-2" />
            ) : (
              <span className="text-[13px] font-black tabular-nums text-fg">{s.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
