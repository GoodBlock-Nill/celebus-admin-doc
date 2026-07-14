"use client";

// 출품작 관리: 필터 + 숨김/실격
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import type { ContestRow, EntryRow } from "@/lib/admin-types";
import { adminFetch } from "@/lib/admin-types";
import { PLATFORM_LABELS } from "@/lib/i18n";

const FILTERS = [
  { key: "", label: "전체" },
  { key: "reported", label: "신고 누적" },
  { key: "hidden", label: "숨김" },
  { key: "dq", label: "실격" },
];

export default function EntriesPanel({ contests }: { contests: ContestRow[] }) {
  const [contestId, setContestId] = useState("");
  const [filter, setFilter] = useState("");
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (contestId) params.set("contest_id", contestId);
    if (filter) params.set("filter", filter);
    const res = await adminFetch(`/api/admin/entries?${params}`);
    const data = await res.json();
    setEntries(data.entries ?? []);
  }, [contestId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(e: EntryRow, body: Record<string, unknown>, msg: string) {
    const res = await adminFetch(`/api/admin/entries/${e.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) return toast.error("처리 실패");
    toast.success(msg);
    void load();
  }

  async function disqualify(e: EntryRow) {
    const reason = prompt(`'@${e.handle} — ${e.title}' 실격 사유를 입력하세요 (공개되지 않음):`);
    if (reason === null) return;
    await patch(e, { disqualified: true, disqualify_reason: reason || null }, "실격 처리");
  }

  const shown = entries.filter(
    (e) => !q || e.title.includes(q) || e.handle.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={contestId} onChange={(e) => setContestId(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5 text-[12px]">
          <option value="">모든 콘테스트</option>
          {contests.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-[12px] font-bold ${filter === f.key ? "bg-fg text-bg" : "bg-card text-muted"}`}
          >
            {f.label}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="핸들·제목 검색" className="ml-auto rounded-lg border border-border bg-bg px-2 py-1.5 text-[12px] outline-none" />
      </div>

      <div className="grid gap-2.5 xl:grid-cols-2">
      {shown.map((e) => (
        <div key={e.id} className={`rounded-[16px] bg-surface-1 p-3 ring-1 ${e.hidden ? "opacity-70 ring-danger/40" : "ring-hairline"}`}>
          <div className="flex items-start gap-3">
            {e.oembed?.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.oembed.thumbnail_url} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                <span className="font-bold">{PLATFORM_LABELS[e.platform]}</span>
                <span>@{e.handle}</span>
                {!e.handle_verified && (
                  <span className="rounded bg-amber-500/20 px-1.5 font-bold text-amber-400">핸들 미인증</span>
                )}
                <span>· {e.vote_count}표</span>
                {e.report_count > 0 && <span className="font-bold text-danger">🚩 신고 {e.report_count}</span>}
                {e.hidden && <span className="rounded bg-danger/20 px-1.5 font-bold text-danger">숨김</span>}
                {e.disqualified && (
                  <span className="rounded bg-amber-500/20 px-1.5 font-bold text-amber-400">실격: {e.disqualify_reason ?? "-"}</span>
                )}
              </p>
              <p className="truncate text-[13.5px] font-bold">{e.title}</p>
              {(e.celebus_nickname || e.phone) && (
                <p className="mt-0.5 text-[11px] text-muted">
                  🔒 CELEBUS: {e.celebus_nickname ?? "-"} · {e.phone ?? "-"}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-fg/80">
                  원본 <ExternalLink className="h-3 w-3" />
                </a>
                <a href={`/entry/${e.id}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-fg/80">
                  공개 화면
                </a>
                <button onClick={() => patch(e, { hidden: !e.hidden }, e.hidden ? "숨김 해제" : "숨김 처리")} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-bold text-muted hover:text-fg">
                  {e.hidden ? "숨김 해제" : "숨김"}
                </button>
                {e.disqualified ? (
                  <button onClick={() => patch(e, { disqualified: false, disqualify_reason: null }, "실격 해제")} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-bold text-muted hover:text-fg">
                    실격 해제
                  </button>
                ) : (
                  <button onClick={() => disqualify(e)} className="rounded-full border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                    실격
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>
      {!shown.length && (
        <p className="rounded-[16px] border border-dashed border-line py-12 text-center text-[13px] text-muted">
          출품작이 없어요
        </p>
      )}
    </div>
  );
}
