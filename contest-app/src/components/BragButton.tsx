"use client";

// 자랑 카드 — "멤버가 하트한 내 영상"을 이미지로 만들어 공유/저장 (바이럴 루프).
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Share2, Heart } from "lucide-react";
import type { MemberHeartPublic, StagePostPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

export default function BragButton({ post, hearts }: { post: StagePostPublic; hearts: MemberHeartPublic[] }) {
  const { t } = useLang();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const names = [...hearts].sort((a, b) => a.sort_order - b.sort_order).map((h) => h.display_name);

  async function share() {
    if (busy || !cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "fanstage-brag.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "fanstage-brag.png";
        a.click();
        toast(t("brag_saved"));
      }
    } catch {
      /* 사용자 취소 포함 — 조용히 */
    }
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={share}
        disabled={busy}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/8 py-2.5 text-[13px] font-bold text-primary-400 ring-1 ring-primary/30 disabled:opacity-50"
      >
        <Share2 className="h-4 w-4" /> {t("brag_share")}
      </button>

      {/* 캡처용 카드 (화면 밖 렌더) */}
      <div className="pointer-events-none fixed -left-[9999px] top-0">
        <div ref={cardRef} className="w-[360px] bg-[#141217] p-5" style={{ fontFamily: "inherit" }}>
          {post.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.thumbnail_url} alt="" crossOrigin="anonymous" className="aspect-video w-full rounded-xl object-cover" />
          )}
          <div className="mt-3 rounded-xl bg-primary/15 px-3 py-2.5 ring-1 ring-primary/40">
            <div className="flex items-center gap-1.5 text-[14px] font-bold text-primary-400">
              <Heart className="h-4 w-4 fill-current" />
              {names.length === 1
                ? t("mh_likes_one").replace("{name}", names[0])
                : t("mh_likes_many").replace("{name}", names[0]).replace("{n}", String(names.length - 1))}
            </div>
          </div>
          <div className="mt-2.5 truncate text-[15px] font-bold text-white">{post.title}</div>
          <div className="text-[12px] text-white/50">@{post.handle}</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[12px] font-black tracking-tight text-white/80">CELEBUS FanStage</span>
            <span className="text-[11px] text-white/40">💜</span>
          </div>
        </div>
      </div>
    </>
  );
}
