"use client";

import { useLang } from "./LangProvider";

// 로딩 실패 공용 화면 — 재시도 액션 포함
export default function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useLang();
  return (
    <div className="py-20 text-center">
      <p className="mb-4 text-sm text-muted">{t("err_network")}</p>
      <button
        onClick={onRetry ?? (() => location.reload())}
        className="rounded-full bg-primary px-5 py-2 text-[13px] font-bold text-white"
      >
        {t("retry")}
      </button>
    </div>
  );
}
