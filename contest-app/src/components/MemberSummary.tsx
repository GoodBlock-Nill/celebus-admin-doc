"use client";

// 멤버 반응 요약 — 업로더 본인만 보는 비공개·익명 집계(클라이언트 섬).
// 유저별 데이터(인증)라 SSR 캐시에 넣지 않고 마운트 후 조회한다. 0이면 아무것도 렌더하지 않음.
import { useEffect, useState } from "react";
import { SectionHeader } from "./HomeAtoms";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";

export default function MemberSummary() {
  const { t } = useLang();
  const { signedIn } = useSession();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!signedIn) {
      setTotal(0);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const mine = await fetch("/api/stage/mine").then((r) => r.json());
        const sum = ((mine.memberHearts ?? []) as { post_id: string; count: number }[]).reduce(
          (s, m) => s + (m.count ?? 0),
          0,
        );
        if (alive) setTotal(sum);
      } catch {
        if (alive) setTotal(0);
      }
    })();
    return () => {
      alive = false;
    };
  }, [signedIn]);

  if (total <= 0) return null;
  return (
    <div>
      <SectionHeader title={t("home_reaction_title")} sub={t("home_reaction_sub")} />
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-[18px]">💜</div>
        <strong className="min-w-0 flex-1 text-[13px] font-bold leading-snug text-fg break-keep">
          {total === 1 ? t("mh_private_one") : t("mh_private_many").replace("{n}", String(total))}
        </strong>
      </div>
    </div>
  );
}
