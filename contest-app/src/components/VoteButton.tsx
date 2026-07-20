"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { getDeviceId, getVoted, addVoted } from "@/lib/client-util";
import { useLang } from "./LangProvider";

export default function VoteButton({
  entryId,
  count,
  canVote,
  size = "md",
  onVoted,
}: {
  entryId: string;
  count: number;
  canVote: boolean;
  size?: "sm" | "md";
  onVoted?: (newCount: number) => void;
}) {
  const { t } = useLang();
  const [voteCount, setVoteCount] = useState(count);
  const [voted, setVoted] = useState(() => getVoted().has(entryId));
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);

  async function vote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (voted) return toast.info(t("vote_dup"));
    if (!canVote) return toast.error(t("vote_closed"));
    if (busy) return;
    setBusy(true);

    // 낙관적 업데이트
    setVoted(true);
    setVoteCount((v) => v + 1);
    setBurst(true);
    setTimeout(() => setBurst(false), 600);

    try {
      const res = await fetch(`/api/entries/${entryId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voter: getDeviceId() }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        addVoted(entryId);
        if (typeof data.vote_count === "number") {
          setVoteCount(data.vote_count);
          onVoted?.(data.vote_count);
        }
        return;
      }
      // 롤백
      setVoted(data.status === "dup");
      setVoteCount((v) => v - 1);
      if (data.status === "dup") {
        addVoted(entryId);
        toast.info(t("vote_dup"));
      } else if (data.status === "limit") toast.error(t("vote_limit"));
      else if (data.status === "closed") toast.error(t("vote_closed"));
      else toast.error(t("vote_blocked"));
    } catch {
      setVoted(false);
      setVoteCount((v) => v - 1);
      toast.error(t("err_network"));
    } finally {
      setBusy(false);
    }
  }

  const base =
    size === "sm"
      ? "gap-1 rounded-full px-3 py-2 text-[12px]"
      : "gap-1.5 rounded-full px-4 py-2.5 text-sm";

  return (
    <button
      onClick={vote}
      aria-label={t("vote_cta")}
      className={`inline-flex items-center font-bold transition-all active:scale-90 ${base} ${
        voted
          ? "bg-primary/20 text-primary-400 ring-1 ring-primary/40"
          : "bg-primary text-white hover:bg-primary-strong"
      } ${burst ? "scale-110" : ""}`}
    >
      <Heart
        className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} ${voted ? "fill-primary-400" : "fill-white"}`}
      />
      {voteCount.toLocaleString()}
    </button>
  );
}
