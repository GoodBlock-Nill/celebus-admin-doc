"use client";

// 유저(팬) 관리 — 앱에 로그인·활동한 일반 유저(stage_users) 조회 + 유저별 영상 콘텐츠 조치(숨김/삭제).
// ※ 아티스트 '멤버'(stage_members)와 구분되는 별도 메뉴.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Film, Eye, EyeOff, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import { Badge, Btn, Card, Empty, SearchInput, useConfirm } from "./ui";

type UserRow = {
  user_id: string;
  celebus_uid: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string;
  upload_count: number;
};
type UserPost = {
  id: string;
  title: string;
  handle: string;
  hidden: boolean;
  is_official: boolean;
  like_count: number;
  view_count: number;
  created_at: string;
  thumbnail_url: string | null;
};

function fmtDate(s: string): string {
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/users");
    const j = await res.json();
    setUsers(j.users ?? []);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return kw ? users.filter((u) => (u.nickname || "").toLowerCase().includes(kw) || u.user_id.toLowerCase().includes(kw)) : users;
  }, [users, q]);

  return (
    <div className="space-y-4">
      <Card className="p-4 text-[12.5px] leading-relaxed text-muted">
        앱에 로그인·활동한 팬 유저예요. 닉네임·가입/최근접속·업로드 수를 확인하고, <b className="text-fg/80">유저별 영상을 숨기거나 삭제</b>할 수 있어요.
        (아티스트 멤버 관리는 <b className="text-fg/80">‘멤버’ 탭</b>이에요.)
      </Card>

      <SearchInput value={q} onChange={setQ} placeholder="닉네임·식별자로 유저 검색" />
      <div className="text-[12px] font-bold text-muted">{q ? `‘${q}’ 검색결과 ${filtered.length.toLocaleString()}명` : `전체 ${users.length.toLocaleString()}명`}</div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>{q ? "검색 결과가 없어요." : "아직 활동한 유저가 없어요."}</Empty>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={u.user_id} className="flex items-center gap-3 p-3">
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatar_url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-black text-white">
                  {(u.nickname || "?").slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold text-fg">{u.nickname || "(닉네임 없음)"}</span>
                  <Badge tone={u.upload_count > 0 ? "primary" : "gray"}>업로드 {u.upload_count}</Badge>
                </div>
                <div className="truncate font-mono text-[11px] text-subtle">{u.user_id}</div>
                <div className="mt-0.5 text-[11px] text-subtle">
                  가입 {fmtDate(u.created_at)} · 최근접속 {fmtDate(u.last_login_at)}
                </div>
              </div>
              <Btn size="sm" variant="outline" onClick={() => setManaging(u)}>
                <Film className="h-3.5 w-3.5" /> 영상 관리
              </Btn>
            </Card>
          ))}
        </div>
      )}

      {managing && <UserPostsModal user={managing} onClose={() => setManaging(null)} />}
    </div>
  );
}

function UserPostsModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [posts, setPosts] = useState<UserPost[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { confirm, confirmEl } = useConfirm();

  const load = useCallback(async () => {
    const res = await adminFetch(`/api/admin/users/${encodeURIComponent(user.user_id)}/posts`);
    const j = await res.json();
    setPosts(j.posts ?? []);
  }, [user.user_id]);
  useEffect(() => {
    void load();
  }, [load]);

  async function toggleHide(p: UserPost) {
    if (busy) return;
    setBusy(p.id);
    const res = await adminFetch(`/api/admin/posts/${p.id}`, { method: "PATCH", body: JSON.stringify({ hidden: !p.hidden }) });
    setBusy(null);
    if (res.ok) {
      toast.success(p.hidden ? "다시 노출했어요." : "숨겼어요.");
      void load();
    } else toast.error("처리 실패");
  }

  async function del(p: UserPost) {
    if (busy) return;
    if (!(await confirm({ title: "영상 삭제", body: `'${p.title}'을(를) 영구 삭제할까요?`, confirmLabel: "삭제", danger: true }))) return;
    setBusy(p.id);
    const res = await adminFetch(`/api/admin/posts/${p.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      toast.success("삭제했어요.");
      void load();
    } else toast.error("삭제 실패");
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-fg">{user.nickname || "유저"}</h3>
            <p className="text-[11.5px] text-subtle">올린 영상 {posts?.length ?? "…"}개</p>
          </div>
          <button onClick={onClose} aria-label="닫기" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-subtle hover:bg-surface-2 hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>

        {posts === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[68px] animate-pulse rounded-xl border border-border bg-surface-1" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Empty>이 유저가 올린 영상이 없어요.</Empty>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className={`flex items-center gap-2.5 rounded-xl border border-border p-3 ${p.hidden ? "bg-surface-2 opacity-70" : "bg-card"}`}>
                <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {p.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-bold text-fg">{p.title}</span>
                    {p.hidden && <Badge tone="amber">숨김</Badge>}
                  </div>
                  <div className="truncate text-[11px] text-subtle">@{p.handle} · ♥ {p.like_count.toLocaleString()} · 조회 {p.view_count.toLocaleString()}</div>
                </div>
                <Btn size="sm" variant="ghost" disabled={busy === p.id} onClick={() => void toggleHide(p)}>
                  {p.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {p.hidden ? "노출" : "숨김"}
                </Btn>
                <Btn size="sm" variant="danger" disabled={busy === p.id} onClick={() => void del(p)}>삭제</Btn>
              </div>
            ))}
          </div>
        )}
        {confirmEl}
      </div>
    </div>
  );
}
