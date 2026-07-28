"use client";

// 스테이지(공연) 상세 — 해당 공연의 영상 아카이브. 카테고리 필터 + 업로드 + 하트 + 임베드 상세.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronLeft, CalendarDays } from "lucide-react";
import Link from "next/link";
import { sb } from "@/lib/supabase-browser";
import type { MemberHeartPublic, StageCategory, StagePostPublic, StagePublic } from "@/lib/types";
import { STAGE_CATEGORY_KEYS } from "@/lib/types";
import StageCard from "./StageCard";
import StageDetailModal from "./StageDetailModal";
import StageUploadModal from "./StageUploadModal";
import { useLang } from "./LangProvider";

type Filter = "all" | StageCategory;

export default function StageView({ stageId }: { stageId: string }) {
  const { t } = useLang();
  const [stage, setStage] = useState<StagePublic | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState<StagePostPublic[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState<StagePostPublic | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hearts, setHearts] = useState<Map<string, MemberHeartPublic[]>>(new Map());
  const [isMemberMe, setIsMemberMe] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("stages_public").select("*").eq("id", stageId).maybeSingle();
      if (!data) setNotFound(true);
      else setStage(data as StagePublic);
    })();
    // 내가 멤버인지 (멤버 하트 버튼 노출)
    fetch("/api/stage/me")
      .then((r) => r.json())
      .then((j) => setIsMemberMe(!!j.member))
      .catch(() => {});
  }, [stageId]);

  const loadHearts = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    const { data } = await sb.from("member_hearts_public").select("*").in("post_id", ids);
    const map = new Map<string, MemberHeartPublic[]>();
    for (const h of (data ?? []) as MemberHeartPublic[]) {
      map.set(h.post_id, [...(map.get(h.post_id) ?? []), h]);
    }
    setHearts(map);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from("stage_posts_public").select("*").eq("stage_id", stageId).order("created_at", { ascending: false }).limit(60);
    if (filter !== "all") q = q.eq("category", filter);
    const { data } = await q;
    const rows = (data ?? []) as StagePostPublic[];
    setPosts(rows);
    setLoading(false);
    if (rows.length) {
      void loadHearts(rows.map((r) => r.id));
      try {
        const res = await fetch(`/api/stage/mine?liked_for=${rows.map((r) => r.id).join(",")}`);
        const j = await res.json();
        setLiked(new Set<string>(j.liked ?? []));
      } catch {
        /* 하트 상태는 보조 정보 — 실패 무시 */
      }
    }
  }, [stageId, filter, loadHearts]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleMemberHeart(post: StagePostPublic) {
    try {
      const res = await fetch(`/api/stage/posts/${post.id}/member-heart`, { method: "POST" });
      if (!res.ok) {
        toast(t("err_server"));
        return;
      }
      void loadHearts(posts.map((p) => p.id)); // 하트 표시 갱신
    } catch {
      toast(t("err_server"));
    }
  }

  async function toggleLike(post: StagePostPublic) {
    try {
      const res = await fetch(`/api/stage/posts/${post.id}/like`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        toast(t("err_server"));
        return;
      }
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

  if (notFound) {
    return (
      <div className="rounded-2xl bg-white/[0.04] px-4 py-14 text-center text-[13.5px] text-fg/50 ring-1 ring-white/10">
        {t("stage_not_found")}
      </div>
    );
  }

  const FILTERS: Filter[] = ["all", ...STAGE_CATEGORY_KEYS];

  return (
    <div>
      {/* 스테이지 헤더 */}
      <div className="mb-4">
        <Link href="/" className="mb-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-fg/60">
          <ChevronLeft className="h-4 w-4" /> {t("stage_tab")}
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[19px] font-bold text-fg">{stage?.title ?? "…"}</h1>
            {stage?.description && <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg/55">{stage.description}</p>}
            <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-fg/45">
              {stage?.event_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {stage.event_date}
                </span>
              )}
              {stage && <span>{t("stage_posts_n").replace("{n}", String(stage.post_count))}</span>}
            </div>
          </div>
          {stage?.status === "open" && (
            <button
              onClick={() => setUploading(true)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-white active:scale-95"
            >
              <Plus className="h-4 w-4" /> {t("stage_upload_cta")}
            </button>
          )}
        </div>
        {stage?.status === "archived" && (
          <p className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-[12px] text-fg/50 ring-1 ring-white/10">{t("stage_archived_note")}</p>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-bold ${filter === f ? "bg-primary text-white" : "bg-white/8 text-fg/60"}`}
          >
            {t(f === "all" ? "cat_all" : `cat_${f}`)}
          </button>
        ))}
      </div>

      {/* 피드 */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[16/12] animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.04] px-4 py-14 text-center text-[13.5px] text-fg/50 ring-1 ring-white/10">
          {t("stage_empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {posts.map((p) => (
            <StageCard
              key={p.id}
              post={p}
              liked={liked.has(p.id)}
              hearts={hearts.get(p.id) ?? []}
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
          isMemberMe={isMemberMe}
          onClose={() => setOpenPost(null)}
          onToggleLike={() => void toggleLike(openPost)}
          onToggleMemberHeart={() => void toggleMemberHeart(openPost)}
        />
      )}
      {uploading && <StageUploadModal stageId={stageId} onClose={() => setUploading(false)} onPosted={() => void load()} />}
    </div>
  );
}
