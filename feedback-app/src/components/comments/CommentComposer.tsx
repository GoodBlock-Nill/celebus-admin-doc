"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "../LangProvider";

export default function CommentComposer({ postId, onAdded }: { postId: string; onAdded: () => void }) {
  const { t } = useLang();
  const [body, setBody] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isOp, setIsOp] = useState(false);
  const [opPw, setOpPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (body.trim().length < 2) return toast.error(t("err_body"));
    if (nickname.trim().length < 1) return toast.error(t("err_nickname"));
    if (password.length < 4) return toast.error(t("err_password"));
    setBusy(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          nickname: nickname.trim(),
          password,
          body: body.trim(),
          op_password: isOp && opPw ? opPw : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("err_comment"));
      toast.success(t("toast_comment"));
      setBody("");
      setPassword("");
      setOpPw("");
      setIsOp(false);
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("err_comment"));
    } finally {
      setBusy(false);
    }
  }

  const inp = "rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-primary/50";

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-3">
      <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 500))} placeholder={t("comment_ph")} rows={2} className={`w-full resize-none ${inp}`} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 20))} placeholder={t("ph_nickname")} className={`${inp} w-32`} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value.slice(0, 64))} placeholder={t("ph_password_only")} className={`${inp} w-32`} />
        <label className="flex items-center gap-1 text-[12px] text-muted">
          <input type="checkbox" checked={isOp} onChange={(e) => setIsOp(e.target.checked)} className="accent-primary" /> {t("comment_op_toggle")}
        </label>
        {isOp && <input type="password" value={opPw} onChange={(e) => setOpPw(e.target.value.slice(0, 64))} placeholder={t("comment_op_ph")} className={`${inp} w-32`} />}
        <button onClick={submit} disabled={busy} className="ml-auto rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
          {t("comment_submit")}
        </button>
      </div>
    </div>
  );
}
