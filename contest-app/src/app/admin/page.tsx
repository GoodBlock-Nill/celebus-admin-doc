"use client";

// FanStage 관리자 — 로그인 게이트 + 탭 SPA (운영자 전용, 한국어 고정)
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRound, Clapperboard, BarChart3, ScrollText, Trophy, Star, BadgeCheck } from "lucide-react";
import type { ContestRow, LogRow } from "@/lib/admin-types";
import { adminFetch, getAdminPw, setAdminPw } from "@/lib/admin-types";
import ContestsPanel from "@/components/admin/ContestsPanel";
import StagesPanel from "@/components/admin/StagesPanel";
import FeaturedPanel from "@/components/admin/FeaturedPanel";
import OfficialSeedPanel from "@/components/admin/OfficialSeedPanel";
import MembersPanel from "@/components/admin/MembersPanel";
import EventsPanel from "@/components/admin/EventsPanel";
import EntriesPanel from "@/components/admin/EntriesPanel";
import AwardsPanel from "@/components/admin/AwardsPanel";

// contests/entries/awards는 레거시(콘테스트 시절) — 탭 숨김, 코드·라우트는 보존
type Tab = "overview" | "stages" | "official" | "featured" | "events" | "members" | "contests" | "entries" | "awards" | "logs";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "개요", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "stages", label: "아카이브", icon: <Clapperboard className="h-4 w-4" /> },
  { key: "official", label: "공식영상", icon: <BadgeCheck className="h-4 w-4" /> },
  { key: "featured", label: "대표영상", icon: <Star className="h-4 w-4" /> },
  { key: "events", label: "토너먼트", icon: <Trophy className="h-4 w-4" /> },
  { key: "members", label: "멤버", icon: <UserRound className="h-4 w-4" /> },
  { key: "logs", label: "로그", icon: <ScrollText className="h-4 w-4" /> },
];

interface Stats {
  contests: ContestRow[];
  contestCount: number;
  entryCount: number;
  voteCount: number;
  pendingClaims: number;
  reportedEntries: number;
}

function Login({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setAdminPw(pw);
    const res = await adminFetch("/api/admin/stats");
    setBusy(false);
    if (res.ok) onOk();
    else toast.error("비밀번호가 올바르지 않아요.");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-xs rounded-3xl border border-border bg-card p-6 text-center">
        <h1 className="mb-1 text-lg font-black">CELEBUS MOMENT 관리자</h1>
        <p className="mb-4 text-[12px] text-muted">관리자 비밀번호를 입력하세요</p>
        <input
          type="password"
          value={pw}
          autoFocus
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="mb-3 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <button onClick={submit} disabled={busy || !pw} className="w-full rounded-full bg-primary py-2.5 text-[14px] font-black text-white disabled:opacity-40">
          로그인
        </button>
      </div>
    </div>
  );
}

function Overview({ stats }: { stats: Stats | null }) {
  // MOMENT 지표 — 아카이브/영상/멤버/토너먼트 (기존 stats는 로그인 검증용으로만 유지)
  const [m, setM] = useState<{ archives: number; official: number; videos: number; members: number; tournaments: number } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const [stg, mem, ev] = await Promise.all([
          adminFetch("/api/admin/stages").then((r) => r.json()),
          adminFetch("/api/admin/members").then((r) => r.json()),
          adminFetch("/api/admin/events").then((r) => r.json()),
        ]);
        const stages = (stg.stages ?? []) as { is_official: boolean; post_count: number }[];
        setM({
          archives: stages.length,
          official: stages.filter((s) => s.is_official).length,
          videos: stages.reduce((a, s) => a + (s.post_count ?? 0), 0),
          members: (mem.members ?? []).length,
          tournaments: (ev.events ?? []).length,
        });
      } catch {
        /* 지표는 보조 */
      }
    })();
  }, []);
  void stats;
  if (!m) return <div className="h-40 animate-pulse rounded-2xl bg-card" />;
  const cards = [
    ["아카이브", m.archives],
    ["공식 아카이브", m.official],
    ["총 영상", m.videos],
    ["멤버", m.members],
    ["토너먼트", m.tournaments],
  ] as const;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(([label, n]) => (
          <div key={label} className="rounded-[16px] bg-surface-1 p-4 ring-1 ring-hairline">
            <p className="text-[11px] font-bold text-muted">{label}</p>
            <p className="mt-1 text-2xl font-black text-primary-400">{n.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[16px] bg-surface-1 p-4 ring-1 ring-hairline">
        <h3 className="mb-2 text-[13px] font-bold text-fg">배포 전 셋업 가이드</h3>
        <ol className="space-y-1.5 text-[12.5px] leading-relaxed text-muted">
          <li><b className="text-fg/80">1. 아카이브</b> — 공연별 팬 아카이브 + <b className="text-primary-400">V01D 공식 아카이브</b>(열람 전용) 생성</li>
          <li><b className="text-fg/80">2. 공식 영상</b> — 공식 아카이브에 V01D 공식 YouTube/TikTok 영상 등록(오픈 첫날 채우기)</li>
          <li><b className="text-fg/80">3. 대표영상</b> — 홈 히어로에 고정할 대표 영상 지정(선택)</li>
          <li><b className="text-fg/80">4. 토너먼트</b> — 팬 영상이 모이면 아카이브 단위 모먼트 토너먼트 개최</li>
          <li><b className="text-fg/80">5. 멤버</b> — V01D 멤버 계정 등록(하트·멤버 댓글 권한)</li>
        </ol>
      </div>
    </div>
  );
}

function Logs() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await adminFetch("/api/admin/logs");
      setLogs((await res.json()).logs ?? []);
    })();
  }, []);
  return (
    <div className="space-y-1.5">
      {logs.map((l) => (
        <div key={l.id} className="rounded-xl border border-border bg-card px-3 py-2 text-[12px]">
          <span className="font-bold">{l.action}</span>
          {l.detail && <span className="text-muted"> — {l.detail}</span>}
          <span className="float-right text-[11px] text-muted">{new Date(l.created_at).toLocaleString("ko")}</span>
        </div>
      ))}
      {!logs.length && <p className="py-10 text-center text-[13px] text-muted">로그가 없어요</p>}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);

  async function loadStats() {
    const res = await adminFetch("/api/admin/stats");
    if (res.ok) {
      setStats(await res.json());
      setAuthed(true);
    } else {
      setAuthed(false);
    }
  }

  useEffect(() => {
    if (getAdminPw()) void loadStats();
    else setAuthed(false);
  }, []);

  if (authed === null) return null;
  if (!authed) return <Login onOk={() => void loadStats()} />;

  const nav = (
    <>
      {TABS.map((tb) => {
        const active = tab === tb.key;
        return (
          <button
            key={tb.key}
            onClick={() => {
              setTab(tb.key);
              if (tb.key === "overview") void loadStats();
            }}
            className={`flex shrink-0 items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-[14px] font-bold transition-colors lg:w-full ${
              active ? "bg-primary/15 text-primary-400 ring-1 ring-primary/30" : "text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {tb.icon} {tb.label}
          </button>
        );
      })}
    </>
  );

  const cur = TABS.find((t) => t.key === tab);

  return (
    <div className="min-h-dvh lg:flex">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-hairline bg-surface-1 p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="mb-4 flex items-center gap-2 px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/symbol.svg" alt="" className="h-6 w-6" />
          <h1 className="text-[15px] font-black">
            MOMENT <span className="text-muted">관리자</span>
          </h1>
        </div>
        {nav}
      </aside>

      {/* 모바일 상단 바 */}
      <div className="sticky top-0 z-10 border-b border-hairline bg-surface-0/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/symbol.svg" alt="" className="h-5 w-5" />
          <h1 className="text-[14px] font-black">CELEBUS MOMENT 관리자</h1>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5">{nav}</div>
      </div>

      {/* 콘텐츠 전폭 */}
      <main className="min-w-0 flex-1 px-4 pb-24 pt-5 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-center gap-2">
            {cur?.icon}
            <h2 className="text-[18px] font-black">{cur?.label}</h2>
          </div>
          {tab === "overview" && <Overview stats={stats} />}
          {tab === "stages" && <StagesPanel />}
          {tab === "official" && <OfficialSeedPanel />}
          {tab === "featured" && <FeaturedPanel />}
          {tab === "events" && <EventsPanel />}
          {tab === "members" && <MembersPanel />}
          {tab === "contests" && <ContestsPanel />}
          {tab === "entries" && <EntriesPanel contests={stats?.contests ?? []} />}
          {tab === "awards" && <AwardsPanel contests={stats?.contests ?? []} />}
          {tab === "logs" && <Logs />}
        </div>
      </main>
    </div>
  );
}
