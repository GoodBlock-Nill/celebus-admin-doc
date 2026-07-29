"use client";

// 영상 상세 — 딥링크 가능한 라우트(/video/[id]). 기존 모달을 공유 가능한 전체 화면으로 전환(Wave 9).
// 임베드 + 멤버 하트 라인 + 팬 좋아요 + 자랑 + 댓글 + 신고. 데이터·핸들러를 자체 보유.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Heart, Flag, ExternalLink } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { MemberHeartPublic, StagePostPublic } from "@/lib/types";
import { stagePostAsEntry } from "@/lib/types";
import EntryEmbed from "./EntryEmbed";
import PlatformBadge from "./PlatformBadge";
import CommentSection from "./CommentSection";
import BragButton from "./BragButton";
import { MemberHeartsLine } from "./MemberHearts";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";

export default function VideoDetail({ postId }: { postId: string }) {
  const { t } = useLang();
  const { requireLogin, member } = useSession();
  const isMemberMe = !!member;
  const router = useRouter();
  const focus = useSearchParams().get("focus"); // 알림 딥링크: heart | comment
  const heartsRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<"heart" | "comment" | null>(null);
  const [post, setPost] = useState<StagePostPublic | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [hearts, setHearts] = useState<MemberHeartPublic[]>([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("stage_posts_public").select("*").eq("id", postId).maybeSingle();
    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setPost(data as StagePostPublic);
    const [{ data: hs }, { data: ms }] = await Promise.all([
      sb.from("member_hearts_public").select("*").eq("post_id", postId),
      sb.from("members_public").select("display_name"),
    ]);
    setHearts((hs ?? []) as MemberHeartPublic[]);
    setMembersTotal((ms ?? []).length);
    try {
      const res = await fetch(`/api/stage/mine?liked_for=${postId}`);
      const j = await res.json();
      setLiked((j.liked ?? []).includes(postId));
    } catch {
      /* 하트 상태는 보조 정보 */
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 알림 딥링크 — 로드 후 해당 반응/댓글 위치로 스크롤 + 잠깐 강조
  useEffect(() => {
    if (loading || !post || !focus) return;
    const target = focus === "comment" ? commentsRef.current : heartsRef.current;
    if (!target) return;
    const id = setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(focus === "comment" ? "comment" : "heart");
      setTimeout(() => setHighlight(null), 1800);
    }, 350);
    return () => clearTimeout(id);
  }, [loading, post, focus]);

  async function toggleLike() {
    if (!requireLogin(() => toggleLike()) || !post) return;
    try {
      const res = await fetch(`/api/stage/posts/${post.id}/like`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) return void toast(t("err_server"));
      setLiked(!!j.liked);
      setPost((p) => (p ? { ...p, like_count: j.like_count as number } : p));
    } catch {
      toast(t("err_server"));
    }
  }

  async function toggleMemberHeart() {
    if (!requireLogin(() => toggleMemberHeart()) || !post) return;
    const res = await fetch(`/api/stage/posts/${post.id}/member-heart`, { method: "POST" }).catch(() => null);
    if (res?.ok) {
      const { data } = await sb.from("member_hearts_public").select("*").eq("post_id", post.id);
      setHearts((data ?? []) as MemberHeartPublic[]);
    } else {
      toast(t("err_server"));
    }
  }

  async function report() {
    if (reporting || !post) return;
    if (!requireLogin(() => report())) return;
    setReporting(true);
    try {
      const res = await fetch(`/api/stage/posts/${post.id}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await res.json().catch(() => ({}));
      toast(res.ok ? t("stage_reported") : j.code === "already" ? t("stage_reported") : t("err_server"));
    } catch {
      toast(t("err_server"));
    }
    setReporting(false);
  }

  const grandSlam = membersTotal > 0 && hearts.length >= membersTotal;

  const back = (
    <button onClick={() => router.back()} className="mb-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-muted">
      <ChevronLeft className="h-4 w-4" /> {t("nav_back")}
    </button>
  );

  if (notFound) {
    return (
      <div>
        {back}
        <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center">
          <p className="text-[13.5px] text-muted">{t("video_not_found")}</p>
          <Link href="/stages" className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2 text-[13px] font-bold text-white active:scale-95">
            {t("video_browse_cta")}
          </Link>
        </div>
      </div>
    );
  }
  if (loading || !post) {
    return (
      <div>
        {back}
        <div className="aspect-video animate-pulse rounded-2xl bg-black/[0.05]" />
        <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-black/[0.05]" />
      </div>
    );
  }

  return (
    <div>
      {back}
      <div className="mb-3">
        <PlatformBadge platform={post.platform} />
      </div>

      {/* 미디어 — 영상은 어두운 배경, 주변 chrome은 라이트 */}
      <div className="overflow-hidden rounded-2xl bg-black">
        <EntryEmbed entry={stagePostAsEntry(post)} />
      </div>

      {/* 멤버 하트 라인 (은은한 브랜드 칩) — 알림 딥링크 시 강조 */}
      {hearts.length > 0 && (
        <div
          ref={heartsRef}
          className={`mt-3 space-y-2 rounded-2xl transition-shadow ${highlight === "heart" ? "shadow-[0_0_0_2px_var(--color-primary)]" : ""}`}
        >
          {grandSlam && (
            <div className="rounded-xl bg-primary-soft px-3 py-2 text-center text-[13px] font-bold text-primary-strong">{t("grandslam")}</div>
          )}
          <MemberHeartsLine hearts={hearts} />
          <BragButton post={post} hearts={hearts} />
        </div>
      )}

      <div className="mt-3">
        <h1 className="text-[16px] font-bold text-fg">{post.title}</h1>
        <div className="text-[12.5px] text-subtle">@{post.handle}</div>
        {post.description && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{post.description}</p>}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={toggleLike}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[14px] font-bold ${
            liked ? "bg-primary-soft text-primary-strong" : "bg-primary text-white"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span className="tabular-nums">{post.like_count}</span>
        </button>
        {isMemberMe && (
          <button onClick={toggleMemberHeart} className="brand-gradient flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold text-white shadow-sm">
            <Heart className="h-4 w-4 fill-current" /> {t("mh_button")}
          </button>
        )}
        <a href={post.source_url} target="_blank" rel="noreferrer noopener" className="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card-2 px-4 py-2.5 text-[13px] font-bold text-muted">
          <ExternalLink className="h-4 w-4" /> {t("stage_open_original")}
        </a>
        <button onClick={report} disabled={reporting} aria-label={t("stage_report")} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card-2 text-subtle disabled:opacity-50">
          <Flag className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={commentsRef}
        className={`rounded-2xl transition-shadow ${highlight === "comment" ? "shadow-[0_0_0_2px_var(--color-primary)]" : ""}`}
      >
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
}
