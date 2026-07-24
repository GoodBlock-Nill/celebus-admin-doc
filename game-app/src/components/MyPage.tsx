"use client";

// 마이페이지 — 서버 프로필(닉네임 고정·전화 마스킹) + 통계 + 계정(로그아웃).
// 아바타 편집은 ProfileSetup(기본 6종/업로드) 단일 경로로 통일 — 로컬 전용 편집 제거.
import { useEffect, useRef, useState } from "react";
import { LogOut, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getNick, getAvatar, fetchMyRank, fetchAccount, topPercent, type MyRank } from "@/lib/game-api";
import { fetchProfile, logout } from "@/lib/auth-api";
import Avatar from "./Avatar";
import ProfileSetup from "./ProfileSetup";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

export default function MyPage({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  const [nick, setNickState] = useState("");
  const [avatar, setAvatarState] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [rank, setRank] = useState<MyRank | null>(null);
  const [point, setPoint] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [logoutArmed, setLogoutArmed] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNickState(getNick());
    setAvatarState(getAvatar());
    Promise.all([
      fetchMyRank().then(setRank),
      fetchAccount().then((a) => setPoint(a.celeb_point)),
      fetchProfile().then((p) => {
        if (p.signed_up) {
          if (p.nickname) setNickState(p.nickname);
          if (p.avatar) setAvatarState(p.avatar);
          if (p.phone_cc && p.phone_last4) setPhoneMasked(`${p.phone_cc} ····${p.phone_last4}`);
        }
      }),
    ]).finally(() => setLoading(false));
    return () => {
      if (armTimer.current) clearTimeout(armTimer.current);
    };
  }, []);

  // 로그아웃 — 오탭 방지 2단계 탭(3초 내 재탭 시 실행)
  async function onLogout() {
    if (!logoutArmed) {
      setLogoutArmed(true);
      if (armTimer.current) clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setLogoutArmed(false), 3000);
      return;
    }
    const ok = await logout();
    if (!ok) {
      toast.error(t("auth_err_generic"));
      setLogoutArmed(false);
      return;
    }
    location.reload(); // 게이트로 복귀
  }

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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      <ScreenHeader title={t("mypage_title")} onBack={onBack} />

      {/* 프로필 — 닉네임은 계정 식별자(변경 불가), 아바타 편집은 ProfileSetup */}
      <div className="mt-5 flex items-center gap-3 rounded-[16px] bg-surface-1 px-4 py-3.5 ring-1 ring-hairline">
        <Avatar value={avatar} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-black text-fg">{nick}</div>
          {phoneMasked && <div className="mt-0.5 text-[12px] tabular-nums text-subtle">{phoneMasked}</div>}
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 py-2 text-[12px] font-bold text-fg ring-1 ring-hairline active:scale-95"
        >
          <Pencil className="h-3.5 w-3.5" /> {t("mypage_edit_profile")}
        </button>
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

      {/* 계정 */}
      <div className="mb-2 mt-6 text-[11px] font-bold text-subtle">{t("mypage_account")}</div>
      <button
        onClick={onLogout}
        className={`flex items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-[13px] font-bold ring-1 transition-colors active:scale-[0.99] ${
          logoutArmed ? "bg-danger/15 text-danger ring-danger/40" : "bg-surface-1 text-muted ring-hairline"
        }`}
      >
        <LogOut className="h-4 w-4" />
        {logoutArmed ? t("mypage_logout_confirm") : t("mypage_logout")}
      </button>

      {showEdit && (
        <ProfileSetup
          onClose={() => setShowEdit(false)}
          onSaved={(n, a) => {
            setNickState(n);
            setAvatarState(a);
          }}
        />
      )}
    </div>
  );
}
