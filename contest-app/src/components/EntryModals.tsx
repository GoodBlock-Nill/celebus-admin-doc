"use client";

// 엔트리 수정/삭제/클레임 모달 — FanVoice 바텀시트 패턴
import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { AwardPublic, EntryPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-5 mb-4 flex items-center justify-between border-b border-border/40 bg-card px-5 pb-3 pt-5">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} aria-label={t("close")} className="-m-2 rounded-full p-2 text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const input = "w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary/60";

export function EditEntryModal({
  entry,
  onClose,
  onDone,
}: {
  entry: EntryPublic;
  onClose: () => void;
  onDone: (title: string, description: string) => void;
}) {
  const { t } = useLang();
  const [pw, setPw] = useState("");
  const [title, setTitle] = useState(entry.title);
  const [desc, setDesc] = useState(entry.description);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw, title: title.trim(), description: desc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("err_pw"));
      toast.success(t("confirm"));
      onDone(title.trim(), desc.trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("err_network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={t("edit")} onClose={onClose}>
      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t("sw_title_ph")} className={input} />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} rows={3} placeholder={t("sw_desc_ph")} className={input} />
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("pw_label")} className={input} />
        <button
          onClick={submit}
          disabled={busy || !pw || !title.trim()}
          className="w-full rounded-full bg-primary py-2.5 text-[14px] font-black text-white disabled:opacity-40"
        >
          {t("confirm")}
        </button>
      </div>
    </Sheet>
  );
}

export function DeleteEntryModal({
  entry,
  onClose,
  onDone,
}: {
  entry: EntryPublic;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useLang();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("err_pw"));
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("err_network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={t("delete")} onClose={onClose}>
      <p className="mb-3 text-sm text-muted">{t("delete_confirm")}</p>
      <input type="password" value={pw} autoFocus onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={t("pw_label")} className={input} />
      <button
        onClick={submit}
        disabled={busy || !pw}
        className="mt-4 w-full rounded-full bg-danger py-2.5 text-[14px] font-black text-white disabled:opacity-40"
      >
        {t("delete")}
      </button>
    </Sheet>
  );
}

export function ReportModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  return (
    <Sheet title={t("report")} onClose={onClose}>
      <p className="mb-4 text-sm leading-relaxed text-muted">{t("report_confirm")}</p>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 rounded-full border border-border bg-card py-2.5 text-[14px] font-bold text-muted">
          {t("cancel")}
        </button>
        <button onClick={onConfirm} className="flex-1 rounded-full bg-danger py-2.5 text-[14px] font-black text-white">
          {t("report")}
        </button>
      </div>
    </Sheet>
  );
}

export function ClaimModal({
  award,
  onClose,
  onDone,
}: {
  award: AwardPublic;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useLang();
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!agree) return toast.error(t("claim_agree"));
    setBusy(true);
    try {
      const res = await fetch(`/api/awards/${award.id}/claim`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw, name, email, phone, address, memo: memo || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("claim_already"));
      toast.success(t("claim_done"));
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("err_network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={`🏆 ${t("claim_title")}`} onClose={onClose}>
      <p className="mb-3 text-[13px] text-muted">{t("claim_desc")}</p>
      <div className="space-y-2.5">
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("pw_label")} className={input} />
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t("claim_name")} className={input} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} placeholder={t("claim_email")} className={input} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder={t("claim_phone")} className={input} />
        <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} placeholder={t("claim_address")} className={input} />
        <input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={200} placeholder={t("claim_memo")} className={input} />
        <label className="flex cursor-pointer items-start gap-2 pt-1 text-[12px] leading-snug text-muted">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[#8b5cf6]" />
          {t("claim_agree")}
        </label>
        <button
          onClick={submit}
          disabled={busy || !pw || !name || !email || !phone || !address}
          className="w-full rounded-full bg-primary hover:bg-primary-strong py-2.5 text-[14px] font-black text-white disabled:opacity-40"
        >
          {t("claim_submit")}
        </button>
      </div>
    </Sheet>
  );
}
