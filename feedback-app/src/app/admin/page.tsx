"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, LogOut, LayoutDashboard, FileText, Siren, Gift, ScrollText } from "lucide-react";
import { TABS, type AdminTab } from "@/components/admin/tabs";
import Overview from "@/components/admin/Overview";
import PostsPanel from "@/components/admin/PostsPanel";
import RewardsPanel from "@/components/admin/RewardsPanel";
import LogsPanel from "@/components/admin/LogsPanel";

const ICONS: Record<string, typeof FileText> = { LayoutDashboard, FileText, Siren, Gift, ScrollText };
const STORE_KEY = "fv_admin_pw";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<AdminTab>("overview");

  const headers = useCallback(() => ({ authorization: `Bearer ${pw}`, "content-type": "application/json" }), [pw]);

  // 세션 복원 — 새로고침해도 유지
  useEffect(() => {
    const saved = sessionStorage.getItem(STORE_KEY);
    if (!saved) return setBooting(false);
    (async () => {
      const res = await fetch("/api/admin/stats", { headers: { authorization: `Bearer ${saved}` } });
      if (res.ok) {
        setPw(saved);
        setAuthed(true);
      } else sessionStorage.removeItem(STORE_KEY);
      setBooting(false);
    })();
  }, []);

  async function login() {
    const res = await fetch("/api/admin/stats", { headers: { authorization: `Bearer ${pw}` } });
    if (res.ok) {
      sessionStorage.setItem(STORE_KEY, pw);
      setAuthed(true);
    } else toast.error("비밀번호가 올바르지 않아요.");
  }

  function logout() {
    sessionStorage.removeItem(STORE_KEY);
    setPw("");
    setAuthed(false);
    setTab("overview");
  }

  if (booting) return <main className="grid min-h-dvh place-items-center text-sm text-muted">불러오는 중…</main>;

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
        <div className="mb-6 flex items-center gap-2 text-lg font-black">
          <ShieldCheck className="h-5 w-5 text-primary-400" /> 관리자
        </div>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="관리자 비밀번호"
          className="mb-3 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <button onClick={login} className="rounded-full bg-primary py-2.5 text-sm font-bold text-white">로그인</button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-black">
          <ShieldCheck className="h-5 w-5 text-primary-400" /> FanVoice 관리자
        </h1>
        <button onClick={logout} className="flex items-center gap-1 text-xs text-muted hover:text-fg"><LogOut className="h-3.5 w-3.5" /> 로그아웃</button>
      </div>

      {/* 탭 바 */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = ICONS[t.icon] ?? FileText;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                active ? "bg-primary text-white" : "text-muted hover:text-fg"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <Overview headers={headers} onNavigate={setTab} />}
      {tab === "posts" && <PostsPanel headers={headers} heading="글 관리" />}
      {tab === "moderation" && <PostsPanel headers={headers} fixedStatus="reported" heading="신고함" emptyText="신고된 글이 없어요. 👍" />}
      {tab === "rewards" && <RewardsPanel headers={headers} />}
      {tab === "logs" && <LogsPanel headers={headers} />}
    </main>
  );
}
