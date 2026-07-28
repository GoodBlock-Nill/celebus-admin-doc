"use client";

// 스테이지 상세 — 실제 임베드 재생 + 하트 + 신고 + 원본 링크. (멤버 하트 표시는 W2에서 이 화면에 추가)
import { useState } from "react";
import { toast } from "sonner";
import { X, Heart, Flag, ExternalLink } from "lucide-react";
import type { StagePostPublic } from "@/lib/types";
import { stagePostAsEntry } from "@/lib/types";
import EntryEmbed from "./EntryEmbed";
import PlatformBadge from "./PlatformBadge";
import { useLang } from "./LangProvider";

export default function StageDetailModal({
  post,
  liked,
  onClose,
  onToggleLike,
}: {
  post: StagePostPublic;
  liked: boolean;
  onClose: () => void;
  onToggleLike: () => void;
}) {
  const { t } = useLang();
  const [reporting, setReporting] = useState(false);

  async function report() {
    if (reporting) return;
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

  return (
    <div className="anim-backdrop-in fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={post.title}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[#141217] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <PlatformBadge platform={post.platform} />
          <button onClick={onClose} aria-label="닫기" className="flex h-11 w-11 items-center justify-center rounded-full text-fg/60 hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <EntryEmbed entry={stagePostAsEntry(post)} />

        <div className="mt-3">
          <div className="text-[15px] font-bold text-fg">{post.title}</div>
          <div className="text-[12.5px] text-fg/50">@{post.handle}</div>
          {post.description && <p className="mt-1.5 text-[13px] leading-relaxed text-fg/70">{post.description}</p>}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onToggleLike}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[14px] font-bold ${
              liked ? "bg-primary/20 text-primary-400" : "bg-primary text-white"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            <span className="tabular-nums">{post.like_count}</span>
          </button>
          <a
            href={post.source_url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-white/8 px-4 py-2.5 text-[13px] font-bold text-fg/80"
          >
            <ExternalLink className="h-4 w-4" /> {t("stage_open_original")}
          </a>
          <button
            onClick={report}
            disabled={reporting}
            aria-label={t("stage_report")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-fg/50"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
