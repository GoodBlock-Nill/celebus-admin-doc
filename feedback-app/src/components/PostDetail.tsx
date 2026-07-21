"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Heart, Siren, Pencil, Trash2, ImageDown, Share2, Languages } from "lucide-react";
import { format } from "date-fns";
import { sb } from "@/lib/supabase-browser";
import { getDeviceId, getLiked, addLiked } from "@/lib/client-util";
import type { PostPublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import TargetBadge from "./TargetBadge";
import CategoryBadge from "./CategoryBadge";
import { PostBadges, OfficialReply } from "./Badges";
import PostEditor from "./PostEditor";
import ShareModal from "./ShareModal";
import CommentSection from "./comments/CommentSection";
import { VerifyModal, DeleteModal, CardModal } from "./Modals";

type Modal =
  | { type: "verify" | "delete" | "card" | "share" }
  | { type: "edit"; password: string }
  | null;

export default function PostDetail({ id }: { id: string }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [post, setPost] = useState<PostPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [translated, setTranslated] = useState<{ title: string; body: string } | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [translating, setTranslating] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from("posts_public").select("*").eq("id", id).maybeSingle();
    setPost((data as PostPublic) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setLiked(getLiked().has(id));
    void load();
    // 서버(쿠키 신원) 기준 좋아요 여부 동기화 — localStorage 불일치로 인한 오작동 방지
    (async () => {
      try {
        const res = await fetch("/api/posts/liked-status", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: [id] }),
        });
        const data = await res.json();
        if (Array.isArray(data.liked) && data.liked.includes(id)) setLiked(true);
      } catch {
        /* 실패 시 localStorage 기준 유지 */
      }
    })();
  }, [id, load]);

  async function like() {
    if (!post || liked) return;
    setPost({ ...post, like_count: post.like_count + 1 });
    setLiked(true);
    addLiked(post.id);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voter: getDeviceId() }),
      });
      const data = await res.json();
      if (res.ok && typeof data.like_count === "number") setPost((p) => (p ? { ...p, like_count: data.like_count } : p));
    } catch {
      /* keep optimistic */
    }
  }

  async function report() {
    try {
      await fetch(`/api/posts/${id}/report`, { method: "POST" });
      toast.success(t("report_done"));
    } catch {
      toast.error(t("report_fail"));
    }
  }

  async function translate() {
    if (!post || translating) return;
    if (translated) {
      setShowTranslated((v) => !v);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/translate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? t("report_fail"));
        return;
      }
      setTranslated({ title: data.title, body: data.body });
      setShowTranslated(true);
    } catch {
      toast.error(t("report_fail"));
    } finally {
      setTranslating(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-muted">{t("loading")}</main>;
  }
  if (!post) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t("detail_notfound")}</p>
        <button onClick={() => router.push("/")} className="mt-4 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted hover:text-fg">
          {t("detail_back")}
        </button>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <button onClick={() => router.push("/")} className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> {t("detail_back")}
        </button>

        <div className="mb-2 flex items-center gap-2">
          <CategoryBadge category={post.category} />
          <TargetBadge target={post.target} />
          <span className="text-sm font-bold">{post.nickname}</span>
          {post.edited && <span className="text-[10px] text-muted">({t("edited")})</span>}
          <span className="ml-auto text-[12px] text-muted">{format(new Date(post.created_at), "yyyy.MM.dd HH:mm")}</span>
        </div>

        {(post.curated || post.pinned || post.impl_status !== "none") && (
          <div className="mb-2">
            <PostBadges post={post} />
          </div>
        )}
        {(() => {
          const view = showTranslated && translated ? translated : { title: post.title, body: post.body };
          return (
            <>
              <h1 className="text-[22px] font-black leading-snug">{view.title || view.body}</h1>
              <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-fg/90">{view.body}</p>
              {showTranslated && translated && (
                <p className="mt-1.5 text-[11px] text-muted">🌐 {t("translate")} · Claude</p>
              )}
            </>
          );
        })()}

        <OfficialReply reply={post.official_reply} />

        {/* 액션 */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <button
            onClick={like}
            disabled={liked}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${liked ? "bg-accent/15 text-accent" : "bg-card text-muted hover:text-fg"}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {post.like_count}
          </button>
          <button
            onClick={translate}
            disabled={translating}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold disabled:opacity-60 ${
              showTranslated ? "bg-primary/15 text-primary-400" : "bg-card text-muted hover:text-fg"
            }`}
          >
            <Languages className="h-4 w-4" /> {translating ? t("translating") : showTranslated ? t("show_original") : t("translate")}
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setModal({ type: "share" })} aria-label={t("share")} title={t("share")} className="rounded-full bg-card p-2 text-muted hover:text-fg">
              <Share2 className="h-4 w-4" />
            </button>
            <button onClick={report} aria-label={t("report")} title={t("report")} className="rounded-full bg-card p-2 text-muted hover:text-danger">
              <Siren className="h-4 w-4" />
            </button>
            <button onClick={() => setModal({ type: "verify" })} aria-label={t("edit")} title={t("edit")} className="rounded-full bg-card p-2 text-muted hover:text-fg">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setModal({ type: "delete" })} aria-label={t("del")} title={t("del")} className="rounded-full bg-card p-2 text-muted hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={() => setModal({ type: "card" })} aria-label={t("saveImage")} title={t("saveImage")} className="rounded-full bg-card p-2 text-muted hover:text-fg">
              <ImageDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 댓글 */}
        <CommentSection postId={post.id} />
      </main>

      {modal?.type === "verify" && (
        <VerifyModal post={post} onClose={() => setModal(null)} onVerified={(password) => setModal({ type: "edit", password })} />
      )}
      {modal?.type === "edit" && (
        <PostEditor
          mode="edit"
          post={post}
          password={modal.password}
          onClose={() => setModal(null)}
          onDone={(updated) => {
            setPost(updated);
            setModal(null);
          }}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          post={post}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            router.push("/");
          }}
        />
      )}
      {modal?.type === "card" && <CardModal post={post} onClose={() => setModal(null)} />}
      {modal?.type === "share" && <ShareModal post={post} onClose={() => setModal(null)} />}
    </>
  );
}
