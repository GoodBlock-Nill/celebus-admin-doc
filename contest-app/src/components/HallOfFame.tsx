"use client";

// 팬 인기 영상 — 팬 좋아요를 가장 많이 받은 영상 모음 (전 스테이지 통합).
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { CharmIcon } from "./CharmIcon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import type { StagePostPublic } from "@/lib/types";
import StageCard from "./StageCard";
import { useLang } from "./LangProvider";

export default function HallOfFame() {
  const { t } = useLang();
  const router = useRouter();
  const [posts, setPosts] = useState<StagePostPublic[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // 팬 좋아요 순 상위 영상 — 좋아요가 1개 이상인 것만 (없으면 빈 상태)
    const { data: ps } = await sb
      .from("stage_posts_public")
      .select("*")
      .order("like_count", { ascending: false })
      .limit(50);
    const ranked = ((ps ?? []) as StagePostPublic[]).filter((p) => p.like_count > 0);
    setPosts(ranked);
    const ids = ranked.map((p) => p.id);
    if (ids.length) {
      try {
        const res = await fetch(`/api/stage/mine?liked_for=${ids.join(",")}`);
        const j = await res.json();
        setLiked(new Set<string>(j.liked ?? []));
      } catch {
        /* 보조 정보 */
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleLike(post: StagePostPublic) {
    try {
      const res = await fetch(`/api/stage/posts/${post.id}/like`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) return toast(t("err_server"));
      setLiked((prev) => {
        const n = new Set(prev);
        if (j.liked) n.add(post.id);
        else n.delete(post.id);
        return n;
      });
      const apply = (p: StagePostPublic) => (p.id === post.id ? { ...p, like_count: j.like_count as number } : p);
      setPosts((prev) => prev.map(apply));
    } catch {
      toast(t("err_server"));
    }
  }

  return (
    <div>
      <Link href="/" className="mb-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-muted">
        <ChevronLeft className="h-4 w-4" /> {t("stage_tab")}
      </Link>
      <div className="mb-4 flex items-center gap-2">
        <CharmIcon name="trophy" size={28} />
        <div>
          <h1 className="text-[19px] font-bold text-fg">{t("hall_title")}</h1>
          <p className="text-[12.5px] text-muted">{t("hall_sub")}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl border border-border bg-card-2" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center text-[13.5px] text-muted">{t("hall_empty")}</div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {posts.map((p) => (
            <StageCard
              key={p.id}
              post={p}
              liked={liked.has(p.id)}
              onOpen={() => router.push(`/video/${p.id}?list=hearts`)}
              onToggleLike={() => void toggleLike(p)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
