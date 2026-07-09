"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Link2, Share2 } from "lucide-react";
import type { PostPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

// 브랜드 로고 (lucide 미포함 → 인라인 SVG)
function XLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function ThreadsLogo() {
  return (
    <svg viewBox="0 0 192 192" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M141.537 88.988c-.62-.297-1.25-.583-1.89-.858-1.114-20.526-12.33-32.28-31.16-32.4h-.255c-11.27 0-20.64 4.811-26.409 13.569l10.363 7.111c4.309-6.542 11.073-7.94 15.646-7.94h.17c5.696.036 9.996 1.692 12.78 4.921 2.026 2.35 3.381 5.598 4.05 9.7-5.04-.856-10.49-1.12-16.32-.788-16.42.945-26.977 10.522-26.268 23.83.36 6.753 3.726 12.564 9.477 16.363 4.86 3.21 11.12 4.78 17.62 4.425 8.586-.47 15.32-3.745 20.02-9.73 3.57-4.544 5.83-10.435 6.83-17.86 4.104 2.478 7.145 5.739 8.827 9.658 2.86 6.663 3.026 17.61-5.906 26.532-7.821 7.816-17.226 11.19-31.443 11.294-15.771-.116-27.699-5.171-35.459-15.026-7.27-9.234-11.024-22.579-11.161-39.649.137-17.07 3.891-30.415 11.161-39.649 7.76-9.855 19.688-14.91 35.459-15.026 15.865.117 28 5.194 36.058 15.09 3.951 4.858 6.934 10.966 8.9 18.083l12.152-3.242c-2.382-8.76-6.135-16.312-11.25-22.602-10.325-12.688-25.427-19.189-44.907-19.324h-.085c-19.441.135-34.373 6.661-44.383 19.398C24.792 63.542 20.049 79.892 20 100.048v.1c.049 20.156 4.792 36.506 14.076 48.288 10.01 12.737 24.942 19.263 44.383 19.398h.085c17.264-.12 29.428-4.66 39.442-14.658 13.093-13.075 12.678-29.451 8.06-40.26-3.31-7.755-9.626-14.055-18.272-18.226z" />
    </svg>
  );
}

export default function ShareModal({ post, onClose }: { post: PostPublic; onClose: () => void }) {
  const { t } = useLang();
  const [canNative, setCanNative] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/post/${post.id}` : "";
  const label = post.title || post.body.slice(0, 60);
  const text = `${label} | CELEBUS FanVoice`;

  useEffect(() => {
    setCanNative(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const openWin = (u: string) => window.open(u, "_blank", "noopener,noreferrer");

  const shareX = () => openWin(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
  const shareThreads = () => openWin(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("toast_link"));
    } catch {
      /* 클립보드 접근 불가(비보안 컨텍스트 등) — 무시 */
    }
  }
  async function nativeShare() {
    try {
      await navigator.share({ title: "CELEBUS FanVoice", text, url });
    } catch {
      /* 사용자가 취소 */
    }
  }

  const items = [
    { key: "x", label: "X", node: <XLogo />, cls: "bg-black text-white", fn: shareX },
    { key: "threads", label: "Threads", node: <ThreadsLogo />, cls: "bg-black text-white", fn: shareThreads },
    { key: "copy", label: t("share_copylink"), node: <Link2 className="h-5 w-5" />, cls: "bg-card-2 text-fg", fn: copyLink },
    ...(canNative ? [{ key: "more", label: t("share_more"), node: <Share2 className="h-5 w-5" />, cls: "bg-card-2 text-fg", fn: nativeShare }] : []),
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold">{t("share_title")}</h3>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 truncate text-[13px] text-muted">{label}</p>

        <div className="grid grid-cols-4 gap-2">
          {items.map((it) => (
            <button key={it.key} onClick={it.fn} className="flex flex-col items-center gap-1.5">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${it.cls} transition-transform active:scale-90`}>{it.node}</span>
              <span className="text-[11px] font-semibold text-muted">{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
