"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { X, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { format } from "date-fns";
import { type PostPublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import TargetBadge from "./TargetBadge";

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- 수정 진입 전 비밀번호 확인 ---------- */
export function VerifyModal({ post, onClose, onVerified }: { post: PostPublic; onClose: () => void; onVerified: (password: string) => void }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!password) return toast.error(t("err_need_pw"));
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) throw new Error(t("err_verify"));
      if (!res.ok) throw new Error(t("err_update"));
      onVerified(password);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("err_verify"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={t("verify_title")} onClose={onClose}>
      <p className="mb-3 text-sm text-muted">{t("verify_desc")}</p>
      <input
        type="password"
        value={password}
        autoFocus
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("ph_password_only")}
        className="mb-4 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary/60"
      />
      <button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">
        {t("verify_submit")}
      </button>
    </Shell>
  );
}

/* ---------- 삭제 ---------- */
export function DeleteModal({ post, onClose, onDone }: { post: PostPublic; onClose: () => void; onDone: () => void }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!password) return toast.error(t("err_need_pw"));
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("err_delete"));
      toast.success(t("toast_deleted"));
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("err_delete"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={t("m_del_title")} onClose={onClose}>
      <p className="mb-3 text-sm text-muted">{t("m_del_desc")}</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("ph_password_only")}
        className="mb-4 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-danger/60"
      />
      <button onClick={submit} disabled={busy} className="w-full rounded-full bg-danger py-2.5 text-sm font-bold text-white disabled:opacity-50">
        {t("m_del_submit")}
      </button>
    </Shell>
  );
}

/* ---------- 이미지 카드 저장 ---------- */
export function CardModal({ post, onClose }: { post: PostPublic; onClose: () => void }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `celebus-fanvoice-${post.id.slice(0, 8)}.png`;
      a.click();
      toast.success(t("toast_img"));
    } catch {
      toast.error(t("err_img"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={t("m_card_title")} onClose={onClose}>
      <div className="flex justify-center">
        <div ref={ref} className="w-[320px] rounded-2xl p-6" style={{ background: "linear-gradient(155deg,#1c1c28 0%,#121212 60%,#241a33 100%)" }}>
          <div className="mb-4 flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/symbol.svg" alt="" className="h-5 w-5" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wordmark.svg" alt="CELEBUS" className="h-[13px] w-auto" />
            <span className="text-[13px] font-black italic text-white">FanVoice</span>
            <span className="ml-auto">
              <TargetBadge target={post.target} />
            </span>
          </div>
          <p className="text-[16px] font-black leading-snug text-white">{post.title}</p>
          <p className="mt-2 min-h-[64px] whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white/85">{post.body}</p>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-[13px] font-bold text-white/90">@{post.nickname}</span>
            <span className="text-[11px] text-white/50">{format(new Date(post.created_at), "yyyy.MM.dd")}</span>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">
        <Download className="h-4 w-4" /> {t("card_download")}
      </button>
    </Shell>
  );
}
