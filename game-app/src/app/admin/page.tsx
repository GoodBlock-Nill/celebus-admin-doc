"use client";

// CELEB MATCH 관리 — 내부 운영 도구(한국어 전용, 데스크톱 웹 우선). ADMIN_KEY 로그인.
// 데스크톱: 좌측 사이드바 내비 / 모바일: 상단 가로 탭. 콘텐츠는 넓은 폭(테이블 밀도) 기준.
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Trophy,
  Ban,
  Coins,
  Settings2,
  ScrollText,
  ExternalLink,
  Gauge,
  Megaphone,
  Ticket,
  CalendarRange,
} from "lucide-react";
import { aget } from "@/lib/admin-api";
import { BTN, INPUT } from "@/components/admin/ui";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminMembers from "@/components/admin/AdminMembers";
import AdminBoard from "@/components/admin/AdminBoard";
import AdminBanned from "@/components/admin/AdminBanned";
import AdminEconomy from "@/components/admin/AdminEconomy";
import AdminBalance from "@/components/admin/AdminBalance";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminGacha from "@/components/admin/AdminGacha";
import AdminConfig from "@/components/admin/AdminConfig";
import AdminLogs from "@/components/admin/AdminLogs";
import AdminWeeklyReport from "@/components/admin/AdminWeeklyReport";

const TABS = [
  { key: "dash", label: "대시보드", icon: LayoutDashboard, desc: "오늘 지표·활성화·리텐션" },
  { key: "members", label: "회원", icon: Users, desc: "검색·상세·제재·CP·V01D 멤버 지정" },
  { key: "board", label: "리더보드", icon: Trophy, desc: "기간별 기록·보상 정산 CSV·기록 삭제" },
  { key: "balance", label: "밸런스", icon: Gauge, desc: "레벨 벽·좌절 구간·재도전 과열 계측" },
  { key: "report", label: "주간 리포트", icon: CalendarRange, desc: "주간 지표·전주 대비·개선 인사이트" },
  { key: "banned", label: "금칙어", icon: Ban, desc: "닉네임 금칙어 관리" },
  { key: "notice", label: "홈 팝업", icon: Megaphone, desc: "홈 진입 시 팝업 공지 관리" },
  { key: "economy", label: "경제", icon: Coins, desc: "CP 발행·소진·유통 + 아이템 가격" },
  { key: "gacha", label: "럭키드로우", icon: Ticket, desc: "럭키드로우 이벤트·확률표·당첨자 관리" },
  { key: "config", label: "설정", icon: Settings2, desc: "게임 밸런스·연출·테마 원격 설정" },
  { key: "logs", label: "로그", icon: ScrollText, desc: "관리자 행동·시스템 이벤트 활동 로그" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminPage() {
  const [authed, setAuthed] = useState<"checking" | "no" | "yes">("checking");
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("dash");

  // 세션 유효성 확인 (stats 401 여부)
  useEffect(() => {
    aget("/api/admin/stats")
      .then(() => setAuthed("yes"))
      .catch(() => setAuthed("no"));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (res.ok) {
      setKey("");
      setAuthed("yes");
    } else {
      setErr(res.status === 429 ? "시도가 너무 많아요. 잠시 후 다시." : "키가 올바르지 않아요.");
    }
  }

  if (authed !== "yes") {
    return (
      <main className="admin-shell flex min-h-[100dvh] items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-[18px] bg-surface-1 p-8 ring-1 ring-hairline">
          <div className="flex flex-col items-center">
            <ShieldCheck className="h-10 w-10 text-primary-400" />
            <h1 className="mt-3 text-[18px] font-black">CELEB MATCH 관리</h1>
            <p className="mt-1 text-[12.5px] text-muted">내부 운영 전용</p>
          </div>
          {authed === "checking" ? (
            <p className="mt-6 text-center text-[12px] text-subtle">세션 확인 중…</p>
          ) : (
            <form onSubmit={login} className="mt-6 flex flex-col gap-2">
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="관리자 키"
                className={INPUT}
              />
              {err && <p className="text-[12px] font-bold text-danger">{err}</p>}
              <button type="submit" className={BTN}>
                로그인
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="admin-shell flex min-h-[100dvh]">
      {/* ── 사이드바 (데스크톱) ── */}
      <aside className="sticky top-0 hidden h-[100dvh] w-[220px] shrink-0 flex-col border-r border-hairline bg-surface-1/60 px-3 py-5 lg:flex">
        <div className="flex items-center gap-2 px-2">
          <ShieldCheck className="h-5 w-5 text-primary-400" />
          <div>
            <div className="text-[14px] font-black leading-tight">CELEB MATCH</div>
            <div className="text-[10px] font-bold text-subtle">관리 콘솔</div>
          </div>
        </div>
        <nav className="mt-6 flex flex-col gap-0.5">
          {TABS.map(({ key: k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[14.5px] font-bold transition-colors ${
                tab === k ? "bg-primary text-white" : "text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11.5px] font-bold text-subtle transition-colors hover:text-fg"
          >
            <ExternalLink className="h-3.5 w-3.5" /> 게임 열기
          </a>
          <span className="text-[11px] text-subtle">내부 운영 전용</span>
        </div>
      </aside>

      {/* ── 콘텐츠 ── */}
      <main className="min-w-0 flex-1">
        {/* 모바일 헤더 + 가로 탭 */}
        <div className="border-b border-hairline px-4 pb-3 pt-4 lg:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-400" />
            <span className="text-[15px] font-black">CELEB MATCH 관리</span>
          </div>
          <nav className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold ring-1 transition-colors ${
                  tab === t.key ? "bg-primary text-white ring-primary" : "bg-surface-1 text-muted ring-hairline"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-5 lg:px-8 lg:pt-8">
          {/* 섹션 헤더 (데스크톱) */}
          <header className="mb-5 hidden lg:block">
            <h1 className="text-[22px] font-black">{active.label}</h1>
            <p className="mt-1 text-[13.5px] text-muted">{active.desc}</p>
          </header>

          {tab === "dash" && <AdminDashboard />}
          {tab === "members" && <AdminMembers />}
          {tab === "board" && <AdminBoard />}
          {tab === "balance" && <AdminBalance />}
          {tab === "report" && <AdminWeeklyReport />}
          {tab === "banned" && <AdminBanned />}
          {tab === "notice" && <AdminNotice />}
          {tab === "economy" && <AdminEconomy />}
          {tab === "gacha" && <AdminGacha />}
          {tab === "config" && <AdminConfig />}
          {tab === "logs" && <AdminLogs />}
        </div>
      </main>
    </div>
  );
}
