"use client";

// 홈 데이터 로드 실패 시 표시(서버 fetch 실패) — 클라이언트 섬. 재시도는 라우터 새로고침.
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLang } from "./LangProvider";

export default function HomeError() {
  const { t } = useLang();
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center">
      <p className="mb-4 text-[13.5px] text-muted">{t("home_err")}</p>
      <button
        onClick={() => router.refresh()}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-[13px] font-bold text-white active:scale-95"
      >
        <RefreshCw className="h-3.5 w-3.5" /> {t("home_retry")}
      </button>
    </div>
  );
}
