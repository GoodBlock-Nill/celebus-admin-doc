"use client";

// 랭킹 — 모드(일반/아이템) × 기간(주간/월간/V01D). V01D 탭 = 멤버별 주간·월간 성적.
// 일반 리스트에서 V01D 멤버 행은 뱃지+퍼플 글로우로 특별 표시(팬이 이길 대상 인지).
import { useEffect, useState } from "react";
import { ChevronLeft, Star, Trophy } from "lucide-react";
import {
  fetchLeaderboard,
  fetchMemberBoard,
  fetchMyRank,
  getAvatar,
  topPercent,
  type LeaderRow,
  type LeaderMode,
  type MemberName,
  type MemberRow,
  type MyRank,
} from "@/lib/game-api";
import Avatar from "./Avatar";
import { useLang } from "./LangProvider";

const MEDAL = ["🥇", "🥈", "🥉"];
type Tab = "week" | "month" | "v01d";

// V01D 멤버 뱃지 — 별 + V01D (리스트·멤버 탭 공용)
function MemberBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[8.5px] font-black leading-none text-white shadow-[0_0_8px_rgba(139,92,246,0.7)]">
      <Star className="h-2 w-2 fill-current" />
      V01D
    </span>
  );
}

// V01D 멤버 아바타 헤일로 — 보라 그라데이션 링(멤버만). "특별한 사람" 신호.
function HaloAvatar({ value, member, size }: { value: string | null; member: boolean; size: "sm" | "md" | "lg" }) {
  if (!member) return <Avatar value={value} size={size} />;
  return (
    <span className="inline-block rounded-full bg-gradient-to-br from-primary via-[#b57bff] to-[#ec5c9a] p-[2px] shadow-[0_0_10px_rgba(139,92,246,0.5)]">
      <span className="block rounded-full bg-surface-1 p-[1.5px]">
        <Avatar value={value} size={size} />
      </span>
    </span>
  );
}

// 멤버 표시 이름 — 현재 언어로 선택(없으면 null)
function memberNameOf(mn: MemberName | undefined, lang: "ko" | "en" | "ja"): string | null {
  return mn ? mn[lang] || mn.ko || null : null;
}

export default function Leaderboard({ onBack }: { onBack: () => void }) {
  const { t, lang } = useLang();
  const [mode, setMode] = useState<LeaderMode>("normal");
  const [tab, setTab] = useState<Tab>("week"); // 기본 주간 — 보상 이벤트 지향
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<MyRank | null>(null);
  const [myAvatar, setMyAvatar] = useState<string>("");

  useEffect(() => setMyAvatar(getAvatar()), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    if (tab === "v01d") {
      fetchMemberBoard(mode).then((r) => {
        if (alive) {
          setMembers(r);
          setLoading(false);
        }
      });
    } else {
      fetchLeaderboard(mode, tab).then((r) => {
        if (alive) {
          setRows(r);
          setLoading(false);
        }
      });
    }
    return () => {
      alive = false;
    };
  }, [mode, tab]);

  useEffect(() => {
    if (tab === "v01d") return;
    setMine(null); // 기간 전환 시 이전 순위 잔상 방지
    fetchMyRank(tab).then(setMine);
  }, [tab]);

  const myRank = mode === "normal" ? mine?.normal_rank : mine?.item_rank;
  const myTotal = mode === "normal" ? mine?.normal_total : mine?.item_total;

  // 멤버 탭 성적 셀 — "N위 · 점수" (기록 없으면 -)
  const statCell = (s: MemberRow["week"]) =>
    s ? (
      <span className="flex items-baseline gap-1">
        <span className="text-[14px] font-black tabular-nums text-primary-400">
          {s.rank.toLocaleString()}
          <span className="text-[10px] font-bold text-muted">{t("rank_unit")}</span>
        </span>
        <span className="text-[11px] font-bold tabular-nums text-fg">{s.score.toLocaleString()}</span>
      </span>
    ) : (
      <span className="text-[11px] text-subtle">-</span>
    );

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      <header className="flex items-center gap-2">
        <button onClick={onBack} aria-label={t("back")} className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-hairline active:scale-95">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex items-center gap-1.5 font-display text-[22px] font-black">
          <Trophy className="h-5 w-5 text-gold" /> {t("lb_title")}
        </h1>
      </header>

      {/* 탭 (모드별) */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-surface-1 p-1 ring-1 ring-hairline">
        {(["normal", "item"] as LeaderMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full py-2 text-[13px] font-black transition-colors ${
              mode === m ? "bg-primary text-white" : "text-muted"
            }`}
          >
            {t(m === "normal" ? "lb_normal" : "lb_item")}
          </button>
        ))}
      </div>

      {/* 기간·멤버 탭 (주간/월간/V01D) */}
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-full bg-surface-1 p-1 ring-1 ring-hairline">
        {(["week", "month", "v01d"] as Tab[]).map((p) => (
          <button
            key={p}
            onClick={() => setTab(p)}
            className={`rounded-full py-1.5 text-[12px] font-black transition-colors ${
              tab === p
                ? p === "v01d"
                  ? "bg-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  : "bg-surface-3 text-fg ring-1 ring-primary/40"
                : "text-subtle"
            }`}
          >
            {t(p === "week" ? "lb_week" : p === "month" ? "lb_month" : "lb_v01d")}
          </button>
        ))}
      </div>
      <p className="mt-1.5 px-1 text-[10.5px] text-subtle break-keep">{t(tab === "v01d" ? "lb_member_hint" : "lb_period_note")}</p>

      {tab === "v01d" ? (
        /* ── V01D 멤버 보드 — 멤버별 주간·월간 성적 ── */
        <div className="mt-3 flex flex-col gap-1.5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-[14px] bg-surface-1" />)
          ) : members.length === 0 ? (
            <p className="mt-10 text-center text-[13px] text-muted break-keep">{t("lb_empty")}</p>
          ) : (
            members.map((m) => (
              <div
                key={m.nickname}
                className="flex items-center gap-3 rounded-[14px] bg-gradient-to-r from-primary/20 to-surface-1 px-4 py-3 ring-1 ring-primary/35"
              >
                <HaloAvatar value={m.avatar} member size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[14px] font-black text-primary-400">{m.nickname}</span>
                    {memberNameOf(m.member_name, lang) && (
                      <span className="shrink-0 text-[12px] font-bold text-primary-300/90">{memberNameOf(m.member_name, lang)}</span>
                    )}
                    <MemberBadge />
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] font-bold text-subtle">{t("lb_week")}</div>
                      {statCell(m.week)}
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-subtle">{t("lb_month")}</div>
                      {statCell(m.month)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* 내 순위 배너 */}
          <div className="mt-3 flex items-center justify-between rounded-[16px] bg-primary/12 px-4 py-3 ring-1 ring-primary/25">
            <span className="flex items-center gap-2 text-[12px] font-bold text-primary-400">
              <Avatar value={myAvatar} size="sm" />
              {t("lb_my_rank")}
            </span>
            {myRank ? (
              <span className="text-[14px] font-black">
                {myRank.toLocaleString()}
                {t("rank_unit")} · {t("top_percent").replace("{p}", String(topPercent(myRank, myTotal || 0)))}
              </span>
            ) : (
              <span className="text-[12px] text-muted">{t("lb_unranked")}</span>
            )}
          </div>

          {/* 리스트 — V01D 멤버 행은 뱃지 + 퍼플 글로우 */}
          <div className="mt-3 flex flex-col gap-1.5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-[14px] bg-surface-1" />)
            ) : rows.length === 0 ? (
              <p className="mt-10 text-center text-[13px] text-muted break-keep">{t("lb_empty")}</p>
            ) : (
              rows.map((row) => {
                const isMe = myRank === row.rank; // 근사 매칭(동점 시 상단 1건) — 강조 용도
                return (
                  <div
                    key={row.rank}
                    className={`flex items-center gap-3 rounded-[14px] px-4 py-2.5 ring-1 ${
                      row.member
                        ? "bg-gradient-to-r from-primary/25 to-surface-1 ring-primary/45 shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                        : isMe
                          ? "bg-primary/12 ring-primary/30"
                          : "bg-surface-1 ring-hairline"
                    }`}
                  >
                    <span className="w-6 text-center text-[15px] font-black tabular-nums">
                      {row.rank <= 3 ? MEDAL[row.rank - 1] : row.rank}
                    </span>
                    <HaloAvatar value={row.avatar} member={!!row.member} size="sm" />
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className={`truncate text-[14px] font-bold ${row.member ? "text-primary-400" : ""}`}>{row.nickname}</span>
                      {row.member && memberNameOf(row.member_name, lang) && (
                        <span className="shrink-0 text-[11.5px] font-bold text-primary-300/90">{memberNameOf(row.member_name, lang)}</span>
                      )}
                      {row.member && <MemberBadge />}
                    </span>
                    <span className="flex flex-col items-end leading-tight">
                      <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-black text-primary-400">
                        {t("lv_prefix")}
                        {row.level}
                      </span>
                      <span className="text-[13px] font-black tabular-nums text-fg">{row.score.toLocaleString()}</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
