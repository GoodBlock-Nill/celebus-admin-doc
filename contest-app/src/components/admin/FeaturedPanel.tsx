"use client";

// 홈 대표 영상 — 관리자가 홈 히어로로 고정할 영상을 지정/해제. 단일 대표(지정 시 나머지 자동 해제).
// 대표 미지정 시 홈은 자동 로직(멤버 하트 최다 → 최신)으로 히어로를 고른다.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin-types";

type PostRow = {
  id: string;
  title: string;
  handle: string;
  thumbnail_url: string | null;
  featured: boolean;
  is_official: boolean;
  created_at: string;
};

export default function FeaturedPanel() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/posts");
    const j = await res.json();
    setPosts(j.posts ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function setFeatured(id: string, featured: boolean) {
    if (busy) return;
    setBusy(id);
    const res = await adminFetch(`/api/admin/posts/${id}`, { method: "PATCH", body: JSON.stringify({ featured }) });
    setBusy(null);
    if (res.ok) {
      toast(featured ? "홈 대표로 지정했어요." : "대표 지정을 해제했어요.");
      void load();
    } else {
      toast("처리 실패");
    }
  }

  const featured = posts.find((p) => p.featured);

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white/[0.04] p-3.5 text-[12px] leading-relaxed text-fg/60 ring-1 ring-white/10">
        홈 메인(히어로)에 고정할 영상을 지정해요. <b className="text-fg/80">미지정 시</b> 자동(멤버 하트 최다 → 최신)으로 노출됩니다.
        {featured && (
          <div className="mt-2 text-fg/80">
            현재 대표: <b className="text-primary-400">{featured.title}</b>
          </div>
        )}
      </div>

      {posts.map((p) => (
        <div key={p.id} className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${p.featured ? "bg-primary/10 ring-primary/40" : "bg-white/[0.04] ring-white/10"}`}>
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white/8">
            {p.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-bold text-fg">{p.title}</span>
              {p.is_official && <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9.5px] font-bold text-primary-400">공식</span>}
            </div>
            <div className="truncate text-[11px] text-fg/45">@{p.handle}</div>
          </div>
          <button
            onClick={() => void setFeatured(p.id, !p.featured)}
            disabled={busy === p.id}
            className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-bold disabled:opacity-40 ${
              p.featured ? "bg-white/8 text-fg/70" : "bg-primary text-white"
            }`}
          >
            {p.featured ? "해제" : "대표 지정"}
          </button>
        </div>
      ))}
    </div>
  );
}
