"use client";

// 글로벌 올리기 (Wave 9) — 하단 ＋에서 진입. 공연 선택 → (StageUploadModal) 링크·미리보기·카테고리·게시.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, CalendarDays } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { StagePublic } from "@/lib/types";
import StageUploadModal from "./StageUploadModal";
import { useLang } from "./LangProvider";

export default function GlobalUploadSheet({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const router = useRouter();
  const [stages, setStages] = useState<StagePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<StagePublic | null>(null);

  useEffect(() => {
    (async () => {
      // 공식 아카이브(is_official)는 열람 전용이라 업로드 대상에서 제외
      const { data } = await sb.from("stages_public").select("*").eq("status", "open").eq("is_official", false).order("sort_order").limit(30);
      setStages((data ?? []) as StagePublic[]);
      setLoading(false);
    })();
  }, []);

  // 2단계 — 선택한 공연으로 업로드 (링크·미리보기·카테고리·게시)
  if (picked) {
    return (
      <StageUploadModal
        stageId={picked.id}
        onBack={() => setPicked(null)}
        onClose={onClose}
        onPosted={() => {
          onClose();
          router.push(`/stage/${picked.id}`);
        }}
      />
    );
  }

  // 1단계 — 공연 선택
  return (
    <div className="anim-backdrop-in fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("upload_pick_title")}
        className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-fg">{t("upload_pick_title")}</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">{t("upload_pick_sub")}</p>
          </div>
          <button onClick={onClose} aria-label="닫기" className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card-2" />
            ))}
          </div>
        ) : stages.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border bg-card-2 px-4 py-10 text-center text-[13px] text-muted">{t("upload_no_open_stage")}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={() => setPicked(s)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left shadow-sm active:scale-[0.99]"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  {s.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-soft to-card-2" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[13.5px] font-bold text-fg">{s.title}</strong>
                  <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-subtle">
                    {s.event_date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> {s.event_date}
                      </span>
                    )}
                    <span>
                      영상 <span className="tabular-nums">{s.post_count}</span>개
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
