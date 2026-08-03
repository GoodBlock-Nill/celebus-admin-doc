"use client";

// 로그인 유도 모달 — 상호작용(하트·댓글·업로드·마이) 시도 시 미로그인 유저에게 노출.
// 열람은 로그인 없이 자유이므로 전면 게이트가 아니라 필요한 순간에만 뜨는 모달이다.
import { useState } from "react";
import { X, RefreshCw, ExternalLink } from "lucide-react";
import { ssoLogin } from "@/lib/sso-client";
import { useLang } from "./LangProvider";

const CELEBUS_APP_URL = process.env.NEXT_PUBLIC_CELEBUS_APP_URL || "https://app.celebus.xyz";

export default function LoginPrompt({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function retry() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const r = await ssoLogin();
    if (r.signed_in) {
      onDone();
      return;
    }
    setFailed(true);
    setBusy(false);
  }

  return (
    <div className="anim-backdrop-in fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("sso_gate_title")}
        className="w-full max-w-sm rounded-t-2xl bg-card ring-1 ring-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="CELEBUS MOMENT" loading="lazy" className="h-[18px] w-auto" />
          <button onClick={onClose} aria-label="닫기" className="flex h-11 w-11 items-center justify-center rounded-full text-subtle hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-[16px] font-bold text-fg break-keep">{t("sso_gate_title")}</div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted break-keep">{t("sso_gate_body")}</p>
        {failed && <p className="mt-2 text-[12px] font-bold text-danger break-keep">{t("sso_gate_failed")}</p>}

        <a
          href={CELEBUS_APP_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-3 text-[14px] font-bold text-white active:scale-[0.99]"
        >
          <ExternalLink className="h-4 w-4" /> {t("sso_gate_go")}
        </a>
        <button
          onClick={retry}
          disabled={busy}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-2 py-3 text-[13.5px] font-bold text-fg disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> {t("sso_gate_retry")}
        </button>
      </div>
    </div>
  );
}
