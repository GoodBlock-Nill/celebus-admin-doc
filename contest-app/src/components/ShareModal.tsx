"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Link2, Share2 } from "lucide-react";
import { useLang } from "./LangProvider";
import { XLogo, ThreadsLogo } from "./PlatformBadge";

export default function ShareModal({
  path,
  label,
  title,
  shareText,
  onClose,
}: {
  path: string; // 예: /entry/{id}
  label: string;
  title?: string; // 시트 제목 (기본: 출품작 응원)
  shareText?: string; // 공유 문구 (기본: 출품작 투표)
  onClose: () => void;
}) {
  const { t } = useLang();
  const [canNative, setCanNative] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : "";
  const text = `${label} — ${shareText ?? t("share_text")} | CELEBUS MOMENT`;

  useEffect(() => {
    setCanNative(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  // Escape 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openWin = (u: string) => window.open(u, "_blank", "noopener,noreferrer");
  const shareX = () =>
    openWin(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
  const shareThreads = () =>
    openWin(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  }
  async function nativeShare() {
    try {
      await navigator.share({ title: "CELEBUS MOMENT", text, url });
    } catch {
      /* 사용자가 취소 */
    }
  }

  const items = [
    { key: "x", label: "X", node: <XLogo className="h-5 w-5" />, cls: "bg-black text-white", fn: shareX },
    { key: "threads", label: "Threads", node: <ThreadsLogo className="h-5 w-5" />, cls: "bg-black text-white", fn: shareThreads },
    { key: "copy", label: t("share_copy"), node: <Link2 className="h-5 w-5" />, cls: "bg-card-2 text-fg", fn: copyLink },
    ...(canNative
      ? [{ key: "more", label: t("share"), node: <Share2 className="h-5 w-5" />, cls: "bg-card-2 text-fg", fn: nativeShare }]
      : []),
  ];

  return (
    <div
      className="anim-backdrop-in fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? t("share_title")}
        className="anim-sheet-up w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold">{title ?? t("share_title")}</h3>
          <button onClick={onClose} aria-label={t("close")} className="-m-2 rounded-full p-2 text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 truncate text-[13px] text-muted">{label}</p>

        <div className="grid grid-cols-4 gap-2">
          {items.map((it) => (
            <button key={it.key} onClick={it.fn} className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${it.cls} transition-transform active:scale-90`}
              >
                {it.node}
              </span>
              <span className="text-[11px] font-semibold text-muted">{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
