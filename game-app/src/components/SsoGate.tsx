"use client";

// CELEBUS 미로그인 게이트 — 본앱 세션이 없으면 게임 이용 불가.
// 본앱에서 로그인 후 이 화면의 [다시 확인]으로 재시도한다(자체 가입/로그인 폐기).
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ssoLogin, markLocalSession } from "@/lib/auth-api";
import { setNick, setAvatar } from "@/lib/game-api";
import { GAME_CONFIG } from "@/lib/game-config";
import BetaBadge from "./BetaBadge";
import { useLang } from "./LangProvider";

export default function SsoGate({ onDone }: { onDone: () => void }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<"" | "no_session" | "bridge_fail">("");

  const retry = async () => {
    if (busy) return;
    setBusy(true);
    setFailed("");
    const p = await ssoLogin();
    if (p.signed_up && p.nickname) {
      setNick(p.nickname);
      if (p.avatar) setAvatar(p.avatar);
      markLocalSession(true);
      onDone();
      return;
    }
    // bridge = 본앱 로그인 확인됐으나 게임 세션 발급 실패 → 운영 확인용 기록(상태코드만)
    if (p.bridge) {
      void fetch("/api/auth/sso-diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direct_status: 200, sso_status: 500 }),
      }).catch(() => {});
    }
    setFailed(p.bridge ? "bridge_fail" : "no_session");
    setBusy(false);
  };

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="stage-bg h-full w-full" />
      </div>

      <div className="relative">
        {GAME_CONFIG.home.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={GAME_CONFIG.home.logo} alt="CELEB MATCH" className="anim-logo-float w-[190px]" />
        ) : (
          <div className="logo-puffy font-display text-[34px] font-black">CELEB MATCH</div>
        )}
        <BetaBadge className="absolute -right-3 top-1" />
      </div>

      <div className="mt-8 w-full rounded-[20px] bg-black/45 p-5 ring-1 ring-white/15 backdrop-blur">
        <div className="text-[16px] font-black text-white break-keep">{t("sso_gate_title")}</div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-white/70 break-keep">{t("sso_gate_body")}</p>
        <button
          onClick={() => void retry()}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[14px] font-black text-white active:scale-[0.99] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "anim-spin-slow" : ""}`} />
          {busy ? t("sso_checking") : t("sso_retry")}
        </button>
        {failed === "no_session" && (
          <p className="mt-2.5 text-[11.5px] font-bold text-danger break-keep">{t("sso_still_no_session")}</p>
        )}
        {failed === "bridge_fail" && (
          <p className="mt-2.5 text-[11.5px] font-bold text-gold break-keep">{t("sso_bridge_fail")}</p>
        )}
      </div>

      <p className="mt-4 text-[11px] text-white/40 break-keep">{t("sso_gate_hint")}</p>
    </div>
  );
}
