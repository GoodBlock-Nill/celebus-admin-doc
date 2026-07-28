"use client";

// 스테이지 업로드 — 2스텝: 링크 미리보기 → 제목·카테고리 → 게시. (콘테스트 응모와 달리 비번·전화 없음)
import { useState } from "react";
import { toast } from "sonner";
import { X, Link2 } from "lucide-react";
import type { Platform, StageCategory } from "@/lib/types";
import { STAGE_CATEGORY_KEYS } from "@/lib/types";
import PlatformBadge from "./PlatformBadge";
import { useLang } from "./LangProvider";

type Resolved = {
  platform: Platform;
  canonicalUrl: string;
  authorHandle: string | null;
  duplicate: boolean;
  oembed: { thumbnail_url?: string; title?: string } | null;
};

export default function StageUploadModal({ stageId, onClose, onPosted }: { stageId: string; onClose: () => void; onPosted: () => void }) {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState<StageCategory>("fancam");
  const [busy, setBusy] = useState(false);

  async function preview() {
    if (busy || url.trim().length < 8) return;
    setBusy(true);
    try {
      const res = await fetch("/api/stage/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage_id: stageId, url: url.trim() }) });
      const j = await res.json();
      if (!res.ok) {
        toast(t("err_invalid"));
      } else if (j.duplicate) {
        toast(t("err_duplicate"));
      } else {
        setResolved(j);
        if (!title && j.oembed?.title) setTitle(String(j.oembed.title).slice(0, 80));
      }
    } catch {
      toast(t("err_server"));
    }
    setBusy(false);
  }

  async function submit() {
    if (busy || !resolved || !title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/stage/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage_id: stageId,
          url: resolved.canonicalUrl,
          title: title.trim(),
          description: description.trim(),
          category,
          ...(resolved.authorHandle ? {} : { handle: handle.trim() }),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(t("stage_submitted"));
        onPosted();
        onClose();
      } else {
        const code = String(j.code ?? "server");
        const mapped = code === "closed" ? "stage_closed" : code === "not_found" ? "stage_not_found" : code;
        const known = ["duplicate", "rate_capped", "handle_required", "profanity", "invalid", "stage_closed", "stage_not_found"].includes(mapped);
        toast(t(known ? `err_${mapped}` : "err_server"));
      }
    } catch {
      toast(t("err_server"));
    }
    setBusy(false);
  }

  const needHandle = resolved != null && resolved.authorHandle == null;

  return (
    <div className="anim-backdrop-in fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("stage_upload_cta")}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[#141217] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-fg">{t("stage_upload_cta")}</h2>
          <button onClick={onClose} aria-label="닫기" className="flex h-11 w-11 items-center justify-center rounded-full text-fg/60 hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1스텝: 링크 */}
        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/6 px-3 ring-1 ring-white/10 focus-within:ring-primary/60">
            <Link2 className="h-4 w-4 shrink-0 text-fg/40" />
            <input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setResolved(null); }}
              onKeyDown={(e) => e.key === "Enter" && preview()}
              placeholder={t("stage_url_ph")}
              className="min-w-0 flex-1 bg-transparent py-3 text-[13.5px] text-fg outline-none placeholder:text-fg/30"
            />
          </div>
          <button onClick={preview} disabled={busy} className="shrink-0 rounded-xl bg-white/10 px-4 text-[13px] font-bold text-fg disabled:opacity-50">
            {t("stage_preview")}
          </button>
        </div>

        {/* 2스텝: 미리보기 + 상세 */}
        {resolved && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10">
              {resolved.oembed?.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolved.oembed.thumbnail_url} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <PlatformBadge platform={resolved.platform} />
                <div className="mt-1 truncate text-[12px] text-fg/60">{resolved.oembed?.title ?? resolved.canonicalUrl}</div>
              </div>
            </div>

            <label className="block text-[12px] font-bold text-fg/60">
              {t("stage_title_label")}
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t("stage_title_ph")}
                className="mt-1 w-full rounded-xl bg-white/6 px-3 py-3 text-[13.5px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/30" />
            </label>

            <label className="block text-[12px] font-bold text-fg/60">
              {t("stage_desc_label")}
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={2}
                className="mt-1 w-full resize-none rounded-xl bg-white/6 px-3 py-3 text-[13.5px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60" />
            </label>

            {needHandle && (
              <label className="block text-[12px] font-bold text-fg/60">
                {t("stage_handle_label")}
                <input value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={40} placeholder={t("stage_handle_ph")}
                  className="mt-1 w-full rounded-xl bg-white/6 px-3 py-3 text-[13.5px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/30" />
              </label>
            )}

            <div>
              <div className="mb-1 text-[12px] font-bold text-fg/60">{t("stage_category_label")}</div>
              <div className="flex flex-wrap gap-1.5">
                {STAGE_CATEGORY_KEYS.map((c) => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold ${category === c ? "bg-primary text-white" : "bg-white/8 text-fg/60"}`}>
                    {t(`cat_${c}`)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={submit}
              disabled={busy || !title.trim() || (needHandle && !handle.trim())}
              className="w-full rounded-full bg-primary py-3.5 text-[14.5px] font-bold text-white disabled:opacity-40"
            >
              {t("stage_submit")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
