"use client";

// FanStage 관리자 — 로그인 게이트 + 탭 SPA (운영자 전용, 한국어 고정)
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRound, Clapperboard, BarChart3, FileText, Image as ImageIcon, ScrollText, Trophy } from "lucide-react";
import type { ContestRow, LogRow } from "@/lib/admin-types";
import { adminFetch, getAdminPw, setAdminPw } from "@/lib/admin-types";
import ContestsPanel from "@/components/admin/ContestsPanel";
import StagesPanel from "@/components/admin/StagesPanel";
import MembersPanel from "@/components/admin/MembersPanel";
import EventsPanel from "@/components/admin/EventsPanel";
import EntriesPanel from "@/components/admin/EntriesPanel";
import AwardsPanel from "@/components/admin/AwardsPanel";

type Tab = "overview" | "stages" | "events" | "members" | "contests" | "entries" | "awards" | "logs";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "개요", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "stages", label: "스테이지", icon: <Clapperboard className="h-4 w-4" /> },
  { key: "events", label: "이벤트", icon: <Trophy className="h-4 w-4" /> },
  { key: "members", label: "멤버", icon: <UserRound className="h-4 w-4" /> },
  { key: "contests", label: "콘테스트", icon: <FileText className="h-4 w-4" /> },
  { key: "entries", label: "출품작", icon: <ImageIcon className="h-4 w-4" /> },
  { key: "awards", label: "수상·배송", icon: <Trophy className="h-4 w-4" /> },
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
        <h1 className="mb-1 text-lg font-black">FanStage 관리자</h1>
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
  if (!stats) return <div className="h-40 animate-pulse rounded-2xl bg-card" />;
  const cards = [
    ["콘테스트", stats.contestCount],
    ["출품작", stats.entryCount],
    ["총 투표", stats.voteCount],
    ["배송 대기", stats.pendingClaims],
    ["신고 누적 출품작", stats.reportedEntries],
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
      {stats.contests.length > 0 && (
        <div>
          <h3 className="mb-2 text-[13px] font-bold text-muted">콘테스트</h3>
          <div className="space-y-1.5">
            {stats.contests.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-[12px] bg-surface-1 px-3 py-2.5 text-[13px] ring-1 ring-hairline">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">{c.status}</span>
                <span className="truncate font-bold">{c.title}</span>
                <a href={`/contest/${c.slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 text-[11px] font-bold text-primary-400">
                  공개 화면 ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      {!stats.contests.length && (
        <p className="rounded-[16px] border border-dashed border-line py-12 text-center text-sm text-muted">
          아직 콘테스트가 없어요. 왼쪽 [콘테스트]에서 새로 만들어보세요.
        </p>
      )}
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
            FanStage <span className="text-muted">관리자</span>
          </h1>
        </div>
        {nav}
      </aside>

      {/* 모바일 상단 바 */}
      <div className="sticky top-0 z-10 border-b border-hairline bg-surface-0/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/symbol.svg" alt="" className="h-5 w-5" />
          <h1 className="text-[14px] font-black">FanStage 관리자</h1>
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
