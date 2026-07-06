"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Flame, Clock, PenLine, ArrowUpRight, Search, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import { getDeviceId, getLiked, addLiked } from "@/lib/client-util";
import type { PostPublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import PostCard from "./PostCard";
import PostEditor from "./PostEditor";
import RewardsSection from "./RewardsSection";
import { VerifyModal, DeleteModal, CardModal } from "./Modals";

const PAGE = 10;
type Modal =
  | { type: "verify" | "delete" | "card"; post: PostPublic }
  | { type: "edit"; post: PostPublic; password: string }
  | null;

export default function Board() {
  const { t } = useLang();
  const [top, setTop] = useState<PostPublic[]>([]);
  const [curated, setCurated] = useState<PostPublic[]>([]);
  const [midTab, setMidTab] = useState<"popular" | "curated">("popular");
  const [latest, setLatest] = useState<PostPublic[]>([]);
  const [latestCount, setLatestCount] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  // 인기: 좋아요 2개 이상만
  const fetchTop = useCallback(async () => {
    const { data } = await sb
      .from("posts_public")
      .select("*")
      .gte("like_count", 2)
      .order("pinned", { ascending: false })
      .order("like_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);
    setTop((data as PostPublic[]) ?? []);
  }, []);

  // 채택된 글 모아보기
  const fetchCurated = useCallback(async () => {
    const { data } = await sb
      .from("posts_public")
      .select("*")
      .eq("curated", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);
    setCurated((data as PostPublic[]) ?? []);
  }, []);

  const fetchLatest = useCallback(async (p: number, query: string) => {
    let req = sb
      .from("posts_public")
      .select("*", { count: "exact" })
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    const safe = query.trim().replace(/[%,()\\]/g, "").slice(0, 50);
    if (safe) req = req.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
    const { data, count } = await req.range(p * PAGE, p * PAGE + PAGE - 1);
    setLatest((data as PostPublic[]) ?? []);
    setLatestCount(count ?? 0);
  }, []);

  useEffect(() => {
    setLiked(getLiked());
    void fetchTop();
    void fetchCurated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색어 디바운스 → 1페이지로
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => {
    setPage(0);
  }, [debouncedQ]);
  useEffect(() => {
    void fetchLatest(page, debouncedQ).finally(() => setLoading(false));
  }, [page, debouncedQ, fetchLatest]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchTop(), fetchCurated(), fetchLatest(page, debouncedQ)]);
  }, [fetchTop, fetchCurated, fetchLatest, page, debouncedQ]);

  const afterSave = useCallback(
    (post: PostPublic) => {
      setModal({ type: "card", post });
      void refresh();
    },
    [refresh],
  );

  async function handleLike(post: PostPublic) {
    if (liked.has(post.id)) return;
    const bump = (arr: PostPublic[]) => arr.map((p) => (p.id === post.id ? { ...p, like_count: p.like_count + 1 } : p));
    setTop(bump);
    setCurated(bump);
    setLatest(bump);
    addLiked(post.id);
    setLiked((s) => new Set(s).add(post.id));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voter: getDeviceId() }),
      });
      const data = await res.json();
      if (res.ok && typeof data.like_count === "number") {
        const set = (arr: PostPublic[]) => arr.map((p) => (p.id === post.id ? { ...p, like_count: data.like_count } : p));
        setTop(set);
        setCurated(set);
        setLatest(set);
      }
    } catch {
      /* 낙관적 유지 */
    }
  }

  async function handleReport(post: PostPublic) {
    try {
      await fetch(`/api/posts/${post.id}/report`, { method: "POST" });
      toast.success(t("report_done"));
    } catch {
      toast.error(t("report_fail"));
    }
  }

  const cardProps = (p: PostPublic, rank?: number) => ({
    post: p,
    rank,
    liked: liked.has(p.id),
    onLike: handleLike,
    onReport: handleReport,
    onEdit: (post: PostPublic) => setModal({ type: "verify", post }),
    onDelete: (post: PostPublic) => setModal({ type: "delete", post }),
    onSaveImage: (post: PostPublic) => setModal({ type: "card", post }),
  });

  const totalPages = Math.max(1, Math.ceil(latestCount / PAGE));
  const pageWindow = Array.from({ length: totalPages }, (_, i) => i).filter((i) => Math.abs(i - page) <= 2);

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-5">
        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-6">
          <h2 className="text-[22px] font-black leading-snug">{t("hero_title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("hero_sub")}</p>
          <button
            onClick={() => setComposeOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform active:scale-95"
          >
            <PenLine className="h-4 w-4" /> {t("compose_cta")}
          </button>
        </section>

        {/* 🏆 보상 발표 */}
        <RewardsSection />

        {/* 인기 / 채택 탭 */}
        <section className="mt-8">
          <div className="mb-3 flex gap-1 rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setMidTab("popular")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors ${
                midTab === "popular" ? "bg-primary text-white" : "text-muted hover:text-fg"
              }`}
            >
              <Flame className="h-4 w-4" /> {t("sec_popular")}
            </button>
            <button
              onClick={() => setMidTab("curated")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors ${
                midTab === "curated" ? "bg-primary text-white" : "text-muted hover:text-fg"
              }`}
            >
              <Star className="h-4 w-4" /> {t("sec_curated")}
            </button>
          </div>

          {midTab === "popular" ? (
            top.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
                {loading ? t("loading") : t("empty_popular")}
              </p>
            ) : (
              <div className="grid gap-3">
                {top.map((p, i) => (
                  <PostCard key={p.id} {...cardProps(p, i)} />
                ))}
              </div>
            )
          ) : curated.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
              {loading ? t("loading") : t("empty_curated")}
            </p>
          ) : (
            <div className="grid gap-3">
              {curated.map((p) => (
                <PostCard key={p.id} {...cardProps(p)} />
              ))}
            </div>
          )}
        </section>

        {/* 최신 + 검색 + 페이지네이션 */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex shrink-0 items-center gap-1.5 text-[15px] font-bold">
              <Clock className="h-4 w-4 text-primary-400" /> {t("sec_recent")}
            </h2>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search_ph")}
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted"
              />
            </div>
          </div>

          {latest.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
              {loading ? t("loading") : debouncedQ ? t("no_result") : t("empty_recent")}
            </p>
          ) : (
            <div className="grid gap-3">
              {latest.map((p) => (
                <PostCard key={p.id} {...cardProps(p)} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted disabled:opacity-30"
                aria-label={t("page_prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageWindow[0] > 0 && <span className="px-1 text-xs text-muted">…</span>}
              {pageWindow.map((i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold ${
                    i === page ? "bg-primary text-white" : "border border-border bg-card text-muted hover:text-fg"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className="px-1 text-xs text-muted">…</span>}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted disabled:opacity-30"
                aria-label={t("page_next")}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        {/* 푸터 */}
        <footer className="mt-12 flex justify-center border-t border-border/50 pt-6">
          <a
            href="https://app.celebus.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-fg"
          >
            {t("footer_app")} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </footer>
      </main>

      {/* FAB */}
      <button
        onClick={() => setComposeOpen(true)}
        aria-label={t("compose_cta")}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-xl shadow-primary/40 transition-transform active:scale-90"
      >
        <PenLine className="h-6 w-6" />
      </button>

      {composeOpen && <PostEditor mode="create" onClose={() => setComposeOpen(false)} onDone={afterSave} />}
      {modal?.type === "verify" && (
        <VerifyModal
          post={modal.post}
          onClose={() => setModal(null)}
          onVerified={(password) => setModal({ type: "edit", post: modal.post, password })}
        />
      )}
      {modal?.type === "edit" && (
        <PostEditor
          mode="edit"
          post={modal.post}
          password={modal.password}
          onClose={() => setModal(null)}
          onDone={(updated) => afterSave(updated)}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          post={modal.post}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            void refresh();
          }}
        />
      )}
      {modal?.type === "card" && <CardModal post={modal.post} onClose={() => setModal(null)} />}
    </>
  );
}
