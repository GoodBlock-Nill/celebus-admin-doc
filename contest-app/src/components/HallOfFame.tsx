"use client";

// 명예의 전당 — 멤버 하트를 받은 영상 모음 (전 스테이지 통합).
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { CharmIcon } from "./CharmIcon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import type { MemberHeartPublic, StagePostPublic } from "@/lib/types";
import StageCard from "./StageCard";
import { useLang } from "./LangProvider";

export default function HallOfFame() {
  const { t } = useLang();
  const router = useRouter();
  const [posts, setPosts] = useState<StagePostPublic[]>([]);
  const [hearts, setHearts] = useState<Map<string, MemberHeartPublic[]>>(new Map());
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [membersTotal, setMembersTotal] = useState(0);
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
              hearts={hearts.get(p.id) ?? []}
              grandSlam={membersTotal > 0 && (hearts.get(p.id)?.length ?? 0) >= membersTotal}
              onOpen={() => router.push(`/video/${p.id}?list=hearts`)}
              onToggleLike={() => void toggleLike(p)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
