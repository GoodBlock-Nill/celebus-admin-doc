"use client";

// CELEB MATCH 관리 — 내부 운영 도구(한국어 전용). ADMIN_KEY 로그인 → 탭별 운영 기능.
// 대시보드 / 회원(제재·CP) / 리더보드(기록 삭제) / 금칙어 / 경제(가격) / 설정(game_config) / 감사 로그
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { aget } from "@/lib/admin-api";
import { BTN, INPUT } from "@/components/admin/ui";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminMembers from "@/components/admin/AdminMembers";
import AdminBoard from "@/components/admin/AdminBoard";
import AdminBanned from "@/components/admin/AdminBanned";
import AdminEconomy from "@/components/admin/AdminEconomy";
import AdminConfig from "@/components/admin/AdminConfig";
import AdminLogs from "@/components/admin/AdminLogs";

const TABS = [
  { key: "dash", label: "대시보드" },
  { key: "members", label: "회원" },
  { key: "board", label: "리더보드" },
  { key: "banned", label: "금칙어" },
  { key: "economy", label: "경제" },
  { key: "config", label: "설정" },
  { key: "logs", label: "로그" },
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
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col items-center justify-center px-6">
        <ShieldCheck className="h-10 w-10 text-primary-400" />
        <h1 className="mt-3 text-[18px] font-black">CELEB MATCH 관리</h1>
        {authed === "checking" ? (
          <p className="mt-4 text-[12px] text-subtle">세션 확인 중…</p>
        ) : (
          <form onSubmit={login} className="mt-5 flex w-full flex-col gap-2">
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
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col gap-4 px-4 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-[18px] font-black">
          <ShieldCheck className="h-5 w-5 text-primary-400" /> CELEB MATCH 관리
        </h1>
        <span className="text-[11px] text-subtle">internal only</span>
      </header>

      <nav className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold ring-1 transition-colors ${
              tab === t.key ? "bg-primary text-white ring-primary" : "bg-surface-1 text-muted ring-hairline"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "dash" && <AdminDashboard />}
      {tab === "members" && <AdminMembers />}
      {tab === "board" && <AdminBoard />}
      {tab === "banned" && <AdminBanned />}
      {tab === "economy" && <AdminEconomy />}
      {tab === "config" && <AdminConfig />}
      {tab === "logs" && <AdminLogs />}
    </main>
  );
}
