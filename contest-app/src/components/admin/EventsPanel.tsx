"use client";

// 관리자: 월드컵 이벤트 — 스테이지 단위 개최, 발표 시 3종 수상 자동 계산.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";

type EventRow = {
  id: string;
  stage_id: string;
  title: string;
  description: string;
  status: "open" | "announced" | "closed";
  ends_at: string | null;
  awards: { fan?: { title: string } | null; artist?: { title: string } | null; uploader?: { handle: string } | null } | null;
  created_at: string;
  stages: { title: string } | null;
};
type StageOpt = { id: string; title: string };

const STATUS_LABEL: Record<EventRow["status"], string> = { open: "진행중", announced: "발표됨", closed: "종료" };

export default function EventsPanel() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [stages, setStages] = useState<StageOpt[]>([]);
  const [form, setForm] = useState({ stage_id: "", title: "", description: "", ends_at: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [evRes, stRes] = await Promise.all([adminFetch("/api/admin/events"), adminFetch("/api/admin/stages")]);
    const ev = await evRes.json();
    const st = await stRes.json();
    setEvents(ev.events ?? []);
    setStages((st.stages ?? []).map((s: { id: string; title: string }) => ({ id: s.id, title: s.title })));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (busy || !form.stage_id || !form.title.trim()) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/events", {
      method: "POST",
      body: JSON.stringify({
        stage_id: form.stage_id,
        title: form.title.trim(),
        description: form.description.trim(),
        ends_at: form.ends_at ? new Date(form.ends_at + "T23:59:59+09:00").toISOString() : null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast("이벤트를 열었어요.");
      setForm({ stage_id: "", title: "", description: "", ends_at: "" });
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "생성 실패");
    }
  }

  async function setStatus(id: string, status: EventRow["status"], confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    const res = await adminFetch(`/api/admin/events/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (res.ok) {
      toast(status === "announced" ? "결과를 발표했어요. (3종 수상 자동 계산)" : "변경했어요.");
      void load();
    } else toast("변경 실패");
  }

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-fg/50">
        이벤트는 스테이지(공연) 단위로 열려요. 해당 스테이지의 공개 영상 전체가 자동 출전하고, <b>발표하기</b> 시 팬인기상·아티스트인기상·최다업로드상이 자동 계산돼요.
      </p>

      {/* 생성 폼 */}
      <div className="space-y-2 rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
        <select
          value={form.stage_id}
          onChange={(e) => setForm({ ...form, stage_id: e.target.value })}
          className="w-full rounded-xl bg-white/6 px-3 py-2.5 text-[13px] text-fg outline-none ring-1 ring-white/10"
        >
          <option value="">스테이지 선택</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#141217]">{s.title}</option>
          ))}
        </select>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={80} placeholder="이벤트명 (예: 부산 버스킹 모먼트 토너먼트)"
          className="w-full rounded-xl bg-white/6 px-3 py-2.5 text-[13px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/30" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} placeholder="소개 (선택)"
            className="w-full rounded-xl bg-white/6 px-3 py-2.5 text-[13px] text-fg outline-none ring-1 ring-white/10 placeholder:text-fg/30" />
          <input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className="w-full rounded-xl bg-white/6 px-3 py-2.5 text-[13px] text-fg outline-none ring-1 ring-white/10" />
        </div>
        <button onClick={create} disabled={busy || !form.stage_id || !form.title.trim()}
          className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-2.5 text-[13px] font-bold text-white disabled:opacity-40">
          <Plus className="h-4 w-4" /> 이벤트 열기
        </button>
      </div>

      {/* 목록 */}
      {events.map((e) => (
        <div key={e.id} className="rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-bold text-fg">{e.title}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  e.status === "open" ? "bg-primary/20 text-primary-400" : e.status === "announced" ? "bg-[#f5c451]/20 text-[#f5c451]" : "bg-white/8 text-fg/50"
                }`}>
                  {STATUS_LABEL[e.status]}
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-fg/45">
                {e.stages?.title ?? "?"} {e.ends_at ? `· ~${e.ends_at.slice(0, 10)}` : ""}
              </div>
              {e.status === "announced" && e.awards && (
                <div className="mt-1 text-[11.5px] text-fg/55">
                  🏆 팬: {e.awards.fan?.title ?? "-"} · 아티스트: {e.awards.artist?.title ?? "-"} · 업로드: @{e.awards.uploader?.handle ?? "-"}
                </div>
              )}
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {e.status === "open" && (
              <button
                onClick={() => void setStatus(e.id, "announced", "결과를 발표할까요? 발표 후에는 플레이가 중단되고 수상이 확정돼요.")}
                className="rounded-full bg-[#f5c451]/20 px-3 py-1.5 text-[12px] font-bold text-[#f5c451]"
              >
                발표하기
              </button>
            )}
            {e.status !== "closed" && (
              <button onClick={() => void setStatus(e.id, "closed", "이벤트를 종료(비노출)할까요?")} className="rounded-full bg-white/8 px-3 py-1.5 text-[12px] font-bold text-fg/70">
                종료
              </button>
            )}
            {e.status === "closed" && (
              <button onClick={() => void setStatus(e.id, "open")} className="rounded-full bg-white/8 px-3 py-1.5 text-[12px] font-bold text-fg/70">
                다시 열기
              </button>
            )}
          </div>
        </div>
      ))}
      {events.length === 0 && <p className="py-6 text-center text-[13px] text-fg/40">이벤트가 없어요.</p>}
    </div>
  );
}
