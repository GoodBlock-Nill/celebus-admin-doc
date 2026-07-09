"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { CommentPublic } from "@/lib/types";
import { useLang } from "../LangProvider";

export default function CommentDeleteModal({ comment, onClose, onDone }: { comment: CommentPublic; onClose: () => void; onDone: () => void }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!password) return toast.error(t("err_need_pw"));
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("err_verify"));
      toast.success(t("toast_deleted"));
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("err_verify"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">{t("comment_del_title")}</h3>
          <button onClick={onClose} className="text-muted hover:text-fg"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-3 text-sm text-muted">{t("m_del_desc")}</p>
        <input
          type="password"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("ph_password_only")}
          className="mb-4 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-danger/60"
        />
        <button onClick={submit} disabled={busy} className="w-full rounded-full bg-danger py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {t("m_del_submit")}
        </button>
      </div>
    </div>
  );
}
