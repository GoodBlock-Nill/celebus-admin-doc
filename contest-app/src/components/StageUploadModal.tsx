"use client";

// 스테이지 업로드 — 2스텝: 링크 미리보기 → 제목·카테고리 → 게시. (콘테스트 응모와 달리 비번·전화 없음)
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X, Link2, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
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

// 핸들 정리 — @·공백·URL 제거, 계정 아이디만 남김
function cleanHandle(v: string): string {
  return v.replace(/https?:\/\/\S*/gi, "").replace(/[@\s]/g, "").slice(0, 40);
}

export default function StageUploadModal({ stageId, onClose, onPosted, onBack }: { stageId: string; onClose: () => void; onPosted: () => void; onBack?: () => void }) {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState<StageCategory>("fancam");
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null); // i18n key
  const [agreeOriginal, setAgreeOriginal] = useState(false); // 원작자·정책 동의
  const [agreeOfficial, setAgreeOfficial] = useState(false); // V01D 공식 계정 소개·활용 동의
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function preview() {
    if (previewing || url.trim().length < 8) return;
    setPreviewing(true);
    setPreviewError(null);
    setResolved(null);
    try {
      const res = await fetch("/api/stage/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage_id: stageId, url: url.trim() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPreviewError(j.code === "unsupported" ? "err_invalid" : "err_invalid"); // 지원하지 않는 링크
      } else if (j.duplicate) {
        setPreviewError("err_duplicate");
      } else {
        setResolved(j);
        if (!title && j.oembed?.title) setTitle(String(j.oembed.title).slice(0, 80));
      }
    } catch {
      setPreviewError("err_server");
    }
    setPreviewing(false);
  }

  // 붙여넣기/입력 즉시 미리보기 (디바운스) — URL처럼 보일 때만
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const u = url.trim();
    if (resolved || u.length < 12 || !/^https?:\/\/|\.(com|net|be|tv|app)/i.test(u)) return;
    debounceRef.current = setTimeout(() => void preview(), 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function submit() {
    if (busy || !resolved || !title.trim()) return;
    if (!agreeOriginal || !agreeOfficial) return void toast(t("stage_agree_required"));
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
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          {onBack ? (
            <button onClick={onBack} className="flex min-h-9 items-center gap-1 text-[13px] font-bold text-muted hover:text-fg">
              <ChevronLeft className="h-4 w-4" /> {t("upload_change_stage")}
            </button>
          ) : (
            <h2 className="text-[16px] font-bold text-fg">{t("stage_upload_cta")}</h2>
          )}
          <button onClick={onClose} aria-label="닫기" className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1스텝: 링크 (붙여넣기 즉시 미리보기 · 인라인 오류) */}
        <div className="flex gap-2">
          <div className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-bg px-3 focus-within:ring-2 ${previewError ? "border-danger focus-within:ring-danger" : "border-border focus-within:ring-primary"}`}>
            <Link2 className="h-4 w-4 shrink-0 text-subtle" />
            <input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setResolved(null); setPreviewError(null); }}
              onKeyDown={(e) => e.key === "Enter" && preview()}
              placeholder={t("stage_url_ph")}
              className="min-w-0 flex-1 bg-transparent py-3 text-[13.5px] text-fg outline-none placeholder:text-subtle"
            />
            {previewing && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
          </div>
          <button
            onClick={preview}
            disabled={previewing || url.trim().length < 8}
            className="shrink-0 rounded-xl border border-border bg-card-2 px-4 text-[13px] font-bold text-fg disabled:opacity-50"
          >
            {t("stage_preview")}
          </button>
        </div>
        {previewError && (
          <p className="mt-1.5 flex items-center gap-1.5 px-0.5 text-[12px] font-semibold text-danger">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {t(previewError)}
          </p>
        )}

        {/* 2스텝: 미리보기 + 상세 */}
        {resolved && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card-2 p-2.5">
              {resolved.oembed?.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolved.oembed.thumbnail_url} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-14 w-24 shrink-0 rounded-lg bg-gradient-to-br from-primary-soft to-card-2" />
              )}
              <div className="min-w-0 flex-1">
                <PlatformBadge platform={resolved.platform} />
                <div className="mt-1 truncate text-[12px] text-muted">{resolved.oembed?.title ?? resolved.canonicalUrl}</div>
                {resolved.authorHandle && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
                    <span className="truncate">
                      <span className="font-semibold">{t("stage_source_label")}</span> @{resolved.authorHandle}
                    </span>
                    <span className="shrink-0 rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-primary-strong">{t("stage_source_verified")}</span>
                  </div>
                )}
              </div>
            </div>

            <label className="block text-[12px] font-bold text-muted">
              {t("stage_title_label")}
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t("stage_title_ph")}
                className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-3 text-[13.5px] text-fg outline-none focus:ring-2 focus:ring-primary placeholder:text-subtle" />
            </label>

            <label className="block text-[12px] font-bold text-muted">
              {t("stage_desc_label")}
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-border bg-bg px-3 py-3 text-[13.5px] text-fg outline-none focus:ring-2 focus:ring-primary" />
            </label>

            {needHandle && (
              <label className="block text-[12px] font-bold text-muted">
                {t("stage_handle_label")}
                <div className="mt-1 flex items-center gap-0.5 rounded-xl border border-border bg-bg px-3 focus-within:ring-2 focus-within:ring-primary">
                  <span className="text-[14px] font-bold text-subtle">@</span>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(cleanHandle(e.target.value))}
                    maxLength={40}
                    placeholder={t("stage_handle_ph")}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent py-3 text-[13.5px] text-fg outline-none placeholder:text-subtle"
                  />
                </div>
                <p className="mt-1 text-[11px] font-normal text-subtle">{t("stage_handle_help")}</p>
              </label>
            )}

            <div>
              <div className="mb-1 text-[12px] font-bold text-muted">{t("stage_category_label")}</div>
              <div className="flex flex-wrap gap-1.5">
                {STAGE_CATEGORY_KEYS.map((c) => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold ${category === c ? "bg-primary text-white" : "border border-border bg-bg text-muted"}`}>
                    {t(`cat_${c}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* 업로드 동의 (원작자·정책 / V01D 공식 활용) */}
            <div className="space-y-2 rounded-xl border border-border bg-card-2 p-3">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" checked={agreeOriginal} onChange={(e) => setAgreeOriginal(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                <span className="text-[11.5px] leading-relaxed text-muted break-keep">{t("stage_agree_original")}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" checked={agreeOfficial} onChange={(e) => setAgreeOfficial(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                <span className="text-[11.5px] leading-relaxed text-muted break-keep">{t("stage_agree_official")}</span>
              </label>
            </div>

            <button
              onClick={submit}
              disabled={busy || !title.trim() || (needHandle && !handle.trim()) || !agreeOriginal || !agreeOfficial}
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
