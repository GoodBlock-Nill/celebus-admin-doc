"use client";

// 명예의 전당 — 멤버 하트를 받은 영상 모음 (전 스테이지 통합).
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { sb } from "@/lib/supabase-browser";
import type { MemberHeartPublic, StagePostPublic } from "@/lib/types";
import StageCard from "./StageCard";
import StageDetailModal from "./StageDetailModal";
import { useLang } from "./LangProvider";

export default function HallOfFame() {
  const { t } = useLang();
  const [posts, setPosts] = useState<StagePostPublic[]>([]);
  const [hearts, setHearts] = useState<Map<string, MemberHeartPublic[]>>(new Map());
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [membersTotal, setMembersTotal] = useState(0);
  const [isMemberMe, setIsMemberMe] = useState(false);
  const [openPost, setOpenPost] = useState<StagePostPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: hs } = await sb.from("member_hearts_public").select("*").order("created_at", { ascending: false }).limit(300);
    const heartRows = (hs ?? []) as MemberHeartPublic[];
    const map = new Map<string, MemberHeartPublic[]>();
    for (const h of heartRows) map.set(h.post_id, [...(map.get(h.post_id) ?? []), h]);
    setHearts(map);
    const ids = [...map.keys()];
    if (ids.length) {
      const { data: ps } = await sb.from("stage_posts_public").select("*").in("id", ids);
      // 최근 하트 순 정렬
      const order = new Map(ids.map((id, i) => [id, i]));
      setPosts(((ps ?? []) as StagePostPublic[]).sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)));
      try {
        const res = await fetch(`/api/stage/mine?liked_for=${ids.join(",")}`);
        const j = await res.json();
        setLiked(new Set<string>(j.liked ?? []));
      } catch {
        /* 보조 정보 */
      }
    } else {
      setPosts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    sb.from("members_public").select("display_name").then(({ data }) => setMembersTotal((data ?? []).length));
    fetch("/api/stage/me").then((r) => r.json()).then((j) => setIsMemberMe(!!j.member)).catch(() => {});
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
      setOpenPost((prev) => (prev && prev.id === post.id ? apply(prev) : prev));
    } catch {
      toast(t("err_server"));
    }
  }

  async function toggleMemberHeart(post: StagePostPublic) {
    const res = await fetch(`/api/stage/posts/${post.id}/member-heart`, { method: "POST" }).catch(() => null);
    if (res?.ok) void load();
    else toast(t("err_server"));
  }

  return (
    <div>
      <Link href="/" className="mb-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-fg/60">
        <ChevronLeft className="h-4 w-4" /> {t("stage_tab")}
      </Link>
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary-400" />
        <div>
          <h1 className="text-[19px] font-bold text-fg">{t("hall_title")}</h1>
          <p className="text-[12.5px] text-fg/50">{t("hall_sub")}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[16/12] animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.04] px-4 py-14 text-center text-[13.5px] text-fg/50 ring-1 ring-white/10">{t("hall_empty")}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {posts.map((p) => (
            <StageCard
              key={p.id}
              post={p}
              liked={liked.has(p.id)}
              hearts={hearts.get(p.id) ?? []}
              grandSlam={membersTotal > 0 && (hearts.get(p.id)?.length ?? 0) >= membersTotal}
              onOpen={() => setOpenPost(p)}
              onToggleLike={() => void toggleLike(p)}
            />
          ))}
        </div>
      )}

      {openPost && (
        <StageDetailModal
          post={openPost}
          liked={liked.has(openPost.id)}
          hearts={hearts.get(openPost.id) ?? []}
          grandSlam={membersTotal > 0 && (hearts.get(openPost.id)?.length ?? 0) >= membersTotal}
          isMemberMe={isMemberMe}
          onClose={() => setOpenPost(null)}
          onToggleLike={() => void toggleLike(openPost)}
          onToggleMemberHeart={() => void toggleMemberHeart(openPost)}
        />
      )}
    </div>
  );
}
