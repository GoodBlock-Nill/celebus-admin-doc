"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Flag, Pencil, Share2, ShieldCheck, Trash2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { sb } from "@/lib/supabase-browser";
import type { AwardPublic, ContestPublic, EntryPublic } from "@/lib/types";
import { canVote, canEditEntry } from "@/lib/contest-status";
import { getDateLocale } from "@/lib/i18n";
import Shell from "./Shell";
import EntryEmbed from "./EntryEmbed";
import VoteButton from "./VoteButton";
import PlatformBadge from "./PlatformBadge";
import ShareModal from "./ShareModal";
import { EditEntryModal, DeleteEntryModal, ClaimModal, ReportModal } from "./EntryModals";
import ErrorState from "./ErrorState";
import { useLang } from "./LangProvider";

type Modal = null | "share" | "edit" | "delete" | "claim" | "report";

function EntryBody({ id }: { id: string }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [entry, setEntry] = useState<EntryPublic | null>(null);
  const [contest, setContest] = useState<ContestPublic | null>(null);
  const [award, setAward] = useState<AwardPublic | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: e } = await sb.from("contest_entries_public").select("*").eq("id", id).maybeSingle();
      if (!e) {
        setLoading(false);
        return;
      }
      const en = e as EntryPublic;
      setEntry(en);
      const [{ data: c }, { data: aw }] = await Promise.all([
        sb.from("contests_public").select("*").eq("id", en.contest_id).maybeSingle(),
        sb.from("contest_awards_public").select("*").eq("entry_id", en.id).order("rank", { ascending: true }).limit(1),
      ]);
      setContest((c as ContestPublic) ?? null);
      setAward(((aw as AwardPublic[]) ?? [])[0] ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="h-96 animate-pulse rounded-3xl bg-card" />;
  if (!entry || !contest) {
    return <ErrorState />;
  }

  async function report() {
    try {
      const res = await fetch(`/api/entries/${id}/report`, { method: "POST" });
      if (res.ok) toast.success(t("reported"));
      else toast.error(t("err_network"));
    } catch {
      toast.error(t("err_network"));
    } finally {
      setModal(null);
    }
  }

  const votable = canVote(contest) && !entry.disqualified;

  return (
    <div className="space-y-4">
      <Link href={`/contest/${contest.slug}`} className="inline-flex items-center gap-1 text-[13px] font-bold text-muted hover:text-fg">
        <ChevronLeft className="h-4 w-4" /> {contest.title}
      </Link>

      {/* 수상 배너 */}
      {award && (
        <div className="flex items-center gap-3 rounded-[16px] bg-gold/10 p-3 ring-1 ring-gold/40">
          <Trophy className="h-6 w-6 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-gold">{award.award_name}</p>
            {award.prize && <p className="truncate text-[12px] text-muted">{award.prize}</p>}
          </div>
          {award.claim_status === "none" && (
            <button
              onClick={() => setModal("claim")}
              className="shrink-0 rounded-full bg-gold px-4 py-2 text-[12px] font-black text-black"
            >
              {t("claim_cta")}
            </button>
          )}
          {award.claim_status === "claimed" && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-muted">{t("claimed_badge")}</span>
          )}
          {award.claim_status === "shipped" && (
            <span className="rounded-full bg-verified/15 px-3 py-1 text-[11px] font-bold text-verified">{t("shipped_badge")}</span>
          )}
        </div>
      )}

      {/* 헤더 */}
      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <PlatformBadge platform={entry.platform} />
          {entry.disqualified && (
            <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-danger">{t("disqualified_badge")}</span>
          )}
        </div>
        <h1 className="text-xl font-black leading-snug">{entry.title}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-1 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1">
            @{entry.handle}
            {entry.handle_verified && (
              <span className="inline-flex items-center gap-0.5 text-verified" title={t("handle_verified")}>
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            )}
          </span>
          <span>· {format(new Date(entry.created_at), "PPP", { locale: getDateLocale(lang) })}</span>
          {entry.edited && <span>· {t("edited")}</span>}
        </p>
      </div>

      {/* 임베드 (상세에서만 실제 임베드) */}
      <EntryEmbed entry={entry} />

      {entry.description && (
        <p className="whitespace-pre-wrap rounded-[16px] bg-surface-1 p-4 text-[14px] leading-relaxed ring-1 ring-hairline">
          {entry.description}
        </p>
      )}

      {/* 액션 바 */}
      <div className="flex items-center gap-2">
        <VoteButton entryId={entry.id} count={entry.vote_count} canVote={votable} />
        <button
          onClick={() => setModal("share")}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-fg"
        >
          <Share2 className="h-4 w-4" /> {t("share")}
        </button>
        <div className="ml-auto flex items-center gap-1 text-muted">
          {canEditEntry(contest) && (
            <>
              <button onClick={() => setModal("edit")} aria-label={t("edit")} className="rounded-full p-2.5 hover:bg-white/5 hover:text-fg">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setModal("delete")} aria-label={t("delete")} className="rounded-full p-2.5 hover:bg-white/5 hover:text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button onClick={() => setModal("report")} aria-label={t("report")} className="rounded-full p-2.5 hover:bg-white/5 hover:text-danger">
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>

      {modal === "report" && <ReportModal onClose={() => setModal(null)} onConfirm={report} />}
      {modal === "share" && <ShareModal path={`/entry/${entry.id}`} label={entry.title} onClose={() => setModal(null)} />}
      {modal === "edit" && (
        <EditEntryModal
          entry={entry}
          onClose={() => setModal(null)}
          onDone={(title, description) => {
            setEntry({ ...entry, title, description, edited: true });
            setModal(null);
          }}
        />
      )}
      {modal === "delete" && (
        <DeleteEntryModal
          entry={entry}
          onClose={() => setModal(null)}
          onDone={() => router.push(`/contest/${contest.slug}`)}
        />
      )}
      {modal === "claim" && award && (
        <ClaimModal
          award={award}
          onClose={() => setModal(null)}
          onDone={() => {
            setAward({ ...award, claim_status: "claimed" });
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

export default function EntryView({ id }: { id: string }) {
  return (
    <Shell>
      <EntryBody id={id} />
    </Shell>
  );
}
