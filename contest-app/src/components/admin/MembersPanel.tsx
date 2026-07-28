"use client";

// 관리자: 멤버(아티스트) 계정 관리 — 하트·멤버 댓글 권한의 원천.
// 개발 기간: 테스트 신원 id 등록(/api/stage/me의 '내 식별자' 활용). W4: SSO 멤버 계정 id로 재등록(전체 초기화).
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";

type MemberRow = { user_id: string; display_name: string; avatar_url: string | null; created_at: string };

export default function MembersPanel() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [myId, setMyId] = useState("");
  const [form, setForm] = useState({ user_id: "", display_name: "", avatar_url: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/members");
    const j = await res.json();
    setMembers(j.members ?? []);
  }, []);
  useEffect(() => {
    void load();
    fetch("/api/stage/me").then((r) => r.json()).then((j) => setMyId(j.id ?? "")).catch(() => {});
  }, [load]);

  async function save() {
    if (busy || !form.user_id.trim() || !form.display_name.trim()) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/members", {
      method: "POST",
      body: JSON.stringify({
        user_id: form.user_id.trim(),
        display_name: form.display_name.trim(),
        avatar_url: form.avatar_url.trim() || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast("등록했어요.");
      setForm({ user_id: "", display_name: "", avatar_url: "" });
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "등록 실패");
    }
  }

  async function remove(userId: string) {
    if (!confirm("이 멤버를 해제할까요? (해당 멤버의 하트 표시도 함께 사라져요)")) return;
    const res = await adminFetch(`/api/admin/members?user_id=${encodeURIComponent(userId)}`, { method: "DELETE" });
    if (res.ok) {
      toast("해제했어요.");
      void load();
    } else toast("해제 실패");
  }

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-fg/50">
        멤버로 등록된 신원만 멤버 하트·멤버 댓글 권한을 가져요. 개발 기간엔 테스트용 신원을 등록하고, 계정연동 시 전면 재등록해요.
      </p>

      {/* 내 식별자 (개발 편의) */}
      {myId && (
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/10">
          <span className="text-[11.5px] text-fg/45">내 식별자</span>
          <code className="min-w-0 flex-1 truncate text-[11.5px] text-fg/70">{myId}</code>
          <button
            onClick={() => { void navigator.clipboard.writeText(myId); toast("복사했어요."); }}
            aria-label="복사"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-fg/60"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 등록 폼 */}
      <div className="space-y-2 rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
        <input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="신원 식별자"
          className="w-full rounded-xl bg-white/6 px-3 py-2.5 text-[13px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/30" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="표시 이름 (예: 주연)" maxLength={30}
            className="w-full rounded-xl bg-white/6 px-3 py-2.5 text-[13px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/30" />
          <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="아바타 URL (선택)"
            className="w-full rounded-xl bg-white/6 px-3 py-2.5 text-[13px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/30" />
        </div>
        <button onClick={save} disabled={busy || !form.user_id.trim() || !form.display_name.trim()}
          className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-2.5 text-[13px] font-bold text-white disabled:opacity-40">
          <Plus className="h-4 w-4" /> 멤버 등록
        </button>
      </div>

      {/* 목록 */}
      {members.map((m) => (
        <div key={m.user_id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3.5 py-3 ring-1 ring-white/10">
          {m.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 text-[14px] font-bold text-primary-400">
              {m.display_name.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold text-fg">{m.display_name}</div>
            <div className="truncate text-[11px] text-fg/40">{m.user_id}</div>
          </div>
          <button onClick={() => void remove(m.user_id)} aria-label="해제" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/6 text-fg/50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {members.length === 0 && <p className="py-6 text-center text-[13px] text-fg/40">등록된 멤버가 없어요.</p>}
    </div>
  );
}
