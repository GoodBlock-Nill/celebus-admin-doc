"use client";

// 스테이지(공연) 상세 — 해당 공연의 영상 아카이브. 카테고리 필터 + 업로드 + 하트 + 임베드 상세.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronLeft, CalendarDays, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import type { MemberHeartPublic, StageCategory, StagePostPublic, StagePublic } from "@/lib/types";
import { STAGE_CATEGORY_KEYS, OFFICIAL_CATEGORY_KEYS } from "@/lib/types";
import StageCard from "./StageCard";
import StageUploadModal from "./StageUploadModal";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";
import { isLaunchPreview } from "@/lib/launchPreview";

type Filter = "all" | StageCategory;

// hideHeader: 아카이브 탭 등에 임베드할 때 상단 헤더(뒤로가기·제목·배지) 숨김 — 필터+그리드만 노출
export default function StageView({ stageId, hideHeader = false }: { stageId: string; hideHeader?: boolean }) {
  const { t } = useLang();
  const { requireLogin } = useSession();
  const router = useRouter();
  const [stage, setStage] = useState<StagePublic | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState<StagePostPublic[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hearts, setHearts] = useState<Map<string, MemberHeartPublic[]>>(new Map());
  const [membersTotal, setMembersTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("stages_public").select("*").eq("id", stageId).maybeSingle();
      if (!data) setNotFound(true);
      else setStage(data as StagePublic);
    })();
    sb.from("members_public").select("display_name").then(({ data }) => setMembersTotal((data ?? []).length));
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
    if (isLaunchPreview()) q = q.eq("is_official", true); // 배포초기 프리뷰 — 공식만
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

  async function toggleLike(post: StagePostPublic) {
    if (!requireLogin(() => toggleLike(post))) return;
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
    } catch {
      toast(t("err_server"));
    }
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center text-[13.5px] text-muted">
        {t("stage_not_found")}
      </div>
    );
  }

  // 공식 아카이브는 공식(플레이리스트) 카테고리, 팬 아카이브는 팬 카테고리로 필터
  const FILTERS: Filter[] = ["all", ...(stage?.is_official ? OFFICIAL_CATEGORY_KEYS : STAGE_CATEGORY_KEYS)];
  const scopeLabel = t(filter === "all" ? "cat_all" : `cat_${filter}`);

  return (
    <div>
      {/* 스테이지 헤더 (임베드 시 숨김) */}
      {!hideHeader && (
      <div className="mb-1">
        <Link href="/" className="mb-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-muted">
          <ChevronLeft className="h-4 w-4" /> {t("stage_tab")}
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[19px] font-bold leading-tight tracking-tight text-fg">{stage?.title ?? "…"}</h1>
            {stage?.description && <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{stage.description}</p>}
            <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-muted">
              {stage?.event_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {stage.event_date}
                </span>
              )}
              {stage && <span>{t("stage_posts_n").replace("{n}", String(stage.post_count))}</span>}
            </div>
          </div>
          {stage?.status === "open" && !stage.is_official && (
            <button
              onClick={() => requireLogin(() => setUploading(true)) && setUploading(true)}
              className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-primary px-3.5 text-[12px] font-extrabold text-white shadow-sm active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> {t("stage_upload_cta")}
            </button>
          )}
        </div>
        {stage?.is_official && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[#e2d6ff] bg-primary-soft px-3 py-2 text-[12px] font-bold text-primary-strong">
            <BadgeCheck className="h-3.5 w-3.5" /> {t("archive_official")} · {t("archive_view_only")}
          </p>
        )}
        {stage?.status === "archived" && !stage?.is_official && (
          <p className="mt-2 rounded-xl border border-border bg-card-2 px-3 py-2 text-[12px] text-muted">{t("stage_archived_note")}</p>
        )}
      </div>
      )}

      {/* 카테고리 필터 — 브랜드 톤 칩(활성=그라데, 비활성=소프트) */}
      <div className="-mx-4 mb-1 flex gap-2 overflow-x-auto px-4 pb-2 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex h-9 shrink-0 items-center rounded-full px-4 text-[12.5px] font-bold transition-all active:scale-95 ${
              filter === f
                ? "brand-gradient text-white shadow-[0_4px_12px_-3px_rgba(108,77,230,0.55)]"
                : "bg-primary-soft/60 text-primary-strong/70 hover:bg-primary-soft"
            }`}
          >
            {t(f === "all" ? "cat_all" : `cat_${f}`)}
          </button>
        ))}
      </div>

      {/* 현재 범위 · 정렬 기준 (최신순 고정) */}
      {stage && (
        <div className="mb-3 flex items-center gap-2 px-0.5 py-1">
          <span className="min-w-0 truncate text-[11.5px] font-semibold text-subtle">{scopeLabel}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-card-2 px-2.5 py-1 text-[11px] font-bold text-muted">
            {t("tab_latest")}
          </span>
        </div>
      )}

      {/* 피드 */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl border border-border bg-card-2" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center text-[13.5px] text-muted">
          {t("stage_empty")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {posts.map((p) => (
            <StageCard
              key={p.id}
              post={p}
              liked={liked.has(p.id)}
              hearts={hearts.get(p.id) ?? []}
              grandSlam={membersTotal > 0 && (hearts.get(p.id)?.length ?? 0) >= membersTotal}
              onOpen={() => router.push(`/video/${p.id}?list=stage:${stageId}`)}
              onToggleLike={() => void toggleLike(p)}
            />
          ))}
        </div>
      )}

      {uploading && <StageUploadModal stageId={stageId} onClose={() => setUploading(false)} onPosted={() => void load()} />}
    </div>
  );
}
