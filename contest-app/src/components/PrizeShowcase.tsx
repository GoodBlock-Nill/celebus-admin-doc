"use client";

import { Trophy, Award } from "lucide-react";
import type { ContestPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

export default function PrizeShowcase({ contest }: { contest: ContestPublic }) {
  const { t } = useLang();
  if (!contest.prizes?.length) return null;

  return (
    <section>
      <h2 className="mb-3 text-[15px] font-black">🏆 {t("prizes_title")}</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {contest.prizes.map((p, i) => {
          const isPopular = p.award_type === "popular";
          return (
            <div key={i} className="flex items-center gap-3 rounded-[16px] bg-surface-1 p-3 ring-1 ring-hairline">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="h-14 w-14 shrink-0 rounded-[12px] object-cover ring-1 ring-hairline"
                />
              ) : (
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] ${
                    isPopular ? "bg-gold/12" : "bg-primary/12"
                  }`}
                >
                  {isPopular ? (
                    <Trophy className="h-6 w-6 text-gold" />
                  ) : (
                    <Award className="h-6 w-6 text-primary-400" />
                  )}
                </div>
              )}
              <div className="min-w-0">
                <p className={`text-[11px] font-black ${isPopular ? "text-gold" : "text-primary-400"}`}>
                  {p.rank_label}
                  {p.count > 1 ? ` · ${p.count}명` : ""}
                </p>
                <p className="truncate text-[14px] font-bold">{p.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
