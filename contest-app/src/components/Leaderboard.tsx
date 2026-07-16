"use client";

// 시상대(Podium) + 4위↓ 미디어 갤러리 그리드. 순위변동은 MediaTile 배지로.
import { useEffect, useMemo } from "react";
import type { ContestPublic, EntryPublic } from "@/lib/types";
import { getRankSnapshot, saveRankSnapshot } from "@/lib/client-util";
import { canVote } from "@/lib/contest-status";
import { contestVisual } from "@/lib/contest-visual";
import Podium from "./Podium";
import MediaTile, { type RankDelta } from "./MediaTile";
import { useLang } from "./LangProvider";

export default function Leaderboard({
  contest,
  entries,
}: {
  contest: ContestPublic;
  entries: EntryPublic[]; // vote_count desc, created_at asc 정렬 전제
}) {
  const { t } = useLang();
  const votable = canVote(contest);
  const v = contestVisual(contest.contest_type);

  const deltas = useMemo<Record<string, RankDelta>>(() => {
    const prev = getRankSnapshot(contest.id);
    const map: Record<string, RankDelta> = {};
    entries.forEach((e, i) => {
      const now = i + 1;
      const before = prev[e.id];
      if (before === undefined) map[e.id] = Object.keys(prev).length ? "new" : null;
      else if (before > now) map[e.id] = "up";
      else if (before < now) map[e.id] = "down";
      else map[e.id] = null;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest.id, entries.map((e) => e.id).join(",")]);

  useEffect(() => {
    const ranks: Record<string, number> = {};
    entries.forEach((e, i) => (ranks[e.id] = i + 1));
    saveRankSnapshot(contest.id, ranks);
  }, [contest.id, entries]);

  if (!entries.length) {
    return (
      <p className="rounded-[16px] border border-dashed border-line py-10 text-center text-sm text-muted">
        {t("rank_empty")}
      </p>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const isMasonry = v.galleryClass === "masonry";

  return (
    <div className="space-y-5">
      <Podium entries={top3} contestType={contest.contest_type} canVote={votable} />

      {rest.length > 0 && (
        <div className={v.galleryClass}>
          {rest.map((e, i) => (
            <MediaTile
              key={e.id}
              entry={e}
              contestType={contest.contest_type}
              canVote={votable}
              rank={i + 4}
              rankDelta={deltas[e.id]}
              natural={isMasonry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
