"use client";

// 관리자: 모먼트 토너먼트 — 아카이브 단위 개최, 발표 시 3종 수상 자동 계산.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import ImageUploader from "./ImageUploader";
import { Badge, Btn, Card, Empty, Label, inputCls, useConfirm } from "./ui";

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
type StageOpt = { id: string; title: string; is_official: boolean };

// 공식 카테고리 라벨 (스코프 선택용)
const OFFICIAL_CATS: { v: string; l: string }[] = [
  { v: "v1de0", l: "V1DE0" },
  { v: "album01", l: "1st Mini Album [01]" },
  { v: "oncam", l: "ON CAM" },
  { v: "log", l: "LOG" },
  { v: "azit", l: "AZIT" },
  { v: "stud10", l: "STUD10" },
  { v: "outv", l: "OUT THE V01D" },
  { v: "shorts", l: "Shorts" },
];

const STATUS_LABEL: Record<EventRow["status"], string> = { open: "진행중", announced: "발표됨", closed: "종료" };
const STATUS_TONE: Record<EventRow["status"], "green" | "amber" | "gray"> = { open: "green", announced: "amber", closed: "gray" };

export default function EventsPanel() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [stages, setStages] = useState<StageOpt[]>([]);
  const [form, setForm] = useState({ stage_id: "", title: "", description: "", ends_at: "", reward_type: "popularity" as "reward" | "popularity", reward: "", category: "", cover_url: "" });
  const [busy, setBusy] = useState(false);
  const { confirm, confirmEl } = useConfirm();

  const load = useCallback(async () => {
    const [evRes, stRes] = await Promise.all([adminFetch("/api/admin/events"), adminFetch("/api/admin/stages")]);
    const ev = await evRes.json();
    const st = await stRes.json();
    setEvents(ev.events ?? []);
    setStages((st.stages ?? []).map((s: { id: string; title: string; is_official?: boolean }) => ({ id: s.id, title: s.title, is_official: Boolean(s.is_official) })));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const selectedOfficial = stages.find((s) => s.id === form.stage_id)?.is_official ?? false;

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
        reward_type: form.reward_type,
        reward: form.reward_type === "reward" ? form.reward.trim() : "",
        category: form.category || null,
        cover_url: form.cover_url || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("토너먼트를 열었어요.");
      setForm({ stage_id: "", title: "", description: "", ends_at: "", reward_type: "popularity", reward: "", category: "", cover_url: "" });
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "생성 실패");
    }
  }

  async function setStatus(id: string, status: EventRow["status"]) {
    const res = await adminFetch(`/api/admin/events/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (res.ok) {
      toast.success(status === "announced" ? "결과를 발표했어요. (3종 수상 자동 계산)" : "변경했어요.");
      void load();
    } else {
      toast.error("변경 실패");
    }
  }

  async function announce(id: string) {
    if (!(await confirm({ title: "결과 발표", body: "발표 후에는 플레이가 중단되고 수상이 확정돼요.", confirmLabel: "발표하기" }))) return;
    void setStatus(id, "announced");
  }

  async function close(id: string) {
    if (!(await confirm({ title: "토너먼트 종료", body: "종료하면 목록에서 비노출돼요.", confirmLabel: "종료", danger: true }))) return;
    void setStatus(id, "closed");
  }

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-muted">
        토너먼트는 아카이브 단위로 열려요. 해당 아카이브의 공개 영상 전체가 자동 출전하고, <b className="text-fg">발표하기</b> 시 팬인기상·아티스트인기상·최다업로드상이 자동 계산돼요.
      </p>

      {/* 생성 폼 */}
      <Card className="space-y-4 p-4">
        <div>
          <Label>아카이브 선택</Label>
          <select
            value={form.stage_id}
            onChange={(e) => setForm({ ...form, stage_id: e.target.value, category: "" })}
            className={inputCls}
          >
            <option value="">아카이브 선택</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.title}{s.is_official ? " (공식영상)" : " (팬영상)"}</option>
            ))}
          </select>
        </div>

        {/* 공식 아카이브 선택 시 — 카테고리 스코프(전체 또는 특정 카테고리) */}
        {selectedOfficial && (
          <div>
            <Label>대상 범위 <span className="font-medium text-subtle">(공식영상 카테고리)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {[{ v: "", l: "전체" }, ...OFFICIAL_CATS].map((c) => (
                <button
                  key={c.v || "all"}
                  type="button"
                  onClick={() => setForm({ ...form, category: c.v })}
                  className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition-colors ${form.category === c.v ? "border-primary bg-primary text-white" : "border-border bg-card text-muted hover:bg-surface-2"}`}
                >
                  {c.l}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>토너먼트명</Label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={80}
            placeholder="토너먼트명 (예: 부산 버스킹 모먼트 토너먼트)"
            className={inputCls}
          />
        </div>

        <div>
          <Label>소개 <span className="font-medium text-subtle">(선택)</span></Label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={500}
            placeholder="소개 (선택)"
            className={inputCls}
          />
        </div>

        <div>
          <Label>종료일 <span className="font-medium text-subtle">(선택)</span></Label>
          <input
            type="date"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className={inputCls}
          />
        </div>

        {/* 대표 커버 — 없으면 앱에서 참가작 콜라주로 대체 */}
        <div>
          <Label>대표 커버 <span className="font-medium text-subtle">(선택 · 미지정 시 참가작 콜라주)</span></Label>
          <ImageUploader value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} folder="cover" label="커버 업로드" />
        </div>

        {/* 토너먼트 유형 — 인기투표형 / 보상형 */}
        <div>
          <Label>토너먼트 유형</Label>
          <div className="flex gap-2">
            {([
              { v: "popularity", l: "인기투표형", d: "보상 없이 순위만" },
              { v: "reward", l: "보상형", d: "우승 보상 있음" },
            ] as const).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setForm({ ...form, reward_type: o.v })}
                className={`flex-1 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${form.reward_type === o.v ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-surface-2"}`}
              >
                <div className={`text-[13px] font-bold ${form.reward_type === o.v ? "text-primary-strong" : "text-fg"}`}>{o.l}</div>
                <div className="text-[11px] text-subtle">{o.d}</div>
              </button>
            ))}
          </div>
        </div>

        {form.reward_type === "reward" && (
          <div>
            <Label>보상 내용</Label>
            <input
              value={form.reward}
              onChange={(e) => setForm({ ...form, reward: e.target.value })}
              maxLength={200}
              placeholder="보상 내용 (예: 우승 업로더에게 V01D 응원봉 + 공식 SNS 소개)"
              className={inputCls}
            />
          </div>
        )}

        <Btn variant="primary" className="w-full py-3" disabled={busy || !form.stage_id || !form.title.trim()} onClick={create}>
          <Plus className="h-4 w-4" /> 토너먼트 열기
        </Btn>
      </Card>

      {/* 목록 */}
      <div className="space-y-2">
        {events.map((e) => (
          <Card key={e.id} className="p-3.5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-bold text-fg">{e.title}</span>
                  <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                </div>
                <div className="mt-0.5 text-[11.5px] text-subtle">
                  {e.stages?.title ?? "?"} {e.ends_at ? `· ~${e.ends_at.slice(0, 10)}` : ""}
                </div>
                {e.status === "announced" && e.awards && (
                  <div className="mt-1 text-[11.5px] text-muted">
                    🏆 팬: {e.awards.fan?.title ?? "-"} · 아티스트: {e.awards.artist?.title ?? "-"} · 업로드: @{e.awards.uploader?.handle ?? "-"}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {e.status === "open" && (
                <Btn size="sm" variant="primary" onClick={() => void announce(e.id)}>발표하기</Btn>
              )}
              {e.status !== "closed" && (
                <Btn size="sm" variant="danger" onClick={() => void close(e.id)}>종료</Btn>
              )}
              {e.status === "closed" && (
                <Btn size="sm" variant="outline" onClick={() => void setStatus(e.id, "open")}>다시 열기</Btn>
              )}
            </div>
          </Card>
        ))}
        {events.length === 0 && <Empty>토너먼트가 없어요.</Empty>}
      </div>
      {confirmEl}
    </div>
  );
}
