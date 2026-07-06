"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Gift } from "lucide-react";
import type { PrizePublic } from "@/lib/types";
import { useLang } from "./LangProvider";

// 보상 수령 — 대상 글 비밀번호로 본인 확인 후 배송정보 제출
export default function ClaimModal({ prize, onClose, onDone }: { prize: PrizePublic; onClose: () => void; onDone: () => void }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!password) return toast.error(t("err_need_pw"));
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) return toast.error(t("err_claim"));
    setBusy(true);
    try {
      const res = await fetch(`/api/prizes/${prize.id}/claim`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), memo: memo.trim() || undefined }),
      });
      const data = await res.json();
      if (res.status === 401) throw new Error(t("err_verify"));
      if (!res.ok) throw new Error(data.error ?? t("err_claim"));
      toast.success(t("claim_done"));
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("err_claim"));
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary/60";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-base font-bold">
            <Gift className="h-4 w-4 text-primary-400" /> {t("claim_title")}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-3 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-sm">
          <span className="font-bold text-primary-400">{prize.prize}</span>
          <span className="ml-1 text-muted">· @{prize.nickname}</span>
        </div>

        <p className="mb-3 text-[13px] text-muted">{t("claim_verify_desc")}</p>
        <div className="grid gap-2">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("ph_password_only")} className={field} autoFocus />
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder={t("claim_name")} className={field} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value.slice(0, 120))} placeholder={t("claim_email")} className={field} />
          <input value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 30))} placeholder={t("claim_phone")} className={field} />
          <input value={address} onChange={(e) => setAddress(e.target.value.slice(0, 200))} placeholder={t("claim_address")} className={field} />
          <input value={memo} onChange={(e) => setMemo(e.target.value.slice(0, 200))} placeholder={t("claim_memo")} className={field} />
        </div>

        <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {t("claim_submit")}
        </button>
      </div>
    </div>
  );
}
