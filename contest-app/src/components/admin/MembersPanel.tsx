"use client";

// 관리자: 멤버(아티스트) 계정 관리 — 하트·멤버 댓글 권한의 원천.
// 개발 기간: 테스트 신원 id 등록(/api/stage/me의 '내 식별자' 활용). W4: SSO 멤버 계정 id로 재등록(전체 초기화).
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import { Btn, Card, Empty, Label, inputCls, useConfirm } from "./ui";

type MemberRow = { user_id: string; display_name: string; avatar_url: string | null; created_at: string };

export default function MembersPanel() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [myId, setMyId] = useState("");
  const [form, setForm] = useState({ user_id: "", display_name: "", avatar_url: "" });
  const [busy, setBusy] = useState(false);
  const { confirm, confirmEl } = useConfirm();

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
      toast.success("등록했어요.");
      setForm({ user_id: "", display_name: "", avatar_url: "" });
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "등록 실패");
    }
  }

  async function remove(userId: string, displayName: string) {
    if (!(await confirm({ title: "멤버 삭제", body: `'${displayName}'님을 멤버에서 해제할까요? 하트 표시도 함께 사라져요.`, confirmLabel: "해제", danger: true }))) return;
    const res = await adminFetch(`/api/admin/members?user_id=${encodeURIComponent(userId)}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("해제했어요.");
      void load();
    } else {
      toast.error("해제 실패");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-muted">
        멤버로 등록된 신원만 멤버 하트·멤버 댓글 권한을 가져요. 개발 기간엔 테스트용 신원을 등록하고, 계정연동 시 전면 재등록해요.
      </p>

      {/* 내 식별자 (개발 편의) */}
      {myId && (
        <Card className="flex items-center gap-2 p-3">
          <span className="shrink-0 text-[11.5px] font-bold text-muted">내 식별자</span>
          <code className="min-w-0 flex-1 truncate rounded-lg bg-surface-2 px-2 py-1 font-mono text-[11px] text-subtle">{myId}</code>
          <Btn
            size="sm"
            variant="ghost"
            aria-label="복사"
            onClick={() => {
              void navigator.clipboard.writeText(myId);
              toast.success("복사했어요.");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Btn>
        </Card>
      )}

      {/* 등록 폼 */}
      <Card className="space-y-3 p-4">
        <div>
          <Label>신원 식별자</Label>
          <input
            value={form.user_id}
            onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            placeholder="신원 식별자"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>표시 이름</Label>
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="예: 주연"
              maxLength={30}
              className={inputCls}
            />
          </div>
          <div>
            <Label>아바타 URL (선택)</Label>
            <input
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="아바타 URL"
              className={inputCls}
            />
          </div>
        </div>
        <Btn variant="primary" className="w-full py-3" disabled={busy || !form.user_id.trim() || !form.display_name.trim()} onClick={save}>
          <Plus className="h-4 w-4" /> 멤버 등록
        </Btn>
      </Card>

      {/* 목록 */}
      {members.length === 0 ? (
        <Empty>등록된 멤버가 없어요.</Empty>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <Card key={m.user_id} className="flex items-center gap-3 p-3">
              {m.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[14px] font-bold text-primary-strong">
                  {m.display_name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-fg">{m.display_name}</div>
                <div className="mt-0.5 w-fit max-w-full truncate rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-subtle">
                  {m.user_id}
                </div>
              </div>
              <Btn size="sm" variant="danger" aria-label="해제" onClick={() => void remove(m.user_id, m.display_name)}>
                <Trash2 className="h-4 w-4" />
              </Btn>
            </Card>
          ))}
        </div>
      )}
      {confirmEl}
    </div>
  );
}
