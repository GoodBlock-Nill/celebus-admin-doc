"use client";

// 배포초기 프리뷰 토글 (dev 전용) — 오픈 첫날(공식만) ↔ 전체 데이터 전환. 프로덕션에선 렌더 안 됨.
import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { isLaunchPreview, toggleLaunchPreview } from "@/lib/launchPreview";

export default function LaunchPreviewToggle() {
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState(true);

  useEffect(() => {
    setMounted(true);
    setOn(isLaunchPreview());
  }, []);

  if (process.env.NODE_ENV === "production" || !mounted) return null;

  return (
    <button
      onClick={() => {
        toggleLaunchPreview();
        window.location.reload();
      }}
      title="배포초기(공식만) 프리뷰 토글 — dev 전용"
      className="fixed bottom-24 left-3 z-40 flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 text-[11px] font-bold text-fg shadow-lg backdrop-blur active:scale-95"
    >
      <Rocket className={`h-3.5 w-3.5 ${on ? "text-primary" : "text-subtle"}`} />
      {on ? "오픈 첫날" : "전체 데이터"}
    </button>
  );
}
